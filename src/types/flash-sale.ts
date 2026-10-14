export type FlashSaleSlotStatus = "UPCOMING" | "ACTIVE" | "ENDED";

export interface FlashSaleSlot {
  id: number;
  name: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  status: FlashSaleSlotStatus;
  totalProducts?: number;
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
