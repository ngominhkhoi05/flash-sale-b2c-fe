# Maintenance Page — Stitch 4dc42fa4 (Tính năng đang được nâng cấp)

> Plan tạo pixel-perfect replica của Stitch design system screen
> `4dc42fa4da2345148536ed23af2364f1` ("Tính năng đang được nâng cấp - Vibe Mart")
> từ project `15206106541998912100` (Vibe Mart Marketplace UI/UX).

## 1. Scope

**Cần làm**:
- Tạo component `src/components/maintenance/MaintenancePage.tsx` (replica của Stitch screen)
- Tạo test `src/components/maintenance/MaintenancePage.test.tsx` (TDD)
- Thay thế stub `src/app/bao-tri/page.tsx` 22 dòng → re-export `MaintenancePage`
- Thêm 19 i18n key `error.maintenance.*` vào `messages/vi.json` + `messages/en.json`
- Thêm 1 SVG illustration component `src/components/maintenance/MaintenanceIllustration.tsx`
- Cập nhật `src/components/ui/material-symbol.tsx` thêm icon names mới

**KHÔNG làm**:
- KHÔNG sửa `docs/CLAUDE.md` (read-only)
- KHÔNG sửa `not-found.tsx` / `forbidden/page.tsx` (out of scope)
- KHÔNG thêm middleware, route group, i18n namespace mới
- KHÔNG dùng bất kỳ animation/transition ngoài Stitch spec (Stitch chỉ có `animate-[spin_20s...]`, `animate-pulse`, `hover:rotate-0`)

## 2. Tham khảo

- **Source of truth UI**: `docs/CLAUDE.md` §3 (design tokens), §4 (chống rối mắt), §6 (status labels), §11 (quy ước code)
- **Stitch source HTML**: `docs/superpowers/plans/stitch-maintenance-source.html`
- **Stitch screenshot**: `docs/superpowers/plans/stitch-maintenance-screenshot.png` (đã tải)
- **Pattern tương tự**:
  - `src/components/forbidden/ForbiddenPage.tsx` (replica Stitch 8bea7c52 — commit 34cd1f9)
  - `src/components/not-found/NotFoundPage.tsx` (replica Stitch 211f1b0c — commit 74923744)
- **Rule liên quan**:
  - `i18n.mdc` (bắt buộc `vi` + `en`, namespace mới)
  - `component-pattern.mdc` (Server vs Client component, cn(), cva)
  - `testing-required.mdc` (TDD bắt buộc + test cho component có state/effect/handler)
  - `git-workflow.mdc` (branch name EN, commit EN, list test files trong body)
  - `no-overengineering.mdc` (chỉ dùng tokens có sẵn, KHÔNG thêm `space-xs/sm/md` tokens — dùng Tailwind standard `p-4, gap-3, mb-4`)

## 3. Layout (Stitch screen structure)

Từ Stitch HTML source, screen có 6 blocks từ trên xuống dưới:

1. **Centerpiece illustration** (160×160 container):
   - Glow halo 1: `bg-primary-fixed/40 rounded-full blur-2xl scale-110` (40% primary-fixed, behind)
   - Glow halo 2: `bg-secondary-fixed/30 rounded-full blur-lg` (30% secondary-fixed, 128×128)
   - White circle 112×112: `bg-surface-container-lowest shadow-md`
   - SVG spinner (16 paths rays + 4.5r inner circle `bg-primary-container`), 64×64, `animate-[spin_20s_linear_infinite]`, `text-primary`
   - Build badge (rotated 12°): 48×48, `bg-secondary text-on-secondary`, icon `build` (filled), positioned `-bottom-1 -right-1`, `hover:rotate-0 transition-transform`
   - `auto_awesome` icon (filled, `text-secondary-container`, `animate-pulse`) at `-top-1 left-2`
   - `arrow_back_ios_new` icon (`text-primary-fixed-dim`) at `top-4 -right-2`

