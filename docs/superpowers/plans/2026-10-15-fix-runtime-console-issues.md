# Plan — Fix Runtime Console Issues on Storefront Homepage (2026-10-15)

## Context

User visit `http://localhost:3000/` (guest, chưa login), copy Chrome DevTools console log. Phát hiện **5 issues runtime**:

| # | Severity | Vấn đề | File | Root cause |
|---|---|---|---|---|
| 1 | 🔴 Critical | **Hydration mismatch trên `<html>`** | `src/app/layout.tsx:74` | Browser extension **Katalon Recorder** tự inject `katalonextensionid` attribute vào `<html>` sau khi SSR xong, trước khi React hydrate. React cảnh báo "won't be patched up". |
| 2 | 🔴 Critical | **4 banner images 404** | `src/components/storefront/sections/HeroBannerSection.tsx:189` | Component dùng `<img src={slide.imageUrl}>` với URL `/banners/hero-1.jpg`...`hero-4.jpg` (fallback cứng trong API mock? hoặc từ API), nhưng `public/banners/` KHÔNG TỒN TẠI. |
| 3 | 🟡 Warning | **next/image width/height mismatch** | `src/components/storefront/StorefrontHeader.tsx:275` | Logo: `width={128} height={36}` nhưng CSS `className="h-9 w-auto"` override `height` xuống còn 36px mà không giữ `width` tương ứng. React cảnh báo. |
| 4 | 🟡 Expected | **401 khi gọi `/vouchers/platform` + `/cart`** | `src/features/cart/hooks.ts:143` + `src/features/homepage/api.ts:125` | Guest user mà vẫn fire query cho cart (header) + platform vouchers (homepage). BE trả 401 → vẫn log error, UX không graceful. |
| 5 | 🟢 Info | **STOMP unload policy violation** | `src/lib/stomp.ts:2` | SockJS cố `attachEvent('onunload', ...)` — browser cảnh báo. Không ảnh hưởng UX, nhưng gây nhiễu console. |

## Root cause analysis (từng issue)

### Issue 1: Hydration mismatch

Stack frame cho thấy mismatch ở `<html>`:
- Server render: `<html lang="vi" className="...">`
- Client render: `<html lang="vi" className="..." katalonextensionid="hdodkejagjkdomgbiioijegfmiiknoam">`

Đây là extension Katalon tự inject attr. **KHÔNG phải bug code FE** — extension inject vào DOM sau khi Next.js stream HTML xong, trước khi React hydrate. React cảnh báo "won't be patched up" vì React không thể đồng bộ attr này.

**Cách xử lý (FE phòng thủ)**:
- Thêm `suppressHydrationWarning` lên `<html>` element — React sẽ BỎ QUA khác biệt attr ở `<html>` (không phải children).
- Trade-off: Mọi attr thêm vào `<html>` (extension, ad-blocker) sẽ bị bỏ qua. Acceptable — `<html>` không nên chứa state runtime.

### Issue 2: Banner 404

`public/banners/` KHÔNG tồn tại (Glob verified). Component render `<img src={slide.imageUrl}>` với:
- Nếu API trả data → URL từ BE (đa số là URL tuyệt đối OK).
- Nếu API lỗi (404 ở `/banners/home`) → fallback sang `useFeaturedProducts` → URL từ `/api/v1/products` (lại URL tuyệt đối).

User báo 4 file `/banners/hero-1.jpg` → `/banners/hero-4.jpg` → URL tương đối bắt đầu `/banners/` → gợi ý **hard-code URL trong mock data** khi API trả `imageUrl: "/banners/hero-1.jpg"` (relative path), hoặc `imageUrl` rỗng/null → component build fallback path.

**Cách xử lý**:
- Audit mock: kiểm tra `HeroBannerSection` + `useFeaturedProducts` mock có hard-code `/banners/hero-*.jpg` không.
- Sửa `<img>` → dùng `next/image` (đã có trong `StorefrontHeader`, đã có quy tắc mục 10 CLAUDE.md) — `next/image` validate URL hợp lệ, fallback graceful khi 404.
- Hoặc: Thêm **empty state placeholder** khi `imageUrl` rỗng hoặc fetch fail (xóa img, hiện placeholder bg).
- Hoặc: Thêm **default fallback URL** trong env: `NEXT_PUBLIC_BANNER_PLACEHOLDER_URL` → dùng khi image load fail.

**Quyết định (sẽ hỏi user ở Bước 4)**:
- **Option A (tối thiểu)**: Thêm `onError` handler → fallback sang gradient placeholder bg. KHÔNG cần thêm asset.
- **Option B (đầy đủ)**: Tạo 4 file placeholder ảnh thật trong `public/banners/` + commit binary.
- **Option C (next/image)**: Switch từ `<img>` → `<Image>` với `unoptimized` prop, dùng placeholder bg.

