# BẢNG TỔNG KHO VÀ ĐẶC TẢ API BACKEND THỰC TẾ (BE API INVENTORY)

> **Ngày lập**: 2026-10-18  
> **Source of Truth**: Codebase Backend `flash-sale-b2c-UTC2` (Spring Boot 3, Java 25)  
> **Mục đích**: Đối soát toàn bộ các REST endpoint, WebSocket topics, cơ chế định danh và phân quyền thực tế phía BE để tích hợp chính xác vào Frontend (`flash-sale-b2c-fe`).

---

## 1. Cơ chế Xác thực & Định danh Danh tính (Authentication & Identity)

### 1.1. Chuẩn xác thực: JWT Bearer Token
- **Cơ chế**: Backend sử dụng Spring Security Stateless với `JwtAuthenticationFilter`.
- **Header yêu cầu**: Mọi request yêu cầu đăng nhập phải gửi qua Header:
  ```http
  Authorization: Bearer <jwt_access_token>
  ```
- **Lưu ý quan trọng về Header `X-User-Id`**:
  - Trong code BE hiện tại, **hoàn toàn không có bất kỳ Controller nào đọc header `X-User-Id`**.
  - Mọi controller lấy thông tin người dùng qua `@AuthenticationPrincipal CustomUserDetails userDetails`, trích xuất trực tiếp từ JWT Subject (`user.getId()`).
  - Vì vậy, các cuộc gọi API thật tới BE **bắt buộc phải kèm JWT token** (hoặc đăng nhập lấy token lưu vào localStorage).

### 1.2. Phân biệt Vai trò (RBAC: Buyer / Seller / Admin)
- Backend giải mã quyền từ JWT claim `authorities` hoặc nạp từ database qua `user_roles`:
  - **Buyer (`ROLE_BUYER` / `ROLE_USER`)**: Được truy cập các API Storefront công khai, giỏ hàng (`/api/v1/cart/**`), đặt hàng (`/api/v1/orders/**`), ví voucher cá nhân (`/api/v1/vouchers/mine`), sổ địa chỉ (`/api/v1/users/addresses/**`).
  - **Seller (`ROLE_SELLER`)**: Được truy cập toàn bộ các endpoint tiền tố `/api/v1/seller/**`, quản lý shop (`/api/v1/stores/me`, `/api/v1/stores/sidebar/summary`), quản lý sản phẩm shop, đăng ký Flash Sale, quản lý đơn hàng shop.
  - **Admin (`ROLE_ADMIN`)**: Được truy cập toàn bộ các endpoint tiền tố `/api/v1/admin/**` (duyệt/khóa gian hàng, tạo/sửa slot Flash Sale, duyệt SKU Flash Sale, pre-warm Redis, tạo voucher sàn...).

### 1.3. Cơ chế xác định Gian hàng (Store) của Seller
- Seller **không cần và không được gửi `storeId` từ Client** để tránh giả mạo dữ liệu.
- Service phía BE (`ProductServiceImpl`, `OrderServiceImpl`, `FlashSaleItemServiceImpl`) tự động tra cứu:
  ```java
  Store store = storeRepository.findByUserId(userId)
      .orElseThrow(() -> new BusinessException(StoreErrorCode.STORE_NOT_FOUND));
  if (!"APPROVED".equalsIgnoreCase(store.getStatus())) {
      throw new BusinessException(ProductErrorCode.STORE_NOT_ELIGIBLE);
  }
  ```
- Nếu tài khoản Seller chưa có Store hoặc Store chưa được Admin duyệt (`APPROVED`), BE sẽ ném lỗi 403/422 (`STORE_NOT_ELIGIBLE`).

---

## 2. Danh mục Kênh Realtime WebSocket / STOMP

### 2.1. Cấu hình kết nối Handshake & Broker
- **Handshake URL**: `http://localhost:8080/ws` (hỗ trợ SockJS fallback tại `/ws/**`).
- **Handshake Authentication**: Truyền JWT qua query parameter: `ws://localhost:8080/ws?token=<jwt_access_token>`.
- **Public Broker Prefix**: `/topic` (dùng cho broadcast sự kiện chung toàn sàn).
- **Private Broker Prefix**: `/user` (dùng cho thông báo riêng từng user).
- **Application Destination Prefix**: `/app` (tuy nhiên BE hiện **không có `@MessageMapping` handler nào**, toàn bộ luồng gửi dữ liệu đi qua REST API, WebSocket chỉ dùng để server broadcast).
- **Heartbeat**: 10 giây (10,000ms / 10,000ms).

### 2.2. Danh sách Topic & Queue Destinations thực tế của BE
| Loại | Destination Pattern | Mô tả sự kiện | Payload DTO |
|---|---|---|---|
| **Public Topic** | `/topic/flash-sale/slot/{slotId}/stock-update` | Cập nhật số lượng tồn kho khả dụng khi có người mua, hoặc khi hoàn kho rollback / unsold | `FlashSaleWsEvent` |
| **Public Topic** | `/topic/flash-sale/slot/{slotId}/status` | Trạng thái khung giờ thay đổi (`UPCOMING` → `ACTIVE` hoặc `ACTIVE` → `ENDED`) | `FlashSaleWsEvent` |
| **Public Topic** | `/topic/flash-sale/item/{itemId}/stock` | Cập nhật kho realtime riêng cho 1 SKU cụ thể | `FlashSaleWsEvent` |
| **Private Queue** | `/user/queue/flash-sale/reservation-result` | Kết quả giữ chỗ Flash Sale gửi riêng cho người mua | `FlashSaleWsEvent` |
| **Private Queue** | `/user/queue/flash-sale/orders/{orderCode}/updates` | Cập nhật trạng thái đơn Flash Sale (hết hạn giữ chỗ, hủy, thanh toán) | `FlashSaleWsEvent` |

### 2.3. Cấu trúc Payload Realtime (`FlashSaleWsEvent`)
```json
{
  "eventType": "STOCK_DECREMENTED | STOCK_RESTORED | STOCK_RETURNED_UNSOLD | SLOT_ACTIVATED | SLOT_CLOSED | ORDER_RESERVED | ORDER_CANCELLED_TIMEOUT",
  "slotId": 102,
  "flashSaleItemId": 42,
  "orderId": 1001,
  "userId": 15,
  "availableStock": 45,
  "allocatedStock": 50,
  "totalAmount": 150000,
  "quantity": 1,
  "orderCode": "FS-20261018-001",
  "expiresAt": "2026-10-18T05:35:00Z",
  "slotStatus": "ACTIVE",
  "restoredQuantity": 1,
  "occurredAt": "2026-10-18T05:30:00Z"
}
```

