# Plan: Trang xác thực email đăng ký (OTP 6 số)

**Ngày tạo**: 2026-10-13
**Nhánh**: `feat/verify-email-otp-form` (từ `dev`)
**Phạm vi**: Trang `/verify-email` cho flow đăng ký

## 1. Scope

Thay thế stub hiện tại ở `src/app/(auth)/verify-email/page.tsx` (chỉ hiển thị "Mở ứng dụng email") bằng form nhập OTP 6 số đầy đủ, dựa trên:

- File handoff: `docs/superpowers/handoffs/xac-thuc-email.md` (state A – nhập mã)
- File handoff: `docs/superpowers/handoffs/xac-thuc-email-sai-ma.md` (state B – sai mã – bonus cho UX error)
- Ảnh Stitch đính kèm (PNG)

### User chọn scope (xác nhận Bước 0)

| # | Quyết định | Lựa chọn |
|---|---|---|
| 1 | State | **only_default_state** – chỉ làm state mặc định (nhập mã). State B (sai mã) bonus – viết logic + test để có sẵn |
| 2 | API | **stub_api_with_mocks** – thêm mock handler với flag `NEXT_PUBLIC_USE_MOCK=true` |
| 3 | Error UX | **inline_red_banner** – banner đỏ trong card + shake animation (như ảnh) |

## 2. Tham khảo

| Tài liệu | Mục đích |
|---|---|
| `docs/CLAUDE.md` mục §3, §4, §5, §11 | Design tokens, "1 nút primary", component reuse |
| `.cursor/rules/i18n.mdc` | next-intl, key `auth.verifyEmail.*` |
| `.cursor/rules/testing-required.mdc` | TDD: test đỏ trước → fix code |
| `.cursor/rules/component-pattern.mdc` | ForwardRef, cva, RHF + Zod |
| `.cursor/rules/auth-jwt.mdc` | Pattern gọi API xác thực |
| `.cursor/rules/error-handling.mdc` | `ApiError`, retry, toast vs inline |
| `.cursor/rules/api-data.mdc` | Query keys, mutation flow |
| `src/components/auth/AuthHeader.tsx`, `AuthFooter.tsx`, `AuthBrandPanel.tsx` | Layout auth chuẩn (đã có) |
| `src/components/auth/RegisterForm.tsx` | Pattern tham khảo cho RHF + Zod + social |
| `src/features/auth/api.ts` | `apiFetch` + `AuthResponse` pattern |
| `docs/superpowers/handoffs/xac-thuc-email.md` | State A (HTML tham chiếu) |
| `docs/superpowers/handoffs/xac-thuc-email-sai-ma.md` | State B (HTML tham chiếu) |

## 3. Stack

- React Hook Form + Zod (schema `verifyOtpSchema` 6 số)
- next-intl (key mới: `auth.verifyEmail.*`)
- TanStack Query (`useVerifyOtpMutation`, `useResendOtpMutation`)
- Material Symbols Outlined (đã load ở root layout)
- shadcn/ui primitives: `Button`, `Input` (chỉ dùng pattern, OTP input custom)
- next/navigation `useRouter` để navigate về `/login` khi xác thực thành công

## 4. Subplan

Chia thành 4 subplan độc lập, có thể làm tuần tự (1 subagent mỗi subplan).

### Subplan 1: i18n + types + API layer (foundation)
- File: `messages/vi.json` – thêm key `auth.verifyEmail.*` (15-20 keys)
- File: `messages/en.json` – thêm tương ứng
- File: `src/features/auth/types.ts` – thêm `VerifyOtpRequest`, `VerifyOtpResponse`, `ResendOtpRequest`
- File: `src/features/auth/api.ts` – thêm `verifyOtpRequest(payload)`, `resendOtpRequest(payload)` (real API)
- File: `src/features/auth/mocks.ts` (MỚI) – mock handler: `MOCK_OTP_CODE = "123456"`, sau 60s thì "OTP hết hạn", sai thì 401 với code `OTP_INVALID`
- File: `src/features/auth/hooks.ts` – `useVerifyOtpMutation`, `useResendOtpMutation`

**Audit file logic vs copy**: Tất cả là LOGIC (xử lý response, map lỗi) → cần test.

