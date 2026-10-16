/**
 * applyVoucher test — RED tests viết TRƯỚC khi sửa code
 * (rule testing-required.mdc: TDD bắt buộc).
 *
 * Sau khi Swagger refactor 2026-10-17:
 * - Request:  { code, subtotalAmount, storeId? }
 *   (thay vì { orderAmount, voucherCode, storeId? })
 * - Response: { voucherId, code, discountAmount, finalAmount }
 *   (BE trả envelope ApiResponse<VoucherCalculationResponse>;
 *    apiFetch unwrap 1 lần → còn VoucherCalculationResponse)
 *   KHÔNG còn full voucher object trong response.
 *
 * Caller (CheckoutPageContent) cần match voucher trong cache
 * theo `code` để có full Voucher object cho UI.
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
