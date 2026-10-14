# YÊU CẦU BỔ SUNG ENDPOINT — Flash Sale B2C FE

**Ngày:** 2026-10-14  
**Từ:** Frontend (flash-sale-b2c-fe)  
**Gửi:** Backend (flash-sale-b2c-UTC2)  
**Trạng thái:** Đang chờ Backend triển khai

---

## Tổng quan

Frontend đã wire API cho toàn bộ ứng dụng (Storefront, Auth, Cart, Checkout, Vouchers, Flash Sale, Search, Products, Seller Center, Admin). Tài liệu này liệt kê **chi tiết đầy đủ** từng endpoint: đã wire, còn thiếu, và cần xác nhận.

---

## MỤC LỤC

1. [Trang chủ (Homepage)](#1-trang-chủ-homepage)
2. [Sản phẩm](#2-sản-phẩm)
3. [Tìm kiếm](#3-tìm-kiếm)
4. [Giỏ hàng](#4-giỏ-hàng)
5. [Thanh toán & Đơn hàng](#5-thanh-toán--đơn-hàng)
6. [Voucher](#6-voucher)
7. [Xác thực (Auth)](#7-xác-thực-auth)
8. [Gian hàng (Store)](#8-gian-hàng-store)
9. [Flash Sale](#9-flash-sale)
10. [Đánh giá sản phẩm](#10-đánh-giá-sản-phẩm)
11. [Tài khoản người dùng](#11-tài-khoản-người-dùng)
12. [Seller Center](#12-seller-center)
13. [Admin Console](#13-admin-console)
14. [WebSocket Realtime](#14-websocket-realtime)
15. [Tóm tắt Priority](#15-tóm-tắt-priority)

---

## 1. Trang chủ (Homepage)

### 1.1 Banner (`/api/v1/banners/home`)

**Trạng thái:** ❌ CHƯA CÓ — FE đang dùng fallback là `featuredProducts`

**Mô tả:** Banner cho Hero section và side banners (Freeship, Voucher shop mới)

**FE cần:**

```typescript
// GET /api/v1/banners/home

// Response
{
  mainSlides: Banner[];  // Hero carousel (tối đa 4 slides)
  sideBanners: Banner[];  // Side banners (FREESHIP, VOUCHER_NEW_SHOP, PROMOTION)
}

interface Banner {
  id: number;
  type: "HERO" | "FREESHIP" | "VOUCHER_NEW_SHOP" | "PROMOTION";
  position: number;
  imageUrl: string;
  imageAlt: string;
  ctaHref: string;       // URL khi click vào banner
  ctaText: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}
```

**Ghi chú:**
- `type=HERO` → hiển thị trong carousel chính (8 cột)
- `type=FREESHIP` / `type=VOUCHER_NEW_SHOP` → hiển thị trong side banners (4 cột)
- Chỉ trả banner có `isActive=true` và trong khoảng `startDate` → `endDate`

---

### 1.2 Featured Stores (`/api/v1/stores/featured`)

**Trạng thái:** ❌ CHƯA CÓ — FE đang dùng fallback là `featuredProducts`

**Mô tả:** Danh sách gian hàng nổi bật (Vibe Mall)

**FE cần:**

```typescript
// GET /api/v1/stores/featured?limit=4

// Response: FeaturedStoreResponse[]
{
  id: number;
  name: string;
  logoUrl: string;
  verified: boolean;
  rating: number;
  totalRatings: number;
  followers: number;
  productThumbnails: string[]; // 4 ảnh sản phẩm tiêu biểu
  totalProducts: number;
  createdAt: string;
}
```

**Ghi chú:**
- `limit` là query param tùy chọn (default 4)
- Nên trả shops theo thứ tự: Mall → OfficialMall → Verified → mới nhất

---

### 1.3 Recommended Products (`/api/v1/products/recommended`)

**Trạng thái:** ❌ CHƯA CÓ — FE đang dùng fallback là `featuredProducts` (lấy 20 sản phẩm mới nhất)

**Mô tả:** Sản phẩm gợi ý cá nhân hoá theo tab

**FE cần:**

```typescript
// GET /api/v1/products/recommended?tab=all&limit=10
// tab: "all" | "for_you" | "best_seller" | "hot_deal"

{
  forYou: RecommendedProduct[];         // Tab "Dành cho bạn"
  bestSellers: RecommendedProduct[];    // Tab "Bán chạy"
  hotDeals: RecommendedProduct[];       // Tab "Ưu đãi sốc"
}

interface RecommendedProduct {
  id: number;
  storeId: number;
  storeName: string;
  name: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  totalSold: number;
  label: string | null;  // "Freeship" | "Giảm X%" | null
}
```

**Ghi chú:**
- `hotDeals` nên lọc sản phẩm có `minPrice < maxPrice` (đang giảm giá)
- `bestSellers` nên sort theo `totalSold` DESC
- `forYou` là personalized (có thể dùng thuật toán collaborative filtering)

---

### 1.4 Categories (`/api/v1/categories`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/categories

// Response: CategoryResponse[]
{
  id: number;
  name: string;
  slug: string;
  commissionRate: number;
  description: string;
}
```

---

### 1.5 Flash Sale Slots (`/api/v1/flash-sales/slots`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/flash-sales/slots

// Response: PublicFlashSaleSlotResponse[]
{
  id: number;
  title: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  reservationTtlSeconds: number;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  items: PublicFlashSaleItemResponse[];
}

interface PublicFlashSaleItemResponse {
  id: number;
  slotId: number;
  variantId: number;
  sku: string;
  variantName: string;
  productName: string;
  imageUrl: string;
  originalPrice: number;
  flashSalePrice: number;
  allocatedStock: number;
  availableStock: number;
  userPurchaseLimit: number;
  status: string;
}
```

---

### 1.6 Platform Vouchers (`/api/v1/vouchers/platform`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/vouchers/platform

// Response: VoucherResponse[]
{
  id: number;
  code: string;
  storeId: number | null; // null = platform voucher
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  totalQuantity: number;
  usedQuantity: number;
  userUsageLimit: number;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "EXPIRED" | "EXHAUSTED" | "DISABLED";
  createdAt: string;
}
```

---

## 2. Sản phẩm

### 2.1 Product Detail

**Trạng thái:** ⚠️ MOCK — FE cần API thật

**FE cần:**

```typescript
// GET /api/v1/products/{slug} HOẶC /api/v1/products/{id}

{
  id: number;
  name: string;
  slug: string;
  description: string;
  storeId: number;
  storeName: string;
  storeBadge?: "Mall" | "OfficialMall" | "";
  images: string[];
  variants: ProductVariant[];
  rating?: number;
  totalRatings?: number;
  totalSold?: number;
  minPrice: number;
  maxPrice: number;
  discountPercent: number | null;
  flashSale: FlashSaleInfo | null;
  categoryId: number;
  categoryName: string;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  createdAt: string;
}

interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  attributes: { name: string; value: string }[];
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
}

interface FlashSaleInfo {
  flashSaleItemId: number;
  variantId: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  totalStock: number;
  soldStock: number;
  maxQtyPerUser: number;
  endsAt: string;
}
```

---

### 2.2 Related Products

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/products/{id}/related?type=same_store&limit=10
// type: "same_store" | "best_sellers" | "similar"

{
  sameStore: ProductSummary[];
  bestSellers: ProductSummary[];
  similar: ProductSummary[];
}

interface ProductSummary {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  totalSold?: number;
  storeName: string;
}
```

---

## 3. Tìm kiếm

### 3.1 Search Products (`/api/v1/products/search`)

**Trạng thái:** ⚠️ MOCK — FE đang dùng mock data

**FE kỳ vọng:**

```typescript
// GET /api/v1/products/search?q=...&page=1&pageSize=40&sort=...

{
  items: SearchProduct[];
  total: number;
  page: number;
  pageSize: number;
  facets?: SearchFacets;
  mall?: MallInfo;
}

interface SearchProduct {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  totalRatings?: number;
  totalSold?: number;
  voucherLabel?: string; // "Freeship" | "Giảm 15%"
  storeId: number;
  storeName: string;
  storeBadge?: "Mall" | "OfficialMall" | "";
}

interface SearchFacets {
  categories: { id: number; name: string; slug: string; count: number }[];
  priceRanges: { min: number; max: number; count: number }[];
  ratingMin: number[]; // [4, 3, 2, 1]
  services: { label: string; count: number }[]; // "freeship", "voucher"
  stores: { id: number; name: string; count: number }[];
}

interface MallInfo {
  id: number;
  name: string;
  logoUrl: string;
  verified: boolean;
}
```

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Từ khóa tìm kiếm |
| `page` | int | Trang (0-based) |
| `pageSize` | int | Số item/trang (default 40) |
| `sort` | string | `relevance` \| `price_asc` \| `price_desc` \| `best_selling` \| `newest` |
| `categoryId` | int | Lọc theo danh mục |
| `priceMin` | int | Giá tối thiểu |
| `priceMax` | int | Giá tối đa |
| `minRating` | int | Rating tối thiểu (1-5) |
| `services` | string[] | `freeship`, `voucher` |

---

## 4. Giỏ hàng

### 4.1 Get Cart (`/api/v1/cart`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/cart

// Response: BackendCartResponse
{
  id: number;
  userId: number;
  storeGroups: BackendCartStoreGroup[];
  subtotal: number;
  totalShippingFee: number;
  totalItems: number;
}

interface BackendCartStoreGroup {
  storeId: number;
  storeName: string;
  storeBadge?: "Mall" | "OfficialMall" | "";
  estimatedDeliveryLabel: string;
  shippingMethodLabel: string;
  shippingFee: number;
  items: BackendCartItem[];
  shopSubtotal: number;
}

interface BackendCartItem {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}
```

---

### 4.2 Add to Cart

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/cart/items

// Request
{
  variantId: number;
  quantity: number;
}

// Response
{
  success: boolean;
  cartItem: BackendCartItem;
  cartSummary: {
    totalItems: number;
    subtotal: number;
  };
}
```

---

### 4.3 Update Cart Item Quantity

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/cart/items/{itemId}

// Request
{
  quantity: number;
}

// Response: BackendCartItem
```

---

### 4.4 Remove Cart Item

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// DELETE /api/v1/cart/items/{itemId}

// Response
{
  success: boolean;
  cartSummary: {
    totalItems: number;
    subtotal: number;
  };
}
```

---

## 5. Thanh toán & Đơn hàng

### 5.1 Checkout - Submit Order (`/api/v1/orders/checkout`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// POST /api/v1/orders/checkout

// Request
{
  shippingAddressId: number;
  platformVoucherCode?: string;
  storeOrders: {
    storeId: number;
    voucherCode?: string;
  }[];
}

// Response
{
  data: BackendOrder[];
}

interface BackendOrder {
  id: number;
  orderCode: string;
  storeId: number;
  storeName: string;
  status: string;
  paymentStatus: string;
  items: BackendOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentUrl?: string;
  qrCodeUrl?: string;
  paymentExpiry?: string;
}
```

---

### 5.2 Get Addresses (`/api/v1/users/addresses`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/users/addresses

// Response: BackendAddress[]
{
  id: number;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}
```

---

### 5.3 Order List

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/orders?status=PENDING_PAYMENT&page=0&size=10

{
  content: OrderSummary[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface OrderSummary {
  id: number;
  orderCode: string;
  status: "PENDING_PAYMENT" | "PAID" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED_TIMEOUT" | "CANCELLED_USER";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "REFUNDED";
  totalAmount: number;
  totalItems: number;
  storeName: string;
  storeBadge?: "Mall" | "OfficialMall" | "";
  thumbnail?: string;
  createdAt: string;
  paymentExpiry?: string;
}
```

---

### 5.4 Order Detail

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/orders/{orderCode}

{
  id: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    recipientName: string;
    phone: string;
    fullAddress: string;
  };
  items: {
    id: number;
    variantId: number;
    productName: string;
    variantName: string;
    imageUrl: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  voucherCode?: string;
  totalAmount: number;
  paymentMethod: "ZALOPAY" | "COD";
  paymentUrl?: string;
  qrCodeUrl?: string;
  paymentExpiry?: string;
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}
```

---

### 5.5 QR Order Detail (`/api/v1/orders/{orderCode}/qr`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/orders/{orderCode}/qr

{
  orderCode: string;
  storeName: string;
  totalAmount: number;
  qrCodeUrl: string;
  paymentExpiry: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}
```

---

### 5.6 Cancel Order

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/orders/{orderCode}/cancel

// Request
{
  reason?: string;
}

// Response
{
  success: boolean;
  orderCode: string;
  refundStatus?: "PENDING" | "COMPLETED";
}
```

---

## 6. Voucher

### 6.1 Apply Voucher (`/api/v1/vouchers/apply`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// POST /api/v1/vouchers/apply

// Request
{
  orderAmount: number;
  voucherCode: string;
  storeId?: number; // null cho platform voucher
}

// Response
{
  data: {
    voucher: BackendVoucher;
    discountAmount: number;
    applicable: boolean;
    reasonCode?: string;
  };
}

interface BackendVoucher {
  id: number;
  code: string;
  label: string;
  description: string;
  discountAmount?: number;
  discountPercent?: number;
  maxDiscount?: number;
  minOrderValue?: number;
  startDate?: string;
  endDate?: string;
}
```

---

### 6.2 Shop Vouchers (`/api/v1/vouchers/store/{storeId}`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/vouchers/store/{storeId}

// Response: BackendVoucher[]
```

---

### 6.3 My Vouchers (`/api/v1/vouchers/mine`)

**Trạng thái:** ⚠️ CẦN XÁC NHẬN

```typescript
// GET /api/v1/vouchers/mine

// Response: UserVoucher[]
{
  id: number;
  code: string;
  voucherId: number;
  savedAt: string;
  usedAt?: string;
  redeemedAt?: string;
  voucher: {
    id: number;
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    startTime: string;
    endTime: string;
    status: "ACTIVE" | "EXPIRED" | "EXHAUSTED" | "DISABLED";
    storeId: number | null;
    storeName?: string;
  };
}
```

---

### 6.4 Save Voucher

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/vouchers/mine

// Request
{
  code: string;
}

// Response: UserVoucher
```

---

## 7. Xác thực (Auth)

### 7.1 Login (`/api/v1/auth/login`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// POST /api/v1/auth/login

// Request
{
  usernameOrEmail: string;
  password: string;
}

// Response: AuthResponse
{
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number;
  user: UserResponse;
}

interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  status: "ACTIVE" | "LOCKED" | "SUSPENDED";
  createdAt: string;
}
```

---

### 7.2 Register (`/api/v1/auth/register`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// POST /api/v1/auth/register

// Request
{
  fullName: string;
  email: string;
  phone: string; // Format: +84912... (E.164)
  password: string;
}

// Response: AuthResponse
```

---

### 7.3 Logout (`/api/v1/auth/logout`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// POST /api/v1/auth/logout

// Request
{
  refreshToken: string;
}

// Response: void
```

---

### 7.4 Get Current User (`/api/v1/users/me`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/users/me

// Response: UserResponse
```

---

### 7.5 Verify Email OTP (`/api/v1/auth/verify-email`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// POST /api/v1/auth/verify-email

// Request
{
  email: string;
  code: string; // 6-digit OTP
}

// Response: AuthResponse
```

---

### 7.6 Resend OTP (`/api/v1/auth/resend-otp`)

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// POST /api/v1/auth/resend-otp

// Request
{
  email: string;
}

// Response
{
  success: boolean;
  email: string;
}
```

---

### 7.7 Refresh Token

**Trạng thái:** ⚠️ CẦN XÁC NHẬN

```typescript
// POST /api/v1/auth/refresh

// Request
{
  refreshToken: string;
}

// Response
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

---

### 7.8 Forgot Password

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/auth/forgot-password

// Request
{
  email: string;
}

// Response
{
  success: boolean;
  message: string;
}
```

---

### 7.9 Reset Password

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/auth/reset-password

// Request
{
  token: string;
  newPassword: string;
}

// Response
{
  success: boolean;
}
```

---

### 7.10 Social Login (Google, Facebook, GitHub)

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/auth/social/{provider}?redirect_uri=...
// Redirect to provider's OAuth page

// POST /api/v1/auth/social/{provider}/callback
// Exchange code for tokens

// Request (OAuth callback)
{
  code: string;
  redirect_uri: string;
}

// Response: AuthResponse
```

---

## 8. Gian hàng (Store)

### 8.1 Store Detail

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/stores/{slug} HOẶC /api/v1/stores/{id}

{
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl?: string;
  description?: string;
  rating: number;
  totalRatings: number;
  followers: number;
  totalProducts: number;
  verified: boolean;
  badge: "Mall" | "OfficialMall" | "";
  status: "PENDING" | "APPROVED" | "BANNED";
  createdAt: string;
  policies?: {
    returnPolicy: string;
    shippingPolicy: string;
  };
}
```

---

### 8.2 Store Products

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/stores/{storeId}/products?page=0&size=20&sort=createdAt,desc

{
  items: ProductSummary[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  totalSold?: number;
}
```

---

### 8.3 Store Reviews

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/stores/{storeId}/reviews?page=0&size=10

{
  items: StoreReview[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  ratingStats: {
    average: number;
    total: number;
    distribution: { rating: number; count: number }[];
  };
}

interface StoreReview {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  productId: number;
  productName: string;
  variantName?: string;
  createdAt: string;
}
```

---

## 9. Flash Sale

### 9.1 Flash Sale Slot Detail

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/flash-sales/slots/{slotId}

{
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  reservationTtlSeconds: number;
  items: FlashSaleItem[];
}

interface FlashSaleItem {
  id: number;
  variantId: number;
  sku: string;
  variantName: string;
  productName: string;
  imageUrl: string;
  originalPrice: number;
  flashSalePrice: number;
  allocatedStock: number;
  availableStock: number;
  soldCount: number;
  userPurchaseLimit: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ENDED";
}
```

---

### 9.2 Reserve Flash Sale Item

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/flash-sales/reserve

// Request
{
  flashSaleItemId: number;
  quantity: number;
}

// Response
{
  reservationId: string;
  expiresAt: string;
  flashSalePrice: number;
  totalAmount: number;
}
```

---

### 9.3 Cancel Reservation

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// DELETE /api/v1/flash-sales/reservations/{reservationId}

// Response
{
  success: boolean;
}
```

---

## 10. Đánh giá sản phẩm

### 10.1 Get Product Reviews

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/products/{productId}/reviews?page=0&size=10

{
  items: ProductReview[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  ratingStats: {
    average: number;
    total: number;
    distribution: { rating: number; count: number }[];
  };
}

interface ProductReview {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  images?: string[];
  createdAt: string;
  variantName?: string;
  helpfulCount: number;
  sellerReply?: {
    content: string;
    storeName: string;
    repliedAt: string;
  };
  isVerifiedPurchase: boolean;
  status: "VISIBLE" | "HIDDEN";
}
```

---

### 10.2 Submit Review

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/orders/{orderCode}/reviews

// Request
{
  productId: number;
  variantId?: number;
  rating: number; // 1-5
  content: string;
  images?: string[];
}

// Response
{
  id: number;
  success: boolean;
}
```

---

### 10.3 Helpful Review

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/reviews/{reviewId}/helpful

// Response
{
  success: boolean;
  helpfulCount: number;
}
```

---

## 11. Tài khoản người dùng

### 11.1 Update Profile

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/users/me

// Request
{
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

// Response: UserResponse
```

---

### 11.2 Change Password

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/users/me/change-password

// Request
{
  currentPassword: string;
  newPassword: string;
}

// Response
{
  success: boolean;
}
```

---

### 11.3 Get Addresses

**Trạng thái:** ✅ ĐÃ WIRE

```typescript
// GET /api/v1/users/addresses

// Response: Address[]
{
  id: number;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}
```

---

### 11.4 Add Address

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/users/addresses

// Request
{
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault?: boolean;
}

// Response: Address
```

---

### 11.5 Update Address

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/users/addresses/{addressId}

// Request
{
  recipientName?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  isDefault?: boolean;
}

// Response: Address
```

---

### 11.6 Delete Address

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// DELETE /api/v1/users/addresses/{addressId}

// Response
{
  success: boolean;
}
```

---

## 12. Seller Center

### 12.1 Dashboard Stats

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/seller/dashboard

{
  totalRevenue: number;
  revenueChange: number; // percentage
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  productsChange: number;
  totalViews: number;
  viewsChange: number;
  recentOrders: OrderSummary[]; // 5 đơn gần nhất
  topProducts: {
    id: number;
    name: string;
    imageUrl: string;
    sold: number;
    revenue: number;
  }[];
  revenueChart: {
    date: string;
    revenue: number;
  }[];
}
```

---

### 12.2 Seller Products

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/seller/products?page=0&size=20&status=ACTIVE

{
  items: SellerProduct[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

interface SellerProduct {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  totalSold: number;
  createdAt: string;
}
```

---

### 12.3 Create Product

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/seller/products

// Request
{
  name: string;
  description: string;
  categoryId: number;
  images: string[];
  tierVariationConfigs: {
    name: string;
    options: string[];
  }[];
  variants: {
    sku: string;
    attributes: Record<string, string>;
    price: number;
    originalPrice?: number;
    stockQuantity: number;
  }[];
}

// Response: SellerProduct
```

---

### 12.4 Update Product

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/seller/products/{productId}

// Request: same as create
```

---

### 12.5 Delete Product

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// DELETE /api/v1/seller/products/{productId}

// Response
{
  success: boolean;
}
```

---

### 12.6 Seller Orders

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/seller/orders?status=PENDING_PAYMENT&page=0&size=20

{
  items: SellerOrder[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

interface SellerOrder {
  id: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  items: {
    productName: string;
    variantName: string;
    imageUrl: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  customerName: string;
  shippingAddress: string;
  createdAt: string;
}
```

---

### 12.7 Update Order Status

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/seller/orders/{orderId}/status

// Request
{
  status: "CONFIRMED" | "SHIPPING" | "COMPLETED";
}

// Response: SellerOrder
```

---

### 12.8 Seller Flash Sales

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/seller/flash-sales

{
  slots: FlashSaleSlot[];
}

interface FlashSaleSlot {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "ENDED";
  items: {
    id: number;
    productName: string;
    flashSalePrice: number;
    allocatedStock: number;
    soldCount: number;
  }[];
}
```

---

### 12.9 Apply Flash Sale

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/seller/flash-sales/apply

// Request
{
  slotId: number;
  productVariantIds: number[];
  flashSalePrice: number;
  stockQuantity: number;
}

// Response
{
  success: boolean;
  message: string;
}
```

---

### 12.10 Seller Vouchers

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/seller/vouchers

{
  items: SellerVoucher[];
}

interface SellerVoucher {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  totalQuantity: number;
  usedQuantity: number;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "EXPIRED" | "DISABLED";
}
```

---

### 12.11 Create Voucher

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/seller/vouchers

// Request
{
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  totalQuantity: number;
  userUsageLimit?: number;
  startTime: string;
  endTime: string;
}

// Response: SellerVoucher
```

---

## 13. Admin Console

### 13.1 Admin Dashboard

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/admin/dashboard

{
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  revenueChart: {
    date: string;
    revenue: number;
  }[];
  recentOrders: OrderSummary[];
}
```

---

### 13.2 Admin Users

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/admin/users?page=0&size=20&status=ACTIVE

{
  items: AdminUser[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  status: "ACTIVE" | "LOCKED" | "SUSPENDED";
  createdAt: string;
  lastLoginAt?: string;
}
```

---

### 13.3 Admin Update User Status

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/admin/users/{userId}/status

// Request
{
  status: "ACTIVE" | "LOCKED" | "SUSPENDED";
}

// Response: AdminUser
```

---

### 13.4 Admin Stores

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/admin/stores?page=0&size=20&status=PENDING

{
  items: AdminStore[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

interface AdminStore {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  status: "PENDING" | "APPROVED" | "BANNED";
  createdAt: string;
}
```

---

### 13.5 Admin Approve/Reject Store

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/admin/stores/{storeId}/status

// Request
{
  status: "APPROVED" | "REJECTED";
  reason?: string;
}

// Response: AdminStore
```

---

### 13.6 Admin Flash Sale Slots

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// GET /api/v1/admin/flash-sales/slots?page=0&size=20

{
  items: AdminFlashSaleSlot[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

interface AdminFlashSaleSlot {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "ENDED";
  totalItems: number;
  totalRevenue: number;
}
```

---

### 13.7 Admin Approve/Reject Flash Sale

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// PUT /api/v1/admin/flash-sales/slots/{slotId}/status

// Request
{
  status: "APPROVED" | "REJECTED";
  reason?: string;
}

// Response: AdminFlashSaleSlot
```

---

### 13.8 Admin Create Flash Sale Slot

**Trạng thái:** ⚠️ CẦN THÊM

```typescript
// POST /api/v1/admin/flash-sales/slots

// Request
{
  title: string;
  startTime: string;
  endTime: string;
}

// Response: AdminFlashSaleSlot
```

---

## 14. WebSocket Realtime

### 14.1 Flash Sale Stock Update

**Trạng thái:** ⚠️ CẦN XÁC NHẬN topic

**FE cần subscribe:**

```
/topic/flash-sale/{slotId}/stock
```

**Message format:**

```typescript
{
  flashSaleItemId: number;
  availableStock: number;
  soldCount: number;
}
```

---

### 14.2 Payment Status Update

**Trạng thái:** ⚠️ CẦN XÁC NHẬN topic

**FE cần subscribe:**

```
/topic/payment/{orderCode}/status
```

**Message format:**

```typescript
{
  orderCode: string;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";
  transactionId?: string;
  paidAt?: string;
}
```

---

### 14.3 Order Status Update (Seller)

**Trạng thái:** ⚠️ CẦN XÁC NHẬN topic

**FE cần subscribe:**

```
/topic/orders/{storeId}/status
```

**Message format:**

```typescript
{
  orderId: number;
  orderCode: string;
  status: string;
  updatedAt: string;
}
```

---

## 15. Tóm tắt Priority

### 🔴 Cao (Cần sớm cho MVP)

| # | Endpoint | Mô tả | Trạng thái |
|---|----------|--------|-------------|
| 1 | `POST /api/v1/flash-sales/reserve` | Giữ chỗ Flash Sale | ❌ Thiếu |
| 2 | `GET /api/v1/orders` | List đơn hàng | ❌ Thiếu |
| 3 | `GET /api/v1/orders/{code}` | Chi tiết đơn hàng | ❌ Thiếu |
| 4 | `POST /api/v1/orders/{code}/cancel` | Hủy đơn hàng | ❌ Thiếu |
| 5 | `GET /api/v1/banners/home` | Banner trang chủ | ❌ Thiếu |
| 6 | `GET /api/v1/stores/featured` | Gian hàng nổi bật | ❌ Thiếu |
| 7 | `GET /api/v1/products/recommended` | Sản phẩm gợi ý | ❌ Thiếu |
| 8 | WebSocket topics | Flash sale stock + Payment | ❌ Thiếu |

### 🟡 Trung (Sau MVP)

| # | Endpoint | Mô tả | Trạng thái |
|---|----------|--------|-------------|
| 9 | `GET /api/v1/products/search` | Tìm kiếm sản phẩm | ⚠️ Mock |
| 10 | `GET /api/v1/products/{slug}` | Chi tiết sản phẩm | ⚠️ Mock |
| 11 | `POST /api/v1/cart/items` | Thêm vào giỏ | ❌ Thiếu |
| 12 | `PUT /api/v1/cart/items/{id}` | Cập nhật số lượng | ❌ Thiếu |
| 13 | `DELETE /api/v1/cart/items/{id}` | Xóa khỏi giỏ | ❌ Thiếu |
| 14 | `GET /api/v1/stores/{slug}` | Chi tiết gian hàng | ❌ Thiếu |
| 15 | `GET /api/v1/vouchers/mine` | Voucher của tôi | ❌ Thiếu |
| 16 | `POST /api/v1/reviews` | Submit review | ❌ Thiếu |
| 17 | `POST /api/v1/auth/refresh` | Refresh token | ⚠️ Cần xác nhận |

### 🟢 Thấp (Phase tiếp theo)

| # | Endpoint | Mô tả | Trạng thái |
|---|----------|--------|-------------|
| 18 | `POST /api/v1/auth/forgot-password` | Quên mật khẩu | ❌ Thiếu |
| 19 | `POST /api/v1/auth/reset-password` | Reset mật khẩu | ❌ Thiếu |
| 20 | `POST /api/v1/auth/social/{provider}` | Social login | ❌ Thiếu |
| 21 | `PUT /api/v1/users/me` | Cập nhật profile | ❌ Thiếu |
| 22 | `POST /api/v1/users/me/change-password` | Đổi mật khẩu | ❌ Thiếu |
| 23 | `POST /api/v1/users/addresses` | Thêm địa chỉ | ❌ Thiếu |
| 24 | Seller Center APIs | Dashboard, Products, Orders | ❌ Thiếu |
| 25 | Admin Console APIs | Users, Stores, Flash Sales | ❌ Thiếu |

---

## 16. Lưu ý kỹ thuật

### 16.1 Response Envelope

Backend nên dùng unified response envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
  timestamp: string;
}
```

Hoặc không dùng envelope, trả trực tiếp `T`.

### 16.2 Error Codes

Khi có lỗi, trả:

```typescript
{
  success: false;
  code: "ERROR_CODE"; // e.g., "OUT_OF_STOCK", "INVALID_VOUCHER"
  message: "Mô tả lỗi";
}
```

### 16.3 Pagination

Dùng Spring Data Pageable convention:

```typescript
{
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### 16.4 Authentication

- Bearer token trong header: `Authorization: Bearer <accessToken>`
- Refresh token flow cần được implement
- Token expiry: access token 15-60 phút, refresh token 7-30 ngày

### 16.5 Idempotency

Với các mutation quan trọng (checkout, reserve), client gửi header:

```
Idempotency-Key: <uuid>
```

---

## 17. Liên hệ

**Frontend Lead:** @ngominhkhoi  
**Repo:** https://github.com/ngominhkhoi05/flash-sale-b2c-fe  
**Swagger Backend:** http://180.93.137.28/swagger-ui  
**API Base URL:** http://180.93.137.28/api/v1
