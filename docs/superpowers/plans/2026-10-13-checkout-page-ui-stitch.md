# Plan — Checkout Page UI (Stitch alignment)

> **Branch**: `feat/checkout-page-ui`  
> **Created**: 2026-10-13 19:40 UTC+7  
> **Owner**: FE team (1 subagent self-driver)  
> **Source of Truth #1**: `docs/CLAUDE.md` (UI regulation)

## 1. Scope

Làm giao diện trang **Thanh toán / Checkout** (`/checkout`) theo đúng pixel của Stitch screen `ui-code-dump.md`:

1. **Header riêng cho trang thanh toán** — `CheckoutHeader`
2. **Stepper 3 bước** — `Giỏ hàng ✓` → `Thanh toán (active)` → `Hoàn tất`
3. **Card Địa chỉ nhận hàng** — chọn/thay đổi địa chỉ, có modal chọn địa chỉ
4. **Banner thông báo tách đơn** — đơn của 2 shop sẽ tách thành 2 đơn
5. **Card từng shop (kiện hàng)** — 1 shop = 1 card với:
   - Header shop (badge Mall/Official Mall + tên shop + giao dự kiến)
   - Danh sách sản phẩm (ảnh, tên, phân loại, SL, đơn giá)
   - Voucher shop + đổi mã
   - Lời nhắn cho shop
   - Phí ship + Tạm tính đơn
6. **Card Phương thức thanh toán** — radio ZaloPay QR (khuyên dùng) vs COD
7. **Cột phải sticky** — Voucher Vibe Mart + Tóm tắt đơn hàng (tổng tiền, giảm giá, phí ship, tổng thanh toán, nút Đặt hàng)
8. **Modal 1 — Chọn địa chỉ nhận hàng**
9. **Modal 2 — Chọn Voucher Vibe Mart**
10. **Mobile view** — bottom sticky Đặt hàng + tổng thanh toán

## 2. Tham khảo (rules)

| Rule | Mục đích |
|---|---|
| `docs/CLAUDE.md` (mục 3–7, 11) | Design tokens, primary color #006194, nút cao 40-48px, i18n, 4 trạng thái (loading/empty/error/data) |
| `.cursor/rules/component-pattern.mdc` | next/image, alt tiếng Việt, cva, prop type, focus ring |
| `.cursor/rules/i18n.mdc` | next-intl, key tiếng Việt, namespace `storefront.checkout.*` |
| `.cursor/rules/testing-required.mdc` | TDD: viết test RED trước khi sửa code |
| `.cursor/rules/layer-convention.mdc` | `src/features/checkout/**`, `src/components/storefront/checkout/**` |
| `.cursor/rules/features-migration.mdc` | Template feature module |
| `.cursor/rules/api-data.mdc` | api.ts → hooks.ts → types.ts → mock.ts |
| `.cursor/rules/error-handling.mdc` | ApiError, ErrorState, Retry, toast |
| `.cursor/rules/skill-loading.mdc` | auto-gitignore skill khi Write/StrReplace |
| `.cursor/rules/flash-sale-payment.mdc` | ZaloPay QR, server time offset, Idempotency-Key |
| `.cursor/rules/routing-guards.mdc` | AuthGuard yêu cầu đăng nhập |

## 3. Subplan chia task

### Subplan A — Data layer (feature module)
- `src/features/checkout/types.ts` — types cho CheckoutData, Address, ShopGroup, CheckoutItem, Voucher, ShippingMethod, PaymentMethod
- `src/features/checkout/api.ts` — API layer (checkout, apply voucher, get addresses)
- `src/features/checkout/hooks.ts` — TanStack Query
- `src/features/checkout/mocks.ts` — mock data
- `src/features/checkout/hooks.test.tsx`
- `src/features/checkout/index.ts`
- TDD: viết test cho `useCheckout` (loading/success/error), `useApplyVoucher`, `useSubmitOrder`

