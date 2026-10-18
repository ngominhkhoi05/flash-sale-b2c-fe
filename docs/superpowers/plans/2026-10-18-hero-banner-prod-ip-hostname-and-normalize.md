# Plan — Whitelist `180.93.137.28` + apply `imageUrlWithFallback` cho HeroBannerSection

**Date**: 2026-10-18 21:20 (UTC+7)
**Branch**: `fix/next-image-local-dev-hostname` (REUSE — đã merge localhost case qua commit `2161b53`, HEAD local vẫn ở đây)
**Base**: `origin/dev` (`0b96360`)
**Type**: fix (dev/prod runtime error)

---

## 1. Problem

User mở `http://localhost:3000/` gặp runtime error:

```
Invalid src prop (http://180.93.137.28/banners/hero-1.jpg) on `next/image`,
hostname "180.93.137.28" is not configured under images in your `next.config.js`
See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host

  at HeroBannerSection[slides.map()] (slides.map())
```

Lỗi **lệch** so với plan trước (`2026-10-18-next-image-local-dev-hostname.md`):
- Plan trước xử lý `hostname "localhost"` (khi `NEXT_PUBLIC_API_URL=http://localhost:8080`)
- Plan này xử lý `hostname "180.93.137.28"` (khi `.env` đã đổi sang IP server thật)

Đồng thời HeroBannerSection **chưa dùng** helper `imageUrlWithFallback()` đã có sẵn → lỗi lặp lại mỗi khi `.env` đổi host.

## 2. Evidence

### 2.1 — `.env` (production-tuned)

```
NEXT_PUBLIC_API_URL=http://180.93.137.28
NEXT_PUBLIC_WS_URL=http://180.93.137.28/ws
NEXT_PUBLIC_SITE_URL=http://180.93.137.28/
```

→ IP server thật, KHÔNG phải canonical domain `vibe-mart-utc2.canluaz.io.vn`.

### 2.2 — Backend `/api/v1/products` response thật (curl)

```json
{
  "items": [
    {
      "id": 3,
      "name": "Tui xach Mini #3",
      "imageUrl": null,        ← BE trả null khi chưa upload ảnh
      ...
    }
  ]
}
```

→ `imageUrl: null` cho hầu hết product (BE chưa có ảnh thật).

### 2.3 — Backend `/banners/hero-1.jpg`

```
HTTP/1.1 404 Not Found
X-Powered-By: Next.js
```

→ File `/banners/hero-1.jpg` không tồn tại trên server.

### 2.4 — Tại sao stack trace có URL `http://180.93.137.28/banners/hero-1.jpg`?

`fetchHomeBanners` ở `src/features/homepage/api.ts` đã có:

```ts
const transformImageUrl = (banner: BannerResponse): BannerResponse => ({
  ...banner,
  imageUrl: banner.imageUrl.startsWith("http")
    ? banner.imageUrl
    : `${baseUrl.replace(/\/$/, "")}${banner.imageUrl}`,
});
```

→ Khi `.env` đổi `NEXT_PUBLIC_API_URL=http://180.93.137.28`, mọi banner cached cũ (relative URL `/banners/hero-1.jpg`) được transform lại thành `http://180.93.137.28/banners/hero-1.jpg` → bị Next/image reject vì hostname chưa whitelist.

### 2.5 — `next.config.ts` hiện tại whitelist

| # | Hostname | Protocol | Ghi chú |
|---|---|---|---|
| 1 | `cdn.vibemart.vn` | https | mock CDN |
| 2 | `lh3.googleusercontent.com` | https | Google avatar |
| 3 | `vibe-mart-utc2.canluaz.io.vn` | https | production canonical |
| 4 | `picsum.photos` | https | placeholder (dev) |
| 5 | `localhost` | http | local dev |

→ KHÔNG có `180.93.137.28`. → Next/image refuse optimize qua `/_next/image` → throw runtime error.

