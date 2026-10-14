export type FlashSaleSlotStatus = "UPCOMING" | "REGISTRATION_OPEN" | "ACTIVE" | "ENDED";

export interface FlashSaleSlot {
  id: number;
  name: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  status: FlashSaleSlotStatus;
  totalProducts?: number;
}

export interface AdminFlashSaleSession {
  id: number;
  code: string;
  name: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  timeRangeDisplay: string; // e.g. "12:00 - 14:00"
  holdSeconds: number; // default 300
  registrationDeadline: string; // ISO 8601
  approvedSkusCount: number;
  pendingSkusCount: number;
  totalSkusCount: number;
  soldQuantity: number;
  allocatedQuantity: number;
  status: FlashSaleSlotStatus;
  createdAt?: string;
}

export interface CreateFlashSaleSessionInput {
  name: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  holdSeconds: number;
  registrationDeadline: string; // YYYY-MM-DDTHH:mm or ISO
}

export interface FlashSaleItem {
  id: number;
  slotId: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName?: string;
  imageUrl: string;
  originalPrice: number;
  flashSalePrice: number;
  discountPercent: number;
  allocatedStock: number;
  availableStock: number;
  soldQuantity: number;
  category: string;
  isSoldOut: boolean;
}

export interface BuyNowRequest {
  slotId: number;
  flashSaleItemId: number;
  variantId: number;
  quantity: number;
}

export type BuyNowResultStatus = "SUCCESS" | "OUT_OF_STOCK" | "SYSTEM_ERROR";

export interface BuyNowResponse {
  status: BuyNowResultStatus;
  orderId?: number;
  orderCode?: string;
  message: string;
  remainingStock?: number;
}

export interface StockRealtimeUpdate {
  slotId: number;
  itemId: number;
  availableStock: number;
  soldQuantity: number;
  isSoldOut: boolean;
  timestamp: string;
}
