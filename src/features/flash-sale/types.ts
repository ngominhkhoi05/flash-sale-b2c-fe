/**
 * Types cho Flash Sale feature – khớp với backend DTO.
 *
 * Re-export từ homepage feature để đảm bảo cùng shape,
 * đồng thời có thể mở rộng thêm types riêng cho trang /flash-sale.
 *
 * WebSocket (BE contract `docs/handoffs/fe-ws-integration-guide (1).md`):
 * - WS_DESTINATIONS: helper build STOMP destination path.
 * - WS_EVENT_TYPES: danh sách 9 event types từ BE §3 + §5.
 * - WsEvent: union type cho mọi WS event (optional fields cho từng event).
 */

export type {
  PublicFlashSaleItemResponse,
  PublicFlashSaleSlotResponse,
} from "@/features/homepage/api";

// =========================================================
// WebSocket – BE contract 2026-10-15
// =========================================================

/**
 * WS event types – mapping đầy đủ 9 event types từ BE.
 * (BE guide liệt kê 7 trigger nhưng tổng event = 9 do `STOCK_RESTORED`
 *  có 2 nguồn trigger: API reserve + scheduler timeout.)
 */
export const WS_EVENT_TYPES = [
  "STOCK_DECREMENTED",
  "STOCK_RESTORED",
  "STOCK_RETURNED_UNSOLD",
  "SLOT_ACTIVATED",
  "SLOT_CLOSED",
  "ORDER_RESERVED",
  "ORDER_CANCELLED_TIMEOUT",
  "ORDER_STATUS_CHANGED",
  "PAYMENT_STATUS_CHANGED",
] as const;

export type WsEventType = (typeof WS_EVENT_TYPES)[number];

/**
 * WS_DESTINATIONS – build STOMP destination theo pattern BE §6.6.
 *
 * Public topic: `/topic/flash-sale/slot/{slotId}/...`
 * Private queue: `/user/queue/flash-sale/...` (Spring tự prefix /user/{username}).
 */
export const WS_DESTINATIONS = {
  /** Stock update cho slot (ai cũng subscribe được). */
  slotStock: (slotId: number) =>
    `/topic/flash-sale/slot/${slotId}/stock-update` as const,
  /** Slot lifecycle event (ACTIVATED / CLOSED). */
  slotStatus: (slotId: number) =>
    `/topic/flash-sale/slot/${slotId}/status` as const,
  /** Order status cho buyer (private). */
  orderStatus: (orderCode: string) =>
    `/user/queue/flash-sale/orders/${orderCode}/status` as const,
  /** Order update cho buyer (private) — timeout cancel notification. */
  orderUpdates: (orderCode: string) =>
    `/user/queue/flash-sale/orders/${orderCode}/updates` as const,
  /** Reservation result — buyer vừa đặt hàng (private, single shot). */
  reservationResult: "/user/queue/flash-sale/reservation-result" as const,
} as const;

/**
 * WsEvent – union type cho tất cả WS event từ BE.
 *
 * Mỗi event có field bắt buộc `eventType` + `occurredAt` (ISO 8601).
 * Các field khác là optional theo spec từng event.
 */
export interface WsEventBase {
  eventType: WsEventType;
  occurredAt: string;
}

export interface StockDecrementedEvent extends WsEventBase {
  eventType: "STOCK_DECREMENTED";
  slotId: number;
  flashSaleItemId: number;
  availableStock: number;
}

export interface StockRestoredEvent extends WsEventBase {
  eventType: "STOCK_RESTORED";
  slotId: number;
  flashSaleItemId: number;
  availableStock: number;
  restoredQuantity: number;
}

export interface StockReturnedUnsoldEvent extends WsEventBase {
  eventType: "STOCK_RETURNED_UNSOLD";
  slotId: number;
  flashSaleItemId: number;
}

export interface SlotActivatedEvent extends WsEventBase {
  eventType: "SLOT_ACTIVATED";
  slotId: number;
}

export interface SlotClosedEvent extends WsEventBase {
  eventType: "SLOT_CLOSED";
  slotId: number;
}

export interface OrderReservedEvent extends WsEventBase {
  eventType: "ORDER_RESERVED";
  slotId: number;
  flashSaleItemId: number;
  orderId: number;
  orderCode: string;
  quantity: number;
  /** Tổng tiền VND (number, không phải decimal — spec BE §3.2). */
  totalAmount: number;
  expiresAt: string;
}

export interface OrderCancelledTimeoutEvent extends WsEventBase {
  eventType: "ORDER_CANCELLED_TIMEOUT";
  orderId: number;
  orderCode: string;
}

export interface OrderStatusChangedEvent extends WsEventBase {
  eventType: "ORDER_STATUS_CHANGED";
  orderId: number;
  orderCode: string;
  /** Trạng thái mới: SHIPPED, COMPLETED, CANCELLED, ... */
  orderStatus: string;
}

export interface PaymentStatusChangedEvent extends WsEventBase {
  eventType: "PAYMENT_STATUS_CHANGED";
  orderId: number;
  orderCode: string;
  paymentMethod: string;
  paymentStatus: string;
}

export type WsEvent =
  | StockDecrementedEvent
  | StockRestoredEvent
  | StockReturnedUnsoldEvent
  | SlotActivatedEvent
  | SlotClosedEvent
  | OrderReservedEvent
  | OrderCancelledTimeoutEvent
  | OrderStatusChangedEvent
  | PaymentStatusChangedEvent;

export interface PublicFlashSaleItemDetailResponse {
  id: number;
  slotId: number;
  slotTitle: string;
  slotStartTime: string;
  slotEndTime: string;
  slotStatus: string;
  reservationTtlSeconds: number;
  originalPrice: number;
  flashSalePrice: number;
  discountPercent: number;
  allocatedStock: number;
  availableStock: number;
  userPurchaseLimit: number;
  status: string;
  productId: number;
  productName: string;
  productDescription?: string | null;
  productSlug?: string | null;
  totalSold?: number;
  ratingAvg?: number;
  ratingCount?: number;
  categoryId?: number | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  storeId: number;
  storeName: string;
  storeTier?: string;
  storeLogoUrl?: string | null;
  variantId: number;
  sku: string;
  variantName: string;
  attributes?: Record<string, string> | null;
  primaryImageUrl?: string | null;
  imageUrls: string[];
}