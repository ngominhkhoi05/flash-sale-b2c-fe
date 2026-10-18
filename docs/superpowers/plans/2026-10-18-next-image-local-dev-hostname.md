# Plan — Whitelist `localhost` hostname in next/image remotePatterns (BE local dev)

**Date**: 2026-10-18 20:34 (UTC+7)
**Branch**: `fix/next-image-local-dev-hostname` (NEW, từ `origin/dev`)
**Base**: `origin/dev` (`910b0bd`)
**Type**: fix (dev runtime error)

## 1. Problem

User mở `http://localhost:3000/` (dev) gặp runtime error:

```
[browser] Uncaught Error: Invalid src prop (http://localhost:8080/banners/hero-1.jpg) on `next/image`,
hostname "localhost" is not configured under images in your `next.config.js`
See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host
    at Array.map (<anonymous>)
    at HeroBannerSection[slides.map()]
```

## 2. Evidence

- File `src/components/storefront/sections/HeroBannerSection.tsx` đã migrate sang API-driven (không còn mock data).
- Hook `useHomeBanners()` ưu tiên banner từ `/api/v1/banners/home`. Nếu BE trả 404 (BE chưa implement endpoint) → fallback sang `useFeaturedProducts()` → gọi `/api/v1/products`.
- Backend local (`application-local.yaml`) chạy ở `localhost:8080`. Khi product có `imageUrl: "/banners/hero-1.jpg"`, BE có thể trả về dạng:
  - absolute `http://localhost:8080/banners/hero-1.jpg` (khi BE config trả base URL)
  - hoặc relative `/banners/hero-1.jpg` (FE transform → ghép với `NEXT_PUBLIC_API_URL=http://localhost:8080`)

Cả 2 trường hợp đều có thể dẫn đến hostname `localhost` xuất hiện trong `src` của `<Image>` → `next/image` strict mode throw.

`next.config.ts` hiện whitelist:

1. `cdn.vibemart.vn` — mock CDN
2. `lh3.googleusercontent.com` — Google avatar
3. `vibe-mart-utc2.canluaz.io.vn` — production
4. `picsum.photos` — placeholder images (đã thêm ở PR trước)

→ KHÔNG có `localhost`. → `next/image` refuse → throw runtime error.

## 3. Root cause (đã verify)

- `next.config.ts` chỉ whitelist 4 hostname — `localhost` không có.
- `HeroBannerSection` render `<Image src={product.imageUrl}>` với src chứa `http://localhost:8080/...` → trigger lỗi.
- Đây là môi trường dev — chỉ cần whitelist cho `localhost` để fix runtime error.

## 4. Fix

Thêm 1 entry vào `next.config.ts` `images.remotePatterns` cho `localhost` (cả `http` và `https` nếu cần, ưu tiên `http` vì BE local chạy HTTP).

**Lý do dùng hostname cụ thể (không wildcard `**`)**:
- Giới hạn rõ ràng dev host. Tránh allow tất cả URL qua `/_next/image`.
- pathname `/**` vì image URL pattern không biết trước (`/banners/...`, `/products/...`, `/users/...`).

**Khi nào xóa entry này**:
- Khi deploy production không dùng `localhost`.
- Nếu cần local dev với HTTPS (vd: `https://localhost:9443`) → thêm entry riêng (hiện tại KHÔNG cần).

## 5. Scope

**File sửa** (1):
- `next.config.ts` — thêm 1 entry `{ protocol: "http", hostname: "localhost", pathname: "/**" }` vào `images.remotePatterns`. Cập nhật comment giải thích + numbering.

**Không đụng**:
- `src/features/homepage/api.ts` — URL transform logic đúng (đã ghép `NEXT_PUBLIC_API_URL`).
- `HeroBannerSection.tsx` — không sửa (đã có fallback placeholder khi image fail).
- `.env` — không sửa.

## 6. Test strategy

