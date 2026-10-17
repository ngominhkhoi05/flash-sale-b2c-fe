# Plan — Google OAuth2 Redirect Flow v2 (2026-10-17)

> **Status**: DRAFT — chờ user duyệt.
> **Author**: Cursor Assistant (claude-opus-5-5)
> **Branch**: `feat/google-oauth-redirect-v2` (đã tạo từ `dev` @ ee8951a)
> **Stack**: Next 16.3.8 · React 19.2 · TypeScript · Tailwind 4 · next-intl

---

## 1. Scope

Tích hợp đăng nhập Google OAuth2 theo flow **redirect** (đơn giản hơn flow popup hiện tại), theo handoff `docs/handoffs/google-oauth-fe-integration.md` (v2, 2026-10-17).

**Thay đổi so với code hiện tại (v1 popup):**

| Concern | v1 (hiện tại) | v2 (mới) |
|---|---|---|
| Flow | Popup + `window.open` + `postMessage` | Top-level `window.location.href = authorizationUrl` |
| Callback route | `/oauth2/redirect` (popup window) | `/auth/google/callback` (top-level) |
| State CSRF | Optional (FE tự generate) | Optional (handoff khuyến nghị) |
| `redirectUri` | Build từ `NEXT_PUBLIC_SITE_URL + '/oauth2/redirect'` | Đọc từ `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` |
| Token storage | localStorage qua `applyAuthResponse` | localStorage qua `applyAuthResponse` (giữ nguyên) |
| Error codes | `AUTH_502_GOOGLE_EXCHANGE` (HTTP 502), v.v. | GIỮ NGUYÊN CODE STRING (BE đã đổi HTTP 502→400 nhưng KHÔNG đổi code, tránh breaking change) |
| i18n | namespace `auth.google.error.*` | namespace `auth.google.error.*` + thêm 6 key mới theo handoff v2 (google_cancelled, google_no_code, v.v.) |

## 2. Files scope

### 2.1 Sẽ XÓA (thuộc flow v1 popup — không dùng nữa)

| File | Lý do |
|---|---|
| `src/features/auth/useGoogleLogin.ts` (220 LOC + 425 LOC test) | Flow popup không dùng |
| `src/features/auth/useGoogleLogin.test.tsx` | Test flow popup không dùng |
| `src/app/oauth2/redirect/page.tsx` (nếu đã tồn tại) | Callback cũ ở `/oauth2/redirect` → thay bằng `/auth/google/callback` |
| `src/app/oauth2/redirect/page.test.tsx` (nếu có) | Test callback cũ |

**Lưu ý**: User **chưa confirm có muốn xóa** các file v1 hay giữ lại để fallback (popup hiện tại đang hoạt động, redirect v2 cần test kỹ). Sẽ hỏi ở Bước 4.

### 2.2 SẼ GIỮ NGUYÊN

| File | Lý do |
|---|---|
| `src/features/auth/google-api.ts` | API 2 endpoint (url + login) không đổi — chỉ thay đổi CÁCH TIÊU THỤ |
| `src/features/auth/google-api.test.ts` | Test logic API — không thay đổi |
| `src/features/auth/google-mocks.ts` | Mock trả AuthResponse — không đổi |
| `src/features/auth/google-mocks.test.ts` | Test mocks — không đổi |
| `src/features/auth/apply-auth-response.ts` | Helper lưu token — không đổi |
| `src/features/auth/apply-auth-response.test.ts` | Test helper — không đổi |
| `src/features/auth/api.ts` (UserResponse, AuthResponse với `roles?: string[]`) | Theo Swagger v2 ngày 2026-10-17 |

### 2.3 SẼ TẠO MỚI

