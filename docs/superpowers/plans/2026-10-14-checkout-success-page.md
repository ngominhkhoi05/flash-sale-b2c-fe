# Plan — Checkout Success Page (`/checkout/success`)

> **Branch**: `feature/checkout-success-page`
> **Created**: 2026-10-14 19:45 UTC+7
> **Owner**: FE team (1 subagent self-driver)
> **Source of Truth #1**: `docs/CLAUDE.md` (UI regulation)
> **Stitch reference**: `docs/superpowers/handoffs/dat-hang-thanh-cong.md` (screen 203897a8 / project 15206106541998912100)

## 1. Scope

Làm giao diện trang **Đặt hàng thành công** (`/checkout/success`) theo Stitch design, tương tự các trang `/checkout` và `/checkout/qr` đã có:

1. **Server Component page** tại `src/app/(checkout)/checkout/success/page.tsx` — parse `?orderCode=...` rồi render content
2. **Client component** `SuccessPageContent` — gọi `useOrderForQr` (sẽ refactor tên) hoặc hook mới `useOrderByCode` qua `getOrderById` để lấy chi tiết đơn đã thanh toán
3. **Visual module** `SuccessModule` — render desktop (mockup 560px card) + mobile (390px device frame) side-by-side
4. **Header / Stepper / Footer** — tái sử dụng `(checkout)/layout.tsx` (đã có `CheckoutHeader`, `CheckoutStepper`, `CheckoutFooter`)
5. **i18n keys** — thêm `storefront.checkout.success.*` cho cả `vi.json` + `en.json`
6. **Tests** — vitest cho `SuccessModule` (RED → GREEN)

### Điểm khác biệt so với các trang checkout khác

- Đây là **trang thành công sau thanh toán** → stepper state = "Hoàn tất" (step 3 active), step 1+2 done
- Không có countdown, không có QR
- Có 2 mockup (desktop + mobile) hiển thị cùng lúc trong dev showcase (theo Stitch design) — tương tự `/checkout/qr` cũng có QR + Mobile Viewport Mockup
- CTA chính: "Xem đơn hàng" (link `/orders/<orderCode>`)
- CTA phụ: "Tiếp tục mua sắm" (link `/`)

## 2. Tham khảo (rules)

| Rule | Mục đích |
|---|---|
| `docs/CLAUDE.md` (mục 3, 4, 5, 6, 7, 11) | Design tokens, primary color #006194, success secondary #006C49, i18n, 4 trạng thái (loading/empty/error/data) |
| `.cursor/rules/component-pattern.mdc` | next/image, alt tiếng Việt, cva, prop type, focus ring |
| `.cursor/rules/i18n.mdc` | next-intl, key tiếng Việt, namespace `storefront.checkout.success.*` |
| `.cursor/rules/testing-required.mdc` | TDD: viết test RED trước khi sửa code |
| `.cursor/rules/layer-convention.mdc` | `src/features/orders/**` (đã có), `src/components/storefront/checkout/**` |
| `.cursor/rules/api-data.mdc` | api.ts → hooks.ts → types.ts → mock.ts |
| `.cursor/rules/error-handling.mdc` | ApiError, ErrorState, Retry, toast |
| `.cursor/rules/skill-loading.mdc` | auto-gitignore skill khi Write/StrReplace |
| `.cursor/rules/routing-guards.mdc` | Middleware/AuthGuard cho protected route |
| `.cursor/rules/no-overengineering.mdc` | KHÔNG tạo route handler proxy, KHÔNG state machine cho form |

## 3. Subplan chia task

### Subplan A — Data layer (hook + types)

**File mới/sửa**:

- `src/features/orders/types.ts` (MỚI) — types `OrderSuccessView` aggregate (group orders by store, có `orderCode`, `storeName`, `amount`, `paymentStatus`, `paymentMethod`, `createdAt`, `itemsCount` summary)
- `src/features/orders/api.ts` (SỬA) — thêm helper `getOrdersByCode(orderCode: string): Promise<OrderSuccessView>` — gọi `GET /api/v1/orders?code=<orderCode>` (hoặc loop `getOrderById` nếu BE chỉ có lookup theo id, fallback parse `orderCode` từ list)
- `src/features/orders/hooks.ts` (SỬA) — thêm hook `useOrderSuccessByCode(orderCode: string)` — TanStack Query wrapper, staleTime 30s
- `src/features/orders/mocks.ts` (MỚI) — mock `mockOrderSuccessView` khớp Stitch mockup (2 orders: UTC Fashion Mall + TechZone Official, grand total 1.292.000₫, address Nguyễn Văn An)
- `src/features/orders/index.ts` (SỬA) — re-export types + hooks mới
- `src/features/orders/api.test.ts` (SỬA) — test cho `getOrdersByCode` + mock fallback

**Đầu ra**: hook + types + mock sẵn sàng cho UI layer.

### Subplan B — UI layer (Visual + page)

**File mới/sửa**:

- `src/app/(checkout)/checkout/success/page.tsx` (MỚI) — Server Component, parse `?orderCode=...` rồi render `<SuccessPageContent orderCode={orderCode} />`
- `src/components/storefront/checkout/SuccessPageContent.tsx` (MỚI) — Client Component, gọi hook, fallback mock khi thiếu orderCode
- `src/components/storefront/checkout/SuccessModule.tsx` (MỚI) — Visual module: Desktop card 560px + Mobile device frame 390px side-by-side, dùng design tokens
- `src/components/storefront/checkout/SuccessModule.test.tsx` (MỚI) — test render: badge "THÀNH CÔNG", title "Đặt hàng thành công!", orders breakdown (UTC Fashion Mall + TechZone Official), total 1.292.000₫, address Nguyễn Văn An, CTA buttons

**Đầu ra**: 1 page + 2 components + 1 test file.

### Subplan C — i18n + Stepper tweak

**File mới/sửa**:

- `src/components/storefront/checkout/CheckoutStepper.tsx` (SỬA) — thêm prop `activeStep?: 1 | 2 | 3` (mặc định 2) để success page set step 3 active
- `messages/vi.json` (SỬA) — thêm `storefront.checkout.success.*` (badge, title, subtitle, orders, total, address, eta, viewOrders, continueShopping)
- `messages/en.json` (SỬA) — mirror tiếng Anh
- `src/app/(checkout)/layout.tsx` (SỬA) — truyền `activeStep` xuống `CheckoutStepper` dựa theo `usePathname()` (hoặc thêm prop vào page)

**Đầu ra**: i18n hoàn chỉnh + stepper hiển thị "Hoàn tất" active trên trang success.

## 4. Test strategy

### Unit test (Vitest + @testing-library/react)
- `SuccessModule.test.tsx`:
  - **Render**: hiển thị badge "THÀNH CÔNG", title "Đặt hàng thành công!", subtitle, 2 đơn (UTC Fashion Mall + TechZone Official)
  - **Total**: hiển thị `1.292.000₫` ở cả desktop lẫn mobile
  - **Address**: hiển thị "Nguyễn Văn An" + số điện thoại + địa chỉ
  - **CTAs**: 2 button "Xem đơn hàng" (primary) + "Tiếp tục mua sắm" (ghost)
  - **Href**: button "Xem đơn hàng" link đến `/orders/<orderCode>`
  - **Empty fallback**: khi `order` là `null` → render EmptyState

### API test (Vitest)
- `api.test.ts`: `getOrdersByCode` fallback về mock nếu thiếu/empty list

### Manual smoke
- Mở `/checkout/success?orderCode=FS-261001-A7K2Q` → kiểm tra:
  - Header stepper 3 có active ở "Hoàn tất" (step 3)
  - Card success hiển thị đúng data từ mock
  - 2 nút CTA click đúng destination

## 5. Files audit (Bước 5.0 trong workflow)

### LOGIC (cần test kèm)
- `src/components/storefront/checkout/SuccessModule.tsx` ← render có logic
- `src/components/storefront/checkout/SuccessPageContent.tsx` ← data fetch + state
- `src/features/orders/api.ts` (phần mới thêm) ← API layer
- `src/features/orders/hooks.ts` (phần mới thêm) ← React Query
- `src/components/storefront/checkout/CheckoutStepper.tsx` ← thêm prop activeStep

### COPY THUẦN (chỉ markup, không cần test mới — dùng test cũ)
- `src/app/(checkout)/checkout/success/page.tsx` — chỉ parse searchParam + render component (giống pattern `checkout/qr/page.tsx`)
- `messages/vi.json` + `messages/en.json` — chỉ thêm key mới
- `src/app/(checkout)/layout.tsx` — chỉ truyền prop

## 6. Out of scope (sẽ làm task khác)

- Realtime update từ WS cho trạng thái đơn (sẽ tích hợp sau với `useFlashSaleWs`)
- Animation chuyển cảnh từ `/checkout/qr` sang `/checkout/success` (sẽ làm phase sau)
- A/B test với 2 variant UI
- Email confirmation (BE đã gửi, FE không cần)

## 7. Risk & Mitigation

| Risk | Mức | Mitigation |
|---|---|---|
| BE thiếu endpoint `GET /api/v1/orders?code=...` | Trung bình | Fallback về mock, ghi `TODO(api)` comment trong code (rule §7) |
| Stepper không support custom active step | Thấp | Thêm prop `activeStep` optional, default giữ nguyên |
| i18n key trùng với namespace khác | Thấp | Namespace riêng `storefront.checkout.success.*`, document trong commit body |

## 8. Liên hệ

- Stitch design: `docs/superpowers/handoffs/dat-hang-thanh-cong.md`
- Backend gap report: `docs/superpowers/handoffs/2026-10-13-backend-gap-report.md`
- Orders feature hiện tại: `src/features/orders/api.ts` (đã có 2026-10-14)