### Subplan 2: Zod schema + VerifyEmailForm component (state A + state B đầy đủ)
- File: `src/features/auth/schemas.ts` – thêm `verifyOtpSchema` (6 số)
- File: `src/features/auth/schemas.test.ts` – test schema
- File: `src/components/auth/VerifyEmailForm.tsx` (MỚI) – component form chính
  - **State A (default – idling)**: 6 ô OTP, focus, cursor blink, countdown 10 phút, "Gửi lại sau mm:ss"
  - **State B (invalid OTP)**: đổi sang giao diện "Mã chưa đúng" matching Stitch handoff:
    - Icon phong bì có X badge đỏ thay cho check xanh
    - Line đỏ 1px trên top card
    - 6 ô OTP viền đỏ 2px, nền `danger-soft`, text `danger`
    - Shake animation 0.5s
    - Banner đỏ inline "Mã chưa đúng. Bạn còn N lần thử." với icon alert
    - Nút submit đổi từ "Xác thực" → "Thử lại" (icon refresh)
    - Stepper bước 2 hiển thị state "error" (vòng tròn đỏ, ring đỏ)
  - State C (expired): banner cảnh báo "Mã đã hết hạn"
  - State D (tooMany): disable input + nút "Gửi lại mã"
  - Stepper 3 bước (Tạo tài khoản ✓ → Xác thực email → Hoàn tất)
  - Auto-focus, paste support (dán 6 số → fill all)
  - Submit: disable khi chưa đủ 6 số
- File: `src/components/auth/VerifyEmailForm.test.tsx` (MỚI) – test render + tương tác + state B visual
- File: `src/components/auth/OtpStepper.tsx` (MỚI) – thêm state `"error"` cho step đang active nhưng lỗi
- File: `src/components/auth/OtpStepper.test.tsx` (MỚI) – test 4 state (done/active/error/pending)
- File: `src/components/auth/OtpInput.tsx` (MỚI) – 6 ô input với auto-advance, backspace, paste
- File: `src/components/auth/OtpInput.test.tsx` (MỚI) – test typing, paste, focus
- File: `src/components/auth/ResendCountdown.tsx` (MỚI) – countdown + resend button
- File: `src/components/auth/ResendCountdown.test.tsx` (MỚI) – test countdown

**Audit file logic vs copy**:
- `VerifyEmailForm.tsx` – LOGIC (state machine, validation, countdown, focus management) → test
- `OtpStepper.tsx` – LOGIC (state styling) → test
- `OtpInput.tsx` – LOGIC (focus management, keyboard nav) → test
- `ResendCountdown.tsx` – LOGIC (timer state) → test
- `schemas.ts` (chỉ phần mở rộng) – LOGIC → test

### Subplan 3: Thay thế page stub + integration
- File: `src/app/(auth)/verify-email/page.tsx` – thay thế stub bằng page mới
  - Dùng `AuthBrandPanel` (giống login/register) + `VerifyEmailForm` 2 cột
  - Lấy email từ query param `?email=...`, mask hiển thị
  - Khi xác thực thành công → `toast.success` + `router.push('/login')`
  - Khi OTP hết hạn → clear local + redirect về `/login?reason=otp_expired`
- File: `src/app/(auth)/verify-email/page.test.tsx` (MỚI) – test page-level

**Audit file logic vs copy**: `page.tsx` là LOGIC (route guard, redirect rule) → test.

### Subplan 4: Refactor + tinh chỉnh + commit
- Verify lint + typecheck + test
- Tách `OtpInput` thành file riêng nếu > 200 dòng
- Auto-commit với message conventional
- Báo cáo Bước 6

## 5. Test strategy

