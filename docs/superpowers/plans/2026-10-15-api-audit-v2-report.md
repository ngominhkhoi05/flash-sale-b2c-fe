# FE Audit v2 — Report (2026-10-15)

**Date**: 2026-10-15
**Branch**: `feat/api-audit-v2`
**Snapshot**: `scripts/swagger-v2.json` (90KB, 74 paths, 102 component schemas)
**Source**: http://180.93.137.28/v3/api-docs + http://180.93.137.28/swagger-ui/index.html#

## 1. Swagger Inventory (74 paths, grouped by tag)

| Tag | Count | Paths (examples) |
|---|---|---|
| **Authentication** | 4 | `/auth/login`, `/auth/logout`, `/auth/register`, `/auth/refresh-token` |
| **User Profile** | 4 | `/users/me`, `/users/me/avatar`, `/users/me/change-password` |
| **Address Book** | 3 | `/users/addresses`, `/users/addresses/{id}`, `/users/addresses/{id}/default` |
| **Cart** | 4 | `/cart` (GET, DELETE), `/cart/items` (POST), `/cart/items/{itemId}` (PUT, DELETE) |
| **Checkout/Orders Buyer** | 1 | `/orders/checkout` |
| **Orders Buyer** | 4 | `/orders` (GET), `/orders/{id}` (GET), `/orders/{id}/cancel` (PATCH), `/orders/{orderCode}/qr` (GET) |
| **Order Payment** | 3 | `/orders/{id}/payment` (GET), `/orders/{id}/payment/cod` (POST), `/orders/{id}/payment/zalopay` (POST) |
| **Public Flash Sale** | 5 | `/flash-sales/slots`, `/flash-sales/items/active`, `/flash-sales/reservations`, `/flash-sales/reservations/{id}`, `/flash-sales/reserve` |
| **Seller Flash Sale** | 1 | `/seller/flash-sales/items` |
| **Admin Flash Sale** | 4 | `/admin/flash-sales/slots`, `/admin/flash-sales/slots/{id}`, `/admin/flash-sales/slots/{id}/pre-warm`, `/admin/flash-sales/items/{id}/approve` |
| **Flash Sale Reservation** | (overlap với Public Flash Sale) | |
| **Vouchers Public** | 5 | `/vouchers/apply`, `/vouchers/mine`, `/vouchers/platform`, `/vouchers/store/{storeId}` |
| **Seller Vouchers** | 1 | `/seller/vouchers` |
| **Admin Vouchers** | 1 | `/admin/vouchers` |
| **Product - Public** | 5 | `/products`, `/products/{id}`, `/products/slug/{slug}`, `/products/recommended`, `/products/{productId}/reviews` |
| **Categories** | 3 | `/categories`, `/categories/{id}`, `/categories/slug/{slug}` |
| **Admin Categories** | 2 | `/admin/categories`, `/admin/categories/{id}` |
| **Stores** | 9 | `/stores`, `/stores/{id}`, `/stores/featured`, `/stores/me`, `/stores/me/logo`, `/stores/me/addresses` (+ 2 sub), `/stores/sidebar/summary` |
| **Admin Stores** | 1 | `/admin/stores/{id}/status` |
| **Banners** | 1 | `/banners/home` |
| **Admin - Banners** | 3 | `/admin/banners`, `/admin/banners/{id}`, `/admin/banners/{id}/status` |
| **Seller Product Mgmt** | 5 | `/products`, `/products/{id}`, `/products/{id}/status`, `/products/{id}/images`, `/products/{productId}/variants/{variantId}/images` |
| **Images** | 5 | `/images`, `/images/{id}`, `/images/upload`, `/images/{id}/primary`, `/images/{id}/order`, `/images/{id}/force` |

> **Note**: 74 paths / 102 schemas. Một số paths share schema (vd: tất cả responses dùng `ApiResponse<T>` envelope).

## 2. FE Inventory (per module)

