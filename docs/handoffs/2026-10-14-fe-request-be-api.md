# Yêu Cầu Bổ Sung API — Backend Flash Sale B2C (Đợt 8: Flash Sale Admin & Realtime)

> **Ngày:** 2026-10-14  
> **Nguồn:** Frontend (`flash-sale-b2c-fe`) gửi Backend (`flash-sale-b2c-UTC2`)  
> **Trạng thái:**
> - ✅ = BE đã có, đang dùng tốt
> - ⚠️ = Có endpoint nhưng schema/DTO chưa đầy đủ
> - ❌ = Chưa có trên BE (Cần bổ sung gấp cho đợt 8)

---

## 1. API hoàn toàn chưa có (FE cần để hoàn thiện tính năng)

### 1.1 Quản lý Khung giờ Flash Sale (Màn 35 `/admin/flash-sale`)

| FE cần | Endpoint | Phương thức | Ghi chú |
|--------|----------|--------------|---------|
| Danh sách khung giờ (Lịch tuần & Bảng) | `/api/v1/admin/flash-sales/slots` | GET | Lọc theo tuần (`startDate`, `endDate`), `status`, phân trang |
| Chi tiết 1 khung giờ | `/api/v1/admin/flash-sales/slots/{id}` | GET | Thông tin phiên & metadata phân bổ Redis |
| Tạo khung giờ mới | `/api/v1/admin/flash-sales/slots` | POST | Chống trùng giờ, lock time 60-1800s, hạn đăng ký shop |
| Chỉnh sửa khung giờ | `/api/v1/admin/flash-sales/slots/{id}` | PUT | Chỉ sửa khi phiên chưa diễn ra (`UPCOMING` / `REGISTRATION_OPEN`) |
| Hủy khung giờ | `/api/v1/admin/flash-sales/slots/{id}/cancel` | POST | Body: `{ reason, note }`. Mở khóa toàn bộ tồn kho SKU đã nộp |

**Request params GET `/api/v1/admin/flash-sales/slots`:**
```
GET /api/v1/admin/flash-sales/slots?startDate=2026-10-12&endDate=2026-10-18&status=ALL&page=0&size=50
```

**Response GET `/api/v1/admin/flash-sales/slots`:**
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

**Request Body POST `/api/v1/admin/flash-sales/slots`:**
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

**Lý do:** Đây là module cốt lõi để Admin điều phối tài nguyên, mở cổng cho người bán đăng ký và kích hoạt chu kỳ nạp Redis trước giờ G.

---

### 1.2 Xét duyệt sản phẩm Flash Sale (Màn 36 `/admin/flash-sale/approvals`)

| FE cần | Endpoint | Phương thức | Ghi chú |
|--------|----------|--------------|---------|
| Danh sách SKU nộp theo phiên | `/api/v1/admin/flash-sales/slots/{slotId}/items` | GET | Lọc `status` (Chờ duyệt / Đã duyệt / Từ chối), search, phân trang |
| Duyệt đơn lẻ 1 SKU | `/api/v1/admin/flash-sales/items/{itemId}/approve` | POST | Trừ tồn kho gốc `248 → 198`, tùy chọn ghi đè hoa hồng phiên |
| Từ chối đơn lẻ 1 SKU | `/api/v1/admin/flash-sales/items/{itemId}/reject` | POST | Lưu lý do từ chối & giải trình |
| Hoàn tác SKU (Undo) | `/api/v1/admin/flash-sales/items/{itemId}/undo` | POST | Đưa SKU từ Đã duyệt/Từ chối về lại Chờ duyệt, hoàn trả tồn kho |
| Duyệt hàng loạt | `/api/v1/admin/flash-sales/slots/{slotId}/items/batch-approve` | POST | Body: `{ itemIds: [1, 2, 3] }` |
| Từ chối hàng loạt | `/api/v1/admin/flash-sales/slots/{slotId}/items/batch-reject` | POST | Body: `{ itemIds: [4, 5], reason, note }` |

