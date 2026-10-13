# Plan — Flash Sale Page UI (Stitch alignment)

> **Branch**: `feat/flash-sale-page-ui` (từ `origin/dev`)
> **Created**: 2026-10-13 20:31 UTC+7
> **Owner**: FE team (1 subagent self-driver, có thể split)
> **Source of Truth #1**: `docs/CLAUDE.md` (UI regulation)

## 1. Scope

Làm giao diện trang **Flash Sale** (`/flash-sale`) theo đúng pixel của Stitch mockup
`docs/superpowers/handoffs/trang-flash-sale.md`. Trang này đã có stub ở
`src/app/(storefront)/flash-sale/page.tsx` (chỉ render EmptyState) — ta thay thế hoàn toàn.

### 6 section chính (theo Stitch)

1. **Promotional banner** (bg rose-50, badge FLASH SALE, mô tả giảm giá, trust badge chính hãng)
2. **Sticky time slot nav** (5 slot theo giờ: past / active / upcoming / upcoming / tomorrow)
3. **Countdown + Category filter chips** (countdown HH:MM:SS + filter theo danh mục)
4. **Active deals grid** (10 sản phẩm, 5-col desktop — 3 biến thể: bình thường / sắp cháy hàng / hết hàng)
5. **Upcoming slot** (khung giờ kế tiếp, 5 sản phẩm với nút "Nhắc tôi")
6. **Fixed live indicator pill** (bottom-right, đếm số sp vừa mua)

### Component tái sử dụng (đã có sẵn)

| Component | Path | Mục đích |
|---|---|---|
| `StorefrontHeader` | `src/components/storefront/StorefrontHeader.tsx` | Header với `activeNav="flash-sale"` |
| `StorefrontFooter` | `src/components/storefront/StorefrontFooter.tsx` | Footer 4 cột |
| `MobileBottomNav` | `src/components/storefront/MobileBottomNav.tsx` | Bottom nav mobile |
| `Countdown` | `src/components/common/Countdown.tsx` | Countdown HH:MM:SS |
| `EmptyState` / `ErrorState` | `src/components/common/` | 4 trạng thái bắt buộc |
| `useFlashSaleSlots` | `src/features/homepage/hooks.ts` | Hook fetch slot data |
| `formatVND` | `src/lib/format.ts` | Format tiền VND |
| `MaterialSymbol` | `src/components/ui/material-symbol.tsx` | Icon |

## 2. Tham khảo (rules)

