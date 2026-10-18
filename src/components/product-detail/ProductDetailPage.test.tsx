/**
 * Integration test for Product Detail Page (SP6).
 *
 * Verifies the page renders with all sections including:
 * - ProductReviewsCard, ProductRelatedStores, ProductBestSellers (new)
 * - Layout structure follows Stitch 12-col grid
 */
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import { TestWrapper } from "@/__tests__/test-wrapper";
import { mockProductDetail } from "@/features/products";

// Mock useAddToCart (cart) + useRouter (navigation)
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

// default mock: isAuthenticated = true
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
    expect(screen.getAllByText(mockProductDetail.name).length).toBeGreaterThan(0);
  });

  test("renders reviews section (section 18)", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
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
    expect(
      screen.getAllByText("UTC Fashion Official").length,
    ).toBeGreaterThan(0);
  });
});

// Subplan A (2026-10-18) - wire ProductCtaButtons to useAddToCart
describe("ProductDetailPage - wire cart CTA (2026-10-18)", () => {
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

    expect(mockAddMutateAsync).not.toHaveBeenCalled();
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

    const buyBtn = screen.getByRole("button", {
      name: /Mua ngay.*Giữ hàng 5 phút/,
    });
    await user.click(buyBtn);

    expect(mockAddMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/checkout");
  });
});

// Subplan B (2026-10-18) - auto-switch UX when variantForCurrent undefined
describe("ProductDetailPage - auto-switch UX (2026-10-18)", () => {
  beforeEach(() => {
    mockAddMutateAsync.mockReset();
    mockPush.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
  });

  test("auto-switch: khi combo (color, size) chọn không match variant ACTIVE, tự pick variant ACTIVE đầu tiên", async () => {
    // Disable all variants EXCEPT (Trắng Tinh Khôi, M) and (Trắng Tinh Khôi, L).
    // Default selection = (Trắng Tinh Khôi, S) from mock, which is disabled.
    // -> auto-pick should pick one of the 2 active variants.
    const product = {
      ...mockProductDetail,
      flashSales: [],
      variants: mockProductDetail.variants.map((v) => ({
        ...v,
        isDisabled:
          v.attributes.Color === "Trắng Tinh Khôi" && v.attributes.Size === "M"
            ? false
            : v.attributes.Color === "Trắng Tinh Khôi" &&
                v.attributes.Size === "L"
              ? false
              : true,
      })),
    };
    mockAddMutateAsync.mockResolvedValue({});

    const user = userEvent.setup();
    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    await user.click(addBtn);

    expect(mockAddMutateAsync).toHaveBeenCalledTimes(1);
    const arg = mockAddMutateAsync.mock.calls[0][0];
    expect(typeof arg.variantId).toBe("number");
    expect(arg.variantId).toBeGreaterThan(0);
  });

  test("CTA disabled với tooltip 'out of stock' khi product có 0 variant ACTIVE", () => {
    const product = {
      ...mockProductDetail,
      flashSales: [],
      variants: mockProductDetail.variants.map((v) => ({
        ...v,
        isDisabled: true,
        stockQuantity: 0,
      })),
    };

    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    const buyBtn = screen.getByRole("button", { name: /Mua Ngay/ });

    expect(addBtn).toBeDisabled();
    expect(buyBtn).toBeDisabled();

    expect(addBtn).toHaveAttribute(
      "title",
      expect.stringMatching(/hết hàng|out of stock/i),
    );
  });
});
