/**
 * Tests for ExpiredPageContent (RED → GREEN).
 *
 * Covers:
 *  - Renders ExpiredModule with mock data when no orderCode provided
 *  - Renders ExpiredModule when orderCode provided
 *  - Mock data renders full expired page (title + restored benefits + cart count)
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExpiredPageContent } from "./ExpiredPageContent";

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

describe("ExpiredPageContent", () => {
  it("renders ExpiredModule with mock data when orderCode missing", () => {
    render(<ExpiredPageContent />);
    expect(screen.getByTestId("expired-module")).toBeInTheDocument();
    expect(screen.getByText("Đơn hàng đã hết hạn")).toBeInTheDocument();
    expect(screen.getByText(/FREESHIP50K/)).toBeInTheDocument();
  });

  it("renders ExpiredModule when orderCode provided", () => {
    render(<ExpiredPageContent orderCode="FS-261001-A7K2Q" />);
    expect(screen.getByTestId("expired-module")).toBeInTheDocument();
  });

  it("renders cart count from mock (2 sản phẩm)", () => {
    render(<ExpiredPageContent />);
    expect(screen.getByText(/Xem lại giỏ hàng \(2 sản phẩm\)/)).toBeInTheDocument();
  });
});
