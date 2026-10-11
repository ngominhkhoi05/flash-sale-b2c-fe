# Plan: Default Logo + Remove Transparent Variants

> **Date**: 2026-10-11
> **Branch**: `chore/flatten-public-default-logo` (from `origin/dev`)
> **Concern**: Asset cleanup — đồng bộ mọi nơi dùng logo về file mặc định `*-light.png`, xoá các biến thể `*-transparent.png`.

## Scope

### Thay đổi

| # | File | Loại | Mô tả |
|---|---|---|---|
| 1 | `src/components/auth/AuthHeader.tsx` | modify | Đổi `src="/brand/logo/vibe-mart-logo-lockup-light-transparent.png"` → `src="/brand/logo/vibe-mart-logo-lockup-light.png"` |
| 2 | `src/components/auth/AuthBrandPanel.tsx` | modify | Tương tự (dòng 37) |
| 3 | `public/brand/logo/vibe-mart-logo-lockup-light-transparent.png` | delete | 118 KB |
| 4 | `public/brand/logo/vibe-mart-logo-mark-light-transparent.png` | delete | 54 KB |
| 5 | `public/brand/logo/vibe-mart-logo-lockup-dark-transparent.png` | delete | 43 KB |
| 6 | `public/brand/logo/README.md` | modify | Xoá 3 dòng trong bảng "File hiện có"; giữ nguyên phần còn lại |

### Không thay đổi

- `public/brand/favicon/vibe-mart-logo-mark-on-square.png` — README ghi rõ KHÔNG xoá nền (dùng làm favicon).
- `public/brand/logo/vibe-mart-logo-lockup-light.png` (mặc định, file đích).
- `StorefrontHeader` / `StorefrontFooter` / `SellerSidebar` / `AdminSidebar` — dùng CSS badge, không dùng PNG.
- `bg-transparent` ở `RecommendedTabs.tsx` — Tailwind class, không phải asset.

## Tham khảo

- `public/brand/logo/README.md` (mục "Quy ước đặt tên" + "File hiện có") — xác nhận `vibe-mart-logo-lockup-light.png` là file mặc định cho `light` variant.
- `docs/CLAUDE.md` mục 5 — list component dùng logo (AuthHeader, AuthBrandPanel) — chỉ 2 file này reference PNG.
- `docs/CLAUDE.md` mục 1 — UI primitives dùng `next/image` (đã có sẵn trong 2 file auth).

## Subplan

### Subplan 1 — Single-agent (general-purpose)

| Task | File | Loại |
|---|---|---|
| 1.1 | `src/components/auth/AuthHeader.tsx` | modify 1 dòng (string src) |
| 1.2 | `src/components/auth/AuthBrandPanel.tsx` | modify 1 dòng (string src) |
| 1.3 | 3 file `*transparent.png` | delete (git rm) |
| 1.4 | `public/brand/logo/README.md` | modify (xoá 3 dòng bảng + check dòng "rembg pipeline") |

**Tại sao gộp 1 subplan**: 1 concern duy nhất (asset cleanup), 4 file thay đổi nhỏ, liên quan chặt — chạy thẳng trong main thread (không cần subagent).

## Test strategy

- **Audit file (Bước 5.0)**:
  - `AuthHeader.tsx` / `AuthBrandPanel.tsx` — chỉ đổi string path trong JSX `<Image src=...>`. **Không phải file logic** (no function/export). Test hiện chỉ assert `getByRole('img', { name: /Vibe Mart/i })` — pass với bất kỳ path nào.
  - `README.md` — file docs, không có test.
  - 3 file PNG — asset tĩnh, không có test.
  - **Kết luận**: 0 file logic → 0 test mới cần viết. Commit body ghi rõ "no logic change".
- **Verify**:
  - `npx vitest run src/components/auth/AuthHeader.test.tsx src/components/auth/AuthBrandPanel.test.tsx` → pass (vẫn có `<img alt="Vibe Mart">`).
  - `npx vitest run` (full) → 246/246 pass.
  - `npm run tsc --noEmit` → pass.
  - `npm run build` → pass.
  - Sau khi xoá file, manual smoke: truy cập `/dang-nhap` → logo vẫn hiển thị (đổi sang file light, có nền gradient).

## Commit

1 commit duy nhất, body Conventional Commit EN:

```text
chore(brand): use default logo and drop transparent variants

- Update AuthHeader + AuthBrandPanel src to use
  vibe-mart-logo-lockup-light.png (default, has gradient background)
  instead of the now-removed *-transparent.png variants
- Remove 3 transparent PNG assets from public/brand/logo/
- Drop the corresponding rows from public/brand/logo/README.md

Test: no logic change (only string src swap in JSX and asset removal);
existing component tests assert getByRole('img', { name: /Vibe Mart/i })
and continue to pass against the new default file.

Files copy only (no test required):
- public/brand/logo/vibe-mart-logo-lockup-light-transparent.png (deleted)
- public/brand/logo/vibe-mart-logo-mark-light-transparent.png (deleted)
- public/brand/logo/vibe-mart-logo-lockup-dark-transparent.png (deleted)
- public/brand/logo/README.md: only removed 3 rows from existing table
```

## Rủi ro

- **Trang auth hiển thị logo có nền gradient thay vì transparent** → user đã chọn (lockup_light). Có thể khác với Stitch design (transparent) — user đã chấp nhận.
- **File PNG light có 104 KB** — nhỏ, không ảnh hưởng bundle.
- **No other files reference transparent variants** (đã grep toàn repo) — an toàn khi xoá.

## Ước lượng

~10 phút (5 thay đổi + 1 commit + verify).
