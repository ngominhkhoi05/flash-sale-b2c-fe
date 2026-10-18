/**
 * Tests for FailedModule (RED → GREEN).
 *
 * Covers:
 *  - renders status pill (red) + title "Thanh toán chưa thành công"
 *  - countdown hiển thị "Còn MM:SS" và tick down theo giây
 *  - transaction card: mã GD (copy được) + grand total 1.292.000₫ (đỏ)
 *    + rejection reason + reserved order codes + voucher warning
 *  - "Thử thanh toán lại" CTA links to /checkout/qr?orderCode=<...>
 *  - "Chọn COD" CTA gọi onSelectCod callback
 *  - support links (hướng dẫn + hotline) hiển thị
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FailedModule } from "./FailedModule";
import type { OrderFailedView } from "@/features/orders";

vi.mock("next-intl", () => {
  const map: Record<string, string> = {
    "storefront.checkout.failed.statusBadge": "TRẠNG THÁI: CẦN XỬ LÝ",
    "storefront.checkout.failed.countdownLabel": "Còn",
    "storefront.checkout.failed.expiredLabel": "Hết hạn giữ chỗ",
    "storefront.checkout.failed.title": "Thanh toán chưa thành công",
    "storefront.checkout.failed.subtitle":
      "Giao dịch bị từ chối hoặc bị gián đoạn. Đơn hàng của bạn vẫn được giữ đến {time}.",
    "storefront.checkout.failed.transactionIdLabel": "Mã giao dịch",
    "storefront.checkout.failed.totalLabel": "Tổng thanh toán",
    "storefront.checkout.failed.rejectionTitle": "Lý do từ chối:",
    "storefront.checkout.failed.reservedOrdersLabel":
      "Đơn hàng đang giữ chỗ ({count}):",
    "storefront.checkout.failed.copyButton": "Sao chép",
    "storefront.checkout.failed.voucherWarning":
      "Vui lòng hoàn tất trước {time} để không bỏ lỡ {voucher} đã áp dụng.",
    "storefront.checkout.failed.retryCta": "Thử thanh toán lại",
    "storefront.checkout.failed.codCta": "Chọn COD (Nhận hàng trả tiền)",
    "storefront.checkout.failed.supportGuide": "Hướng dẫn thanh toán",
    "storefront.checkout.failed.supportHotline": "Hỗ trợ: 1900 8888",
    "storefront.checkout.failed.copySuccess": "Đã sao chép mã giao dịch",
    "storefront.checkout.failed.copyError": "Không thể sao chép mã",
  };

  const buildT = (namespace?: string) => {
    const fn = (key: string, values?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const raw = map[fullKey] ?? key;
      if (!values) return raw;
      return Object.entries(values).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
        raw,
      );
    };
    fn.rich = fn;
    return fn;
  };
  return { useTranslations: buildT };
});

// Helper: tạo OrderFailedView với heldUntil offset (giây) từ now.
function makeView(secondsLeft: number): OrderFailedView {
  return {
    orderCodes: ["FS-261001-A7K2Q", "TZ-261001-B9X8M"],
    transactionId: "261001_000245",
    grandTotal: 1_292_000,
    heldUntil: new Date(Date.now() + secondsLeft * 1000).toISOString(),
    rejectionReason:
      "Tài khoản không đủ số dư hoặc đã quá thời gian xác thực OTP.",
    voucherWarning: {
      description: "voucher Flash Sale giảm 80K",
      expiresAt: new Date(Date.now() + secondsLeft * 1000).toISOString(),
    },
    address: {
      recipientName: "Nguyễn Văn An",
      phone: "0901 234 567",
      fullAddress: "450 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM",
    },
    paymentMethod: "ZALOPAY",
  };
}

describe("FailedModule", () => {
  it("renders status pill (red) + title", () => {
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    expect(screen.getByText("TRẠNG THÁI: CẦN XỬ LÝ")).toBeInTheDocument();
    expect(screen.getByText("Thanh toán chưa thành công")).toBeInTheDocument();
  });

  it("renders countdown initial state (no hydration mismatch warning)", () => {
    // Component dùng 'useState<number | null>(null)' + useEffect để set
    // Date.now() → SSR render '--:--', client render thật sau hydrate.
    // Test này chỉ verify component render được (không assert text cụ thể)
    // vì jsdom + RTL flush useEffect synchronously, nên giá trị sau
    // render đã là "Còn MM:SS". Trong browser thật, SSR sẽ là "--:--".
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    expect(screen.getByTestId("failed-countdown-text")).toBeInTheDocument();
  });

  it("renders countdown formatted mm:ss sau khi hydrate + interval fire", () => {
    vi.useFakeTimers();
    // Đặt system time cố định để Date.now() trong useEffect cũng cố định.
    vi.setSystemTime(new Date("2026-10-14T21:30:00Z"));
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    // Ban đầu: placeholder "--:--" (vì setNow không được gọi synchronously
    // trong useEffect — Next 16 / React 19 rule `react-hooks/set-state-in-effect`).
    expect(screen.getByText("Còn --:--")).toBeInTheDocument();
    // Sau 1s, interval fire đầu tiên → setNow(Date.now()) → render thật.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // target = 21:30:00 + 4:15 = 21:34:15, now = 21:30:01
    // → msLeft = 4:14 = 254000ms → "04:14"
    expect(screen.getByText("Còn 04:14")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("countdown ticks down by 1 second after 1s", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T21:30:00Z"));
    const base = 255; // 4:15
    render(<FailedModule order={makeView(base)} onSelectCod={vi.fn()} />);
    // Initial: placeholder (vì setNow chưa chạy).
    expect(screen.getByText("Còn --:--")).toBeInTheDocument();

    // Sau 1s: interval đầu tiên fire → render "Còn 04:14".
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const initial = screen.getByText("Còn 04:14").textContent;

    // Sau thêm 1s: interval thứ 2 fire → render "Còn 04:13".
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const after = screen.getByText("Còn 04:13").textContent;
    expect(initial).not.toBe(after);
    expect(after).toBe("Còn 04:13");
    vi.useRealTimers();
  });

  it("renders transaction card with mã GD + grand total 1.292.000₫", () => {
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    expect(screen.getByText("Mã giao dịch")).toBeInTheDocument();
    expect(screen.getByText("261001_000245")).toBeInTheDocument();
    expect(screen.getByText("1.292.000₫")).toBeInTheDocument();
  });

  it("renders rejection reason callout", () => {
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    expect(screen.getByText("Lý do từ chối:")).toBeInTheDocument();
    expect(
      screen.getByText(/Tài khoản không đủ số dư/),
    ).toBeInTheDocument();
  });

  it("renders reserved order codes (2 codes)", () => {
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    expect(screen.getByText(/Đơn hàng đang giữ chỗ \(2\)/)).toBeInTheDocument();
    expect(screen.getByText("FS-261001-A7K2Q")).toBeInTheDocument();
    expect(screen.getByText("TZ-261001-B9X8M")).toBeInTheDocument();
  });

  it("renders voucher warning when provided", () => {
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    expect(screen.getByText(/voucher Flash Sale giảm 80K/)).toBeInTheDocument();
  });

  it("'Thử thanh toán lại' CTA links to /checkout/qr?orderCode=<csv>", () => {
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    const link = screen.getByRole("link", { name: /Thử thanh toán lại/ });
    // encodeURIComponent sẽ mã hoá dấu `,` thành `%2C` — kỳ vọng href encoded.
    expect(link).toHaveAttribute(
      "href",
      "/checkout/qr?orderCode=FS-261001-A7K2Q%2CTZ-261001-B9X8M",
    );
  });

  it("'Chọn COD' CTA calls onSelectCod callback", () => {
    const onSelectCod = vi.fn();
    render(<FailedModule order={makeView(255)} onSelectCod={onSelectCod} />);
    const btn = screen.getByRole("button", { name: /Chọn COD/ });
    fireEvent.click(btn);
    expect(onSelectCod).toHaveBeenCalledTimes(1);
  });

  it("renders support links (Hướng dẫn + Hotline)", () => {
    render(<FailedModule order={makeView(255)} onSelectCod={vi.fn()} />);
    expect(screen.getByText(/Hướng dẫn thanh toán/)).toBeInTheDocument();
    expect(screen.getByText(/Hỗ trợ: 1900 8888/)).toBeInTheDocument();
  });

  it("countdown ticks down by 1 second after 1s (via testid)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T21:30:00Z"));
    const base = 255; // 4:15
    render(<FailedModule order={makeView(base)} onSelectCod={vi.fn()} />);
    // Initial: placeholder (vì setNow chưa chạy synchronously).
    expect(
      screen.getByTestId("failed-countdown-text"),
    ).toHaveTextContent("Còn --:--");

    // Sau 1s: interval đầu tiên fire → render "Còn 04:14".
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("failed-countdown-text")).toHaveTextContent(
      "Còn 04:14",
    );

    // Sau thêm 1s: interval thứ 2 fire → render "Còn 04:13".
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("failed-countdown-text")).toHaveTextContent(
      "Còn 04:13",
    );
    vi.useRealTimers();
  });
});