**Response GET `/api/v1/admin/flash-sales/slots/{slotId}/items`:**
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

**Request POST `/api/v1/admin/flash-sales/items/{itemId}/approve`:**
```json
{
  "commissionOverride": 3.5
}
```

**Request POST `/api/v1/admin/flash-sales/items/{itemId}/reject`:**
```json
{
  "reason": "PRICE_NOT_ATTRACTIVE",
  "note": "Giá đề xuất chưa đạt mức chiết khấu cam kết 50% của phiên."
}
```

**Lý do:** Kiểm soát chặt chẽ giá thành, chống hiện tượng đôn giá ảo trước sale và tự động trừ kho khả dụng của shop để chống bùng hàng.

---

### 1.3 Giám sát Realtime & Điều khiển phiên (Màn 37 `/admin/flash-sale/monitor`)

| FE cần | Endpoint | Phương thức | Ghi chú |
|--------|----------|--------------|---------|
| Snapshot dữ liệu khi load trang | `/api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot` | GET | 5 KPIs, đối soát 3 tầng kho, danh sách SKU, 20 sự kiện gần nhất |
| Tạm dừng khẩn cấp phiên | `/api/v1/admin/flash-sales/slots/{slotId}/pause` | POST | Chặn lệnh `reserve` mới trên Redis Lua, cho phép đơn cũ thanh toán |
| Tiếp tục phiên | `/api/v1/admin/flash-sales/slots/{slotId}/resume` | POST | Mở lại cổng nhận đơn |

**Response GET `/api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot`:**
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

**Lý do:** Phục vụ trực tiếp cho buổi báo cáo đồ án khi thực hiện kịch bản Load Test 1000 - 5000 request/giây, chứng minh tính năng Distributed Lock và Anti-Oversold hoạt động chuẩn xác.

---

### 1.4 Lấy giờ máy chủ (Server Time for Countdown)

| FE cần | Endpoint | Phương thức | Ghi chú |
|--------|----------|--------------|---------|
| Giờ server đồng bộ countdown | `/api/time` (hoặc `/api/v1/time`) | GET | Không tin đồng hồ client |

**Response GET `/api/time`:**
```json
{
  "serverTime": "2026-10-14T12:00:00.000Z",
  "timestampMs": 1792065600000,
  "timezone": "Asia/Ho_Chi_Minh"
}
```

---

## 2. API có nhưng schema/DTO chưa đầy đủ (⚠️)

### 2.1 FlashSaleSlot (Storefront & Admin) — thiếu field

| Field | Kiểu | Ghi chú |
|-------|-------|---------|
| `holdSeconds` | `number` | Thời gian giữ chỗ đơn hàng (mặc định 300s). Hiện BE hardcode. |
| `registrationDeadline` | `string` (ISO) | Hạn chót cho người bán nộp sản phẩm |
| `approvedSkusCount` | `number` | Số lượng SKU đã được duyệt |
| `pendingSkusCount` | `number` | Số lượng SKU đang chờ duyệt |
| `soldQuantity` | `number` | Tổng số lượng sản phẩm đã bán trong phiên |
| `allocatedQuantity` | `number` | Tổng số lượng sản phẩm phân bổ mở bán |

**Lý do:** Bảng Lịch tuần và Dashboard cần các số liệu này để hiển thị tiến trình bán và tình trạng slot.

---

### 2.2 FlashSaleItemResponse — thiếu field

| Field | Kiểu | Ghi chú |
|-------|-------|---------|
| `userPurchaseLimit` | `number` | Hạn mức mua của mỗi khách hàng trong phiên (mặc định 2 sp/user/slot) |
| `baseStock` | `number` | Tồn kho gốc của shop trước khi khóa (`stock_quantity`) |
| `availableBaseStockAfterLock` | `number` | Tồn kho gốc còn lại sau khi tạm khóa (`248 → 198`) |
| `pricingWarning` | `object` | Cảnh báo giá Flash Sale cao hơn giá bán trung bình 30 ngày qua |
| `commissionRate` | `number` | Mức hoa hồng áp dụng riêng cho phiên (%) |

