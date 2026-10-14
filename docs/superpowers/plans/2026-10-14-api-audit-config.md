# Plan — Audit & Config Toàn Bộ API

**Date**: 2026-10-14
**Branch**: `feat/api-audit`
**Owner**: FE agent
**Stack**: Next 16.3.8 · React 19.2 · TS 5.x · Tailwind 4.x · TanStack Query

## 1. Scope

Audit **9 feature modules** của FE đối chiếu với backend Swagger tại `http://180.93.137.28/swagger-ui/index.html#`, từ đó:
- Báo cáo mismatches (sai endpoint, thiếu field, thiếu endpoint, path sai)
- Fix từng module theo ưu tiên (module-by-module)

**User chốt**: Audit từng module, sửa 1-1 theo ưu tiên.

## 2. Tham khảo

- `docs/api-document.md` — tài liệu API tổng hợp backend (OpenAPI)
- `docs/api-reference.md` — chi tiết từng module
- `src/features/*/api.ts` — code FE hiện tại
- `src/lib/api/client.ts` — `apiFetch` core (buildUrl tự thêm `/api/v1` prefix)

## 3. Inventory — Tình trạng hiện tại từng module

### 3.1 Auth (`src/features/auth/api.ts`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `POST /api/v1/auth/login` | ✅ | ✅ | OK — nhưng body dùng `usernameOrEmail` |
| `POST /api/v1/auth/register` | ✅ | ✅ | OK |
| `POST /api/v1/auth/logout` | ✅ | ✅ | OK |
| `GET /api/v1/users/me` | ✅ | ✅ | OK |
| `POST /api/v1/auth/verify-email` | ✅ | ❌ Backend chưa có | Mock |
| `POST /api/v1/auth/resend-otp` | ✅ | ❌ Backend chưa có | Mock |
| `POST /api/v1/auth/refresh-token` | ❌ | ✅ | **THIẾU** — auth-jwt.ts cần |

**Issues:**
- `POST /api/v1/auth/login` FE body dùng `usernameOrEmail` ✅ đúng với spec
- Backend không có endpoint `verify-email` → mock là tạm chấp nhận
- `refresh-token` — FE store gọi `sessionStorage` refreshToken nhưng **KHÔNG có function gọi `/auth/refresh-token`**

### 3.2 Cart (`src/features/cart/api.ts`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `GET /api/v1/cart` | ✅ | ✅ | OK |
| `GET /api/v1/cart/summary` | ❌ Backend không có | ❌ | **SAI** — backend trả full cart |
| `POST /api/v1/cart/items` | ❌ | ✅ | **THIẾU** |
| `PUT /api/v1/cart/items/{itemId}` | ❌ | ✅ | **THIẾU** |
| `DELETE /api/v1/cart/items/{itemId}` | ❌ | ✅ | **THIẾU** |
| `DELETE /api/v1/cart` | ❌ | ✅ | **THIẾU** |

**Issues:**
- `getCartSummary()` gọi `/cart/summary` — backend KHÔNG có endpoint này. Backend trả `/api/v1/cart` đã có `totalItems` và `grandTotal` → cần tính summary từ cart response hoặc adapter.
- 4 endpoint CRUD còn thiếu hoàn toàn.
- FE types (`CartItem`, `CartSummary`) không khớp backend DTO (thiếu `variantId`, `sku`, `stockQuantity`, `items[]` group by store).

### 3.3 Checkout (`src/features/checkout/api.ts`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `GET /api/v1/cart` | ✅ | ✅ | OK |
| `GET /api/v1/users/addresses` | ✅ | ✅ | OK — adapter tốt |
| `POST /api/v1/orders/checkout` | ✅ | ✅ | OK |
| `POST /api/v1/vouchers/apply` | ✅ | ✅ | OK |
| `GET /api/v1/vouchers/platform` | ✅ | ✅ | OK |
| `GET /api/v1/vouchers/store/{storeId}` | ✅ | ✅ | OK |
| `GET /api/v1/orders/{orderCode}/qr` | ⚠️ FE có, endpoint mới | Backend chưa xác nhận | Cần verify |

**Issues:**
- Backend `AddressResponse` field `recipientName` → FE adapter dùng `contactName`? Cần check
- Backend `POST /api/v1/vouchers/apply` body dùng `subtotalAmount` nhưng FE gửi `orderAmount` → mismatch
- Checkout adapter có function `adaptCartToCheckout` nhưng backend cart trả `storeGroups[]` — FE checkout types cần align

