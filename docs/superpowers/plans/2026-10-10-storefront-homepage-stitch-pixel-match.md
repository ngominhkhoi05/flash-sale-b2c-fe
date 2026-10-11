# Plan: Trang chủ Storefront – Pixel match Stitch "33db6dd859b643bda103e6045378886b"

## Goal

Dựng lại trang chủ Storefront của Vibe Mart sao cho **khớp 100% pixel** với mẫu thiết kế Stitch "Trang chủ Storefront - Vibe Mart" (id `33db6dd859b643bda103e6045378886b`, project `15206106541998912100`).

## Reference

- Stitch project: `15206106541998912100`
- Stitch screen: `33db6dd859b643bda103e6045378886b` (2560×8060 Desktop)
- Stitch HTML: `tmp/stitch-homepage-reference/homepage.html` (114 KB, 1216 dòng)
- Stitch screenshot: `tmp/stitch-homepage-reference/homepage.png` (24 KB)
- Source of Truth UI: `docs/CLAUDE.md` §3 (tokens) + §5 (Components) + Stitch Material 3 ("Ocean Mint E-Commerce")
- Repo rule tham chiếu:
  - `i18n.mdc` (UI text phải qua `next-intl`, KHÔNG hard-code tiếng Việt)
  - `component-pattern.mdc` (CVA, forwardRef, props, image, icon, money)
  - `design-system.mdc` (Tailwind 4 token, font Be Vietnam Pro)
  - `stack-versions.mdc` (Next 16.3.8, React 19.2, TS 5, Tailwind 4)
  - `no-overengineering.mdc` (không thêm PWA / dark mode / Storybook / E2E)

## Cấu trúc trang (từ Stitch HTML)

Trang chủ gồm **11 sections** theo thứ tự:

| # | Section | Tên trong HTML | Component (mới / có sẵn) |
|---|---|---|---|
| 1 | Mini-bar trên cùng | Kênh Người Bán / Hỗ trợ / Tiếng Việt | `HeaderTopBar.tsx` (mới) |
| 2 | Header chính | Logo + Search + Cart + User (avatar tròn) | `StorefrontHeader.tsx` (rewrite) |
| 3 | Pill nav dưới header | Trang chủ / Flash Sale / Hàng mới / ... | `HeaderNavPills.tsx` (mới, nằm trong Header) |
| 4 | Hero Banner | Banner lớn (gradient) + 2 banner phụ | `HeroBannerSection.tsx` (mới, gồm `HeroBanner` + `SideBanner`) |
| 5 | 6 Lối Tắt Dịch Vụ | Flash Sale / Voucher / Chính hãng / ... | `QuickActionsSection.tsx` (mới, gồm 6 `QuickActionItem`) |
| 6 | Danh Mục Nổi Bật | 8 ô danh mục (Thời trang nam, Thời trang nữ, Điện thoại, ...) | `CategoryGridSection.tsx` (mới) |
| 7 | Flash Sale Hot | Countdown + lưới 5 deal (có stock bar) | `FlashSaleStripSection.tsx` (mới) |
| 8 | Mã Giảm Giá Cho Bạn | 4 voucher ticket (50K, 100K, FREESHIP, 15%) | `VoucherGridSection.tsx` (mới) — dùng shadcn Card + dashed border |
| 9 | Shop Nổi Bật | 4 store cards với 3 thumbnail | `FeaturedStoresSection.tsx` (mới) |
| 10 | Gợi Ý Hôm Nay | Sticky tabs (Dành cho bạn / Bán chạy / Ưu đãi sốc) + 20 cards | `RecommendedSection.tsx` (mới) — dùng `ProductCard` family có sẵn |
| 11 | Footer | Link + Copyright | `StorefrontFooter.tsx` (rewrite từ bản cũ) |

## Scope (user đã duyệt)