---

### 2.3 Reserve Flash Sale Response (`/api/v1/flash-sales/reserve`)

| Field | Kiểu | Trạng thái |
|-------|-------|------------|
| `orderCode` | `string` | ⚠️ Cần trả về mã đơn chuỗi (ví dụ: `FS-261014-K8A1`) để FE hiển thị và điều hướng |
| `remainingStock` | `number` | ⚠️ Trả về số lượng tồn kho còn lại của SKU ngay sau khi giữ chỗ thành công |

---

## 3. WebSocket Realtime / STOMP Specifications

> **Endpoint STOMP:** `ws://localhost:8080/ws` (SockJS fallback: `http://localhost:8080/ws`).  
> **Headers bắt tay:** `Authorization: Bearer <token>` hoặc query `?token=<jwt>`.

| Tính năng | Topic STOMP | Tần số / Kích hoạt | Format Payload |
|---|---|---|---|
| **Telemetry Metrics** | `/topic/admin/flash-sale/{slotId}/metrics` | Định kỳ mỗi 1.000ms | `{ slotId, rps, activeLocks, completedOrders, expiredReleases, p99LatencyMs, timestamp }` |
| **Biến động kho SKU** | `/topic/admin/flash-sale/{slotId}/stock` | Ngay khi có giao dịch | `{ slotId, itemId, sku, availableStock, currentLocks, soldQuantity, sellThroughRate, status, timestamp }` |
| **Nhật ký sự kiện** | `/topic/admin/flash-sale/{slotId}/events` | Ngay khi có sự kiện | `{ id, slotId, timestamp, eventType, orderCode, userId, message, tag }` |
| **Cảnh báo lệch kho** | `/topic/admin/flash-sale/{slotId}/drift-alert` | Khi worker phát hiện lệch | `{ slotId, isMatched, redisStock, dbStock, driftCount, severity, message, timestamp }` |
| **Tồn kho Storefront** | `/topic/flash-sale/{slotId}/stock` | Ngay khi có giao dịch | `{ slotId, itemId, availableStock, soldQuantity, isSoldOut, timestamp }` |

---

## 4. Ghi chú nghiệp vụ quan trọng cho Backend Team

1. **Cơ chế nạp Cache Redis (Pre-warm):**
   - Tồn kho các SKU `APPROVED` phải được nạp lên Redis Key `flash_sale:stock:{itemId}` trước giờ mở bán đúng **5 phút**.
   - Dùng lệnh `SETNX` để đảm bảo idempotent, không ghi đè nhân đôi số lượng khi cronjob chạy lại.
2. **Cơ chế trả kho (Auto-release / Rollback):**
   - Hết hạn giữ chỗ 300s mà chưa thanh toán: Worker quét và gọi `rollback_stock.lua` trả đúng số lượng đã giữ về lại Redis, đồng thời giải phóng hạn mức `flash_sale:user_limit`.
   - Kết thúc phiên: Lượng `availableStock` chưa bán hết trên Redis phải được hoàn trả về `stock_quantity` của `product_variants`.
3. **Chống bán vượt (Anti-Oversold Verification):**
   - Invariant: `redisStock == dbAllocatedStock - (completedOrders + activeLocks)`.
   - Bất cứ khi nào sai số khác 0, push ngay cảnh báo lên topic `/drift-alert`.

---

## 5. Tổng kết yêu cầu ưu tiên

