# HỢP ĐỒNG API (API CONTRACT) – FLASH SALE B2C (FRONTEND & BACKEND)

> **Mục đích**: Tài liệu này định nghĩa rõ ràng danh sách các REST endpoint và WebSocket topics mà giao diện Frontend (Next.js) kỳ vọng nhận từ Backend (Spring Boot).
> Dùng để đối chiếu, kiểm thử mock data và tích hợp API thật giữa 2 team.

---

## 1. Quy ước chung

1. **Base URL**:
   - Môi trường Local: `http://localhost:8080` (lấy qua `NEXT_PUBLIC_API_URL`).
   - WebSocket URL: `http://localhost:8080/ws` (lấy qua `NEXT_PUBLIC_WS_URL`).
2. **Định dạng dữ liệu**:
   - Toàn bộ payload gửi và nhận là `application/json; charset=utf-8`.
   - Thời gian định dạng ISO 8601: `yyyy-MM-ddTHH:mm:ss.SSSXXX` (hoặc UTC `Z`).
   - Tiền tệ: Đơn vị Đồng (VND), kiểu số nguyên hoặc chuỗi số chính xác.
3. **Header xác thực người dùng**:
   - Tất cả request cần xác thực gửi kèm:
     ```http
     Authorization: Bearer <JWT_TOKEN>
     ```
   - Backend Spring Boot đọc user từ JWT claim `sub`; KHÔNG tin header
     tuỳ biến nào khác cho việc xác định người dùng.
   - Lưu ý lịch sử: trước đây có dùng `X-User-Id: 1001` làm "quy ước đồ án"
     tạm thời. Từ 2026-10-18, header này đã được bỏ khỏi FE (`fix/remove-x-user-id-header`)
     vì BE whitelist CORS không chứa `X-User-Id`, gây browser block preflight.
4. **Cấu trúc Response bọc ngoài chuẩn (`ApiResponse<T>`)**:
   ```json
   {
     "success": true,
     "code": 200,
     "message": "Thông điệp phản hồi bằng tiếng Việt",
     "data": { ... },
     "timestamp": "2026-10-14T14:00:00.000Z"
   }
   ```

---

## 2. Danh mục REST API

### 2.1. Lấy thời gian máy chủ (Server Time for Countdown)

- **Method**: `GET`
- **Path**: `/api/time` (hoặc `/api/v1/time`)
- **Mục đích**: Đồng bộ đồng hồ đếm ngược với server, **tuyệt đối không tin đồng hồ client** để tránh gian lận hoặc sai lệch múi giờ.
- **Headers**: Không yêu cầu
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy thời gian server thành công",
    "data": {
      "serverTime": "2026-10-14T14:30:00.000Z",
      "timestampMs": 1792074600000,
      "timezone": "Asia/Ho_Chi_Minh"
    },
    "timestamp": "2026-10-14T14:30:00.000Z"
  }
  ```

---

### 2.2. Danh sách Khung giờ Flash Sale (Timeline Slots)

- **Method**: `GET`
- **Path**: `/api/v1/flash-sale/slots`
- **Mục đích**: Lấy danh sách các khung giờ trong ngày để sinh các tab điều hướng động (không hard-code mốc giờ).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy danh sách khung giờ thành công",
    "data": [
      {
        "id": 101,
        "name": "09:00 - Sáng Khởi Động",
        "startTime": "2026-10-14T09:00:00.000Z",
        "endTime": "2026-10-14T11:30:00.000Z",
        "status": "ENDED",
        "totalProducts": 16
      },
      {
        "id": 102,
        "name": "12:00 - Giờ Vàng Siêu Sale",
        "startTime": "2026-10-14T12:00:00.000Z",
        "endTime": "2026-10-14T16:32:04.000Z",
        "status": "ACTIVE",
        "totalProducts": 24
      },
      {
        "id": 103,
        "name": "15:00 - Chiều Cao Điểm",
        "startTime": "2026-10-14T16:32:04.000Z",
        "endTime": "2026-10-14T19:00:00.000Z",
        "status": "UPCOMING",
        "totalProducts": 20
      }
    ],
    "timestamp": "2026-10-14T14:30:00.000Z"
  }
  ```

---

### 2.3. Khung giờ Flash Sale đang mở bán (Active Slot)