## 3. Root cause (đã verify)

Hai vấn đề độc lập cùng gây lỗi:

1. **`next.config.ts`** chưa whitelist hostname IP `180.93.137.28` (HTTP). Khi `.env` dùng IP server thật, mọi ảnh có hostname này trong src đều bị reject.

2. **`HeroBannerSection.tsx`** render `<Image src={slide.imageUrl}>` trực tiếp, KHÔNG qua helper `imageUrlWithFallback()` đã có sẵn ở `src/lib/images/with-fallback.ts`. Khi `imageUrl` là `null` / `""` / relative (vd `/banners/hero-1.jpg`), Next.js throw hoặc ghép sai URL.

## 4. Fix

### Fix A — Whitelist `180.93.137.28` trong `next.config.ts`

Thêm 1 entry vào `images.remotePatterns`:

```ts
{
  protocol: "http",
  hostname: "180.93.137.28",
  pathname: "/**",
},
```

### Fix B — Áp dụng `imageUrlWithFallback()` trong `HeroBannerSection.tsx`

Đổi:

```tsx
<Image
  alt={slide.imageAlt}
  src={slide.imageUrl}                    // ← src thẳng, dễ throw
  onError={() => handleImageError(slide.id)}
  fill
  sizes="(max-width: 768px) 100vw, 66vw"
  className="object-cover"
  data-testid={`hero-img-${idx}`}
/>
```

Thành:

```tsx
<Image
  alt={slide.imageAlt}
  src={imageUrlWithFallback(slide.imageUrl, "banner")}  // ← helper chuẩn hoá
  onError={() => handleImageError(slide.id)}
  fill
  sizes="(max-width: 768px) 100vw, 66vw"
  className="object-cover"
  data-testid={`hero-img-${idx}`}
/>
```

Import:

```tsx
import { imageUrlWithFallback } from "@/lib/images/with-fallback";
```

Helper đã cover 4 case:

| Input | Output |
|---|---|
| `null` / `undefined` | `/images/placeholder-product.png` |
| `""` / `"  "` | `/images/placeholder-product.png` |
| `https://...` / `http://...` | as-is |
| `/banners/hero-1.jpg` | `http://180.93.137.28/banners/hero-1.jpg` (ghép NEXT_PUBLIC_API_URL) |

### Khi nào xoá entry `180.93.137.28`

