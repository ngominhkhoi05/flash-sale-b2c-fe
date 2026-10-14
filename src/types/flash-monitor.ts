export interface RealtimeTelemetry {
  rps: number;
  activeLocks: number;
  completedOrders: number;
  totalRevenue: number;
  expiredReleases: number;
  p99LatencyMs: number;
  isPaused: boolean;
  lastUpdated: string;
}

export type LiveSkuStatus = "SELLING" | "ALMOST_OUT" | "SOLD_OUT";

export interface LiveSkuInventoryItem {
  id: number;
  skuCode: string;
  productName: string;
  variantName: string;
  storeName: string;
  allocatedStock: number;
  availableStock: number;
  holdingStock: number;
  soldStock: number;
  status: LiveSkuStatus;
  icon: string;
}

export type LiveEventType =
  | "LOCK"
  | "PAYMENT"
  | "RATE_LIMIT"
  | "EXPIRED_RELEASE"
  | "SYNC_DB";

export interface LiveLogEvent {
  id: string;
  timestamp: string; // e.g. "12:00:01.124"
  type: LiveEventType;
  orderCode?: string;
  message: string;
  tag: string;
  tagColor: "primary" | "success" | "warning" | "error" | "slate";
  userOrInfo?: string;
}

export interface TrafficDataPoint {
  time: string;
  rps: number;
  ordersPerSec: number;
}
