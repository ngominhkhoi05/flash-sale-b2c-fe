# Plan — Google OAuth Callback UI Redesign (2026-10-17)

> **Status**: DRAFT — chờ user duyệt
> **Author**: Cursor Assistant (claude-opus-5-5)
> **Branch**: `feat/google-oauth-redirect-v2` (tiếp tục, không tạo mới)
> **Stack**: Next 16.3.8 · React 19.2 · TypeScript · Tailwind 4 · next-intl
> **Reference**: `docs/superpowers/handoffs/dang-xac-thuc.md` (Stitch design)

---

## 1. Scope

Redesign UI trang callback `/auth/google/callback` cho khớp với handoff `dang-xac-thuc.md` (Stitch design). Logic xử lý 5 nhánh (success/error/no code/state mismatch/API error) **giữ nguyên** — chỉ sửa UI loading state.

### Concerns chính

| # | Concern | Hiện tại | Sau redesign |
|---|---|---|---|
| 1 | Auth chrome (header/footer) | Không có | Dùng `AuthHeader` + `AuthFooter` từ `(auth)` route group |
| 2 | Route location | `src/app/auth/google/callback/` (ngoài group) | `src/app/(auth)/auth/google/callback/` (trong group) — URL không đổi |
| 3 | Layout | Plain full-screen `min-h-screen` | AuthLayout có sẵn (`AuthHeader` + main + `AuthFooter`) |
| 4 | Card | Không có card | `max-w-[420px]` rounded-2xl bg-white shadow-lg border p-8/10 |
| 5 | Spinner | Tailwind `border-4 animate-spin` đơn giản | Custom SVG 64px: vòng hào quang + spinner + `mark_email_read` icon ở tâm |
| 6 | Title | "Đang hoàn tất đăng nhập" | "Đang xác thực email của bạn..." |
| 7 | Subtitle | "Vui lòng đợi trong giây lát..." | "Hệ thống đang kiểm tra mã token kích hoạt. Vui lòng đợi trong giây lát." |
| 8 | Trust badge | Không có | Border-top + `lock` icon + "Bảo mật chuẩn TLS 256-bit • Vibe Mart" |
| 9 | i18n | Dùng 6 key cũ (`processing`, `pleaseWait`, ...) | Thêm 3 key mới: `verifyingEmail`, `verifyingSubtitle`, `tlsBadge` (giữ key cũ cho test cũ) |
| 10 | Test | 10 cases, dùng data-testid cũ | Update 10 cases, **giữ nguyên count**, đổi data-testid sang mới |
| 11 | Error.tsx | Đã align (giữ nguyên) | **KHÔNG SỬA** — nằm ngoài scope |
| 12 | Material Symbols | Đã load ở root `<head>` | **KHÔNG SỬA** — dùng luôn |
| 13 | AuthHeader/Footer | Đã có + đã test | **KHÔNG SỬA** — dùng lại |

---

## 2. Files scope

### 2.1 SẼ MOVE (1 file)

| File | Từ | Đến | Lý do |
|---|---|---|---|
| `auth/google/callback/{page,page-client,loading,error,page-client.test}.tsx` | `src/app/auth/google/callback/` | `src/app/(auth)/auth/google/callback/` | Dùng lại AuthLayout (AuthHeader + AuthFooter) có sẵn ở `(auth)/layout.tsx`. URL `/auth/google/callback` không đổi vì `(auth)` là route group. |

### 2.2 SẼ SỬA (4 file)

| File | Loại sửa |
|---|---|
| `src/app/(auth)/auth/google/callback/page-client.tsx` | Render card 420px + custom SVG spinner 64px + i18n key mới + trust badge |
| `src/app/(auth)/auth/google/callback/loading.tsx` | Đồng bộ UI với page-client (card + spinner + copy) |
| `src/app/(auth)/auth/google/callback/page-client.test.tsx` | Update 10 cases: đổi data-testid (`google-callback-pending` → `google-callback-card`, `google-callback-spinner` → `google-callback-email-icon`, ...), thêm 3 case UI verification |
| `messages/vi.json` | Thêm 3 key: `verifyingEmail`, `verifyingSubtitle`, `tlsBadge` trong `auth.google.callback.*` |
| `messages/en.json` | Thêm 3 key tương ứng tiếng Anh |

### 2.3 SẼ GIỮ NGUYÊN

