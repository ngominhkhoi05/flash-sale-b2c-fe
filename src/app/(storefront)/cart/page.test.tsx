/**
 * Test cho /cart page — Subplan B (2026-10-18) wire real cart.
 * Verify:
 *  - Render skeleton fallback khi chưa auth
 *  - Render empty state khi auth + cart trống
 *  - Render items khi auth + cart có data
 *  - Click qty + → gọi useUpdateCartItem
 *  - Click xoá → gọi useRemoveCartItem
 *  - Click "Tiến hành thanh toán" → navigate /checkout
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import GioHangPage from "./page";
import { TestWrapper } from "@/__tests__/test-wrapper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BackendCartResponse } from "@/features/cart";

// ── Mock hooks ──────────────────────────────────────────────────────────────
const mockUseCart = vi.fn();
const mockUpdateMut = { mutate: vi.fn(), isPending: false };
const mockRemoveMut = { mutate: vi.fn(), isPending: false };
const mockClearMut = { mutate: vi.fn(), isPending: false };
const mockPush = vi.fn();

vi.mock("@/features/cart", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/cart")>("@/features/cart");
  return {
    ...actual,
    useCart: () => mockUseCart(),
    useUpdateCartItem: () => mockUpdateMut,
    useRemoveCartItem: () => mockRemoveMut,
    useClearCart: () => mockClearMut,
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/cart",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAuth để AuthGuard có thể test cả 2 trạng thái
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// ── Sample data ──────────────────────────────────────────────────────────────
const MOCK_CART: BackendCartResponse = {
  id: 100,
  userId: 1,
  storeGroups: [
    {
      storeId: 10,
      storeName: "UTC Fashion Official",
      items: [
        {
          id: 501,
          variantId: 2001,
          sku: "TUI-XACH-3-WHITE",
          storeId: 10,
          storeName: "UTC Fashion Official",
          productName: "Túi xách Mini #3",
          variantName: "Trắng Tinh Khôi / S",
          imageUrl: "https://example.com/img1.jpg",
          price: 1290000,
          quantity: 2,
          itemSubtotal: 2580000,
        },
      ],
      storeSubtotal: 2580000,
    },
  ],
  totalItems: 2,
  grandTotal: 2580000,
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function withWrapper(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>,
  );
}

function mockAuthAuthed() {
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
}

// ── Tests ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseCart.mockReset();
  mockUpdateMut.mutate.mockReset();
  mockRemoveMut.mutate.mockReset();
  mockClearMut.mutate.mockReset();
  mockPush.mockReset();
  mockUpdateMut.isPending = false;
  mockRemoveMut.isPending = false;
  mockClearMut.isPending = false;
});

describe("GioHangPage", () => {
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
    withWrapper(<GioHangPage />);
    // Fallback skeleton có class animate-pulse – không có text content
    expect(screen.queryByText("Giỏ hàng của tôi")).not.toBeInTheDocument();
  });

  it("renders EmptyState với title khi authenticated + cart trống", () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: { ...MOCK_CART, storeGroups: [], totalItems: 0, grandTotal: 0 },
      isLoading: false,
      isError: false,
    });
    withWrapper(<GioHangPage />);
    expect(screen.getByText("Giỏ hàng của tôi")).toBeInTheDocument();
    expect(screen.getByText("Giỏ hàng của bạn đang trống")).toBeInTheDocument();
  });

  // ── Subplan B (2026-10-18) — real cart UI ─────────────────────────────
  it("renders cart items khi có data", () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: MOCK_CART,
      isLoading: false,
      isError: false,
    });
    withWrapper(<GioHangPage />);
    // Tên sản phẩm
    expect(screen.getByText("Túi xách Mini #3")).toBeInTheDocument();
    // Tên shop
    expect(screen.getAllByText("UTC Fashion Official").length).toBeGreaterThan(0);
    // Grand total xuất hiện trong summary (dùng data-testid để tránh multiple match).
    expect(screen.getByTestId("cart-summary-total").textContent).toMatch(/2\.580\.000/);
  });

  it("click qty + gọi useUpdateCartItem với {itemId, quantity: 3}", async () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: MOCK_CART,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    withWrapper(<GioHangPage />);
    // aria-label là "Tăng số lượng" cho nút +.
    const incBtn = screen.getByRole("button", { name: /Tăng số lượng/ });
    await user.click(incBtn);

    expect(mockUpdateMut.mutate).toHaveBeenCalledWith({
      itemId: 501,
      quantity: 3,
    });
  });

  it("click qty - gọi useUpdateCartItem với {itemId, quantity: 1}", async () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: MOCK_CART,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    withWrapper(<GioHangPage />);
    const decBtn = screen.getByRole("button", { name: /Giảm số lượng/ });
    await user.click(decBtn);

    expect(mockUpdateMut.mutate).toHaveBeenCalledWith({
      itemId: 501,
      quantity: 1,
    });
  });

  it("vô hiệu hoá nút giảm khi số lượng bằng 1", () => {
    mockAuthAuthed();
    const cartWithQty1 = {
      ...MOCK_CART,
      storeGroups: [
        {
          ...MOCK_CART.storeGroups[0],
          items: [{ ...MOCK_CART.storeGroups[0].items[0], quantity: 1 }],
        },
      ],
    };
    mockUseCart.mockReturnValue({
      data: cartWithQty1,
      isLoading: false,
      isError: false,
    });

    withWrapper(<GioHangPage />);
    const decBtn = screen.getByRole("button", { name: /Giảm số lượng/ });
    expect(decBtn).toBeDisabled();
  });

  it("nhập số lượng mới trực tiếp (ví dụ 4) gọi useUpdateCartItem", async () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: MOCK_CART,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    withWrapper(<GioHangPage />);
    const qtyInput = screen.getByTestId("cart-item-qty");

    await user.clear(qtyInput);
    await user.type(qtyInput, "4{Enter}");

    expect(mockUpdateMut.mutate).toHaveBeenCalledWith({
      itemId: 501,
      quantity: 4,
    });
  });

  it("nhập 0 vào ô số lượng gọi useRemoveCartItem để xoá khỏi giỏ hàng", async () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: MOCK_CART,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    withWrapper(<GioHangPage />);
    const qtyInput = screen.getByTestId("cart-item-qty");

    await user.clear(qtyInput);
    await user.type(qtyInput, "0{Enter}");

    expect(mockRemoveMut.mutate).toHaveBeenCalledWith({
      itemId: 501,
    });
  });

  it("click nút xoá gọi useRemoveCartItem", async () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: MOCK_CART,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    withWrapper(<GioHangPage />);
    // aria-label là "Xoá" cho nút xoá.
    const delBtn = screen.getByRole("button", { name: /Xoá|Xóa|Delete/ });
    await user.click(delBtn);

    expect(mockRemoveMut.mutate).toHaveBeenCalledWith({ itemId: 501 });
  });

  it("click 'Tiến hành thanh toán' navigate /checkout", async () => {
    mockAuthAuthed();
    mockUseCart.mockReturnValue({
      data: MOCK_CART,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    withWrapper(<GioHangPage />);
    // Desktop sticky summary có data-testid="cart-checkout-button".
    const checkoutBtn = screen.getByTestId("cart-checkout-button");
    await user.click(checkoutBtn);

    expect(mockPush).toHaveBeenCalledWith("/checkout");
  });
});
