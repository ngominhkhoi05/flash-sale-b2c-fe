# Plan: Tích hợp đăng nhập Google OAuth2 (Authorization Code + Popup)

**Date**: 2026-10-16
**Branch**: `feat/google-login-integration` (tạo từ `origin/dev`)
**Source of truth**: `docs/handoffs/fe-google-login-integration-guide.md` (BE soạn 2026-10-16)
**Stack**: Next 16.3.8 · React 19.2 · TS 5.x · Tailwind 4.x

---

## 1. Scope

Tích hợp backend `flash-sale-b2c-UTC2` OAuth2 Authorization Code flow cho Google. Thay thế stub "Chức năng đang phát triển" của nút Google trong 2 màn hình:

- `src/components/auth/SocialLoginButtons.tsx` (3-col grid ở cuối LoginForm)
- `src/components/auth/RegisterForm.tsx` (3-col grid ở đầu form)

GIỮ nguyên 2 nút Facebook + GitHub ở trạng thái stub (BE chưa có endpoint cho 2 provider này — `docs/api-reference.md` chỉ list Google/Facebook/GitHub, nhưng BE handoff chỉ cung cấp guide cho Google).

### Files sẽ thay đổi

| File | Loại | Mục đích |
|---|---|---|
| `src/features/auth/google-api.ts` | **MỚI** | Pure functions gọi `/auth/google/url` + `/auth/google` |
| `src/features/auth/google-api.test.ts` | **MỚI** | Test pure API functions |
| `src/features/auth/google-mocks.ts` | **MỚI** | Mock data cho dev/test |
| `src/features/auth/google-mocks.test.ts` | **MỚI** | Test mock structure |
| `src/features/auth/useGoogleLogin.ts` | **MỚI** | Hook xử lý popup flow (mở popup, listen postMessage, gọi loginWithGoogle, lưu token + user) |
| `src/features/auth/useGoogleLogin.test.ts` | **MỚI** | Test hook (status, popup, postMessage) |
| `src/components/auth/GoogleLoginButton.tsx` | **MỚI** | Component nút Google (icon-only ở grid, mở popup) |
| `src/components/auth/GoogleLoginButton.test.tsx` | **MỚI** | Test component |
| `src/app/oauth2/redirect/page.tsx` | **MỚI** | Trang callback (chạy trong popup, đọc code, postMessage về parent, đóng) |
| `src/app/oauth2/redirect/page.test.tsx` | **MỚI** | Test trang callback |
| `src/components/auth/SocialLoginButtons.tsx` | SỬA | Thay click Google → dùng GoogleLoginButton (Facebook/GitHub vẫn stub) |
| `src/components/auth/SocialLoginButtons.test.tsx` | SỬA | Update test: Google click thực sự gọi hook |
| `src/components/auth/RegisterForm.tsx` | SỬA | Thay click Google trong 3-col grid → dùng GoogleLoginButton |
| `src/components/auth/RegisterForm.test.tsx` | CÓ THỂ SỬA | Update test nếu có |
| `src/features/auth/index.ts` | SỬA | Export GoogleLoginButton + useGoogleLogin |
| `messages/vi.json` | SỬA | Thêm `auth.google.*` (button/loading/ariaLabel/callback/error) |
| `messages/en.json` | SỬA | Thêm tương ứng `auth.google.*` EN |
| `.env.example` | CÓ THỂ SỬA | Document `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` (optional, default build từ `NEXT_PUBLIC_SITE_URL`) |

### Files KHÔNG thay đổi

- `src/stores/auth.store.ts` — đã đúng pattern (chỉ lưu user, token ở localStorage)
- `src/lib/api/client.ts` — đã có `apiFetch` + `ApiError`, dùng lại
- `src/lib/auth-guard.ts` / `require-auth.ts` — không liên quan (OAuth callback chạy client)
- `src/middleware.ts` — chưa có và không cần cho OAuth (popup flow không qua middleware)
- `src/components/ui/*` — dùng lại Button/Input có sẵn

---

## 2. Kiến trúc & Quyết định thiết kế

### 2.1 Sơ đồ phụ thuộc (tuân thủ `layer-convention.mdc`)