### 3.4 Homepage (`src/features/homepage/api.ts`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `GET /api/v1/banners/home` | ✅ | ❌ Backend không có | **SAI** |
| `GET /api/v1/categories` | ✅ | ✅ | OK |
| `GET /api/v1/flash-sales/slots` | ✅ | ✅ | OK |
| `GET /api/v1/vouchers/platform` | ✅ | ✅ | OK |
| `GET /api/v1/stores/featured` | ✅ | ❌ Backend không có | **SAI** |
| `GET /api/v1/products/recommended` | ✅ | ❌ Backend không có | **CẦN VERIFY** |

**Issues:**
- `/banners/home` — backend không có. FE tự mock hoặc cần tìm endpoint tương đương
- `/stores/featured` — backend không có. FE có thể dùng `/stores` filter `featured=true` hoặc mock
- `/products/recommended` — backend không có trong spec. FE gọi → cần verify với Swagger thật

### 3.5 Products (`src/features/products/api.ts`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `GET /api/v1/products/recommended` | ✅ | ❌ Backend không có | **SAI** — backend có `/products` (search/filter) |

**Issues:**
- `getRecommendedProducts` gọi `/products/recommended` nhưng backend không có. Backend có `/products` (GET với filter params). Cần xóa function hoặc thay bằng `/products` với params phù hợp.

### 3.6 Search (`src/features/search/api.ts`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| Search (local mock) | ✅ | ❌ Backend chưa có `/products/search` | **Mock** |

**Issues:**
- TODO comment chỉ `/products/search` — cần verify Swagger thật
- Nếu backend có `/products` (GET with filters) → cần thay mock bằng real call

### 3.7 Flash Sale (`src/features/flash-sale/`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `GET /api/v1/flash-sales/slots` | ✅ (re-export từ homepage) | ✅ | OK |
| `POST /api/v1/flash-sales/reservations` | ❌ | ✅ | **THIẾU hoàn toàn** |
| WS subscriptions | ⚠️ hooks có `useFlashSaleWs` | ✅ | Cần verify |

**Issues:**
- Không có API function cho reservation — đây là core Flash Sale flow (đặt hàng giữ chỗ)
- `useFlashSaleSlots` chỉ re-export từ homepage, không có `useFlashSaleReservation`

### 3.8 Vouchers (`src/features/vouchers/api.ts`)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `GET /api/v1/vouchers/mine` | ✅ | ❌ Backend không có | **SAI** |
| `POST /api/v1/vouchers/mine` | ✅ | ❌ Backend không có | **SAI** |

**Issues:**
- Backend không có `/vouchers/mine` — FE có thể dùng `POST /api/v1/vouchers/apply` để check + save, hoặc backend cần implement

### 3.9 Orders (không có file riêng)

| Endpoint | FE code | Backend spec | Status |
|---|---|---|---|
| `GET /api/v1/orders` | ❌ | ✅ | **THIẾU** |
| `GET /api/v1/orders/{id}` | ❌ | ✅ | **THIẾU** |
| `PATCH /api/v1/orders/{id}/cancel` | ❌ | ✅ | **THIẾU** |
| `GET /api/v1/orders/{orderCode}/qr` | ✅ (trong checkout) | ❌ Backend chưa xác nhận | Cần verify |

**Issues:**
- Hoàn toàn thiếu orders API layer — checkout có `/orders/checkout` nhưng trang Orders (danh sách, chi tiết) không có

### 3.10 Missing modules hoàn toàn

| Module | Backend endpoints | FE status |
|---|---|---|
| **Store** | 10 endpoints (public + seller) | ❌ Không có |
| **Seller Product** | 6 endpoints | ❌ Không có |
| **Seller Flash Sale** | 1 endpoint | ❌ Không có |
| **Seller Order** | 2 endpoints | ❌ Không có |
| **Admin** | ~18 endpoints | ❌ Không có |
| **User Profile** | 3 endpoints (me, update, change-password) | ⚠️ Chỉ có `fetchMe` |

## 4. Các vấn đề cross-cutting

### 4.1 Path prefix — `buildUrl` tự thêm `/api/v1`
`src/lib/api/client.ts` `buildUrl()` tự thêm `/api/v1` prefix cho tất cả path KHÔNG bắt đầu bằng `/api/`. 
→ Tất cả FE API functions dùng path **KHÔNG** có `/api/v1` prefix (đúng convention).

