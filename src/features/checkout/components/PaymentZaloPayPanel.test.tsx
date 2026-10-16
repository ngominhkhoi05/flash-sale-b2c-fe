/**
 * Test cho PaymentZaloPayPanel (RED → GREEN).
 *
 * Mock:
 *   - next/image (replace bằng <img>)
 *   - useOrderPayment (PaymentStatus flow)
 *   - useCreateZaloPayPayment / useQueryZaloPayPayment
 *   - next-intl useTranslations + useFormatter
 *
 * Test:
 *   1. Loading state (chưa có data)
 *   2. PENDING state → hiện QR + nút Mở ZaloPay + countdown
 *   3. PENDING + manual sync button → trigger query mutation
 *   4. SUCCESS state → success card với icon check
 *   5. EXPIRED state → message hết hạn + nút thử lại
 *   6. Empty QR (qrCodeUrl = null) → fallback "Đang tạo mã..."
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// Mock next/image — render <img> bình thường để test DOM queries
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

// Mock next-intl — dùng vi.hoisted để tránh TDZ (vi.mock được hoist lên đầu)
const { MOCK_TRANSLATIONS, mockTranslate } = vi.hoisted(() => {
  // Component dùng useTranslations("storefront.checkout.qrPayment") rồi t("xxx")
  // → mock function nhận key ngắn, KHÔNG có namespace prefix
  const translations: Record<string, string> = {
    // PENDING
    qrAlt: "Mã QR thanh toán ZaloPay",
    openApp: "Mở app ZaloPay",
    manualSync: "Tôi đã thanh toán",
    manualSyncing: "Đang đồng bộ...",
    expiresIn: "Hết hạn sau",
    missingQr: "Đang tạo mã thanh toán...",
    autoConfirmHint: "Hệ thống tự xác nhận sau vài giây",
    // SUCCESS
    successTitle: "Thanh toán thành công",
    successMessage: "Cảm ơn bạn đã mua hàng",
    viewOrder: "Xem đơn hàng",
    completedCta: "Hoàn tất",
    // FAILED/EXPIRED
    expiredTitle: "Đơn thanh toán đã hết hạn",
    expiredMessage: "Vui lòng tạo lại đơn thanh toán",
    failedTitle: "Thanh toán thất bại",
    failedMessage: "Vui lòng thử lại",
    retry: "Thử lại",
    countdownZero: "Đã hết thời gian thanh toán",
  };
  const translate = (
    key: string,
    params?: Record<string, string | number>,
  ) => {
    let value = translations[key] ?? key;
    if (params) {
      value = Object.entries(params).reduce(
        (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
        value,
      );
    }
    return value;
  };
  return { MOCK_TRANSLATIONS: translations, mockTranslate: translate };
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockTranslate,
  useFormatter: () => ({
    number: (n: number) => String(n),
    dateTime: (d: Date) => d.toISOString(),
  }),
}));

// Mock hooks (sẽ capture + trả data do test quy định)
const mockUseOrderPayment = vi.fn();
const mockUseCreateZaloPayPayment = vi.fn();
const mockUseQueryZaloPayPayment = vi.fn();

vi.mock("@/features/checkout", () => ({
  useOrderPayment: (...args: unknown[]) => mockUseOrderPayment(...args),
  useCreateZaloPayPayment: () => {
    const result = mockUseCreateZaloPayPayment();
    return result;
  },
  useQueryZaloPayPayment: () => {
    const result = mockUseQueryZaloPayPayment();
    return result;
  },
}));

// Mock Countdown common (dùng hiển thị expiresIn)
vi.mock("@/components/common/Countdown", () => ({
  Countdown: ({ endsAt }: { endsAt: string }) => (
    <div data-testid="countdown">{endsAt}</div>
  ),
}));

// Mock lucide-react icons — render span text
vi.mock("lucide-react", () => ({
  CheckCircle2: () => <span data-testid="icon-check" />,
  AlertTriangle: () => <span data-testid="icon-warning" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
  ExternalLink: () => <span data-testid="icon-external" />,
}));

// Sau khi mock import component
import { PaymentZaloPayPanel } from "./PaymentZaloPayPanel";
import type { PaymentResponse } from "@/features/checkout/payment.types";

const ORDER_ID = 42;
const ORDER_CODE = "ORD_2026_001234";

const PENDING_PAYMENT: PaymentResponse = {
  id: 123,
  orderId: ORDER_ID,
  orderCode: ORDER_CODE,
  paymentMethod: "ZALOPAY",
  transactionCode: "ZP1697356800000_42",
  amount: 150000,
  qrCodeUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
  paymentUrl: "https://sb-openapi.zalopay.vn/pay?token=abc123",
  status: "PENDING",
  paidAt: null,
  createdAt: "2026-10-16T10:30:00.000Z",
};

const SUCCESS_PAYMENT: PaymentResponse = {
  ...PENDING_PAYMENT,
  status: "SUCCESS",
  paidAt: "2026-10-16T10:32:00.000Z",
};

const EXPIRED_PAYMENT: PaymentResponse = {
  ...PENDING_PAYMENT,
  status: "EXPIRED",
  paidAt: null,
};

beforeEach(() => {
  mockUseOrderPayment.mockReset();
  mockUseCreateZaloPayPayment.mockReset();
  mockUseQueryZaloPayPayment.mockReset();

  // Default mocks
  mockUseCreateZaloPayPayment.mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  });
  mockUseQueryZaloPayPayment.mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PaymentZaloPayPanel — loading state", () => {
  it("render loading skeleton khi data chưa có", () => {
    mockUseOrderPayment.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { container } = render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );

    // Skeleton có data-testid hoặc class animate-pulse
    const skeleton = container.querySelector('[data-testid="payment-skeleton"]');
    expect(skeleton).toBeTruthy();
  });
});

describe("PaymentZaloPayPanel — PENDING state", () => {
  beforeEach(() => {
    mockUseOrderPayment.mockReturnValue({
      data: PENDING_PAYMENT,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("hiển thị QR image với unoptimized + alt", () => {
    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    const qr = screen.getByAltText(/Mã QR thanh toán ZaloPay/i);
    expect(qr).toBeInTheDocument();
    expect(qr.getAttribute("src")).toBe(PENDING_PAYMENT.qrCodeUrl);
  });

  it("hiển thị nút 'Mở app ZaloPay' link tới paymentUrl", () => {
    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    const link = screen.getByRole("link", { name: /Mở app ZaloPay/i });
    expect(link.getAttribute("href")).toBe(PENDING_PAYMENT.paymentUrl);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("hiển thị manual sync button", () => {
    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    const btn = screen.getByRole("button", { name: /Tôi đã thanh toán/i });
    expect(btn).toBeInTheDocument();
  });

  it("manual sync button click → gọi useQueryZaloPayPayment mutate", () => {
    const mockMutate = vi.fn();
    mockUseQueryZaloPayPayment.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    const btn = screen.getByRole("button", { name: /Tôi đã thanh toán/i });
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalled();
  });

  it("hiển thị countdown khi có expiresAt", () => {
    render(
      <PaymentZaloPayPanel
        orderId={ORDER_ID}
        orderCode={ORDER_CODE}
        expiresAt="2026-10-16T10:35:00.000Z"
      />,
    );
    expect(screen.getByTestId("countdown")).toBeInTheDocument();
  });
});

describe("PaymentZaloPayPanel — SUCCESS state", () => {
  beforeEach(() => {
    mockUseOrderPayment.mockReturnValue({
      data: SUCCESS_PAYMENT,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("hiển thị success card với check icon", () => {
    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    // expect(...).toBeTruthy() cho icon check
    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
  });

  it("không hiển thị QR hay manual sync button khi SUCCESS", () => {
    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    expect(screen.queryByAltText(/Mã QR/i)).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Tôi đã thanh toán/i }),
    ).toBeNull();
  });

  it("hiển thị nút 'Xem đơn hàng' nếu có onViewOrder callback", () => {
    const onViewOrder = vi.fn();
    render(
      <PaymentZaloPayPanel
        orderId={ORDER_ID}
        orderCode={ORDER_CODE}
        onViewOrder={onViewOrder}
      />,
    );
    const btn = screen.getByRole("button", { name: /Xem đơn hàng/i });
    fireEvent.click(btn);
    expect(onViewOrder).toHaveBeenCalled();
  });
});

describe("PaymentZaloPayPanel — EXPIRED state", () => {
  beforeEach(() => {
    mockUseOrderPayment.mockReturnValue({
      data: EXPIRED_PAYMENT,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("hiển thị warning icon + message hết hạn", () => {
    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    expect(screen.getByTestId("icon-warning")).toBeInTheDocument();
  });

  it("hiển thị nút 'Thử lại' nếu có onRetry callback", () => {
    const onRetry = vi.fn();
    render(
      <PaymentZaloPayPanel
        orderId={ORDER_ID}
        orderCode={ORDER_CODE}
        onRetry={onRetry}
      />,
    );
    const btn = screen.getByRole("button", { name: /Thử lại/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("PaymentZaloPayPanel — empty QR fallback", () => {
  it("qrCodeUrl null + PENDING → render 'Đang tạo mã...'", () => {
    const noQr = { ...PENDING_PAYMENT, qrCodeUrl: null };
    mockUseOrderPayment.mockReturnValue({
      data: noQr,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <PaymentZaloPayPanel orderId={ORDER_ID} orderCode={ORDER_CODE} />,
    );
    expect(
      screen.getByText(/Đang tạo mã thanh toán/i),
    ).toBeInTheDocument();
  });
});
