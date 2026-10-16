# Handoff cho BE — 2026-10-15 — Missing APIs & Shape Mismatches (FE Audit v2)

> **Từ**: FE team (flash-sale-b2c-fe)
> **Đến**: BE team (flash-sale-b2c-UTC2)
> **Ngày**: 2026-10-15
> **Nguồn Swagger**: http://180.93.137.28/swagger-ui/index.html# + http://180.93.137.28/v3/api-docs
> **Snapshot**: `scripts/swagger-v2.json` (90KB, 74 paths, 102 schemas)
> **Bối cảnh**: FE vừa re-audit toàn bộ Swagger sau khi BE cập nhật. Phát hiện 8 endpoint FE chưa implement function (mặc dù BE đã có endpoint) + 7 SHAPE_MISMATCH cần confirm.

---

## Tóm tắt nhanh (TL;DR)

| # | Vấn đề | Cần BE làm? | Action |
|---|---|---|---|
| 1 | 8 endpoint **BE đã có**, FE chưa implement function | ❌ **KHÔNG** | FE tự implement. Handoff này xác nhận spec ổn |
| 2 | 7 SHAPE_MISMATCH (FE đang gửi/đọc sai field) | ⚠️ **Một số cần BE confirm** | Xem bảng dưới |
| 3 | 2 thiếu response schema trong OpenAPI | ✅ **CÓ** — BE cần bổ sung `$ref` cho 2 endpoint (xem §D) | |
| 4 | Câu hỏi về contract (nullable, empty) | ⚠️ **Có** — BE confirm vài điểm (xem §E) | |

> **Quan trọng**: Phần lớn các mục trong handoff này **KHÔNG yêu cầu BE implement endpoint mới**. Hầu hết là **FE tự fix code**. Mục đích chính là:
>
> 1. Xác nhận BE spec ổn định cho 8 endpoint FE chuẩn bị integrate.
> 2. Confirm contract cho 7 SHAPE_MISMATCH (một số do FE sai, một số do BE đã refactor).
> 3. Nhờ BE bổ sung thiếu sót nhỏ trong OpenAPI (response schema refs).

---

## A. 8 endpoint BE đã có — FE chưa implement function

FE đã audit toàn bộ Swagger. 8 endpoint dưới đây **đã có trong Backend** nhưng FE chưa có function gọi. **BE không cần implement gì thêm** — chỉ cần confirm spec ổn định trong OpenAPI (FE dùng làm source of truth để implement client).

### A.1. `POST /api/v1/auth/refresh-token` — **HIGH**

**Priority**: HIGH (auth-jwt refresh flow)
**FE sẽ dùng để**: Tự động refresh access token khi gần hết hạn (qua 401 interceptor trong `src/lib/api/client.ts`)
**Mô tả Swagger**: "Sử dụng Refresh Token còn hiệu lực để cấp mới Access Token"

**Request body** (`RefreshTokenRequest`):
```json
{
  "refreshToken": "string"   // required
}
```

**Response 200** (`ApiResponseAuthResponse`):
```json
{
  "success": true,
  "code": "string",
  "message": "string",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer",
    "expiresIn": 0,
    "user": { /* UserResponse */ },
    "roles": ["string"]
  },
  "timestamp": "ISO-8601"
}
```

**Error codes cần confirm**:
- `401 AUTH_401_*` (refresh token hết hạn / invalid)
- `400 AUTH_400_*` (refresh token trống / sai format)

**Câu hỏi cho BE**:
1. Refresh token có TTL bao lâu? (FE cần track để proactively refresh trước khi hết)
2. Response có trả về **rotation** (refresh token mới) hay giữ nguyên cái cũ? (Swagger cho thấy CÓ rotation vì response có cả `refreshToken` mới)
3. Có rate limit không? (vd: max 5 refresh/phút)

### A.2. `POST /api/v1/flash-sales/reservations` — **HIGH (MỤC 9.1)**

