# Plan — Checkout Failed Page (`/checkout/failed`)

> **Branch**: `feature/checkout-failed-page`
> **Created**: 2026-10-14 21:45 UTC+7
> **Owner**: FE team (1 subagent self-driver)
> **Source of Truth #1**: `docs/CLAUDE.md` (UI regulation)
> **Stitch reference**: `docs/superpowers/handoffs/thanh-toan-chua-thanh-cong.md`

## 1. Scope

Làm giao diện trang **Thanh toán chưa thành công** (`/checkout/failed`) theo Stitch design, tương tự các trang `/checkout`, `/checkout/qr`, `/checkout/success`:

1. **Server Component page** tại `src/app/(checkout)/checkout/failed/page.tsx` — parse `?orderCode=...` rồi render content
2. **Client component** `FailedPageContent` — gọi hook fetch order detail, fallback mock khi thiếu orderCode
3. **Visual module** `FailedModule` — render 1 layout responsive (Tailwind `md:`) gồm:
   - Status pill (đỏ): "TRẠNG THÁI: CẦN XỬ LÝ" + countdown "Còn 04:15"
   - Error icon (vòng tròn đỏ + dấu X)
   - Title "Thanh toán chưa thành công" + subtitle "...đơn vẫn giữ đến 14:32"
   - Transaction card: mã GD (copy) + tổng tiền (đỏ) + lý do từ chối + 2 mã đơn đang giữ + voucher warning
   - CTA primary: "Thử thanh toán lại" (link `/checkout/qr?orderCode=...`)
   - CTA secondary: "Chọn COD (Nhận hàng trả tiền)" — TODO(api): wire mutation thật sau
   - Support links: "Hướng dẫn thanh toán" + "Hỗ trợ: 1900 8888"
4. **Header / Stepper / Footer** — tái sử dụng `(checkout)/layout.tsx`
5. **i18n keys** — thêm `storefront.checkout.failed.*` cho cả `vi.json` + `en.json`
6. **Tests** — vitest cho `FailedModule` (RED → GREEN)

## 2. Tham khảo (rules)

| Rule | Mục đích |
|---|---|
| `docs/CLAUDE.md` (mục 3, 4, 5, 6, 7, 11) | Design tokens, error #BA1A1A, tertiary (đỏ hồng), 4 trạng thái (loading/empty/error/data) |
| `.cursor/rules/component-pattern.mdc` | next/image, cva, prop type, focus ring |
| `.cursor/rules/i18n.mdc` | next-intl, key tiếng Việt, namespace `storefront.checkout.failed.*` |
| `.cursor/rules/testing-required.mdc` | TDD: viết test RED trước khi sửa code |
| `.cursor/rules/layer-convention.mdc` | `src/features/orders/**` (đã có), `src/components/storefront/checkout/**` |
| `.cursor/rules/api-data.mdc` | api.ts → hooks.ts → types.ts → mock.ts |
| `.cursor/rules/error-handling.mdc` | ApiError, ErrorState, Retry, toast |
| `.cursor/rules/skill-loading.mdc` | auto-gitignore skill khi Write/StrReplace |

## 3. Subplan chia task (chạy tuần tự trong 1 subagent)

### Subplan A — Data layer (types + mock + hook)

**File mới/sửa**:
- `src/features/orders/types.ts` (SỬA) — thêm `OrderFailedView` aggregate với:
  - `orderCodes: string[]`
  - `transactionId: string` (mã giao dịch — vd "261001_000245")
  - `grandTotal: number` (hiển thị đỏ)
  - `heldUntil: string` (ISO datetime — tính từ BE)
  - `rejectionReason: string` (lý do từ chối từ BE — vd "Tài khoản không đủ số dư...")
  - `voucherWarning?: { description: string; expiresAt: string }` (optional)
  - `address: OrderSuccessAddress` (tái sử dụng)
  - `paymentMethod: "ZALOPAY" | "COD"` (để hiển thị icon)
- `src/features/orders/mocks.ts` (SỬA) — thêm `mockOrderFailedView` (theo Stitch: 2 orders, txn `261001_000245`, lý do "Tài khoản không đủ số dư hoặc đã quá thời gian xác thực OTP", voucher Flash Sale giảm 80K)
- `src/features/orders/hooks.ts` (SỬA) — thêm `useOrderFailedByCode(orderCode)` tương tự `useOrderSuccessByCode`
- `src/features/orders/index.ts` (SỬA) — export `OrderFailedView`, `mockOrderFailedView`, `useOrderFailedByCode`