```
src/
├── features/auth/                       # Feature module (đã có)
│   ├── google-api.ts                    # MỚI: pure functions (apiFetch)
│   ├── google-mocks.ts                  # MỚI: mock data
│   ├── useGoogleLogin.ts                # MỚI: hook popup flow
│   └── index.ts                         # SỬA: export public
├── components/auth/
│   ├── GoogleLoginButton.tsx            # MỚI: icon-only 40x40
│   └── SocialLoginButtons.tsx           # SỬA: dùng GoogleLoginButton cho Google
├── app/oauth2/redirect/
│   ├── page.tsx                         # MỚI: callback page (chạy trong popup)
│   └── page.test.tsx                    # MỚI
└── messages/{vi,en}.json                # SỬA: thêm auth.google.*
```

### 2.2 Sự khác biệt với guide

| Guide đề xuất | Cách triển khai thực tế | Lý do |
|---|---|---|
| Hook đặt `src/hooks/useGoogleLogin.ts` | Đặt `src/features/auth/useGoogleLogin.ts` | `layer-convention.mdc` + `features-migration.mdc`: hook của feature đặt trong feature |
| `setAuth({accessToken, refreshToken, user, roles})` trực tiếp trong store | Dùng `setAccessToken`/`setRefreshToken` (từ `@/lib/api`) + `setUser` + `toAuthUser(accessToken)` | `auth-jwt.mdc`: store KHÔNG lưu token; pattern hiện tại của `useLoginMutation` |
| `GoogleLoginButton` 1 nút full-width | Icon-only 40x40 (cùng style Facebook/GitHub) trong 3-col grid | Giữ UX nhất quán 3 provider; sau này FB/GH có OAuth thì chỉ thay stub → thật tương tự |
| `useGoogleLogin` tự tạo `setAuth` | Dùng `useLoginMutation` pattern: `setAccessToken` + `setRefreshToken` + `toAuthUser` + `setUser` | Tái sử dụng `decodeJwtPrimaryRole` (đã có trong `features/auth/jwt.ts`) |
| `postMessage` payload `{type: 'google-oauth-callback', code, error}` | Giữ nguyên format guide | Tương thích với spec BE |
| Trang callback dùng `useAuthStore.setAuth` trực tiếp | Trang callback gọi `loginWithGoogle` (api) → nhận `AuthResponse` → dùng helper `applyAuthResponse(res)` (DRY với `useLoginMutation`) | DRY: cùng logic setUser + setToken + invalidate query |

### 2.3 Token storage (theo `auth-jwt.mdc`)

- `access_token` → `localStorage` key `fs_access_token` (qua `setAccessToken`)
- `refresh_token` → `sessionStorage` key `fs_refresh_token` (qua `setRefreshToken`)
- Cookie `access_token` → `setAccessToken` tự set (để middleware/SSR đọc)
- `useAuthStore` → chỉ lưu `user` (id, email, fullName, role, avatarUrl)

### 2.4 CSRF state (mục 13.1 guide)

- KHÔNG tự generate `state` UUID trong FE cho guide's BE 2026-10-16
- BE đã trả `state` trong `getGoogleConsentUrl` response (xem mục 3.1 guide)
- FE **dùng luôn `authorizationUrl` từ BE** (đã bao gồm state do BE tự generate)
- → Đơn giản hoá flow, không cần override URL
- Nếu user muốn CSRF cao cấp hơn, sẽ là task riêng

### 2.5 Error handling

- `useGoogleLogin` throw / set state lỗi → component đọc state, hiển thị `toast.error` (theo `error-handling.mdc`)
- Code → i18n key ở `messages/<locale>.json` `error.AUTH_502_GOOGLE_EXCHANGE`, etc. (5 codes theo guide mục 3.3 + 1 `POPUP_BLOCKED` + 1 `UNKNOWN`)
- Popup blocked: catch `window.open` return null → toast "Trình duyệt đã chặn popup"

### 2.6 Mock mode

- `NEXT_PUBLIC_USE_MOCK === 'true'` → `google-api.ts` trả mock data (theo pattern `api.ts` dùng `if (process.env.NEXT_PUBLIC_USE_MOCK === 'true')` import mock)
- Mock: `getGoogleConsentUrlMock` trả URL trỏ về `window.location.origin + '/oauth2/redirect?code=MOCK_CODE&state=MOCK_STATE'`
- Mock: `loginWithGoogleMock` trả `AuthResponse` giả lập