**Priority**: HIGH (core Flash Sale flow)
**FE sẽ dùng để**: Bấm "Mua ngay" → tạo đơn giữ chỗ PENDING_PAYMENT
**Mô tả Swagger**: "Đặt hàng giữ chỗ Flash Sale (Alias tổng thể ngắn gọn). Trừ tồn kho nguyên tử từ Redis Lua, tạo đơn PENDING_PAYMENT"

**Request body** (`CreateReservationRequest`):
```json
{
  "flashSaleItemId": 0,   // required — number (int64)
  "addressId": 0,         // optional — number (int64) cho shipping address
  "quantity": 0           // required — number, thường 1-5 theo userPurchaseLimit
}
```

**Response 200** (`ApiResponseReservationResponse`):
```json
{
  "success": true,
  "code": "string",
  "message": "string",
  "data": {
    "orderId": 0,
    "orderCode": "FS-261001-A7K2Q",
    "flashSaleItemId": 0,
    "quantity": 0,
    "flashSalePrice": 0,
    "totalAmount": 0,
    "status": "PENDING_PAYMENT",
    "expiresAt": "ISO-8601",   // reservation TTL
    "message": "string",
    "reservationId": 0
  },
  "timestamp": "ISO-8601"
}
```

**Error codes cần confirm**:
- `409 FLASH_SALE_SOLD_OUT` — hết stock ngay lúc reserve
- `409 FLASH_SALE_LIMIT_EXCEEDED` — vượt userPurchaseLimit
- `410 FLASH_SALE_SLOT_ENDED` — phiên đã kết thúc
- `404 FLASH_SALE_ITEM_NOT_FOUND`
- `400 VALIDATION_ERROR` — quantity <= 0

**Idempotency**: FE sẽ gửi header `Idempotency-Key: <uuid>` để chống double-click. Câu hỏi: BE có dùng header này không? (Check `security` trong OpenAPI — hiện chỉ có Bearer, không thấy idempotency)

### A.3. `POST /api/v1/flash-sales/reserve` — **HIGH (MỤC 9.2)**

**Priority**: HIGH (bulk reserve flow)
**FE sẽ dùng để**: (nếu cần) Bulk reserve nhiều items cùng lúc
**Mô tả Swagger**: "Giữ chỗ Flash Sale (Mục 9.2). Trừ tồn kho nguyên tử từ Redis Lua, tạo đơn PENDING_PAYMENT, **hỗ trợ bỏ hoàn tất đặt**"

**Câu hỏi cho BE**:
1. `/reservations` và `/reserve` khác nhau thế nào? `/reservations` mô tả "alias tổng thể", `/reserve` mô tả "Mục 9.2". Có phải `/reserve` là bulk và `/reservations` là single-item?
2. Request body của `/reserve` là gì? (Swagger không show schema — chỉ `application/json`, required true)
3. Có nên dùng `/reserve` thay vì `/reservations` cho flow mua 1 item?

### A.4. `DELETE /api/v1/flash-sales/reservations/{reservationId}` — **HIGH (MỤC 9.3)**

**Priority**: HIGH (cancel reservation + restore stock)
**FE sẽ dùng để**: Hủy đơn giữ chỗ khi user đổi ý / quá thời gian thanh toán
**Mô tả Swagger**: "Hủy giữ chỗ Flash Sale (Mục 9.3). Hủy đơn giữ chỗ chưa thanh toán và **hoàn trả tồn kho nguyên tử**"

**Path parameter**:
- `reservationId` (string, required) — id của reservation

**Response 200** (`ApiResponseCancelReservationResponse`):
```json
{
  "success": true,
  "code": "string",
  "message": "string",
  "data": {
    "success": true,
    "reservationId": 0,
    "message": "Đã hủy giữ chỗ thành công"
  },
  "timestamp": "ISO-8601"
}
```

**Câu hỏi cho BE**:
1. `reservationId` ở path là **string** hay **number**? (OpenAPI hiện để `string` — nhưng `CancelReservationResponse.reservationId` là `number` — inconsistency)
2. Có thể cancel reservation đã EXPIRED không? (Vd: status `EXPIRED` → trả 409 hay 200?)
3. Cancel có restore stock cho cả user khác không, hay chỉ session của user này?

