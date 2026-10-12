# Plan: Not Found (404) Page – Stitch-Pixel-Perfect

> **Source of design**: Stitch screen `projects/15206106541998912100/screens/211f1b0c78254f89b529c59ba14fd9eb`
> "Màn hình Lỗi 404 - Vibe Mart" (DESKTOP 2560×2048)
> **Yêu cầu user**: giống toàn bộ mọi thứ (visual + copy + icon), đụng tất cả file liên quan.
> **Branch**: `feat/not-found-page-stitch` (đã tạo từ `origin/dev` ở Bước 0.1)

## 1. Scope

Biến `src/app/not-found.tsx` từ stub 22 dòng (text + Button) thành trang 404 đầy đủ pixel-perfect theo thiết kế Stitch, với:

- Brand pill ở top
- SVG 404 centerpiece (2 số "4" + magnifying glass disc thay cho "0", với sad-package shape bên trong lens)
- H1 title + description
- 2 action buttons (primary "Về trang chủ", secondary "Quay lại" với `history.back()`)
- Hints row (gợi ý kiểm tra URL + 2 quick-link "Hỗ trợ khách hàng" / "Tìm kiếm sản phẩm")
- i18n đầy đủ `vi` + `en`
- Test component

## 2. Tham khảo (Source of Truth priority)

1. **Stitch source HTML** (đã tải về `docs/superpowers/plans/stitch-404-source.html`) — nguyên mẫu.
2. **Stitch screenshot** (`docs/superpowers/plans/stitch-404-screenshot.png`) — visual reference.
3. `docs/CLAUDE.md` § 3 (design tokens), § 6 (i18n), § 10 (responsive & a11y).
4. `src/app/globals.css` — đã khai báo đủ tokens: `primary`, `primary-fixed`, `primary-fixed-dim`, `surface-container`, `surface-container-low`, `surface-container-lowest`, `surface-container-high`, `secondary`, `secondary-fixed`, `secondary-container`, `tertiary`, `outline`, `outline-variant`, `on-surface`, `on-surface-variant` + spacing `space-xs/sm/md/lg/xl` + typography `display-lg`, `headline-sm`, `body-lg`, `body-sm`, `label-md`, `label-sm`, `label-lg`.
5. `src/app/layout.tsx` — Material Symbols font đã load sẵn ở `<head>`.
6. `src/components/ui/material-symbol.tsx` — helper render icon (vừa fix inline font-size ở commit 13ac6df).
7. `next-intl` — sẵn (`I18nProvider` mount ở root, locale `vi` default).
8. `src/components/forbidden/ForbiddenPage.tsx` — pattern tương tự (page-level watermark + glow + brand pill).

## 3. Cấu trúc thiết kế Stitch cần tái dựng

| Vùng | Nội dung | Stitch class gốc | Map sang dự án |
|---|---|---|---|
| Background watermark | "shopping_bag VIBE MART" mờ 3% | `bg-surface` + `opacity-[0.03]` + `material-symbols-outlined text-[120px]` + `font-bold text-[100px]` | Giữ nguyên (token đủ) |
| Glow backdrop 1 | Blob primary-fixed 40% top-center | `bg-primary-fixed/40 blur-3xl` | Dùng `color-mix` với `--color-primary-fixed` 40% |
| Glow backdrop 2 | Blob secondary-fixed 30% dưới trái | `bg-secondary-fixed/30 blur-3xl` | Dùng `color-mix` với `--color-secondary-fixed` 30% |
| Brand pill | Icon `shopping_bag` 16px trong ô primary 24px + "VIBE MART" headline-sm + dot secondary 1.5px + "Lỗi 404" label-sm | `rounded-full bg-surface-container shadow-sm` | OK |
| SVG 404 (340×150 mobile → 460×190 desktop) | 2 số "4" BeVietnam 800/160px, fill `primary-fixed`, stroke `primary` 5px, dropShadow #006194/12% blur 16. Center "0" = magnifying glass (rim 62px outline-variant, lens 54px white, sad package shape, handle 12px stroke angled) | Custom SVG | Tạo trong component |
| Title | "Không tìm thấy trang" (display-lg 36px/700) | `font-bold text-on-surface tracking-tight` | OK |
| Description | "Trang bạn tìm có thể đã bị xóa hoặc đổi địa chỉ." (body-lg 16px/400 on-surface-variant, max-w-md) | `leading-relaxed` | OK |
| Primary action | "Về trang chủ" → `/` (Stitch dùng `/`, dự án ta dùng `/trang-chu` theo rule §9) | `rounded-xl bg-primary text-on-primary px-8 py-3.5` + icon `home` 20px filled + group-hover translate-y | OK (đổi href từ `/` → `/trang-chu`) |
| Secondary action | "Quay lại" button với `onclick="history.back()"` | `rounded-xl bg-surface-container text-on-surface px-6 py-3.5` + icon `arrow_back` 20px | OK |
| Hint 1 | "Gợi ý: Kiểm tra lại đường dẫn URL hoặc quay lại trang trước" (info 16px primary + body-sm text-outline) | `flex items-center gap-2` | OK |
| Hint 2 | "Cần hỗ trợ ngay? · [Hỗ trợ khách hàng] · [Tìm kiếm sản phẩm]" (label-md 12px text-primary, dot outline-variant) | 2 link inline + dot separator | OK |