| Layer | Test |
|---|---|
| Schema (Zod) | valid: "123456", invalid: empty, "12345", "abcdef", "12345a" |
| Mock | `MOCK_OTP_CODE = "123456"` accept, "000000" reject với OTP_INVALID, sau 60s reject với OTP_EXPIRED, lần thứ 6 sai → OTP_TOO_MANY_ATTEMPTS |
| Hook `useVerifyOtpMutation` | success → invalidate + redirect, error OTP_INVALID → set inline error + shake, OTP_EXPIRED, OTP_TOO_MANY_ATTEMPTS |
| Hook `useResendOtpMutation` | success → reset countdown + reset validity, error → toast |
| Component `OtpInput` | render 6 ô, type số → fill, paste 6 số → fill all, backspace, arrow keys, hasError style |
| Component `OtpStepper` | 4 states (done/active/error/pending), line nối đổi màu theo state |
| Component `ResendCountdown` | countdown chạy đúng, hiện "Gửi lại mã" khi hết, click trigger onResend |
| Component `VerifyEmailForm` (state A) | render đầy đủ, submit disable khi < 6 số, submit enable khi đủ 6 số |
| Component `VerifyEmailForm` (state B) | submit OTP sai → state B visual: icon X đỏ, 6 ô viền đỏ, banner "còn N lần", shake class, nút "Thử lại" |
| Component `VerifyEmailForm` (state D) | submit sai 5 lần → input disabled, submit chỉ trigger resend |
| Component `VerifyEmailForm` (state E) | resend thành công → reset state về A, xoá input |
| Page | render form + brand panel, đọc email từ query, mask email |

## 6. Tiêu chí hoàn thành (DoD)

- [ ] Tất cả test pass (`npm run test`)
- [ ] `npm run lint` pass
- [ ] `npm run tsc --noEmit` pass
- [ ] i18n key có đủ `vi` + `en`
- [ ] Component không dùng hex màu trực tiếp (chỉ dùng token)
- [ ] Dùng lại `AuthHeader`, `AuthFooter`, `AuthBrandPanel` có sẵn
- [ ] Commit message EN + Conventional Commits
- [ ] Không tự push (chờ user duyệt)

## 7. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Component > 200 dòng | Tách sub-component: `OtpInput`, `OtpStepper`, `ResendCountdown` |
| Test OTP form phức tạp | Test riêng từng sub-component + test integration page |
| Ảnh hưởng auth layout | Component `VerifyEmailForm` chỉ nằm trong slot của `(auth)/layout.tsx` – layout đã có pt-16 + justify-center |
| Conflict với branch `feat/flash-sale-page-ui` khác | Subplan nhỏ, file ít overlap (chỉ `features/auth/*` + `messages/*` + page mới) |
| Backend chưa có endpoint | Mock layer với flag `NEXT_PUBLIC_USE_MOCK=true`; thật vẫn map đúng theo convention `/api/v1/auth/verify-email` + `/api/v1/auth/resend-otp` |

## 8. File thay đổi dự kiến (audit Bước 5.0)

| File | Loại | Có test? |
|---|---|---|
| `messages/vi.json` | EDIT – thêm key | N/A (i18n data) |
| `messages/en.json` | EDIT – thêm key | N/A (i18n data) |
| `src/features/auth/types.ts` | EDIT – thêm interface | LOGIC (chỉ type) – skip test |
| `src/features/auth/api.ts` | EDIT – thêm 2 function | LOGIC → cần test |
| `src/features/auth/mocks.ts` (MỚI) | LOGIC | cần test |
| `src/features/auth/hooks.ts` | EDIT – thêm 2 hook | LOGIC → cần test |
| `src/features/auth/schemas.ts` | EDIT – thêm schema | LOGIC → cần test |
| `src/features/auth/api.test.ts` | EDIT – bổ sung case | test |
| `src/features/auth/hooks.test.tsx` | EDIT – bổ sung case | test |
| `src/features/auth/schemas.test.ts` | EDIT – bổ sung case | test |
| `src/components/auth/VerifyEmailForm.tsx` (MỚI) | LOGIC (component) | cần test |
| `src/components/auth/VerifyEmailForm.test.tsx` (MỚI) | test | – |
| `src/components/auth/OtpInput.tsx` (MỚI, optional) | LOGIC | cần test |
| `src/components/auth/OtpStepper.tsx` (MỚI, optional) | LOGIC (presentation) | cần test |
| `src/components/auth/ResendCountdown.tsx` (MỚI, optional) | LOGIC (timer) | cần test |
| `src/app/(auth)/verify-email/page.tsx` | EDIT (thay thế stub) | LOGIC → cần test |
| `src/app/(auth)/verify-email/page.test.tsx` (MỚI) | test | – |
