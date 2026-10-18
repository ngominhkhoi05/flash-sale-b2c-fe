import type { FlashSaleSlotStatus } from "./flash-sale";

export interface KpiCardData {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
    comparisonText: string;
  };
  iconName: string;
  isMockSample: boolean; // Must display "Dữ liệu mẫu" label
}

export interface AdminDashboardData {
  kpis: KpiCardData[];
  activeCampaign?: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    confirmedOrders: number;
    totalRevenue: number;
  };
  lastUpdated: string;
}

export interface AdminCampaign {
  id: number;
  name: string;
  slotName: string;
  startTime: string;
  endTime: string;
  status: FlashSaleSlotStatus;
  productCount: number;
  totalAllocatedStock: number;
  totalSoldStock: number;
  revenue: number;
}

export interface AdminCampaignFormData {
  name: string;
  startTime: string;
  endTime: string;
  productId: number;
  variantId: number;
  originalPrice: number;
  flashSalePrice: number;
  allocatedStock: number;
}

export interface AdminRealtimeProductMonitor {
  itemId: number;
  productId: number;
  productName: string;
  imageUrl: string;
  allocatedStock: number;
  availableStock: number;
  soldQuantity: number;
  sellThroughRate: number; // percentage (0-100)
  currentOrderRatePerMinute: number;
  status: "NORMAL" | "HOT" | "CRITICAL" | "SOLD_OUT";
}

export interface AdminRealtimeMonitorData {
  slotId: number;
  slotName: string;
  startTime: string;
  endTime: string;
  totalOrders: number;
  orderVelocityPerSecond: number;
  redisConnections: number;
  items: AdminRealtimeProductMonitor[];
  lastUpdated: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  storeId?: number;
  storeName: string;
  categoryId?: number;
  categoryName: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  status: "ACTIVE" | "INACTIVE" | "BANNED" | string;
  primaryImageUrl?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface BatchApproveFailedItem {
  itemId: number;
  reason: string;
}

export interface BatchApproveFlashSaleItemsResult {
  approvedItemIds: number[];
  failedReasons: BatchApproveFailedItem[];
}
export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "SELLER" | "BUYER" | string;
  roles?: string[];
  status: "ACTIVE" | "LOCKED" | string;
  ordersCount: number;
  createdAt: string;
  avatarUrl: string;
}
export interface AdminWithdrawalResponse {
  id: number;
  requestCode: string;
  walletId: number;
  storeId: number;
  storeName: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  sellerNote?: string;
  adminNote?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface ApproveWithdrawalPayload {
  adminNote?: string;
}

export interface RejectWithdrawalPayload {
  reason: string;
}

