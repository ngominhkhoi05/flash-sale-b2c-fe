/**
 * Test cho /tai-khoan stub page.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TaiKhoanPage from "./page";
import { TestWrapper } from "@/__tests__/test-wrapper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/tai-khoan",
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

function withWrapper(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>,
  );
}

beforeEach(() => mockUseAuth.mockReset());

describe("TaiKhoanPage", () => {
  it("renders skeleton fallback when not hydrated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: false,
      user: null,
      role: undefined,
      setUser: vi.fn(),
      logout: vi.fn(),
      isBuyer: false,
      isSeller: false,
      isAdmin: false,
    });
    withWrapper(<TaiKhoanPage />);
    expect(screen.queryByText("Tài khoản của tôi")).not.toBeInTheDocument();
  });

  it("renders EmptyState with title when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: "1", email: "u@e.com", role: "BUYER" },
      role: "BUYER",
      setUser: vi.fn(),
      logout: vi.fn(),
      isBuyer: true,
      isSeller: false,
      isAdmin: false,
    });
    withWrapper(<TaiKhoanPage />);
    expect(screen.getByText("Tài khoản của tôi")).toBeInTheDocument();
    expect(screen.getByText("Không tìm thấy thông tin tài khoản")).toBeInTheDocument();
  });
});