| Ưu tiên | API / Kênh STOMP | Lý do |
|---|---|---|
| 🔴 **Cao** | `GET /api/v1/admin/flash-sales/slots` | Lấy lịch tuần và danh sách phiên Màn 35 |
| 🔴 **Cao** | `POST /api/v1/admin/flash-sales/slots` | Tạo phiên Flash Sale mới |
| 🔴 **Cao** | `GET /api/v1/admin/flash-sales/slots/{slotId}/items` | Danh sách SKU chờ duyệt Màn 36 |
| 🔴 **Cao** | `POST /api/v1/admin/flash-sales/items/{itemId}/approve` | Duyệt SKU & trừ tồn kho khả dụng |
| 🔴 **Cao** | `GET /api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot` | Snapshot ban đầu cho Màn 37 |
| 🔴 **Cao** | WebSocket `/topic/admin/flash-sale/{slotId}/metrics` & `/stock` | Cốt lõi hiển thị realtime khi load test |
| 🟠 **Trung** | `POST /api/v1/admin/flash-sales/items/{itemId}/reject` & `undo` | Từ chối & hoàn tác duyệt SKU |
| 🟠 **Trung** | `POST /api/v1/admin/flash-sales/slots/{slotId}/items/batch-approve` | Duyệt hàng loạt |
| 🟠 **Trung** | `POST /api/v1/admin/flash-sales/slots/{slotId}/pause` & `resume` | Nút tạm dừng phiên khẩn cấp |
| 🟠 **Trung** | WebSocket `/topic/admin/flash-sale/{slotId}/events` & `/drift-alert` | Feed nhật ký và cảnh báo lệch kho |
| 🟡 **Thấp** | `POST /api/v1/admin/flash-sales/slots/{slotId}/cancel` | Hủy phiên chưa diễn ra |
| 🟡 **Thấp** | `PUT /api/v1/admin/flash-sales/slots/{slotId}` | Chỉnh sửa thông tin phiên |

---

## 6. Checklist cho Backend Team

```markdown
[ ] 1. Thêm GET /api/v1/admin/flash-sales/slots (lọc theo startDate, endDate, status, search, pagination)
[ ] 2. Thêm POST /api/v1/admin/flash-sales/slots (validate: name max 60, endTime > startTime, holdSeconds [60, 1800], deadline < start, overlap check)
[ ] 3. Thêm PUT /api/v1/admin/flash-sales/slots/{id} & POST /api/v1/admin/flash-sales/slots/{id}/cancel
[ ] 4. Thêm GET /api/v1/admin/flash-sales/slots/{slotId}/items (lọc status PENDING_APPROVAL/APPROVED/REJECTED, search, pricingWarning)
[ ] 5. Thêm POST /api/v1/admin/flash-sales/items/{itemId}/approve (trừ kho gốc baseStock, hỗ trợ commissionOverride)
[ ] 6. Thêm POST /api/v1/admin/flash-sales/items/{itemId}/reject & POST /api/v1/admin/flash-sales/items/{itemId}/undo
[ ] 7. Thêm POST /api/v1/admin/flash-sales/slots/{slotId}/items/batch-approve & batch-reject
[ ] 8. Thêm GET /api/v1/admin/flash-sales/slots/{slotId}/monitor/snapshot (kpis, reconciliation 3 tầng, items, recentEvents)
[ ] 9. Thêm POST /api/v1/admin/flash-sales/slots/{slotId}/pause & resume
[ ] 10. Bật STOMP topic /topic/admin/flash-sale/{slotId}/metrics (đẩy 1s/lần)
[ ] 11. Bật STOMP topic /topic/admin/flash-sale/{slotId}/stock (đẩy khi đổi tồn kho)
[ ] 12. Bật STOMP topic /topic/admin/flash-sale/{slotId}/events (đẩy event stream ms)
[ ] 13. Bật STOMP topic /topic/admin/flash-sale/{slotId}/drift-alert (cảnh báo lệch kho)
[ ] 14. Thêm GET /api/time trả serverTime ISO + timestampMs
```