### A.5. `GET /api/v1/flash-sales/items/active` — **LOW**

**Priority**: LOW (homepage section)
**FE sẽ dùng để**: Hiển thị section "Flash Sale đang diễn ra" trên homepage (giống homepage hiện tại nhưng chuyên cho ACTIVE slot)
**Mô tả Swagger**: "Xem danh sách các sản phẩm Flash Sale đang mở bán active cho trang chủ. Trả về danh sách sản phẩm đang trong phiên Flash Sale ACTIVE kèm tồn kho khả dụng thời gian thực"

**Response 200** (`ApiResponseListPublicFlashSaleItemResponse`):
```json
{
  "success": true,
  "code": "string",
  "message": "string",
  "data": [
    {
      "id": 0,
      "slotId": 0,
      "variantId": 0,
      "sku": "string",
      "variantName": "string",
      "productName": "string",
      "imageUrl": "string",
      "originalPrice": 0,
      "flashSalePrice": 0,
      "allocatedStock": 0,
      "availableStock": 0,
      "userPurchaseLimit": 0,
      "status": "string"
    }
  ],
  "timestamp": "ISO-8601"
}
```

**Câu hỏi cho BE**:
1. Có query params không? (vd: `limit`, `categoryId`) — Swagger hiện không show
2. Có phân trang không? (Có thể flash sale ACTIVE chỉ có 5-20 items nên không cần)

### A.6. `PUT /api/v1/users/me` — **MEDIUM**

**Priority**: MEDIUM (user account page)
**FE sẽ dùng để**: User cập nhật họ tên / số điện thoại trong trang Tài khoản
**Mô tả Swagger**: "Cập nhật hồ sơ cá nhân. Cập nhật họ tên, số điện thoại hoặc hình đại diện"

**Request body** (`UpdateProfileRequest`):
```json
{
  "fullName": "string",   // required
  "phone": "string"       // optional — format +84xxxxxxxxx?
}
```

**Response 200** (`ApiResponseUserResponse`):
```json
{
  "success": true,
  "code": "string",
  "message": "string",
  "data": {
    "id": 0,
    "email": "string",
    "fullName": "string",
    "phone": "string",
    "avatarUrl": "string",
    "status": "string",
    "createdAt": "ISO-8601",
    "roles": ["string"]
  },
  "timestamp": "ISO-8601"
}
```

**Câu hỏi cho BE**:
1. Phone format: `+84xxxxxxxxx` hay `0xxxxxxxxx`? (Login hiện tại FE nhập `0912...` → gửi `+84912...`. Cần consistent)
2. Email có cho update không? (Hiện Swagger không có `email` trong request — assume immutable)
3. Validate `fullName` length? (min/max characters?)

### A.7. `PUT /api/v1/users/me/change-password` — **MEDIUM**

**Priority**: MEDIUM (account security)
**FE sẽ dùng để**: User đổi mật khẩu trong trang Tài khoản
**Mô tả Swagger**: "Xác nhận mật khẩu cũ và thiết lập mật khẩu mới"

**Request body** (`ChangePasswordRequest`):
```json
{
  "oldPassword": "string",   // required
  "newPassword": "string"    // required
}
```

**Response 200** (`ApiResponseVoid`):
```json
{
  "success": true,
  "code": "string",
  "message": "string",
  "data": null,
  "timestamp": "ISO-8601"
}
```

**Câu hỏi cho BE**:
1. Validate `newPassword` length? (min 8, có regex yêu cầu chữ hoa/thường/số?)
2. Có check `oldPassword === newPassword` không? (Bắt buộc khác)
3. Sau khi change password có invalidate các session khác không? (Vd: đăng xuất khỏi các thiết bị khác)
4. Error code khi `oldPassword` sai? (Vd: `AUTH_OLD_PASSWORD_MISMATCH`)

