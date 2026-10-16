# Plan: Tích hợp ZaloPay Payment cho Storefront FE

**Ngày**: 2026-10-16
**Branch**: `feat/zalopay-payment-integration` (mới tạo từ `origin/dev`)
**Tài liệu nguồn**: `docs/handoffs/fe-zalopay-integration-guide.md` (BE soạn 2026-10-15)
**Maintainer**: BE team `flash-sale-b2c-UTC2`
**Quyết định user** (Bước 0):
- ✅ Scope: **full_integration** (api + hooks + WS hook + page QR + countdown + manual sync)
- ✅ URL page: **tiếng Anh** `/orders/[id]` (theo hướng dẫn BE)
- ✅ File handoff: giữ tên hiện tại (không rename)

---

## 1. Scope

### 1.1 Mục tiêu

Tích hợp đầy đủ flow thanh toán ZaloPay ở FE:

1. **API Layer** (`src/features/checkout/payment.api.ts`): 3 endpoint cho ZaloPay
2. **Hooks** (`src/features/checkout/usePaymentStatusWs.ts`, `useOrderPayment`): realtime WS + polling fallback
3. **UI Page** (`src/app/orders/[id]/page.tsx`): trang chi tiết order + QR ZaloPay + countdown
4. **Component** (`PaymentZaloPayPanel`, `OrderDetailHeader`, `OrderSummarySidebar`): tái sử dụng
5. **i18n** (`messages/vi.json`, `messages/en.json`): namespace `checkout.payment.*`, `orders.*`
6. **Mocks** (`mocks.ts`): bổ sung mock `PaymentResponse`

### 1.2 Endpoint (theo hướng dẫn BE)

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/orders/{orderId}/payment/zalopay` | Tạo yêu cầu thanh toán ZaloPay |
| `GET` | `/api/v1/orders/{orderId}/payment` | Lấy trạng thái thanh toán (luôn 200) |
| `POST` | `/api/v1/orders/{orderId}/payment/zalopay/query` | Query fallback sync từ ZaloPay gateway |

### 1.3 WebSocket

| Queue | Event type | Subscribe khi |
|---|---|---|
| `/user/queue/orders/{orderCode}/payment-status` | `PAYMENT_STATUS_CHANGED` | User vào trang order detail |

> **Lưu ý**: docs hướng dẫn dùng `orderCode` trong URL STOMP, nhưng API lại dùng `orderId` (number). Tôi sẽ hỗ trợ **cả 2 cách** trong WS hook: derive `orderCode` từ `orderId` qua cache (nếu có) hoặc cho phép subscribe trực tiếp bằng `orderId`/`orderCode` tuỳ BE.

---

## 2. Tham khảo (rules + docs)

| File | Điểm chính |
|---|---|
| `.cursor/rules/api-data.mdc` | apiFetch wrapper, ApiError, query key factory, idempotency-key |
| `.cursor/rules/feature-*` | TanStack Query pattern, WS subscribe pattern |
| `.cursor/rules/websocket-realtime.mdc` | STOMP subscribe `/user/queue/flash-sale/orders/{orderCode}/payment-status` |
| `.cursor/rules/flash-sale-payment.mdc` | QR Code render, polling 3s, Idempotency-Key |
| `.cursor/rules/component-pattern.mdc` | `next/image` với `unoptimized` cho data URL, cva, forwardRef |
| `.cursor/rules/design-system.mdc` | Token màu (`primary`, `tertiary` cho Flash Sale, `success`/`danger`/`warning`) |
| `.cursor/rules/i18n.mdc` + `docs/i18n-convention.md` | Namespace `checkout.payment.*`, key phải có cả `vi.json` + `en.json` |
| `docs/CLAUDE.md` (Source of Truth #1) | URL tiếng Anh `https://vibe-mart-utc2.canluaz.io.vn/`, label tiếng Việt, mỗi màn 1 nút primary, format `1.290.000₫` |
| `docs/handoffs/fe-zalopay-integration-guide.md` | BE soạn, định nghĩa API + WS + UI |

---

## 3. Subplan

> **Quy tắc**: Mỗi subplan = 1 concern độc lập. Có thể chạy **tuần tự** (vì phụ thuộc nhau).

### Subplan 1: Types + API + Hooks (Layer thấp)

| # | Công việc | File |
|---|---|---|
| 1.1 | Thêm types `PaymentResponse`, `PaymentMethod` (đã có), `PaymentStatus`, `PaymentStatusEvent` | `src/features/checkout/payment.types.ts` (mới) — hoặc extend `types.ts` |
| 1.2 | API: 3 endpoint + unwrap envelope + throw `ApiError` | `src/features/checkout/payment.api.ts` (mới) |
| 1.3 | TanStack Query hooks: `useCreateZaloPayPayment`, `useOrderPayment`, `useQueryZaloPayPayment` | `src/features/checkout/usePayment.ts` (mới) |
| 1.4 | Mock `PaymentResponse` cho `NEXT_PUBLIC_USE_MOCK=true` | extend `src/features/checkout/mocks.ts` |
| 1.5 | WS hook `usePaymentStatusWs` (subscribe `/user/queue/orders/{orderCode}/payment-status`) | extend `usePayment.ts` hoặc file riêng |
| 1.6 | Export public API qua `index.ts` | `src/features/checkout/index.ts` |

