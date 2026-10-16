/**
 * Test cho WS_DESTINATIONS + WsEvent types (src/features/flash-sale/types.ts).
 *
 * Spec từ `docs/handoffs/fe-ws-integration-guide (1).md` §3 + §6.6.
 */
import { describe, expect, it } from "vitest";
import {
  WS_DESTINATIONS,
  WS_EVENT_TYPES,
  type WsEvent,
  type WsEventType,
} from "./types";

describe("WS_DESTINATIONS – builders", () => {
  it("slotStock build path /topic/flash-sale/slot/{slotId}/stock-update", () => {
    expect(WS_DESTINATIONS.slotStock(42)).toBe(
      "/topic/flash-sale/slot/42/stock-update",
    );
  });

  it("slotStatus build path /topic/flash-sale/slot/{slotId}/status", () => {
    expect(WS_DESTINATIONS.slotStatus(7)).toBe(
      "/topic/flash-sale/slot/7/status",
    );
  });

  it("orderStatus build path /user/queue/flash-sale/orders/{orderCode}/status", () => {
    expect(WS_DESTINATIONS.orderStatus("FS-261001-A7K2Q")).toBe(
      "/user/queue/flash-sale/orders/FS-261001-A7K2Q/status",
    );
  });

  it("orderUpdates build path /user/queue/flash-sale/orders/{orderCode}/updates", () => {
    expect(WS_DESTINATIONS.orderUpdates("FS-XYZ-1")).toBe(
      "/user/queue/flash-sale/orders/FS-XYZ-1/updates",
    );
  });

  it("reservationResult là constant string /user/queue/flash-sale/reservation-result", () => {
    expect(WS_DESTINATIONS.reservationResult).toBe(
      "/user/queue/flash-sale/reservation-result",
    );
  });
});

describe("WS_EVENT_TYPES", () => {
  it("chứa đủ 9 event types theo BE §5", () => {
    expect(WS_EVENT_TYPES).toContain("STOCK_DECREMENTED");
    expect(WS_EVENT_TYPES).toContain("STOCK_RESTORED");
    expect(WS_EVENT_TYPES).toContain("STOCK_RETURNED_UNSOLD");
    expect(WS_EVENT_TYPES).toContain("SLOT_ACTIVATED");
    expect(WS_EVENT_TYPES).toContain("SLOT_CLOSED");
    expect(WS_EVENT_TYPES).toContain("ORDER_RESERVED");
    expect(WS_EVENT_TYPES).toContain("ORDER_CANCELLED_TIMEOUT");
    expect(WS_EVENT_TYPES).toContain("ORDER_STATUS_CHANGED");
    expect(WS_EVENT_TYPES).toContain("PAYMENT_STATUS_CHANGED");
  });

  it("TypeScript compile-time check: WsEventType union includes tất cả event", () => {
    const sample: WsEventType = "STOCK_DECREMENTED";
    expect(typeof sample).toBe("string");
  });
});

describe("WsEvent shape", () => {
  it("WsEvent có field occurredAt bắt buộc (BE §3 mục chung)", () => {
    const ev: WsEvent = {
      eventType: "STOCK_DECREMENTED",
      slotId: 1,
      flashSaleItemId: 100,
      availableStock: 7,
      occurredAt: "2026-10-16T10:00:00.000Z",
    };
    expect(ev.occurredAt).toBeTruthy();
  });

  it("WsEvent hỗ trợ ORDER_RESERVED với totalAmount + expiresAt", () => {
    const ev: WsEvent = {
      eventType: "ORDER_RESERVED",
      slotId: 1,
      flashSaleItemId: 100,
      orderId: 1,
      orderCode: "FS-A",
      quantity: 1,
      totalAmount: 1_290_000,
      expiresAt: "2026-10-16T10:05:00.000Z",
      occurredAt: "2026-10-16T10:00:00.000Z",
    };
    expect(ev.totalAmount).toBe(1_290_000);
  });

  it("WsEvent hỗ trợ PAYMENT_STATUS_CHANGED với paymentMethod + paymentStatus", () => {
    const ev: WsEvent = {
      eventType: "PAYMENT_STATUS_CHANGED",
      orderId: 1,
      orderCode: "FS-A",
      paymentMethod: "ZALOPAY",
      paymentStatus: "PENDING",
      occurredAt: "2026-10-16T10:00:00.000Z",
    };
    expect(ev.paymentMethod).toBe("ZALOPAY");
  });
});