### A.8. `POST /api/v1/users/me/avatar` — **LOW**

**Priority**: LOW (avatar upload)
**FE sẽ dùng để**: User upload avatar trong trang Tài khoản
**Mô tả Swagger**: "Upload avatar hiện tại. Tự động soft-delete avatar cũ (partial unique index đảm bảo 1 user chỉ có 1 avatar ACTIVE)"

**Request body** (`multipart/form-data`):
- File field chưa rõ tên — đề xuất `file` (hoặc `avatar`)

**Response 200** (`ApiResponseImageResponse`):
```json
{
  "success": true,
  "code": "string",
  "message": "string",
  "data": {
    "id": 0,
    "url": "string",
    "publicId": "string",
    "entityType": "string",
    "entityId": 0,
    "isPrimary": true,
    "isActive": true,
    "createdAt": "ISO-8601"
  },
  "timestamp": "ISO-8601"
}
```

**Câu hỏi cho BE**:
1. Form field name là `file` hay `avatar`? (Swagger không show tên field, chỉ show content-type)
2. Max file size? (Recommended: 5MB)
3. Allowed mime types? (image/jpeg, image/png, image/webp?)
4. Có resize / crop tự động không? (Recommended: trả URL đã qua Cloudinary transform)

---

## B. 7 SHAPE_MISMATCH cần xác nhận

Bảng dưới liệt kê 7 chỗ FE đang đọc/gửi field **khác với Swagger spec hiện tại**. Phân loại:
- **FE tự fix** — FE đang sai, sẽ tự sửa trong sprint tới
- **BE confirm** — BE đã đúng spec, nhưng FE cần BE xác nhận sẽ KHÔNG refactor thêm

| # | Endpoint | Field | FE hiện tại | Swagger spec | Loại | Action |
|---|---|---|---|---|---|---|
| **B.1** | `POST /vouchers/apply` request | request body | `{ orderAmount, voucherCode, storeId? }` | `{ code, storeId?, subtotalAmount }` (required: code, subtotalAmount) | **FE tự fix** | FE sẽ đổi `orderAmount` → `subtotalAmount`, `voucherCode` → `code` (file `src/features/checkout/api.ts:322-348`) |
| **B.2** | `POST /vouchers/apply` response | response | FE đọc `data.voucher`, `data.applicable`, `data.reasonCode` | BE trả `data.voucherId, data.code, data.discountAmount, data.finalAmount` (đơn giản hơn) | **BE confirm** | Có vẻ BE đã refactor. Câu hỏi: `finalAmount = subtotalAmount - discountAmount`? `reasonCode` cho applicable=false nằm ở đâu? Có trả `voucherId` thay vì full voucher object? |
| **B.3** | `GET /cart` response | fields | FE chỉ đọc `id, userId, storeGroups, totalItems, grandTotal` | BE trả đủ 8 fields: `id, userId, storeGroups, totalItems, subtotal, totalShippingFee, totalAmount, grandTotal` | **FE tự fix** | FE sẽ thêm 3 fields (`subtotal, totalShippingFee, totalAmount`) vào `BackendCartResponse` (`src/features/cart/api.ts:42-51`) |
| **B.4** | `GET /cart` items response | fields | FE thiếu `productId, stockQuantity` | BE trả đủ 13 fields | **FE tự fix** | FE sẽ thêm 2 fields vào `BackendCartItem` (`src/features/cart/api.ts:23-37`) |
| **B.5** | `POST /auth/login` + `POST /auth/register` response | field | FE thiếu `roles: string[]` trong `AuthResponse` | BE trả `roles: array` | **FE tự fix** | FE sẽ thêm `roles` vào `AuthResponse` (`src/features/auth/api.ts:54-63`) + xem xét dùng `roles` thay cho JWT parse (xem `auth-jwt.mdc`) |
| **B.6** | `GET /users/me` response | field | FE thiếu `roles: string[]` trong `UserResponse` | BE trả `roles: array` | **FE tự fix** | Tương tự B.5 — thêm `roles` vào `UserResponse` (`src/features/auth/api.ts:42-52`) |
| **B.7** | Tất cả endpoints | response envelope | FE assume BE trả `{ data: T }` envelope (đã đúng) | BE trả `ApiResponse<T>` = `{ success, code, message, data, timestamp }` | **OK** | `apiFetch` đã handle đúng. Confirm với BE là spec ổn định |