### Issue 3: Logo next/image warning

`StorefrontHeader.tsx:275`:
```tsx
<Image
  alt="Vibe Mart"
  src="/images/vibe-mart-logo-lockup-light.png"
  width={128}
  height={36}
  priority
  className="h-9 w-auto object-contain"  // ← override height xuống 36px (Tailwind h-9 = 2.25rem = 36px)
/>
```

CSS `h-9` set height 36px (đúng với `height={36}`), nhưng `w-auto` KHÔNG set width tương ứng — Next.js cảnh báo "either width or height modified, but not the other".

**Fix**: Thêm `style={{ width: "auto", height: "auto" }}` để giữ aspect ratio khi CSS override một trong hai chiều. Tailwind class `h-9 w-auto` sẽ set `height: 36px` (khớp với `height={36}` prop) và `width: auto` (sẽ dùng intrinsic ratio).

### Issue 4: 401 cho guest

`useCartCount` + `useCart` không guard theo `isAuthenticated`. Guest user mà vẫn fire query → BE 401 → tanstack retry 1 lần → vẫn 401 → console error spam.

**Cách xử lý**:
- Trong `StorefrontHeader`, chỉ render `useCartCount()` khi `isAuthenticated` (chưa login → không hiện badge cart).
- Trong `useCartCount` hook, thêm guard `enabled: isAuthenticated`.
- Với `usePlatformVouchers` (homepage) — vouchers thường là public data nhưng BE trả 401 → cần check API contract.

**Quyết định**:
- Cart hook: add `useAuth()` guard. Nếu `!isAuthenticated` → return `{ count: 0, isLoading: false }`.
- Platform vouchers: Kiểm tra Swagger `/vouchers/platform` — nếu BE yêu cầu auth thì đó là bug BE. Nếu BE public, kiểm tra tại sao 401 (có thể do token stale). Tạm thời: silent fail trong guest mode.

### Issue 5: STOMP violation

SockJS cố attach `unload` event listener. Chrome cảnh báo "Permissions policy violation: unload is not allowed in this document" do **Permissions-Policy** của Next.js dev server. Đây là vấn đề của thư viện SockJS, không thể sửa từ FE (SockJS 1.x đã cũ).

**Cách xử lý**:
- Migrate sang `ws` thuần (bỏ SockJS) — `@stomp/stompjs` hỗ trợ. Chỉ cần đổi `webSocketFactory: () => new WebSocket(wsUrl)` thay vì `SockJS`.
- Hoặc: Tạm thời set `reconnectDelay: 0` + `debug: () => {}` — không giải quyết root cause.

**Quyết định**: Migrate sang `WebSocket` thuần (Next 16 + modern Spring Boot hỗ trợ native WS).

## Scope

| File | Loại | Lý do |
|---|---|---|
| `src/app/layout.tsx` | SỬA (1 dòng) | Thêm `suppressHydrationWarning` cho `<html>` |
| `src/components/storefront/StorefrontHeader.tsx` | SỬA (1 dòng) | Logo: thêm `style={{ width: "auto", height: "auto" }}` |
| `src/components/storefront/StorefrontHeader.tsx` | SỬA (1 block) | Guard `useCartCount` theo `isAuthenticated` |
| `src/features/cart/hooks.ts` | SỬA (2 block) | `useCart` + `useCartCount` thêm `enabled: isAuthenticated` logic |
| `src/components/storefront/sections/HeroBannerSection.tsx` | SỬA (1 block) | Thêm `onError` handler cho `<img>` → fallback gradient placeholder |
| `src/lib/stomp.ts` | SỬA (1 block) | Migrate từ SockJS → `WebSocket` thuần |
| `src/features/homepage/hooks.ts` | SỬA (1 block) | `usePlatformVouchers` thêm 401 graceful handling |
| Test files cho mỗi file trên | SỬA (5-6 tests) | Bắt buộc theo `testing-required.mdc` |

## Files KHÔNG sửa (out of scope)

- `src/features/cart/api.ts` — chỉ fix client-side guard, không đổi API.
- `src/lib/api/client.ts` — không đổi (đã đúng).
- Backend files — không thuộc repo này.
- `src/components/storefront/StorefrontHeader.test.tsx` — chưa tồn tại, tạo mới trong scope.

## Tham khảo

- `docs/CLAUDE.md` mục 4 (quy tắc chống rối mắt) + mục 7 (gọi API và xử lý dữ liệu) + mục 8 (Flash Sale, auth, giỏ hàng).
- `.cursor/rules/error-handling.mdc` mục 1 (phân cấp lỗi) + mục 3 (THROW vs CATCH vs TOAST) + mục 7 (race condition).
- `.cursor/rules/component-pattern.mdc` mục 10 (ảnh dùng `next/image`, có `alt`).
- `.cursor/rules/testing-required.mdc` — bugfix BẮT BUỘC có reproduction test.
- `next/headers` & `next/script` docs (Next 16.3.8 — đọc `node_modules/next/dist/docs/`).
- `node_modules/@stomp/stompjs/` để check API hiện tại.

