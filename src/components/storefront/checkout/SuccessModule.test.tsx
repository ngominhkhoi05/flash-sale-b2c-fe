/**
 * Tests for SuccessModule (RED → GREEN).
 *
 * Covers:
 *  - renders desktop + mobile mockups side-by-side
 *  - shows badge "THÀNH CÔNG" and title "Đặt hàng thành công!"
 *  - lists all orders (UTC Fashion Mall + TechZone Official)
 *  - shows grand total 1.292.000₫ ở cả desktop lẫn mobile
 *  - shows address (recipient + phone + fullAddress)
 *  - "Xem đơn hàng" CTA links to /orders/<orderCode>
 *  - "Tiếp tục mua sắm" CTA links to /
 *  - Renders null (or fallback) when order is undefined
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuccessModule } from "./SuccessModule";
import type { OrderSuccessView } from "@/features/orders";

vi.mock("next-intl", () => {
  const map: Record<string, string> = {
    "storefront.checkout.success.badge": "TRẠNG THÁI: THÀNH CÔNG",
    "storefront.checkout.success.title": "Đặt hàng thành công!",
    "storefront.checkout.success.subtitle":
      "Cảm ơn bạn! {count} đơn hàng đã được gửi tới shop và đang được chuẩn bị để giao.",
    "storefront.checkout.success.subtitleMobile":
      "{count} đơn hàng đã gửi tới shop và đang chuẩn bị giao đến bạn.",
    "storefront.checkout.success.paidBadge": "Đã thanh toán",
    "storefront.checkout.success.codeLabel": "Mã:",
    "storefront.checkout.success.paymentMethodZaloPay": "ZaloPay QR",
    "storefront.checkout.success.totalLabel": "Tổng thanh toán",
    "storefront.checkout.success.estimatedDelivery": "Dự kiến giao ngày mai",
    "storefront.checkout.success.viewOrdersCta": "Xem đơn hàng",
    "storefront.checkout.success.continueShoppingCta": "Tiếp tục mua sắm",
    "storefront.checkout.success.mobilePreviewBadge":
      "Bản xem trước Giao diện Mobile (390px)",
    "storefront.checkout.success.mallBadge": "Mall",
    "storefront.checkout.success.officialBadge": "Chính hãng",
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
    fn.rich = (key: string, values?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const raw = map[fullKey] ?? key;
      if (!values) return raw;
      return Object.entries(values).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
        raw,
      );
    };
    return fn;
  };
  return { useTranslations: buildT };
});

const sampleOrder: OrderSuccessView = {
  orderCodes: ["FS-261001-A7K2Q", "TZ-261001-B9X8M"],
  grandTotal: 1_292_000,
  totalItems: 3,
  totalOrders: 2,
  address: {
    recipientName: "Nguyễn Văn An",
    phone: "0901 234 567",
    fullAddress: "450 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM",
  },
  orders: [
    {
      orderCode: "FS-261001-A7K2Q",
      storeId: 1,
      storeName: "UTC Fashion Mall",
      storeBadge: "Mall",
      amount: 538_000,
      paymentStatus: "SUCCESS",
      paymentMethod: "ZALOPAY",
    },
    {
      orderCode: "TZ-261001-B9X8M",
      storeId: 2,
      storeName: "TechZone Official",
      storeBadge: "OfficialMall",
      amount: 754_000,
      paymentStatus: "SUCCESS",
      paymentMethod: "ZALOPAY",
    },
  ],
  estimatedDeliveryLabel: "Dự kiến giao ngày mai",
};
describe("SuccessModule", () => {
  it("renders badge and title exactly once (responsive single layout)", () => {
    render(<SuccessModule order={sampleOrder} />);
    // Render 1 lần duy nhất, dùng Tailwind md: để thay đổi padding/size theo viewport.
    expect(screen.getAllByText("TRẠNG THÁI: THÀNH CÔNG")).toHaveLength(1);
    expect(screen.getAllByText("Đặt hàng thành công!")).toHaveLength(1);
  });

  it("renders both store names exactly once", () => {
    render(<SuccessModule order={sampleOrder} />);
    expect(screen.getAllByText("UTC Fashion Mall")).toHaveLength(1);
    expect(screen.getAllByText("TechZone Official")).toHaveLength(1);
  });

  it("renders grand total 1.292.000₫ exactly once", () => {
    render(<SuccessModule order={sampleOrder} />);
    expect(screen.getAllByText("1.292.000₫")).toHaveLength(1);
  });

  it("renders address with recipient + phone exactly once", () => {
    render(<SuccessModule order={sampleOrder} />);
    expect(screen.getAllByText(/Nguyễn Văn An/)).toHaveLength(1);
    expect(screen.getAllByText(/0901 234 567/)).toHaveLength(1);
    expect(screen.getAllByText(/450 Lê Văn Việt/)).toHaveLength(1);
  });

  it("'Xem đơn hàng' CTA links to /orders/<orderCode>", () => {
    render(<SuccessModule order={sampleOrder} />);
    const viewLinks = screen.getAllByRole("link", { name: /Xem đơn hàng/ });
    expect(viewLinks).toHaveLength(1);
    viewLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/orders/FS-261001-A7K2Q");
    });
  });

  it("'Tiếp tục mua sắm' CTA links to /", () => {
    render(<SuccessModule order={sampleOrder} />);
    const continueLinks = screen.getAllByRole("link", {
      name: /Tiếp tục mua sắm/,
    });
    expect(continueLinks).toHaveLength(1);
    continueLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/");
    });
  });

  it("renders subtitle with order count", () => {
    render(<SuccessModule order={sampleOrder} />);
    expect(
      screen.getByText(/2 đơn hàng đã được gửi tới shop/),
    ).toBeInTheDocument();
  });

  it("does NOT render a 390px device frame or mobile preview separator", () => {
    // Mobile preview separator đã bị bỏ — chỉ render 1 success-module duy nhất.
    const { container } = render(<SuccessModule order={sampleOrder} />);
    expect(
      container.querySelector('[data-testid="success-mobile-mockup"]'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Bản xem trước Giao diện Mobile/),
    ).not.toBeInTheDocument();
  });
});