---

## 3. Danh sách Chi tiết Tất cả Endpoint REST Phía BE (93 Endpoints)

### 3.84 Module `AUTH` (4 endpoints)
> **Mã lỗi đặc thù (AuthErrorCode)**: `EMAIL_ALREADY_EXISTS` (CONFLICT), `PHONE_ALREADY_EXISTS` (CONFLICT), `INVALID_CREDENTIALS` (UNAUTHORIZED), `INVALID_REFRESH_TOKEN` (UNAUTHORIZED), `USER_DISABLED` (FORBIDDEN), `USER_NOT_FOUND` (NOT_FOUND)...

#### `POST /api/v1/auth/register`
- **Mô tả**: register
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java)
- **Quyền yêu cầu**: Public (PermitAll)
- **Tham số**: Không có
- **Request Body (`RegisterRequest`)**: `email: String`, `password: String`, `fullName: String`, `phone: String`
- **Response Type (`ApiResponse<AuthResponse`)**: `accessToken: String`, `refreshToken: String`, `expiresIn: long`, `user: UserResponse`, `roles: List<String>`

#### `POST /api/v1/auth/login`
- **Mô tả**: login
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java)
- **Quyền yêu cầu**: Public (PermitAll)
- **Tham số**: Không có
- **Request Body (`LoginRequest`)**: `usernameOrEmail: String`, `password: String`
- **Response Type (`ApiResponse<AuthResponse`)**: `accessToken: String`, `refreshToken: String`, `expiresIn: long`, `user: UserResponse`, `roles: List<String>`

#### `POST /api/v1/auth/refresh-token`
- **Mô tả**: refreshToken
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java)
- **Quyền yêu cầu**: Public (PermitAll)
- **Tham số**: Không có
- **Request Body (`RefreshTokenRequest`)**: `refreshToken: String`
- **Response Type (`ApiResponse<AuthResponse`)**: `accessToken: String`, `refreshToken: String`, `expiresIn: long`, `user: UserResponse`, `roles: List<String>`

#### `POST /api/v1/auth/logout`
- **Mô tả**: logout
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/auth/controller/AuthController.java)
- **Quyền yêu cầu**: Public (PermitAll)
- **Tham số**: Không có
- **Request Body (`RefreshTokenRequest`)**: `refreshToken: String`
- **Response Type (`ApiResponse<Void`)**: Void

### 3.119 Module `BANNER` (6 endpoints)
> **Mã lỗi đặc thù (BannerErrorCode)**: `BANNER_NOT_FOUND` (NOT_FOUND), `BANNER_INVALID_STATUS` (UNPROCESSABLE_ENTITY), `BANNER_INVALID_DATE_RANGE` (BAD_REQUEST), `BANNER_IMAGE_URL_BLANK` (BAD_REQUEST)...

#### `GET /api/v1/admin/banners`
- **Mô tả**: listBanners
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Query Parameters**: `required` (String, bắt buộc), `required` (Boolean, bắt buộc), `defaultValue` (int, bắt buộc), `defaultValue` (int, bắt buộc)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Page<BannerListItem`)**: Page<BannerListItem

#### `POST /api/v1/admin/banners`
- **Mô tả**: createBanner
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: Không có
- **Request Body (`BannerRequest`)**: `type: BannerType`, `position: Integer`, `imageUrl: String`, `imageAlt: String`, `ctaHref: String`, `ctaText: String`, `isActive: Boolean`, `startDate: Instant`...
- **Response Type (`ApiResponse<BannerListItem`)**: `id: Long`, `type: BannerType`, `position: Integer`, `imageUrl: String`, `imageAlt: String`, `ctaHref: String`, `ctaText: String`, `isActive: Boolean`...

#### `PUT /api/v1/admin/banners/{id}`
- **Mô tả**: updateBanner
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body (`BannerRequest`)**: `type: BannerType`, `position: Integer`, `imageUrl: String`, `imageAlt: String`, `ctaHref: String`, `ctaText: String`, `isActive: Boolean`, `startDate: Instant`...
- **Response Type (`ApiResponse<BannerListItem`)**: `id: Long`, `type: BannerType`, `position: Integer`, `imageUrl: String`, `imageAlt: String`, `ctaHref: String`, `ctaText: String`, `isActive: Boolean`...

#### `DELETE /api/v1/admin/banners/{id}`
- **Mô tả**: deleteBanner
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `PATCH /api/v1/admin/banners/{id}/status`
- **Mô tả**: changeStatus
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerAdminController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long; **Query Parameters**: `isActive` (Boolean, bắt buộc)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<BannerListItem`)**: `id: Long`, `type: BannerType`, `position: Integer`, `imageUrl: String`, `imageAlt: String`, `ctaHref: String`, `ctaText: String`, `isActive: Boolean`...

#### `GET /api/v1/banners/home`
- **Mô tả**: getHomeBanners
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerPublicController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/banner/controller/BannerPublicController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<HomeBannersResponse`)**: `mainSlides: List<BannerResponse>`, `sideBanners: List<BannerResponse>`

### 3.170 Module `CART` (5 endpoints)
> **Mã lỗi đặc thù (CartErrorCode)**: ...

#### `GET /api/v1/cart`
- **Mô tả**: getCart
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<CartResponse`)**: `id: Long`, `userId: Long`, `storeGroups: List<CartStoreGroupResponse>`, `totalItems: Integer`, `subtotal: BigDecimal`, `totalShippingFee: BigDecimal`, `totalAmount: BigDecimal`, `grandTotal: BigDecimal`

#### `POST /api/v1/cart/items`
- **Mô tả**: addToCart
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`AddToCartRequest`)**: `variantId: Long`, `quantity: Integer`
- **Response Type (`ApiResponse<CartResponse`)**: `id: Long`, `userId: Long`, `storeGroups: List<CartStoreGroupResponse>`, `totalItems: Integer`, `subtotal: BigDecimal`, `totalShippingFee: BigDecimal`, `totalAmount: BigDecimal`, `grandTotal: BigDecimal`