| Module | Files | Status |
|---|---|---|
| **auth** | `api.ts` (203 dòng), `hooks.ts` (208 dòng), `types.ts`, `schemas.ts`, `mocks.ts`, `jwt.ts` | Đầy đủ cơ bản. THIẾU refresh-token, THIẾU updateProfile/changePassword |
| **cart** | `api.ts` (164 dòng), `types.ts` (111 dòng), `hooks.ts` (147 dòng) | Đầy đủ 5 endpoints. Types có thiếu `subtotal`, `totalShippingFee`, `totalAmount`, `productId`, `stockQuantity` |
| **checkout** | `api.ts` (431 dòng), `types.ts` (185 dòng), `hooks.ts`, `mocks.ts`, `index.ts` | Đầy đủ flow. **Voucher apply body SAI** (`orderAmount` thay vì `subtotalAmount`) |
| **orders** | `api.ts` (231 dòng), `types.ts`, `mocks.ts`, `hooks.ts`, `index.ts` | ✅ **Đã có** từ trước (Plan 14 sai khi flag thiếu) |
| **flash-sale** | `types.ts` (re-export từ homepage), `schemas.ts`, `hooks.ts`, `mocks.ts`, `selectors.ts` | KHÔNG có `api.ts` riêng — re-export từ homepage. THIẾU reservation API |
| **vouchers** | `api.ts` (33 dòng), `types.ts`, `hooks.ts`, `index.ts` | ✅ Có `getMyVouchers` và `saveVoucher`. Body `SaveVoucherRequest { code }` ✅ |
| **homepage** | `api.ts` (235 dòng), `hooks.ts`, `index.ts` | ✅ Đầy đủ + có fallback graceful cho 404 |
| **products** | `api.ts` (45 dòng), `types.ts`, `mock.ts`, `hooks.ts`, `index.ts` | Có `getRecommendedProducts`, `fetchProductDetailBySlug/Id`. **Path `/products/recommended` dùng khác homepage** |
| **search** | `api.ts`, `types.ts`, `schemas.ts`, `hooks.ts`, `mocks.ts`, `index.ts` | Mock-based |
| **user/profile** | ❌ KHÔNG CÓ directory | THIẾU hoàn toàn (UpdateProfileRequest, ChangePasswordRequest, Avatar) |
| **lib/api/client.ts** | `client.ts` (411 dòng) + `index.ts` + `client.test.ts` | Có `apiFetch`, retry 5xx, mock dispatcher. **THIẾU 401 refresh interceptor** |
| **stores/auth.store.ts** | 56 dòng | Có user/isHydrated. THIẾU refresh state, token expiry tracking |

## 3. Mismatch Matrix (so với Swagger v2)

### 3.1 OK (FE đã align)