### 2.7 Callback page (`/oauth2/redirect`)

- Client Component, dùng `useSearchParams` để đọc `code`/`error`/`state`
- Không cần layout (popup độc lập)
- Suspense wrapper vì `useSearchParams` cần
- postMessage type `'google-oauth-callback'` tới `window.opener` với `code` hoặc `error`
- Sau khi xử lý xong, `setTimeout(() => window.close(), 200)`
- KHÔNG dùng middleware (popup navigate tới `/oauth2/redirect` là public route)

---

## 3. Subplan (chia task)

Mỗi subplan là 1 commit độc lập.

### Subplan 1: Backend integration layer (api + mocks + types)

**Files**:
- `src/features/auth/google-api.ts` (new)
- `src/features/auth/google-api.test.ts` (new — test FAIL trên code thật, PASS với mock env)
- `src/features/auth/google-mocks.ts` (new)
- `src/features/auth/google-mocks.test.ts` (new — verify mock shape)

**Quyết định**:
- `getGoogleConsentUrl()`: `GET /api/v1/auth/google/url` → unwrap `data`
- `loginWithGoogle({code, redirectUri})`: `POST /api/v1/auth/google` → unwrap `data`
- Mock check: `process.env.NEXT_PUBLIC_USE_MOCK === 'true'` import `getGoogleConsentUrlMock`/`loginWithGoogleMock`

**Test (TDD red → green)**:
1. Test `getGoogleConsentUrl` parses BE envelope `data.authorizationUrl` đúng
2. Test `loginWithGoogle` gửi `code`+`redirectUri` đúng format
3. Test `loginWithGoogle` throw `ApiError` khi BE lỗi
4. Test mocks trả shape đúng với type `AuthResponse`/`GoogleConsentUrlResponse`

### Subplan 2: Hook useGoogleLogin (popup flow)

**Files**:
- `src/features/auth/useGoogleLogin.ts` (new)
- `src/features/auth/useGoogleLogin.test.ts` (new)

**Logic**:
- `login()`: gọi `getGoogleConsentUrl` → `window.open(authorizationUrl, 'google-oauth', 'width=500,height=600')`
- Lưu `redirectUri` vào `sessionStorage` key `google_oauth_redirect_uri`
- `window.addEventListener('message', handleMessage)` — origin check `event.origin === window.location.origin`, type check `event.data?.type === 'google-oauth-callback'`
- Nhận `{code}` → set status `authenticating` → gọi `loginWithGoogle({code, redirectUri})` → `applyAuthResponse(res)` (helper local) → `setStatus('idle')` + `onSuccess?.(user)`
- Nhận `{error}` → `setStatus('error')` + `onError?.(err)`
- Polling fallback: `setInterval(check popup.closed, 500)` nếu popup đóng mà chưa có message → reset về idle (user cancel)
- `window.open` return `null` → throw `POPUP_BLOCKED`
- Cleanup: `useEffect` clear polling khi unmount

**Helper `applyAuthResponse`** (DRY với `useLoginMutation`):
```ts
async function applyAuthResponse(res: AuthResponse) {
  setAccessToken(res.accessToken);
  setRefreshToken(res.refreshToken);
  const user = toAuthUser(res.user, res.accessToken);
  setUser(user);
  await Promise.all(POST_LOGIN_INVALIDATE_KEYS.map(k => qc.invalidateQueries({queryKey: k})));
  return user;
}
```

**Test (TDD red → green)**:
1. Hook init state `{status: 'idle', error: null}`
2. `login()` mở `window.open` với authorizationUrl
3. Nhận message với `code` → gọi `loginWithGoogle` + lưu token
4. Nhận message với `error` → set error state
5. `window.open` return null → set error `POPUP_BLOCKED`
6. `reset()` reset về idle
7. Polling: popup đóng nhưng không có message → set status idle (user cancel)

### Subplan 3: Component GoogleLoginButton

**Files**:
- `src/components/auth/GoogleLoginButton.tsx` (new)
- `src/components/auth/GoogleLoginButton.test.tsx` (new)

**Props**:
- `disabled?: boolean`
- `next?: 'login' | 'register'` (để i18n key khác nhau: `auth.social.google` vs `auth.social.googleRegister`)