#### `PUT /api/v1/cart/items/{itemId}`
- **Mô tả**: updateCartItem
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `itemId`: Long
- **Request Body (`UpdateCartItemRequest`)**: `quantity: Integer`
- **Response Type (`ApiResponse<CartResponse`)**: `id: Long`, `userId: Long`, `storeGroups: List<CartStoreGroupResponse>`, `totalItems: Integer`, `subtotal: BigDecimal`, `totalShippingFee: BigDecimal`, `totalAmount: BigDecimal`, `grandTotal: BigDecimal`

#### `DELETE /api/v1/cart/items/{itemId}`
- **Mô tả**: removeCartItem
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `itemId`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `DELETE /api/v1/cart`
- **Mô tả**: clearCart
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/cart/controller/CartController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

### 3.213 Module `FLASHSALE` (12 endpoints)
> **Mã lỗi đặc thù (FlashSaleErrorCode)**: `SLOT_NOT_FOUND` (NOT_FOUND), `SLOT_TIME_INVALID` (BAD_REQUEST), `SLOT_OVERLAP` (CONFLICT), `SLOT_NOT_ACTIVE` (BAD_REQUEST), `SLOT_ALREADY_ENDED` (BAD_REQUEST), `ITEM_NOT_FOUND` (NOT_FOUND)...

#### `POST /api/v1/admin/flash-sales/slots`
- **Mô tả**: Tạo phiên Flash Sale mới
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: Không có
- **Request Body (`CreateFlashSaleSlotRequest`)**: `title: String`, `startTime: Instant`, `endTime: Instant`
- **Response Type (`ApiResponse<FlashSaleSlotResponse`)**: `id: Long`, `title: String`, `startTime: Instant`, `endTime: Instant`, `reservationTtlSeconds: Integer`, `status: String`, `createdAt: Instant`

#### `PUT /api/v1/admin/flash-sales/slots/{id}`
- **Mô tả**: Cập nhật phiên Flash Sale
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body (`UpdateFlashSaleSlotRequest`)**: `title: String`, `startTime: Instant`, `endTime: Instant`, `reservationTtlSeconds: Integer`, `status: String`
- **Response Type (`ApiResponse<FlashSaleSlotResponse`)**: `id: Long`, `title: String`, `startTime: Instant`, `endTime: Instant`, `reservationTtlSeconds: Integer`, `status: String`, `createdAt: Instant`

#### `GET /api/v1/admin/flash-sales/slots/{id}`
- **Mô tả**: Lấy chi tiết phiên Flash Sale
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<FlashSaleSlotResponse`)**: `id: Long`, `title: String`, `startTime: Instant`, `endTime: Instant`, `reservationTtlSeconds: Integer`, `status: String`, `createdAt: Instant`

#### `GET /api/v1/admin/flash-sales/slots`
- **Mô tả**: Danh sách toàn bộ phiên Flash Sale
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<FlashSaleSlotResponse`)**: `id: Long`, `title: String`, `startTime: Instant`, `endTime: Instant`, `reservationTtlSeconds: Integer`, `status: String`, `createdAt: Instant`

#### `PATCH /api/v1/admin/flash-sales/items/{id}/approve`
- **Mô tả**: Duyệt sản phẩm Flash Sale
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<FlashSaleItemResponse`)**: `id: Long`, `slotId: Long`, `variantId: Long`, `flashSalePrice: BigDecimal`, `allocatedStock: Integer`, `availableStock: Integer`, `userPurchaseLimit: Integer`, `commissionRateOverride: BigDecimal`...

#### `POST /api/v1/admin/flash-sales/slots/{id}/pre-warm`
- **Mô tả**: Pre-warm nạp kho Redis trước phiên sale
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/AdminFlashSaleController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `GET /api/v1/flash-sales/slots`
- **Mô tả**: Xem danh sách các phiên Flash Sale đang và sắp diễn ra
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSalePublicController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSalePublicController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<PublicFlashSaleSlotResponse`)**: `id: Long`, `title: String`, `startTime: Instant`, `endTime: Instant`, `reservationTtlSeconds: Integer`, `status: String`, `items: List<PublicFlashSaleItemResponse>`, `id: Long`...

#### `GET /api/v1/flash-sales/items/active`
- **Mô tả**: Xem danh sách các sản phẩm Flash Sale đang mở bán active cho trang chủ
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSalePublicController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSalePublicController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<PublicFlashSaleSlotResponse.PublicFlashSaleItemResponse`)**: PublicFlashSaleItemResponse

#### `POST /api/v1/flash-sales/reserve`
- **Mô tả**: Giữ chỗ Flash Sale (Mục 9.2)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSaleReservationServiceController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSaleReservationServiceController.java)
- **Quyền yêu cầu**: isAuthenticated()
- **Tham số**: Không có
- **Request Body (`CreateReservationRequest`)**: `flashSaleItemId: Long`, `addressId: Long`
- **Response Type (`ApiResponse<ReservationResponse`)**: `orderId: Long`, `orderCode: String`, `reservationId: String`, `flashSaleItemId: Long`, `quantity: Integer`, `flashSalePrice: BigDecimal`, `totalAmount: BigDecimal`, `status: String`...

#### `DELETE /api/v1/flash-sales/reservations/{reservationId}`
- **Mô tả**: Hủy giữ chỗ Flash Sale (Mục 9.3)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSaleReservationServiceController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSaleReservationServiceController.java)
- **Quyền yêu cầu**: isAuthenticated()
- **Tham số**: **Path Variables**: `reservationId`: String
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<CancelReservationResponse`)**: `success: boolean`, `reservationId: String`, `message: String`

#### `POST /api/v1/flash-sales/reservations`
- **Mô tả**: Đặt hàng giữ chỗ Flash Sale (Alias tương thích ngược)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSaleReservationServiceController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/FlashSaleReservationServiceController.java)
- **Quyền yêu cầu**: isAuthenticated()
- **Tham số**: Không có
- **Request Body (`CreateReservationRequest`)**: `flashSaleItemId: Long`, `addressId: Long`
- **Response Type (`ApiResponse<ReservationResponse`)**: `orderId: Long`, `orderCode: String`, `reservationId: String`, `flashSaleItemId: Long`, `quantity: Integer`, `flashSalePrice: BigDecimal`, `totalAmount: BigDecimal`, `status: String`...