| Backend Path | FE Function | File |
|---|---|---|
| POST `/auth/login` | `loginRequest` | `src/features/auth/api.ts:97-110` |
| POST `/auth/logout` | `logoutRequest` | `src/features/auth/api.ts:136-141` |
| POST `/auth/register` | `registerRequest` | `src/features/auth/api.ts:114-129` |
| GET `/users/me` | `fetchMe` | `src/features/auth/api.ts:131-133` |
| GET `/cart` | `getCart` | `src/features/cart/api.ts:71-77` |
| POST `/cart/items` | `addToCart` | `src/features/cart/api.ts:93-103` |
| PUT `/cart/items/{itemId}` | `updateCartItem` | `src/features/cart/api.ts:113-127` |
| DELETE `/cart/items/{itemId}` | `removeCartItem` | `src/features/cart/api.ts:142-153` |
| DELETE `/cart` | `clearCart` | `src/features/cart/api.ts:154-160` |
| GET `/orders` | `getOrders` | `src/features/orders/api.ts:125-142` |
| GET `/orders/{id}` | `getOrderById` | `src/features/orders/api.ts:148-159` |
| PATCH `/orders/{id}/cancel` | `cancelOrderById` | `src/features/orders/api.ts:175-184` |
| POST `/orders/checkout` | `submitOrder` | `src/features/checkout/api.ts:367-394` |
| GET `/users/addresses` | `getAddresses` | `src/features/checkout/api.ts:272-280` |
| GET `/vouchers/platform` | `getPlatformVouchers` | `src/features/checkout/api.ts:283-294` |
| GET `/vouchers/store/{storeId}` | `getShopVouchers` | `src/features/checkout/api.ts:298-308` |
| GET `/categories` | `fetchCategories` | `src/features/homepage/api.ts:69-71` |
| GET `/flash-sales/slots` | `fetchFlashSaleSlots` | `src/features/homepage/api.ts:103-105` |
| GET `/products/slug/{slug}` | `fetchProductDetailBySlug` | `src/features/products/api.ts:25-30` |
| GET `/products/{id}` | `fetchProductDetailById` | `src/features/products/api.ts:35-40` |
| GET `/vouchers/mine` | `getMyVouchers` | `src/features/vouchers/api.ts:14` |
| POST `/vouchers/mine` | `saveVoucher` | `src/features/vouchers/api.ts:21-24` |
| GET `/banners/home` | `fetchHomeBanners` (graceful 404) | `src/features/homepage/api.ts:48-56` |
| GET `/stores/featured` | `fetchFeaturedStores` (graceful 404) | `src/features/homepage/api.ts:142-153` |
| GET `/products/recommended` | `fetchRecommendedProducts` (graceful 404) | `src/features/homepage/api.ts:182-203` |

### 3.2 SHAPE_MISMATCH (FE có nhưng sai shape)

| Backend Path | FE | Vấn đề | Fix cần thiết |
|---|---|---|---|
| POST `/vouchers/apply` | `applyVoucher` (`src/features/checkout/api.ts:322-348`) | FE gửi `{ orderAmount, voucherCode, storeId? }`, BE cần `{ code, storeId?, subtotalAmount }` | Đổi `orderAmount` → `subtotalAmount`, đổi `voucherCode` → `code` |
| POST `/vouchers/apply` | `BackendVoucherCalculation` (`src/features/checkout/api.ts:94-99`) | FE đọc `{ voucher, discountAmount, applicable, reasonCode }`, BE trả `{ voucherId, code, discountAmount, finalAmount }` | Cần align — có thể BE đã refactor schema |
| (Response của apply) | `ApplyVoucherResponse` (`src/features/checkout/types.ts:124-133`) | FE expect `{ applied, voucher, grandTotal, totalDiscount, reasonCode }` | Adapt từ `voucherId/code/discountAmount/finalAmount` mới |
| GET `/cart` | `BackendCartResponse` (`src/features/cart/api.ts:42-51`) | FE thiếu `subtotal, totalShippingFee, totalAmount` | Thêm 3 fields |
| GET `/cart` items | `BackendCartItem` (`src/features/cart/api.ts:23-37`) | FE thiếu `productId, stockQuantity` | Thêm 2 fields |
| GET `/users/me` | `UserResponse` (`src/features/auth/api.ts:42-52`) | FE thiếu `roles` field | Thêm `roles: string[]` (hoặc vẫn lấy từ JWT) |
| POST `/auth/login` | `AuthResponse` (`src/features/auth/api.ts:54-63`) | FE thiếu `roles` field | Thêm `roles: string[]` |

### 3.3 MISSING (BE có, FE chưa có)

| Backend Path | Concern | Note |
|---|---|---|
| POST `/auth/refresh-token` | **HIGH** — auth-jwt refresh | Plan 14 flag đúng. Hiện store sessionStorage refreshToken nhưng không function call |
| POST `/flash-sales/reservations` | **HIGH** — core flash sale flow | Reservation endpoint (CreateReservationRequest) |
| GET `/flash-sales/reservations/{reservationId}` | **HIGH** | Get reservation detail |
| POST `/flash-sales/reserve` | **HIGH** | Bulk reserve (slot reservation) |
| GET `/flash-sales/items/active` | LOW | Active items (dùng cho homepage section) |
| PUT `/users/me` | MEDIUM | UpdateProfileRequest { fullName, phone } |
| PUT `/users/me/change-password` | MEDIUM | ChangePasswordRequest { oldPassword, newPassword } |
| PUT `/users/me/avatar` | LOW | Upload avatar |