| Rule | Mục đích |
|---|---|
| `docs/CLAUDE.md` (mục 3, 4, 5, 6, 7, 8, 11) | Design tokens (primary #006194, tertiary #BA0035 chỉ cho Flash Sale), spacing, nút cao 40-48px, i18n, 4 trạng thái (loading/empty/error/data) |
| `.cursor/rules/component-pattern.mdc` | next/image, cva, alt tiếng Việt, MaterialSymbol |
| `.cursor/rules/i18n.mdc` | next-intl, namespace `storefront.flashSale.*` |
| `.cursor/rules/testing-required.mdc` | TDD: viết test RED trước khi sửa code |
| `.cursor/rules/layer-convention.mdc` | `src/features/flash-sale/**`, `src/components/storefront/flash-sale/**` |
| `.cursor/rules/features-migration.mdc` | Template feature module |
| `.cursor/rules/api-data.mdc` | api.ts → hooks.ts → types.ts → mock.ts |
| `.cursor/rules/error-handling.mdc` | ApiError, ErrorState, retry, toast |
| `.cursor/rules/websocket-realtime.mdc` | Tích hợp `useFlashSaleWs` cho stock realtime |
| `.cursor/rules/flash-sale-payment.mdc` | Stock bar, Countdown theo server time |

## 3. Subplan chia task

### Subplan A — Data layer (feature module) — **TDD trước**

- Tạo `src/features/flash-sale/`:
  - `types.ts` — types cho `FlashSaleSlot`, `FlashSaleItem`, `SlotStatus`, `LivePurchaseTick`
  - `api.ts` — API layer (`fetchFlashSaleSlots` đã có ở homepage — ta re-export + thêm `fetchLivePurchaseCount`)
  - `hooks.ts` — `useFlashSaleSlots` (re-export), `useFlashSaleItemById`, `useSetReminder` (mock mutation)
  - `mocks.ts` — mock 2 slot (1 active + 1 upcoming) với 10+5 items khớp DTO
  - `schemas.ts` — Zod schema validate mock data
  - `index.ts` — barrel
- TDD:
  - `hooks.test.tsx` — test `useFlashSaleSlots` (loading, success, error), filter theo status
  - `api.test.ts` — test mock data khớp schema Zod
  - `mocks.test.ts` — test mock có slot ACTIVE + UPCOMING

### Subplan B — Sub-components (ở `src/components/storefront/flash-sale/`)

- `FlashSaleHeroBanner.tsx` — banner rose-50 với badge "FLASH SALE" + "Hôm Nay" + trust badge
- `FlashSaleSlotNav.tsx` — sticky nav 5 slot (past/active/upcoming/tomorrow)
- `FlashSaleCountdownBar.tsx` — countdown + live viewer count + category filter chips
- `FlashSaleDealCard.tsx` — card sản phẩm với 3 variants: `default` / `almost-sold-out` (>90%) / `sold-out`
- `FlashSaleDealsGrid.tsx` — wrapper grid 5 cột, render list `FlashSaleDealCard`
- `FlashSaleUpcomingSection.tsx` — section "Khung giờ kế tiếp 15:00"
- `FlashSaleReminderButton.tsx` — button "Nhắc tôi" với state toggle
- `FlashSaleLiveIndicator.tsx` — pill cố định bottom-right
- `FlashSaleCategoryFilter.tsx` — chip filter theo danh mục
- `index.ts` — barrel

Tests:
- Mỗi component có smoke test (`render` + 4 trạng thái: loading/data/empty/error)
- `FlashSaleDealCard.test.tsx` — test 3 variants hiển thị đúng
- `FlashSaleReminderButton.test.tsx` — test click toggle state
- `FlashSaleSlotNav.test.tsx` — test active slot highlight

### Subplan C — Page content + route

- `src/components/storefront/flash-sale/FlashSalePageContent.tsx` — composition chính (kết hợp 6 section)
- Sửa `src/app/(storefront)/flash-sale/page.tsx` — render `<FlashSalePageContent />` (giữ wrapper từ stub)
- Test: `FlashSalePageContent.test.tsx` — smoke test 4 trạng thái

### Subplan D — i18n

- `messages/vi.json` — thêm `storefront.flashSale.*` (~50 keys)
- `messages/en.json` — same keys tiếng Anh
- Namespace con: `hero`, `slot`, `countdown`, `deal`, `upcoming`, `live`, `category`, `cta`

### Subplan E — Audit + Build + Lint

- `npm run test` PASS
- `npm run lint` PASS
- `npm run build` PASS
- `npx tsc --noEmit` PASS

## 4. Test Strategy

| Concern | Test |
|---|---|
| TDD: schema Zod | `mocks.test.ts` parse + reject invalid |
| TDD: hook `useFlashSaleSlots` | `hooks.test.tsx` với MSW + QueryClientProvider |
| Component `FlashSaleDealCard` 3 variants | snapshot test + render text check |
| Component `FlashSaleReminderButton` | userEvent click → state change |
| Component `FlashSaleSlotNav` | active slot có class khác |
| Page content smoke | render với QueryClientProvider + next-intl mock |

## 5. Audit file (Bước 5.0)

| File | Loại | Yêu cầu test |
|---|---|---|
| `types.ts` | types only | không cần test |
| `api.ts` | re-export + 1 new fn | test qua hook |
| `hooks.ts` | logic | **BẮT BUỘC test** |
| `mocks.ts` | data | **BẮT BUỘC test** (Zod schema) |
| `schemas.ts` | Zod | **BẮT BUỘC test** |
| `FlashSaleHeroBanner.tsx` | pure render | smoke |
| `FlashSaleSlotNav.tsx` | pure render + click | smoke + click test |
| `FlashSaleCountdownBar.tsx` | render + countdown logic | smoke |
| `FlashSaleDealCard.tsx` | 3 variants | **BẮT BUỘC test** (3 variants) |
| `FlashSaleDealsGrid.tsx` | render grid | smoke |
| `FlashSaleUpcomingSection.tsx` | render section | smoke |
| `FlashSaleReminderButton.tsx` | toggle state | **BẮT BUỘC test** (state) |
| `FlashSaleLiveIndicator.tsx` | render pill | smoke |
| `FlashSaleCategoryFilter.tsx` | render chips | smoke |
| `FlashSalePageContent.tsx` | composition + 4 trạng thái | **BẮT BUỘC test** |
| `page.tsx` | Server Component | không cần test |

## 6. Rủi ro & ước lượng

| Rủi ro | Mức | Đối sách |
|---|---|---|
| Backend `flash-sales/slots` chưa trả `category` field | TRUNG BÌNH | Mock 100% trong Subplan A; filter UI vẫn render nhưng disabled khi category trống |
| TS types backend thay đổi | THẤP | Mock + Zod schema cùng interface → BE update chỉ đổi URL |
| Quá nhiều component → commit lớn | TRUNG BÌNH | Tách 4 commit theo concern (data/components/page/i18n) |
| i18n keys lệch giữa vi/en | THẤP | Viết key song song cả 2 file cùng lúc |
| `useFlashSaleWs` chưa có (realtime stock) | CAO | **LOẠI** khỏi scope — trang chỉ hiển thị `availableStock` ban đầu, realtime update làm sau |
| Test cho 3 variants nhiều boilerplate | THẤP | dùng `it.each` hoặc helper `renderDealCard(variant)` |

**Ước lượng thời gian**: 3–4 giờ (full integration với tests).

**Quyết định phạm vi quan trọng**: 
- ❌ **KHÔNG tích hợp `useFlashSaleWs` (realtime stock update)** — tách ra plan riêng.
- ❌ **KHÔNG làm "Modal thêm vào giỏ"** — chỉ link tới product detail.
- ❌ **KHÔNG làm "Lọc theo danh mục" có query string** — render chip tĩnh lấy từ categories API.
- ✅ **Có Countdown động** theo `endsAt` từ slot.
- ✅ **Có 4 trạng thái** (loading/empty/error/data) cho mỗi list.
- ✅ **Có i18n đầy đủ** vi + en.
- ✅ **Có mobile responsive** (theo CLAUDE.md mục 10).
- ✅ **Có test** cho mọi file logic.

## 7. Tiêu chí Definition of Done

- [ ] Tất cả file logic có `.test.ts(x)` đi kèm PASS
- [ ] `npm run test` PASS
- [ ] `npm run lint` PASS
- [ ] `npm run build` PASS
- [ ] `npx tsc --noEmit` PASS
- [ ] Đủ 4 trạng thái UI (loading/empty/error/data)
- [ ] Đúng 1 nút primary trên màn (Mua ngay / Nhắc tôi tùy context)
- [ ] i18n đầy đủ vi + en (~50 keys mỗi file)
- [ ] Mobile 375px không tràn ngang
- [ ] Auto-commit theo concern (4 commit: data → components → page → i18n)
- [ ] Stock bar chỉ hiển thị số liệu, không realtime update (TODO comment cho plan sau)

## 8. Tham chiếu UI

| Section | Stitch line |
|---|---|
| Header + Top bar | `trang-flash-sale.md` L7–L36 |
| Nav pills | L37–L40 |
| Hero banner | L43–L66 |
| Sticky time slot nav | L69–L96 |
| Countdown + Filter | L99–L114 |
| Active deals grid (10 sp, 5-col) | L116–L444 |
| Upcoming section (5 sp) | L447–L623 |
| Live indicator pill | L626–L633 |
| Mobile preview (chỉ tham khảo, không làm riêng) | (trong section 6) |

## 9. Auto-commit strategy (4 commits)

```bash
# Commit 1: data layer (Subplan A) — types + mocks + schemas + hooks + tests
git commit -m "feat(flash-sale): add data layer with mocks, schemas, hooks"

# Commit 2: sub-components (Subplan B) — 9 components + tests
git commit -m "feat(flash-sale): add 9 UI sub-components for flash-sale page"

# Commit 3: page content + route (Subplan C) — composition + page.tsx replace
git commit -m "feat(flash-sale): wire FlashSalePageContent into /flash-sale route"

# Commit 4: i18n (Subplan D) — vi.json + en.json namespace
git commit -m "feat(flash-sale): add storefront.flashSale i18n keys (vi + en)"
```

## 10. Liên kết

- Stitch mock: `docs/superpowers/handoffs/trang-flash-sale.md`
- Source of Truth: `docs/CLAUDE.md`
- Layer convention: `.cursor/rules/layer-convention.mdc`
- Pattern component: `.cursor/rules/component-pattern.mdc`
- TDD rule: `.cursor/rules/testing-required.mdc`
- i18n rule: `.cursor/rules/i18n.mdc`
