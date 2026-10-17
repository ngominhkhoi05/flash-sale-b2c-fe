# Refactor — Google Login Button dùng redirect flow thay popup

**Date**: 2026-10-17
**Branch**: `refactor/google-login-button-use-redirect` (from `dev`)
**Type**: refactor (UX fix)
**Plan gốc**: `2026-10-17-google-oauth-redirect-v2.md` (Commits A-E đã merge ở PR #75, đang làm F-I)

## Context

User báo: bấm nút Google trên trang login → hiện trang trung gian (ảnh user paste)
trước khi vào Google account chooser. User muốn **bấm thẳng → dẫn link trực tiếp** sang Google account chooser, không qua trang trung gian.

### Root cause

`GoogleLoginButton.tsx` ở `dev` vẫn dùng `useGoogleLogin` (popup flow v1):
- `useGoogleLogin.ts` mở `window.open(url, '_blank', 'popup')` → Chrome thường block popup
- Khi popup bị block → hook fallback mở tab mới (window.open không popup option)
- Tab mới mở ra URL trang trung gian `/oauth2/redirect` (POST message listener) → render spinner
- Spinner đó chính là "trang trung gian" user thấy

### Fix

Refactor `GoogleLoginButton.tsx` dùng `useGoogleRedirect` (đã có ở commit D 0d1b79d):
- Click button → hook gọi `GET /api/v1/auth/google/url` lấy `authorizationUrl`
- `window.location.href = authorizationUrl` → top-level navigation trực tiếp sang Google
- KHÔNG có trang trung gian — browser navigate thẳng tới `accounts.google.com`
- Google consent → redirect về `/auth/google/callback?code=...` (callback page v2)

Đây là Subplan F+ của plan v2 (xem plan `2026-10-17-google-oauth-redirect-v2.md` mục 3).

## Scope

### Files sẽ thay đổi (3)

1. `src/components/auth/GoogleLoginButton.tsx` **[REFACTOR]** — đổi từ `useGoogleLogin` → `useGoogleRedirect`
2. `src/components/auth/GoogleLoginButton.test.tsx` **[REWRITE]** — test cho redirect flow (xoá test popup)
3. `src/features/auth/useGoogleLogin.ts` **[GIỮ TẠM]** — KHÔNG xoá trong PR này, để fallback khi rollback nhanh

### Test files (2)

1. `src/components/auth/GoogleLoginButton.test.tsx` **[REWRITE]** — Test cho useGoogleRedirect
2. (KHÔNG tạo mới) — `useGoogleRedirect.test.ts` đã có sẵn (8 tests, đã pass)

### Tạm thời KHÔNG xoá (theo plan v2 mục 2.1)

- `useGoogleLogin.ts` + `useGoogleLogin.test.tsx` — giữ để rollback nhanh nếu redirect flow có bug
- `src/app/oauth2/redirect/page.tsx` (nếu có) — giữ vì user có thể click từ link cũ

## Tham khảo

- `docs/handoffs/google-oauth-fe-integration.md` mục 4 (Flow tích hợp) — spec cho redirect
- `docs/superpowers/plans/2026-10-17-google-oauth-redirect-v2.md` mục 3 Subplan F+ — chính là task này
- `src/features/auth/useGoogleRedirect.ts` — hook đã có sẵn
- `src/app/(auth)/auth/google/callback/page-client.tsx` — callback page v2 đã có
- `.cursor/rules/i18n.mdc` — locale `vi` (default) + `en`
- `.cursor/rules/testing-required.mdc` — TDD bắt buộc

## Subplan

### Subplan 1: `GoogleLoginButton.tsx` dùng `useGoogleRedirect` (LOGIC)

Đổi:
- Import `useGoogleLogin, POPUP_BLOCKED_CODE` → `useGoogleRedirect`
- Đổi hook destructuring: `{ login, status, error }` → `{ redirect, status, error }`
- Bỏ props `redirectUri` (vì callback page dùng env)
- Đổi `onClick={() => void login()}` → `onClick={() => void redirect()}`
- Đổi `status === 'opening-popup' || status === 'authenticating'` → `status === 'redirecting'`
- Bỏ import `AuthUser` (chỉ dùng state, không cần type)
- Giữ logic save `post_login_redirect` (turn trước đã thêm)
- i18n: giữ `googlePopupBlocked` key (cho fallback) — KHÔNG dùng nữa vì đã bỏ popup
  → nhưng vẫn giữ i18n key trong JSON (không xoá, ít dùng đến)

### Subplan 2: `GoogleLoginButton.test.tsx` rewrite (TDD)

Test mới cho useGoogleRedirect:
- Render button với aria-label đúng
- Click button → gọi `redirect()` 1 lần
- `status === 'redirecting'` → disable button + spinner
- `status === 'error'` → toast error
- Pass onSuccess/onError qua hook options
- KHÔNG cần test popup/POPUP_BLOCKED nữa (xoá)

## Test strategy

| Layer | Test | Status |
|---|---|---|
| Component: GoogleLoginButton | Rewrite 12-13 tests cho redirect flow | REWRITE |
| Hook: useGoogleRedirect | Đã có 8 tests ở `useGoogleRedirect.test.ts` | GIỮ NGUYÊN |
| Callback: page-client | Đã có 11 tests ở `page-client.test.tsx` | GIỮ NGUYÊN |
| E2E | Manual: bấm Google → navigate thẳng accounts.google.com (không qua trang trung gian) | (after merge) |

## Risks

| Rủi ro | Mitigation |
|---|---|
| Refactor lớn 1 file → có thể break UX | Giữ `useGoogleLogin.ts` để rollback nhanh |
| Test cũ fail vì import `useGoogleLogin` không tồn tại trong mock | Rewrite test với mock mới |
| Behavior khác: popup có thể block, redirect thì không | Đây chính là fix user yêu cầu |
| i18n key `googlePopupBlocked` không dùng → tốn bundle | Giữ key trong JSON (zero cost nếu không t) |

## Không thuộc scope

- KHÔNG xoá `useGoogleLogin.ts` / `useGoogleLogin.test.tsx` (giữ để rollback)
- KHÔNG sửa `google-api.ts` / `apply-auth-response.ts` (đã đúng)
- KHÔNG sửa callback page (đã đúng)
- KHÔNG thêm i18n key mới (8 keys turn trước đã đủ)

## Commit plan

- 1 commit duy nhất: `refactor(auth): use useGoogleRedirect in GoogleLoginButton (no popup, no intermediate page)`
- Body liệt kê test rewrite