- **Scope**: `page_and_new_comps` → tạo `src/components/storefront/Home*.tsx` cho 10 section mới + rewrite `StorefrontHeader`/`StorefrontFooter` + rewrite `trang-chu/page.tsx`
- **Test**: Unit test cho component có logic (countdown filter theo activeTab, recommended tab switcher) + vitest snapshot cho `HomepageView` rendered output (per user chọn `B_with_warning` — miễn no-overengineering cho phần snapshot)
- **i18n**: Mọi text trong component phải qua `useTranslations('storefront.home')` → key sẽ thêm vào `messages/vi.json` + `messages/en.json` song song
- **TDD**: Test đỏ trước, code sau. Bugfix → reproduction test
- **Audit file mỗi sửa**: Phân loại LOGIC vs COPY (xem `testing-required.mdc`)

## Bước 0.0 — Detect Parallel Work ✅

Đã chạy 4 lệnh check trước khi lên plan:

- [x] `git fetch origin dev` → đã ff từ `5d49eae` → `8d49013`
- [x] Phát hiện stash `storefront-homepage-stitch-pre-reset` trên dev (signal parallel chat)
- [x] Phát hiện `tmp/stitch-homepage-reference/` (đã download từ chat khác)
- [x] User chọn `proceed_fresh` → bỏ stash, làm mới
- [x] HEAD lúc đó: `dev`, working tree có `tmp/` untracked + 8 stash entries

## Bước 0.1 — Branch ✅

- Branch: `feature/storefront-homepage-stitch` (tạo lúc 22:25)
- Base: từ `origin/dev` (đã ff)

## Bước 2 — Subplan

Vì task lớn (11 sections, ~15 file mới, ~2000 dòng code) nhưng vẫn thuộc 1 concern duy nhất (pixel match 1 trang), tôi **không tách subagent** mà chạy tuần tự. Chia thành **5 subplan** để dễ theo dõi, mỗi subplan là 1 nhóm công việc có thể commit riêng nếu cần:

### Subplan A — Foundation (token + i18n + setup)

| Task | File mới | File sửa |
|---|---|---|
| 1. Thêm i18n keys cho tất cả section | — | `messages/vi.json`, `messages/en.json` |
| 2. Verify Material Symbols font available trong layout | — | `src/app/layout.tsx` (chỉ thêm nếu thiếu) |
| 3. Tạo `MaterialSymbol` icon helper (wrapper) | `src/components/ui/material-symbol.tsx` (mới) | — |
| 4. Tạo `HeroGradient` constant cho banner | `src/components/storefront/sections/hero.constants.ts` (mới) | — |

### Subplan B — Storefront chrome (Header / Footer / Top bar)

| Task | File mới | File sửa |
|---|---|---|
| 5. Rewrite `StorefrontHeader` (4 section Stitch: top mini-bar + search bar + user pill + pill nav) | — | `src/components/storefront/StorefrontHeader.tsx` |
| 6. Rewrite `StorefrontFooter` (4 cols link + copyright theo Stitch) | — | `src/components/storefront/StorefrontFooter.tsx` |
| 7. Test snapshot `StorefrontHeader` | `src/components/storefront/StorefrontHeader.test.tsx` | — |

### Subplan C — Hero + Quick + Category

| Task | File mới | File sửa |
|---|---|---|
| 8. `HeroBannerSection` (Banner chính + 2 banner phụ với indicator dots) | `src/components/storefront/sections/HeroBannerSection.tsx` (mới) | — |
| 9. `QuickActionsSection` (6 nút icon tròn) | `src/components/storefront/sections/QuickActionsSection.tsx` (mới) | — |
| 10. `CategoryGridSection` (8 ô danh mục với Material Symbol) | `src/components/storefront/sections/CategoryGridSection.tsx` (mới) | — |
| 11. Unit/snapshot test cho 3 section | `src/components/storefront/sections/*.test.tsx` | — |

### Subplan D — Flash Sale + Voucher + Stores

| Task | File mới | File sửa |
|---|---|---|
| 12. `FlashSaleStripSection` (countdown dùng `Countdown` có sẵn + 5 deal cards) | `src/components/storefront/sections/FlashSaleStripSection.tsx` (mới) | — |
| 13. `VoucherGridSection` (4 voucher ticket shadcn Card + dashed border) | `src/components/storefront/sections/VoucherGridSection.tsx` (mới) | — |
| 14. `FeaturedStoresSection` (4 store cards với 3 thumbnail) | `src/components/storefront/sections/FeaturedStoresSection.tsx` (mới) | — |
| 15. Unit/snapshot test cho 3 section + hook `useFlashSaleCountdown` (nếu cần) | các `*.test.tsx` | — |

