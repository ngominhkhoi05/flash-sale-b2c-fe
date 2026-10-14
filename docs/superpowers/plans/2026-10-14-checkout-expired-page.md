# Plan — Checkout Expired Page (`/checkout/expired`)

> **Branch**: `feature/checkout-expired-page`
> **Created**: 2026-10-14 22:10 UTC+7
> **Owner**: FE team (1 subagent self-driver)
> **Source of Truth #1**: `docs/CLAUDE.md` (UI regulation)
> **Stitch reference**: `docs/superpowers/handoffs/don-hang-het-han.md`

## 1. Scope

Làm giao diện trang **Đơn hàng đã hết hạn** (`/checkout/expired`) theo Stitch design, tương tự `success` + `failed`:

1. **Server Component page** tại `src/app/(checkout)/checkout/expired/page.tsx` — parse `?orderCode=...` rồi render content
2. **Client component** `ExpiredPageContent` — fallback mock khi thiếu orderCode (giống pattern FailedPageContent)
3. **Visual module** `ExpiredModule` — render 1 layout responsive (Tailwind `md:`):
   - Status pill (vàng/amber): "Trạng thái: Đã hủy tự động"
   - Icon: vòng tròn vàng + `hourglass_disabled`
   - Title "Đơn hàng đã hết hạn" + subtitle "...Bạn chưa hoàn tất thanh toán trong 5 phút..."
   - Box phục hồi quyền lợi (xanh emerald): voucher FREESHIP50K + 2 mã giảm giá shop
   - Inventory restocked row: tên sản phẩm + badge "Còn hàng tại shop"
   - CTA primary: "Quay lại Flash Sale" (link `/flash-sale`)
   - CTA secondary: "Xem lại giỏ hàng (N sản phẩm)" (link `/cart`)
   - Help footer: "Cần trợ giúp đơn hàng? Liên hệ bộ phận CSKH 24/7"
4. **Header / Stepper / Footer** — tái sử dụng `(checkout)/layout.tsx`
5. **i18n keys** — thêm `storefront.checkout.expired.*` cho cả `vi.json` + `en.json`
6. **Tests** — vitest cho `ExpiredModule` (RED → GREEN)

## 2. Tham khảo (rules)

| Rule | Mục đích |
|---|---|
| `docs/CLAUDE.md` (mục 3, 4, 5, 6, 7, 11) | Design tokens, warning #F59E0B, success #16A34A, 4 trạng thái (loading/empty/error/data) |
| `.cursor/rules/component-pattern.mdc` | next/image, cva, prop type, focus ring |
| `.cursor/rules/i18n.mdc` | next-intl, key tiếng Việt, namespace `storefront.checkout.expired.*` |
| `.cursor/rules/testing-required.mdc` | TDD: viết test RED trước khi sửa code |
| `.cursor/rules/layer-convention.mdc` | `src/features/orders/**`, `src/components/storefront/checkout/**` |
| `.cursor/rules/api-data.mdc` | api.ts → hooks.ts → types.ts → mock.ts |
| `.cursor/rules/error-handling.mdc` | ApiError, ErrorState, Retry, toast |
| `.cursor/rules/skill-loading.mdc` | auto-gitignore skill khi Write/StrReplace |

## 3. Subplan chia task (chạy tuần tự trong 1 subagent)

### Subplan A — Data layer (types + mock + hook)

**File mới/sửa**:
- `src/features/orders/types.ts` (SỬA) — thêm `OrderExpiredView` aggregate với:
  - `orderCodes: string[]` (các mã đơn đã bị huỷ)
  - `cartItemCount: number` (số sản phẩm trong giỏ sau khi restore, vd: 2)
  - `cartItemSummary: string` (chuỗi tóm tắt, vd: "Áo Polo Oversize (UTC) & Cáp C-to-C (TechZone)")
  - `restoredBenefits: string[]` (danh sách quyền lợi đã phục hồi, vd: ["Voucher Vibe Mart FREESHIP50K...", "2 mã giảm giá shop..."])
  - `expiredAt: string` (ISO datetime — thời điểm hết hạn, dùng cho subtitle)
  - `holdDurationMinutes: number` (vd: 5)
- `src/features/orders/mocks.ts` (SỬA) — thêm `mockOrderExpiredView` (theo Stitch: 2 đơn, cartItemCount=2, summary "Áo Polo Oversize (UTC) & Cáp C-to-C (TechZone)", 2 benefits)
- `src/features/orders/hooks.ts` (SỬA) — thêm `useOrderExpiredByCode(orderCode)` tương tự `useOrderFailedByCode` (throw placeholder, TODO khi BE wire)
- `src/features/orders/index.ts` (SỬA) — export `OrderExpiredView`, `mockOrderExpiredView`, `useOrderExpiredByCode`

