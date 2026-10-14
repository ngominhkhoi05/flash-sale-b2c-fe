/**
 * Tests for ExpiredModule (RED → GREEN).
 *
 * Covers:
 *  - status pill (amber) + title "Đơn hàng đã hết hạn"
 *  - subtitle với minutes + orderCount
 *  - restored benefits list (từ view.restoredBenefits)
 *  - inventory restocked row với cartItemSummary + "Còn hàng tại shop" badge
 *  - "Quay lại Flash Sale" CTA link /flash-sale
 *  - "Xem lại giỏ hàng (N sản phẩm)" CTA link /cart
 *  - help footer với "Liên hệ bộ phận CSKH 24/7" link
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExpiredModule } from "./ExpiredModule";
import type { OrderExpiredView } from "@/features/orders";

vi.mock("next-intl", () => {
  const map: Record<string, string> = {
    "storefront.checkout.expired.statusBadge": "Trạng thái: Đã hủy tự động",
    "storefront.checkout.expired.title": "Đơn hàng đã hết hạn",
    "storefront.checkout.expired.subtitle":
      "Bạn chưa hoàn tất thanh toán trong {minutes} phút nên {orderCount} đơn hàng đã tự động hủy. Sản phẩm trong giỏ đã được hoàn lại kho.",
    "storefront.checkout.expired.restoredBenefitsTitle":
      "Quyền lợi đã được phục hồi tự động:",
    "storefront.checkout.expired.inStockBadge": "Còn hàng tại shop",
    "storefront.checkout.expired.flashSaleCta": "Quay lại Flash Sale",
    "storefront.checkout.expired.cartCta": "Xem lại giỏ hàng ({count} sản phẩm)",
    "storefront.checkout.expired.helpPrompt": "Cần trợ giúp đơn hàng?",
    "storefront.checkout.expired.helpCta": "Liên hệ bộ phận CSKH 24/7",
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

const sampleOrder: OrderExpiredView = {
  orderCodes: ["FS-261001-A7K2Q", "TZ-261001-B9X8M"],
  cartItemCount: 2,
  cartItemSummary: "Áo Polo Oversize (UTC) & Cáp C-to-C (TechZone)",
  restoredBenefits: [
    "Voucher Vibe Mart FREESHIP50K đã được hoàn lại vào Ví Voucher của bạn.",
    "2 mã giảm giá shop (-20.000₫) đã được mở khóa để có thể sử dụng lại.",
  ],
  expiredAt: "2026-10-14T21:30:00Z",
  holdDurationMinutes: 5,
};

describe("ExpiredModule", () => {
  it("renders status pill (amber) + title", () => {
    render(<ExpiredModule order={sampleOrder} />);
    expect(screen.getByText("Trạng thái: Đã hủy tự động")).toBeInTheDocument();
    expect(screen.getByText("Đơn hàng đã hết hạn")).toBeInTheDocument();
  });

  it("renders subtitle with minutes and order count", () => {
    render(<ExpiredModule order={sampleOrder} />);
    expect(
      screen.getByText(/5 phút.*2 đơn hàng đã tự động hủy/),
    ).toBeInTheDocument();
  });

  it("renders restored benefits list (2 items)", () => {
    render(<ExpiredModule order={sampleOrder} />);
    expect(
      screen.getByText(/Quyền lợi đã được phục hồi tự động/),
    ).toBeInTheDocument();
    expect(screen.getByText(/FREESHIP50K/)).toBeInTheDocument();
    expect(screen.getByText(/2 mã giảm giá shop/)).toBeInTheDocument();
  });

  it("renders inventory restocked row + in-stock badge", () => {
    render(<ExpiredModule order={sampleOrder} />);
    expect(
      screen.getByText(/Áo Polo Oversize \(UTC\).*Cáp C-to-C \(TechZone\)/),
    ).toBeInTheDocument();
    expect(screen.getByText("Còn hàng tại shop")).toBeInTheDocument();
  });

  it("'Quay lại Flash Sale' CTA links to /flash-sale", () => {
    render(<ExpiredModule order={sampleOrder} />);
    const link = screen.getByRole("link", { name: /Quay lại Flash Sale/ });
    expect(link).toHaveAttribute("href", "/flash-sale");
  });

  it("'Xem lại giỏ hàng' CTA links to /cart with item count", () => {
    render(<ExpiredModule order={sampleOrder} />);
    const link = screen.getByRole("link", { name: /Xem lại giỏ hàng/ });
    expect(link).toHaveAttribute("href", "/cart");
    expect(link.textContent).toContain("2 sản phẩm");
  });

  it("renders help footer với CSKH link", () => {
    render(<ExpiredModule order={sampleOrder} />);
    expect(screen.getByText("Cần trợ giúp đơn hàng?")).toBeInTheDocument();
    expect(
      screen.getByText("Liên hệ bộ phận CSKH 24/7"),
    ).toBeInTheDocument();
  });

  it("handles singular order count (1 đơn) in subtitle", () => {
    render(
      <ExpiredModule
        order={{
          ...sampleOrder,
          orderCodes: ["FS-261001-A7K2Q"],
        }}
      />,
    );
    expect(
      screen.getByText(/5 phút.*1 đơn hàng đã tự động hủy/),
    ).toBeInTheDocument();
  });
});