- **Method**: `GET`
- **Path**: `/api/v1/flash-sale/slots/active`
- **Mục đích**: Lấy thông tin phiên Flash Sale đang chạy để render banner và kích hoạt countdown.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy khung giờ hoạt động thành công",
    "data": {
      "id": 102,
      "name": "12:00 - Giờ Vàng Siêu Sale",
      "startTime": "2026-10-14T12:00:00.000Z",
      "endTime": "2026-10-14T16:32:04.000Z",
      "status": "ACTIVE",
      "totalProducts": 24
    },
    "timestamp": "2026-10-14T14:30:00.000Z"
  }
  ```

---

### 2.4. Danh sách sản phẩm trong khung giờ

- **Method**: `GET`
- **Path**: `/api/v1/flash-sale/items`
- **Query Params**:
  - `slotId` (bắt buộc, ví dụ `?slotId=102`)
  - `category` (tùy chọn lọc: `Thời trang`, `Điện tử - Công nghệ`, ...)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy danh sách sản phẩm flash sale thành công",
    "data": [
      {
        "id": 1,
        "slotId": 102,
        "productId": 1001,
        "variantId": 2001,
        "productName": "Tai nghe Bluetooth chống ồn ANC SoundCore Life Q30",
        "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        "originalPrice": 1450000,
        "flashSalePrice": 790000,
        "discountPercent": 45,
        "allocatedStock": 100,
        "availableStock": 28,
        "soldQuantity": 72,
        "category": "Điện tử - Công nghệ",
        "isSoldOut": false
      }
    ],
    "timestamp": "2026-10-14T14:30:00.000Z"
  }
  ```

---

### 2.5. Mua ngay Flash Sale (Buy Now Action)

- **Method**: `POST`
- **Path**: `/api/v1/flash-sale/orders`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "slotId": 102,
    "flashSaleItemId": 1,
    "variantId": 2001,
    "quantity": 1
  }
  ```
- **3 Trường hợp kết quả trả về**:

#### 1. Thành công (`200 OK`):
```json
{
  "success": true,
  "code": 200,
  "message": "Đặt mua Flash Sale thành công!",
  "data": {
    "status": "SUCCESS",
    "orderId": 829104,
    "orderCode": "FS26101401",
    "message": "Đơn hàng đã được xác nhận vào hệ thống.",
    "remainingStock": 27
  },
  "timestamp": "2026-10-14T14:30:01.000Z"
}
```

#### 2. Hết hàng (`409 Conflict`):
```json
{
  "success": false,
  "code": 409,
  "message": "Mặt hàng này đã hết suất trong tích tắc!",
  "data": {
    "status": "OUT_OF_STOCK",
    "message": "Rất tiếc! Số lượng phân bổ đã được mua hết.",
    "remainingStock": 0
  },
  "timestamp": "2026-10-14T14:30:02.000Z"
}
```

#### 3. Lỗi hệ thống (`500 Internal Server Error`):
```json
{
  "success": false,
  "code": 500,
  "message": "Hệ thống tạm thời bận, vui lòng thử lại sau giây lát.",
  "data": {
    "status": "SYSTEM_ERROR",
    "message": "Không thể hoàn tất lock phân tán trên Redis."
  },
  "timestamp": "2026-10-14T14:30:03.000Z"
}
```

---

### 2.6. Admin: Số liệu KPI Dashboard

- **Method**: `GET`
- **Path**: `/api/v1/admin/dashboard/kpi`
- **Mục đích**: Cung cấp thẻ đo lường cho Admin Dashboard (gắn nhãn "Dữ liệu mẫu").
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy số liệu KPI dashboard thành công",
    "data": {
      "kpis": [
        {
          "title": "GMV hôm nay",
          "value": "1,28 tỷ₫",
          "trend": {
            "direction": "up",
            "percentage": 18.0,
            "comparisonText": "so với hôm qua"
          },
          "iconName": "payments",
          "isMockSample": true
        }
      ],
      "activeCampaign": {
        "id": 102,
        "name": "Phiên Giờ Vàng 12:00 đang diễn ra",
        "startTime": "2026-10-14T12:00:00.000Z",
        "endTime": "2026-10-14T16:32:04.000Z",
        "confirmedOrders": 2315,
        "totalRevenue": 1828750000
      },
      "lastUpdated": "2026-10-14T14:30:00.000Z"
    },
    "timestamp": "2026-10-14T14:30:00.000Z"
  }
  ```

---

### 2.7. Admin: Quản lý Khung giờ Flash Sale (Màn 35)

- **Lấy danh sách khung giờ**: `GET /api/v1/admin/flash-sales/slots`
  - **Query Params**: `startDate`, `endDate`, `status` (`ALL` | `UPCOMING` | `REGISTRATION_OPEN` | `ACTIVE` | `ENDED`), `search`, `page`, `size`
  - **Response `200 OK`**:
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
- **Tạo mới khung giờ**: `POST /api/v1/admin/flash-sales/slots`
  - **Request Body**:
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
  - **Quy tắc validate**:
    - `name`: Không rỗng, tối đa 60 ký tự.
    - `endTime`: Phải sau `startTime`.
    - `holdSeconds`: Số nguyên trong khoảng `[60, 1800]` (mặc định 300s).
    - `registrationDeadline`: Phải trước `startTime`.
    - Không trùng khung giờ với phiên khác trên cùng một ngày (trả `409 Conflict` nếu trùng).
- **Chỉnh sửa khung giờ**: `PUT /api/v1/admin/flash-sales/slots/{id}` (chỉ cho phép khi phiên chưa diễn ra).
- **Hủy khung giờ**: `POST /api/v1/admin/flash-sales/slots/{id}/cancel`
  - **Request Body**: `{ "reason": "PLAN_CHANGE", "note": "Lý do chi tiết" }`
  - **Tác vụ Backend**: Mở khóa tồn kho đã nộp của các shop; không cho phép hủy phiên đang `ACTIVE`.