**Đầu ra**: data layer sẵn sàng cho UI.

### Subplan B — UI (Module + PageContent + i18n)

**File mới/sửa**:
- `src/components/storefront/checkout/ExpiredModule.tsx` (MỚI) — visual module
- `src/components/storefront/checkout/ExpiredModule.test.tsx` (MỚI) — unit test
- `src/components/storefront/checkout/ExpiredPageContent.tsx` (MỚI) — bridge data + UI
- `src/components/storefront/checkout/ExpiredPageContent.test.tsx` (MỚI) — bridge test
- `src/components/storefront/checkout/index.ts` (SỬA) — export mới
- `src/app/(checkout)/checkout/expired/page.tsx` (MỚI) — Server Component page
- `messages/vi.json` + `messages/en.json` (SỬA) — thêm `storefront.checkout.expired.*`
- `src/lib/constants.ts` (SỬA) — thêm `ROUTES.CHECKOUT_EXPIRED`
- `src/components/ui/material-symbol.tsx` (SỬA) — thêm icon `hourglass_disabled` + `verified` + `check_circle` + `bolt` + `inventory_2` + `shopping_cart`

**Đầu ra**: page hoạt động với mock data, 4 trạng thái đầy đủ.

### Subplan C — Verify + auto-commit

- Run test, lint, typecheck
- Smoke browser `/checkout/expired?orderCode=...`
- Auto-commit 1 commit duy nhất (concern: feat)

## 4. Test strategy

### Unit test (Vitest + @testing-library/react)
- `ExpiredModule.test.tsx`:
  - **Render**: status pill "Trạng thái: Đã hủy tự động" + title "Đơn hàng đã hết hạn"
  - **Subtitle**: "...Bạn chưa hoàn tất thanh toán trong 5 phút..."
  - **Restored benefits box**: hiển thị 2 quyền lợi (FREESHIP50K + 2 mã giảm giá)
  - **Inventory restocked**: tên sản phẩm "Áo Polo Oversize (UTC) & Cáp C-to-C (TechZone)" + badge "Còn hàng tại shop"
  - **CTAs**: 2 button "Quay lại Flash Sale" (link `/flash-sale`) + "Xem lại giỏ hàng (2 sản phẩm)" (link `/cart`)
  - **Help footer**: "Cần trợ giúp đơn hàng?" + "Liên hệ bộ phận CSKH 24/7" link

### Manual smoke
- Mở `/checkout/expired?orderCode=FS-261001-A7K2Q` → render mock
- Click "Quay lại Flash Sale" → navigate `/flash-sale`
- Click "Xem lại giỏ hàng (2 sản phẩm)" → navigate `/cart`

## 5. Files audit (Bước 5.0 trong workflow)

### LOGIC (cần test kèm)
- `src/components/storefront/checkout/ExpiredModule.tsx` ← render có logic (dynamic cart count)
- `src/components/storefront/checkout/ExpiredPageContent.tsx` ← data fetch + state
- `src/features/orders/types.ts` (phần thêm `OrderExpiredView`)
- `src/features/orders/hooks.ts` (phần thêm `useOrderExpiredByCode`)
- `src/features/orders/mocks.ts` (phần thêm `mockOrderExpiredView`)

### COPY THUẦN (chỉ markup, không cần test mới)
- `src/app/(checkout)/checkout/expired/page.tsx` — pattern giống failed page
- `messages/vi.json` + `messages/en.json` — thêm key mới
- `src/lib/constants.ts` — thêm 1 route
- `src/components/ui/material-symbol.tsx` — thêm icon (allow-list)

## 6. Out of scope

- Wire API thật cho `useOrderExpiredByCode` (BE chưa có)
- Animation fade-in trên icon (Stitch dùng `shadow-inner` + `bg-amber-100` đơn giản — không cần motion)
- Email thông báo huỷ đơn (BE đã gửi, FE không cần)
- Realtime poll để check đơn vẫn pending (trang này là terminal state)

## 7. Risk & Mitigation

| Risk | Mức | Mitigation |
|---|---|---|
| BE thiếu endpoint `GET /api/v1/orders/{code}/expired-detail` | Trung bình | Fallback về mock, ghi `TODO(api)` comment trong code |
| Cart count có thể > 99 — UI overflow | Thấp | Tailwind `truncate` đã có trên Stitch, an toàn |
| Subtitle dùng `holdDurationMinutes` động (BE trả 5 phút, có thể config) | Thấp | Hard-coded 5 trong mock; thực tế sẽ từ BE |

## 8. Liên hệ

- Stitch design: `docs/superpowers/handoffs/don-hang-het-han.md`
- Failed page pattern: `src/components/storefront/checkout/FailedModule.tsx`
- Success page pattern: `src/components/storefront/checkout/SuccessModule.tsx`
- Orders feature: `src/features/orders/**`
