/**
 * Test cho payment types + type guards (RED → GREEN).
 *
 * Đây là unit test thuần cho:
 * - Status enum đầy đủ 6 giá trị (PENDING, SUCCESS, FAILED, CANCELLED, EXPIRED, REFUNDED)
 * - Type guards: isPendingPaymentStatus / isSucceededPaymentStatus / isFailedPaymentStatus
 * - Shape của PaymentResponse (compile-time + runtime spot check)
 * - Shape của PaymentStatusEvent (BE guide: orderCode + status)
 */

import { describe, expect, it } from "vitest";
import {
  PENDING_PAYMENT_STATUSES,
  SUCCEEDED_PAYMENT_STATUSES,
  FAILED_PAYMENT_STATUSES,
  isPendingPaymentStatus,
  isSucceededPaymentStatus,
  isFailedPaymentStatus,
  type PaymentResponse,
  type PaymentStatusEvent,
} from "./payment.types";

describe("payment.types — status sets", () => {
  it("PENDING_PAYMENT_STATUSES chỉ chứa 'PENDING'", () => {
    expect(PENDING_PAYMENT_STATUSES).toEqual(["PENDING"]);
    expect(PENDING_PAYMENT_STATUSES).toHaveLength(1);
  });

  it("SUCCEEDED_PAYMENT_STATUSES chỉ chứa 'SUCCESS'", () => {
    expect(SUCCEEDED_PAYMENT_STATUSES).toEqual(["SUCCESS"]);
  });

  it("FAILED_PAYMENT_STATUSES chứa 4 giá trị failure terminal", () => {
    expect(FAILED_PAYMENT_STATUSES).toEqual(
      expect.arrayContaining(["FAILED", "CANCELLED", "EXPIRED", "REFUNDED"]),
    );
    expect(FAILED_PAYMENT_STATUSES).toHaveLength(4);
  });

  it("các status sets không overlap nhau", () => {
    const all = [
      ...PENDING_PAYMENT_STATUSES,
      ...SUCCEEDED_PAYMENT_STATUSES,
      ...FAILED_PAYMENT_STATUSES,
    ];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("payment.types — type guards", () => {
  describe("isPendingPaymentStatus", () => {
    it("returns true chỉ với 'PENDING'", () => {
      expect(isPendingPaymentStatus("PENDING")).toBe(true);
      expect(isPendingPaymentStatus("SUCCESS")).toBe(false);
      expect(isPendingPaymentStatus("FAILED")).toBe(false);
    });

    it("returns false với null / undefined / rỗng", () => {
      expect(isPendingPaymentStatus(null)).toBe(false);
      expect(isPendingPaymentStatus(undefined)).toBe(false);
      expect(isPendingPaymentStatus("")).toBe(false);
    });
  });

  describe("isSucceededPaymentStatus", () => {
    it("returns true chỉ với 'SUCCESS'", () => {
      expect(isSucceededPaymentStatus("SUCCESS")).toBe(true);
      expect(isSucceededPaymentStatus("PENDING")).toBe(false);
      expect(isSucceededPaymentStatus("EXPIRED")).toBe(false);
    });

    it("returns false với null/undefined", () => {
      expect(isSucceededPaymentStatus(null)).toBe(false);
      expect(isSucceededPaymentStatus(undefined)).toBe(false);
    });
  });

  describe("isFailedPaymentStatus", () => {
    it("returns true với mọi terminal failure", () => {
      expect(isFailedPaymentStatus("FAILED")).toBe(true);
      expect(isFailedPaymentStatus("CANCELLED")).toBe(true);
      expect(isFailedPaymentStatus("EXPIRED")).toBe(true);
      expect(isFailedPaymentStatus("REFUNDED")).toBe(true);
    });

    it("returns false với PENDING/SUCCESS", () => {
      expect(isFailedPaymentStatus("PENDING")).toBe(false);
      expect(isFailedPaymentStatus("SUCCESS")).toBe(false);
    });

    it("returns false với null/undefined", () => {
      expect(isFailedPaymentStatus(null)).toBe(false);
      expect(isFailedPaymentStatus(undefined)).toBe(false);
    });
  });
});

describe("payment.types — PaymentResponse shape (compile-time)", () => {
  it("PaymentResponse có thể construct đầy đủ field", () => {
    const sample: PaymentResponse = {
      id: 123,
      orderId: 42,
      orderCode: "ORD_2026_001234",
      paymentMethod: "ZALOPAY",
      transactionCode: "ZP1697356800000_42",
      amount: 150000,
      qrCodeUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      paymentUrl: "https://sb-openapi.zalopay.vn/pay?token=abc123",
      status: "PENDING",
      paidAt: null,
      createdAt: "2026-10-15T10:30:00.000Z",
    };
    expect(sample.status).toBe("PENDING");
    expect(sample.amount).toBe(150000);
    expect(sample.paidAt).toBeNull();
  });

  it("PaymentResponse chấp nhận UNPAID khi chưa tạo payment", () => {
    const unpaid: PaymentResponse = {
      id: null,
      orderId: 42,
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
    expect(unpaid.paymentMethod).toBe("UNPAID");
    expect(unpaid.id).toBeNull();
  });
});

describe("payment.types — PaymentStatusEvent (WS payload)", () => {
  it("chấp nhận event với orderCode + orderId", () => {
    const evt: PaymentStatusEvent = {
      orderCode: "FS-261001-A7K2Q",
      orderId: 42,
      paymentMethod: "ZALOPAY",
      status: "SUCCESS",
      occurredAt: "2026-10-16T10:30:00.000Z",
    };
    expect(evt.orderId).toBe(42);
    expect(evt.status).toBe("SUCCESS");
  });

  it("chấp nhận event chỉ có orderCode (BE guide gốc)", () => {
    const evt: PaymentStatusEvent = {
      orderCode: "FS-261001-A7K2Q",
      paymentMethod: "ZALOPAY",
      status: "FAILED",
      occurredAt: "2026-10-16T10:30:00.000Z",
    };
    expect(evt.orderId).toBeUndefined();
  });
});
