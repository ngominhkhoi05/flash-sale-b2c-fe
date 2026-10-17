# Fix Google OAuth — Display callback errors + post-login redirect

**Date**: 2026-10-17
**Branch**: `fix/google-oauth-error-display` (from `dev`)
**Type**: fix (UX bug + missing i18n + missing redirect param)

## Context (từ review turn trước)

User review toàn bộ luồng Google OAuth (file `google-oauth-fe-integration.md` mục 4
"Bước 3" yêu cầu). Phát hiện 3 vấn đề:

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | `LoginForm.tsx` KHÔNG đọc `?error=google_*` từ URL | Trung bình — UX kém khi Google fail |
| 2 | `messages/{vi,en}.json` thiếu 8 keys `error.google_*` | Trung bình — cần thiết cho #1 |
| 3 | `post_login_redirect` không được set khi user click Google từ `/login?redirect=/cart` | Thấp — hiếm user case |

## Scope

### Files sẽ thay đổi (5)

1. `src/features/auth/google-oauth-errors.ts` **[MỚI]** — Helper map `error code → i18n key`
2. `src/components/auth/LoginForm.tsx` **[SỬA]** — `useEffect` đọc `?error=` → toast/inline banner
3. `messages/vi.json` **[SỬA]** — Thêm 8 keys `error.google_*`
4. `messages/en.json` **[SỬA]** — Thêm 8 keys `error.google_*`
5. `src/components/auth/GoogleLoginButton.tsx` **[SỬA]** — Save `?redirect=` vào sessionStorage trước khi navigate

### Test files (3)

1. `src/features/auth/google-oauth-errors.test.ts` **[MỚI]** — 8+ unit test cho mapper
2. `src/components/auth/LoginForm.test.tsx` **[MỚI]** — Test đọc `?error=` + toast
3. `src/components/auth/GoogleLoginButton.test.tsx` **[SỬA]** — Test save `post_login_redirect`

## Tham khảo

- `docs/handoffs/google-oauth-fe-integration.md` mục 3 (error codes), mục 4 Bước 3 (UI mapping)
- `.cursor/rules/i18n.mdc` — locale `vi` (default) + `en`
- `.cursor/rules/testing-required.mdc` — TDD bắt buộc
- `.cursor/rules/workflow-process.mdc` Bước 5.0 (audit file logic vs copy)

## Subplan

### Subplan 1: Helper mapper `google-oauth-errors.ts` (độc lập)

Pure function `mapGoogleErrorToI18nKey(errorCode: string): string`:

| Input (sau khi strip `google_` prefix) | Output i18n key |
|---|---|
| `cancelled` | `error.google_cancelled` |
| `no_code` | `error.google_no_code` |
| `state_mismatch` | `error.google_state_mismatch` |
| `AUTH_401_GOOGLE_TOKEN` | `error.google_auth_401_google_token` |
| `AUTH_502_GOOGLE_EXCHANGE` | `error.google_auth_502_google_exchange` |
| `AUTH_500_GOOGLE_CONFIG` | `error.google_auth_500_google_config` |
| `AUTH_401_GOOGLE_EMAIL_UNVERIFIED` | `error.google_auth_401_google_email_unverified` |
| `unknown` (default) | `error.google_unknown` |

**Test (TDD red → green)**: 8 unit tests.

### Subplan 2: i18n keys `messages/{vi,en}.json` (độc lập)

Thêm 8 keys vào namespace `error`:

```json
"error": {
  ...,
  "google_cancelled": "Bạn đã hủy đăng nhập bằng Google.",
  "google_no_code": "Google không trả về mã xác thực. Vui lòng thử lại.",
  "google_state_mismatch": "Phiên đăng nhập không hợp lệ. Vui lòng thử lại.",
  "google_auth_401_google_token": "Mã xác thực Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
  "google_auth_502_google_exchange": "Không thể xác thực với Google. Vui lòng thử lại sau.",
  "google_auth_500_google_config": "Hệ thống chưa cấu hình Google. Vui lòng liên hệ admin.",
  "google_auth_401_google_email_unverified": "Email Google chưa được xác minh. Vui lòng verify email rồi thử lại.",
  "google_unknown": "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
}
```

### Subplan 3: `LoginForm.tsx` đọc `?error=` (depend Subplan 1+2)

Thêm `useEffect` đầu component:
- Đọc `searchParams.get('error')`
- Nếu match `google_*` → dùng mapper → toast.error(t(key))
- Cũng set `apiError` state để hiển thị inline (nếu user chưa thấy toast)

### Subplan 4: `GoogleLoginButton.tsx` save `post_login_redirect` (độc lập)

Trước khi gọi `redirect()`, đọc `searchParams.get('redirect')` từ URL hiện tại
(/login), sanitize bằng `sanitizeRedirectPath()`, save vào `sessionStorage.post_login_redirect`.

Callback page `page-client.tsx` đã đọc key này — không cần sửa callback.

## Test strategy

| Layer | Test | Status |
|---|---|---|
| Unit: mapper | `google-oauth-errors.test.ts` (8 cases + edge cases) | NEW |
| Unit: LoginForm | `LoginForm.test.tsx` (3-4 cases: error param, no error, malformed error) | NEW |
| Component: GoogleLoginButton | Update `GoogleLoginButton.test.tsx` (test save redirect param) | MODIFY |
| E2E | Manual: cancel Google → check toast message | (after merge) |

## Risks

| Rủi ro | Mitigation |
|---|---|
| Touch nhiều file (5) → conflict với worktree khác | Check worktree không đụng cùng file (đã verify) |
| i18n key typo dẫn đến toast rỗng | Test cả invalid input → fallback `google_unknown` |
| Search params SSR/CSR mismatch | Dùng `useSearchParams` hook (đã dùng) + guard `typeof window !== "undefined"` cho sessionStorage |
| Save `?redirect=` có thể bị mất khi user reload | `sessionStorage` (đã dùng pattern này) |

## Không thuộc scope

- KHÔNG sửa callback `page-client.tsx` (đã đúng)
- KHÔNG sửa `useGoogleRedirect` (logic redirect đúng)
- KHÔNG sửa `apply-auth-response` (token storage đúng)
- KHÔNG thêm lib i18n mới
- KHÔNG thêm `Idempotency-Key` (Google 1 lần duy nhất, không critical)

## Commit plan

- 1 commit duy nhất: `fix(auth): display google oauth callback errors + preserve redirect`
- Body liệt kê file test mới/sửa + i18n keys