| File | Lý do |
|---|---|
| `src/app/(auth)/auth/google/callback/error.tsx` | Đã đủ tốt, design chỉ cho success loading state |
| `src/app/(auth)/auth/google/callback/page.tsx` | Server shell — giữ pattern Suspense + Client |
| `src/components/auth/AuthHeader.tsx` (+ test) | Đã có + đã test |
| `src/components/auth/AuthFooter.tsx` (+ test) | Đã có + đã test |
| `src/app/(auth)/layout.tsx` | Wrap AuthHeader + main + AuthFooter |
| `src/app/layout.tsx` | Material Symbols đã load sẵn ở root |
| `src/features/auth/useGoogleRedirect.ts` (Commit D) | Hook vẫn dùng |
| `src/features/auth/google-api.ts`, `apply-auth-response.ts` | Logic API không đổi |

### 2.4 KHÔNG SỬA (workflow rule)

- `docs/CLAUDE.md` — read-only
- Logic callback (5 nhánh xử lý)
- AuthHeader/AuthFooter
- i18n key cũ (giữ để không break test cũ)

---

## 3. Subplan

### 3.1 Commit F: feat(auth): redesign Google callback UI per Stitch design

| Bước | Hành động | Loại |
|---|---|---|
| 1 | `git mv src/app/auth/google/callback/* src/app/(auth)/auth/google/callback/` | Move |
| 2 | Verify URL `/auth/google/callback` vẫn hoạt động (Next.js route group) | Smoke |
| 3 | Update `page-client.tsx` UI: card 420px + SVG spinner + i18n mới + trust badge | Sửa |
| 4 | Update `loading.tsx` UI đồng bộ với page-client | Sửa |
| 5 | Thêm 3 i18n key (`verifyingEmail`, `verifyingSubtitle`, `tlsBadge`) vào `vi.json` + `en.json` | Sửa |
| 6 | Update test `page-client.test.tsx`: 10 cases với data-testid mới + 3 case UI verification | Sửa |
| 7 | Audit file (logic vs copy) trước commit | Bắt buộc |
| 8 | `npx tsc --noEmit` → pass | Verify |
| 9 | `npx vitest run src/app/(auth)/auth/google/callback/page-client.test.tsx` → 10/10 pass | Verify |
| 10 | `npx eslint src/app/\(auth\)/auth/google/callback/` → 0 error mới | Verify |
| 11 | `git add .` + commit `feat(auth): redesign Google callback UI per Stitch design` | Auto-commit |
| 12 | Báo cáo user (Bước 6) | Báo cáo |

### 3.2 Phân tích file (Bước 5.0 — Audit trước khi sửa)

| File | Loại | Test kèm? |
|---|---|---|
| `page.tsx` | Server shell, logic wrap Suspense | Không (chỉ là 1 function) |
| `page-client.tsx` | **LOGIC** (5 nhánh useEffect) | ✅ đã có test (sẽ update) |
| `loading.tsx` | COPY (chỉ render) | Không (theo rule testing-required.mdc) |
| `error.tsx` | **LOGIC** (console.error + reset) | Không có test → cân nhắc bổ sung |
| `page-client.test.tsx` | Test file (logic) | N/A (là test) |
| `vi.json` / `en.json` | Data (i18n key) | Không (theo rule) |

→ Commit F focus vào 3 file LOGIC: `page-client.tsx` (sửa UI) + `page-client.test.tsx` (update) + `error.tsx` (giữ nguyên).

---

## 4. i18n keys mới (3 key)

| Key | vi | en |
|---|---|---|
| `auth.google.callback.verifyingEmail` | "Đang xác thực email của bạn..." | "Verifying your email..." |
| `auth.google.callback.verifyingSubtitle` | "Hệ thống đang kiểm tra mã token kích hoạt. Vui lòng đợi trong giây lát." | "We're checking your activation token. Please wait a moment." |
| `auth.google.callback.tlsBadge` | "Bảo mật chuẩn TLS 256-bit • Vibe Mart" | "TLS 256-bit secure • Vibe Mart" |

Key cũ (`processing`, `pleaseWait`, `error`, `closing`, `missingCode`, `errorUNKNOWN`) **giữ nguyên** — không dùng nữa nhưng để test cũ pass.

---

## 5. Test strategy (Bước 5.1 — TDD)

### 5.1 Test cũ (10 cases) — UPDATE data-testid