**Đầu ra**: data layer sẵn sàng cho UI.

### Subplan B — UI (Module + PageContent + i18n)

**File mới/sửa**:
- `src/components/storefront/checkout/FailedModule.tsx` (MỚI) — visual module
- `src/components/storefront/checkout/FailedModule.test.tsx` (MỚI) — unit test
- `src/components/storefront/checkout/FailedPageContent.tsx` (MỚI) — bridge data + UI (loading/error/empty)
- `src/components/storefront/checkout/index.ts` (SỬA) — export mới
- `src/app/(checkout)/checkout/failed/page.tsx` (MỚI) — Server Component page
- `messages/vi.json` + `messages/en.json` (SỬA) — thêm `storefront.checkout.failed.*`

**Đầu ra**: page hoạt động với mock data, 4 trạng thái đầy đủ.

### Subplan C — Verify + auto-commit

- Run test, lint, typecheck
- Smoke browser `/checkout/failed?orderCode=FS-261001-A7K2Q`
- Auto-commit 1 commit duy nhất (concern: feat)

## 4. Test strategy

### Unit test (Vitest + @testing-library/react)
- `FailedModule.test.tsx`:
  - **Render**: status pill "TRẠNG THÁI: CẦN XỬ LÝ" + title "Thanh toán chưa thành công"
  - **Countdown**: hiển thị "Còn MM:SS", tick down theo giây
  - **Transaction card**: hiển thị mã GD `261001_000245` + tổng `1.292.000₫` (đỏ) + lý do + 2 mã đơn + voucher warning
  - **CTAs**: 2 button "Thử thanh toán lại" (link `/checkout/qr?orderCode=...`) + "Chọn COD" (button, hiện toast hoặc alert vì chưa wire API)
  - **Copy mã GD**: click nút copy → clipboard có mã GD
  - **Support links**: "Hướng dẫn thanh toán" + "1900 8888" hiển thị

### Manual smoke
- Mở `/checkout/failed?orderCode=FS-261001-A7K2Q` → countdown chạy, copy mã GD được, click "Thử thanh toán lại" → navigate về QR page
- Mở `/checkout/failed` (không có orderCode) → fallback mock, vẫn render đẹp

## 5. Files audit (Bước 5.0 trong workflow)

### LOGIC (cần test kèm)
- `src/components/storefront/checkout/FailedModule.tsx` ← render có logic (countdown, copy, navigation)
- `src/components/storefront/checkout/FailedPageContent.tsx` ← data fetch + state
- `src/features/orders/types.ts` (phần thêm `OrderFailedView`)
- `src/features/orders/hooks.ts` (phần thêm `useOrderFailedByCode`)
- `src/features/orders/mocks.ts` (phần thêm `mockOrderFailedView`)

### COPY THUẦN (chỉ markup, không cần test mới)
- `src/app/(checkout)/checkout/failed/page.tsx` — chỉ parse searchParam + render (giống pattern success)
- `messages/vi.json` + `messages/en.json` — chỉ thêm key mới

## 6. Out of scope

- Wire mutation thật cho "Chọn COD" (BE chưa có endpoint `PATCH /orders/{id}/payment-method`)
- Realtime countdown sync với server time offset (dùng `Date.now() + offset` — phase sau)
- Email retry notification (BE đã gửi, FE không cần)
- Animation pulse trên status pill (Stitch dùng `animate-ping` — có thể thêm nếu không ảnh hưởng perf)

## 7. Risk & Mitigation

| Risk | Mức | Mitigation |
|---|---|---|
| BE thiếu endpoint `GET /api/v1/orders/{code}/failed-detail` | Trung bình | Fallback về mock, ghi `TODO(api)` comment trong code |
| Countdown drift với server time | Thấp | Phase sau sẽ sync với `serverTime` offset. Hiện tại dùng local time + 4:15 hard-coded (mockup match Stitch) |
| Copy-to-clipboard không work trên HTTP không phải localhost | Thấp | Test môi trường dev. Production HTTPS sẽ work |

## 8. Liên hệ

- Stitch design: `docs/superpowers/handoffs/thanh-toan-chua-thanh-cong.md`
- Success page pattern: `src/components/storefront/checkout/SuccessModule.tsx` (refactor responsive single layout đã merged)
- Orders feature: `src/features/orders/**` (đã có từ success page)
