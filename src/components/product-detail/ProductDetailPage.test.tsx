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

// Subplan C (2026-10-18): mock useAddToCart giữ onError callback để test
// i18n error mapping. Hook thật (TanStack Query) tự gọi options.onError khi
// mutateAsync reject — mock phải replicate behavior này.
let capturedOnError:
  | ((error: unknown, variables: unknown) => void)
  | undefined;

vi.mock("@/features/cart", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/cart")>("@/features/cart");
  return {
    ...actual,
    useAddToCart: (options?: {
      onSuccess?: (data: unknown, variables: unknown) => void;
      onError?: (error: unknown, variables: unknown) => void;
    }) => {
      capturedOnError = options?.onError;
      return {
        mutateAsync: mockAddMutateAsync,
        isPending: false,
      };
    },
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

// Subplan C (2026-10-18): mock sonner toast để verify error mapping
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastInfo = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
  },
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

// Subplan C (2026-10-18) - i18n error mapping: ApiError.code -> message
// Bug: code "HTTP_401" không tồn tại trong productDetail.toast.cartError.*
// nên next-intl throw MISSING_MESSAGE warning. Fix: map qua namespace `error.*`
// chung (i18n.mdc mục 5) + fallback về productDetail.toast.cartError.GENERIC.
describe("ProductDetailPage - cart error i18n mapping (2026-10-18)", () => {
  beforeEach(() => {
    mockAddMutateAsync.mockReset();
    mockPush.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
    mockToastError.mockReset();
    mockToastSuccess.mockReset();
    mockToastInfo.mockReset();
  });

  test("khi useAddToCart throw ApiError code='HTTP_401' (HTTP fallback), fallback về cartError.GENERIC (không MISSING_MESSAGE)", async () => {
    // Arrange: import ApiError để tạo instance đúng shape
    const { ApiError } = await import("@/lib/api/client");
    const apiErr = new ApiError({
      status: 401,
      code: "HTTP_401",
      message: "Unauthorized",
    });

    const standardProduct = {
      ...mockProductDetail,
      flashSales: [],
    };

    // Spy console.error để verify KHÔNG có MISSING_MESSAGE warning
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ProductDetailPage product={standardProduct} />, {
      wrapper: TestWrapper,
    });

    expect(capturedOnError).toBeDefined();

    // Act: gọi captured onError trực tiếp (mock mất TanStack Query nên fire manually)
    const vars = { variantId: 1, quantity: 1 };
    capturedOnError!(apiErr, vars);

    // Assert 1: toast.error được gọi với fallback message (vì error.HTTP_401 không tồn tại)
    expect(mockToastError).toHaveBeenCalled();
    const callArg = mockToastError.mock.calls[0]?.[0];
    expect(callArg).toBe("Không thể cập nhật giỏ hàng. Vui lòng thử lại.");

    // Assert 2: KHÔNG có MISSING_MESSAGE warning trong console (bug gốc)
    const missingMessageCalls = errSpy.mock.calls.filter((args) =>
      String(args[0] ?? "").includes("MISSING_MESSAGE"),
    );
    expect(missingMessageCalls).toHaveLength(0);

    errSpy.mockRestore();
  });

  test("khi useAddToCart throw ApiError code='UNAUTHORIZED' (proper code), dùng error.UNAUTHORIZED tiếng Việt", async () => {
    // Arrange: BE trả code semantic "UNAUTHORIZED" (không phải HTTP fallback)
    const { ApiError } = await import("@/lib/api/client");
    const apiErr = new ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Phiên đăng nhập đã hết hạn",
    });

    const standardProduct = {
      ...mockProductDetail,
      flashSales: [],
    };

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ProductDetailPage product={standardProduct} />, {
      wrapper: TestWrapper,
    });

    expect(capturedOnError).toBeDefined();
    capturedOnError!(apiErr, { variantId: 1, quantity: 1 });

    // Assert: message = error.UNAUTHORIZED (mapping đúng)
    expect(mockToastError).toHaveBeenCalledWith(
      "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
    );

    errSpy.mockRestore();
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
