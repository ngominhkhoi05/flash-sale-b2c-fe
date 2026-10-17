# Plan — API Audit v2 Integration (gắn đúng Swagger)

> **Ngày**: 2026-10-17
> **Worktree**: `D:\code\ky_I_nam_4\Project\flash-sale-b2c-fe-wt-api-audit` (branch `feat/api-audit-v2-integration`)
> **Base**: `origin/dev` @ `c37755d`
> **Nguồn Swagger**: `http://180.93.137.28/v3/api-docs` (snapshot ở `scripts/swagger-v2.json` — 95KB, 78 paths, 119 schemas)
> **Handoff liên quan**: `docs/superpowers/handoffs/2026-10-15-fe-audit-v2-missing-apis.md`

---

## 1. Scope

FE re-audit toàn bộ Swagger sau BE cập nhật. Tìm và sửa:
1. **Endpoint chưa có function ở FE** (BE đã có sẵn).
2. **SHAPE_MISMATCH** giữa FE code và Swagger spec.
3. **Out-of-scope**: KHÔNG sửa Admin/Seller/Images/WS modules (xem §G của handoff 2026-10-15).

## 2. Tham khảo

- `docs/CLAUDE.md` — UI rules (Source of Truth #1)
- `.cursor/rules/flash-sale-b2c-api.mdc` — API contract
- `.cursor/rules/api-data.mdc` — data layer
- `.cursor/rules/flash-sale-b2c-api-reference.mdc` — index chi tiết
- `.cursor/rules/features-migration.mdc` — feature module template
- `.cursor/rules/testing-required.mdc` — TDD gate
- `docs/superpowers/handoffs/2026-10-15-fe-audit-v2-missing-apis.md` — handoff BE

## 3. Phát hiện hiện tại (audit 2026-10-17)

### 3.1. Endpoint ĐÃ có function ở FE (9 cái, không cần sửa)

| Endpoint | File |
|---|---|
| `POST /api/v1/auth/login` | `src/features/auth/api.ts` |
| `POST /api/v1/auth/register` | `src/features/auth/api.ts` |
| `POST /api/v1/auth/logout` | `src/features/auth/api.ts` |
| `POST /api/v1/auth/verify-email` | `src/features/auth/api.ts` |
| `POST /api/v1/auth/resend-otp` | `src/features/auth/api.ts` |
| `GET  /api/v1/users/me` | `src/features/auth/api.ts` |
| `PUT  /api/v1/users/me` | `src/features/user/api.ts` (đã có updateProfile) |
| `PUT  /api/v1/users/me/change-password` | `src/features/user/api.ts` (đã có changePassword) |
| `POST /api/v1/flash-sales/reserve` | `src/features/flash-sale/api.ts` |
| `GET  /api/v1/cart` | `src/features/checkout/api.ts` |
| `POST /api/v1/orders/checkout` | `src/features/checkout/api.ts` |
| `POST /api/v1/vouchers/apply` | `src/features/checkout/api.ts` |
| `GET  /api/v1/vouchers/platform` | `src/features/checkout/api.ts` |
| `GET  /api/v1/vouchers/store/{id}` | `src/features/checkout/api.ts` |
| `GET  /api/v1/users/addresses` | `src/features/checkout/api.ts` |
| `POST /api/v1/auth/google` | `src/features/auth/google-api.ts` |

### 3.2. Endpoint CHƯA có function ở FE (2 cái — cần implement)

| # | Endpoint | Method | File sẽ thêm | Priority | Note |
|---|---|---|---|---|---|
| 1 | `/api/v1/flash-sales/reservations` | POST | `src/features/flash-sale/api.ts` | HIGH | Alias tổng thể (BE khuyến nghị dùng cho flow mới) — cạnh tranh với `/reserve` đã có |
| 2 | `/api/v1/flash-sales/items/active` | GET | `src/features/flash-sale/api.ts` | LOW | Homepage section "Đang diễn ra" (BE sẽ trả danh sách phẳng ACTIVE items) |

**Đã verify** các endpoint sau KHÔNG cần implement (đã có function + test):
- `DELETE /api/v1/flash-sales/reservations/{reservationId}` → `cancelReservation` ở `src/features/flash-sale/api.ts:113` + test ở `api.test.ts:105` ✅
- `PUT /api/v1/users/me` → `updateProfile` ở `src/features/user/api.ts:89` ✅
- `PUT /api/v1/users/me/change-password` → `changePassword` ở `src/features/user/api.ts:113` ✅

**Phát hiện phụ** (KHÔNG trong scope, ghi nhận):
- Handoff `2026-10-15-fe-audit-v2-missing-apis.md` liệt kê 8 endpoint còn thiếu (A.1-A.8), nhưng thực tế repo hiện tại đã có 3/8 (A.6, A.7, A.4). Có thể từ 2026-10-15 → 2026-10-17 đã được implement trong sprint khác (xem git log: `feat(orders)`, `feat(auth) Google login`).

### 3.3. SHAPE_MISMATCH cần fix (5 cái)

| # | File | Vấn đề | Fix |
|---|---|---|---|
| M.1 | `src/features/checkout/api.ts` (B.1) | `applyVoucher` gửi `{ orderAmount, voucherCode }` | Đổi thành `{ code, subtotalAmount }` |
| M.2 | `src/features/checkout/api.ts` (B.2) | Đọc `data.voucher + data.applicable + data.reasonCode` | Đổi sang `data.voucherId + data.code + data.discountAmount + data.finalAmount` |
| M.3 | `src/features/checkout/api.ts` (B.3) | `BackendCartResponse` thiếu `totalAmount`, `grandTotal` | Thêm 2 field |
| M.4 | `src/features/checkout/api.ts` (B.4) | `BackendCartItem` thiếu `stockQuantity` | Thêm field |
| M.5 | `src/features/auth/api.ts` (B.5, B.6) | `UserResponse` + `AuthResponse` thiếu `roles: string[]` | Thêm `roles?: string[]` |

### 3.4. OpenAPI thiếu sót (§D của handoff)

- 4 endpoint cart (`POST /cart/items`, `PUT/DELETE /cart/items/{id}`, `DELETE /cart`) chưa có response schema ref. **FE chưa touch các endpoint này** (chưa implement) → không cần fix FE phần này. Ghi vào handoff cho BE.

### 3.5. SHAPE_MISMATCH chi tiết (đã verify trong code)

- **M.1** — `src/features/checkout/api.ts:323-330` (`applyVoucher`): gửi `orderAmount, voucherCode` → cần `code, subtotalAmount` (required).
- **M.2** — `src/features/checkout/api.ts:335-355`: đọc `data.voucher + data.applicable + data.reasonCode` → cần `voucherId, code, discountAmount, finalAmount`. Hiện tại còn đang `unwrap` 2 lần (`res.data`).
- **M.3** — `src/features/checkout/api.ts:56-66` (`BackendCartResponse`): thiếu `totalAmount` + `grandTotal` so với swagger. Hiện có 6 field: `id, userId, storeGroups, subtotal, totalShippingFee, totalItems` (BE trả 8: thêm `totalAmount, grandTotal`). **Lưu ý**: file `src/features/cart/api.ts:46-53` đã có sẵn `grandTotal` 5-field version → 2 file dùng 2 shape khác nhau cần sync.
- **M.4** — `src/features/checkout/api.ts:38-49` (`BackendCartItem`): thiếu `stockQuantity` (BE trả 13 fields, hiện có 8).
- **M.5** — `src/features/auth/api.ts:42-66` (`UserResponse` + `AuthResponse`): thiếu `roles?: string[]`. `user/api.ts:35` đã có, cần sync sang auth.

### 3.6. Phụ thuộc giữa các subplan

| Subplan | Phụ thuộc |
|---|---|
| #1 (Flash Sale) | Độc lập |
| #2 (Avatar) | Độc lập (CÂN NHẮC bỏ) |
| #3 (Voucher shape) | Độc lập |
| #4 (Cart shape) | Độc lập — **CẢNH BÁO: nếu chạy song song với #3 vì cùng file `checkout/api.ts`**. Phải chạy tuần tự #3 → #4. |
| #5 (Auth roles) | Độc lập |
| #6 (Sync snapshot + handoff) | Làm trước tất cả |

## 4. Subplan (chia để dispatch song song)

Mỗi subplan độc lập, 1 subagent = 1 subplan. Tất cả đều dùng `general-purpose` (cần đọc + sửa code logic).

### Subplan 1 — Flash Sale Reservations + Active Items (HIGH + LOW)
- Thêm `createReservation` (POST `/reservations`) — alias mới.
- **Quyết định cần user**: giữ cả 2 function (`reserveFlashSale` + `createReservation`) hay chỉ giữ 1? (BE bảo `/reservations` là alias tổng thể nên có thể bỏ `/reserve`).
- Thêm `getActiveFlashSaleItems` (GET `/items/active`).
- **Test**: viết test cho mỗi function (URL, method, body, idempotency key).
- **File mới/sửa**: `src/features/flash-sale/api.ts`, `src/features/flash-sale/api.test.ts`, `src/features/flash-sale/types.ts`.

### Subplan 2 — User Avatar (LOW) — **CÂN NHẮC BỎ QUA**
- Thêm `uploadAvatar(file: File)` (POST `/users/me/avatar`, multipart/form-data).
- Helper `validateAvatarFile` (max 5MB, jpeg/png/webp).
- **Cảnh báo**: BE chưa confirm form field name (`file` hay `avatar`?) — handoff §A.8 nêu rõ. Có thể bị 400 khi tích hợp. **Cân nhắc đợi BE confirm trước khi implement**.

### Subplan 3 — Voucher Apply Shape (B.1 + B.2)
- Sửa `applyVoucher` request body (gửi `code` + `subtotalAmount` thay vì `orderAmount` + `voucherCode`).
- Sửa `applyVoucher` response parser (đọc `voucherId` + `code` + `discountAmount` + `finalAmount`).
- Cập nhật type `ApplyVoucherResponse` (loại bỏ `voucher` object, thêm `voucherId`, `finalAmount`).
- **Test**: viết test cho cả request shape + response parsing.
- **File mới/sửa**: `src/features/checkout/api.ts`, `src/features/checkout/api.test.ts`, `src/features/checkout/types.ts`.

### Subplan 4 — Cart Response Shape (B.3 + B.4)
- Thêm field `totalAmount`, `grandTotal` vào `BackendCartResponse`.
- Thêm field `stockQuantity` vào `BackendCartItem`.
- Cập nhật adapter `adaptCartToCheckout` dùng `grandTotal` từ BE.
- **Test**: viết test cho adapter.
- **File mới/sửa**: `src/features/checkout/api.ts`, `src/features/checkout/api.test.ts`.

### Subplan 5 — Auth Response Roles (B.5 + B.6)
- Thêm `roles?: string[]` vào `UserResponse` (đã có trong user/api.ts) — sync sang `auth/api.ts`.
- Thêm `roles?: string[]` vào `AuthResponse`.
- Verify `auth.store.ts` có đọc roles từ JWT hay từ response (xem `auth-jwt.mdc`).
- **Test**: viết test cho type + adapter.
- **File mới/sửa**: `src/features/auth/api.ts`, `src/features/auth/api.test.ts`.

### Subplan 6 — Sync Swagger snapshot + Update Handoff
- Copy `scripts/swagger-v2.json` đúng vào worktree.
- Update `docs/superpowers/handoffs/2026-10-15-fe-audit-v2-missing-apis.md`:
  - Đánh dấu đã implement: A.6, A.7 (user PUT me + change-password).
  - Ghi nhận M.1-M.5 đã fix ở FE.
  - Xác nhận B.2 cần BE confirm (gửi kèm message Slack/email thật ngoài scope chat này).
- **Test**: KHÔNG cần (chỉ copy file + sửa markdown).
- **File mới/sửa**: `scripts/swagger-v2.json`, `docs/superpowers/handoffs/2026-10-15-fe-audit-v2-missing-apis.md`.

## 5. Thứ tự ưu tiên & dispatch (đã user duyệt 2026-10-17)

| Thứ tự | Subplan | Lý do |
|---|---|---|
| 1 | #6 (sync swagger snapshot + handoff update) | Làm trước để có source of truth |
| 2 | #3 (Voucher shape) | Độc lập, dùng `applyVoucher` shape mới |
| 3 | #4 (Cart shape) | Cùng file `checkout/api.ts` với #3 → chạy sau |
| 4 | #5 (Auth roles type) | Sync `roles?` field vào `auth/api.ts` (giữ logic JWT parse) |
| 5 | #1 (Flash Sale Reservations + Active) | Sau khi spec đã sync |
| — | ~~#2 (Avatar)~~ | **BỎ QUA** theo user quyết (BE chưa confirm form field name) |

**Dispatch**:
- Tôi sẽ chạy tuần tự 5 subplan trên (5 commit riêng theo concern).
- Mỗi subplan = 1 commit.
- Subplan #2 (avatar) bị drop khỏi scope.

## 6. Test strategy

- **Unit test (Vitest)**: mỗi function mới/sửa PHẢI có test đỏ trước → fix → xanh (TDD per `testing-required.mdc`).
- **Tích hợp**: KHÔNG cần (scope đồ án, manual test đủ theo `no-overengineering.mdc`).
- **Mock fetch**: dùng `vi.spyOn(global, 'fetch')` hoặc MSW.
- **Coverage**: mục tiêu ≥ 80% cho file mới/sửa.

## 7. Risks

| Risk | Mitigation |
|---|---|
| BE thay đổi contract sau khi FE implement | Handoff #6 cập nhật + ping BE confirm §B.2 trước khi merge |
| Subagent conflict khi sửa cùng `src/features/checkout/api.ts` (subplan #3 + #4) | Dispatch tuần tự #3 → #4 (hoặc #4 trước) |
| Worktree có 7 chat song song (repo chính) | Đã tách worktree riêng (`wt-api-audit`) → an toàn |
| File test cũ bị fail do shape change | Chạy `npm run test` sau mỗi subplan; sửa test cũ nếu cần |

## 8. Out of scope

- ❌ Admin/Seller modules
- ❌ Images module (Cloudinary)
- ❌ WS destinations (đã có trong sprint khác)
- ❌ Reviews (đã có sprint khác)
- ❌ Hỏi BE confirm §B.2 (chỉ ghi nhận vào handoff, user tự ping)
- ❌ Refactor code ngoài scope (vd: dọn `flash-sale/api.ts` style)

## 9. Definition of Done

- [ ] 6 subplan đã chạy + commit riêng theo concern
- [ ] `npm run test` PASS
- [ ] `npm run lint` PASS
- [ ] `npm run tsc --noEmit` PASS
- [ ] `npm run build` PASS
- [ ] Handoff `2026-10-15-fe-audit-v2-missing-apis.md` đã update
- [ ] Báo cáo Bước 6 đầy đủ (Changes / Implementation / Tests / Notes)
- [ ] KHÔNG push (chờ user duyệt)