**Câu hỏi quan trọng cho BE về B.2**:
1. `VoucherCalculationResponse` (mới, đơn giản) **đã thay thế hoàn toàn** cho response cũ (có `voucher` object) chưa? Hay vẫn còn backward compat?
2. Nếu `applicable=false`: trả `discountAmount=0, finalAmount=subtotalAmount` hay có field riêng (`reasonCode`)?
3. Có nên trả full voucher object (để hiển thị UI) trong response không? Hiện tại FE chỉ nhận `voucherId` + `code` — không đủ info UI.

---

## C. Endpoints còn nghi vấn (chưa rõ contract)

| Endpoint | Câu hỏi | Note |
|---|---|---|
| `POST /api/v1/flash-sales/reserve` (Mục 9.2) | Request body schema chưa rõ — Swagger chỉ show `application/json` required, không có schema ref | Khác với `/reservations` (đã có `CreateReservationRequest`). Bulk items? |
| `POST /api/v1/users/me/avatar` | Form field name chưa rõ (`file` hay `avatar`?) | OpenAPI thiếu thông tin field name |
| `GET /api/v1/flash-sales/items/active` | Có query params không? | OpenAPI không show `parameters` |
| `GET /api/v1/orders/{id}` (existing) | Field `flashSaleItemId` trong `BackendOrderItem` (FE có) — BE có thật sự trả? | FE có defensive, BE có thể null |

---

## D. Thiếu sót trong OpenAPI (BE cần bổ sung nhỏ)

3 endpoint dưới đây response content type là `*/*` với schema **rỗng** (không có `$ref`). FE không thể generate type chính xác:

| Endpoint | Method | Vấn đề | Đề xuất |
|---|---|---|---|
| `/api/v1/cart/items` (POST) | POST | Response content `*/*` với schema `{}` (empty) | Bổ sung `$ref: '#/components/schemas/ApiResponseCartResponse'` |
| `/api/v1/cart/items/{itemId}` (PUT) | PUT | Tương tự | Bổ sung `ApiResponseCartResponse` |
| `/api/v1/cart/items/{itemId}` (DELETE) | DELETE | Tương tự | Bổ sung `ApiResponseCartResponse` |
| `/api/v1/cart` (DELETE) | DELETE | Tương tự | Bổ sung `ApiResponseVoid` |

> Hiện FE đang assume các response này trả `BackendCartResponse` (full cart sau khi mutate). Nếu BE chỉ trả 204 hay partial cart, cần biết để update type.

---

## E. Câu hỏi cross-cutting về contract

Một số câu hỏi tổng quát về OpenAPI spec mà FE cần BE confirm trước khi implement:

### E.1. Refresh token strategy
1. **TTL** của refresh token là bao lâu? (Recommend: 7-30 ngày)
2. **Rotation**: BE có rotate refresh token mỗi lần refresh không? (Response hiện có cả `refreshToken` mới → assume CÓ rotation)
3. **Revocation**: Sau khi change-password, refresh token cũ có bị invalidate không?
4. **Multi-device**: 1 user có nhiều refresh token cùng lúc (mỗi thiết bị 1 token) hay single token?

### E.2. Reservation TTL
1. `ReservationResponse.expiresAt` là TTL tổng (vd: 5 phút từ lúc tạo) hay absolute timestamp?
2. Sau khi expire, có background job tự cancel + restore stock? (Mô tả `/reservations/{id} DELETE` là "hoàn trả tồn kho nguyên tử" — có auto chạy khi expire?)
3. Có webhook/push notification khi sắp expire không? (FE hiện polling 3s/lần cho QR page)