#### `POST /api/v1/seller/flash-sales/items`
- **Mô tả**: Đăng ký biến thể tham gia Flash Sale
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/SellerFlashSaleController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/flashsale/controller/SellerFlashSaleController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: Không có
- **Request Body (`RegisterFlashSaleItemRequest`)**: `slotId: Long`, `variantId: Long`, `flashSalePrice: BigDecimal`, `allocatedStock: Integer`, `commissionRateOverride: BigDecimal`
- **Response Type (`ApiResponse<FlashSaleItemResponse`)**: `id: Long`, `slotId: Long`, `variantId: Long`, `flashSalePrice: BigDecimal`, `allocatedStock: Integer`, `availableStock: Integer`, `userPurchaseLimit: Integer`, `commissionRateOverride: BigDecimal`...

### 3.312 Module `IMAGE` (6 endpoints)
> **Mã lỗi đặc thù (ImageErrorCode)**: `FILE_TOO_LARGE` (PAYLOAD_TOO_LARGE), `INVALID_FORMAT` (BAD_REQUEST), `FILE_EMPTY` (BAD_REQUEST), `NOT_OWNER` (FORBIDDEN), `PRIMARY_EXISTS` (CONFLICT), `IMAGE_NOT_FOUND` (NOT_FOUND)...

#### `POST /api/v1/images/upload`
- **Mô tả**: upload
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Query Parameters**: `ownerType` (ImageOwnerType, bắt buộc), `ownerId` (Long, bắt buộc), `isPrimary` (Boolean, tùy chọn), `displayOrder` (Integer, tùy chọn); **Multipart Form Data**: `file` (MultipartFile)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

#### `GET /api/v1/images`
- **Mô tả**: list
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Query Parameters**: `ownerType` (ImageOwnerType, bắt buộc), `ownerId` (Long, bắt buộc)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

#### `PATCH /api/v1/images/{id}/primary`
- **Mô tả**: setPrimary
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

#### `PATCH /api/v1/images/{id}/order`
- **Mô tả**: setOrder
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body (`UpdateImageOrderRequest`)**: `displayOrder: Integer`
- **Response Type (`ApiResponse<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

#### `DELETE /api/v1/images/{id}`
- **Mô tả**: delete
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `DELETE /api/v1/images/{id}/force`
- **Mô tả**: forceDelete
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/image/controller/ImageController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

### 3.363 Module `ORDER` (7 endpoints)
> **Mã lỗi đặc thù (OrderErrorCode)**: ...

#### `POST /api/v1/orders/checkout`
- **Mô tả**: checkout
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`CreateOrderRequest`)**: `shippingAddressId: Long`, `storeOrders: List<CheckoutStoreOrderRequest>`
- **Response Type (`ApiResponse<List<OrderResponse`)**: `id: Long`, `orderCode: String`, `buyerId: Long`, `storeId: Long`, `storeName: String`, `slotId: Long`, `voucherId: Long`, `recipientName: String`...

#### `GET /api/v1/orders`
- **Mô tả**: getMyOrders
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Query Parameters**: `defaultValue` (int, bắt buộc), `defaultValue` (int, bắt buộc)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<PageResponse<OrderResponse`)**: `id: Long`, `orderCode: String`, `buyerId: Long`, `storeId: Long`, `storeName: String`, `slotId: Long`, `voucherId: Long`, `recipientName: String`...

#### `GET /api/v1/orders/{id}`
- **Mô tả**: getOrderDetail
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<OrderResponse`)**: `id: Long`, `orderCode: String`, `buyerId: Long`, `storeId: Long`, `storeName: String`, `slotId: Long`, `voucherId: Long`, `recipientName: String`...

#### `PATCH /api/v1/orders/{id}/cancel`
- **Mô tả**: cancelOrder
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<OrderResponse`)**: `id: Long`, `orderCode: String`, `buyerId: Long`, `storeId: Long`, `storeName: String`, `slotId: Long`, `voucherId: Long`, `recipientName: String`...

#### `GET /api/v1/orders/{orderCode}/qr`
- **Mô tả**: getOrderQrDetail
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/OrderController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `orderCode`: String
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<QrOrderDetailResponse`)**: `orderCode: String`, `qrCodeUrl: String`, `expiresAt: Instant`, `paymentExpiry: Instant`, `amount: BigDecimal`, `totalAmount: BigDecimal`, `paymentUrl: String`, `shopOrders: List<QrShopOrderResponse>`

#### `GET /api/v1/seller/orders`
- **Mô tả**: getMyStoreOrders
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/SellerOrderController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/SellerOrderController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Query Parameters**: `defaultValue` (int, bắt buộc), `defaultValue` (int, bắt buộc)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<PageResponse<OrderResponse`)**: `id: Long`, `orderCode: String`, `buyerId: Long`, `storeId: Long`, `storeName: String`, `slotId: Long`, `voucherId: Long`, `recipientName: String`...

#### `PATCH /api/v1/seller/orders/{id}/status`
- **Mô tả**: updateOrderStatus
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/SellerOrderController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/order/controller/SellerOrderController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body (`UpdateOrderStatusRequest`)**: `status: String`
- **Response Type (`ApiResponse<OrderResponse`)**: `id: Long`, `orderCode: String`, `buyerId: Long`, `storeId: Long`, `storeName: String`, `slotId: Long`, `voucherId: Long`, `recipientName: String`...

### 3.422 Module `PAYMENT` (3 endpoints)
> **Mã lỗi đặc thù (OrderErrorCode)**: ...

#### `GET /api/v1/orders/{id}/payment`
- **Mô tả**: getPayment
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/payment/controller/OrderPaymentController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/payment/controller/OrderPaymentController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<PaymentResponse`)**: `id: Long`, `orderId: Long`, `orderCode: String`, `paymentMethod: String`, `transactionCode: String`, `amount: BigDecimal`, `qrCodeUrl: String`, `paymentUrl: String`...

#### `POST /api/v1/orders/{id}/payment/zalopay`
- **Mô tả**: createZaloPayPayment
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/payment/controller/OrderPaymentController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/payment/controller/OrderPaymentController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<PaymentResponse`)**: `id: Long`, `orderId: Long`, `orderCode: String`, `paymentMethod: String`, `transactionCode: String`, `amount: BigDecimal`, `qrCodeUrl: String`, `paymentUrl: String`...

