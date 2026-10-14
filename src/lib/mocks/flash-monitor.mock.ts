import type {
  RealtimeTelemetry,
  LiveSkuInventoryItem,
  LiveLogEvent,
  TrafficDataPoint,
} from "@/types/flash-monitor";

export const INITIAL_TELEMETRY: RealtimeTelemetry = {
  rps: 3482,
  activeLocks: 412,
  completedOrders: 1903,
  totalRevenue: 385400000,
  expiredReleases: 186,
  p99LatencyMs: 128,
  isPaused: false,
  lastUpdated: "Vừa xong",
};

export const INITIAL_TRAFFIC_DATA: TrafficDataPoint[] = [
  { time: "12:00:00", rps: 8200, ordersPerSec: 300 },
  { time: "12:01:30", rps: 6400, ordersPerSec: 240 },
  { time: "12:03:00", rps: 4500, ordersPerSec: 160 },
  { time: "12:04:30", rps: 3900, ordersPerSec: 135 },
  { time: "12:06:00", rps: 3600, ordersPerSec: 120 },
  { time: "12:07:30", rps: 3450, ordersPerSec: 105 },
  { time: "12:09:00", rps: 3400, ordersPerSec: 95 },
  { time: "12:10:30", rps: 3550, ordersPerSec: 90 },
  { time: "12:12:00", rps: 3520, ordersPerSec: 85 },
  { time: "12:13:30", rps: 3460, ordersPerSec: 80 },
  { time: "12:15:00", rps: 3482, ordersPerSec: 78 },
];

export const INITIAL_LIVE_SKUS: LiveSkuInventoryItem[] = [
  {
    id: 1,
    skuCode: "SKU-CLM-BLK-L",
    productName: "Áo thun Compact Đen L",
    variantName: "Đen, Size L",
    storeName: "Coolmate Official",
    allocatedStock: 50,
    availableStock: 8,
    holdingStock: 12,
    soldStock: 30,
    status: "SELLING",
    icon: "checkroom",
  },
  {
    id: 2,
    skuCode: "SKU-TECH-AIR-01",
    productName: "Tai nghe AirPro ANC",
    variantName: "Trắng",
    storeName: "TechSound Global",
    allocatedStock: 100,
    availableStock: 4,
    holdingStock: 25,
    soldStock: 71,
    status: "ALMOST_OUT",
    icon: "headphones",
  },
  {
    id: 3,
    skuCode: "SKU-SUN-AF-60",
    productName: "Nồi chiên không dầu 6L",
    variantName: "Đen Bóng",
    storeName: "Sunhouse Mall",
    allocatedStock: 30,
    availableStock: 0,
    holdingStock: 0,
    soldStock: 30,
    status: "SOLD_OUT",
    icon: "soup_kitchen",
  },
  {
    id: 4,
    skuCode: "SKU-ORAL-SW-PRO",
    productName: "Bàn chải Sonic Wave",
    variantName: "Xanh Mint",
    storeName: "OralCare VN",
    allocatedStock: 80,
    availableStock: 35,
    holdingStock: 18,
    soldStock: 27,
    status: "SELLING",
    icon: "dentistry",
  },
];

export const INITIAL_LIVE_LOGS: LiveLogEvent[] = [
  {
    id: "evt-1",
    timestamp: "12:00:01.124",
    type: "LOCK",
    orderCode: "FS-261005-K8A1",
    message: "Giữ 2 · Áo thun Đen L (Khóa thành công 300s)",
    tag: "Khóa thành công 300s",
    tagColor: "warning",
    userOrInfo: "user_419",
  },
  {
    id: "evt-2",
    timestamp: "12:00:02.048",
    type: "PAYMENT",
    orderCode: "FS-261005-M9B2",
    message: "Thanh toán thành công 149.000 ₫ qua ZaloPay",
    tag: "+1 Đơn chốt",
    tagColor: "success",
    userOrInfo: "ZaloPay",
  },
  {
    id: "evt-3",
    timestamp: "12:00:03.410",
    type: "RATE_LIMIT",
    message:
      "Từ chối request từ user_8912: Đã vượt giới hạn mua tối đa của phiên (max 2 sản phẩm/khách)",
    tag: "Rate Limit",
    tagColor: "error",
    userOrInfo: "user_8912",
  },
  {
    id: "evt-4",
    timestamp: "12:05:01.890",
    type: "EXPIRED_RELEASE",
    orderCode: "FS-261005-H1C3",
    message:
      "Hết hạn giữ chỗ 300s đơn FS-261005-H1C3: Tự động hoàn 1 SKU về kho khả dụng",
    tag: "Hoàn kho",
    tagColor: "warning",
    userOrInfo: "Auto worker",
  },
  {
    id: "evt-5",
    timestamp: "12:05:02.012",
    type: "SYNC_DB",
    message:
      "Đồng bộ định kỳ Redis sync to PostgreSQL thành công cho batch 50 đơn chốt",
    tag: "Sync DB OK",
    tagColor: "primary",
    userOrInfo: "PostgreSQL",
  },
];

let telemetryState: RealtimeTelemetry = { ...INITIAL_TELEMETRY };
const liveSkusState: LiveSkuInventoryItem[] = [...INITIAL_LIVE_SKUS];
let liveLogsState: LiveLogEvent[] = [...INITIAL_LIVE_LOGS];

export function getMockTelemetry(): RealtimeTelemetry {
  return { ...telemetryState };
}

export function toggleSessionPause(isPaused: boolean): RealtimeTelemetry {
  telemetryState = {
    ...telemetryState,
    isPaused,
    rps: isPaused ? 0 : 3482,
  };
  return { ...telemetryState };
}

export function getMockLiveSkus(): LiveSkuInventoryItem[] {
  return [...liveSkusState];
}

export function getMockLiveLogs(): LiveLogEvent[] {
  return [...liveLogsState];
}

export function addMockLogEvent(event: LiveLogEvent): LiveLogEvent[] {
  liveLogsState = [event, ...liveLogsState].slice(0, 30);
  return [...liveLogsState];
}

export function clearMockLiveLogs(): void {
  liveLogsState = [];
}
