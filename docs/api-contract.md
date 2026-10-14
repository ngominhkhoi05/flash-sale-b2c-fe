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
3. **Quy ước Header định danh người mua**:
   - Trong giai đoạn chưa tích hợp toàn diện hệ thống Authentication, mỗi request đặt mua sẽ tạm thời gửi kèm header:
     ```http
     X-User-Id: 1001
     ```
   - Khi hệ thống Auth hoàn tất, header này sẽ được thay thế bằng chuẩn `Authorization: Bearer <JWT_TOKEN>`.
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
  - `X-User-Id`: ID người mua (ví dụ `1001`)
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

### 2.7. Admin: Quản lý Chiến dịch Flash Sale

- **Lấy danh sách**: `GET /api/v1/admin/flash-sale/campaigns`
- **Tạo mới chiến dịch**: `POST /api/v1/admin/flash-sale/campaigns`
  - **Request Body**:
    ```json
    {
      "name": "Chiến dịch Mừng Lễ 20/10",
      "startTime": "2026-10-20T12:00:00.000Z",
      "endTime": "2026-10-20T14:00:00.000Z",
      "productId": 1001,
      "variantId": 2001,
      "originalPrice": 1450000,
      "flashSalePrice": 790000,
      "allocatedStock": 100
    }
    ```
  - **Quy tắc validate**:
    - `name`: Không được rỗng.
    - `startTime`: Phải sau thời điểm hiện tại.
    - `endTime`: Phải lớn hơn `startTime`.
    - `allocatedStock`: `> 0`.
    - `flashSalePrice`: `> 0` và `<= originalPrice`.

---

### 2.8. Admin: Giám sát Realtime (Live Monitoring)

- **Method**: `GET`
- **Path**: `/api/v1/admin/flash-sale/monitoring`
- **Query Params**: `slotId` (tùy chọn)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy dữ liệu giám sát realtime thành công",
    "data": {
      "slotId": 102,
      "slotName": "Phiên Giờ Vàng 12:00 - 15:00",
      "startTime": "2026-10-14T12:00:00.000Z",
      "endTime": "2026-10-14T16:32:04.000Z",
      "totalOrders": 2315,
      "orderVelocityPerSecond": 14.8,
      "redisConnections": 42,
      "items": [
        {
          "itemId": 1,
          "productId": 1001,
          "productName": "Tai nghe Bluetooth chống ồn ANC SoundCore Q30",
          "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
          "allocatedStock": 100,
          "availableStock": 28,
          "soldQuantity": 72,
          "sellThroughRate": 72,
          "currentOrderRatePerMinute": 8.5,
          "status": "HOT"
        }
      ],
      "lastUpdated": "2026-10-14T14:30:00.000Z"
    },
    "timestamp": "2026-10-14T14:30:00.000Z"
  }
  ```

---

## 3. WebSocket Realtime STOMP Specification

1. **Endpoint kết nối**: `ws://localhost:8080/ws` (SockJS fallback: `http://localhost:8080/ws`).
2. **Kênh lắng nghe tồn kho (Storefront)**:
   - **Topic**: `/topic/flash-sale/{slotId}/stock`
   - **Payload mẫu khi có giao dịch**:
     ```json
     {
       "slotId": 102,
       "itemId": 1,
       "availableStock": 27,
       "soldQuantity": 73,
       "isSoldOut": false,
       "timestamp": "2026-10-14T14:30:01.200Z"
     }
     ```
   - **Xử lý phía FE**: Cập nhật thanh tồn kho `StockBar` và trạng thái nút "Mua ngay" mượt mà theo `itemId`, không reload trang.
3. **Kênh giám sát toàn hệ thống (Admin)**:
   - **Topic**: `/topic/admin/flash-sale/monitoring`
   - **Payload mẫu**:
     ```json
     {
       "slotId": 102,
       "totalOrders": 2316,
       "velocity": 15.2,
       "timestamp": "2026-10-14T14:30:01.500Z"
     }
     ```
   - **Xử lý phía FE**: Cập nhật biểu đồ nhịp độ đặt hàng và số đơn xác nhận trực tiếp.