#### `POST /api/v1/orders/{id}/payment/cod`
- **Mô tả**: confirmCodPayment
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/payment/controller/OrderPaymentController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/payment/controller/OrderPaymentController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<PaymentResponse`)**: `id: Long`, `orderId: Long`, `orderCode: String`, `paymentMethod: String`, `transactionCode: String`, `amount: BigDecimal`, `qrCodeUrl: String`, `paymentUrl: String`...

### 3.449 Module `PRODUCT` (18 endpoints)
> **Mã lỗi đặc thù (ProductErrorCode)**: `CATEGORY_NOT_FOUND` (NOT_FOUND), `CATEGORY_NAME_ALREADY_EXISTS` (CONFLICT), `CATEGORY_SLUG_ALREADY_EXISTS` (CONFLICT), `PRODUCT_NOT_FOUND` (NOT_FOUND), `PRODUCT_ACCESS_DENIED` (FORBIDDEN), `STORE_NOT_ELIGIBLE` (FORBIDDEN)...

#### `POST /api/v1/admin/categories`
- **Mô tả**: createCategory
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/AdminCategoryController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/AdminCategoryController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: Không có
- **Request Body (`CreateCategoryRequest`)**: `name: String`, `slug: String`, `commissionRate: BigDecimal`, `description: String`
- **Response Type (`ApiResponse<CategoryResponse`)**: `id: Integer`, `name: String`, `slug: String`, `commissionRate: BigDecimal`, `description: String`

#### `PUT /api/v1/admin/categories/{id}`
- **Mô tả**: updateCategory
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/AdminCategoryController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/AdminCategoryController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Integer
- **Request Body (`UpdateCategoryRequest`)**: `name: String`, `slug: String`, `commissionRate: BigDecimal`, `description: String`
- **Response Type (`ApiResponse<CategoryResponse`)**: `id: Integer`, `name: String`, `slug: String`, `commissionRate: BigDecimal`, `description: String`

#### `DELETE /api/v1/admin/categories/{id}`
- **Mô tả**: deleteCategory
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/AdminCategoryController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/AdminCategoryController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Integer
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `GET /api/v1/categories`
- **Mô tả**: getAllCategories
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/CategoryController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/CategoryController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<CategoryResponse`)**: `id: Integer`, `name: String`, `slug: String`, `commissionRate: BigDecimal`, `description: String`

#### `GET /api/v1/categories/{id}`
- **Mô tả**: getCategoryById
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/CategoryController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/CategoryController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: **Path Variables**: `id`: Integer
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<CategoryResponse`)**: `id: Integer`, `name: String`, `slug: String`, `commissionRate: BigDecimal`, `description: String`

#### `GET /api/v1/categories/slug/{slug}`
- **Mô tả**: getCategoryBySlug
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/CategoryController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/CategoryController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: **Path Variables**: `slug`: String
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<CategoryResponse`)**: `id: Integer`, `name: String`, `slug: String`, `commissionRate: BigDecimal`, `description: String`

#### `GET /api/v1/products/recommended`
- **Mô tả**: Lay san pham recommended (for_you, best_seller, hot_deal) - Public
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: **Query Parameters**: `tab` (String, tùy chọn, default=`all`), `categoryId` (Long, tùy chọn), `limit` (int, tùy chọn, default=`10`)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<RecommendedProductsResponse`)**: `forYou: List<RecommendedProductResponse>`, `bestSellers: List<RecommendedProductResponse>`, `hotDeals: List<RecommendedProductResponse>`

#### `GET /api/v1/products/slug/{slug}`
- **Mô tả**: Xem chi tiet san pham theo slug SEO (Public)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: **Path Variables**: `slug`: String
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ProductDetailResponse`)**: `id: Long`, `storeId: Long`, `storeName: String`, `categoryId: Integer`, `categoryName: String`, `name: String`, `imageUrl: String`, `description: String`...

#### `GET /api/v1/products`
- **Mô tả**: Tim kiem & loc danh sach san pham san (Public)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: **Query Parameters**: `slug` (String, tùy chọn); **Phân trang / Sắp xếp**: `@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)`
- **Request Body**: Không yêu cầu (None)
- **Response Type (`?`)**: ?

#### `GET /api/v1/products/{id}`
- **Mô tả**: Xem chi tiết sản phẩm và các biến thể phân loại SKU (Public)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/ProductController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ProductDetailResponse`)**: `id: Long`, `storeId: Long`, `storeName: String`, `categoryId: Integer`, `categoryName: String`, `name: String`, `imageUrl: String`, `description: String`...

#### `POST /api/v1/seller/products`
- **Mô tả**: Đăng bán sản phẩm mới (SPU-SKU)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: Không có
- **Request Body (`CreateProductRequest`)**: `categoryId: Integer`, `name: String`, `description: String`, `tierVariationConfigs: List<TierVariationConfigDto>`, `variants: List<CreateProductVariantRequest>`
- **Response Type (`ApiResponse<ProductDetailResponse`)**: `id: Long`, `storeId: Long`, `storeName: String`, `categoryId: Integer`, `categoryName: String`, `name: String`, `imageUrl: String`, `description: String`...

#### `GET /api/v1/seller/products`
- **Mô tả**: Danh sách sản phẩm của người bán
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Query Parameters**: `required` (String, bắt buộc); **Phân trang / Sắp xếp**: `@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)`
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<PageResponse<ProductSummaryResponse`)**: `id: Long`, `storeId: Long`, `storeName: String`, `categoryId: Integer`, `categoryName: String`, `name: String`, `imageUrl: String`, `minPrice: BigDecimal`...

#### `GET /api/v1/seller/products/{id}`
- **Mô tả**: Xem chi tiết sản phẩm của người bán
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ProductDetailResponse`)**: `id: Long`, `storeId: Long`, `storeName: String`, `categoryId: Integer`, `categoryName: String`, `name: String`, `imageUrl: String`, `description: String`...

#### `PUT /api/v1/seller/products/{id}`
- **Mô tả**: Cập nhật sản phẩm và biến thể
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body (`UpdateProductRequest`)**: `categoryId: Integer`, `name: String`, `description: String`, `tierVariationConfigs: List<TierVariationConfigDto>`, `status: String`, `variants: List<UpdateProductVariantRequest>`
- **Response Type (`ApiResponse<ProductDetailResponse`)**: `id: Long`, `storeId: Long`, `storeName: String`, `categoryId: Integer`, `categoryName: String`, `name: String`, `imageUrl: String`, `description: String`...

#### `DELETE /api/v1/seller/products/{id}`
- **Mô tả**: Xóa sản phẩm (Tự động Soft/Hard Delete)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `PATCH /api/v1/seller/products/{id}/status`
- **Mô tả**: Đổi trạng thái sản phẩm (ACTIVE/INACTIVE/OUT_OF_STOCK)
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Path Variables**: `id`: Long; **Query Parameters**: `status` (String, bắt buộc)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ProductDetailResponse`)**: `id: Long`, `storeId: Long`, `storeName: String`, `categoryId: Integer`, `categoryName: String`, `name: String`, `imageUrl: String`, `description: String`...