## 4. SVG 404 — chi tiết kỹ thuật

ViewBox: `0 0 460 190` (responsive: 340×150 mobile → 460×190 desktop)

```svg
<filter id="softGlow">
  <feDropShadow dx="0" dy="8" flood-color="#006194" flood-opacity="0.12" stdDeviation="16"/>
</filter>

<!-- Left 4 -->
<text fill="#cce5ff" filter="url(#softGlow)" font-family="Be Vietnam Pro, sans-serif"
      font-size="160" font-weight="800" stroke="#006194" stroke-width="5"
      text-anchor="middle" x="75" y="155">4</text>

<!-- Center "0" = magnifying glass @ (230, 85) -->
<g transform="translate(230, 85)">
  <circle cx="0" cy="0" fill="#eaedff" r="62" stroke="#bfc7d2" stroke-width="2"/>
  <circle cx="0" cy="0" fill="#ffffff" r="54" stroke="#006194" stroke-width="5"/>
  <path d="M -32 -24 A 42 42 0 0 1 18 -42" fill="none" stroke="#93ccff" stroke-linecap="round" stroke-width="4"/>
  <circle cx="20" cy="-20" fill="#93ccff" r="4"/>
  <!-- Sad/lost package inside lens -->
  <path d="M -16 -4 L 0 -14 L 16 -4 L 16 16 L 0 24 L -16 16 Z" fill="#f2f3ff" stroke="#006194" stroke-width="2.5"/>
  <path d="M 0 -14 L 0 24" stroke="#006194" stroke-width="2"/>
  <path d="M -16 -4 L 0 5 L 16 -4" stroke="#006194" stroke-width="2"/>
  <path d="M -5 11 Q 0 8 5 11" fill="none" stroke="#ba0035" stroke-width="2"/>
  <!-- Handle -->
  <line stroke="#006194" stroke-width="12" x1="40" x2="68" y1="40" y2="68"/>
  <line stroke="#93ccff" stroke-width="4" x1="42" x2="66" y1="42" y2="66"/>
</g>

<!-- Right 4 -->
<text fill="#cce5ff" filter="url(#softGlow)" font-family="Be Vietnam Pro, sans-serif"
      font-size="160" font-weight="800" stroke="#006194" stroke-width="5"
      text-anchor="middle" x="385" y="155">4</text>
```

Colors map to tokens:
- `#006194` → `var(--color-primary)` (stroke + handle main)
- `#cce5ff` → `var(--color-primary-fixed)` (text fill)
- `#93ccff` → `var(--color-primary-fixed-dim)` (lens reflection + inner handle)
- `#eaedff` → `var(--color-surface-container)` (outer rim)
- `#bfc7d2` → `var(--color-outline-variant)` (rim stroke)
- `#f2f3ff` → `var(--color-surface-container-low)` (package body)
- `#ba0035` → `var(--color-tertiary)` (sad mouth)

## 5. i18n keys (cần thêm)

Namespace mới: `error.notFound` (parallel với `error.forbidden`)

### vi.json

```json
"notFound": {
  "brandTag": "VIBE MART",
  "idBadge": "Lỗi 404",
  "title": "Không tìm thấy trang",
  "description": "Trang bạn tìm có thể đã bị xóa hoặc đổi địa chỉ.",
  "primaryAction": "Về trang chủ",
  "secondaryAction": "Quay lại",
  "hintPrefix": "Gợi ý:",
  "hintText": "Kiểm tra lại đường dẫn URL hoặc quay lại trang trước",
  "supportPrompt": "Cần hỗ trợ ngay?",
  "supportLink": "Hỗ trợ khách hàng",
  "searchLink": "Tìm kiếm sản phẩm"
}
```

### en.json

```json
"notFound": {
  "brandTag": "VIBE MART",
  "idBadge": "Error 404",
  "title": "Page not found",
  "description": "The page you're looking for may have been removed or moved.",
  "primaryAction": "Back to home",
  "secondaryAction": "Go back",
  "hintPrefix": "Tip:",
  "hintText": "Check the URL or return to the previous page",
  "supportPrompt": "Need help?",
  "supportLink": "Customer support",
  "searchLink": "Search products"
}
```

## 6. Cấu trúc file

