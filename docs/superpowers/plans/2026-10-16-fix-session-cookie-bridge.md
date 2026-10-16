# Fix: SessionCookieBridge fails to sync access_token to cookie, causing /account redirect loop

**Date**: 2026-10-16
**Branch**: `fix/session-cookie-bridge`
**Base**: `dev` (after PR #69 merge)

## Problem

User reports: click "Tài khoản của tôi" trên header → tự redirect sang `/login` mặc dù đã đăng nhập.

**Confirmed evidence (user-checked via DevTools)**:

| Check | Result |
|---|---|
| `localStorage.fs_access_token` | ✅ Có |
| Cookie `access_token` | ❌ **Không có** |

**Root cause** (Phase 1 of systematic-debugging):

`src/proxy.ts` (Next 16 edge proxy) đọc cookie `access_token` để phân quyền route. Nếu cookie không có → redirect `/login?redirect=/account` (xem `src/proxy.ts` line 162-179 — `handleStorefrontProtected`).

`src/providers/SessionCookieBridge.tsx` chỉ sync localStorage → cookie trong `useEffect` chạy **1 lần** sau khi component mount, **KHÔNG có** `storage` event listener. Hậu quả:

1. User login → set `localStorage.fs_access_token` (qua flow nào đó — vd form login set localStorage trực tiếp, KHÔNG qua component nào có `SessionCookieBridge`).
2. Khi Next.js navigate đến `/account` (full page request hoặc sau F5), proxy chạy ở edge, đọc cookie.
3. Cookie chưa được set (vì `SessionCookieBridge.useEffect` chỉ chạy ở client, sau khi React mount lần đầu ở tab đó).
4. Proxy thấy `role=null` → redirect `/login?redirect=/account`.

**Why existing tests pass**:
- `AuthGuard.test.tsx` chỉ test logic `shouldRequireAuth` với mocked `useAuth` — KHÔNG test integration giữa localStorage + cookie + proxy.
- `TaiKhoanPage` test mock `useAuth` trực tiếp → không qua `SessionCookieBridge`.

→ Cần test reproduction tại **layer SessionCookieBridge** (cookie sync) **và integration test** cho proxy.

## Goal

Sửa `SessionCookieBridge` để:
1. Sync cookie khi `useEffect` chạy (giữ behavior hiện tại) ✅
2. Listen `storage` event (cross-tab + same-tab via custom event) — auto sync khi token thay đổi
3. Clear cookie khi token bị xóa (vd logout)
4. Re-sync khi user vừa navigate đến trang (vd sau khi login xong, route change không trigger remount)

## Scope

**File sửa (logic)**:
- `src/providers/SessionCookieBridge.tsx` — thêm `storage` event listener + cleanup + handle token removal

**File test mới**:
- `src/providers/SessionCookieBridge.test.tsx` — reproduction test cho bug
  - Test 1 (RED): token trong localStorage nhưng cookie chưa có → sau mount, cookie phải có
  - Test 2 (RED): user login từ tab khác (`storage` event) → cookie sync trong tab hiện tại
  - Test 3 (RED): user logout (xóa localStorage) → cookie phải bị xóa
  - Test 4 (RED): mount nhiều lần (HMR) → không set cookie trùng, không leak listener

**KHÔNG động đến**:
- `src/proxy.ts` (đã đúng — chỉ đọc cookie)
- `src/hooks/useAuth.ts` (state quản lý OK)
- `src/stores/auth.store.ts` (persist OK)
- Login form components (set localStorage OK)
- Logout flow (chưa thấy code xóa cookie → có thể là bug khác, để sau)

## Tham khảo

- `.cursor/rules/auth-jwt.mdc` mục 9 — spec của SessionCookieBridge
- `.cursor/rules/error-handling.mdc` mục 4 — console log prefix convention
- `.cursor/rules/testing-required.mdc` — TDD gate
- `docs/CLAUDE.md` mục "Auth" — Source of truth #1
- `src/proxy.ts` — proxy consumer

## Subplan

Đây là task nhỏ (1 file logic + 1 file test) → chạy thẳng, không cần chia subagent. Tổng thời gian ước tính: 30-45 phút.

### Subplan 1: TDD fix SessionCookieBridge

1. **RED** — viết `SessionCookieBridge.test.tsx` với 4 test cases (xem trên), chạy vitest → xác nhận FAIL trên code hiện tại
   - Test 1 sẽ PASS (vì code hiện tại đã làm được) — đây là regression test, không phải RED thật
   - Test 2, 3, 4 sẽ FAIL (storage event + cleanup + multi-mount) → đây mới là bug thật
2. **GREEN** — sửa `SessionCookieBridge.tsx`:
   - Thêm `window.addEventListener('storage', ...)` để listen cross-tab token changes
   - Cleanup listener trong `useEffect` return
   - Check token expiry (decode JWT exp) trước khi set cookie
   - Clear cookie khi localStorage token bị xóa
3. **REFACTOR** — extract helper `setAccessTokenCookie(token)` / `clearAccessTokenCookie()` để dễ test + tái sử dụng
4. **VERIFY** — chạy `npm run test` → tất cả PASS, không break test khác
5. **AUDIT** — `npm run lint src/providers/SessionCookieBridge.tsx` → không có error mới
6. **COMMIT** — Conventional Commits, body liệt kê file test mới

## Test strategy

| Layer | Tool | Test file |
|---|---|---|
| Unit | Vitest + @testing-library/react | `SessionCookieBridge.test.tsx` |
| Integration | (manual) | Click flow `/` → click "Tài khoản" → confirm không redirect |
| Build | `npm run build` | Pass |

## Risk

- **Low**: SessionCookieBridge chỉ chạy ở client (`useEffect`), không ảnh hưởng SSR
- **Low**: Cookie chỉ set khi có token hợp lệ + path `/` + SameSite=Lax → không cross-site risk
- **Med**: Nếu JWT decode fail trong test (mock), test sẽ fail — cần viết test kỹ

## Notes

- Cookie hiện tại dùng `Max-Age=86400` (24h) — đúng với access token thường có exp 1h + refresh
- JWT exp check có thể làm ở proxy (đã có) — SessionCookieBridge không cần verify lại, chỉ copy
- Bug ngược (cookie có nhưng localStorage không) cũng cần xử lý — xem rule auth-jwt mục 9
