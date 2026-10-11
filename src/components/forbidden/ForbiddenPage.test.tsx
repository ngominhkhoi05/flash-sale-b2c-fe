import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ForbiddenPage } from "./ForbiddenPage";

const viMessages = {
  error: {
    forbidden: {
      brandTag: "Vibe Mart Security",
      idBadge: "ID: 403-FORBIDDEN",
      restrictedZone: "Khu vực giới hạn",
      title: "Bạn không có quyền truy cập",
      description:
        "Tài khoản hiện tại của bạn chưa được cấp thẩm quyền xem phân hệ này. Vui lòng xác thực bằng tài khoản quản trị hoặc liên hệ bộ phận hỗ trợ chủ gian hàng.",
      primaryAction: "Về trang chủ",
      secondaryAction: "Đăng nhập tài khoản khác",
      sessionLabel: "Phiên đăng nhập hiện tại",
      sessionRole: "Khách mua hàng",
      sessionEmail: "user_guest_8924@vibemart.local",
      requiredRole: "STORE_ADMIN",
      requiredRolePrefix: "Cần quyền",
      supportLabel: "Hỗ trợ kỹ thuật:",
      supportEmail: "hotro@vibemart.vn",
      hotlineLabel: "Hotline 24/7:",
      hotlineNumber: "1900 8888",
    },
  },
};

function renderWithIntl(ui: React.ReactNode, locale: "vi" | "en" = "vi") {
  return render(
    <NextIntlClientProvider locale={locale} messages={viMessages} timeZone="UTC">
      {ui}
    </NextIntlClientProvider>
  );
}

describe("ForbiddenPage", () => {
  it("renders the heading from i18n", () => {
    renderWithIntl(<ForbiddenPage />);
    expect(
      screen.getByRole("heading", { name: /Bạn không có quyền truy cập/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("renders the description paragraph from i18n", () => {
    renderWithIntl(<ForbiddenPage />);
    expect(
      screen.getByText(/Tài khoản hiện tại của bạn chưa được cấp thẩm quyền/i)
    ).toBeInTheDocument();
  });

  it("renders the brand tag pill (security + id badge)", () => {
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("Vibe Mart Security")).toBeInTheDocument();
    expect(screen.getByText("ID: 403-FORBIDDEN")).toBeInTheDocument();
  });

  it("renders the restricted-zone sub-pill", () => {
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("Khu vực giới hạn")).toBeInTheDocument();
  });

  it("renders the role diagnostic capsule with required role", () => {
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("Phiên đăng nhập hiện tại")).toBeInTheDocument();
    expect(screen.getByText("Khách mua hàng")).toBeInTheDocument();
    expect(screen.getByText(/user_guest_8924@vibemart\.local/)).toBeInTheDocument();
    expect(screen.getByText("STORE_ADMIN")).toBeInTheDocument();
    expect(screen.getByText(/Cần quyền/)).toBeInTheDocument();
  });

  it("primary action links to /trang-chu (CLAUDE.md § 2)", () => {
    renderWithIntl(<ForbiddenPage />);
    const primary = screen.getByRole("link", { name: /Về trang chủ/i });
    expect(primary).toHaveAttribute("href", "/trang-chu");
  });

  it("secondary action links to /dang-nhap?ref=forbidden_retry", () => {
    renderWithIntl(<ForbiddenPage />);
    const secondary = screen.getByRole("link", {
      name: /Đăng nhập tài khoản khác/i,
    });
    expect(secondary).toHaveAttribute("href", "/dang-nhap?ref=forbidden_retry");
  });

  it("support email link uses mailto: and correct address", () => {
    renderWithIntl(<ForbiddenPage />);
    const mail = screen.getByRole("link", { name: /hotro@vibemart\.vn/i });
    expect(mail).toHaveAttribute("href", "mailto:hotro@vibemart.vn");
  });

  it("hotline link uses tel: and correct number", () => {
    renderWithIntl(<ForbiddenPage />);
    const phone = screen.getByRole("link", { name: /1900 8888/ });
    expect(phone).toHaveAttribute("href", "tel:19008888");
  });
});