**Test (RED trước)**:
- `src/features/checkout/payment.api.test.ts` (mới) — adapter cho 3 endpoint, unwrap envelope, throw ApiError đúng code
- `src/features/checkout/usePayment.test.ts` (mới) — mutation flow, polling state, WS event trigger refetch
- `src/features/checkout/payment.types.test.ts` (mới) — type guards cho status enum

---

### Subplan 2: i18n messages

| # | Công việc | File |
|---|---|---|
| 2.1 | Thêm namespace `checkout.payment` (success, zalopay, manualSync, timeout, qrAlt, openApp, autoConfirmHint, expiresIn) | `messages/vi.json`, `messages/en.json` |
| 2.2 | Thêm namespace `orders.detail` (title, status labels, retry, backToList, ...) | `messages/vi.json`, `messages/en.json` |
| 2.3 | Thêm `error.AUTOMATIC_TRY_QUERY` nếu cần | `messages/vi.json`, `messages/en.json` |

**Test**: chạy `npm run test` → i18n key resolution OK.

---

### Subplan 3: Page `/orders/[id]/page.tsx`

| # | Công việc | File |
|---|---|---|
| 3.1 | Server Component: parse `params.id`, check auth → render `<OrderDetailClient>` | `src/app/orders/[id]/page.tsx` (mới) |
| 3.2 | Client Component: fetch order detail + payment status, render 4 trạng thái (loading/error/empty/success) | `src/app/orders/[id]/OrderDetailClient.tsx` (mới) |
| 3.3 | Tái sử dụng `useOrderPayment` hook (vừa tạo) | — |
| 3.4 | Render QR qua `next/image` với `unoptimized` + `priority` | `src/features/checkout/components/PaymentZaloPayPanel.tsx` (mới) |
| 3.5 | Countdown 5 phút dùng `Countdown` common | reuse từ `src/components/common/Countdown.tsx` |
| 3.6 | Manual sync button → `useQueryZaloPayPayment` | trong `PaymentZaloPayPanel` |
| 3.7 | Error State component (`ErrorState`) + Retry button | reuse |
| 3.8 | Empty State (order not found) | reuse `EmptyState` |

**Test (RED trước)**:
- `src/app/orders/[id]/OrderDetailClient.test.tsx` (mới) — render 4 trạng thái, click button sync, polling interval, redirect khi success
- `src/features/checkout/components/PaymentZaloPayPanel.test.tsx` (mới) — render QR + open app button, success state, expired state

---

### Subplan 4: Mock cập nhật + final commit

| # | Công việc | File |
|---|---|---|
| 4.1 | Cập nhật `mockCheckoutData` để có `orderId` + `paymentMethod` | `src/features/checkout/mocks.ts` |
| 4.2 | Verify build + lint + test pass | terminal |
| 4.3 | Auto-commit (4 commit riêng theo concern) | git |

---

## 4. Test Strategy

| Layer | Tool | Pattern |
|---|---|---|
| Unit test | Vitest + `@testing-library/react` | renderHook + waitFor |
| Mock fetch | MSW (handler ở `src/mocks/handlers.ts`) | `http.post('/api/v1/orders/.../payment/zalopay', ...)` |
| WS mock | `vi.mock('@stomp/stompjs')` | emit message manual qua `client.subscribe` callback |
| Component test | `render(<Component/>)` + user-event | click + assert DOM |

**Coverage mục tiêu**: ≥ 80% cho `payment.api.ts`, ≥ 70% cho component mới.

---

## 5. Out of Scope (LƯU Ý)

- ❌ KHÔNG thêm variant payment khác (VNPay, MoMo)
- ❌ KHÔNG tạo `src/app/api/**` route handler
- ❌ KHÔNG tự verify callback (`/api/v1/payments/zalopay/callback`)
- ❌ KHÔNG upload QR lên CDN
- ❌ KHÔNG sửa code `useFlashSaleWs` (đã merged ở commit 5a7fef6)
- ❌ KHÔNG viết E2E test (xem `no-overengineering.mdc`)

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| WS endpoint URL có thể sai (`orderCode` vs `orderId`) | Plan đã ghi "hỗ trợ cả 2 cách". Sẽ verify với plan khi code. |
| Mock cũ `QrOrderDetail` dùng `orderCode`, không khớp `PaymentResponse.orderId` | Tạo type mới `PaymentResponse` riêng, giữ `QrOrderDetail` cho page cũ (nếu còn dùng) |
| File `docs/handoffs/fe-zalopay-integration-guide.md` chưa commit | Sẽ commit riêng (commit đầu tiên) để giữ handoff làm source |
| i18n `vi.json` lớn (37KB) → conflict key dễ xảy ra | Đọc kỹ trước khi thêm, dùng unique namespace |
| Branch mới chưa pull code mới nhất từ dev | Đã fetch + checkout xong ở Bước 0.1 |

---

## 7. Quy trình merge dev + push

- Khi xong tất cả subplan:
  1. `git fetch origin dev && git merge origin/dev` (giải quyết conflict nếu có)
  2. `npm run build` + `npm run lint` + `npm run test` → all pass
  3. Hỏi user duyệt push
  4. KHÔNG push tự động

---

## Notes

- Số file ước lượng: **8 file mới** + **2 file sửa** (mocks, index.ts)
- Số test file: **5 file test mới**
- Số commit dự kiến: **4-5 commit** (concern tách riêng)
- Thời gian ước lượng: **45-60 phút** (tuỳ data fetching thật từ BE)
