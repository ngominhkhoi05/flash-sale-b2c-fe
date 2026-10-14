# Plan — Trang thanh toán QR ZaloPay (`/checkout/qr`)

**Date**: 2026-10-14
**Branch**: `feat/payment-qr-zalopay`
**Owner**: FE agent
**Stack**: Next 16.3.8 · React 19.2 · TS 5.x · Tailwind 4.x · shadcn/ui · TanStack Query · next-intl

## 1. Scope

Làm giao diện trang thanh toán QR ZaloPay theo `docs/superpowers/handoffs/thanh-toan-QR-zalo.md` (Stitch screen 203897a8).

**Phạm vi user chốt** (Bước 4):
- ✅ **Main view only** — QR + countdown + order details + CTA
- ❌ Bỏ UX Showcase states (Expired, Success)
- ❌ Bỏ Mobile mockup (390px) — chỉ responsive 2 cột → 1 cột theo Tailwind
- ✅ Mock data — từ `OrderSubmitResponse` (`qrCodeUrl`, `expiresAt`, `orderCode`, `orderIds[]`)

**Layout tổng thể** (theo mockup HTML):
```
┌──────────────────────────────────────────────────┐
│ Header (compact: logo + "Thanh toán ZaloPay" + Hủy + user)  │
├──────────────────────────────────────────────────┤
│ Stepper: 1. Giỏ hàng ✓ → 2. Đặt hàng ✓ → 3. Thanh toán ZaloPay QR │
├──────────────────────────────────────────────────┤
│ ┌──── 880px max-width ───────────────────────────┐│
│ │  ┌── 2 cột ─────────────────────────────────┐  ││
│ │  │ Trái: QR + countdown + 3 steps        │ Phải: │
│ │  │ - "ZaloPay" + "VietQR" badge          │ Mã GD │
│ │  │ - Tiêu đề "Quét mã để thanh toán"     │ Tổng  │
│ │  │ - Circular countdown gauge (04:32)     │ Chi tiết│
│ │  │ - QR Code 240x240 với 4 corner markers │ 2 đơn │
│ │  │ - "Hỗ trợ ZaloPay & 35+ ngân hàng"   │ Alert │
│ │  │ - 3 steps instruction                │ CTA  │
│ │  │ - Pulse "Đang chờ bạn quét mã"      │      │
│ │  └────────────────────────────────────────┘  ││
│ └─────────────────────────────────────────────┘│
│ Footer: © + legal links + PCI-DSS badge           │
└──────────────────────────────────────────────────┘
```

## 2. Tham khảo (Source of Truth)

- `docs/CLAUDE.md` mục 3 (design tokens), 4 (UX rules), 5 (component reuse), 6 (status labels), 7 (API), 8 (Flash Sale + ZaloPay realtime), 11 (code convention)
- `docs/superpowers/handoffs/thanh-toan-QR-zalo.md` (HTML mockup đầy đủ)
- `.cursor/rules/component-pattern.mdc` — cva, cn, forwardRef
- `.cursor/rules/i18n.mdc` — namespace mới `storefront.checkout.qrPayment.*`
- `.cursor/rules/error-handling.mdc` — empty/loading/error states
- `docs/CLAUDE.md` mục 8.3 (nút "Mua ngay" disable ngay khi click — áp dụng cho "Tôi đã hoàn tất")
- `src/components/storefront/checkout/*` (CheckoutHeader, CheckoutStepper) — **TÁI SỬ DỤNG** theo rule §5

## 3. Files sẽ thay đổi

| File | Loại | Logic? | Cần test? |
|---|---|---|---|
| `src/app/(storefront)/checkout/qr/page.tsx` | MỚI — entry route | ❌ (chỉ render + read searchParams) | ❌ (rule §11) |
| `src/components/storefront/checkout/CheckoutQrHeader.tsx` | MỚI — header riêng cho QR (compact) | ❌ (UI only) | ❌ |
| `src/components/storefront/checkout/QrPaymentModule.tsx` | MỚI — main 2-col module | ⚠️ countdown logic + copy | ✅ |
| `src/components/storefront/checkout/QrPaymentModule.test.tsx` | MỚI — test | ✅ logic | ✅ |
| `src/features/checkout/api.ts` | SỬA — thêm `getOrderForQr(orderCode)` lấy `qrCodeUrl` + `expiresAt` | ✅ | ✅ |
| `src/features/checkout/hooks.ts` | SỬA — thêm `useOrderForQr` hook | ✅ | ✅ |
| `src/features/checkout/hooks.test.tsx` | SỬA — test mới | ✅ | ✅ |
| `src/features/checkout/index.ts` | SỬA — export `useOrderForQr` | ❌ | ❌ |
| `src/components/storefront/checkout/index.ts` | SỬA — export components mới | ❌ | ❌ |
| `messages/vi.json` | SỬA — thêm `storefront.checkout.qrPayment.*` (8 keys) | ❌ (i18n strings) | ❌ |
| `messages/en.json` | SỬA — tương tự (8 keys) | ❌ | ❌ |
| `src/lib/constants.ts` | SỬA — thêm `QR_HOLD_DURATION_MS` constant | ❌ (constant) | ❌ |