## Subplan

Vì task là **multi-file nhưng cùng concern (clean up console runtime issues)**, chia thành **3 subplan** có thể chạy tuần tự (cần thiết vì `useCart` guard ảnh hưởng đến test của header):

| Subplan | Concern | File | Tests |
|---|---|---|---|
| **SP-1** | Hydration + Logo warning | `layout.tsx` + `StorefrontHeader.tsx` (1 dòng logo) | Reproduce: `layout.test.tsx` (mới) check `suppressHydrationWarning`; `StorefrontHeader.test.tsx` (mới) check logo style |
| **SP-2** | Guest 401 handling | `useCart` + `useCartCount` + header | `cart.hooks.test.ts` (thêm 2 test) + `StorefrontHeader.test.tsx` (thêm 1 test) |
| **SP-3** | Banner 404 + STOMP violation | `HeroBannerSection.tsx` + `stomp.ts` + `usePlatformVouchers` | `HeroBannerSection.test.tsx` (thêm 2 test) + `stomp.test.ts` (mới 1 test) + `homepage.hooks.test.ts` (thêm 1 test) |

## Test strategy

| Test | Type | Expected |
|---|---|---|
| SP-1: layout không warn hydration khi extension inject | NEW unit | Mount component, modify `<html>` attr manually, không có console.error |
| SP-1: logo có `style` chứa `width: "auto"` | NEW unit | Render header, query logo `<Image>`, check style attr |
| SP-2: useCart không fetch khi guest | NEW unit | `useAuth` mock `isAuthenticated=false` → `fetch` không được gọi |
| SP-2: useCartCount trả 0 khi guest | NEW unit | Render hook, `data === 0` |
| SP-2: StorefrontHeader không hiển thị cart badge khi guest | NEW unit | Render header với `isAuthenticated=false`, không tìm thấy badge |
| SP-3: HeroBanner fallback placeholder khi image 404 | NEW unit | Mock `imageUrl: "/banners/hero-1.jpg"`, simulate image error, check placeholder class |
| SP-3: stomp client KHÔNG dùng SockJS | NEW unit | Mock env, create client, check `webSocketFactory` returns plain WebSocket |
| SP-3: usePlatformVouchers không error 401 cho guest | NEW unit | Mock `isAuthenticated=false`, MSW 401, hook vẫn ổn định (no throw) |

## Implementation outline

### SP-1 (Hydration + Logo)
1. `layout.tsx`: thêm `suppressHydrationWarning` lên `<html>`.
2. `StorefrontHeader.tsx:275`: thêm `style={{ width: "auto", height: "auto" }}` vào Logo `<Image>`.
3. Test: tạo `layout.test.tsx` + `StorefrontHeader.test.tsx`.

### SP-2 (Guest 401)
1. `useCart`: thêm param optional `enabled` mặc định = `true`, hoặc wrap với `useAuth`.
2. `StorefrontHeader`: dùng `useAuth().isAuthenticated` để gate `useCartCount` (return `0` khi guest).
3. Test: `cart.hooks.test.ts` + `StorefrontHeader.test.tsx`.

### SP-3 (Banner + STOMP + Voucher)
1. `HeroBannerSection.tsx:189`: thêm `onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-gradient-to-br from-primary-fixed to-secondary-fixed/50'); }}` hoặc dùng state.
2. `stomp.ts`: bỏ `sockjs-client` import, dùng `new WebSocket(wsUrl)` trong `webSocketFactory`.
3. `usePlatformVouchers` (homepage): thêm catch 401 → return `[]` thay vì throw.
4. Test: mở rộng 3 file test.

## Pre-commit verification (mỗi subplan)

- [ ] `npm run test -- <file>` → PASS
- [ ] `npm run lint` → PASS
- [ ] `npm run tsc --noEmit` → PASS
- [ ] Manual smoke: refresh `http://localhost:3000/` → không còn 5 issues trên

## Risks

| Risk | Mitigation |
|---|---|
| `suppressHydrationWarning` che giấu bug khác trên `<html>` | Scope giới hạn ở `<html>` element; nếu có bug trong `className` sẽ thấy. |
| WebSocket thuần có thể fail nếu BE bắt buộc SockJS | Cần verify BE Spring Boot có hỗ trợ ws thuần không (đa số đã hỗ trợ từ 2.0+). Nếu fail → fallback về SockJS kèm warning. |
| Cart hook guard phá vỡ test cũ | Test cũ phải set `isAuthenticated=true` (mock useAuth). |
| 1 commit nhiều concern | Theo rule: 1 subplan = 1 commit. Total = 3 commit. |