2. **Feature code sub-pill** (rounded-full, `bg-surface-container-high`):
   - Icon `terminal` (`text-primary`, text-body-sm)
   - Text: "Mã tính năng: review:create" (font-label-sm, tracking-wide)

3. **H1 heading**: "Tính năng đang được nâng cấp"
   - font-display-lg text-display-lg, text-on-surface, tracking-tight, mb-space-sm

4. **Description paragraph** (max-w-lg):
   - "Chúng tôi đang hoàn thiện và tối ưu trải nghiệm **Đánh giá sản phẩm** để phục vụ bạn trọn vẹn hơn. Xin vui lòng quay lại sau ít phút."
   - font-body-lg text-body-lg, text-on-surface-variant, leading-relaxed
   - "Đánh giá sản phẩm" highlighted in `font-label-lg text-on-surface`

5. **Auto-progress info card** (rounded-xl, `bg-surface-container-lowest`):
   - Icon block 32×32: `bg-surface-container-high`, icon `update` (`text-primary`, text-headline-sm)
   - Title: "Tiến trình nâng cấp tự động" (font-label-md, text-on-surface)
   - Body: "Dự kiến hoàn tất trong chốc lát. Đơn hàng, giỏ hàng và các hoạt động mua sắm khác của bạn vẫn diễn ra bình thường và được đảm bảo an toàn tuyệt đối." (font-body-md, text-on-surface-variant)

6. **Action buttons** (flex-col sm:flex-row):
   - Primary: "Về trang chủ" → `/trang-chu` (data-path="trang-chu"), h-10, rounded-lg, bg-primary, with `arrow_back` icon
   - Secondary: "Hỗ trợ trực tuyến 24/7" → `/trung-tam-tro-giup` (data-path), h-10, rounded-lg, bg-surface-container-lowest, with `support_agent` icon (text-secondary)

7. **"In the meantime" section** (pt-space-lg, border top):
   - Lead text: "Trong lúc chờ đợi, bạn có thể khám phá thêm:" (font-label-md, text-on-surface-variant)
   - 3 quick-link pills (flex-wrap, gap-space-xs):
     - `bolt` icon (tertiary, filled) + "Flash Sale hôm nay" → `/flash-sale`
     - `local_fire_department` icon (primary) + "Sản phẩm bán chạy" → `/danh-muc-san-pham`
     - `package_2` icon (secondary) + "Kiểm tra đơn hàng" → `/gio-hang`

## 4. Deviations từ Stitch (giống pattern ForbiddenPage)

| Stitch dùng | Project dùng | Lý do |
|---|---|---|
| `bg-primary-fixed/40` (opacity modifier) | `color-mix(in srgb, var(--color-primary-fixed) 40%, transparent)` | Tailwind 4 đọc `--color-primary-fixed` qua `@theme`; `bg-primary-fixed/40` có thể bị mất specificity — dùng `style={{...}}` cho chắc |
| `space-xs/sm/md/lg/xl`, `gutter`, `margin`, `margin-desktop` spacing tokens | `gap-1, gap-2, gap-3, p-4, mb-4, py-8, px-4, lg:px-8` (Tailwind standard) | `no-overengineering.mdc`: KHÔNG thêm custom tokens không có trong design system |
| Inline `font-label-sm text-label-sm` (Stitch dual class) | `text-label-sm font-semibold` (project convention từ `component-pattern.mdc`) | Stitch HTML dùng font shorthand; project dùng Tailwind riêng `font-*` + `text-*` |
| `data-path="review:create"` (Stitch JS click handler copy) | KHÔNG copy (semantic chỉ là text label) | Stitch dùng JS click→clipboard; project dùng Next.js (RSC), KHÔNG có inline JS — chỉ hiển thị text |
| `animate-[spin_20s_linear_infinite]` (Tailwind arbitrary keyframe) | Dùng `animate-spin` (default 1s) + `style={{ animationDuration: '20s' }}` | Tailwind 4 arbitrary animation syntax cần verify; dùng cách an toàn hơn |