```
src/
  app/
    not-found.tsx                   # Page-level (Server Component, không cần client)
  components/
    not-found/
      NotFoundPage.tsx              # Client Component (vì cần history.back + Link)
      NotFoundPage.test.tsx         # Component test
      Error404Illustration.tsx      # SVG illustration tách riêng
  i18n/
    messages/vi.json (modify)       # thêm error.notFound
    messages/en.json (modify)       # thêm error.notFound
```

**Quyết định**: KHÔNG dùng Server Component cho `NotFoundPage` vì cần:
- `onClick={() => history.back()}` (client only)
- Tách `NotFoundPage` thành client component cho rõ ràng (parallel `ForbiddenPage` đã là client).

`src/app/not-found.tsx` là Server Component (entry Next.js) chỉ render `<NotFoundPage />`.

## 7. Test strategy

- **Snapshot test**: render `<NotFoundPage />` với i18n `vi` + so sánh snapshot.
- **Brand pill**: kiểm tra hiển thị "VIBE MART" + "Lỗi 404".
- **Title + description**: kiểm tra i18n keys hiển thị.
- **Primary action**: link `href="/trang-chu"` + text "Về trang chủ" + icon `home`.
- **Secondary action**: button type + onClick (khó test, dùng `getByRole` thay vì click).
- **Hints**: kiểm tra text + 2 link "Hỗ trợ khách hàng" / "Tìm kiếm sản phẩm".
- **SVG illustration**: kiểm tra render (testid `error-404-illustration`).
- **i18n en**: kiểm tra "Page not found" + "Back to home" + "Go back" + "Customer support" + "Search products".

## 8. Phạm vi thay đổi

| # | File | Loại | Mô tả |
|---|---|---|---|
| 1 | `src/components/not-found/NotFoundPage.tsx` | add | Client component, pixel-perfect 404 |
| 2 | `src/components/not-found/NotFoundPage.test.tsx` | add | Component test (i18n + DOM) |
| 3 | `src/components/not-found/Error404Illustration.tsx` | add | SVG illustration tách riêng |
| 4 | `src/app/not-found.tsx` | modify | Thay stub 22 dòng → `<NotFoundPage />` |
| 5 | `messages/vi.json` | modify | Thêm `error.notFound` |
| 6 | `messages/en.json` | modify | Thêm `error.notFound` |

## 9. Risks & Notes

- **SVG trong component**: copy y nguyên từ Stitch HTML. Có thể có warning hydration nếu dùng `text` với font-family trong SVG. Sẽ dùng `dangerouslySetInnerHTML` hoặc hard-code trong JSX.
- **`history.back()` button**: phải là `<button type="button" onClick={() => history.back()}>`.
- **Image source từ Stitch HTML**: KHÔNG có ảnh bitmap nào ngoài SVG, nên không cần download asset.
- **Stitch `href="/"`** (Về trang chủ) → đổi thành `href="/trang-chu"` theo rule §2 (URL tiếng Việt không dấu) + §9 (Storefront home = trang-chu).
- **Stitch support/search links `href="#support"`** / `"#search"` → giữ nguyên placeholder anchor (chưa có route). KHÔNG đổi.
- **`/search` route** (Tìm kiếm sản phẩm): theo `docs/CLAUDE.md` § 2 có route `/tim-kiem`. Nhưng Stitch dùng `#search` (anchor). Giữ nguyên Stitch pattern → `#search` (anchor) để giữ pixel-perfect. Trong report sẽ ghi TODO để user quyết định sau.
- **Stitch hint section** dùng cả 2 loại icon (info 16px cho hint, support_agent/manage_search 16px cho link) — render bằng `MaterialSymbol` component.
- **Font Be Vietnam Pro**: layout.tsx đã load, nên SVG `text` sẽ dùng đúng font.

## 10. Test plan

```bash
# Verify tsc + lint + test
npx tsc --noEmit
npx vitest run src/components/not-found/
npx vitest run  # full suite
```

**Tất cả test phải PASS** trước khi commit. Smoke test visual bằng Chrome headless screenshot.

## 11. Commit

Theo rule `git-workflow.mdc` (English + Conventional Commits + Test section):

```
feat(not-found): redesign 404 page to match Stitch (211f1b0c)

Rebuild src/app/not-found.tsx as a pixel-perfect re-implementation of
Stitch design system screen 211f1b0c78254f89b529c59ba14fd9eb
"Màn hình Lỗi 404 - Vibe Mart" from project 15206106541998912100.

Includes brand pill, SVG 404 illustration (two "4" digits with a
magnifying-glass "0" containing a sad package), H1 + description,
two action buttons (primary → /trang-chu, secondary → history.back),
and a hints row with support + search quick-links.

Test:
- src/components/not-found/NotFoundPage.test.tsx (added): covers
  brand pill, title, description, primary/secondary actions,
  hints, SVG illustration, en i18n
```