- Khi `.env` chuyển sang dùng canonical domain `https://vibe-mart-utc2.canluaz.io.vn` (đã whitelist ở entry #3).
- Khi BE chuyển sang CDN thật (vd `cdn.vibemart.vn`).

Document trong commit message + comment `next.config.ts`.

## 5. Scope

### File LOGIC (sửa 2)

| # | File | Loại | Mô tả |
|---|---|---|---|
| 1 | `next.config.ts` | LOGIC (config) | Thêm entry `{ protocol: "http", hostname: "180.93.137.28", pathname: "/**" }` vào `images.remotePatterns`. Cập nhật comment + numbering. |
| 2 | `src/components/storefront/sections/HeroBannerSection.tsx` | LOGIC (component) | Import `imageUrlWithFallback`, đổi `<Image src={slide.imageUrl}>` → `<Image src={imageUrlWithFallback(slide.imageUrl, "banner")}>` |

### File TEST (cập nhật 1)

| # | File | Loại | Mô tả |
|---|---|---|---|
| 3 | `src/components/storefront/sections/HeroBannerSection.test.tsx` | LOGIC (test) | Thêm 3 test case: (a) imageUrl null → render placeholder, (b) imageUrl empty → render placeholder, (c) absolute URL IP 180.93.137.28 → render OK |

### KHÔNG sửa

- `src/lib/images/with-fallback.ts` (helper đã đủ).
- `src/lib/images/placeholders.ts` (constant đã đủ).
- `src/features/homepage/api.ts` (URL transform đã đúng).
- `.env` (đúng với production setup).

## 6. Subplan & chia task

### Subplan 1 — Helper áp dụng cho HeroBannerSection (TDD)

- **Concern**: Component render ảnh với helper chuẩn hoá
- **File**: `src/components/storefront/sections/HeroBannerSection.tsx` + test update
- **Tại sao tách**: Component có logic render, cần test theo TDD gate
- **Output**: 3 test case pass + Image element render OK

### Subplan 2 — Whitelist hostname trong next.config.ts

- **Concern**: Build config — thêm hostname IP server thật
- **File**: `next.config.ts`
- **Tại sao tách**: Build config không có runtime logic, KHÔNG viết unit test (theo testing-required.mdc). Verify bằng build + manual smoke
- **Output**: Build pass, manual smoke localhost:3000 không còn lỗi

### Quyết định: chạy tuần tự vì Subplan 2 chỉ thêm config, không phụ thuộc Subplan 1.

## 7. Test strategy

### 7.1 — Component test (Subplan 1)

Thêm describe `HeroBannerSection – imageUrl normalization`:

```ts
it("renders fallback when imageUrl is null", async () => {
  // Setup mock với mainSlides[0].imageUrl = null
  const img = container.querySelector('[data-testid="hero-img-0"]');
  expect(img).toBeTruthy();
  expect(img?.getAttribute("src")).toBe("/images/placeholder-product.png");
});

it("renders fallback when imageUrl is empty string", async () => {
  // Setup mock với imageUrl = ""
  const img = container.querySelector('[data-testid="hero-img-0"]');
  expect(img?.getAttribute("src")).toBe("/images/placeholder-product.png");
});

it("renders absolute URL http://180.93.137.28/... as-is (no throw)", async () => {
  // Setup mock với imageUrl absolute trỏ về IP server thật
  const img = container.querySelector('[data-testid="hero-img-0"]');
  expect(img).toBeTruthy();
  expect(img?.getAttribute("src") ?? "").toContain("180.93.137.28");
  // Quan trọng: chỉ verify render không throw, KHÔNG verify optimize qua /_next/image
  // (test env không có Next.js image optimizer)
});

it("ghép NEXT_PUBLIC_API_URL vào relative path", async () => {
  // Setup mock với imageUrl = "/banners/hero-1.jpg"
  process.env.NEXT_PUBLIC_API_URL = "http://180.93.137.28";
  const img = container.querySelector('[data-testid="hero-img-0"]');
  expect(img?.getAttribute("src")).toBe("http://180.93.137.28/banners/hero-1.jpg");
});
```

### 7.2 — Build verification (Subplan 2)

`next.config.ts` là build config (theo `testing-required.mdc` mục "Khi nào KHÔNG cần test"):

```bash
npm run build         # PHẢI pass — Next.js validate remotePatterns khi build
npm run lint          # PHẢI pass
npx tsc --noEmit      # PHẢI pass
npx vitest run        # Regression: không break test khác
```

### 7.3 — Manual smoke (Subplan 2)

- Reload `http://localhost:3000/` sau khi dev server tự restart
- Hero banner phải render (không crash trắng trang)
- DevTools → Console → KHÔNG còn lỗi "Invalid src prop ... hostname 180.93.137.28"
- DevTools → Network → filter `image` → request `/_next/image?url=http%3A%2F%2F180.93.137.28%2F...&w=...&q=75` → status 200

## 8. Out of scope

- ❌ Whitelist wildcard hostname (vd `**`) — bảo mật yếu.
- ❌ Xoá `cdn.vibemart.vn` / `lh3.googleusercontent.com` / `vibe-mart-utc2.canluaz.io.vn` / `picsum.photos` / `localhost` — vẫn dùng cho các concern khác.
- ❌ Sửa `.env` (đã đúng với production).
- ❌ Sửa `src/lib/images/with-fallback.ts` (helper đã cover edge cases).
- ❌ Sửa `src/features/homepage/api.ts` (transform URL đã đúng).
- ❌ Bắt đầu BE Spring Boot trả banner thật — thuộc `flash-sale-b2c-UTC2` repo, ngoài FE scope.

## 9. Risk

| Risk | Mitigation |
|---|---|
| `.env` lại đổi host (vd sang canonical domain) | Update entry này hoặc xoá + dùng `vibe-mart-utc2.canluaz.io.vn` đã whitelist sẵn. |
| IP thay đổi (redeploy VPS) | Production nên dùng canonical domain (HTTPS), IP chỉ là fallback dev/preview. |
| `/**` pathname quá rộng | An toàn vì hostname cụ thể (không wildcard hostname). |
| Helper ghép URL sai → 404 image | Helper đã có 8 test case cover edge cases (xem `with-fallback.test.ts`). |
| Auto-commit vi phạm pre-commit checklist | Tuân thủ 7 mốc pre-commit theo `git-workflow.mdc`. |

## 10. Commit message (preview)

```
fix(storefront): whitelist prod IP hostname and normalize HeroBanner images

Production runtime error khi user mo trang chu:
"Invalid src prop (http://180.93.137.28/banners/hero-1.jpg) on
next/image, hostname 180.93.137.28 is not configured under images in
your next.config.js"

Root cause 2-tang:
1. next.config.ts chi whitelist cdn.vibemart.vn,
   lh3.googleusercontent.com, vibe-mart-utc2.canluaz.io.vn,
   picsum.photos, localhost — IP 180.93.137.28 (env
   NEXT_PUBLIC_API_URL production) KHONG co trong whitelist.
2. HeroBannerSection render <Image src={slide.imageUrl}> truc tiep
   KHONG qua helper imageUrlWithFallback() da co o
   src/lib/images/with-fallback.ts. Khi imageUrl null/empty/relative,
   component de throw hoac ghep sai URL.

Fix (2-tang):
1. next.config.ts: them hostname "180.93.137.28" voi protocol "http"
   va pathname "/**" vao images.remotePatterns de cover anh tu IP
   server that khi .env tro NEXT_PUBLIC_API_URL = http://180.93.137.28.
2. HeroBannerSection: import imageUrlWithFallback, doi
   src={slide.imageUrl} thanh src={imageUrlWithFallback(slide.imageUrl,
   "banner")} de case null/undefined/empty/relative deu tra URL hop le.

Test:
- src/components/storefront/sections/HeroBannerSection.test.tsx
  (added 4 cases): imageUrl null/empty/absolute-IP/relative+baseURL
  deu render placeholder hoac ghep URL dung, khong throw
- next.config.ts khong co runtime logic theo testing-required.mdc,
  chi verify bang npm run build, npm run lint, npx tsc --noEmit,
  regression npx vitest run, manual smoke localhost:3000

Xoa entry 180.93.137.28 khi:
- Deploy production voi NEXT_PUBLIC_SITE_URL =
  https://vibe-mart-utc2.canluaz.io.vn (da whitelist san)
- BE chuyen sang CDN that (vd cdn.vibemart.vn)
```

## 11. Workflow reminder

- **Branch**: REUSE `fix/next-image-local-dev-hostname` (HEAD local vẫn ở đây, dù git log đã có commit merge — local HEAD chưa push). User chọn reuse để gộp concern liên quan về `next/image` hostname.
- **Pre-commit checklist (git-workflow.mdc)**: 7 mốc (mốc 4 "test kèm" PHẢI pass với 4 test case mới; mốc 6 "body liệt kê test file" PHẢI ghi rõ)
- **Auto-commit** sau khi build/lint/tsc/test pass
- **KHÔNG push** (chờ user duyệt)
- **Commit language**: English (theo `git-workflow.mdc` mục "Commit language (ENFORCED from 2026-10-09)")