| File | LOC ước tính | Mục đích |
|---|---|---|
| `src/hooks/useGoogleRedirect.ts` | ~80 LOC | Hook đơn giản: gọi `getGoogleConsentUrl()` → `window.location.href = authorizationUrl`. Tương tự `useGoogleLogin` nhưng bỏ popup, polling, postMessage. |
| `src/hooks/useGoogleRedirect.test.ts` | ~120 LOC | Unit test hook: gọi API đúng path, set `window.location.href` đúng, error handling (network, popup block — KHÔNG có cho v2). |
| `src/hooks/useGoogleRedirect.test.tsx` | merged | Hook test qua `renderHook`. |
| `src/app/auth/google/callback/page.tsx` | ~120 LOC | Server-rendered shell wrap `<Suspense><CallbackClient /></Suspense>`. Client đọc `?code=`, `?error=`, `?state=`, gọi `loginWithGoogle`, lưu token, redirect. |
| `src/app/auth/google/callback/page-client.tsx` | merged hoặc tách | `'use client'` đọc `useSearchParams`. |
| `src/app/auth/google/callback/page.test.tsx` | ~180 LOC | Test 4 nhánh: (a) success, (b) error param, (c) no code, (d) state mismatch. |
| `src/app/auth/google/callback/loading.tsx` | ~20 LOC | Loading skeleton (Next 16 streaming). |
| `src/app/auth/google/callback/error.tsx` | ~30 LOC | Error boundary bắt `useEffect` exception. |
| `src/components/auth/GoogleLoginButton.tsx` | ~80 LOC | Nút "Đăng nhập bằng Google" dùng `useGoogleRedirect()`. Bind UI: button + spinner + error inline. |
| `src/components/auth/GoogleLoginButton.test.tsx` | ~120 LOC | Test render, click gọi hook, disabled khi loading. |
| `src/messages/vi.json` (sửa) | +9 keys | Thêm namespace `auth.google.error.*` (theo handoff v2 mục 4): google_cancelled, google_no_code, google_state_mismatch, google_AUTH_401_GOOGLE_TOKEN, google_AUTH_502_GOOGLE_EXCHANGE, google_AUTH_500_GOOGLE_CONFIG, google_AUTH_401_GOOGLE_EMAIL_UNVERIFIED, google_unknown. |
| `src/messages/en.json` (sửa) | +9 keys | Tương tự tiếng Anh. |
| `.env.local.example` (sửa, nếu có) | +2 keys | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` (theo handoff v2 mục 2.2). KHÔNG commit `.env.local` (đã gitignore). |

### 2.4 SẼ SỬA

| File | Loại sửa | Lý do |
|---|---|---|
| `src/app/(auth)/login/page.tsx` | Replace `SocialLoginButtons` bằng `<GoogleLoginButton>` | Component login cần tích hợp nút Google redirect (handoff v2 mục 4 bước 1 + AGENTS.md) |
| `src/app/(auth)/register/page.tsx` | Thêm `<GoogleLoginButton>` sau divider | Register cũng cho phép Google login (đã có pattern, xem handoff v1 mục 8.2) |
| `src/features/auth/index.ts` | Cập nhật export | Bỏ export `useGoogleLogin`, thêm `useGoogleRedirect` + `GoogleLoginButton` |

## 3. Tham khảo

### 3.1 Source of Truth (ưu tiên)

1. `docs/handoffs/google-oauth-fe-integration.md` (v2, 2026-10-17) — **handoff này user vừa gửi**
2. `docs/CLAUDE.md` mục 1 (stack), 5 (component chung), 6 (i18n), 7 (API), 8 (Auth), 11 (CSS)
3. `.cursor/rules/auth-jwt.mdc` — JWT + refresh token
4. `.cursor/rules/i18n.mdc` — next-intl pattern
5. `.cursor/rules/routing-guards.mdc` — URL convention
6. `.cursor/rules/component-pattern.mdc` — cva + forwardRef
7. `.cursor/rules/api-data.mdc` — apiFetch + ApiError
8. `.cursor/rules/testing-required.mdc` — TDD gate
9. `.cursor/rules/workflow-process.mdc` — 6-step workflow
10. `.cursor/rules/anti-drift-workflow.mdc` — checklist đầu response

### 3.2 Liên quan tới backend `flash-sale-b2c-UTC2`

- `GET /api/v1/auth/google/url` → `{ authorizationUrl, state }` — KHÔNG đổi
- `POST /api/v1/auth/google` body `{ code, redirectUri }` → `AuthResponse { accessToken, refreshToken, user, roles }` — KHÔNG đổi
- HTTP status `AUTH_502_GOOGLE_EXCHANGE` đã đổi 502→400 ngày 2026-10-17 (BE commit `fix/auth-http-400`) — code string giữ nguyên để tránh breaking change
- KHÔNG cần sửa BE.

## 4. Subplan (chia theo concern, mỗi cái 1 dispatch subagent hoặc 1 commit)

### Subplan 1 — Helper hook `useGoogleRedirect` (10/10/2026 dự kiến)

**Concern**: thay thế flow popup bằng flow redirect.

- Tạo `src/hooks/useGoogleRedirect.ts` (TDD đỏ → xanh → refactor)
  - Red test: gọi `redirect()` → fail vì chưa có hook
  - Implement: gọi `getGoogleConsentUrl()` → `window.location.href = url`
  - Error: ApiError + POPUP_BLOCKED_CODE (không áp dụng cho v2 — bỏ)
- Test:
  - `redirect()` set `window.location.href` đúng (mock `window.location`)
  - Trả về `loading`, `error`, `reset`
  - Network error → trả error chứ không crash
  - Abort khi đang loading (idempotent)
- Ước tính: 80 LOC + 120 LOC test = 200 LOC

### Subplan 2 — Callback page `/auth/google/callback` (10/10/2026 dự kiến)

**Concern**: trang xử lý Google redirect về.

- Tạo `src/app/auth/google/callback/page.tsx` (Server Component shell) + `page-client.tsx` (Client Component)
- Test:
  - Success: parse code, gọi `loginWithGoogle`, lưu token, redirect `/`
  - Error param: redirect `/login?error=google_cancelled`
  - No code: redirect `/login?error=google_no_code`
  - State mismatch (CSRF): redirect `/login?error=google_state_mismatch`
  - API error `AUTH_502_GOOGLE_EXCHANGE`: redirect `/login?error=google_AUTH_502_GOOGLE_EXCHANGE`
  - Reload protection: dùng `sessionStorage` flag tránh gọi BE 2 lần
- Ước tính: 120 LOC page + 180 LOC test = 300 LOC

### Subplan 3 — Component `GoogleLoginButton` (10/10/2026 dự kiến)

**Concern**: button UI cho login + register pages.

- Tạo `src/components/auth/GoogleLoginButton.tsx` (`'use client'`) dùng `useGoogleRedirect`
- Bind UI: icon Google SVG, spinner khi loading, error inline
- Test: render, click gọi hook, disabled, i18n label
- Ước tính: 80 LOC + 120 LOC test = 200 LOC

### Subplan 4 — Tích hợp vào `login/page.tsx` + `register/page.tsx` (10/10/2026 dự kiến)

**Concern**: page integration.

- Sửa `src/app/(auth)/login/page.tsx`: thay `SocialLoginButtons` bằng `<GoogleLoginButton>`
- Sửa `src/app/(auth)/register/page.tsx`: thêm `<GoogleLoginButton>`
- Test: snapshot + click → callback được gọi
- Ước tính: 30 LOC + 50 LOC test = 80 LOC

### Subplan 5 — i18n `messages/vi.json` + `messages/en.json` (10/10/2026 dự kiến)

**Concern**: thêm error keys.

- Thêm 8 error key mới (`auth.google.error.*`) theo handoff v2 mục 4
- Đảm bảo cả vi + en đều có
- Test: verify key tồn tại, en fallback
- Ước tính: 20 LOC + 20 LOC test = 40 LOC

### Subplan 6 — Cleanup `useGoogleLogin.ts` + test (10/10/2026 dự kiến)

**Concern**: xóa code v1.

- Xóa `src/features/auth/useGoogleLogin.ts`
- Xóa `src/features/auth/useGoogleLogin.test.tsx`
- Xóa `src/app/oauth2/redirect/page.tsx` (nếu có)
- Cập nhật `src/features/auth/index.ts` export
- Build + test + lint phải pass
- Ước tính: -700 LOC

**Lưu ý user**: hỏi có nên xóa file v1 popup hay giữ lại cho fallback. Mặc định **xóa** vì v2 redirect đơn giản hơn, popup thêm complexity (popup block, postMessage, polling) mà project Flash Sale B2C không cần (mobile-first, desktop-only cho seller).

## 5. Test strategy

### 5.1 Unit test (Vitest)

- `src/hooks/useGoogleRedirect.test.tsx` — hook behavior (gọi API, error, reset)
- `src/components/auth/GoogleLoginButton.test.tsx` — render, click, error
- `src/app/auth/google/callback/page-client.test.tsx` — 5 nhánh (success, error, no code, state mismatch, API error)

### 5.2 Integration test

- KHÔNG set up MSW handlers mới (đã có `src/features/auth/google-mocks.ts` bật qua `NEXT_PUBLIC_USE_MOCK=true`)
- Hook + callback page chạy end-to-end với mock: gọi `redirect()` → callback page parse mock code → lưu token → redirect `/`

### 5.3 Manual smoke

- Dev server: `npm run dev`
- Bật mock: `NEXT_PUBLIC_USE_MOCK=true npm run dev`
- Truy cập `/login` → click "Đăng nhập bằng Google" → expect `window.location.href` thay đổi (mock sẽ redirect về `/auth/google/callback?code=MOCK_AUTH_CODE`)
- Callback page parse code → gọi `loginWithGoogle` (mock) → lưu token → redirect `/`
- Verify `localStorage.fs_access_token` có giá trị

### 5.4 Không có E2E test

- Theo `no-overengineering.mdc` — manual test đủ cho đồ án

## 6. i18n keys

### `vi.json` (thêm vào namespace `auth.google.error`)

```json
{
  "auth": {
    "google": {
      "button": "Đăng nhập bằng Google",
      "loading": "Đang chuyển sang Google...",
      "ariaLabel": "Đăng nhập bằng tài khoản Google",
      "error": {
        "AUTH_502_GOOGLE_EXCHANGE": "Không thể kết nối với Google. Vui lòng thử lại.",
        "AUTH_401_GOOGLE_TOKEN": "Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.",
        "AUTH_401_GOOGLE_EMAIL_UNVERIFIED": "Email Google của bạn chưa được xác minh. Vui lòng kiểm tra trong tài khoản Google.",
        "AUTH_500_GOOGLE_CONFIG": "Đăng nhập bằng Google tạm thời không khả dụng. Vui lòng thử lại sau.",
        "google_cancelled": "Bạn đã hủy đăng nhập bằng Google.",
        "google_no_code": "Google không trả về mã xác thực. Vui lòng thử lại.",
        "google_state_mismatch": "Phiên đăng nhập không hợp lệ. Vui lòng thử lại.",
        "google_unknown": "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
      }
    }
  }
}
```

### `en.json`

```json
{
  "auth": {
    "google": {
      "button": "Sign in with Google",
      "loading": "Redirecting to Google...",
      "ariaLabel": "Sign in with your Google account",
      "error": {
        "AUTH_502_GOOGLE_EXCHANGE": "Cannot connect to Google. Please try again.",
        "AUTH_401_GOOGLE_TOKEN": "Your Google session has expired. Please try again.",
        "AUTH_401_GOOGLE_EMAIL_UNVERIFIED": "Your Google email is not verified. Please verify it in your Google account.",
        "AUTH_500_GOOGLE_CONFIG": "Google sign-in is temporarily unavailable. Please try again later.",
        "google_cancelled": "You cancelled the Google sign-in.",
        "google_no_code": "Google did not return an authorization code. Please try again.",
        "google_state_mismatch": "Invalid sign-in session. Please try again.",
        "google_unknown": "Google sign-in failed. Please try again."
      }
    }
  }
}
```

## 7. Risks + Mitigation

| Risk | Mitigation |
|---|---|
| Reload callback page gây lỗi `code_used` (Google chỉ dùng code 1 lần) | Dùng `sessionStorage` flag đã xử lý; disable nút nếu đang loading; test nhiều lần |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` không match URI trong Google Console | Lỗi hiển thị qua `redirect_uri_mismatch` ở consent screen → handoff mục 7.1 đã cover |
| BE trả HTTP status khác expectation (vd 401 thay vì 400 cho VALIDATION_ERROR) | `apiFetch` unwrap envelope rồi throw `ApiError` với `err.code` → test cover 5 error code enum |
| HTTPS chưa config ở local | Mock flow test OK; production HTTPS Google tự enforce |
| Mobile popup flow cũ vẫn còn ở login page nếu chưa dọn | Cleanup subplan 6 xóa hết trước khi merge |
| User đã có local account + Google account cùng email | BE tự động link, FE không cần làm gì (handoff v2 mục 3.2 + handoff v1 mục 14.6) |