### Subplan B — Components (ở `src/components/storefront/checkout/`)
- `CheckoutHeader.tsx` — header riêng (logo + breadcrumb "Thanh toán" + nav 3 bước + hotline + user)
- `CheckoutStepper.tsx` — thanh 3 bước
- `CheckoutAddressCard.tsx` — card địa chỉ (gradient bar + nút Thay đổi)
- `CheckoutSplitOrderBanner.tsx` — banner tách đơn
- `CheckoutShopCard.tsx` — 1 card cho 1 shop (header + items + voucher + lời nhắn + tạm tính)
- `CheckoutShopItem.tsx` — item trong shop card
- `CheckoutPaymentMethodCard.tsx` — radio ZaloPay vs COD
- `CheckoutVibeMartVoucherCard.tsx` — cột phải: voucher sàn
- `CheckoutOrderSummary.tsx` — cột phải: tóm tắt đơn + nút Đặt hàng
- `CheckoutVibeCareBanner.tsx` — banner dịch vụ bảo hiểm
- `AddressPickerModal.tsx` — modal chọn địa chỉ
- `VoucherPickerModal.tsx` — modal chọn voucher sàn
- `CheckoutPageContent.tsx` — layout chính (gap state reducers)
- `index.ts` — barrel

### Subplan C — Page route
- `src/app/(storefront)/checkout/page.tsx` — Next 16 server component → render `<CheckoutPageContent />`

### Subplan D — i18n
- `messages/vi.json` — add `storefront.checkout.*` namespace (~80 keys)
- `messages/en.json` — same keys in English

### Subplan E — Tests
- Hooks test (Subplan A TDD)
- Smoke test cho CheckoutPageContent (loading/error/empty/data states)

## 4. Test Strategy

| Concern | Test |
|---|---|
| TDD hook `useCheckout` | renderHook + waitFor trên api mock |
| TDD hook `useApplyVoucher` | kiểm tra mutation + cache invalidation |
| TDD hook `useSubmitOrder` | gọi API + onSuccess → navigate |
| TDD hook `useAddresses` | renderHook với data giả |
| Component smoke | render với QueryClientProvider + next-intl mock |

## 5. Audit file — sẽ phân loại từng file

| File | Loại | Yêu cầu test |
|---|---|---|
| `types.ts` | types only | không cần test |
| `api.ts` | logic (fetch) | không cần test riêng (đã test qua hook) |
| `hooks.ts` | logic | **BẮT BUỘC test** |
| `CheckoutPageContent.tsx` | state + UI | **BẮT BUỘC test** (4 trạng thái) |
| `CheckoutShopCard.tsx` | render | khuyến nghị smoke |
| Modal components | controlled | khuyến nghị smoke |
| UI nhỏ (Stepper, Banner) | pure render | không bắt buộc |
| Page route | Server Component | không cần test |

## 6. Rủi ro & ước lượng

| Rủi ro | Mức | Đối sách |
|---|---|---|
| Backend chưa có checkout endpoints (FE gap report #1, P0 items) | CAO | Dùng mock 100% trong Subplan A; expose cùng DTO; khi BE sẵn chỉ thay URL |
| TypeScript types chưa khớp backend | TRUNG BÌNH | Lấy types từ `docs/api-reference.md` + mock |
| Tests cho modal có thể fail do Portal/next-portal | THẤP | dùng default shadcn Dialog pattern với có sẵn |
| Build timeout do nhiều file mới | THẤP | Chia commit theo concern |

**Ước lượng thời gian**: 2–3 giờ để hoàn thành (UI + tests + commit).

## 7. Tiêu chí Definition of Done

- [ ] Tất cả file logic có `.test.ts(x)` đi kèm PASS
- [ ] `npm run test` PASS
- [ ] `npm run lint` PASS
- [ ] `npm run build` PASS
- [ ] Đủ 4 trạng thái UI (loading/empty/error/data)
- [ ] Đúng 1 nút primary trên màn
- [ ] i18n đầy đủ vi + en
- [ ] Material Symbols icon whitelist (cập nhật nếu cần)
- [ ] Auto-commit theo concern

## 8. Tham chiếu UI

| Section | Stitch reference |
|---|---|
| Header | `2026-10-13-ui-code-dump.md` L1–37 |
| Stepper | L39–80 |
| Address card | L82–117 |
| Split banner | L120–138 |
| Shop card 1 | L141–220 |
| Shop card 2 | L224–298 |
| Payment method | L302–360 |
| Cột phải voucher | L362–440 |
| Order summary | L444–515 |
| Vibe Care banner | L519–540 |
| Modal 1 (address) | L578–620 (interactive) |
| Modal 2 (voucher) | L628–687 (interactive) |

