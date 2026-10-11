import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthGuard } from "./AuthGuard";
import { ROUTES } from "@/lib/constants";

// ── Mock next/navigation ──────────────────────────────────────────────────
const mockReplace = vi.fn();
const mockUsePathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockUsePathname(),
}));

// ── Mock useAuth ─────────────────────────────────────────────────────────
const mockUseAuth = vi.fn<() => {
  isAuthenticated: boolean;
  isHydrated: boolean;
  user: null;
  role: undefined;
  setUser: () => void;
  logout: () => void;
  isBuyer: false;
  isSeller: false;
  isAdmin: false;
}>();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

function makeAuthState(overrides: {
  isAuthenticated: boolean;
  isHydrated: boolean;
}) {
  return {
    isAuthenticated: overrides.isAuthenticated,
    isHydrated: overrides.isHydrated,
    user: null,
    role: undefined,
    setUser: () => undefined,
    logout: () => undefined,
    isBuyer: false,
    isSeller: false,
    isAdmin: false,
  } as ReturnType<typeof mockUseAuth>;
}

beforeEach(() => {
  mockReplace.mockReset();
  mockUsePathname.mockReset();
  mockUseAuth.mockReset();
});

describe("AuthGuard", () => {
  it("renders fallback when not hydrated (avoid flash redirect)", () => {
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false, isHydrated: false }));
    mockUsePathname.mockReturnValue("/gio-hang");

    const { container } = render(
      <AuthGuard fallback={<div data-testid="loading">Đang tải…</div>}>
        <div data-testid="content">Nội dung bí mật</div>
      </AuthGuard>,
    );

    expect(container.querySelector('[data-testid="loading"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="content"]')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders children when hydrated and authenticated", () => {
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: true, isHydrated: true }));
    mockUsePathname.mockReturnValue("/gio-hang");

    const { container } = render(
      <AuthGuard fallback={<div data-testid="loading">Loading</div>}>
        <div data-testid="content">Nội dung giỏ hàng</div>
      </AuthGuard>,
    );

    expect(container.querySelector('[data-testid="content"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="loading"]')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login when hydrated but not authenticated", async () => {
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false, isHydrated: true }));
    mockUsePathname.mockReturnValue("/gio-hang");

    const { container } = render(
      <AuthGuard fallback={<div data-testid="loading">Loading</div>}>
        <div data-testid="content">Nội dung bí mật</div>
      </AuthGuard>,
    );

    // Trước khi effect chạy: render fallback (không flash content)
    expect(container.querySelector('[data-testid="content"]')).toBeNull();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/gio-hang")}`,
      );
    });
  });

  it("preserves pathname '/' as redirect query (internal homepage)", async () => {
    // Pathname "/" là path nội bộ hợp lệ (bắt đầu bằng "/"), không phải external.
    // Vẫn encode thành ?redirect=%2F để sau login quay lại đúng trang chủ.
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false, isHydrated: true }));
    mockUsePathname.mockReturnValue("/");

    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/")}`,
      );
    });
  });

  it("falls back to plain LOGIN when currentPath is null/undefined", async () => {
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false, isHydrated: true }));
    mockUsePathname.mockReturnValue(""); // next/navigation có thể trả "" khi route chưa match

    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.LOGIN);
    });
  });

  it("preserves query string in redirect URL", async () => {
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false, isHydrated: true }));
    mockUsePathname.mockReturnValue("/kho-voucher?ref=email");

    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/kho-voucher?ref=email")}`,
      );
    });
  });

  it("does not redirect when authenticated on /tai-khoan", async () => {
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: true, isHydrated: true }));
    mockUsePathname.mockReturnValue("/tai-khoan");

    render(
      <AuthGuard>
        <div data-testid="account">Tài khoản</div>
      </AuthGuard>,
    );

    // Đợi 1 tick để chắc effect không gọi
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders default null fallback (no children) when not hydrated and no fallback prop", () => {
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false, isHydrated: false }));
    mockUsePathname.mockReturnValue("/gio-hang");

    const { container } = render(
      <AuthGuard>
        <div data-testid="content">Nội dung</div>
      </AuthGuard>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("re-runs redirect effect when auth state changes from false to true", async () => {
    // Lần render 1: chưa auth → redirect
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false, isHydrated: true }));
    mockUsePathname.mockReturnValue("/gio-hang");

    const { rerender } = render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    // Lần render 2: auth = true → không redirect thêm
    mockUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: true, isHydrated: true }));
    rerender(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>,
    );

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockReplace).toHaveBeenCalledTimes(1); // vẫn chỉ 1 lần
  });
});