## 8. Out of scope

- **Facebook / GitHub login** (handoff v1 có đề cập nhưng user chưa yêu cầu)
- **Refresh token flow sau Google login** (`auth-jwt.mdc` mục 4 đã handle chung cho mọi provider, không cần sửa)
- **SessionCookieBridge adjustment** (đã có, không liên quan flow Google)
- **E2E test (Playwright)** (no-overengineering.mdc)
- **Custom Google SDK** (handoff v1 mục 4.2 khuyến nghị KHÔNG dùng)
- **Storybook** (no-overengineering.mdc)
- **PWA / Service Worker** (no-overengineering.mdc)
- **A11y nâng cao cho screen reader** (đã có aria-label cơ bản)

## 9. Quy trình commit

Mỗi subplan = 1 commit riêng (Convention: 1 commit = 1 concern).

1. **Commit A** — docs: sync orders plan + 2 handoff (`docs/superpowers/plans/2026-10-16-orders-list-page.md` modified + `docs/superpowers/handoffs/danh-sach-don-hang.md`) — **trước task Google OAuth**
2. **Commit B** — fix(ui): fallback default avatar jpg (`public/images/default-avatar.jpg` + 2 file `.tsx`) — **trước task Google OAuth**
3. **Commit C** — docs(auth): add Google OAuth v2 handoff (`docs/handoffs/google-oauth-fe-integration.md`) — file user vừa gửi
4. **Commit D** — feat(auth): add Google OAuth redirect hook (`useGoogleRedirect` + test)
5. **Commit E** — feat(auth): add Google OAuth callback page (`/auth/google/callback` + test)
6. **Commit F** — feat(auth): add GoogleLoginButton component (`GoogleLoginButton` + test)
7. **Commit G** — feat(auth): integrate GoogleLoginButton into login/register pages
8. **Commit H** — chore(i18n): add Google OAuth error keys (vi + en)
9. **Commit I** — refactor(auth): remove legacy popup flow (`useGoogleLogin` + `/oauth2/redirect`) — **chỉ commit nếu user chọn xóa**

Sau khi tất cả commit xong:
- `npm run lint` PASS
- `npm run tsc --noEmit` PASS (kể cả khi đã skip trong build, vẫn check để an toàn)
- `npm run test -- --run` PASS (Vitest)
- `npm run build` PASS (Next 16 build)

## 10. References

- `docs/handoffs/google-oauth-fe-integration.md` (v2, 2026-10-17) — handoff chính
- `docs/handoffs/fe-google-login-integration-guide.md` (v1, 2026-10-16) — cũ (popup)
- `docs/CLAUDE.md` §1, 5, 6, 7, 8, 11 — UI rules
- `.cursor/rules/auth-jwt.mdc`
- `.cursor/rules/i18n.mdc`
- `.cursor/rules/routing-guards.mdc`
- `.cursor/rules/component-pattern.mdc`
- `.cursor/rules/api-data.mdc`
- `.cursor/rules/testing-required.mdc`
- `.cursor/rules/workflow-process.mdc`
- `.cursor/rules/anti-drift-workflow.mdc`
- `.cursor/rules/git-workflow.mdc`
