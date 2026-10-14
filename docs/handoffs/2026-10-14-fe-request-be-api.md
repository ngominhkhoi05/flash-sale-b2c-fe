# Yêu Cầu Bổ Sung API — Backend Flash Sale B2C

> **Ngày lập:** 2026-10-14  
> **Nguồn:** Frontend (`flash-sale-b2c-fe`) gửi Backend (`flash-sale-b2c-UTC2`)  
> **Phạm vi:** Toàn bộ tính năng Storefront & Cụm quản trị Flash Sale Admin (Đợt 8 — Màn 35, 36, 37)  
> **Ký hiệu trạng thái:**
> - ✅ = BE đã có, FE đang gọi hoạt động tốt
> - ⚠️ = BE đã có endpoint nhưng schema/DTO thiếu trường dữ liệu
> - ❌ = Chưa có trên BE (Cần xây dựng mới)

---

## MỤC LỤC
1. [PHẦN 1: Cốt lõi Đợt 8 — Flash Sale Admin & Realtime (Màn 35, 36, 37)](#phần-1-cốt-lõi-đợt-8--flash-sale-admin--realtime-màn-35-36-37)
   - [1.1 Quản lý Khung giờ Flash Sale (Màn 35)](#11-quản-lý-khung-giờ-flash-sale-màn-35-adminflash-sale)
   - [1.2 Xét duyệt sản phẩm Flash Sale (Màn 36)](#12-xét-duyệt-sản-phẩm-flash-sale-màn-36-adminflash-saleapprovals)
   - [1.3 Giám sát Realtime & Điều khiển phiên (Màn 37)](#13-giám-sát-realtime--điều-khiển-phiên-màn-37-adminflash-salemonitor)
   - [1.4 Đồng bộ giờ máy chủ (Server Time Countdown)](#14-đồng-bộ-giờ-máy-chủ-server-time-countdown)
2. [PHẦN 2: Storefront & User Portal (Các tính năng cần bổ sung)](#phần-2-storefront--user-portal-các-tính-năng-cần-bổ-sung)
   - [2.1 Tìm kiếm sản phẩm](#21-tìm-kiếm-sản-phẩm)
   - [2.2 Kho voucher cá nhân](#22-kho-voucher-cá-nhân)
   - [2.3 Quên mật khẩu & Reset Password](#23-quên-mật-khẩu--reset-password)
   - [2.4 Viết đánh giá sản phẩm](#24-viết-đánh-giá-sản-phẩm)
   - [2.5 Thông tin QR Payment cho trang thanh toán](#25-thông-tin-qr-payment-cho-trang-thanh-toán)
   - [2.6 Đăng nhập mạng xã hội (Social Login OAuth2)](#26-đăng-nhập-mạng-xã-hội-social-login-oauth2)
3. [PHẦN 3: Bổ sung DTO / Schema cho các Endpoint hiện có (⚠️)](#phần-3-bổ-sung-dto--schema-cho-các-endpoint-hiện-có-️)
   - [3.1 FlashSaleSlot Response](#31-flashsaleslot-response--storefront--admin)
   - [3.2 FlashSaleItem Response](#32-flashsaleitem-response)
   - [3.3 Reserve Flash Sale Response](#33-reserve-flash-sale-response)
   - [3.4 Giỏ hàng (CartStoreGroup, CartItem, CartResponse)](#34-giỏ-hàng-cartstoregroup-cartitem-cartresponse)
   - [3.5 Đơn hàng (OrderItemResponse, OrderResponse)](#35-đơn-hàng-orderitemresponse-orderresponse)
4. [PHẦN 4: WebSocket Realtime / STOMP Specifications](#phần-4-websocket-realtime--stomp-specifications)
5. [PHẦN 5: Nguyên tắc kỹ thuật & Invariants (Redis, Lua, Anti-Oversold)](#phần-5-nguyên-tắc-kỹ-thuật--invariants)
6. [PHẦN 6: Tổng hợp mức độ ưu tiên](#phần-6-tổng-hợp-mức-độ-ưu-tiên)
7. [PHẦN 7: Checklist triển khai cho Backend Team](#phần-7-checklist-triển-khai-cho-backend-team)

---

## PHẦN 1: Cốt lõi Đợt 8 — Flash Sale Admin & Realtime (Màn 35, 36, 37)

### 1.1 Quản lý Khung giờ Flash Sale (Màn 35 `/admin/flash-sale`)

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Danh sách khung giờ (Lịch tuần & Bảng) | `/api/v1/admin/flash-sales/slots` | `GET` | Lọc theo tuần (`startDate`, `endDate`), `status`, phân trang |
| Chi tiết 1 khung giờ | `/api/v1/admin/flash-sales/slots/{id}` | `GET` | Thông tin phiên & metadata phân bổ Redis |
| Tạo khung giờ mới | `/api/v1/admin/flash-sales/slots` | `POST` | Chống trùng giờ, lock time 60-1800s, hạn đăng ký shop |
| Chỉnh sửa khung giờ | `/api/v1/admin/flash-sales/slots/{id}` | `PUT` | Chỉ sửa khi phiên chưa diễn ra (`UPCOMING` / `REGISTRATION_OPEN`) |
| Hủy khung giờ | `/api/v1/admin/flash-sales/slots/{id}/cancel` | `POST` | Body: `{ reason, note }`. Mở khóa toàn bộ tồn kho SKU đã nộp |

**Query Params `GET /api/v1/admin/flash-sales/slots`:**
```
GET /api/v1/admin/flash-sales/slots?startDate=2026-10-12&endDate=2026-10-18&status=ALL&page=0&size=50
```

**Response `GET /api/v1/admin/flash-sales/slots`:**
```json
{
  "items": [
    {
      "id": 102,
      "code": "FS-20261014-12",
      "name": "Giờ Vàng Trưa",
      "description": "Đợt kích cầu mua sắm trưa toàn sàn Vibe Mart",
      "date": "2026-10-14",
      "startTime": "2026-10-14T12:00:00.000Z",
      "endTime": "2026-10-14T14:00:00.000Z",
      "timeRangeDisplay": "12:00 - 14:00",
      "holdSeconds": 300,
      "registrationDeadline": "2026-10-14T10:30:00.000Z",
      "approvedSkusCount": 32,
      "pendingSkusCount": 0,
      "totalSkusCount": 32,
      "soldQuantity": 3820,
      "allocatedQuantity": 4900,
      "status": "ACTIVE"
    }
  ],
  "pageNumber": 0,
  "pageSize": 50,
  "totalElements": 18,
  "totalPages": 1
}
```

**Body `POST /api/v1/admin/flash-sales/slots`:**
```json
{
  "name": "Siêu Sale Giờ Vàng 12:00",
  "description": "Phiên mở bán định kỳ trưa",
  "date": "2026-10-15",
  "startTime": "12:00",
  "endTime": "14:00",
  "holdSeconds": 300,
  "registrationDeadline": "2026-10-15T10:00:00.000Z"
}
```

---

### 1.2 Xét duyệt sản phẩm Flash Sale (Màn 36 `/admin/flash-sale/approvals`)

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Danh sách SKU nộp theo phiên | `/api/v1/admin/flash-sales/slots/{slotId}/items` | `GET` | Lọc `status` (Chờ duyệt, Đã duyệt, Từ chối), search, phân trang |
| Duyệt đơn lẻ 1 SKU | `/api/v1/admin/flash-sales/items/{itemId}/approve` | `POST` | Trừ tồn kho gốc shop (`stock_quantity`), ghi đè hoa hồng phiên |
| Từ chối đơn lẻ 1 SKU | `/api/v1/admin/flash-sales/items/{itemId}/reject` | `POST` | Lưu lý do từ chối & giải trình |
| Hoàn tác SKU (Undo) | `/api/v1/admin/flash-sales/items/{itemId}/undo` | `POST` | Đưa SKU về Chờ duyệt, hoàn trả tồn kho gốc |
| Duyệt hàng loạt | `/api/v1/admin/flash-sales/slots/{slotId}/items/batch-approve` | `POST` | Body: `{ itemIds: [1, 2, 3] }` |
| Từ chối hàng loạt | `/api/v1/admin/flash-sales/slots/{slotId}/items/batch-reject` | `POST` | Body: `{ itemIds: [4, 5], reason, note }` |

**Response `GET /api/v1/admin/flash-sales/slots/{slotId}/items`:**
```json
{
  "sessionSummary": {
    "slotId": 102,
    "slotName": "Giờ Vàng 12:00 – Hôm nay",
    "status": "UPCOMING",
    "pendingCount": 14,
    "approvedCount": 32,
    "rejectedCount": 4,
    "registrationClosesAt": "2026-10-14T11:30:00.000Z"
  },
  "items": [
    {
      "id": 1001,
      "slotId": 102,
      "productId": 2045,
      "productName": "Áo thun nam Cotton Compact Vibe",
      "variantId": 5012,
      "variantName": "Màu: Đen, Size: L",
      "sku": "AT-BLK-L",
      "imageUrl": "https://...",
      "storeId": 88,
      "storeName": "Coolmate Official",
      "storeBadge": "Vibe Mall",
      "originalPrice": 299000,
      "flashSalePrice": 149000,
      "discountPercent": 50,
      "allocatedStock": 50,
      "baseStock": 248,
      "availableBaseStockAfterLock": 198,
      "userPurchaseLimit": 2,
      "submittedAt": "2026-10-14T09:30:00.000Z",
      "pricingWarning": {
        "hasWarning": true,
        "thirtyDaysAvgPrice": 135000,
        "warningMessage": "Giá sale cao hơn giá bán 30 ngày gần nhất (135.000₫)"
      },
      "status": "PENDING_APPROVAL",
      "commissionRate": 5.0,
      "rejectionReason": null,
      "rejectionNote": null
    }
  ],
  "pageNumber": 0,
  "pageSize": 20,
  "totalElements": 14,
  "totalPages": 1
}
```

---

### 1.3 Giám sát Realtime & Điều khiển phiên (Màn 37 `/admin/flash-sale/monitor`)

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Snapshot dữ liệu khi load trang | `/api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot` | `GET` | 5 KPIs, đối soát 3 tầng kho, danh sách SKU, 20 sự kiện gần nhất |
| Tạm dừng khẩn cấp phiên | `/api/v1/admin/flash-sales/slots/{slotId}/pause` | `POST` | Chặn lệnh `reserve` trên Redis Lua, cho phép đơn cũ thanh toán |
| Tiếp tục phiên | `/api/v1/admin/flash-sales/slots/{slotId}/resume` | `POST` | Mở lại cổng nhận đơn |

**Response `GET /api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot`:**
```json
{
  "slot": {
    "id": 102,
    "code": "FS-20261014-12",
    "name": "Giờ Vàng 12:00",
    "startTime": "2026-10-14T12:00:00.000Z",
    "endTime": "2026-10-14T14:00:00.000Z",
    "status": "ACTIVE",
    "serverTime": "2026-10-14T12:35:23.120Z",
    "remainingSeconds": 5077
  },
  "kpis": {
    "rps": 3482,
    "peakRps": 8200,
    "activeLocks": 412,
    "completedOrders": 1903,
    "totalRevenue": 385400000,
    "expiredReleases": 186,
    "p99LatencyMs": 128
  },
  "reconciliation": {
    "redisCacheStock": 2500,
    "dbPostgreStock": 2500,
    "totalSoldAndLocked": 2315,
    "isMatched": true,
    "driftCount": 0,
    "syncWorkerIntervalMs": 1000
  },
  "items": [
    {
      "itemId": 1001,
      "sku": "SKU-CLM-BLK-L",
      "productName": "Áo thun Compact Đen L",
      "storeName": "Coolmate Official",
      "allocatedStock": 50,
      "availableStock": 8,
      "currentLocks": 12,
      "soldQuantity": 30,
      "sellThroughRate": 60,
      "status": "SELLING"
    }
  ],
  "recentEvents": [
    {
      "id": "EV-1001",
      "timestamp": "12:35:22.840",
      "eventType": "LOCK_ACQUIRED",
      "orderCode": "FS-261014-K8A1",
      "userId": "user_419",
      "message": "Giữ 2 · Áo thun Đen L (Khóa thành công 300s)",
      "tag": "Khóa thành công"
    }
  ]
}
```

---

### 1.4 Đồng bộ giờ máy chủ (Server Time Countdown)

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Giờ server đồng bộ countdown | `/api/time` (hoặc `/api/v1/time`) | `GET` | Tránh gian lận hoặc lệch giờ local client |

**Response `GET /api/time`:**
```json
{
  "serverTime": "2026-10-14T12:00:00.000Z",
  "timestampMs": 1792065600000,
  "timezone": "Asia/Ho_Chi_Minh"
}
```

---

## PHẦN 2: Storefront & User Portal (Các tính năng cần bổ sung)

### 2.1 Tìm kiếm sản phẩm `[✅ ĐÃ HOÀN THÀNH - PR feat/product-search]`

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Tìm kiếm sản phẩm toàn sàn | `/api/v1/products/search` | `GET` | ✅ **Đã xong**. Hỗ trợ FTS tiếng Việt (PostgreSQL `to_tsvector`), phân trang, bộ lọc đa chiều (facets). |

> **Branch:** `feat/product-search` | **PR:** [feat/product-search](https://github.com/ngominhkhoi05/flash-sale-b2c-UTC2/pull/new/feat/product-search)

**Request Query Params:**
```
GET /api/v1/products/search?q=ao+thun&page=0&pageSize=20&sort=best_selling&categoryId=12&minPrice=100000&maxPrice=500000&minRating=4
```

**Response thực tế từ BE:**
```json
{
  "success": true,
  "code": 200,
  "message": "Tìm kiếm sản phẩm thành công",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Áo thun nam Cotton Compact",
        "imageUrl": "https://res.cloudinary.com/...",
        "price": 299000,
        "originalPrice": 399000,
        "rating": 4.8,
        "totalSold": 1240,
        "storeName": "Coolmate Official",
        "storeBadge": "OfficialMall",
        "voucherLabel": "Giảm 15K"
      }
    ],
    "total": 248,
    "page": 0,
    "pageSize": 20,
    "facets": {
      "categories": [{ "id": 12, "name": "Thời trang nam", "count": 42 }],
      "priceRanges": [{ "min": 100000, "max": 300000, "count": 86 }],
      "ratings": [5, 4, 3]
    }
  },
  "timestamp": "2026-10-14T19:00:00Z"
}
```

---

### 2.2 Kho voucher cá nhân `[✅ ĐÃ HOÀN THÀNH - PR feat/voucher-wallet]`

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Danh sách voucher đã lưu của tôi | `/api/v1/vouchers/mine` | `GET` | ✅ **Đã xong**. Trả về các voucher user đã lưu, kèm `savedAt`, `isUsed`. |
| Lưu voucher vào kho | `/api/v1/vouchers/mine` | `POST` | ✅ **Đã xong**. Body: `{ "code": "VIBEMART10" }`. Chống lưu trùng, kiểm tra hạn dùng. |

> **Branch:** `feat/voucher-wallet` | **PR:** [feat/voucher-wallet](https://github.com/ngominhkhoi05/flash-sale-b2c-UTC2/pull/new/feat/voucher-wallet)

**Response `GET /api/v1/vouchers/mine`:**
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách voucher thành công",
  "data": [
    {
      "id": 1,
      "code": "VIBEMART10",
      "label": "Giảm 10K cho đơn từ 400K",
      "scope": "PLATFORM",
      "storeId": null,
      "storeName": null,
      "discountType": "FIXED",
      "discountValue": 10000,
      "maxDiscount": 10000,
      "minOrderAmount": 400000,
      "userUsageLimit": 1,
      "usedQuantity": 0,
      "totalQuantity": 500,
      "startTime": "2026-10-01T00:00:00Z",
      "endTime": "2026-10-31T23:59:59Z",
      "status": "ACTIVE",
      "isUsed": false,
      "savedAt": "2026-10-14T10:00:00Z"
    }
  ],
  "timestamp": "2026-10-14T19:00:00Z"
}
```

---

### 2.3 Quên mật khẩu & Reset Password `[✅ ĐÃ HOÀN THÀNH - PR feat/auth-password-reset]`

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Gửi email đặt lại mật khẩu | `/api/v1/auth/forgot-password` | `POST` | ✅ **Đã xong**. Body: `{ "email": "user@example.com" }`. Rate limit 3 req/15 phút/email, log mail token ra console. |
| Đặt lại mật khẩu bằng token | `/api/v1/auth/reset-password` | `POST` | ✅ **Đã xong**. Body: `{ "token": "...", "newPassword": "..." }`. Token 1 lần (TTL 15m), mã hóa SHA-256. |

> **Branch:** `feat/auth-password-reset` | **PR:** [feat/auth-password-reset](https://github.com/ngominhkhoi05/flash-sale-b2c-UTC2/pull/new/feat/auth-password-reset)

> *Ghi chú:* FE đã có UI hoàn chỉnh tại `src/app/(auth)/forgot-password/page.tsx` và `src/app/(auth)/reset-password/page.tsx`, có thể kết nối ngay.

---

### 2.4 Viết đánh giá sản phẩm

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Gửi đánh giá sản phẩm | `/api/v1/reviews` | `POST` | Khách hàng đánh giá đơn hàng đã hoàn tất |
| Đính kèm ảnh đánh giá | `/api/v1/reviews/{id}/images` | `POST` | Upload file ảnh multipart |

**Body `POST /api/v1/reviews`:**
```json
{
  "orderId": 401,
  "productId": 2045,
  "variantId": 5012,
  "rating": 5,
  "content": "Chất vải dày dặn, giao hàng nhanh, đúng kích thước.",
  "imageUrls": ["https://res.cloudinary.com/..."]
}
```

---

### 2.5 Thông tin QR Payment cho trang thanh toán `[✅ ĐÃ HOÀN THÀNH - PR feat/order-qr]`

| FE cần | Endpoint | Method | Ghi chú |
|---|---|:---:|---|
| Chi tiết thanh toán QR | `/api/v1/orders/{orderCode}/qr` | `GET` | ✅ **Đã xong**. Hỗ trợ đơn đơn lẻ hoặc gộp đơn multi-vendor bằng danh sách mã phân tách dấu phẩy (vd: `ORD-A,ORD-B`). Sinh link VietQR chuẩn NAPAS 247. |

> **Branch:** `feat/order-qr` | **PR:** [feat/order-qr](https://github.com/ngominhkhoi05/flash-sale-b2c-UTC2/pull/new/feat/order-qr)

> **Lưu ý định danh:** Theo chuẩn thiết kế toàn dự án, endpoint sử dụng `{orderCode}` (chuỗi mã đơn, vd: `FS-261014-K8A1`) thay vì ID số, tránh rò rỉ ID tuần tự và đồng bộ với luồng checkout/tracking.

**Response thực tế từ BE:**
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy thông tin thanh toán QR thành công",
  "data": {
    "orderCode": "FS-261014-K8A1",
    "amount": 149000,
    "totalAmount": 149000,
    "expiresAt": "2026-10-14T12:40:23.000Z",
    "paymentExpiry": "2026-10-14T12:40:23.000Z",
    "qrCodeUrl": "https://api.vietqr.io/image/970422-0987654321-compact2.png?amount=149000&addInfo=PAY+FS261014K8A1&accountName=VIBE+MART+MARKETPLACE",
    "bankCode": "MBBANK",
    "bankName": "Ngân hàng Quân Đội (MBBank)",
    "accountNo": "0987654321",
    "accountName": "VIBE MART MARKETPLACE",
    "transferContent": "PAY FS261014K8A1",
    "shopOrders": [
      {
        "orderId": 401,
        "orderCode": "FS-261014-K8A1",
        "storeId": 88,
        "storeName": "Coolmate Official",
        "storeBadge": "OfficialMall",
        "amount": 149000,
        "itemSummary": "Áo thun thể thao QuickDry × 1"
      }
    ]
  },
  "timestamp": "2026-10-14T19:00:00Z"
}
```

---

### 2.6 Đăng nhập mạng xã hội (Social Login OAuth2)

| Nhà cung cấp | Endpoint Backend | Trạng thái FE |
|---|---|---|
| Google OAuth2 | `/api/v1/auth/oauth/google` | Đã có button trong `SocialLoginButtons.tsx` |
| Facebook OAuth2 | `/api/v1/auth/oauth/facebook` | Đã có button |
| GitHub OAuth2 | `/api/v1/auth/oauth/github` | Đã có button |

---

## PHẦN 3: Bổ sung DTO / Schema cho các Endpoint hiện có (⚠️)

### 3.1 FlashSaleSlot Response (`/api/v1/flash-sales/slots`)
Hiện tại DTO đang thiếu các trường:
- `holdSeconds` (`number`): Thời gian khóa chỗ sản phẩm (mặc định 300 giây).
- `registrationDeadline` (`ISO string`): Hạn chót shop nộp hàng tham gia.
- `approvedSkusCount` (`number`): Số lượng SKU đã được duyệt bán.
- `pendingSkusCount` (`number`): Số lượng SKU đang chờ duyệt.
- `soldQuantity` (`number`): Tổng số lượng sản phẩm đã bán.
- `allocatedQuantity` (`number`): Tổng số lượng sản phẩm được phân bổ mở bán.

### 3.2 FlashSaleItem Response
Cần bổ sung các trường:
- `userPurchaseLimit` (`number`): Giới hạn số lượng mua/khách trong phiên (thường là 1 - 2).
- `baseStock` (`number`): Tồn kho ban đầu trong bảng `product_variants.stock_quantity`.
- `availableBaseStockAfterLock` (`number`): Tồn kho còn lại của shop sau khi trừ hàng Flash Sale.
- `pricingWarning` (`object`): `{ hasWarning: boolean, thirtyDaysAvgPrice: number, warningMessage: string }`.
- `commissionRate` (`number`): Mức hoa hồng áp dụng riêng cho phiên (%).

### 3.3 Reserve Flash Sale Response (`POST /api/v1/flash-sales/reserve`)
- Bổ sung `orderCode` (`string`): Mã đơn hàng sinh ra (ví dụ: `FS-261014-K8A1`).
- Bổ sung `remainingStock` (`number`): Lượng tồn kho còn lại của SKU trên Redis ngay sau lệnh reserve.

### 3.4 Giỏ hàng (`CartStoreGroup`, `CartItem`, `CartResponse`) `[✅ ĐÃ HOÀN THÀNH - PR feat/dto-fields]`
> **Branch:** `feat/dto-fields` | **PR:** [feat/dto-fields](https://github.com/ngominhkhoi05/flash-sale-b2c-UTC2/pull/new/feat/dto-fields)

- `CartStoreGroup`: Đã bổ sung `storeBadge` (OfficialMall/Mall/""), `shippingFee`, `estimatedDeliveryLabel`, `shippingMethodLabel`.
- `CartItemResponse`: Đã bổ sung `productId`, `stockQuantity` (giúp FE cảnh báo hết hàng/vượt tồn).
- `CartResponse`: Đã bổ sung `subtotal`, `totalShippingFee`, `totalAmount`.

### 3.5 Đơn hàng (`OrderItemResponse`, `OrderResponse`) `[✅ ĐÃ HOÀN THÀNH - PR feat/dto-fields & feat/order-qr]`
> **Branch:** `feat/dto-fields` & `feat/order-qr`

- `OrderItemResponse`: Đã bổ sung `imageUrl` (nạp batch qua `ImageService` chống N+1).
- `OrderResponse`: Đã chuẩn hóa dùng `expiresAt` (ISO timestamp) đồng thời giữ `paymentExpiry` để tương thích ngược 100% với FE.

---

## PHẦN 4: WebSocket Realtime / STOMP Specifications

> **Endpoint STOMP Broker:** `ws://localhost:8080/ws` (SockJS fallback: `http://localhost:8080/ws`)  
> **Handshake Authentication:** Header `Authorization: Bearer <token>` hoặc Query Param `?token=<jwt>`  
> **Cơ chế:** STOMP over WebSocket với heartbeat `10.000ms`.

| Mục đích | STOMP Topic | Tần suất | Payload Format |
|---|---|:---:|---|
| **Admin: Telemetry Metrics** | `/topic/admin/flash-sale/{slotId}/metrics` | 1.000ms/lần | `{ slotId, rps, activeLocks, completedOrders, expiredReleases, p99LatencyMs, timestamp }` |
| **Admin: Biến động kho SKU** | `/topic/admin/flash-sale/{slotId}/stock` | Khi có biến động | `{ slotId, itemId, sku, availableStock, currentLocks, soldQuantity, sellThroughRate, status, timestamp }` |
| **Admin: Nhật ký sự kiện ms** | `/topic/admin/flash-sale/{slotId}/events` | Ngay khi xảy ra | `{ id, slotId, timestamp, eventType, orderCode, userId, message, tag }` |
| **Admin: Cảnh báo lệch kho** | `/topic/admin/flash-sale/{slotId}/drift-alert` | Khi phát hiện lệch | `{ slotId, isMatched, redisStock, dbStock, driftCount, severity, message, timestamp }` |
| **Storefront: Tồn kho trực tiếp** | `/topic/flash-sale/{slotId}/stock` | Khi có giao dịch | `{ slotId, itemId, availableStock, soldQuantity, isSoldOut, timestamp }` |

---

## PHẦN 5: Nguyên tắc kỹ thuật & Invariants

1. **Pre-warm Redis trước giờ mở bán:**
   - Toàn bộ SKU đã duyệt (`APPROVED`) phải được nạp lên Redis Key `flash_sale:stock:{itemId}` trước giờ mở bán đúng **5 phút**.
   - Dùng lệnh `SETNX` để đảm bảo tính **idempotent**, tuyệt đối không ghi đè làm nhân đôi số lượng tồn kho.
2. **Cơ chế hoàn kho (Rollback & Auto-release):**
   - Hết hạn giữ chỗ 300 giây: Job quét các order `PENDING_PAYMENT` quá hạn, chuyển sang `CANCELLED_TIMEOUT` và chạy Lua script `rollback_stock.lua` để hoàn trả đúng số lượng đã giữ về Redis.
   - Kết thúc phiên Flash Sale: Lượng tồn kho khả dụng còn dư trên Redis phải được hoàn trả về `stock_quantity` của `product_variants`.
3. **Chống bán vượt (Anti-Oversold Equation):**
   - Đảm bảo đẳng thức: `RedisStock == TotalAllocatedStock - (CompletedOrders + ActiveLocks)`.
   - Nếu xảy ra chênh lệch (`driftCount > 0`), worker đẩy ngay thông báo khẩn cấp lên topic `/drift-alert`.

---

## PHẦN 6: Tổng hợp mức độ ưu tiên

| Mức độ | Nhóm API / Kênh STOMP | Lý do |
|:---:|---|---|
| 🔴 **P0 (Tối khẩn)** | `GET /api/v1/admin/flash-sales/slots`<br>`POST /api/v1/admin/flash-sales/slots`<br>`GET /api/v1/admin/flash-sales/slots/{id}/items`<br>`POST /api/v1/admin/flash-sales/items/{id}/approve`<br>`GET /api/v1/admin/flash-sales/slots/{id}/monitor/snapshot`<br>WebSocket `/topic/admin/flash-sale/{id}/metrics` & `/stock` | Hoàn thiện luồng kiểm thử chịu tải và quản trị Flash Sale (Cốt lõi đồ án) |
| 🔴 **P1 (Cao)** | `GET /api/v1/products/search`<br>`GET /api/v1/vouchers/mine`<br>`POST /api/v1/vouchers/mine`<br>`GET /api/time` | Phục vụ trải nghiệm người dùng cốt lõi trên Storefront |
| 🟠 **P2 (Trung bình)** | `POST /api/v1/admin/flash-sales/items/{id}/reject`<br>`POST /api/v1/admin/flash-sales/items/{id}/undo`<br>`POST /api/v1/admin/flash-sales/slots/{id}/items/batch-approve`<br>`POST /api/v1/admin/flash-sales/slots/{id}/pause` & `/resume`<br>WebSocket `/topic/admin/flash-sale/{id}/events` & `/drift-alert` | Các thao tác nâng cao trong trang quản trị |
| 🟠 **P2 (Trung bình)** | `POST /api/v1/auth/forgot-password`<br>`POST /api/v1/auth/reset-password`<br>`GET /api/v1/orders/{id}/qr` | Hoàn thiện các luồng người dùng phụ trên Storefront |
| 🟡 **P3 (Thấp)** | `POST /api/v1/reviews`<br>OAuth2 Social Login<br>Bổ sung field phụ `CartStoreGroup`, `OrderItem.imageUrl` | Hoàn thiện dần theo kế hoạch |

---

## PHẦN 7: Checklist triển khai cho Backend Team

```markdown
### Nhóm Flash Sale Admin (Đợt 8)
- [ ] 1. Thêm GET /api/v1/admin/flash-sales/slots (lọc startDate, endDate, status, search, pagination)
- [ ] 2. Thêm POST /api/v1/admin/flash-sales/slots (validate: name <= 60, endTime > startTime, holdSeconds [60, 1800], deadline < start)
- [ ] 3. Thêm PUT /api/v1/admin/flash-sales/slots/{id} & POST /api/v1/admin/flash-sales/slots/{id}/cancel
- [ ] 4. Thêm GET /api/v1/admin/flash-sales/slots/{slotId}/items (lọc status PENDING_APPROVAL/APPROVED/REJECTED, search, pricingWarning)
- [ ] 5. Thêm POST /api/v1/admin/flash-sales/items/{itemId}/approve (trừ kho gốc baseStock, hỗ trợ commissionOverride)
- [ ] 6. Thêm POST /api/v1/admin/flash-sales/items/{itemId}/reject & POST /api/v1/admin/flash-sales/items/{itemId}/undo
- [ ] 7. Thêm POST /api/v1/admin/flash-sales/slots/{slotId}/items/batch-approve & batch-reject
- [ ] 8. Thêm GET /api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot (kpis, reconciliation 3 tầng, items, recentEvents)
- [ ] 9. Thêm POST /api/v1/admin/flash-sales/slots/{slotId}/pause & resume
- [ ] 10. Kích hoạt STOMP topic /topic/admin/flash-sale/{slotId}/metrics (đẩy định kỳ 1s/lần)
- [ ] 11. Kích hoạt STOMP topic /topic/admin/flash-sale/{slotId}/stock (đẩy khi đổi tồn kho)
- [ ] 12. Kích hoạt STOMP topic /topic/admin/flash-sale/{slotId}/events (đẩy stream log mili-giây)
- [ ] 13. Kích hoạt STOMP topic /topic/admin/flash-sale/{slotId}/drift-alert (cảnh báo lệch kho)
- [ ] 14. Thêm GET /api/time trả serverTime ISO + timestampMs

### Nhóm Storefront & User Portal
- [x] 15. Thêm GET /api/v1/products/search (params: q, page, pageSize, sort, categoryId, minPrice, maxPrice, minRating) - [PR #47 feat/product-search]
- [x] 16. Thêm GET /api/v1/vouchers/mine & POST /api/v1/vouchers/mine { code } - [PR #48 feat/voucher-wallet]
- [x] 17. Thêm POST /api/v1/auth/forgot-password & POST /api/v1/auth/reset-password - [PR #49 feat/auth-password-reset]
- [x] 18. Thêm GET /api/v1/orders/{orderCode}/qr (trả thông tin mã QR VietQR theo shop, hỗ trợ multi-vendor) - [PR #50 feat/order-qr]
- [ ] 19. Thêm POST /api/v1/reviews & POST /api/v1/reviews/{id}/images (Chưa làm đợt này)
- [x] 20. Bổ sung các field còn thiếu trong DTO: CartStoreGroup, CartItem, OrderItem - [PR #51 feat/dto-fields]
```
