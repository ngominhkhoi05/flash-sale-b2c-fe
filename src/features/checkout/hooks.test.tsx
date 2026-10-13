/**
 * Checkout hooks test — RED tests viết trước khi implement (rule testing-required).
 *
 * Tests the new API surface wired to:
 *  - GET /api/v1/cart
 *  - GET /api/v1/users/addresses
 *  - GET /api/v1/vouchers/platform, /vouchers/store/{id}
 *  - POST /api/v1/vouchers/apply
 *  - POST /api/v1/orders/checkout
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  checkoutKeys,
  useCheckout,
  useAddresses,
  useAvailableVouchers,
  useApplyVoucherMutation,
  useSubmitOrderMutation,
} from "./hooks";
import type { CheckoutData } from "./types";

// ── Mock api layer (rule api-data) ────────────────────────────────────────
const mockGetCheckout = vi.fn();
const mockGetAddresses = vi.fn();
const mockGetAvailableVouchers = vi.fn();
const mockApplyVoucher = vi.fn();
const mockSubmitOrder = vi.fn();

vi.mock("./api", () => ({
  getCheckout: () => mockGetCheckout(),
  getAddresses: () => mockGetAddresses(),
  getAvailableVouchers: (input: unknown) =>
    mockGetAvailableVouchers(input),
  applyVoucher: (input: unknown) => mockApplyVoucher(input),
  submitOrder: (payload: unknown, key: string) =>
    mockSubmitOrder(payload, key),
}));

// ── Helpers ───────────────────────────────────────────────────────────────
function withQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

const MOCK_CHECKOUT: CheckoutData = {
  id: "ck-1",
  userId: 42,
  selectedAddress: null,
  addresses: [],
  shopGroups: [],
  goodsSubtotal: 1000000,
  shippingFee: 30000,
  totalDiscount: 50000,
  grandTotal: 980000,
  appliedPlatformVoucher: null,
  paymentMethod: "ZALOPAY",
  totalItems: 3,
  totalOrders: 2,
};

beforeEach(() => {
  [
    mockGetCheckout,
    mockGetAddresses,
    mockGetAvailableVouchers,
    mockApplyVoucher,
    mockSubmitOrder,
  ].forEach((m) => m.mockReset());
});

// ── Tests ────────────────────────────────────────────────────────────────
describe("checkoutKeys", () => {
  it("builds canonical key shape", () => {
    expect(checkoutKeys.all).toEqual(["checkout"]);
    expect(checkoutKeys.detail()).toEqual(["checkout", "detail"]);
    expect(checkoutKeys.addresses()).toEqual(["checkout", "addresses"]);
    expect(checkoutKeys.vouchers("SHOP", 1)).toEqual([
      "checkout",
      "vouchers",
      "SHOP",
      1,
    ]);
  });
});

describe("useCheckout", () => {
  it("fetches checkout snapshot and exposes data", async () => {
    mockGetCheckout.mockResolvedValue(MOCK_CHECKOUT);
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCheckout(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_CHECKOUT);
    expect(mockGetCheckout).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = withQueryClient();
    renderHook(() => useCheckout(false), { wrapper });
    expect(mockGetCheckout).not.toHaveBeenCalled();
  });
});

describe("useAddresses", () => {
  it("fetches addresses", async () => {
    mockGetAddresses.mockResolvedValue([]);
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useAddresses(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mockGetAddresses).toHaveBeenCalledTimes(1);
  });
});

describe("useAvailableVouchers", () => {
  it("fetches platform vouchers when scope=PLATFORM", async () => {
    mockGetAvailableVouchers.mockResolvedValue([]);
    const { wrapper } = withQueryClient();
    const { result } = renderHook(
      () => useAvailableVouchers("PLATFORM"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetAvailableVouchers).toHaveBeenCalledWith({
      scope: "PLATFORM",
      storeId: undefined,
    });
  });

  it("fetches shop vouchers when scope=SHOP with storeId", async () => {
    mockGetAvailableVouchers.mockResolvedValue([]);
    const { wrapper } = withQueryClient();
    const { result } = renderHook(
      () => useAvailableVouchers("SHOP", 5),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetAvailableVouchers).toHaveBeenCalledWith({
      scope: "SHOP",
      storeId: 5,
    });
  });
});

describe("useApplyVoucherMutation", () => {
  it("calls apply API with voucherCode + orderAmount", async () => {
    mockApplyVoucher.mockResolvedValue({
      applied: true,
      voucher: {
        id: 1,
        code: "VIBE10",
        label: "Giảm 10K",
        scope: "PLATFORM",
      },
      grandTotal: 990000,
      totalDiscount: 10000,
    });

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useApplyVoucherMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({
        voucherCode: "VIBE10",
        orderAmount: 1_000_000,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApplyVoucher).toHaveBeenCalledWith({
      voucherCode: "VIBE10",
      orderAmount: 1_000_000,
    });
  });
});

describe("useSubmitOrderMutation", () => {
  it("calls API with payload + idempotency key and invalidates queries", async () => {
    mockSubmitOrder.mockResolvedValue({
      orderCode: "FS-261013-AAAA",
      orderIds: [101, 102],
      status: "PENDING_PAYMENT",
      paymentUrl: "https://sandbox.zalopay.vn/...",
      qrCodeUrl: "https://...",
      expiresAt: "2026-10-13T20:00:00Z",
    });

    const { wrapper, qc } = withQueryClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSubmitOrderMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({
        payload: {
          addressId: 1,
          paymentMethod: "ZALOPAY",
          platformVoucherCode: "VIBE10",
          shopSelections: [
            { storeId: 1, shopVoucherCode: "SHOP5" },
          ],
        },
        idempotencyKey: "test-key-1",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitOrder).toHaveBeenCalledWith(
      {
        addressId: 1,
        paymentMethod: "ZALOPAY",
        platformVoucherCode: "VIBE10",
        shopSelections: [{ storeId: 1, shopVoucherCode: "SHOP5" }],
      },
      "test-key-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cart"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: checkoutKeys.all,
    });
  });
});