#### `POST /api/v1/seller/products/{id}/images`
- **Mô tả**: uploadProductImage
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Path Variables**: `id`: Long; **Query Parameters**: `isPrimary` (Boolean, tùy chọn), `displayOrder` (Integer, tùy chọn); **Multipart Form Data**: `file` (MultipartFile)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

#### `POST /api/v1/seller/products/{productId}/variants/{variantId}/images`
- **Mô tả**: uploadVariantImage
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/product/controller/SellerProductController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: **Path Variables**: `productId`: Long, `variantId`: Long; **Query Parameters**: `isPrimary` (Boolean, tùy chọn), `displayOrder` (Integer, tùy chọn); **Multipart Form Data**: `file` (MultipartFile)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

### 3.596 Module `REVIEW` (1 endpoints)
> **Mã lỗi đặc thù (ReviewErrorCode)**: `REVIEW_PRODUCT_NOT_FOUND` (NOT_FOUND), `REVIEW_NOT_FOUND` (NOT_FOUND), `REVIEW_ALREADY_EXISTS` (CONFLICT), `REVIEW_ORDER_NOT_COMPLETED` (BAD_REQUEST), `REVIEW_ACCESS_DENIED` (FORBIDDEN), `REVIEW_FORBIDDEN` (FORBIDDEN)...

#### `GET /api/v1/products/{productId}/reviews`
- **Mô tả**: getProductReviews
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/review/controller/ProductReviewPublicController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/review/controller/ProductReviewPublicController.java)
- **Quyền yêu cầu**: Public (GET)
- **Tham số**: **Path Variables**: `productId`: Long; **Query Parameters**: `required` (Integer, bắt buộc), `required` (Boolean, bắt buộc); **Phân trang / Sắp xếp**: `@PageableDefault(size = 10)`
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ProductReviewsPageResponse`)**: `items: List<ProductReviewResponse>`, `ratingDistribution: RatingDistributionDto`, `mediaCount: Long`, `totalElements: Integer`, `totalPages: Integer`, `page: Integer`, `size: Integer`

### 3.607 Module `STORE` (13 endpoints)
> **Mã lỗi đặc thù (StoreErrorCode)**: `STORE_ALREADY_EXISTS` (CONFLICT), `STORE_NAME_ALREADY_EXISTS` (CONFLICT), `STORE_NOT_FOUND` (NOT_FOUND), `STORE_NOT_APPROVED` (BAD_REQUEST), `STORE_ACCESS_DENIED` (FORBIDDEN), `INVALID_STORE_STATUS` (BAD_REQUEST)...

#### `PATCH /api/v1/admin/stores/{id}/status`
- **Mô tả**: updateStoreStatus
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/AdminStoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/AdminStoreController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body (`UpdateStoreStatusRequest`)**: `status: String`
- **Response Type (`ApiResponse<StoreResponse`)**: `id: Long`, `userId: Long`, `storeName: String`, `logoUrl: String`, `description: String`, `defaultCommissionRate: BigDecimal`, `status: String`, `createdAt: Instant`

#### `POST /api/v1/stores`
- **Mô tả**: registerStore
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`CreateStoreRequest`)**: `storeName: String`, `description: String`
- **Response Type (`ApiResponse<StoreResponse`)**: `id: Long`, `userId: Long`, `storeName: String`, `logoUrl: String`, `description: String`, `defaultCommissionRate: BigDecimal`, `status: String`, `createdAt: Instant`

#### `GET /api/v1/stores/me`
- **Mô tả**: getMyStore
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<StoreResponse`)**: `id: Long`, `userId: Long`, `storeName: String`, `logoUrl: String`, `description: String`, `defaultCommissionRate: BigDecimal`, `status: String`, `createdAt: Instant`

#### `GET /api/v1/stores/sidebar/summary`
- **Mô tả**: getSidebarSummary
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<SidebarSummaryResponse`)**: `totalProducts: Long`, `activeFlashSales: Long`, `pendingOrders: Long`, `unpaidOrders: Long`, `todayOrders: Long`, `todayRevenue: BigDecimal`, `monthRevenue: BigDecimal`, `ratingAvg: Double`...

#### `PUT /api/v1/stores/me`
- **Mô tả**: updateMyStore
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`UpdateStoreRequest`)**: `storeName: String`, `description: String`
- **Response Type (`ApiResponse<StoreResponse`)**: `id: Long`, `userId: Long`, `storeName: String`, `logoUrl: String`, `description: String`, `defaultCommissionRate: BigDecimal`, `status: String`, `createdAt: Instant`

#### `GET /api/v1/stores/featured`
- **Mô tả**: getFeaturedStores
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Query Parameters**: `limit` (int, bắt buộc, default=`4`)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<FeaturedStoreResponse`)**: `id: Long`, `name: String`, `logoUrl: String`, `verified: Boolean`, `rating: Double`, `totalRatings: Long`, `followers: Long`, `productThumbnails: List<String>`...

