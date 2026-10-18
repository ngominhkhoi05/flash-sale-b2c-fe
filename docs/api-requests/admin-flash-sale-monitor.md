# YÊU CẦU API: GIÁM SÁT FLASH SALE REALTIME (P0)

> **Mức độ ưu tiên**: **P0 (Lõi đề tài Flash Sale)**  
> **Màn hình sử dụng**: Admin Console > Giám sát realtime (`/admin/flash-sale/monitor`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.flashsale` (`AdminFlashSaleController` & `realtime`)

---

## 1. REST API lấy số liệu Telemetry tổng hợp (`GET /api/v1/admin/flash-sales/monitoring`)

- **Mục đích**: Cung cấp dữ liệu khởi tạo khi mở màn hình giám sát hoặc fallback khi mất WebSocket.
- **Method & Path**: `GET /api/v1/admin/flash-sales/monitoring`
- **Quyền yêu cầu**: `@PreAuthorize("hasRole('ADMIN')")`
- **Query Parameters**: `slotId` (Long, bắt buộc) - ID phiên đang theo dõi.
- **Response mẫu (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy dữ liệu giám sát thành công",
    "data": {
      "slotId": 102,
      "slotName": "12:00 - Giờ Vàng Siêu Sale",
      "status": "ACTIVE",
      "startTime": "2026-10-18T12:00:00Z",
      "endTime": "2026-10-18T16:00:00Z",
      "remainingSeconds": 10450,
      "telemetry": {
        "currentQps": 8420,
        "peakQps": 12500,
        "totalOrders": 1284,
        "totalRevenue": 184500000,
        "soldStock": 1420,
        "totalAllocatedStock": 2000,
        "soldPercentage": 71.0,
        "oversoldAttemptsBlocked": 452,
        "activeConnections": 15200,
        "redisLatencyMs": 1.2
      },
      "hotSkus": [
        {
          "itemId": 42,
          "skuCode": "AT-COT-BLK-L",
          "productName": "Áo Thun Cotton Compact",
          "storeName": "UTC Fashion",
          "flashSalePrice": 129000,
          "allocatedStock": 100,
          "availableStock": 14,
          "soldStock": 86,
          "status": "BURNING"
        }
      ]
    },
    "timestamp": "2026-10-18T13:00:00Z"
  }
  ```

---

## 2. Dừng khẩn cấp phiên Flash Sale (`POST /api/v1/admin/flash-sales/slots/{id}/pause`)

- **Mục đích**: Trong trường hợp xảy ra sự cố nghẽn mạng, gian lận hoặc sai giá hàng loạt, Admin có quyền kích hoạt Emergency Pause để chặn ngay lập tức toàn bộ request giữ chỗ trên Redis Lua Script.
- **Method & Path**: `POST /api/v1/admin/flash-sales/slots/{id}/pause`
- **Quy tắc nghiệp vụ**:
  - Ghi cờ `flash_sale:slot_paused:{slotId} = 1` lên Redis.
  - Broadcast sự kiện `SLOT_PAUSED` qua WebSocket STOMP tới topic `/topic/flash-sale/slot/{slotId}/status`.