## 5. i18n keys (mới — namespace `error.maintenance`)

| Key | vi | en |
|---|---|---|
| `codeBadge` | "Mã tính năng: review:create" | "Feature code: review:create" |
| `title` | "Tính năng đang được nâng cấp" | "Feature being upgraded" |
| `descriptionPrefix` | "Chúng tôi đang hoàn thiện và tối ưu trải nghiệm " | "We're polishing and improving the " |
| `descriptionHighlight` | "Đánh giá sản phẩm" | "Product reviews" |
| `descriptionSuffix` | " để phục vụ bạn trọn vẹn hơn. Xin vui lòng quay lại sau ít phút." | " experience to serve you better. Please come back in a few minutes." |
| `progressTitle` | "Tiến trình nâng cấp tự động" | "Auto-upgrade in progress" |
| `progressBody` | "Dự kiến hoàn tất trong chốc lát. Đơn hàng, giỏ hàng và các hoạt động mua sắm khác của bạn vẫn diễn ra bình thường và được đảm bảo an toàn tuyệt đối." | "Expected to complete shortly. Your orders, cart, and other shopping activities continue normally and are guaranteed absolutely safe." |
| `primaryAction` | "Về trang chủ" | "Back to home" |
| `secondaryAction` | "Hỗ trợ trực tuyến 24/7" | "24/7 Live support" |
| `explorePrompt` | "Trong lúc chờ đợi, bạn có thể khám phá thêm:" | "While you wait, you can explore:" |
| `exploreFlashSale` | "Flash Sale hôm nay" | "Today's Flash Sale" |
| `exploreBestSellers` | "Sản phẩm bán chạy" | "Best sellers" |
| `exploreOrders` | "Kiểm tra đơn hàng" | "Check orders" |

Tổng: 13 key, thêm vào `error.maintenance.*` của cả `vi.json` + `en.json`.

## 6. Material symbols cần thêm vào `material-symbol.tsx`

| Name | Use case |
|---|---|
| `terminal` | feature code sub-pill icon |
| `build` | rotated badge on centerpiece (filled) |
| `auto_awesome` | sparkle at top-left of centerpiece (filled) |
| `arrow_back_ios_new` | small arrow decoration on centerpiece |
| `update` | info card icon (32×32) |
| `arrow_back` | primary action icon |
| `support_agent` | secondary action icon (đã có) |
| `bolt` | quick-link Flash Sale (đã có, dùng `fill`) |
| `local_fire_department` | quick-link best sellers (đã có) |
| `package_2` | quick-link orders |

10 names, trong đó 3 đã có (`support_agent`, `bolt`, `local_fire_department`). Thêm 7 mới:
`terminal`, `build`, `auto_awesome`, `arrow_back_ios_new`, `update`, `arrow_back` (đã có ở notFound page), `package_2`.

Thực tế cần thêm: `terminal`, `build`, `auto_awesome`, `arrow_back_ios_new`, `update`, `package_2` (6 mới; `arrow_back` đã có).

## 7. Subplan

Plan có 1 concern chính (replicate 1 screen Stitch) → chạy thẳng, không cần multi-agent.

## 8. Test strategy

**Test file**: `src/components/maintenance/MaintenancePage.test.tsx` (đặt cạnh component, Vitest convention)

**Test cases** (15 cases):

Layout (8):
1. renders H1 'Tính năng đang được nâng cấp'
2. renders description paragraph với highlight 'Đánh giá sản phẩm'
3. renders code badge 'Mã tính năng: review:create'
4. renders auto-progress title 'Tiến trình nâng cấp tự động'
5. renders auto-progress body (substring match)
6. renders centerpiece illustration (`data-testid="maintenance-illustration"`)
7. renders explore prompt 'Trong lúc chờ đợi...'
8. renders 3 quick-link pills (Flash Sale, Sản phẩm bán chạy, Kiểm tra đơn hàng)

