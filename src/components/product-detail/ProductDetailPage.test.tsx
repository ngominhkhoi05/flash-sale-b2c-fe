/**
 * Integration test for Product Detail Page (SP6).
 *
 * Verifies the page renders with all sections including:
 * - ProductReviewsCard, ProductRelatedStores, ProductBestSellers (new)
 * - Layout structure follows Stitch 12-col grid
 */
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import { TestWrapper } from "@/__tests__/test-wrapper";
import { mockProductDetail } from "@/features/products";

// ── Mock useAddToCart (cart) + useRouter (navigation) ────────────────────────
const mockAddMutateAsync = vi.fn();
const mockPush = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/features/cart", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/cart")>("@/features/cart");
  return {
    ...actual,
    useAddToCart: () => ({
      mutateAsync: mockAddMutateAsync,
      isPending: false,
    }),
  };
});

vi.mock("next/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// default mock: isAuthenticated = true (tránh test cũ phải override).
mockUseAuth.mockReturnValue({
  isAuthenticated: true,
  isHydrated: true,
  user: { id: "test-user", role: "BUYER" },
  role: "BUYER",
});

describe("ProductDetailPage", () => {
  const defaultProps = { product: mockProductDetail };

  test("renders product detail page container", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    // Page renders without crashing - product name appears (multiple times is OK)
    expect(screen.getAllByText(mockProductDetail.name).length).toBeGreaterThan(0);
  });

  test("renders reviews section (section 18)", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    // Reviews heading
    expect(screen.getByRole("heading", { name: /đánh giá/i })).toBeInTheDocument();
  });

  test("renders related stores section heading (section 19)", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByRole("heading", { name: /cùng shop utc/i })).toBeInTheDocument();
  });

  test("renders best sellers section heading (section 20)", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByRole("heading", { name: /bán chạy cùng ngành/i })).toBeInTheDocument();
  });

  test("renders product breadcrumb", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
  });

  test("renders store card", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    // Store name appears in store card (also in breadcrumb, so use getAllByText)
    expect(
      screen.getAllByText("UTC Fashion Official").length,
    ).toBeGreaterThan(0);
  });
});

// ── Subplan A (2026-10-18) — wire ProductCtaButtons → useAddToCart ──────
describe("ProductDetailPage – wire cart CTA (2026-10-18)", () => {
  beforeEach(() => {
    mockAddMutateAsync.mockReset();
    mockPush.mockReset();
    mockUseAuth.mockReset();
  });

  test("click 'Thêm vào giỏ' gọi useAddToCart với variantId + quantity khi user đã login", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
    mockAddMutateAsync.mockResolvedValue({});

    const user = userEvent.setup();
    // Product KHÔNG có flashSale để CTA ở standard mode (2 buttons).
    const standardProduct = {
      ...mockProductDetail,
      flashSales: [],
    };
    render(<ProductDetailPage product={standardProduct} />, {
      wrapper: TestWrapper,
    });

    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    await user.click(addBtn);

    expect(mockAddMutateAsync).toHaveBeenCalledTimes(1);
    // Phải truyền { variantId: number, quantity: number }
    const arg = mockAddMutateAsync.mock.calls[0][0];
    expect(arg).toMatchObject({ quantity: expect.any(Number) });
    expect(typeof arg.variantId).toBe("number");
  });

  test("click 'Thêm vào giỏ' redirect /login khi user CHƯA đăng nhập", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
    });

    const user = userEvent.setup();
    const standardProduct = {
      ...mockProductDetail,
      flashSales: [],
    };
    render(<ProductDetailPage product={standardProduct} />, {
      wrapper: TestWrapper,
    });

    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    await user.click(addBtn);

    // Không gọi API cart
    expect(mockAddMutateAsync).not.toHaveBeenCalled();
    // Redirect về /login?redirect=...
    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0];
    expect(pushedUrl).toMatch(/^\/login\?redirect=/);
  });

  test("click 'Mua ngay' gọi useAddToCart + navigate /checkout khi user đã login", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
    mockAddMutateAsync.mockResolvedValue({});

    const user = userEvent.setup();
    render(<ProductDetailPage product={mockProductDetail} />, {
      wrapper: TestWrapper,
    });

    // mockProductDetail có flashSale ACTIVE → CTA ở flash mode (1 button).
    const buyBtn = screen.getByRole("button", {
      name: /Mua ngay.*Giữ hàng 5 phút/,
    });
    await user.click(buyBtn);

    // Phải add to cart trước rồi mới navigate.
    expect(mockAddMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/checkout");
  });
});
