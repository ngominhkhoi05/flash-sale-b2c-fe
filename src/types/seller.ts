/**
 * Định nghĩa Type cho phân hệ Kênh Người Bán (Seller Center).
 * Khớp với DTO backend trong `flash-sale-b2c-UTC2`.
 */

export interface SidebarSummaryResponse {
  totalProducts: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  ratingAvg: number;
  ratingCount: number;
  lowStockProducts: number;
  storeStatus: string;
}

export interface SellerOrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  variantId: number;
  variantSku: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface SellerOrderResponse {
  id: number;
  orderCode: string;
  buyerId: number;
  storeId: number;
  storeName: string;
  slotId?: number | null;
  voucherId?: number | null;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity?: string;
  recipientDistrict?: string;
  recipientWard?: string;
  totalItemAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items?: SellerOrderItemResponse[];
}

export interface SellerProductSummaryResponse {
  id: number;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  imageUrl?: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  totalSold: number;
  status: "ACTIVE" | "INACTIVE" | "DELETED" | string;
  createdAt: string;
}

export interface SellerRevenueDayPoint {
  date: string;
  dayLabel: string;
  revenue: number;
  previousWeekRevenue: number;
  ordersCount: number;
}

export interface SellerProductVariantResponse {
  id: number;
  skuCode: string;
  originalPrice: number;
  salePrice: number;
  stockQuantity: number;
  status: string;
  attributes?: Record<string, string>;
}

export interface SellerProductDetailResponse {
  id: number;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  status: string;
  variants: SellerProductVariantResponse[];
  tierVariations?: Array<{
    name: string;
    options: string[];
  }>;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  commissionRate?: number;
  description?: string;
}

export interface TierVariationConfig {
  name: string;
  options: string[];
}

export interface CreateProductVariantDto {
  sku: string;
  variantName: string;
  attributes?: Record<string, string>;
  originalPrice: number;
  stockQuantity: number;
}

export interface CreateProductPayload {
  categoryId: number;
  name: string;
  description: string;
  imageUrl?: string;
  tierVariationConfigs: TierVariationConfig[];
  variants: CreateProductVariantDto[];
}

export interface UpdateProductPayload {
  categoryId: number;
  name: string;
  description: string;
  imageUrl?: string;
  status: string;
  tierVariationConfigs: TierVariationConfig[];
  variants: Array<CreateProductVariantDto & { id?: number }>;
}
