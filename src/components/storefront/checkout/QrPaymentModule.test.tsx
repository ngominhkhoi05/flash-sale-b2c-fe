/**
 * Tests for QrPaymentModule (RED → GREEN).
 *
 * Covers:
 *  - renders QR image from qrCodeUrl
 *  - countdown shows mm:ss derived from expiresAt
 *  - countdown ticks every second
 *  - copy-to-clipboard writes the order code
 *  - "Tôi đã hoàn tất" button invokes onComplete
 *  - expired state when expiresAt is in the past
 *  - renders 3 steps instruction with interpolated amount
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QrPaymentModule } from "./QrPaymentModule";
import type { QrOrderDetail } from "@/features/checkout";

// Mock next-intl: cung cấp .rich() trả về React node chứa chuỗi đã
// interpolate, để test có thể tìm text qua getByText.
function interpolate(str: string, values?: Record<string, unknown>): string {
  if (!values) return str;
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    str,
  );
}

vi.mock("next-intl", () => {
  const map: Record<string, string> = {
    "storefront.checkout.qrPayment.title": "Quét mã để thanh toán",
    "storefront.checkout.qrPayment.zaloPayBadge": "ZaloPay",
    "storefront.checkout.qrPayment.vietQrBadge": "VietQR",
    "storefront.checkout.qrPayment.pciBadge": "Bảo mật PCI-DSS",
    "storefront.checkout.qrPayment.heldOrder": "giữ đơn",
    "storefront.checkout.qrPayment.heldFor": "Giữ hàng cho bạn trong {time} phút",
    "storefront.checkout.qrPayment.bankSupport":
      "Hỗ trợ ZaloPay & 35+ ngân hàng quét VietQR",
    "storefront.checkout.qrPayment.step1": "Mở app ZaloPay hoặc ứng dụng ngân hàng",
    "storefront.checkout.qrPayment.step2": "Chọn biểu tượng Quét mã QR trên màn hình",
    "storefront.checkout.qrPayment.step3":
      "Kiểm tra số tiền {amount} & Xác nhận",
    "storefront.checkout.qrPayment.waiting":
      "Đang chờ bạn quét mã và thanh toán...",
    "storefront.checkout.qrPayment.vibeMartCheckout": "Checkout",
    "storefront.checkout.qrPayment.orderCodeLabel": "Mã GD:",
    "storefront.checkout.qrPayment.copyOrderCode": "Sao chép mã",
    "storefront.checkout.qrPayment.totalLabel":
      "Tổng thanh toán ({count} đơn):",
    "storefront.checkout.qrPayment.savingsLabel": "Tiết kiệm 50k",
    "storefront.checkout.qrPayment.detailsTitle":
      "Chi tiết {count} đơn hàng gộp",
    "storefront.checkout.qrPayment.scanOnce": "1 lần quét",
    "storefront.checkout.qrPayment.expiryAlert":
      "Nếu không hoàn tất trước khi hết giờ, {count} đơn hàng sẽ tự động hủy và các sản phẩm giá Flash Sale sẽ được hoàn lại kho.",
    "storefront.checkout.qrPayment.completedCta":
      "Tôi đã hoàn tất thanh toán",
    "storefront.checkout.qrPayment.changeMethod":
      "← Đổi phương thức thanh toán khác",
    "storefront.checkout.qrPayment.mall": "Mall",
    "storefront.checkout.qrPayment.official": "Chính hãng",
    "storefront.checkout.qrPayment.codeLabel": "Mã:",
  };

  const buildT = (namespace?: string) => {
    const fn = (key: string, values?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const raw = map[fullKey] ?? key;
      return interpolate(raw, values);
    };
    // .rich() trả về string đã interpolate, bỏ qua render functions
    // (component tự wrap trong <strong>). Đơn giản cho test.
    fn.rich = (
      key: string,
      values?: Record<string, unknown>,
    ): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const raw = map[fullKey] ?? key;
      return interpolate(raw, values);
    };
    return fn;
  };
  return { useTranslations: buildT };
});

// Stub navigator.clipboard (read-only trong jsdom) qua Object.defineProperty.
function stubClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    writable: true,
    configurable: true,
  });
}

describe("QrPaymentModule", () => {
  beforeEach(() => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders QR image with qrCodeUrl as src", () => {
    const order = makeOrder();
    render(<QrPaymentModule order={order} onComplete={() => {}} />);
    const img = screen.getByAltText("Mã QR ZaloPay") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe("data:image/png;base64,AAA");
  });

  it("renders order code and total amount", () => {
    const order = makeOrder();
    render(<QrPaymentModule order={order} onComplete={() => {}} />);
    expect(screen.getByText("FS-261001-A7K2Q")).toBeInTheDocument();
    expect(screen.getByText("1.292.000₫")).toBeInTheDocument();
    expect(screen.getByText("UTC Fashion Mall")).toBeInTheDocument();
    expect(screen.getByText("TechZone Official")).toBeInTheDocument();
  });

  it("renders countdown with mm:ss format near 04:3x", () => {
    const order = makeOrder();
    render(<QrPaymentModule order={order} onComplete={() => {}} />);
    const text = screen.getByTestId("countdown-timer").textContent ?? "";
    // 4 phút 32 giây từ now → 04:3x (29..32), allow jitter.
    expect(text).toMatch(/^04:(2[9]|3[0-2])$/);
  });

  it("counts down every second", () => {
    vi.useFakeTimers();
    // Đặt system time 1 giờ trước để expiresAt ở tương lai xa so với now.
    vi.setSystemTime(new Date("2026-10-14T08:00:00Z"));
    // Tạo order SAU setSystemTime để expiresAt dựa trên "now" mới.
    const order = makeOrder();
    render(<QrPaymentModule order={order} onComplete={() => {}} />);

    const before = screen.getByTestId("countdown-timer").textContent;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const after = screen.getByTestId("countdown-timer").textContent;
    expect(before).not.toEqual(after);
  });

  it("copies order code to clipboard when copy button is clicked", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    const order = makeOrder();
    render(<QrPaymentModule order={order} onComplete={() => {}} />);
    const copyBtn = screen.getByLabelText("Sao chép mã");
    await user.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("FS-261001-A7K2Q");
  });

  it("invokes onComplete when 'Tôi đã hoàn tất' is clicked", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const order = makeOrder();
    render(<QrPaymentModule order={order} onComplete={onComplete} />);
    const btn = screen.getByTestId("qr-completed-button");
    await user.click(btn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows expired state when expiresAt is in the past", () => {
    const order = makeOrder({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    render(<QrPaymentModule order={order} onComplete={() => {}} />);
    expect(screen.getByTestId("qr-expired-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("countdown-timer").textContent).toBe("00:00");
  });

  it("renders 3 steps instruction with interpolated amount", () => {
    const order = makeOrder();
    render(<QrPaymentModule order={order} onComplete={() => {}} />);
    const allText = document.body.textContent ?? "";
    expect(allText).toMatch(/Mở app ZaloPay hoặc ứng dụng ngân hàng/);
    expect(allText).toMatch(/Chọn biểu tượng Quét mã QR trên màn hình/);
    expect(allText).toMatch(/Kiểm tra số tiền 1\.292\.000₫ & Xác nhận/);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeOrder(overrides?: Partial<QrOrderDetail>): QrOrderDetail {
  // Mặc định expiresAt = now + 4:32 (theo Stitch mockup)
  const expiresAt =
    new Date(Date.now() + 4 * 60 * 1000 + 32 * 1000).toISOString();
  return {
    orderCode: "FS-261001-A7K2Q",
    qrCodeUrl: "data:image/png;base64,AAA",
    expiresAt,
    amount: 1_292_000,
    shopOrders: [
      {
        storeId: 1,
        storeName: "UTC Fashion Mall",
        storeBadge: "Mall",
        orderCode: "FS-261001-A7K2Q",
        amount: 538_000,
        itemSummary: "Áo thun cotton oversize, Quần short thể thao",
      },
      {
        storeId: 2,
        storeName: "TechZone Official",
        storeBadge: "OfficialMall",
        orderCode: "TZ-261001-B9X8M",
        amount: 754_000,
        itemSummary: "Tai nghe không dây Bluetooth XYZ Pro",
      },
    ],
    ...overrides,
  };
}