**UI**:
- Icon-only 40x40 (cùng style 2 nút FB/GH trong grid)
- Render: button `<button>` với SVG Google + aria-label
- Click: gọi `useGoogleLogin().login()`
- Loading: spinner (lucide `Loader2` với `animate-spin`) thay SVG, disable
- Error: inline `<p role="alert">` dưới button (chỉ khi 1 nút đứng riêng, không phải trong grid)
- Redirect sau khi success: tự đọc `?returnUrl=` từ `searchParams`, default `/`

**i18n keys** (cập nhật `auth.social` hiện có):
- `auth.social.google` / `auth.social.googleRegister` (đã có)
- `auth.social.googleLoading` (MỚI)

**Test (TDD red → green)**:
1. Render button với aria-label
2. Click → gọi `useGoogleLogin().login()` (mock hook)
3. Disabled prop → disable button
4. Loading state → spinner thay icon

### Subplan 4: Trang callback /oauth2/redirect

**Files**:
- `src/app/oauth2/redirect/page.tsx` (new)
- `src/app/oauth2/redirect/page.test.tsx` (new)

**Logic**:
- `useSearchParams` đọc `code`, `error`, `error_description`, `state`
- Đọc `redirectUri` từ `sessionStorage.getItem('google_oauth_redirect_uri')`
- Nếu `error`: postMessage `{type: 'google-oauth-callback', error}` → `setTimeout(window.close, 1500)`
- Nếu không có `code`: postMessage error → close
- Nếu có `code`: gọi `loginWithGoogle({code, redirectUri})` → `applyAuthResponse(res)` → postMessage `{type: 'google-oauth-callback', code}` → `setTimeout(window.close, 200)`
- Render: spinner + "Đang hoàn tất đăng nhập" (i18n `auth.google.callback.processing`) hoặc error state

**Test (TDD red → green)**:
1. URL có `code` → gọi `loginWithGoogle` với code + redirectUri
2. URL có `error` → postMessage error, không gọi login
3. URL không có code và không có error → postMessage error "Không nhận được authorization code"
4. postMessage target: `window.opener`, origin: `window.location.origin`

### Subplan 5: Tích hợp vào SocialLoginButtons + RegisterForm + i18n

**Files**:
- `src/components/auth/SocialLoginButtons.tsx` (sửa)
- `src/components/auth/SocialLoginButtons.test.tsx` (sửa)
- `src/components/auth/RegisterForm.tsx` (sửa — nếu có test file cũng sửa)
- `src/features/auth/index.ts` (sửa — export)
- `messages/vi.json` (sửa — thêm `auth.google.*`)
- `messages/en.json` (sửa — tương ứng)

**Logic sửa**:
- `SocialLoginButtons.tsx`:
  - Mapping `id: 'google' | 'facebook' | 'github'` → render 1 trong 2:
    - `id === 'google'` → `<GoogleLoginButton />`
    - `id !== 'google'` → button stub như cũ (toast "chức năng đang phát triển")
  - Giữ nguyên layout 3-col grid, divider, aria-label
- `RegisterForm.tsx`:
  - Thay 3 button inline (Google/FB/GH) → dùng `<GoogleLoginButton />` cho Google + 2 button stub cho FB/GH (hoặc refactor dùng SocialLoginButtons)
  - **Tối ưu**: tách phần social thành component riêng nếu cần, nhưng minimal change → thay inline button Google bằng `<GoogleLoginButton />`, giữ 2 button FB/GH inline
- `index.ts`: thêm `export { useGoogleLogin } from './useGoogleLogin';` + `export { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';`

