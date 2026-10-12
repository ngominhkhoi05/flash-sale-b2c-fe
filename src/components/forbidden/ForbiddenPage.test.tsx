import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ForbiddenPage } from "./ForbiddenPage";

// ---------- Mocks ----------
// 1. Mock useAuth (Zustand store) – test từng role
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// 2. Mock next/navigation (useSearchParams) – test query ?required=ROLE
const mockUseSearchParams = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

// ---------- i18n fixtures ----------
const baseMessages = {
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
      sessionRole: "Khách mua hàng", // legacy fallback (khi i18n role chưa có)
      sessionEmail: "user_guest_8924@vibemart.local", // legacy fallback
      requiredRole: "STORE_ADMIN", // legacy fallback
      requiredRolePrefix: "Cần quyền",
      supportLabel: "Hỗ trợ kỹ thuật:",
      supportEmail: "hotro@vibemart.vn",
      hotlineLabel: "Hotline 24/7:",
      hotlineNumber: "1900 8888",
      // Mới thêm (mapping role → label)
      role: {
        BUYER: "Khách mua hàng",
        SELLER: "Người bán",
        ADMIN: "Quản trị viên",
      },
      // Mới thêm (khi user chưa login)
      notLoggedIn: "Chưa đăng nhập",
    },
  },
};

const enMessages = {
  error: {
    forbidden: {
      ...baseMessages.error.forbidden,
      restrictedZone: "Restricted zone",
      title: "You don't have access",
      description:
        "Your current account has not been granted permission to view this area. Please verify with an administrator account or contact store support.",
      primaryAction: "Back to home",
      secondaryAction: "Sign in with another account",
      sessionLabel: "Current session",
      sessionRole: "Customer",
      sessionEmail: "user_guest_8924@vibemart.local",
      requiredRole: "STORE_ADMIN",
      requiredRolePrefix: "Requires role",
      supportLabel: "Technical support:",
      hotlineLabel: "24/7 Hotline:",
      notLoggedIn: "Not signed in",
      role: {
        BUYER: "Customer",
        SELLER: "Seller",
        ADMIN: "Administrator",
      },
    },
  },
};

function renderWithIntl(
  ui: React.ReactNode,
  options: { locale?: "vi" | "en"; messages?: typeof baseMessages } = {}
) {
  const { locale = "vi", messages = baseMessages } = options;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {ui}
    </NextIntlClientProvider>
  );
}

// Helper: tạo UseSearchParams mock
function setSearchParams(params: Record<string, string> | null) {
  if (params === null) {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  } else {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(params));
  }
}

beforeEach(() => {
  // Default: user BUYER, không có query required
  mockUseAuth.mockReturnValue({
    user: { id: "u-1", email: "thu.nguyen@gmail.com", role: "BUYER" },
    isAuthenticated: true,
    isHydrated: true,
  });
  setSearchParams(null);
});

// =================================================================
// Test cũ (regression – giữ nguyên contract cũ)
// =================================================================
describe("ForbiddenPage – layout & links (regression)", () => {
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

  it("primary action links to / (CLAUDE.md § 2)", () => {
    renderWithIntl(<ForbiddenPage />);
    const primary = screen.getByRole("link", { name: /Về trang chủ/i });
    expect(primary).toHaveAttribute("href", "/");
  });

  it("secondary action links to /login?ref=forbidden_retry", () => {
    renderWithIntl(<ForbiddenPage />);
    const secondary = screen.getByRole("link", {
      name: /Đăng nhập tài khoản khác/i,
    });
    expect(secondary).toHaveAttribute("href", "/login?ref=forbidden_retry");
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

// =================================================================
// Test mới: capsule data lấy từ useAuth + useSearchParams
// =================================================================
describe("ForbiddenPage – role diagnostic capsule (real data)", () => {
  it("renders the real user email from useAuth()", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u-1", email: "thu.nguyen@gmail.com", role: "BUYER" },
      isAuthenticated: true,
      isHydrated: true,
    });
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("thu.nguyen@gmail.com")).toBeInTheDocument();
    // Hard-code email cũ KHÔNG còn hiển thị
    expect(
      screen.queryByText(/user_guest_8924@vibemart\.local/)
    ).not.toBeInTheDocument();
  });

  it("renders BUYER role label (mapped via i18n error.forbidden.role.BUYER)", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u-1", email: "buyer@vibemart.vn", role: "BUYER" },
      isAuthenticated: true,
      isHydrated: true,
    });
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("Khách mua hàng")).toBeInTheDocument();
  });

  it("renders SELLER role label (mapped via i18n)", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u-2", email: "shop@vibemart.vn", role: "SELLER" },
      isAuthenticated: true,
      isHydrated: true,
    });
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("Người bán")).toBeInTheDocument();
  });

  it("renders ADMIN role label (mapped via i18n)", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u-3", email: "admin@vibemart.vn", role: "ADMIN" },
      isAuthenticated: true,
      isHydrated: true,
    });
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("Quản trị viên")).toBeInTheDocument();
  });

  it("renders 'Chưa đăng nhập' when user is null (guest hits 403)", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText("Chưa đăng nhập")).toBeInTheDocument();
  });

  it("reads required role from ?required=ADMIN and maps to 'Quản trị viên'", () => {
    setSearchParams({ required: "ADMIN" });
    renderWithIntl(<ForbiddenPage />);
    // required role is rendered inside a <span data-testid="required-role">
    const requiredNode = screen.getByTestId("required-role");
    expect(requiredNode).toHaveTextContent(/Quản trị viên/i);
    // prefix rendered as plain text in same <p>
    expect(screen.getByText(/Cần quyền/)).toBeInTheDocument();
  });

  it("reads required role from ?required=SELLER and maps to 'Người bán'", () => {
    setSearchParams({ required: "SELLER" });
    renderWithIntl(<ForbiddenPage />);
    const requiredNode = screen.getByTestId("required-role");
    expect(requiredNode).toHaveTextContent(/Người bán/i);
  });

  it("falls back to legacy 'STORE_ADMIN' when ?required missing", () => {
    setSearchParams(null);
    renderWithIntl(<ForbiddenPage />);
    // Default: no query → component uses legacy i18n key "requiredRole" = "STORE_ADMIN"
    expect(screen.getByTestId("required-role")).toHaveTextContent("STORE_ADMIN");
  });

  it("renders the required-role prefix ('Cần quyền')", () => {
    renderWithIntl(<ForbiddenPage />);
    expect(screen.getByText(/Cần quyền/)).toBeInTheDocument();
  });

  it("localizes role labels in English (Buyer → 'Customer')", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u-1", email: "buyer@vibemart.vn", role: "BUYER" },
      isAuthenticated: true,
      isHydrated: true,
    });
    renderWithIntl(<ForbiddenPage />, { locale: "en", messages: enMessages });
    expect(screen.getByText("Customer")).toBeInTheDocument();
    // Đảm bảo KHÔNG hiển thị label tiếng Việt
    expect(screen.queryByText("Khách mua hàng")).not.toBeInTheDocument();
  });
});
