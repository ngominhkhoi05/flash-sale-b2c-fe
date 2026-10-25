/**
 * Test cho OrderDetailClient (RED → GREEN).
 *
 * Mock:
 *   - useOrderPayment (TanStack Query + WS + polling)
 *   - PaymentZaloPayPanel (replace bằng stub DOM dễ assert)
 *   - next-intl useTranslations
 *
 * Test:
 *   1. Loading state → render skeleton
 *   2. Error state → render error UI
 *   3. Empty (data undefined sau load) → render "not found"
 *   4. Có data → render panel + order code
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockOrder = {
  id: ORDER_ID,
  orderCode: ORDER_CODE,
  status: "PENDING_PAYMENT",
  paymentStatus: "PENDING",
  paymentMethod: "ZALOPAY",
  totalAmount: 150000,
  subtotalAmount: 150000,
  shippingFee: 0,
  discountAmount: 0,
  createdAt: "2026-10-16T10:30:00.000Z",
  items: [
    {
      id: 1,
      productName: "Áo thun Vibe",
      variantName: "Size L",
      imageUrl: "https://example.com/img.jpg",
      price: 150000,
      quantity: 1,
      totalAmount: 150000,
    },
  ],
  store: {
    id: 1,
    storeName: "Vibe Store",
    avatarUrl: null,
  },
  shippingAddress: {
    recipientName: "Nguyen Van A",
    phone: "0901234567",
    street: "123 Le Loi",
    ward: "Ben Nghe",
    district: "Quan 1",
    province: "TP HCM",
  },
};

// Mock useOrderById & useCancelOrder
const mockUseOrderById = vi.fn();
const mockUseCancelOrder = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
vi.mock("@/features/orders/hooks", () => ({
  useOrderById: (...args: unknown[]) => mockUseOrderById(...args),
  useCancelOrder: (...args: unknown[]) => mockUseCancelOrder(...args),
}));

// Mock useOrderPayment
const mockUseOrderPayment = vi.fn();
vi.mock("@/features/checkout", () => ({
  useOrderPayment: (...args: unknown[]) => mockUseOrderPayment(...args),
}));

// Mock PaymentZaloPayPanel — render div có data-testid để dễ assert
vi.mock("@/features/checkout/components/PaymentZaloPayPanel", () => ({
  PaymentZaloPayPanel: (props: {
    orderId: number;
    orderCode: string;
  }) => (
    <div
      data-testid="payment-panel"
      data-order-id={props.orderId}
      data-order-code={props.orderCode}
    />
  ),
}));

// Mock next-intl (plain function — useTranslations dùng i18n key trực tiếp)
vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, params?: Record<string, string | number>) => {
      if (params && key === "detail.orderCode") {
        return `Mã đơn: ${params.code ?? ""}`;
      }
      return key;
    },
}));

// Import sau mocks
import { OrderDetailClient } from "./OrderDetailClient";

beforeEach(() => {
  mockUseOrderPayment.mockReset();
  mockUseOrderById.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("OrderDetailClient — loading state", () => {
  it("render skeleton khi useOrderPayment đang loading", () => {
    mockUseOrderById.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    mockUseOrderPayment.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail-loading")).toBeInTheDocument();
  });
});

describe("OrderDetailClient — error state", () => {
  it("render error UI khi useOrderPayment trả error", () => {
    mockUseOrderById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network failed"),
    });
    mockUseOrderPayment.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network failed"),
    });

    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail-error")).toBeInTheDocument();
    expect(screen.getByText("Network failed")).toBeInTheDocument();
  });
});

describe("OrderDetailClient — empty state", () => {
  it("render 'not found' khi không có data và không lỗi", () => {
    mockUseOrderById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseOrderPayment.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail-error")).toBeInTheDocument();
  });
});

describe("OrderDetailClient — success state", () => {
  beforeEach(() => {
    mockUseOrderById.mockReturnValue({
      data: mockOrder,
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseOrderPayment.mockReturnValue({
      data: PENDING_PAYMENT,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("render panel khi bấm Thanh toán ngay", () => {
    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail")).toBeInTheDocument();

    const payButton = screen.getByText("Thanh toán ngay");
    fireEvent.click(payButton);

    const panel = screen.getByTestId("payment-panel");
    expect(panel).toBeInTheDocument();
    expect(panel.getAttribute("data-order-id")).toBe(String(ORDER_ID));
    expect(panel.getAttribute("data-order-code")).toBe(ORDER_CODE);
  });

  it("hiển thị order code trong header", () => {
    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getAllByText(new RegExp(ORDER_CODE)).length).toBeGreaterThan(0);
  });
});
