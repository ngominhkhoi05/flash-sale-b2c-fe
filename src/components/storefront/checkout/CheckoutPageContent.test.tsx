/**
 * Test cho CheckoutPageContent — Subplan C (2026-10-18).
 *
 * Verify:
 *  - useMockData=false (default) calls real useCheckout.
 *  - Render empty state + back-to-shopping button khi cart rỗng.
 *  - Render error state + retry button khi useCheckout lỗi.
 *  - Render normal checkout UI khi useCheckout có data.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckoutPageContent } from "./CheckoutPageContent";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { CheckoutData } from "@/features/checkout";
import { mockCheckoutData } from "@/features/checkout";

// ── Mock hooks ──────────────────────────────────────────────────────────────
const mockUseCheckout = vi.fn();
const mockUseApplyVoucher = { mutateAsync: vi.fn() };
const mockUseSubmitOrder = { mutateAsync: vi.fn(), isPending: false };
const mockUseAvailableVouchers = vi.fn();
const mockPush = vi.fn();

vi.mock("@/features/checkout", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/checkout")>(
      "@/features/checkout",
    );
  return {
    ...actual,
    useCheckout: () => mockUseCheckout(),
    useApplyVoucherMutation: () => mockUseApplyVoucher,
    useSubmitOrderMutation: () => mockUseSubmitOrder,
    useAvailableVouchers: () => mockUseAvailableVouchers(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/checkout",
  useSearchParams: () => new URLSearchParams(),
}));

// ── Sample data ──────────────────────────────────────────────────────────────
const EMPTY_CART: CheckoutData = {
  ...mockCheckoutData,
  shopGroups: [],
  totalItems: 0,
  totalOrders: 0,
  grandTotal: 0,
};

const HAS_ITEMS: CheckoutData = mockCheckoutData;

// ── Helpers ─────────────────────────────────────────────────────────────────
function withWrapper(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  mockUseCheckout.mockReset();
  mockUseAvailableVouchers.mockReset();
  mockUseApplyVoucher.mutateAsync.mockReset();
  mockUseSubmitOrder.mutateAsync.mockReset();
  mockUseSubmitOrder.isPending = false;
  mockPush.mockReset();
  // Default: cart has items + no vouchers
  mockUseAvailableVouchers.mockReturnValue({ data: [] });
});

describe("CheckoutPageContent (Subplan C 2026-10-18)", () => {
  it("render normal checkout UI khi useCheckout có data", () => {
    mockUseCheckout.mockReturnValue({
      data: HAS_ITEMS,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    withWrapper(<CheckoutPageContent />);
    // Tổng tiền hiện trong summary (1+ lần tuỳ UI)
    expect(screen.getByTestId("checkout-page")).toBeInTheDocument();
  });

  it("render empty state với 'Quay lại mua sắm' khi cart rỗng", () => {
    mockUseCheckout.mockReturnValue({
      data: EMPTY_CART,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    withWrapper(<CheckoutPageContent />);
    // Empty state copy (i18n key) — fallback cho 'en'
    const emptyBtn = screen.getByRole("button", {
      name: /Quay lại giỏ hàng|Back to cart/,
    });
    expect(emptyBtn).toBeInTheDocument();
  });

  it("click 'Quay lại mua sắm' navigate khi cart rỗng", async () => {
    mockUseCheckout.mockReturnValue({
      data: EMPTY_CART,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    withWrapper(<CheckoutPageContent />);
    const emptyBtn = screen.getByRole("button", {
      name: /Quay lại giỏ hàng|Back to cart/,
    });
    await user.click(emptyBtn);
    // Có thể push('/') hoặc push('/cart') — tuỳ implementation. Cứ check có push.
    expect(mockPush).toHaveBeenCalled();
  });

  it("render error state với retry button khi useCheckout lỗi", () => {
    const mockRefetch = vi.fn();
    mockUseCheckout.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });
    withWrapper(<CheckoutPageContent />);
    // ErrorState component có button "Thử lại" / "Retry"
    const retryBtn = screen.getByRole("button", { name: /Thử lại|Retry/ });
    expect(retryBtn).toBeInTheDocument();
  });
});
