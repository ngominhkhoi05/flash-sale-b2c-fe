/**
 * Test cho payment.api.ts (RED → GREEN).
 *
 * Mock apiFetch (BẮT BUỘC — không gọi thật đến backend).
 * Test:
 *   1. createZaloPayPayment → POST /api/v1/orders/{id}/payment/zalopay
 *      → unwrap envelope.data → trả về PaymentResponse
 *      → throw ApiError khi 5xx
 *   2. getOrderPayment → GET /api/v1/orders/{id}/payment
 *      → luôn 200, bao gồm cả case UNPAID
 *   3. queryZaloPayPayment → POST /api/v1/orders/{id}/payment/zalopay/query
 *      → dùng khi miss callback
 *
 * Endpoint constants KHÔNG hard-code trong test — chỉ check path chứa
 * /api/v1 + orderId, để implementation có quyền đổi constants.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { PaymentResponse } from "./payment.types";

// Mock apiFetch (chưa import module — vi.mock sẽ tự động hoist)
const mockApiFetch = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiFetch: (path: string, init?: unknown) => mockApiFetch(path, init),
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details: unknown;
    constructor(p: {
      status: number;
      code: string;
      message: string;
      details?: unknown;
    }) {
      super(p.message);
      this.status = p.status;
      this.code = p.code;
      this.details = p.details;
    }
  },
}));

// Sau khi mock xong mới import
import {
  createZaloPayPayment,
  getOrderPayment,
  queryZaloPayPayment,
  paymentEndpoints,
} from "./payment.api";

const ORDER_ID = 42;

const ZP_PENDING: PaymentResponse = {
  id: 123,
  orderId: ORDER_ID,
  orderCode: "ORD_2026_001234",
  paymentMethod: "ZALOPAY",
  transactionCode: "ZP1697356800000_42",
  amount: 150000,
  qrCodeUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
  paymentUrl: "https://sb-openapi.zalopay.vn/pay?token=abc123",
  status: "PENDING",
  paidAt: null,
  createdAt: "2026-10-15T10:30:00.000Z",
};

const UNPAID: PaymentResponse = {
  id: null,
  orderId: ORDER_ID,
  orderCode: "ORD_2026_001234",
  paymentMethod: "UNPAID",
  transactionCode: null,
  amount: 150000,
  qrCodeUrl: null,
  paymentUrl: null,
  status: "PENDING",
  paidAt: null,
  createdAt: "2026-10-15T10:25:00.000Z",
};

beforeEach(() => {
  mockApiFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("payment.api — endpoints helpers", () => {
  it("paymentEndpoints.paymentBase(orderId) trả /api/v1/orders/{id}/payment", () => {
    expect(paymentEndpoints.paymentBase(ORDER_ID)).toBe(
      `/api/v1/orders/${ORDER_ID}/payment`,
    );
  });

  it("paymentEndpoints.createZalopay(orderId) trả /api/v1/orders/{id}/payment/zalopay", () => {
    expect(paymentEndpoints.createZalopay(ORDER_ID)).toBe(
      `/api/v1/orders/${ORDER_ID}/payment/zalopay`,
    );
  });

  it("paymentEndpoints.queryZalopay(orderId) trả /api/v1/orders/{id}/payment/zalopay/query", () => {
    expect(paymentEndpoints.queryZalopay(ORDER_ID)).toBe(
      `/api/v1/orders/${ORDER_ID}/payment/zalopay/query`,
    );
  });
});

describe("payment.api — createZaloPayPayment", () => {
  it("POST /api/v1/orders/{id}/payment/zalopay, unwrap envelope.data, return PaymentResponse", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      code: 200,
      message: "ok",
      data: ZP_PENDING,
      timestamp: "2026-10-16T00:00:00Z",
    });

    const result = await createZaloPayPayment(ORDER_ID);

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [path, init] = mockApiFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe(`/api/v1/orders/${ORDER_ID}/payment/zalopay`);
    expect(init.method).toBe("POST");
    expect(result).toEqual(ZP_PENDING);
  });

  it("propagate ApiError khi backend trả 5xx (ZaloPay gateway fail)", async () => {
    mockApiFetch.mockRejectedValueOnce(
      new ApiError({
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "ZaloPay gateway error",
      }),
    );

    await expect(createZaloPayPayment(ORDER_ID)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("propagate ApiError 409 khi order không ở PENDING_PAYMENT", async () => {
    mockApiFetch.mockRejectedValueOnce(
      new ApiError({
        status: 409,
        code: "ORDER_INVALID_STATUS_TRANSITION",
        message: "Order đã được xử lý",
      }),
    );

    await expect(createZaloPayPayment(ORDER_ID)).rejects.toMatchObject({
      status: 409,
      code: "ORDER_INVALID_STATUS_TRANSITION",
    });
  });
});

describe("payment.api — getOrderPayment", () => {
  it("GET /api/v1/orders/{id}/payment, unwrap envelope.data, trả về PaymentResponse", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      code: 200,
      message: "ok",
      data: ZP_PENDING,
      timestamp: "2026-10-16T00:00:00Z",
    });

    const result = await getOrderPayment(ORDER_ID);

    const [path, init] = mockApiFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe(`/api/v1/orders/${ORDER_ID}/payment`);
    // Mặc định GET (không cần truyền method)
    expect(init.method ?? "GET").toBe("GET");
    expect(result).toEqual(ZP_PENDING);
  });

  it("trả về UNPAID khi order chưa có payment", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      code: 200,
      message: "ok",
      data: UNPAID,
      timestamp: "2026-10-16T00:00:00Z",
    });

    const result = await getOrderPayment(ORDER_ID);
    expect(result.paymentMethod).toBe("UNPAID");
    expect(result.id).toBeNull();
    expect(result.qrCodeUrl).toBeNull();
  });

  it("propagate ApiError 404 khi order không tồn tại", async () => {
    mockApiFetch.mockRejectedValueOnce(
      new ApiError({
        status: 404,
        code: "ORDER_NOT_FOUND",
        message: "Order không tồn tại",
      }),
    );

    await expect(getOrderPayment(ORDER_ID)).rejects.toMatchObject({
      status: 404,
      code: "ORDER_NOT_FOUND",
    });
  });
});

describe("payment.api — queryZaloPayPayment", () => {
  it("POST /api/v1/orders/{id}/payment/zalopay/query, dùng khi miss callback", async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      code: 200,
      message: "ok",
      data: { ...ZP_PENDING, status: "SUCCESS" },
      timestamp: "2026-10-16T00:00:00Z",
    });

    const result = await queryZaloPayPayment(ORDER_ID);

    const [path, init] = mockApiFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe(`/api/v1/orders/${ORDER_ID}/payment/zalopay/query`);
    expect(init.method).toBe("POST");
    expect(result.status).toBe("SUCCESS");
  });

  it("propagate ApiError network/5xx như create", async () => {
    mockApiFetch.mockRejectedValueOnce(
      new ApiError({
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "ZaloPay query failed",
      }),
    );

    await expect(queryZaloPayPayment(ORDER_ID)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
