/**
 * Unit tests cho StorefrontHeader.
 * - Nav pills: active state detection theo pathname
 * - Rendering: sections hiển thị đúng (không strict text match)
 * - Cart count badge: hiển thị theo useCartCount
 *
 * Không test snapshot (pixel-match) — nằm ở page-level HomepageView test.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StorefrontHeader } from "./StorefrontHeader";
import { TestWrapper } from "@/__tests__/test-wrapper";

const mockUsePathname = vi.fn(() => "/trang-chu");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock useAuth – mặc định chưa auth (cart count = 0)
// Lưu ý: trả về `unknown` để test không cần khai báo đủ tất cả field của
// useAuth return type – chỉ cần field mà component sử dụng.
const mockUseAuth = vi.fn<() => unknown>(() => ({
  user: null,
  role: undefined,
  isAuthenticated: false,
  isHydrated: true,
  setUser: vi.fn(),
  logout: vi.fn(),
  isBuyer: false,
  isSeller: false,
  isAdmin: false,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useCartCount – mặc định count=0 (cart rỗng / chưa auth)
const mockUseCartCount = vi.fn<() => unknown>(() => ({
  data: 0,
  isSuccess: true,
  isFetching: false,
}));
vi.mock("@/features/cart", () => ({
  useCartCount: () => mockUseCartCount(),
}));

function withProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>,
  );
}

describe("StorefrontHeader – nav pill active detection", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/trang-chu");
  });

  it("highlights Trang chủ pill when pathname is /trang-chu", () => {
    withProviders(<StorefrontHeader />);
    const homeLink = screen.getAllByRole("link").find(
      (l) => l.textContent?.trim() === "Trang chủ"
    );
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  it("highlights Flash Sale pill when pathname is /flash-sale", () => {
    mockUsePathname.mockReturnValue("/flash-sale");
    withProviders(<StorefrontHeader />);
    const flashLinks = screen.getAllByRole("link").filter((l) =>
      l.textContent?.includes("Flash Sale")
    );
    const flashPill = flashLinks.find((l) => l.getAttribute("aria-current") === "page");
    expect(flashPill).toBeDefined();
  });

  it("highlights Voucher nav item when pathname is /kho-voucher", () => {
    mockUsePathname.mockReturnValue("/kho-voucher");
    withProviders(<StorefrontHeader />);
    // Verify that at least one nav pill gets aria-current on /kho-voucher
    const pillsWithAriaCurrent = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(pillsWithAriaCurrent.length).toBeGreaterThan(0);
  });

  it("activeNav prop overrides pathname detection", () => {
    mockUsePathname.mockReturnValue("/trang-chu");
    withProviders(<StorefrontHeader activeNav="flash-sale" />);
    const homeLink = screen
      .getAllByRole("link")
      .find((l) => l.textContent?.trim() === "Trang chủ");
    const flashLinks = screen.getAllByRole("link").filter((l) =>
      l.textContent?.includes("Flash Sale")
    );
    const flashPill = flashLinks.find(
      (l) => l.getAttribute("aria-current") === "page"
    );
    expect(homeLink).not.toHaveAttribute("aria-current", "page");
    expect(flashPill).toBeDefined();
  });
});

describe("StorefrontHeader – renders all sections", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/trang-chu");
  });

  it("renders the top bar with seller channel text", () => {
    withProviders(<StorefrontHeader />);
    // Top bar text is split across elements — check for partial text
    expect(screen.getByText(/kênh người bán/i)).toBeInTheDocument();
  });

  it("renders the search input", () => {
    withProviders(<StorefrontHeader />);
    // Input is a plain text input (not role=searchbox)
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders multiple nav pills (at least 5)", () => {
    withProviders(<StorefrontHeader />);
    const pills = screen.getAllByRole("link");
    expect(pills.length).toBeGreaterThanOrEqual(5);
  });

  it("renders the user greeting text", () => {
    withProviders(<StorefrontHeader />);
    expect(screen.getByText(/minh thư/i)).toBeInTheDocument();
  });
});

// ── Cart count badge ──────────────────────────────────────────────────────
describe("StorefrontHeader – cart count badge", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/trang-chu");
  });

  it("does NOT render badge when count is 0", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
    });
    mockUseCartCount.mockReturnValue({ data: 0, isSuccess: true });
    withProviders(<StorefrontHeader />);
    expect(screen.queryByTestId("cart-count-badge")).not.toBeInTheDocument();
  });

  it("renders badge with count when count > 0", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
    mockUseCartCount.mockReturnValue({ data: 5, isSuccess: true });
    withProviders(<StorefrontHeader />);
    const badge = screen.getAllByTestId("cart-count-badge")[0];
    expect(badge).toHaveTextContent("5");
  });

  it("renders 99+ when count > 99", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
    mockUseCartCount.mockReturnValue({ data: 150, isSuccess: true });
    withProviders(<StorefrontHeader />);
    const badge = screen.getAllByTestId("cart-count-badge")[0];
    expect(badge).toHaveTextContent("99+");
  });
});