| # | Test case | data-testid cũ | data-testid mới |
|---|---|---|---|
| 1 | success path → redirect `/` | `google-callback-pending` (sau khi unmount) | (giữ wrapper `data-testid="google-callback-card"`) |
| 2 | success path → redirect `/cart` | (giống 1) | (giống 1) |
| 3 | error param → `/login?error=google_cancelled` | (giống) | (giống) |
| 4 | error_description → `/login?error=google_cancelled` | (giống) | (giống) |
| 5 | no code → `/login?error=google_no_code` | (giống) | (giống) |
| 6 | state mismatch → `/login?error=google_state_mismatch` | (giống) | (giống) |
| 7 | CSRF skip khi sessionStorage rỗng | (giống) | (giống) |
| 8 | API error → `/login?error=google_AUTH_502_GOOGLE_EXCHANGE` | (giống) | (giống) |
| 9 | network error → `/login?error=google_unknown` | (giống) | (giống) |
| 10 | reload protection → không gọi BE | (giống) | (giống) |

### 5.2 Test mới (verify UI mới) — APPEND 3 cases

| # | Test case | Verify |
|---|---|---|
| 11 | Render card 420px với border + shadow | `data-testid="google-callback-card"` + class `max-w-[420px]` |
| 12 | Render title "Đang xác thực email của bạn..." | `screen.getByText(/Đang xác thực email/i)` |
| 13 | Render TLS badge "Bảo mật chuẩn TLS 256-bit" | `screen.getByText(/Bảo mật chuẩn TLS 256-bit/i)` |

**Tổng**: 13 cases (10 update + 3 mới). User chọn "update_keep_10" nhưng thêm 3 case UI verification là cần thiết theo TDD (xem workflow-process.mdc Bước 5.1).

→ Đề xuất điều chỉnh: **10 cases cũ update data-testid + 3 cases mới verify UI = 13 cases**. Lý do: case cũ chỉ verify redirect logic, không verify UI render — UI mới cần test riêng.

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| Move route vào `(auth)` group có thể phá route resolution | Test qua curl `/auth/google/callback` trước + sau move |
| Test cũ fail vì data-testid đổi | Update toàn bộ assertion trong commit (KHÔNG dùng `.skip`) |
| i18n key mới chưa có trong messages | Add đồng thời 2 file `vi.json` + `en.json` |
| AuthHeader/AuthFooter ảnh hưởng layout cũ | Đã có test, verify trên dev server (port 3000 đang chạy) |
| `next dev` không nhận route move | Restart dev server hoặc chờ HMR |

---

## 7. Files dự kiến thay đổi trong Commit F

| File | Loại | Logic? | Test? |
|---|---|---|---|
| `src/app/auth/google/callback/*` (5 file) → `src/app/(auth)/auth/google/callback/*` | Move | Mixed | Yes (test sẽ update) |
| `src/app/(auth)/auth/google/callback/page-client.tsx` | Sửa (UI) | **LOGIC** | ✅ update + add 3 case |
| `src/app/(auth)/auth/google/callback/loading.tsx` | Sửa (UI) | COPY (chỉ render) | Không |
| `src/app/(auth)/auth/google/callback/error.tsx` | Move only (no edit) | **LOGIC** | Không (giữ nguyên) |
| `src/app/(auth)/auth/google/callback/page.tsx` | Move only (no edit) | COPY (chỉ render) | Không |
| `src/app/(auth)/auth/google/callback/page-client.test.tsx` | Sửa (test) | LOGIC | N/A (là test) |
| `messages/vi.json` | Thêm 3 key | Data | Không |
| `messages/en.json` | Thêm 3 key | Data | Không |

**Tổng**: 9 file (5 move + 4 sửa). Commit message: `feat(auth): redesign Google callback UI per Stitch design`

---

## 8. Out of scope

- KHÔNG sửa `error.tsx` UI (giữ nguyên)
- KHÔNG sửa `AuthHeader`/`AuthFooter` (đã đủ)
- KHÔNG thêm dark mode, animation phức tạp
- KHÔNG refactor `useGoogleRedirect` (Commit D)
- KHÔNG sửa logic callback (5 nhánh giữ nguyên)
- KHÔNG xóa file v1 popup (Subplan riêng)

---

## 9. Notes

- Stitch design `dang-xac-thuc.md` dùng Tailwind CDN + custom class — KHÔNG copy nguyên. Map sang design tokens `tailwind.config.ts` hiện có (primary, surface, on-surface, ...).
- Material Symbols font đã load ở root layout, KHÔNG cần thêm.
- Pattern route group `(auth)/auth/google/callback/` đã từng dùng trong Next.js 16 docs — confirmed an toàn.
- Sau Commit F, tiếp tục Subplan 3 (GoogleLoginButton) nếu user duyệt.