---

### 2.8. Admin: Duyệt sản phẩm Flash Sale (Màn 36)

- **Lấy danh sách SKU nộp theo phiên**: `GET /api/v1/admin/flash-sales/slots/{slotId}/items`
  - **Query Params**: `status` (`PENDING_APPROVAL` | `APPROVED` | `REJECTED`), `search`, `storeType`, `categoryId`, `minDiscount`, `page`, `size`
  - **Response Item Schema**:
    ```json
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
    ```
- **Duyệt 1 SKU**: `POST /api/v1/admin/flash-sales/items/{itemId}/approve`
  - **Request Body**: `{ "commissionOverride": 3.5 }` (tùy chọn)
  - **Tác vụ Backend**: Trừ khóa tồn kho gốc `stock_quantity -= allocatedStock`.
- **Từ chối 1 SKU**: `POST /api/v1/admin/flash-sales/items/{itemId}/reject`
  - **Request Body**: `{ "reason": "PRICE_NOT_ATTRACTIVE", "note": "Chi tiết lý do" }`
- **Hoàn tác (Undo)**: `POST /api/v1/admin/flash-sales/items/{itemId}/undo`
  - Đưa SKU về lại `PENDING_APPROVAL`, hoàn trả tồn kho tạm khóa nếu trước đó đã duyệt.
- **Thao tác hàng loạt**:
  - `POST /api/v1/admin/flash-sales/slots/{slotId}/items/batch-approve`: `{ "itemIds": [1, 2, 3] }`
  - `POST /api/v1/admin/flash-sales/slots/{slotId}/items/batch-reject`: `{ "itemIds": [4, 5], "reason": "...", "note": "..." }`

---

### 2.9. Admin: Giám sát Realtime & Điều khiển phiên (Màn 37)

- **Lấy snapshot dữ liệu**: `GET /api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot`
  - **Response `200 OK`**:
    ```json
    {
      "slot": {
        "id": 102,
        "code": "FS-20261014-12",
        "name": "Giờ Vàng 12:00",
        "status": "ACTIVE",
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
        "driftCount": 0
      },
      "items": [ ... ],
      "recentEvents": [ ... ]
    }
    ```
- **Tạm dừng khẩn cấp phiên**: `POST /api/v1/admin/flash-sales/slots/{slotId}/pause`
- **Tiếp tục mở phiên**: `POST /api/v1/admin/flash-sales/slots/{slotId}/resume`

---

## 3. WebSocket Realtime STOMP Specification

1. **Endpoint kết nối**: `ws://localhost:8080/ws` (SockJS fallback: `http://localhost:8080/ws`).
2. **Kênh lắng nghe tồn kho Storefront**:
   - **Topic**: `/topic/flash-sale/{slotId}/stock`
   - **Payload**:
     ```json
     {
       "slotId": 102,
       "itemId": 1001,
       "availableStock": 27,
       "soldQuantity": 73,
       "isSoldOut": false,
       "timestamp": "2026-10-14T14:30:01.200Z"
     }
     ```
3. **Kênh Telemetry Metrics (Admin Monitor)**:
   - **Topic**: `/topic/admin/flash-sale/{slotId}/metrics`
   - **Tần số**: Định kỳ 1.000ms
   - **Payload**:
     ```json
     {
       "slotId": 102,
       "rps": 3495,
       "activeLocks": 408,
       "completedOrders": 1908,
       "expiredReleases": 187,
       "p99LatencyMs": 132,
       "timestamp": "2026-10-14T14:30:01.000Z"
     }
     ```
4. **Kênh biến động kho SKU Admin**:
   - **Topic**: `/topic/admin/flash-sale/{slotId}/stock`
   - **Payload**: `{ "slotId": 102, "itemId": 1001, "sku": "AT-BLK-L", "availableStock": 7, "currentLocks": 13, "soldQuantity": 30, "sellThroughRate": 60, "status": "SELLING", "timestamp": "..." }`
5. **Kênh luồng sự kiện Live Event Stream**:
   - **Topic**: `/topic/admin/flash-sale/{slotId}/events`
   - **Payload**: `{ "id": "EV-1001", "timestamp": "12:35:22.840", "eventType": "LOCK_ACQUIRED", "orderCode": "FS-261014-K8A1", "userId": "user_419", "message": "Giữ 2 · Áo thun Đen L (Khóa thành công 300s)", "tag": "Khóa thành công" }`
6. **Kênh cảnh báo lệch kho (Anti-Oversold Drift Alert)**:
   - **Topic**: `/topic/admin/flash-sale/{slotId}/drift-alert`
   - **Payload**: `{ "slotId": 102, "isMatched": false, "redisStock": 2498, "dbStock": 2500, "driftCount": 2, "severity": "CRITICAL", "message": "Cảnh báo lệch tồn kho!", "timestamp": "..." }`
