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

export interface OrderTimelineItem {
  status: string;
  label: string;
  at: string;
}

export interface SellerOrderItemResponse {
  id: number;
  productId?: number;
  productName: string;
  variantId?: number;
  variantSku?: string;
  variantName?: string;
  productImage?: string;
  imageUrl?: string;
  unitPrice?: number;
  priceAtPurchase?: number;
  quantity: number;
  totalPrice?: number;
  itemSubtotal?: number;
  flashSaleItemId?: number | null;
}

export interface SellerOrderResponse {
  id: number;
  orderCode: string;
  buyerId?: number;
  storeId?: number;
  storeName?: string;
  slotId?: number | null;
  voucherId?: number | null;
  recipientName: string;
  recipientPhone: string;
  recipientAddress?: string;
  shippingAddressText?: string;
  recipientCity?: string;
  recipientDistrict?: string;
  recipientWard?: string;
  totalItemAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  voucherDiscountAmount?: number;
  shippingFee?: number;
  finalAmount?: number;
  totalAmount?: number;
  platformFee?: number;
  commissionRate?: number;
  sellerAmount?: number;
  paymentMethod: string;
  paymentStatus?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  trackingNumber?: string;
  carrierName?: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
  shippedAt?: string;
  completedAt?: string;
  timeline?: OrderTimelineItem[];
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

export interface FlashSaleSlotItem {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  reservationTtlSeconds?: number;
  participatingStoresCount?: number;
  availableProductSlots?: number;
  badgeLabel?: string;
}

export interface RegisterFlashSaleItemDto {
  slotId: number;
  variantId: number;
  flashSalePrice: number;
  allocatedStock: number;
  userPurchaseLimit?: number;
}

export interface RegisteredFlashSaleHistoryItem {
  id: number;
  productName: string;
  sku: string;
  imageUrl?: string;
  slotTitle: string;
  slotDate: string;
  slotTime: string;
  flashSalePrice: number;
  allocatedStock: number;
  soldStock: number;
  status: "APPROVED" | "PENDING" | "REJECTED" | "ENDED" | string;
  rejectReason?: string;
}

export interface SellerBankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isVerified: boolean;
}

export interface SellerWalletResponse {
  balance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  bankAccount: SellerBankAccount;
}

export interface SellerWalletTransaction {
  id: number;
  transactionCode: string;
  orderCode?: string;
  type: "ORDER_SETTLEMENT" | "WITHDRAWAL" | "REFUND" | string;
  amount: number;
  balanceAfter: number;
  description: string;
  status: "SUCCESS" | "PENDING" | "FAILED" | string;
  createdAt: string;
}

export interface SellerWithdrawalRequest {
  amount: number;
  bankAccountNumber?: string;
  note?: string;
}

export interface SellerVoucherItem {
  id: number;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  totalUsageLimit: number;
  currentUsageCount: number;
  userUsageLimit: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "UPCOMING" | "EXPIRED" | "DISABLED" | string;
  createdAt: string;
}

export interface CreateSellerVoucherPayload {
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  totalUsageLimit: number;
  userUsageLimit?: number;
  startDate: string;
  endDate: string;
}

export interface SellerReviewItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  variantSku?: string;
  variantName?: string;
  orderCode?: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number;
  comment: string;
  mediaUrls?: string[];
  sellerReply?: {
    id: number;
    replyText: string;
    repliedAt: string;
  } | null;
  createdAt: string;
}

export interface SellerReviewSummaryResponse {
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  unrepliedCount: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReplySellerReviewPayload {
  reviewId: number;
  replyText: string;
}