### 3.4 NEW ENDPOINTS (chưa thấy trong plan 14)

| Backend Path | Tag | Concern |
|---|---|---|
| `/users/me/avatar` | User Profile | UI Account page |
| `/flash-sales/items/active` | Public Flash Sale | Homepage section |
| `/images/**` (5 endpoints) | Images | Cloudinary admin — Seller + Admin dùng chung |
| `/admin/banners/**` (3) | Admin - Banners | Admin CMS |
| `/admin/categories/**` (2) | Admin Categories | Admin CMS |
| `/admin/flash-sales/slots/{id}/pre-warm` | Admin Flash Sale | Admin pre-warm Redis |
| `/admin/flash-sales/items/{id}/approve` | Admin Flash Sale | Admin approve seller items |
| `/admin/stores/{id}/status` | Admin Stores | Admin ban/approve store |
| `/admin/vouchers` | Admin Vouchers | Admin manage platform vouchers |
| `/seller/flash-sales/items` | Seller Flash Sale | Seller submit item |
| `/seller/orders` + `/status` | Orders Seller | Seller manage orders |
| `/seller/products` CRUD (5) | Seller Product Mgmt | Seller product CRUD |
| `/seller/vouchers` | Seller Vouchers | Seller voucher CRUD |
| `/stores/{id}` | Stores | Public store detail page |
| `/stores/me` | Stores | Seller store profile |
| `/stores/me/addresses/**` (4) | Stores | Seller pickup addresses |
| `/stores/me/logo` | Stores | Seller upload logo |
| `/stores/sidebar/summary` | Stores | Seller sidebar data |
| `/orders/{id}/payment` | Order Payment | Payment status |
| `/orders/{id}/payment/cod` | Order Payment | COD confirmation |
| `/orders/{id}/payment/zalopay` | Order Payment | ZaloPay create |
| `/orders/{orderCode}/qr` | Order Payment | QR render |
| `/products/{productId}/reviews` | Product - Public | Product reviews POST/GET |

**Tất cả NEW endpoints đều OUT OF SCOPE** (chưa có UI page tương ứng).

## 4. Cross-cutting

### 4.1 Auth interceptor (vs 401 refresh) — THIẾU
- `src/lib/api/client.ts` lines 410-end có **mock dispatcher** (xử lý mock data cho flash-sale/admin endpoints), nhưng **KHÔNG có refresh interceptor** khi 401.
- Refresh token đã có (`getRefreshToken/setRefreshToken/clearRefreshToken`), nhưng **không ai gọi** khi access token hết hạn.
- ⇒ Plan 14 flag đúng → Cần thêm `refreshTokenRequest` + interceptor.

### 4.2 Mock dispatcher coverage — KHÔNG đầy đủ
- `client.ts:308-378` chỉ cover: `/time`, `/flash-sale/slots`, `/flash-sale/items`, `/flash-sale/orders`, `/admin/dashboard/kpi`, `/admin/flash-sale/campaigns`, `/admin/flash-sale/monitoring`.
- Các endpoint mới (cart, orders, vouchers mine, banners/home, etc.) **KHÔNG có mock** — sẽ 404 khi `NEXT_PUBLIC_USE_MOCKS=true`.
- ⇒ Cần bổ sung hoặc không (tùy priority).

### 4.3 Envelope handling — OK
- `apiFetch` tự extract `payload.data` khi có envelope (line 281-285). Tốt.
- → Voucher apply: `res.data` được dùng đúng (line 345).

