/**
 * applyVoucher test — RED tests viết TRƯỚC khi sửa code
 * (rule testing-required.mdc: TDD bắt buộc).
 *
 * Coverage:
 * - M.1: applyVoucher request body dùng { code, subtotalAmount }
 *   (thay vì { orderAmount, voucherCode, storeId? })
 * - M.2: applyVoucher response adapt từ VoucherCalculationResponse mới
 *   (thay vì BackendVoucherCalculation cũ có full voucher object)
 * - M.3: BackendCartResponse có totalAmount + grandTotal (từ Swagger 2026-10-17)
 * - M.4: BackendCartItem có stockQuantity
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { applyVoucher, submitOrder } from "./api";
import { apiFetch } from "@/lib/api";

// Mock apiFetch module-level
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(params: { code: string; message: string; status: number }) {
      super(params.message);
      this.name = "ApiError";
      this.code = params.code;
      this.status = params.status;
    }
  },
}));

const mockApiFetch = vi.mocked(apiFetch);

describe("applyVoucher", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── M.1: Request body phải match Swagger mới ────────────────────────
  it("sends { code, subtotalAmount } in request body (M.1)", async () => {
    mockApiFetch.mockResolvedValue({
      voucherId: 5,
      code: "VIBE10",
      discountAmount: 10000,
      finalAmount: 990000,
    });

    await applyVoucher({
      voucherCode: "VIBE10",
      orderAmount: 1_000_000,
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/vouchers/apply",
      expect.objectContaining({
        method: "POST",
        json: {
          code: "VIBE10",
          subtotalAmount: 1_000_000,
        },
      }),
    );
  });

  it("includes storeId in request when provided (M.1)", async () => {
    mockApiFetch.mockResolvedValue({
      voucherId: 7,
      code: "SHOP5",
      discountAmount: 5000,
      finalAmount: 95_000,
    });

    await applyVoucher({
      voucherCode: "SHOP5",
      orderAmount: 100_000,
      storeId: 3,
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/vouchers/apply",
      expect.objectContaining({
        json: {
          code: "SHOP5",
          subtotalAmount: 100_000,
          storeId: 3,
        },
      }),
    );
  });

  it("does NOT include storeId when not provided", async () => {
    mockApiFetch.mockResolvedValue({
      voucherId: 1,
      code: "VIBE10",
      discountAmount: 0,
      finalAmount: 1_000_000,
    });

    await applyVoucher({
      voucherCode: "VIBE10",
      orderAmount: 1_000_000,
    });

    const callArgs = mockApiFetch.mock.calls[0]?.[1] as
      | { json?: Record<string, unknown> }
      | undefined;
    expect(callArgs?.json).not.toHaveProperty("storeId");
  });

  // ── M.2: Response phải adapt từ VoucherCalculationResponse mới ──────
  it("returns applied=true with adapted Voucher when BE response has discountAmount > 0 (M.2)", async () => {
    // BE trả ApiResponse<VoucherCalculationResponse> đã được apiFetch unwrap
    mockApiFetch.mockResolvedValue({
      voucherId: 5,
      code: "VIBE10",
      discountAmount: 10000,
      finalAmount: 990_000,
    });

    const result = await applyVoucher({
      voucherCode: "VIBE10",
      orderAmount: 1_000_000,
    });

    expect(result).toMatchObject({
      applied: true,
      voucherId: 5,
      code: "VIBE10",
      discountAmount: 10_000,
      finalAmount: 990_000,
      // Backward-compat fields cho caller:
      totalDiscount: 10_000,
      grandTotal: 990_000,
    });
    // Backward-compat: trả stub Voucher với id = voucherId, code = code
    expect(result.voucher).toMatchObject({
      id: 5,
      code: "VIBE10",
    });
  });

  it("returns applied=false when BE response has discountAmount=0 (M.2)", async () => {
    mockApiFetch.mockResolvedValue({
      voucherId: 99,
      code: "INACTIVE",
      discountAmount: 0,
      finalAmount: 1_000_000, // finalAmount = subtotalAmount khi không áp được
    });

    const result = await applyVoucher({
      voucherCode: "INACTIVE",
      orderAmount: 1_000_000,
    });

    expect(result.applied).toBe(false);
    expect(result.discountAmount).toBe(0);
  });

  it("propagates BE error as ApiError", async () => {
    const { ApiError } = await import("@/lib/api");
    mockApiFetch.mockRejectedValue(
      new ApiError({
        code: "VOUCHER_NOT_FOUND",
        message: "Mã không tồn tại",
        status: 404,
      }),
    );

    await expect(
      applyVoucher({
        voucherCode: "GHOST",
        orderAmount: 100_000,
      }),
    ).rejects.toThrow("Mã không tồn tại");
  });

  // ── Smoke: input field names từ caller (voucherCode, orderAmount) ──
  it("accepts { voucherCode, orderAmount } from caller (backward compat)", async () => {
    mockApiFetch.mockResolvedValue({
      voucherId: 1,
      code: "VIBE10",
      discountAmount: 10_000,
      finalAmount: 990_000,
    });

    // Caller vẫn dùng input field cũ — FE layer tự map sang Swagger mới
    await applyVoucher({
      voucherCode: "VIBE10",
      orderAmount: 1_000_000,
    });

    // Verify request body dùng key mới (M.1)
    const callArgs = mockApiFetch.mock.calls[0]?.[1] as
      | { json?: { code?: string; subtotalAmount?: number } }
      | undefined;
    expect(callArgs?.json?.code).toBe("VIBE10");
    expect(callArgs?.json?.subtotalAmount).toBe(1_000_000);
  });
});

// ── M.3 + M.4: Cart response shape ──────────────────────────────────────

import { getCheckout } from "./api";
import type { BackendCartItem, BackendCartResponse } from "./api";

describe("getCheckout — cart shape (M.3 + M.4)", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  const MOCK_BE_CART_RESPONSE: BackendCartResponse = {
    // ── M.3 + 2026-10-18: BE Swagger thật trả field tên `storeSubtotal`
    //    (KHÔNG phải `shopSubtotal`). Đây là root cause của "giá = 0"
    //    ở trang /checkout.
    //    Test RED này khóa field name theo Swagger để FE không lệch nữa.
    id: 1,
    userId: 5,
    storeGroups: [
      {
        storeId: 2,
        storeName: "Shop ABC",
        estimatedDeliveryLabel: "Ngày mai",
        shippingMethodLabel: "Tiết kiệm",
        shippingFee: 30_000,
        items: [
          {
            id: 11,
            variantId: 42,
            productId: 100,
            productName: "Áo thun",
            variantName: "Đen, M",
            imageUrl: "https://example.com/img.jpg",
            price: 99_000,
            quantity: 2,
            subtotal: 198_000,
            // ── M.4: field mới từ Swagger 2026-10-17 ──
            stockQuantity: 50,
          } satisfies BackendCartItem,
        ],
        storeSubtotal: 198_000, // ← BE Swagger field name
      },
    ],
    subtotal: 198_000,
    totalShippingFee: 30_000,
    totalItems: 2,
    // ── M.3: field mới từ Swagger 2026-10-17 ──
    totalAmount: 228_000, // = subtotal + totalShippingFee
    grandTotal: 228_000, // chưa có discount
  };

  it("uses cart.grandTotal from BE when present (M.3)", async () => {
    mockApiFetch.mockImplementation(async (url: string) => {
      if (url === "/api/v1/cart") return MOCK_BE_CART_RESPONSE;
      if (url === "/api/v1/users/addresses") return [];
      return null;
    });

    const checkout = await getCheckout();
    // grandTotal từ BE = 228_000 (bao gồm ship, chưa discount)
    expect(checkout.grandTotal).toBe(228_000);
    expect(checkout.goodsSubtotal).toBe(198_000);
    expect(checkout.shippingFee).toBe(30_000);
  });

  it("reads storeSubtotal from BE and maps to shopGroups[].shopSubtotal (Bug #1 fix)", async () => {
    // BE Swagger 2026-10-18: CartStoreGroupResponse.storeSubtotal
    // FE phải map sang domain CheckoutShopGroup.shopSubtotal.
    // Trước fix: FE đọc g.shopSubtotal (undefined) → subtotal=0.
    mockApiFetch.mockImplementation(async (url: string) => {
      if (url === "/api/v1/cart") return MOCK_BE_CART_RESPONSE;
      if (url === "/api/v1/users/addresses") return [];
      return null;
    });

    const checkout = await getCheckout();

    // Mỗi shopGroup phải có shopSubtotal = 198_000 từ BE.storeSubtotal
    expect(checkout.shopGroups).toHaveLength(1);
    expect(checkout.shopGroups[0]?.shopSubtotal).toBe(198_000);
    expect(checkout.shopGroups[0]?.shippingFee).toBe(30_000);
  });

  it("falls back to local calculation when BE response lacks grandTotal (backward compat)", async () => {
    const CART_WITHOUT_GRAND_TOTAL: BackendCartResponse = {
      ...MOCK_BE_CART_RESPONSE,
      totalAmount: undefined,
      grandTotal: undefined,
    };
    mockApiFetch.mockImplementation(async (url: string) => {
      if (url === "/api/v1/cart") return CART_WITHOUT_GRAND_TOTAL;
      if (url === "/api/v1/users/addresses") return [];
      return null;
    });

    const checkout = await getCheckout();
    // Fallback: grandTotal = goodsSubtotal + shippingFee - totalDiscount
    // = 198_000 + 30_000 - 0 = 228_000
    expect(checkout.grandTotal).toBe(228_000);
  });

  it("accepts BackendCartItem with stockQuantity field (M.4 type-shape)", () => {
    // Verify type-level: BackendCartItem accept stockQuantity
    const item: BackendCartItem = {
      id: 1,
      variantId: 1,
      productId: 1,
      productName: "Test",
      variantName: "Default",
      imageUrl: "https://x",
      price: 100,
      quantity: 1,
      subtotal: 100,
      stockQuantity: 10, // M.4 — phải có field này
    };
    expect(item.stockQuantity).toBe(10);
  });
});

// ── Bug #2 (2026-10-18): submitOrder body phải chứa items[] ────────────

import { submitOrder } from "./api";

describe("submitOrder — items[] in CheckoutStoreOrderRequest (Bug #2)", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends items[{ variantId, quantity }] for each storeOrder (Bug #2 RED)", async () => {
    // BE Swagger 2026-10-18: CheckoutStoreOrderRequest REQUIRED items[]
    // Trước fix: FE chỉ gửi { storeId, voucherCode } → BE trả 400.
    mockApiFetch.mockResolvedValue([
      {
        id: 1,
        orderCode: "FS-261018-ABCD",
        storeId: 2,
        storeName: "Shop ABC",
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        items: [],
        subtotal: 198_000,
        shippingFee: 30_000,
        discountAmount: 0,
        totalAmount: 228_000,
      },
    ]);

    await submitOrder(
      {
        addressId: 10,
        paymentMethod: "ZALOPAY",
        platformVoucherCode: "VIBE10",
        shopSelections: [
          {
            storeId: 2,
            shopVoucherCode: "SHOP5",
            buyerNote: "Giao giờ hành chính",
            // items[] — Bug #2: caller BẮT BUỘC truyền items theo
            // SubmitOrderRequest.shopSelections[].items.
            items: [{ variantId: 42, quantity: 2 }],
          },
        ],
      },
      "idem-key-123",
    );

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/orders/checkout",
      expect.objectContaining({
        method: "POST",
        json: expect.objectContaining({
          shippingAddressId: 10,
          storeOrders: expect.arrayContaining([
            expect.objectContaining({
              storeId: 2,
              voucherCode: "SHOP5",
              items: expect.arrayContaining([
                expect.objectContaining({
                  variantId: expect.any(Number),
                  quantity: expect.any(Number),
                }),
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it("does NOT include platformVoucherCode at top level (Bug #3 — Swagger CreateOrderRequest không có field này)", async () => {
    // BE Swagger: CreateOrderRequest chỉ có shippingAddressId + storeOrders[].
    // FE đang gửi thêm platformVoucherCode ở top → có thể gây 400 hoặc
    // bị Jackson bỏ qua. Test này chỉ verify field name bị loại bỏ
    // khỏi top-level body (move vào storeOrders hoặc bỏ hẳn tuỳ BE quyết).
    mockApiFetch.mockResolvedValue([
      {
        id: 1,
        orderCode: "FS-261018-ABCD",
        storeId: 2,
        storeName: "Shop ABC",
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        items: [],
        subtotal: 100_000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 100_000,
      },
    ]);

    await submitOrder(
      {
        addressId: 10,
        paymentMethod: "ZALOPAY",
        platformVoucherCode: "VIBE10",
        shopSelections: [
          {
            storeId: 2,
            items: [{ variantId: 42, quantity: 1 }],
            // Cần items[] cho bug #2 — FE phải build từ cart.
          },
        ],
      },
      "idem-key-456",
    );

    const body = (
      mockApiFetch.mock.calls[0]?.[1] as { json?: Record<string, unknown> }
    )?.json;

    // Bug #3: top-level KHÔNG có platformVoucherCode.
    // (Có thể FE sẽ move xuống từng storeOrder hoặc bỏ hẳn — verify
    // ở top là không có.)
    expect(body).not.toHaveProperty("platformVoucherCode");
  });
});

// ── submitOrder: apiFetch auto-unwrap payload.data (Bug 2026-10-19) ───
// Rule client.ts:295-304: apiFetch trả về T (auto-unwrap `payload.data`).
// submitOrder gọi apiFetch nhưng lại đọc `res.data` → undefined → crash
// "Cannot read properties of undefined (reading '0')" ở adaptOrderResponse.
//
// Contract thật (BE runtime, xác nhận 2026-10-19):
// apiFetch(/api/v1/orders/checkout) trả BackendOrder[] trực tiếp (đã unwrap).
describe("submitOrder — adaptOrderResponse contract (2026-10-19)", () => {
  it("trả về OrderSubmitResponse khi apiFetch trả BackendOrder[] (auto-unwrap)", async () => {
    // Mock đúng contract thật: apiFetch trả array thẳng (đã unwrap payload.data).
    mockApiFetch.mockResolvedValue([
      {
        id: 18,
        orderCode: "ORD-1792377022857-73894A54",
        storeId: 5,
        storeName: "Beauty Hub",
        status: "PENDING_PAYMENT",
        paymentStatus: null,
        paymentUrl: null,
        qrCodeUrl: null,
        paymentExpiry: null,
        items: [],
        subtotal: 7_222_000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 7_222_000,
      },
      {
        id: 19,
        orderCode: "ORD-1792377023178-734252C8",
        storeId: 3,
        storeName: "Mom and Baby Shop",
        status: "PENDING_PAYMENT",
        paymentStatus: null,
        paymentUrl: null,
        qrCodeUrl: null,
        paymentExpiry: null,
        items: [],
        subtotal: 32_304_000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 32_304_000,
      },
    ]);

    const result = await submitOrder(
      {
        addressId: 1,
        paymentMethod: "ZALOPAY",
        shopSelections: [
          {
            storeId: 5,
            items: [{ variantId: 6, quantity: 1 }],
          },
          {
            storeId: 3,
            items: [{ variantId: 18, quantity: 2 }],
          },
        ],
      },
      "idem-test-001",
    );

    expect(result.orderIds).toEqual([18, 19]);
    expect(result.orderCode).toContain("ORD-1792377022857-73894A54");
    expect(result.orderCode).toContain("ORD-1792377023178-734252C8");
  });
});