**i18n keys mới (cả vi + en)**:
```json
"google": {
  "button": "Đăng nhập bằng Google",
  "buttonRegister": "Đăng ký bằng Google",
  "loading": "Đang xử lý...",
  "ariaLabel": "Đăng nhập bằng tài khoản Google",
  "ariaLabelRegister": "Đăng ký bằng tài khoản Google",
  "callback": {
    "processing": "Đang hoàn tất đăng nhập",
    "pleaseWait": "Vui lòng đời trong giây lát...",
    "error": "Đăng nhập thất bại",
    "closing": "Cửa sổ sẽ tự đóng sau vài giây"
  },
  "error": {
    "AUTH_502_GOOGLE_EXCHANGE": "Không thể kết nối với Google. Vui lòng thử lại.",
    "AUTH_401_GOOGLE_TOKEN": "Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.",
    "AUTH_401_GOOGLE_EMAIL_UNVERIFIED": "Email Google của bạn chưa được xác minh. Vui lòng kiểm tra trong tài khoản Google.",
    "AUTH_500_GOOGLE_CONFIG": "Đăng nhập bằng Google tạm thời không khả dụng. Vui lòng thử lại sau.",
    "POPUP_BLOCKED": "Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này.",
    "UNKNOWN": "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
  }
}
```

---

## 4. Test strategy

| Layer | Test | Tool |
|---|---|---|
| Pure API functions | Mock `apiFetch`, verify URL/method/payload | Vitest |
| Mock data | Verify shape match với `AuthResponse` | Vitest |
| Hook `useGoogleLogin` | Mock `apiFetch`, `window.open`, dispatch `MessageEvent` | Vitest + `renderHook` |
| Component `GoogleLoginButton` | Mock `useGoogleLogin`, verify render + click | Vitest + RTL + `userEvent` |
| Page `/oauth2/redirect` | Mock `useSearchParams`, verify API call + postMessage | Vitest + RTL |
| Integration | E2E với browser thật: chạy `npm run dev`, click nút Google | Manual smoke |

**Coverage mục tiêu**: ≥ 80% cho `useGoogleLogin.ts`, `google-api.ts`, `GoogleLoginButton.tsx`, `oauth2/redirect/page.tsx`.

---

## 5. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| `window.postMessage` không gửi được từ popup (browser policy) | Polling fallback `popup.closed` mỗi 500ms |
| `window.open` return null (popup blocker) | Catch + set error `POPUP_BLOCKED` + toast |
| State callback `useAuthStore` ở server không tồn tại | Mọi code gọi store đều trong `useEffect`/event handler (client-only) |
| `useSearchParams` yêu cầu Suspense ở Next 16 | Wrap callback page trong `<Suspense>` |
| Mock mode fail khi test (`process.env.NEXT_PUBLIC_USE_MOCK` không set) | Mock ở test riêng (không tin env), dùng `vi.mock` |
| BE trả `state` khác với expectation | Type `GoogleConsentUrlResponse.state?: string` (optional) — defensive |

---

## 6. Estimate

- Subplan 1 (api + mocks): ~30 min
- Subplan 2 (hook): ~45 min
- Subplan 3 (component): ~25 min
- Subplan 4 (callback page): ~30 min
- Subplan 5 (tích hợp + i18n): ~30 min
- Review + fix lint/tsc: ~20 min
- **Tổng**: ~3 giờ (5 commits)

---

## 7. Checklist trước khi merge

- [ ] Tất cả file LOGIC có file `.test.ts(x)` cùng folder
- [ ] `npm run test` PASS
- [ ] `npm run lint` PASS
- [ ] `npm run tsc --noEmit` PASS
- [ ] Commit message tiếng Anh + Conventional Commits
- [ ] Không commit `client_secret` (chỉ `client_id` qua env nếu cần — hiện KHÔNG cần vì BE tự build URL)
- [ ] Verify popup không bị CSP chặn (dev mode Next 16 mặc định OK)
- [ ] Test thủ công: click nút Google ở `/login` + `/register` → popup mở → giả lập Google redirect → parent nhận token → redirect về trang chủ

---

## 8. Out of scope (task này KHÔNG làm)

- Facebook OAuth (BE chưa có endpoint/guide)
- GitHub OAuth (BE chưa có endpoint/guide)
- Apple OAuth
- Tự build authorizationUrl (BE đã build sẵn, dùng lại)
- CSRF state UUID riêng (BE đã handle)
- Server-side auth guard cho `/oauth2/redirect` (popup navigate trực tiếp, không qua middleware — an toàn vì BE chỉ trả tokens sau khi verify Google JWKS)
- Retry logic cho `AUTH_502_GOOGLE_EXCHANGE` (đề xuất ở guide mục 11.2 — có thể thêm ở task sau nếu cần)
- `.env.example` update — không cần (redirectUri build từ `NEXT_PUBLIC_SITE_URL` có sẵn)