### 4.4 buildUrl prefix logic — OK
- `buildUrl` tự thêm `/api/v1` prefix (line 169-172). Trừ khi path đã có `/api/` hoặc `/api/v`.
- Một số FE code dùng path không có prefix (vd `"/vouchers/mine"` trong `vouchers/api.ts:14`) → sẽ build thành `/api/v1/vouchers/mine` ✅.

## 5. Plan 14 flags verification (xác minh thực tế)

| Plan 14 flag | Thực tế | Plan 14 đúng? |
|---|---|---|
| POST `/auth/refresh-token` — THIẾU | ✅ Đúng — FE chưa có function | Đúng |
| POST `/cart/items` — THIẾU | ❌ **Plan 14 SAI** — `addToCart` đã có | **SAI** |
| PUT `/cart/items/{itemId}` — THIẾU | ❌ **Plan 14 SAI** — `updateCartItem` đã có | **SAI** |
| DELETE `/cart/items/{itemId}` — THIẾU | ❌ **Plan 14 SAI** — `removeCartItem` đã có | **SAI** |
| DELETE `/cart` — THIẾU | ❌ **Plan 14 SAI** — `clearCart` đã có | **SAI** |
| POST `/flash-sales/reservations` — THIẾU | ✅ Đúng — chưa có | Đúng |
| GET `/orders` — THIẾU | ❌ **Plan 14 SAI** — `getOrders` đã có | **SAI** |
| GET `/banners/home` — SAI | ❌ **Plan 14 SAI** — `fetchHomeBanners` đã có + graceful fallback | **SAI** |
| GET `/stores/featured` — SAI | ❌ **Plan 14 SAI** — `fetchFeaturedStores` đã có + graceful fallback | **SAI** |
| GET `/products/recommended` — SAI | ❌ **Plan 14 SAI** — `fetchRecommendedProducts` (homepage) đã có. **Nhưng products feature có function riêng với shape khác** | **Một phần SAI** |
| GET `/vouchers/mine` — SAI | ❌ **Plan 14 SAI** — `getMyVouchers` đã có | **SAI** |
| PUT `/users/me/change-password` — THIẾU | ✅ Đúng — chưa có | Đúng |
| "Cart FE types không khớp DTO" | Một phần đúng: thiếu `subtotal/totalShippingFee/totalAmount/productId/stockQuantity` | Một phần |

**Summary**: Plan 14 đã stale ~50% khi viết (nhiều endpoint đã được thêm trước khi audit chạy). BE đã cập nhật nhiều trong vài ngày qua.

## 6. Remaining real issues (cần fix)

### 6.1 Critical (block user-facing flow)
1. **ApplyVoucher body mismatch** — checkout không thể áp voucher (sai field name + thiếu required field).
2. **Flash Sale Reservation API thiếu** — core flash sale flow không hoạt động.
3. **Auth refresh thiếu** — user bị logout đột ngột khi token hết hạn (30 phút).

### 6.2 High (UX degradation)
4. **Cart types thiếu fields** — không tính được subtotal/shipping từ cart response (phải dùng storeGroups[]).
5. **Voucher calculation response shape** — nếu BE đã refactor, FE cần adapt.

### 6.3 Medium (extensibility)
6. **User profile API thiếu** — trang Account không update được thông tin.
8. **`/flash-sales/items/active`** — homepage có thể hiển thị section "đang active" nếu backend có.

### 6.4 Low (future)
9. **Mock dispatcher cũ** — chỉ cover flash-sale + admin campaign cũ. Cart/orders/vouchers không có mock.
10. **Path inconsistency** — một số file dùng `/api/v1/` prefix, một số không. BuildUrl xử lý OK nhưng nên nhất quán.

## 7. Recommended subplan A→H (giữ thứ tự plan 14)