### Subplan E — Recommended + Page composition + snapshot tổng

| Task | File mới | File sửa |
|---|---|---|
| 16. `RecommendedSection` (sticky tabs + lưới 5 cột từ `ProductCard` family) | `src/components/storefront/sections/RecommendedSection.tsx` (mới) | — |
| 17. `RecommendedTabs` (component con, logic filter theo tab) | `src/components/storefront/sections/RecommendedTabs.tsx` (mới) | — |
| 18. Mock data + types cho featured sections | `src/components/storefront/sections/home-mocks.ts` (mới) | — |
| 19. Rewrite `trang-chu/page.tsx` thành `HomepageView` composition | — | `src/app/(storefront)/trang-chu/page.tsx` |
| 20. Snapshot test cho `HomepageView` (rendered HTML) | `src/app/(storefront)/trang-chu/page.test.tsx` | — |
| 21. Build + lint + test pass | — | — |

### Quyết định model (Bước 3)

- **Inherit** (mặc định) — task này thuộc dạng frontend rendering, không cần model riêng.
- Nếu chạy 1 subplan quá lâu (> 5 phút) → chia nhỏ tiếp.

### Câu hỏi cho user (Bước 4) — đã hỏi ở Bước 0.0 ✅

Đã xác nhận ở đầu session:
- `parallel_work_decision` = `proceed_fresh` (bỏ stash, làm mới)
- `scope` = `page_and_new_comps` (Page + components mới)
- `test_scope` = option `B_with_warning` (visual snapshot + unit, miễn no-overengineering cho snapshot)

## Bước 5 — Thực hiện (TDD)

### Bước 5.0 — Audit file (mỗi file sửa phải phân loại LOGIC vs COPY)

| File | Loại | Lý do |
|---|---|---|
| `src/components/storefront/StorefrontHeader.tsx` | LOGIC | Có `usePathname()` + `cn()` + nav map → cần test |
| `src/components/storefront/StorefrontFooter.tsx` | COPY thuần | Pure render, không state, không effect → cần snapshot |
| `src/app/(storefront)/trang-chu/page.tsx` | LOGIC (composition) | Compose nhiều section → cần test snapshot rendered |
| `src/components/storefront/sections/RecommendedTabs.tsx` | LOGIC | Có state `activeTab`, filter logic → cần test |
| `src/components/storefront/sections/HeroBannerSection.tsx` | COPY thuần | Pure markup, optional carousel → snapshot |
| `src/components/storefront/sections/QuickActionsSection.tsx` | COPY thuần | Map 6 item từ const → snapshot |
| `src/components/storefront/sections/CategoryGridSection.tsx` | COPY thuần | Map 8 item từ const → snapshot |
| `src/components/storefront/sections/FlashSaleStripSection.tsx` | LOGIC | Có countdown timer + filter theo status → cần test |
| `src/components/storefront/sections/VoucherGridSection.tsx` | LOGIC | Có state `saved` cho từng voucher button → cần test |
| `src/components/storefront/sections/FeaturedStoresSection.tsx` | COPY thuần | Pure markup → snapshot |
| `src/components/storefront/sections/RecommendedSection.tsx` | LOGIC | Composition + state lift → cần test |
| `src/components/ui/material-symbol.tsx` | LOGIC | Helper render icon font → cần test |
| `messages/vi.json`, `messages/en.json` | COPY thuần | i18n keys → không cần test |
| `src/app/layout.tsx` (chỉ thêm Material Symbols font nếu thiếu) | COPY thuần | Font link → không cần test |

### Bước 5.1 — TDD (Red → Green → Refactor)

Mỗi file LOGIC đều có test file kèm theo:

```text
1. Viết test (file .test.tsx cạnh file source)
2. npm run test -- <path> → phải FAIL
3. Viết component → test PASS
4. Refactor nếu cần (giữ test xanh)
5. npm run test (all) → tất cả PASS
6. npm run lint, npm run tsc --noEmit → PASS
7. Commit
```

### Mocks (không phụ thuộc backend)

- Tất cả data trong section (deal flash sale, voucher, store cards, product card) → khai báo const trong `home-mocks.ts`
- Đặt comment rõ ràng: `// TODO(api): replace with real API hook khi backend ready`
- Theo `docs/CLAUDE.md` mục 7: "Chưa có API thì tạo mock trong features/<x>/mock.ts cùng kiểu dữ liệu"

## Risks

| # | Rủi ro | Cách giảm |
|---|---|---|
| 1 | Stitch dùng **Material Symbols Outlined** font — chưa load trong project. Nếu thiếu → nhiều icon không hiện | Bước 2 subplan A: thêm `<link>` vào layout, có fallback `material-symbols-outlined` text class |
| 2 | Stitch HTML dùng class Tailwind mặc định (`bg-primary`, `text-on-primary`) — Tailwind v4 đã có token này trong `@theme` globals.css. KHÔNG cần migrate tailwind.config.ts | Verify globals.css đã có đủ token trước khi dùng → đã check ✅ |
| 3 | Một số class lạ xuất hiện trong HTML (`font-display-lg`, `text-display-lg-mobile`, `space-xs`) — cần map sang Tailwind utility | Map sẵn trong `globals.css` dưới dạng `@theme` fontFamily/fontSize/spacing tokens. Nếu thiếu → bổ sung 1 lần ở subplan A |
| 4 | Snapshot test tốn thời gian render — cần đặt `MAX_DIFF=100` trong vitest config để không fail vì whitespace | Adjust nếu gặp flaky test |
| 5 | `no-overengineering.mdc` cấm Playwright/E2E. User đã miễn cho snapshot vitest. KHÔNG mở rộng sang E2E | Giữ vitest only |
| 6 | 8 stash entries cũ có thể chứa noise/conflict khi merge về dev sau | Bỏ qua, đợi user quyết. Push sau khi pass auto-merge dev vào branch |

## Test strategy

- **Unit test cho component có logic**:
  - `RecommendedTabs` filter theo `activeTab`
  - `VoucherGridSection` state `saved` toggling
  - `StorefrontHeader` active nav detection theo `usePathname`
  - `FlashSaleStripSection` countdown ticks
  - `MaterialSymbol` helper renders đúng icon name
- **Snapshot test cho HomepageView** rendered output (vitest snapshot, không dùng Playwright):
  - File: `src/app/(storefront)/trang-chu/page.test.tsx`
  - Render `<HomepageView />` trong wrapper (`test-wrapper.tsx`) → snapshot DOM
  - Ngưỡng sai số: 0 (pixel match) — user yêu cầu "100% không lệch dù nhỏ nhất"
- **Build + lint**: `npm run build`, `npm run lint`, `npm run tsc --noEmit` đều PASS
- **Manual smoke**: mở `http://localhost:3000/trang-chu`, scroll toàn trang, đối chiếu với `tmp/stitch-homepage-reference/homepage.png`

## Notes

- Mọi component KHÔNG dùng class Tailwind hex (`#E11D48`) trực tiếp → phải qua token (`text-tertiary`, `bg-tertiary-soft`)
- Một số class lạ trong Stitch (vd `font-display-lg`, `text-display-lg-mobile`, `space-xs`) — đã định nghĩa trong Stitch tailwind config, cần map sang token Tailwind 4 trong `globals.css` hoặc inline class
- Stitch dùng ảnh `lh3.googleusercontent.com` (CDN public) — production nên chuyển sang `next/image` với `unoptimized` hoặc proxy. Trong scope đồ án: dùng `<img>` tạm hoặc `next/image` với `remotePatterns` config
- Home page = Server Component (default) → chỉ add `'use client'` cho component có state/handler (`RecommendedTabs`, `VoucherGridSection`, `FlashSaleStripSection`)