### 4.2 Backend response envelope — `apiFetch` đã extract `data`
`apiFetch` đã tự extract `payload.data` nếu có envelope. 
→ Tuy nhiên một số endpoint trả `data[]` array trực tiếp, một số trả `{ data: T[] }`.
→ Checkout adapter xử lý cả 2 pattern (Array.isArray check) — tốt.

### 4.3 Cart vs Checkout — Backend không tách
Backend: Cart = Checkout snapshot. FE: có `features/cart` và `features/checkout` riêng.
→ Checkout dùng `/api/v1/cart` làm data source → đúng.

### 4.4 User Profile update — missing
Backend: `PUT /api/v1/users/me` (update profile), `PUT /api/v1/users/me/change-password`.
FE: Chỉ có `fetchMe()`. Trang "Tài khoản" cần update.

### 4.5 Address field mismatch
Backend Address field `contactName`, FE adapter dùng `recipientName`. 
Backend field `detailAddress`, FE dùng `street`. Cần verify.

## 5. Subplan — Fix theo thứ tự ưu tiên

User chọn "module-by-module". Fix từng module theo priority:

### Subplan A — Cart + Checkout (CRITICAL)
- Fix `getCartSummary()`: adapter tính từ cart response thay vì `/cart/summary`
- Thêm 4 endpoint CRUD cart: `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart`
- Update cart types khớp backend DTO (có `variantId`, `sku`, `stockQuantity`, `storeGroups[]`)
- Fix checkout address adapter field names
- Fix voucher apply body: `orderAmount` → `subtotalAmount`

### Subplan B — Orders (HIGH)
- Tạo `src/features/orders/api.ts`
- Implement: `getOrders`, `getOrderById`, `cancelOrder`
- Tạo `src/features/orders/types.ts`
- Tạo `src/features/orders/hooks.ts`
- Update `src/features/orders/index.ts`

### Subplan C — Flash Sale Reservation (HIGH)
- Tạo `src/features/flash-sale/api.ts`
- Implement: `createReservation(flashSaleItemId, addressId, quantity)`
- Tạo reservation types + hooks
- Update WS subscription logic

### Subplan D — Auth refresh-token (MEDIUM)
- Thêm `refreshTokenRequest()` vào `src/features/auth/api.ts`
- Tích hợp vào `src/features/auth/hooks.ts`
- Update `src/stores/auth.store.ts` để gọi refresh khi 401

### Subplan E — Vouchers mine (MEDIUM)
- Verify backend có `/vouchers/mine` hay không (Swagger thật)
- Nếu không có: dùng `POST /vouchers/apply` để check voucher + mock list
- Update FE vouchers feature

### Subplan F — Homepage banners/featured (LOW)
- Verify Swagger thật cho `/banners/home`, `/stores/featured`
- Nếu backend chưa có: keep mock + ghi TODO comment

### Subplan G — Products recommended (LOW)
- Verify Swagger thật
- Nếu không có: dùng `/products` với filter phù hợp

### Subplan H — User Profile update (LOW)
- Thêm `updateProfile()`, `changePassword()` vào auth/api.ts hoặc tạo user/api.ts

## 6. Test Strategy

| Module | Coverage |
|---|---|
| Cart CRUD | Unit test từng function với mock `apiFetch` |
| Orders | Unit test với mock `apiFetch` |
| Flash Sale Reservation | Unit test với mock `apiFetch` |
| Auth refresh | Unit test + integration với store |
| Checkout adapter | Unit test adapter function |
| Address adapter | Unit test field mapping |

## 7. Out of scope (Seller/Admin modules)

Seller Product, Seller Order, Admin — hiện tại chưa có UI page, không cần implement API layer.
Chỉ implement khi có UI page tương ứng.

## 8. Deliverables

1. **Report MD** — `docs/superpowers/plans/2026-10-14-api-audit-report.md`
   - Bảng mismatch đầy đủ từng module
   - Link tới Swagger: `http://180.93.137.28/swagger-ui/index.html#`
   - Recommendation cho từng issue

2. **Code fixes** — commit theo từng subplan

## 9. Notes

- Backend Swagger UI: `http://180.93.137.28/swagger-ui/index.html#`
- Backend OpenAPI JSON: `http://180.93.137.28/v3/api-docs`
- Base URL: `http://180.93.137.28` (từ `.env.local`)
- FE convention: path KHÔNG có `/api/v1` prefix (buildUrl tự thêm)
- Cross-cutting: `apiFetch` extract `data` envelope tự động
