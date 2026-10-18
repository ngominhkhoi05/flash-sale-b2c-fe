# Plan — Add `picsum.photos` to next/image remotePatterns (dev mock images)

**Date**: 2026-10-18 11:20 (UTC+7)
**Branch**: `fix/next-image-add-picsum-hostname` (NEW, từ `dev`)
**Base**: `origin/dev` (0feb743)
**Type**: fix (dev runtime error)

## 1. Problem

User mở `http://localhost:3000/` (dev) gặp runtime error:

```
Invalid src prop (https://picsum.photos/seed/img49/600/600) on `next/image`,
hostname "picsum.photos" is not configured under images in your `next.config.js`

at HeroBannerSection[slides.map()]
```

`HeroBannerSection` ưu tiên banner từ API `/api/v1/banners/home`. Backend
**chưa có endpoint này** → trả 404 → hook fallback sang
`useFeaturedProducts()` → fetch `/api/v1/products` (có thật) → response
trả về `imageUrl: "https://picsum.photos/seed/img49/600/600"` (BE dùng
picsum.photos làm placeholder cho product images khi dev/demo).

→ Hostname `picsum.photos` không có trong `next.config.ts` whitelist → Next.js throw.

## 2. Evidence

```bash
curl -s "http://localhost:3000/api/v1/products?size=4&sort=createdAt,desc" \
  -H "Accept: application/json"
```

Response (relevant):
```json
{
  "data": {
    "items": [
      { "id": 3, "name": "Tui xach Mini #3",
        "imageUrl": "https://picsum.photos/seed/img49/600/600", ... },
      { "id": 6, "name": "Sac du phong Pro #6",
        "imageUrl": "https://picsum.photos/seed/img52/600/600", ... },
      ...
    ]
  }
}
```

## 3. Root cause (đã verify)

- `next.config.ts` chỉ whitelist 4 hostname:
  1. `cdn.vibemart.vn` (mock CDN)
  2. `lh3.googleusercontent.com` (Google avatar)
  3. `vibe-mart-utc2.canluaz.io.vn` (production)
- `picsum.photos` hostname **không có trong whitelist** → Next.js refuse
  optimize ảnh qua `/_next/image` → throw runtime error.
- `HeroBannerSection` render `<Image src={product.imageUrl}>` → trigger lỗi.

## 4. Fix

Thêm 1 entry vào `next.config.ts` images.remotePatterns cho `picsum.photos`.

**Tại sao hostname cụ thể (không wildcard `**`)**:
- `picsum.photos` chỉ dùng cho demo/dev mock data → giới hạn hostname rõ ràng.
- pathname `/**` vì picsum URL pattern là `/seed/<name>/<w>/<h>` (variable).

**Khi nào xóa entry này**:
- Khi backend đổi sang dùng CDN thật (vd `cdn.vibemart.vn`) cho product images.
- Khi đó, cần update cả FE code (transform URL) + xóa entry này.

## 5. Scope

**File LOGIC** (sửa 1):
- `next.config.ts` — thêm 1 entry `{ protocol: "https", hostname: "picsum.photos", pathname: "/**" }`
  vào `images.remotePatterns`. Cập nhật comment giải thích + numbering.

**Không đụng**:
- `src/features/homepage/api.ts` — không sửa.
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
Phải pass. Cấu hình `images.remotePatterns` là Next.js validate lúc build.

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
- Hero banner phải render được ảnh `picsum.photos/seed/...` (không còn crash)
- DevTools → Console → không còn lỗi "Invalid src prop"
- DevTools → Network → filter `image` → phải thấy request
  `/_next/image?url=https%3A%2F%2Fpicsum.photos%2Fseed%2Fimg49%2F600%2F600&w=...&q=75` với status 200

### 6.5 — Regression
```bash
npx vitest run
```
Đảm bảo không break test khác (đặc biệt HeroBannerSection.test.tsx, page.test.tsx).

## 7. Out of scope

- Không thay `src/features/homepage/api.ts` (URL transform logic đúng).
- Không đổi `HeroBannerSection.tsx` (đã có fallback).
- Không dùng wildcard hostname (vd `**`) — bảo mật yếu.
- Không xóa `cdn.vibemart.vn` / `lh3.googleusercontent.com` / `vibe-mart-utc2.canluaz.io.vn`
  (vẫn dùng cho các concern khác).

## 8. Risk

| Risk | Mitigation |
|---|---|
| BE đổi từ picsum sang CDN thật | Update entry này thành hostname CDN mới (vd `cdn.vibemart.vn/products/**`). |
| `/**` pathname quá rộng | An toàn vì đã giới hạn bằng hostname cụ thể (không phải wildcard hostname). |
| Dev mock cũng nên dùng CDN thật | Khi mock data fix xong (chuyển sang CDN), xóa entry này. Document trong commit message. |

## 9. Commit message (preview)

```
fix(build): add picsum.photos hostname to next/image remotePatterns

Dev runtime error khi user mo trang chu:
"Invalid src prop (https://picsum.photos/seed/img49/600/600) on
next/image, hostname ... is not configured under images in your
next.config.js"

Root cause: HeroBannerSection fallback sang useFeaturedProducts() (khi
/api/v1/banners/home tra 404). Backend /api/v1/products tra ve
imageUrl: "https://picsum.photos/seed/imgXX/600/600" (BE dung picsum
lam placeholder cho product images khi dev/demo). nhung
next.config.ts chi whitelist cdn.vibemart.vn, lh3.googleusercontent.com,
vibe-mart-utc2.canluaz.io.vn — picsum.photos KHONG co trong whitelist.

Fix: them hostname "picsum.photos" vao images.remotePatterns voi
pathname "/**" de cover seed/<name>/<w>/<h> URL pattern.

Test: khong co (next.config.ts la build config, khong co logic runtime
theo testing-required.mdc). Verify bang:
- npm run build: pass
- npm run lint: pass
- npx tsc --noEmit: pass
- Manual smoke: reload localhost:3000, hero banner render OK, console
  khong con loi "Invalid src prop"
- npx vitest run: pass (regression)
```

## 10. Workflow reminder

- Branch: tạo MỚI `fix/next-image-add-picsum-hostname` từ `origin/dev`
- CORS fix (concern khác) đã commit riêng ở turn trước
- Pre-commit checklist (git-workflow.mdc): 7 mốc (mốc 4 "test kèm" miễn theo rule)
- Auto-commit sau khi build/lint/tsc pass
- KHÔNG push (chờ user duyệt)
