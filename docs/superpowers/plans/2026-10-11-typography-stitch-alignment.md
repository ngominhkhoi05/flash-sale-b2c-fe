# Plan – Typography: align toàn trang với Stitch design system

**Date**: 2026-10-11
**Branch**: `feature/storefront-homepage-stitch`
**Owner**: agent (user review cuối)

## Scope

Fix typography toàn bộ ứng dụng (Storefront + Seller + Admin + Auth) cho khớp với Stitch design system (project 15206106541998912100, design MD "Ocean Mint E-Commerce"). User xác nhận phạm vi: **all-portals**.

## Vấn đề hiện tại

| # | Vấn đề | Triệu chứng |
|---|---|---|
| 1 | `Be_Vietnam_Pro` chỉ load weight 400/500/600 | Class `font-bold` (700) fallback về system font |
| 2 | `globals.css` chưa có token `font-size/line-height/font-weight` | Class `font-headline-md text-headline-md leading-...` không generate → Tailwind warn hoặc fallback |
| 3 | `<body>` không có `font-sans` | Font mặc định browser áp dụng, không dùng `--font-sans` đã define |
| 4 | `<body>` dùng `bg-page text-ink` (semantic alias cũ) | Vẫn work vì alias còn define, nhưng không nhất quán với migration `primary` |
| 5 | `<body>` dùng `min-h-full` + `flex flex-col` | Cần `min-h-screen` để content ngắn vẫn fill viewport |

## Tham khảo

- `docs/CLAUDE.md` mục 3 (typography spec)
- Stitch design MD (output từ `get_project` ngày 2026-10-11, đã cache ở plan này)
- `.cursor/rules/stack-versions.mdc` (Be Vietnam Pro requirement)
- `.cursor/rules/component-pattern.mdc` (font token usage)

## Subplan

1 concern duy nhất: **Typography**. Tách 4 commit theo tier (pre-commit cho phép):
- Commit 1: `chore(theme): add typography tokens + Be Vietnam Pro 700 weight`
- Commit 2: `fix(layout): apply font-sans to body + fix min-h-screen`
- Commit 3: `refactor(storefront): migrate components to typography tokens`
- Commit 4: `refactor(seller|admin|auth): migrate components to typography tokens`

## Files thay đổi

### Tier 1 — Foundation (1 file + layout.tsx)

| File | Loại | Thay đổi |
|---|---|---|
| `src/app/globals.css` | LOGIC (config) | Thêm 12 typography token + 3 line-height scale vào `@theme` |
| `src/app/layout.tsx` | LOGIC (config) | Thêm `"700"` vào `weight` của `Be_Vietnam_Pro`; thêm `font-sans` cho body; `bg-page` → `bg-background`; `min-h-full` → `min-h-screen` |

### Tier 2 — Layouts (4 file)

| File | Loại | Thay đổi |
|---|---|---|
| `src/app/(auth)/layout.tsx` | LOGIC (config) | Thêm `font-sans` nếu cần (đọc để confirm) |
| `src/app/(storefront)/layout.tsx` | LOGIC (config) | Thêm `font-sans` nếu cần |
| `src/app/seller/layout.tsx` | LOGIC (config) | Thêm `font-sans` nếu cần |
| `src/app/admin/layout.tsx` | LOGIC (config) | Thêm `font-sans` nếu cần |

### Tier 3 — Components (10 file)

| File | Loại | Thay đổi |
|---|---|---|
| `src/components/storefront/StorefrontHeader.tsx` | LOGIC | Replace `text-2xl font-bold` etc → token |
| `src/components/storefront/StorefrontFooter.tsx` | LOGIC (vừa sửa) | Verify dùng token đúng |
| `src/components/storefront/sections/HeroBannerSection.tsx` | LOGIC | Replace |
| `src/components/storefront/sections/CategoryGridSection.tsx` | LOGIC | Replace |
| `src/components/storefront/sections/FlashSaleStripSection.tsx` | LOGIC | Replace |
| `src/components/storefront/sections/VoucherGridSection.tsx` | LOGIC | Replace |
| `src/components/storefront/sections/FeaturedStoresSection.tsx` | LOGIC | Replace |
| `src/components/storefront/sections/QuickActionsSection.tsx` | LOGIC | Replace |
| `src/components/storefront/sections/RecommendedTabs.tsx` | LOGIC | Replace |
| `src/components/auth/AuthHeader.tsx` | LOGIC | Replace |

### Tier 4 — Tests (verify no regression)

- Toàn bộ test suite đã chạy (246 tests) phải PASS sau khi sửa.
- Không cần test mới vì đây là visual + token definition; verify qua grep + manual.

## Typography token spec (theo Stitch)

Tailwind 4 `@theme` syntax: `--text-{name}: {size};` tự generate class `text-{name}` với size + line-height + font-weight kèm theo. Để control weight, dùng `--text-{name}--line-height: {lh};` và `--text-{name}--font-weight: {fw};`.