Links (4):
9. primary action links to `/trang-chu`
10. secondary action links to `/trung-tam-tro-giup`
11. quick-link Flash Sale → `/flash-sale`
12. quick-link Best sellers → `/danh-muc-san-pham`
13. quick-link Orders → `/gio-hang`

i18n English (2):
14. renders English H1 'Feature being upgraded' khi locale='en'
15. renders English primary 'Back to home' linking to /trang-chu

Coverage target: ≥ 70% (component complex, nhiều conditional renders).

**Verification**:
- `npm run test -- src/components/maintenance` → all pass
- `npm run lint` → pass
- `npm run tsc --noEmit` → pass
- Dev server: mở `http://localhost:3000/bao-tri` → visual match với Stitch screenshot

## 9. Files thay đổi

| File | Action | Logic? | Test kèm? |
|---|---|---|---|
| `src/components/maintenance/MaintenancePage.tsx` | new (≈ 200 dòng) | YES (component) | YES — new test file |
| `src/components/maintenance/MaintenancePage.test.tsx` | new (≈ 200 dòng) | TEST | — |
| `src/components/maintenance/MaintenanceIllustration.tsx` | new (≈ 100 dòng) | YES (SVG component) | Có thể dùng chung test file trên |
| `src/app/bao-tri/page.tsx` | modify (22→10 dòng) | YES (entry) | Test file bao phủ |
| `src/components/ui/material-symbol.tsx` | modify (6 type additions) | NO (type-only) | N/A |
| `messages/vi.json` | modify (+13 keys) | NO (data) | N/A |
| `messages/en.json` | modify (+13 keys) | NO (data) | N/A |
| `docs/superpowers/plans/2026-10-12-maintenance-page-stitch.md` | new (this file) | NO (doc) | N/A |
| `docs/superpowers/plans/stitch-maintenance-screenshot.png` | new (downloaded) | NO (asset) | N/A |
| `docs/superpowers/plans/stitch-maintenance-source.html` | new (downloaded) | NO (asset) | N/A |

## 10. Pre-commit checklist (git-workflow.mdc)

- [ ] Audit file logic vs copy (Bước 5.0) — đã làm ở bảng trên
- [ ] Test viết trước (Bước 5.1 TDD) — RED → GREEN → REFACTOR
- [ ] `npm run test` PASS
- [ ] `npm run lint` PASS
- [ ] `npm run tsc --noEmit` PASS
- [ ] Commit message tiếng Anh, conventional commit, body LIỆT KÊ test file
- [ ] Commit chỉ chứa file đã thay đổi trong task
- [ ] Branch name EN (đã đúng: `feature/maintenance-page-stitch`)

## 11. Rủi ro

| Risk | Mitigation |
|---|---|
| Animation `animate-[spin_20s_linear_infinite]` không render trong test (JSDOM) | Test chỉ assert `data-testid="maintenance-illustration"`, không assert animation state |
| Spinner SVG paths khác với screenshot Stitch 100% | Dùng đúng path từ Stitch source HTML (12 paths + 1 inner circle), assert bằng `screen.getByTestId` |
| Token `bg-primary-fixed/40` opacity syntax fail trong Tailwind 4 | Dùng inline `style={{ background: 'color-mix(in srgb, var(--color-primary-fixed) 40%, transparent)' }}` |
| `font-label-sm text-label-sm` dual class overlap với existing `text-label-sm font-semibold` | Theo convention project (`component-pattern.mdc`): dùng `text-label-sm font-semibold` |

## 12. Out of scope (KHÔNG làm)

- KHÔNG thêm `space-xs/sm/md/lg` spacing tokens vào `globals.css`
- KHÔNG thêm dark mode (rule §3)
- KHÔNG tạo `middleware.ts` để redirect tự động (Stitch chỉ là trang display)
- KHÔNG sửa `not-found.tsx` hoặc `forbidden/page.tsx`
- KHÔNG refactor `ForbiddenPage` hoặc `NotFoundPage` để share component chung (3 trang có 3 layout khác nhau)