`next.config.ts` là **build config, không có runtime logic** (xem `testing-required.mdc`
mục "Khi nào KHÔNG cần test" — file config không chứa logic).

→ KHÔNG viết unit test. Verify bằng:

### 6.1 — Build
```bash
npm run build
```
Phải pass. `images.remotePatterns` là Next.js validate lúc build.

### 6.2 — Lint
```bash
npm run lint
```
Phải pass. (next.config.ts không có ESLint rule đặc biệt.)

### 6.3 — Type check
```bash
npx tsc --noEmit
```
Phải pass.

### 6.4 — Manual smoke (dev)
- Reload `http://localhost:3000/` (sau khi dev server tự restart)
- Hero banner phải render được ảnh từ `http://localhost:8080/...` (không crash)
- DevTools → Console → không còn lỗi "Invalid src prop"
- DevTools → Network → filter `image` → phải thấy request
  `/_next/image?url=http%3A%2F%2Flocalhost%3A8080%2F...&w=...&q=75` với status 200

### 6.5 — Regression
```bash
npx vitest run
```
Đảm bảo không break test khác (đặc biệt `HeroBannerSection.test.tsx`, `page.test.tsx`).

## 7. Out of scope

- Không thay `src/features/homepage/api.ts` (URL transform logic đúng).
- Không đổi `HeroBannerSection.tsx` (đã có fallback).
- Không dùng wildcard hostname (vd `**`) — bảo mật yếu.
- Không xóa `cdn.vibemart.vn` / `lh3.googleusercontent.com` / `vibe-mart-utc2.canluaz.io.vn` / `picsum.photos`
  (vẫn dùng cho các concern khác).

## 8. Risk

| Risk | Mitigation |
|---|---|
| Local dev cũng nên dùng CDN thật (vd `cdn.vibemart.vn`) | Khi mock data fix xong, xóa entry `localhost` này. Document trong commit message. |
| `/**` pathname quá rộng | An toàn vì đã giới hạn bằng hostname cụ thể (không phải wildcard hostname). |
| HTTPS localhost (vd self-signed) | Hiện tại BE local dùng HTTP. Khi cần HTTPS → thêm entry riêng. |

## 9. Commit message (preview)

```
fix(build): add localhost hostname to next/image remotePatterns

Dev runtime error khi user mo trang chu o localhost:3000:
"Invalid src prop (http://localhost:8080/banners/hero-1.jpg) on
next/image, hostname 'localhost' is not configured under images in
your next.config.js"

Root cause: HeroBannerSection fallback sang useFeaturedProducts() (khi
/api/v1/banners/home tra 404). Backend local (gradlew bootRun) chay o
localhost:8080 (xem application-local.yaml) tra imageUrl voi hostname
'localhost'. nhung next.config.ts chi whitelist cdn.vibemart.vn,
lh3.googleusercontent.com, vibe-mart-utc2.canluaz.io.vn, picsum.photos —
localhost KHONG co trong whitelist.

Fix: them hostname "localhost" voi protocol "http" va pathname "/**"
vao images.remotePatterns de cover cac image URL dang
http://localhost:8080/<path>/<file>.

Test: khong co (next.config.ts la build config, khong co logic runtime
theo testing-required.mdc). Verify bang:
- npm run build: pass
- npm run lint: pass
- npx tsc --noEmit: pass
- Manual smoke: reload localhost:3000, hero banner render OK, console
  khong con loi "Invalid src prop"
- npx vitest run: pass (regression)

Xoa entry nay khi deploy production hoac khi BE chuyen sang CDN thuc
(vd cdn.vibemart.vn).
```

## 10. Workflow reminder

- Branch: tạo MỚI `fix/next-image-local-dev-hostname` từ `origin/dev`
- Pre-commit checklist (git-workflow.mdc): 7 mốc (mốc 4 "test kèm" miễn theo rule)
- Auto-commit sau khi build/lint/tsc pass
- KHÔNG push (chờ user duyệt)