#### `GET /api/v1/stores/{id}`
- **Mô tả**: getStoreById
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<StoreResponse`)**: `id: Long`, `userId: Long`, `storeName: String`, `logoUrl: String`, `description: String`, `defaultCommissionRate: BigDecimal`, `status: String`, `createdAt: Instant`

#### `GET /api/v1/stores/me/addresses`
- **Mô tả**: getStoreAddresses
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `POST /api/v1/stores/me/addresses`
- **Mô tả**: createStoreAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`CreateAddressRequest`)**: `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`, `longitude: BigDecimal`
- **Response Type (`ApiResponse<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `PUT /api/v1/stores/me/addresses/{addressId}`
- **Mô tả**: updateStoreAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `addressId`: Long
- **Request Body (`UpdateAddressRequest`)**: `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`, `longitude: BigDecimal`...
- **Response Type (`ApiResponse<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `DELETE /api/v1/stores/me/addresses/{addressId}`
- **Mô tả**: deleteStoreAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `addressId`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `PATCH /api/v1/stores/me/addresses/{addressId}/default`
- **Mô tả**: setDefaultStoreAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `addressId`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `POST /api/v1/stores/me/logo`
- **Mô tả**: uploadLogo
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/store/controller/StoreController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Multipart Form Data**: `file` (MultipartFile)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

### 3.714 Module `USER` (10 endpoints)
> **Mã lỗi đặc thù (UserErrorCode)**: `USER_NOT_FOUND` (NOT_FOUND), `ADDRESS_NOT_FOUND` (NOT_FOUND), `ADDRESS_ACCESS_DENIED` (FORBIDDEN), `OLD_PASSWORD_INCORRECT` (BAD_REQUEST), `CANNOT_DELETE_DEFAULT_ADDRESS` (BAD_REQUEST)...

#### `GET /api/v1/users/addresses`
- **Mô tả**: getUserAddresses
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `POST /api/v1/users/addresses`
- **Mô tả**: createAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`CreateAddressRequest`)**: `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`, `longitude: BigDecimal`
- **Response Type (`ApiResponse<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `GET /api/v1/users/addresses/{id}`
- **Mô tả**: getAddressById
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `PUT /api/v1/users/addresses/{id}`
- **Mô tả**: updateAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body (`UpdateAddressRequest`)**: `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`, `longitude: BigDecimal`...
- **Response Type (`ApiResponse<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `DELETE /api/v1/users/addresses/{id}`
- **Mô tả**: deleteAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<Void`)**: Void

#### `PATCH /api/v1/users/addresses/{id}/default`
- **Mô tả**: setDefaultAddress
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/AddressController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `id`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<AddressResponse`)**: `id: Long`, `contactName: String`, `phone: String`, `province: String`, `district: String`, `ward: String`, `detailAddress: String`, `latitude: BigDecimal`...

#### `GET /api/v1/users/me`
- **Mô tả**: getProfile
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<UserResponse`)**: `id: Long`, `email: String`, `fullName: String`, `phone: String`, `avatarUrl: String`, `status: String`, `createdAt: Instant`, `roles: List<String>`

#### `PUT /api/v1/users/me`
- **Mô tả**: updateProfile
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`UpdateProfileRequest`)**: `fullName: String`, `phone: String`
- **Response Type (`ApiResponse<UserResponse`)**: `id: Long`, `email: String`, `fullName: String`, `phone: String`, `avatarUrl: String`, `status: String`, `createdAt: Instant`, `roles: List<String>`

#### `PUT /api/v1/users/me/change-password`
- **Mô tả**: changePassword
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`ChangePasswordRequest`)**: `oldPassword: String`, `newPassword: String`
- **Response Type (`ApiResponse<Void`)**: Void

#### `POST /api/v1/users/me/avatar`
- **Mô tả**: uploadAvatar
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/user/controller/UserController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Multipart Form Data**: `file` (MultipartFile)
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<ImageResponse`)**: `id: Long`, `ownerType: ImageOwnerType`, `ownerId: Long`, `url: String`, `publicId: String`, `displayOrder: Integer`, `isPrimary: Boolean`, `status: String`...

### 3.797 Module `VOUCHER` (8 endpoints)
> **Mã lỗi đặc thù (VoucherErrorCode)**: ...

#### `POST /api/v1/admin/vouchers`
- **Mô tả**: createPlatformVoucher
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/AdminVoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/AdminVoucherController.java)
- **Quyền yêu cầu**: `ROLE_ADMIN`
- **Tham số**: Không có
- **Request Body (`CreateVoucherRequest`)**: `code: String`, `storeId: Long`, `discountType: String`, `discountValue: BigDecimal`, `minOrderAmount: BigDecimal`, `maxDiscountAmount: BigDecimal`, `totalQuantity: Integer`, `userUsageLimit: Integer`...
- **Response Type (`ApiResponse<VoucherResponse`)**: `id: Long`, `code: String`, `storeId: Long`, `discountType: String`, `discountValue: BigDecimal`, `minOrderAmount: BigDecimal`, `maxDiscountAmount: BigDecimal`, `totalQuantity: Integer`...

#### `POST /api/v1/seller/vouchers`
- **Mô tả**: createStoreVoucher
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/SellerVoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/SellerVoucherController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: Không có
- **Request Body (`CreateVoucherRequest`)**: `code: String`, `storeId: Long`, `discountType: String`, `discountValue: BigDecimal`, `minOrderAmount: BigDecimal`, `maxDiscountAmount: BigDecimal`, `totalQuantity: Integer`, `userUsageLimit: Integer`...
- **Response Type (`ApiResponse<VoucherResponse`)**: `id: Long`, `code: String`, `storeId: Long`, `discountType: String`, `discountValue: BigDecimal`, `minOrderAmount: BigDecimal`, `maxDiscountAmount: BigDecimal`, `totalQuantity: Integer`...

#### `GET /api/v1/seller/vouchers`
- **Mô tả**: getMyStoreVouchers
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/SellerVoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/SellerVoucherController.java)
- **Quyền yêu cầu**: `ROLE_SELLER`
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<VoucherResponse`)**: `id: Long`, `code: String`, `storeId: Long`, `discountType: String`, `discountValue: BigDecimal`, `minOrderAmount: BigDecimal`, `maxDiscountAmount: BigDecimal`, `totalQuantity: Integer`...

#### `GET /api/v1/vouchers/platform`
- **Mô tả**: getPlatformVouchers
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<VoucherResponse`)**: `id: Long`, `code: String`, `storeId: Long`, `discountType: String`, `discountValue: BigDecimal`, `minOrderAmount: BigDecimal`, `maxDiscountAmount: BigDecimal`, `totalQuantity: Integer`...

#### `GET /api/v1/vouchers/store/{storeId}`
- **Mô tả**: getStoreVouchers
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: **Path Variables**: `storeId`: Long
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<VoucherResponse`)**: `id: Long`, `code: String`, `storeId: Long`, `discountType: String`, `discountValue: BigDecimal`, `minOrderAmount: BigDecimal`, `maxDiscountAmount: BigDecimal`, `totalQuantity: Integer`...