| # | Subplan | Status v2 (delta) | Action |
|---|---|---|---|
| **A** | Cart + Checkout | OK chức năng, types thiếu fields, voucher apply body sai | Update `BackendCartResponse` + `BackendCartItem` types; Fix `applyVoucher` body + adapt response |
| **B** | Orders | ✅ Đã có đầy đủ — verify với Swagger shape | Verify types (`BackendOrderDetail` có `flashSaleItemId`/`expiresAt`), có thể thêm tests |
| **C** | Flash Sale Reservation | THIẾU `api.ts` riêng | Tạo `src/features/flash-sale/api.ts` với `createReservation`, `getReservation`, `getActiveItems`. Tạo reservation hooks |
| **D** | Auth refresh-token | THIẾU function + interceptor | Thêm `refreshTokenRequest` + 401 interceptor trong `client.ts` + `useRefreshToken` hook |
| **E** | Vouchers mine | ✅ Đã có — verify shape | Verify `getMyVouchers` response shape với `UserVoucherResponse` |
| **F** | Homepage banners/featured | ✅ Đã có + fallback | Test fallback path (BE có thật) — có thể bỏ try/catch nếu BE đã ổn định |
| **G** | Products recommended | ✅ Homepage có đầy đủ, products feature có nhưng shape khác | Quyết định: dùng homepage feature thôi, hoặc align 2 feature |
| **H** | User Profile update | THIẾU | Tạo `src/features/user/api.ts` với `updateProfile`, `changePassword`, `uploadAvatar` |

## 8. Out of scope (defer)

- **Admin modules** (`/api/v1/admin/**` — 11 paths): chưa có Admin Console UI page → defer
- **Seller modules** (`/api/v1/seller/**` — 8 paths): chưa có Seller Center UI page → defer
- **Images module** (`/api/v1/images/**` — 6 paths): Cloudinary management, defer
- **Public store detail** (`/api/v1/stores/{id}`): chưa có `/shop/[slug]` UI page → defer
- **Payment endpoints** (`/orders/{id}/payment/*`): đã có trong checkout phase khác → defer
- **Reviews** (`/products/{productId}/reviews`): UI review form đang trong phase khác → defer

## 9. Estimated effort

| Subplan | Files | LoC est | Effort |
|---|---|---|---|
| A — Cart+Checkout | 2 (cart/api.ts, checkout/api.ts) | ~50 | 1h |
| B — Orders verify | 1 (orders/api.test.ts) | ~30 | 30min |
| C — Flash Sale Reservation | 3 mới (flash-sale/api.ts, hooks, types) | ~150 | 2h |
| D — Auth refresh | 2 (auth/api.ts, auth.store.ts, client.ts) | ~80 | 1.5h |
| E — Vouchers mine | 1 test | ~20 | 15min |
| F — Homepage | 1 (api.test.ts extended) | ~30 | 30min |
| G — Products recommended | 1 (api.ts resolve) | ~10 | 5min |
| H — User Profile | 3 mới (user/api.ts, hooks, types) | ~120 | 1.5h |
| **Tests total** | ~10 | ~300 | 2h |
| **Total estimate** | | **~790 LoC + 2h tests** | **~9h** |

## 10. Test strategy

| Layer | Pattern | File location |
|---|---|---|
| API function | `vi.mock('@/lib/api/client')` + assert call args | `*.test.ts` cạnh file |
| Hook | `renderHook` + QueryClient + assert mutation flow | `*.test.ts` cạnh file |
| Schema | Valid + invalid cases | `schemas.test.ts` |
| Client interceptor | Mock fetch, assert refresh call when 401 | `client.test.ts` |

Coverage target:
- `src/lib/api/client.ts`: ≥ 80%
- `src/features/*/api.ts`: ≥ 80%
- `src/features/*/hooks.ts`: ≥ 70%
- `src/stores/auth.store.ts`: ≥ 80%

## 11. Notes

- Backend đã cập nhật Swagger giữa 2026-10-13 và 2026-10-15 — nhiều endpoint Plan 14 flag thiếu đã có.
- `NextStep` destructure: Sau khi subplan A→H xong, refresh Swagger snapshot `scripts/swagger-v2.json` để confirm không còn mismatch.
- Nếu user yêu cầu cover thêm (vd: thêm mock cho cart/orders), thì cần update `client.ts` dispatcher.