```css
@theme {
  --text-display-lg: 36px;
  --text-display-lg--line-height: 44px;
  --text-display-lg--font-weight: 700;
  --text-display-lg-mobile: 28px;
  --text-display-lg-mobile--line-height: 36px;
  --text-display-lg-mobile--font-weight: 700;
  --text-headline-lg: 24px;
  --text-headline-lg--line-height: 32px;
  --text-headline-lg--font-weight: 600;
  --text-headline-md: 20px;
  --text-headline-md--line-height: 28px;
  --text-headline-md--font-weight: 600;
  --text-headline-sm: 18px;
  --text-headline-sm--line-height: 24px;
  --text-headline-sm--font-weight: 600;
  --text-body-lg: 16px;
  --text-body-lg--line-height: 24px;
  --text-body-lg--font-weight: 400;
  --text-body-md: 14px;
  --text-body-md--line-height: 20px;
  --text-body-md--font-weight: 400;
  --text-body-sm: 12px;
  --text-body-sm--line-height: 16px;
  --text-body-sm--font-weight: 400;
  --text-label-lg: 14px;
  --text-label-lg--line-height: 20px;
  --text-label-lg--font-weight: 600;
  --text-label-md: 12px;
  --text-label-md--line-height: 16px;
  --text-label-md--font-weight: 500;
  --text-label-sm: 10px;
  --text-label-sm--line-height: 14px;
  --text-label-sm--font-weight: 600;
  --text-price-lg: 20px;
  --text-price-lg--line-height: 24px;
  --text-price-lg--font-weight: 700;
  --text-price-md: 16px;
  --text-price-md--line-height: 20px;
  --text-price-md--font-weight: 700;
}
```

Cú pháp này (Tailwind 4 `@theme` namespace syntax) tự generate utility class `text-headline-md` với cả 3 thuộc tính (size + lh + weight). Không cần class `font-headline-md leading-headline-md` riêng.

## Migration pattern

| Trước | Sau |
|---|---|
| `font-headline-md text-headline-md leading-7` | `text-headline-md` |
| `text-2xl font-bold leading-8` | `text-headline-md` (20px/28px/600) hoặc `text-display-lg-mobile` (mobile) |
| `text-sm font-semibold` | `text-label-lg` (14px/600) hoặc `text-label-md` (12px/500) |
| `text-xs` (12px) | `text-body-sm` (12px) hoặc `text-label-md` (12px) |
| `font-bold tabular-nums` (price) | `text-price-lg tabular-nums` (20px/700) |

## Test strategy

- Build: `npm run build` không lỗi
- Lint: `npm run lint` không lỗi mới
- Test: `npm run test` 246/246 PASS
- TypeScript: `npx tsc --noEmit` clean
- Manual: mở `localhost:3000` → trang chủ + seller dashboard + admin + auth → đối chiếu Stitch

## Out of scope

- Tweak line-height cho mobile (để sau)
- Fix component đang dùng `<p class="text-base">` Tailwind thường (KHÔNG dùng token) — Stitch không bắt buộc, giữ nguyên
- Refactor từng variant font trong CVA component

## Risks

| Risk | Mitigation |
|---|---|
| Token Tailwind 4 syntax sai → class không generate → 246 test fail | Test toàn bộ suite NGAY SAU khi thêm token; revert nếu fail |
| Class `text-headline-md` có thể đụng class Tailwind built-in | Tailwind 4 cho phép custom token trùng tên → OK |
| Component seller/admin dùng Geist (default) → sau khi add `font-sans` to body sẽ bị nhảy font → break UI | Tier 2 chỉ replace class, KHÔNG đổi font chính. Tất cả page đều dùng Be Vietnam Pro rồi. |
| Tier 4 layout.tsx body class change có thể ảnh hưởng color (bg-page → bg-background) | Verify trong globals.css 2 alias vẫn tồn tại → bg-page work |

## Implementation order

1. **Tier 1.1** — Thêm 12 typography token vào `globals.css` `@theme`
2. **Tier 1.2** — Thêm `"700"` weight vào `Be_Vietnam_Pro` trong `layout.tsx`
3. **Tier 1.3** — Thêm `font-sans` cho `<body>`, fix `min-h-full` → `min-h-screen`
4. **Run test** — 246/246 phải PASS (token mới không break class cũ)
5. **Tier 2** — Sửa 4 layout files nếu cần `font-sans` riêng
6. **Tier 3** — Sửa 10 components (theo từng file, không gộp)
7. **Run test + lint + tsc** — tất cả PASS
8. **Auto-commit** — tách 3-4 commit theo tier

## Notes

- Stitch `display-lg` (36px) dùng cho marketing banner trang chủ — KHÔNG dùng cho card hoặc body
- Mobile: `display-lg` → `display-lg-mobile` (28px) — cần thêm responsive variant `md:text-display-lg`
- `tabular-nums` áp dụng cho price (`text-price-lg tabular-nums`)
- `font-bold` Tailwind mặc định = 700. Nếu thêm `font-bold` không có token riêng, Tailwind vẫn generate class `font-bold` → OK, không cần đổi
