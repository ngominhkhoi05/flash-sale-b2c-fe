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
import { applyVoucher } from "./api";
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

  const MOCK_CART_WITH_NEW_FIELDS: BackendCartResponse = {
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
        shopSubtotal: 198_000,
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
      if (url === "/api/v1/cart") return MOCK_CART_WITH_NEW_FIELDS;
      if (url === "/api/v1/users/addresses") return [];
      return null;
    });

    const checkout = await getCheckout();
    // grandTotal từ BE = 228_000 (bao gồm ship, chưa discount)
    expect(checkout.grandTotal).toBe(228_000);
    expect(checkout.goodsSubtotal).toBe(198_000);
    expect(checkout.shippingFee).toBe(30_000);
  });

  it("falls back to local calculation when BE response lacks grandTotal (backward compat)", async () => {
    const CART_WITHOUT_GRAND_TOTAL: BackendCartResponse = {
      ...MOCK_CART_WITH_NEW_FIELDS,
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
