/**
 * Checkout hooks test — RED tests viết trước khi implement (rule testing-required).
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  checkoutKeys,
  useCheckout,
  useAddresses,
  useAvailableVouchers,
  useSelectAddressMutation,
  useApplyVoucherMutation,
  useRemoveVoucherMutation,
  usePaymentMethodMutation,
  useBuyerNoteMutation,
  useSubmitOrderMutation,
} from "./hooks";
import type { CheckoutData } from "./types";

// ── Mock api layer (rule api-data) ────────────────────────────────────────
const mockGetCheckout = vi.fn();
const mockGetAddresses = vi.fn();
const mockGetAvailableVouchers = vi.fn();
const mockSelectAddress = vi.fn();
const mockApplyVoucher = vi.fn();
const mockRemoveVoucher = vi.fn();
const mockSetPaymentMethod = vi.fn();
const mockUpdateBuyerNote = vi.fn();
const mockSubmitOrder = vi.fn();

vi.mock("./api", () => ({
  getCheckout: () => mockGetCheckout(),
  getAddresses: () => mockGetAddresses(),
  getAvailableVouchers: (input: unknown) =>
    mockGetAvailableVouchers(input),
  selectAddress: (id: number) => mockSelectAddress(id),
  applyVoucher: (input: unknown) => mockApplyVoucher(input),
  removeVoucher: (input: unknown) => mockRemoveVoucher(input),
  setPaymentMethod: (method: string) => mockSetPaymentMethod(method),
  updateBuyerNote: (input: unknown) => mockUpdateBuyerNote(input),
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
    mockSelectAddress,
    mockApplyVoucher,
    mockRemoveVoucher,
    mockSetPaymentMethod,
    mockUpdateBuyerNote,
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
  it("fetches vouchers with scope param", async () => {
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
});

describe("useSelectAddressMutation", () => {
  it("calls API and updates detail cache", async () => {
    const updated = { ...MOCK_CHECKOUT, grandTotal: 1050000 };
    mockSelectAddress.mockResolvedValue(updated);

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(checkoutKeys.detail(), MOCK_CHECKOUT);

    const { result } = renderHook(() => useSelectAddressMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(7);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSelectAddress).toHaveBeenCalledWith(7);
    expect(qc.getQueryData(checkoutKeys.detail())).toEqual(updated);
  });
});

describe("useApplyVoucherMutation", () => {
  it("invalidates detail cache when applied=true", async () => {
    mockApplyVoucher.mockResolvedValue({
      applied: true,
      voucher: {
        id: 1,
        code: "VIBE10",
        label: "Giảm 10K",
        scope: "PLATFORM",
      },
      grandTotal: 990000,
      totalDiscount: 60000,
    });

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(checkoutKeys.detail(), MOCK_CHECKOUT);

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useApplyVoucherMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({
        voucherId: 1,
        scope: "PLATFORM",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApplyVoucher).toHaveBeenCalledWith({
      voucherId: 1,
      scope: "PLATFORM",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: checkoutKeys.detail(),
    });
  });
});

describe("useRemoveVoucherMutation", () => {
  it("calls API and updates detail cache", async () => {
    const updated = { ...MOCK_CHECKOUT, totalDiscount: 0 };
    mockRemoveVoucher.mockResolvedValue(updated);

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(checkoutKeys.detail(), MOCK_CHECKOUT);

    const { result } = renderHook(() => useRemoveVoucherMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ scope: "PLATFORM" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRemoveVoucher).toHaveBeenCalledWith({ scope: "PLATFORM" });
    expect(qc.getQueryData(checkoutKeys.detail())).toEqual(updated);
  });
});

describe("usePaymentMethodMutation", () => {
  it("calls API with COD and patches detail cache", async () => {
    const updated = { ...MOCK_CHECKOUT, paymentMethod: "COD" as const };
    mockSetPaymentMethod.mockResolvedValue(updated);

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(checkoutKeys.detail(), MOCK_CHECKOUT);

    const { result } = renderHook(() => usePaymentMethodMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate("COD");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSetPaymentMethod).toHaveBeenCalledWith("COD");
    expect(qc.getQueryData(checkoutKeys.detail())).toEqual(updated);
  });
});

describe("useBuyerNoteMutation", () => {
  it("patches only the matching shop group", async () => {
    const checkoutWithGroups: CheckoutData = {
      ...MOCK_CHECKOUT,
      shopGroups: [
        {
          storeId: 1,
          storeName: "UTC",
          estimatedDeliveryLabel: "Ngày mai",
          shippingMethodLabel: "Hỏa Tốc",
          shippingFee: 15000,
          shopSubtotal: 500000,
          items: [],
          buyerNote: "",
        },
        {
          storeId: 2,
          storeName: "TechZone",
          estimatedDeliveryLabel: "2-3 ngày",
          shippingMethodLabel: "Tiết kiệm",
          shippingFee: 15000,
          shopSubtotal: 700000,
          items: [],
          buyerNote: "Cũ",
        },
      ],
    };
    const updatedGroup = {
      storeId: 1,
      storeName: "UTC",
      estimatedDeliveryLabel: "Ngày mai",
      shippingMethodLabel: "Hỏa Tốc",
      shippingFee: 15000,
      shopSubtotal: 500000,
      items: [],
      buyerNote: "Mới",
    };
    mockUpdateBuyerNote.mockResolvedValue(updatedGroup);

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(checkoutKeys.detail(), checkoutWithGroups);

    const { result } = renderHook(() => useBuyerNoteMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: 1, note: "Mới" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const after = qc.getQueryData(checkoutKeys.detail()) as CheckoutData;
    expect(after.shopGroups[0].buyerNote).toBe("Mới");
    expect(after.shopGroups[1].buyerNote).toBe("Cũ");
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
          shopSelections: [],
        },
        idempotencyKey: "test-key-1",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitOrder).toHaveBeenCalledWith(
      {
        addressId: 1,
        paymentMethod: "ZALOPAY",
        shopSelections: [],
      },
      "test-key-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cart"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: checkoutKeys.all,
    });
  });
});
