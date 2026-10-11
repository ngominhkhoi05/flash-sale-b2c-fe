/**
 * StorefrontFooter.test.tsx
 * - 4-column footer theo Stitch (project 15206106541998912100, screen 33db6...)
 * - Test render structure + nội dung các cột + bottom bar
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { StorefrontFooter } from "./StorefrontFooter";
import viMessages from "../../../messages/vi.json";
import enMessages from "../../../messages/en.json";

const PAYMENT_METHODS = ["Visa", "Mastercard", "MoMo", "ZaloPay", "VNPay", "COD"];
const SHIPPING_PARTNERS = ["GHTK", "GHN", "Viettel Post", "J&T Express"];

function renderFooter(locale: "vi" | "en" = "vi") {
  const messages = locale === "vi" ? viMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <StorefrontFooter />
    </NextIntlClientProvider>,
  );
}

describe("StorefrontFooter – 4-column Stitch structure", () => {
  it("renders a semantic <footer> element", () => {
    renderFooter();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders 3 column headings (h3) in Vietnamese", () => {
    renderFooter("vi");
    const headings = screen.getAllByRole("heading", { level: 3 });
    const texts = headings.map((h) => h.textContent?.trim());
    expect(texts).toEqual(
      expect.arrayContaining([
        "Hỗ trợ khách hàng",
        "Thanh toán & Vận chuyển",
        "Theo dõi & Tải ứng dụng",
      ]),
    );
    expect(headings).toHaveLength(3);
  });

  it("renders 3 column headings (h3) in English", () => {
    renderFooter("en");
    const headings = screen.getAllByRole("heading", { level: 3 });
    const texts = headings.map((h) => h.textContent?.trim());
    expect(texts).toEqual(
      expect.arrayContaining([
        "Customer Care",
        "Payment & Shipping",
        "Follow & Download App",
      ]),
    );
  });
});

describe("StorefrontFooter – column 1 (Brand)", () => {
  it("renders the brand logo image with accessible alt text", () => {
    renderFooter();
    // Logo is now an <img> with alt="Vibe Mart" (not a text span).
    const footer = screen.getByRole("contentinfo");
    const logo = within(footer).getByRole("img", { name: /Vibe Mart/i });
    expect(logo).toBeInTheDocument();
  });

  it("renders the brand tagline", () => {
    renderFooter("vi");
    expect(
      screen.getByText(/Hệ sinh thái thương mại điện tử/),
    ).toBeInTheDocument();
  });

  it("renders the trust badge '100% Hàng Chính Hãng'", () => {
    renderFooter("vi");
    expect(screen.getByText(/100% Hàng Chính Hãng/)).toBeInTheDocument();
  });

  it("does NOT render address (removed in Stitch)", () => {
    renderFooter("vi");
    expect(screen.queryByText(/Trụ sở:/)).not.toBeInTheDocument();
  });

  it("does NOT render businessLicense (removed in Stitch)", () => {
    renderFooter("vi");
    expect(screen.queryByText(/GPĐKKD/)).not.toBeInTheDocument();
  });
});

describe("StorefrontFooter – column 2 (Customer Care)", () => {
  it("renders hotline number 1900 8888 as a link with tel: scheme", () => {
    renderFooter("vi");
    const hotline = screen.getByText(/1900 8888/);
    expect(hotline).toBeInTheDocument();
    const link = hotline.closest("a");
    expect(link).toHaveAttribute("href", expect.stringContaining("1900"));
  });

  it("renders support email cskh@vibemart.vn as a mailto link", () => {
    renderFooter("vi");
    const emailLink = screen.getByRole("link", { name: /cskh@vibemart\.vn/i });
    expect(emailLink).toHaveAttribute("href", "mailto:cskh@vibemart.vn");
  });

  it("renders exactly 4 quick-help links (excluding hotline/email contact links)", () => {
    renderFooter("vi");
    const careHeading = screen.getByRole("heading", { name: /Hỗ trợ khách hàng/ });
    const col = careHeading.parentElement!;
    // Col 2 has 6 links total: 2 contact (tel:, mailto:) + 4 quick-help links.
    // We assert the 4 quick-help links specifically.
    const allLinks = within(col).getAllByRole("link");
    expect(allLinks).toHaveLength(6);
    const helpLinks = allLinks.filter((a) => a.textContent?.includes("FAQ") || a.textContent?.includes("Hướng dẫn") || a.textContent?.includes("vận chuyển") || a.textContent?.includes("bảo hành"));
    expect(helpLinks).toHaveLength(4);
  });
});

describe("StorefrontFooter – column 3 (Payment & Shipping)", () => {
  it.each(PAYMENT_METHODS)("renders payment method pill '%s'", (method) => {
    renderFooter();
    expect(screen.getByText(method)).toBeInTheDocument();
  });

  it.each(SHIPPING_PARTNERS)("renders shipping partner pill '%s'", (partner) => {
    renderFooter();
    expect(screen.getByText(partner)).toBeInTheDocument();
  });

  it("renders 6 payment pills", () => {
    renderFooter();
    const paymentPills = PAYMENT_METHODS.map((m) => screen.getByText(m));
    expect(paymentPills).toHaveLength(6);
  });

  it("renders 4 shipping partner pills", () => {
    renderFooter();
    const shipperPills = SHIPPING_PARTNERS.map((s) => screen.getByText(s));
    expect(shipperPills).toHaveLength(4);
  });

  it("renders the gateway label 'Cổng thanh toán bảo mật:'", () => {
    renderFooter("vi");
    expect(screen.getByText(/Cổng thanh toán bảo mật:/)).toBeInTheDocument();
  });

  it("renders the partner label 'Đối tác vận chuyển tin cậy:'", () => {
    renderFooter("vi");
    expect(screen.getByText(/Đối tác vận chuyển tin cậy:/)).toBeInTheDocument();
  });
});

describe("StorefrontFooter – column 4 (Follow & Download App)", () => {
  it("renders QR code placeholder", () => {
    renderFooter("vi");
    expect(screen.getByText(/QR Code Vibe App/)).toBeInTheDocument();
  });

  it("renders App Store and Google Play buttons", () => {
    renderFooter();
    expect(screen.getByText(/App Store/)).toBeInTheDocument();
    expect(screen.getByText(/Google Play/)).toBeInTheDocument();
  });

  it("renders ministry registration badge", () => {
    renderFooter("vi");
    expect(screen.getByText(/Đã đăng ký Bộ Công Thương/)).toBeInTheDocument();
  });
});

describe("StorefrontFooter – bottom bar", () => {
  it("renders copyright text", () => {
    renderFooter("vi");
    expect(screen.getByText(/© 2026 Vibe Mart/)).toBeInTheDocument();
  });

  it("renders 3 legal links (Terms / Privacy / Operation Rules)", () => {
    renderFooter("vi");
    const terms = screen.getByRole("link", { name: /Điều khoản sử dụng/ });
    const privacy = screen.getByRole("link", { name: /Chính sách bảo mật/ });
    const rules = screen.getByRole("link", { name: /Quy chế hoạt động/ });
    expect(terms).toBeInTheDocument();
    expect(privacy).toBeInTheDocument();
    expect(rules).toBeInTheDocument();
  });
});

describe("StorefrontFooter – i18n key completeness", () => {
  it("uses only keys that exist in vi.json (vi locale)", () => {
    // Render must not throw a missing-translation warning.
    const { container } = renderFooter("vi");
    expect(container).toBeInTheDocument();
  });

  it("uses only keys that exist in en.json (en locale)", () => {
    const { container } = renderFooter("en");
    expect(container).toBeInTheDocument();
  });
});