#### `GET /api/v1/vouchers/mine`
- **Mô tả**: getMyVouchers
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body**: Không yêu cầu (None)
- **Response Type (`ApiResponse<List<UserVoucherResponse`)**: `id: Long`, `code: String`, `label: String`, `scope: String`, `storeId: Long`, `storeName: String`, `discountType: String`, `discountValue: BigDecimal`...

#### `POST /api/v1/vouchers/mine`
- **Mô tả**: saveVoucherToWallet
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`SaveVoucherRequest`)**: `code: String`
- **Response Type (`ApiResponse<UserVoucherResponse`)**: `id: Long`, `code: String`, `label: String`, `scope: String`, `storeId: Long`, `storeName: String`, `discountType: String`, `discountValue: BigDecimal`...

#### `POST /api/v1/vouchers/apply`
- **Mô tả**: validateAndCalculate
- **Controller Source**: [`src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java`](file:///c:/Users/ngank/Desktop/Project/flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/voucher/controller/VoucherController.java)
- **Quyền yêu cầu**: Authenticated (Bearer JWT)
- **Tham số**: Không có
- **Request Body (`ApplyVoucherRequest`)**: `code: String`, `storeId: Long`, `subtotalAmount: BigDecimal`
- **Response Type (`ApiResponse<VoucherCalculationResponse`)**: `voucherId: Long`, `code: String`, `discountAmount: BigDecimal`, `finalAmount: BigDecimal`

---

## 4. Tổng hợp Mã lỗi (Error Code Catalog)

| Enum Class | Số mã lỗi | Các lỗi tiêu biểu (Code & HTTP Status) |
|---|---|---|
| `AuthErrorCode` | 7 | • `EMAIL_ALREADY_EXISTS` (CONFLICT): AUTH_409_EMAIL<br>• `PHONE_ALREADY_EXISTS` (CONFLICT): AUTH_409_PHONE<br>• `INVALID_CREDENTIALS` (UNAUTHORIZED): AUTH_401_CREDENTIALS<br>• `INVALID_REFRESH_TOKEN` (UNAUTHORIZED): AUTH_401_REFRESH_TOKEN |
| `BannerErrorCode` | 4 | • `BANNER_NOT_FOUND` (NOT_FOUND): BANNER_404_NOT_FOUND<br>• `BANNER_INVALID_STATUS` (UNPROCESSABLE_ENTITY): BANNER_422_INVALID_STATUS<br>• `BANNER_INVALID_DATE_RANGE` (BAD_REQUEST): BANNER_400_INVALID_DATE_RANGE<br>• `BANNER_IMAGE_URL_BLANK` (BAD_REQUEST): BANNER_400_IMAGE_URL_BLANK |
| `CartErrorCode` | 0 |  |
| `CommonErrorCode` | 8 | • `INVALID_REQUEST` (BAD_REQUEST): SYS_400<br>• `UNAUTHORIZED` (UNAUTHORIZED): AUTH_401<br>• `FORBIDDEN` (FORBIDDEN): AUTH_403<br>• `RESOURCE_NOT_FOUND` (NOT_FOUND): SYS_404 |
| `ErrorCode` | 0 |  |
| `FlashSaleErrorCode` | 23 | • `SLOT_NOT_FOUND` (NOT_FOUND): FS_404_SLOT_NOT_FOUND<br>• `SLOT_TIME_INVALID` (BAD_REQUEST): FS_400_SLOT_TIME_INVALID<br>• `SLOT_OVERLAP` (CONFLICT): FS_409_SLOT_OVERLAP<br>• `SLOT_NOT_ACTIVE` (BAD_REQUEST): FS_400_SLOT_NOT_ACTIVE |
| `ImageErrorCode` | 11 | • `FILE_TOO_LARGE` (PAYLOAD_TOO_LARGE): IMAGE_413_FILE_TOO_LARGE<br>• `INVALID_FORMAT` (BAD_REQUEST): IMAGE_400_INVALID_FORMAT<br>• `FILE_EMPTY` (BAD_REQUEST): IMAGE_400_EMPTY_FILE<br>• `NOT_OWNER` (FORBIDDEN): IMAGE_403_NOT_OWNER |
| `OrderErrorCode` | 0 |  |
| `ProductErrorCode` | 14 | • `CATEGORY_NOT_FOUND` (NOT_FOUND): CAT_404_NOT_FOUND<br>• `CATEGORY_NAME_ALREADY_EXISTS` (CONFLICT): CAT_409_NAME_EXISTS<br>• `CATEGORY_SLUG_ALREADY_EXISTS` (CONFLICT): CAT_409_SLUG_EXISTS<br>• `PRODUCT_NOT_FOUND` (NOT_FOUND): PROD_404_NOT_FOUND |
| `ReviewErrorCode` | 6 | • `REVIEW_PRODUCT_NOT_FOUND` (NOT_FOUND): REVIEW_404_PRODUCT_NOT_FOUND<br>• `REVIEW_NOT_FOUND` (NOT_FOUND): REVIEW_404_NOT_FOUND<br>• `REVIEW_ALREADY_EXISTS` (CONFLICT): REVIEW_409_ALREADY_EXISTS<br>• `REVIEW_ORDER_NOT_COMPLETED` (BAD_REQUEST): REVIEW_400_ORDER_NOT_COMPLETED |
| `StoreErrorCode` | 8 | • `STORE_ALREADY_EXISTS` (CONFLICT): STORE_409_EXISTS<br>• `STORE_NAME_ALREADY_EXISTS` (CONFLICT): STORE_409_NAME_EXISTS<br>• `STORE_NOT_FOUND` (NOT_FOUND): STORE_404_NOT_FOUND<br>• `STORE_NOT_APPROVED` (BAD_REQUEST): STORE_400_NOT_APPROVED |
| `UserErrorCode` | 5 | • `USER_NOT_FOUND` (NOT_FOUND): USER_404_NOT_FOUND<br>• `ADDRESS_NOT_FOUND` (NOT_FOUND): USER_404_ADDRESS<br>• `ADDRESS_ACCESS_DENIED` (FORBIDDEN): USER_403_ADDRESS_DENIED<br>• `OLD_PASSWORD_INCORRECT` (BAD_REQUEST): USER_400_OLD_PASSWORD |
| `VoucherErrorCode` | 0 |  |