### E.3. Error code consistency
1. Convention đặt tên: `AUTH_001`, `VALIDATION_ERROR`, hay mixed? Có bảng mapping chính thức không?
2. Có field `details` trong error response không? (`ApiError.details` trong FE — xem `src/lib/api/errors.ts`)
3. Có endpoint để FE tra cứu error code → message không? Hay FE tự maintain mapping?

### E.4. Idempotency
1. BE có support header `Idempotency-Key` cho các POST không? (Swagger không show)
2. TTL của idempotency key là bao lâu?
3. Nếu client gửi cùng key + khác body → 409 hay 200?

### E.5. Response envelope stability
1. Tất cả response đều wrap trong `ApiResponse<T>`? Có endpoint nào trả thẳng T không?
2. `success=false` có kèm `data: null` hay bỏ field?
3. `code` trong envelope có mapping với `error.code` không? (Vd: `code: "AUTH_001"` thì `error.code: "AUTH_001"`?)

---

## F. Đề xuất priority để BE triển khai

BE không cần implement endpoint mới (đa số đã có), chỉ cần:

| Priority | Action | Effort |
|---|---|---|
| **P0 (trả lời trong 1-2 ngày)** | Trả lời các câu hỏi §E (refresh TTL, reservation TTL, error code, idempotency) | 1-2h review |
| **P0 (trả lời trong 1-2 ngày)** | Bổ sung response schema refs cho 4 cart endpoints (§D) | 30min edit OpenAPI |
| **P1 (trả lời trong 1 tuần)** | Confirm spec cho 8 endpoint §A (đặc biệt A.2, A.3, A.4 về Flash Sale reservation) | 2-3h review |
| **P1 (trả lời trong 1 tuần)** | Confirm VoucherCalculationResponse refactor (§B.2) | 1h review |
| **P2 (optional)** | Bổ sung form field name cho avatar upload (A.8) + query params cho items/active (A.5) | 15min edit OpenAPI |

---

## G. Out of scope (FE không yêu cầu)

- ❌ Admin modules (`/api/v1/admin/**` — 11 endpoints) — chưa có Admin Console UI
- ❌ Seller modules (`/api/v1/seller/**` — 8 endpoints) — chưa có Seller Center UI
- ❌ Images module (`/api/v1/images/**` — 6 endpoints) — Cloudinary management
- ❌ Public store detail (`/api/v1/stores/{id}`) — chưa có `/shop/[slug]` UI
- ❌ Payment endpoints (`/orders/{id}/payment/*`) — đã có trong sprint khác
- ❌ Reviews (`/products/{productId}/reviews`) — UI đang trong sprint khác
- ❌ Cập nhật Nullable shape cho product-detail (đã có handoff `2026-10-14-be-product-detail-shape-contract.md` riêng)

---

## H. Test lại sau khi BE trả lời

Sau khi BE confirm:
1. FE sẽ implement function cho 8 endpoint §A.
2. FE sẽ fix 7 SHAPE_MISMATCH §B (sau khi confirm hướng).
3. FE viết unit test cho mỗi function mới (TDD theo rule `testing-required.mdc`).
4. PR sẽ có message: `feat(api): integrate 8 endpoints from swagger v2`.

---

## Liên hệ

- **FE owner**: agent (Cursor session `feat/api-audit-v2`)
- **FE branch**: `feat/api-audit-v2` (commit `0e5d533` — plan + report)
- **Swagger snapshot**: `scripts/swagger-v2.json` (90KB, 2026-10-15)
- **Plan & Report**:
  - `docs/superpowers/plans/2026-10-15-api-audit-v2.md`
  - `docs/superpowers/plans/2026-10-15-api-audit-v2-report.md`
- **Handoff cũ liên quan**: `docs/superpowers/handoffs/2026-10-14-be-product-detail-shape-contract.md` (về product-detail nullable shape — chưa có phản hồi)

> Vui lòng reply trong thread gốc (Slack/email) hoặc trực tiếp trong file này. FE sẽ đợi confirm trước khi implement.