## 4. Subplan (Bước 2)

Plan này **không chia subagent** (1 concern, ~12 file, có thể thấy toàn cục). Chạy thẳng theo thứ tự:

### Phase A — Data layer (TDD)
1. **TEST FIRST**: viết `hooks.test.tsx` cho `useOrderForQr` — test FAIL trên code chưa có.
2. Implement `getOrderForQr` trong `api.ts` + `useOrderForQr` trong `hooks.ts`.
3. Run test → PASS.

### Phase B — UI components (TDD)
4. **TEST FIRST**: viết `QrPaymentModule.test.tsx` — test:
   - render QR image từ `qrCodeUrl`
   - countdown hiển thị 04:32 ban đầu
   - countdown tick xuống sau 1s
   - copy mã đơn vào clipboard
   - click "Tôi đã hoàn tất" gọi `onComplete`
5. Implement `QrPaymentModule.tsx`:
   - 2-col layout (md:grid-cols-2)
   - Circular SVG countdown (theo mockup L66-71)
   - QR placeholder component (SVG pattern theo mockup L82-119)
   - Copy mã đơn button (navigator.clipboard)
   - 3 steps instruction (mockup L135-145)
   - Pulse indicator (mockup L148-156)
   - Right column: Mã GD + Tổng tiền + chi tiết 2 đơn + alert + CTA
6. Run test → PASS.

### Phase C — Page + header + i18n (no logic, copy thuần)
7. Tạo `CheckoutQrHeader.tsx` (compact theo mockup L7-30)
8. Tạo `src/app/(storefront)/checkout/qr/page.tsx` (Server Component, parse `?orderCode=`)
9. Update `messages/vi.json` + `messages/en.json` với 8 keys mới (Bước 9 i18n: ns + key cấp 2)
10. Update `index.ts` (features + components) để export.
11. Add `QR_HOLD_DURATION_MS = 5 * 60 * 1000` vào `constants.ts`.

### Phase D — Verify
12. `npm run lint` → PASS
13. `npm run tsc --noEmit` → PASS
14. `npm run test` → all PASS
15. `npm run build` → PASS

## 5. Test strategy

| Test | Coverage |
|---|---|
| `useOrderForQr` | Mock apiFetch, test return `data`, loading state, error state |
| `QrPaymentModule` | Render QR, countdown ticks, copy mã đơn, click CTA, expired state, copy-to-clipboard fallback |
| `qrCodeUrl` & `expiresAt` ở `OrderSubmitResponse` | Type-level — không cần test runtime |

**TDD gate**: KHÔNG sửa code trước khi có test đỏ (rule §5.1 testing-required.mdc).

## 6. Rủi ro

- **Tailwind 4 + Material Symbols**: cần dùng `material-symbols-outlined` đúng class. Checked: project đã dùng nhiều nơi.
- **Circular gauge SVG**: implementation thủ công, không cần lib. Dùng 2 `<circle>` với `stroke-dasharray` (mockup L66-71).
- **Clipboard API**: cần fallback cho trường hợp không support. Dùng `document.execCommand("copy")` nếu cần.
- **Server time skew**: theo rule §8 mục 1, lấy `expiresAt` từ server. Component nhận `expiresAt` làm prop, tính countdown client-side.
- **Realtime payment status**: rule §8 mục 5 — kiểm tra bằng STOMP hoặc polling 3s/lần. **Phase này KHÔNG làm** (user chốt main view only), chỉ để TODO comment cho Phase sau.

## 7. Out of scope (bước sau)

- Expired state (auto redirect sang "Tạo mã mới")
- Success state (auto redirect 3s sang Order detail)
- Mobile mockup riêng 390px (chỉ responsive Tailwind)
- Real-time WS polling cho payment status
- Deep link ZaloPay app
- Backend integration thật (đang dùng mock)

## 8. Commit strategy

- 1 commit duy nhất: `feat(checkout): implement ZaloPay QR payment page`
- Body: liệt kê files + test files

## 9. Liên kết

- Stitch design: screen 203897a8 (project 15206106541998912100)
- Handoff HTML: `docs/superpowers/handoffs/thanh-toan-QR-zalo.md`
- API contract: `src/features/checkout/api.ts` (existing)
