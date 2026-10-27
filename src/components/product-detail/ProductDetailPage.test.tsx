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
import { mockProductDetail, type ProductDetail } from "@/features/products";

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

  // 2026-10-19 regression guard: trước khi auth store hydrate từ localStorage,
  // isAuthenticated = false nhưng isHydrated = false. Click sớm sẽ bị
  // redirect /login oan. Fix: requireAuthOrRedirect phải đợi isHydrated = true.
  test("click 'Thêm vào giỏ' KHÔNG redirect khi isHydrated=false (đợi store hydrate)", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: false, // store chưa hydrate từ localStorage
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

    // Khi chưa hydrate, KHÔNG được redirect và KHÔNG gọi mutate (vì user chưa xác thực).
    // Đây là defensive guard: button nên disabled ở hydration phase,
    // nhưng nếu click xuyên qua thì KHÔNG được redirect /login oan.
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockAddMutateAsync).not.toHaveBeenCalled();
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

  test("tierVariationConfigs là Source of Truth: chỉ hiển thị đúng số options trong configs, không hiển thị thừa từ variants", () => {
    // Giả lập case người dùng gặp:
    // Response có tierVariationConfigs chỉ định nghĩa 2 màu ("Black", "White")
    // Nhưng variants chứa 4 màu khác nhau ("Green", "Black", "Gray", "Red")
    const product = {
      ...mockProductDetail,
      flashSales: [],
      tierVariationConfigs: [
        { name: "Color", options: ["Black", "White"] },
      ],
      variants: [
        {
          id: 101,
          productId: 1,
          sku: "V-GREEN",
          variantName: "Green",
          attributes: { Color: "Green" },
          originalPrice: 100000,
          stockQuantity: 10,
          imageUrl: null,
          status: "ACTIVE" as const,
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-01T00:00:00Z",
        },
        {
          id: 102,
          productId: 1,
          sku: "V-BLACK",
          variantName: "Black",
          attributes: { Color: "Black" },
          originalPrice: 100000,
          stockQuantity: 10,
          imageUrl: null,
          status: "ACTIVE" as const,
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-01T00:00:00Z",
        },
        {
          id: 103,
          productId: 1,
          sku: "V-GRAY",
          variantName: "Gray",
          attributes: { Color: "Gray" },
          originalPrice: 100000,
          stockQuantity: 10,
          imageUrl: null,
          status: "ACTIVE" as const,
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-01T00:00:00Z",
        },
        {
          id: 104,
          productId: 1,
          sku: "V-WHITE",
          variantName: "White",
          attributes: { Color: "White" },
          originalPrice: 100000,
          stockQuantity: 10,
          imageUrl: null,
          status: "ACTIVE" as const,
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-01T00:00:00Z",
        },
      ],
    };

    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    // Phải hiển thị đúng tên tier "Color:" và 2 màu từ tierVariationConfigs
    expect(screen.getByText("Color:")).toBeInTheDocument();
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();

    // TUYỆT ĐỐI KHÔNG hiển thị các màu thừa từ variants ("Green", "Gray")
    expect(screen.queryByText("Green")).not.toBeInTheDocument();
    expect(screen.queryByText("Gray")).not.toBeInTheDocument();
  });

  test("sparse variants (e.g. L-Blue 334, XXL-Green 473): hiển thị đúng stock từng variant (không cộng dồn 807) và không bị disabled oan", async () => {
    const user = userEvent.setup();
    const product: ProductDetail = {
      ...mockProductDetail,
      id: 8,
      name: "Den ban Mini #8",
      flashSales: [],
      tierVariationConfigs: [
        { name: "Size", options: ["L", "XXL"] },
        { name: "Color", options: ["Blue"] },
      ],
      variants: [
        {
          id: 20,
          productId: 8,
          sku: "PRD-00008-V1",
          variantName: "Variant 1 of #8",
          attributes: { size: "L", color: "Blue", variant_index: "1" },
          originalPrice: 10000,
          stockQuantity: 334,
          imageUrl: null,
          status: "ACTIVE" as const,
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 21,
          productId: 8,
          sku: "PRD-00008-V2",
          variantName: "Variant 2 of #8",
          attributes: { size: "XXL", color: "Blue", variant_index: "2" },
          originalPrice: 10000,
          stockQuantity: 473,
          imageUrl: null,
          status: "ACTIVE" as const,
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
      ],
    };

    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    const xxlBtn = screen.getByRole("button", { name: "XXL" });
    expect(xxlBtn).not.toBeDisabled();

    // Mặc định chọn L - Blue -> Tồn kho hiển thị là 334 (KHÔNG phải tổng 807)
    expect(screen.getByText("334")).toBeInTheDocument();
    expect(screen.queryByText("807")).not.toBeInTheDocument();

    // Click XXL -> Cập nhật tồn kho thành 473 của XXL - Blue
    await user.click(xxlBtn);
    expect(screen.getByText("473")).toBeInTheDocument();
    expect(screen.queryByText("807")).not.toBeInTheDocument();
  });

  test("Smart Auto-Switch chuẩn Shopee: không khóa chéo các option còn hàng và tự động chuyển đổi tổ hợp hợp lệ khi click", async () => {
    const user = userEvent.setup();
    const product: ProductDetail = {
      ...mockProductDetail,
      flashSales: [],
      tierVariationConfigs: [
        { name: "Size", options: ["L", "M", "S"] },
        { name: "Color", options: ["Black", "Green", "Pink"] },
      ],
      variants: [
        // L chỉ có Black và Green (KHÔNG có Pink)
        {
          id: 1,
          productId: 1,
          sku: "VAR-L-BLACK",
          variantName: "L, Black",
          attributes: { Size: "L", Color: "Black" },
          originalPrice: 10000,
          stockQuantity: 10,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 2,
          productId: 1,
          sku: "VAR-L-GREEN",
          variantName: "L, Green",
          attributes: { Size: "L", Color: "Green" },
          originalPrice: 10000,
          stockQuantity: 15,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        // M có Black, Green, Pink
        {
          id: 3,
          productId: 1,
          sku: "VAR-M-BLACK",
          variantName: "M, Black",
          attributes: { Size: "M", Color: "Black" },
          originalPrice: 10000,
          stockQuantity: 20,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 4,
          productId: 1,
          sku: "VAR-M-GREEN",
          variantName: "M, Green",
          attributes: { Size: "M", Color: "Green" },
          originalPrice: 10000,
          stockQuantity: 25,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 5,
          productId: 1,
          sku: "VAR-M-PINK",
          variantName: "M, Pink",
          attributes: { Size: "M", Color: "Pink" },
          originalPrice: 10000,
          stockQuantity: 30,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        // S có Pink
        {
          id: 6,
          productId: 1,
          sku: "VAR-S-PINK",
          variantName: "S, Pink",
          attributes: { Size: "S", Color: "Pink" },
          originalPrice: 10000,
          stockQuantity: 12,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
      ],
    };

    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    const lBtn = screen.getByRole("button", { name: "L" });
    const pinkBtn = screen.getByRole("button", { name: /Pink/ });

    // 1. Khi đang chọn L (L-Black 10 cái):
    // Pink KHÔNG bị disabled vì Pink vẫn còn hàng ở M (30) và S (12)!
    expect(pinkBtn).not.toBeDisabled();
    expect(screen.getByText("10")).toBeInTheDocument();

    // 2. Click Pink: Smart Auto-Switch tự động đổi Size sang M (candidate tốt nhất của Pink)
    await user.click(pinkBtn);
    expect(screen.getByRole("button", { name: "M" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("30")).toBeInTheDocument();

    // 3. Đang chọn M-Pink, click L: L không bị disabled và tự động đổi màu sang Black (hợp lệ với L)
    expect(lBtn).not.toBeDisabled();
    await user.click(lBtn);
    expect(lBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Black/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  test("sparse orthogonal variants (Tui xach Mini #3: L-Yellow 133, S-White 427): không bị deadlock, click White tự switch S, click Yellow tự switch L", async () => {
    const user = userEvent.setup();
    const product: ProductDetail = {
      ...mockProductDetail,
      id: 3,
      name: "Tui xach Mini #3",
      flashSales: [],
      tierVariationConfigs: [
        { name: "Size", options: ["S", "L"] },
        { name: "Color", options: ["Yellow", "White"] },
      ],
      variants: [
        {
          id: 6,
          productId: 3,
          sku: "PRD-00003-V1",
          variantName: "Variant 1 of #3",
          attributes: { size: "L", color: "Yellow", variant_index: "1" },
          originalPrice: 100000,
          stockQuantity: 133,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 7,
          productId: 3,
          sku: "PRD-00003-V2",
          variantName: "Variant 2 of #3",
          attributes: { size: "S", color: "White", variant_index: "2" },
          originalPrice: 100000,
          stockQuantity: 427,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
      ],
    };

    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    const sBtn = screen.getByRole("button", { name: "S" });
    const lBtn = screen.getByRole("button", { name: "L" });
    const yellowBtn = screen.getByRole("button", { name: /Yellow/ });
    const whiteBtn = screen.getByRole("button", { name: /White/ });

    // Không nút nào bị disabled oan
    expect(sBtn).not.toBeDisabled();
    expect(lBtn).not.toBeDisabled();
    expect(yellowBtn).not.toBeDisabled();
    expect(whiteBtn).not.toBeDisabled();

    // Mặc định chọn L - Yellow (133 tồn kho)
    expect(lBtn).toHaveAttribute("aria-pressed", "true");
    expect(yellowBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("133")).toBeInTheDocument();

    // Click White -> Smart Auto-Switch tự động chuyển sang S - White (427 tồn kho)
    await user.click(whiteBtn);
    expect(sBtn).toHaveAttribute("aria-pressed", "true");
    expect(whiteBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("427")).toBeInTheDocument();

    // Click Yellow -> Smart Auto-Switch tự động chuyển lại sang L - Yellow (133 tồn kho)
    await user.click(yellowBtn);
    expect(lBtn).toHaveAttribute("aria-pressed", "true");
    expect(yellowBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("133")).toBeInTheDocument();

    // Click S -> Smart Auto-Switch tự động chuyển sang S - White (427 tồn kho)
    await user.click(sBtn);
    expect(sBtn).toHaveAttribute("aria-pressed", "true");
    expect(whiteBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("427")).toBeInTheDocument();
  });

  test("option hết hàng thực sự (0 tồn kho trên mọi variant) bị disabled và hiển thị nhãn Hết hàng", () => {
    const product: ProductDetail = {
      ...mockProductDetail,
      flashSales: [],
      tierVariationConfigs: [
        { name: "Size", options: ["M", "XL"] },
        { name: "Color", options: ["Black"] },
      ],
      variants: [
        {
          id: 1,
          productId: 1,
          sku: "VAR-M-BLACK",
          variantName: "M, Black",
          attributes: { Size: "M", Color: "Black" },
          originalPrice: 10000,
          stockQuantity: 10,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 2,
          productId: 1,
          sku: "VAR-XL-BLACK",
          variantName: "XL, Black",
          attributes: { Size: "XL", Color: "Black" },
          originalPrice: 10000,
          stockQuantity: 0, // Hết hàng
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
      ],
    };

    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    const mBtn = screen.getByRole("button", { name: "M" });
    const xlBtn = screen.getByRole("button", { name: /XL/ });

    expect(mBtn).not.toBeDisabled();
    expect(xlBtn).toBeDisabled();
    expect(xlBtn).toHaveAttribute("aria-disabled", "true");
  });

  test("cập nhật giá chính xác theo biến thể được chọn (vd: L-green 9.000₫ -> M-red 100.000₫)", async () => {
    const user = userEvent.setup();
    const product: ProductDetail = {
      ...mockProductDetail,
      flashSales: [],
      minPrice: 9000,
      maxPrice: 100000,
      discountPercent: null,
      tierVariationConfigs: [
        { name: "Size", options: ["L", "M"] },
        { name: "Color", options: ["Green", "Red"] },
      ],
      variants: [
        {
          id: 1,
          productId: 1,
          sku: "VAR-L-GREEN",
          variantName: "L, Green",
          attributes: { Size: "L", Color: "Green" },
          originalPrice: 9000,
          stockQuantity: 50,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 2,
          productId: 1,
          sku: "VAR-L-RED",
          variantName: "L, Red",
          attributes: { Size: "L", Color: "Red" },
          originalPrice: 12000,
          stockQuantity: 40,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
        {
          id: 3,
          productId: 1,
          sku: "VAR-M-RED",
          variantName: "M, Red",
          attributes: { Size: "M", Color: "Red" },
          originalPrice: 100000,
          stockQuantity: 30,
          imageUrl: null,
          status: "ACTIVE",
          isDisabled: false,
          version: 0,
          createdAt: "2026-10-18T14:36:04Z",
        },
      ],
    };

    render(<ProductDetailPage product={product} />, { wrapper: TestWrapper });

    const priceEl = screen.getByTestId("standard-price");

    // Ban đầu biến thể active đầu tiên (L - Green) được chọn -> Giá hiển thị là 9.000₫
    expect(priceEl).toHaveTextContent("9.000₫");

    // Click chọn Red (L - Red có giá 12.000₫)
    const redBtn = screen.getByRole("button", { name: /Red/ });
    await user.click(redBtn);
    expect(priceEl).toHaveTextContent("12.000₫");

    // Chọn tiếp Size M (M - Red có giá 100.000₫)
    const mBtn = screen.getByRole("button", { name: "M" });
    await user.click(mBtn);

    // Giá lập tức cập nhật sang 100.000₫ của biến thể M - Red
    expect(priceEl).toHaveTextContent("100.000₫");
  });
});


