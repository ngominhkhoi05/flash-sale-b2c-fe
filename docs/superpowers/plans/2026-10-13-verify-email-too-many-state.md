# Plan: VerifyEmailForm – State "Đã hết lượt thử" (OTP_TOO_MANY_ATTEMPTS)

**Ngày tạo**: 2026-10-13
**Nhánh**: `feat/verify-email-too-many` (từ `feat/verify-email-otp-form`)
**Phạm vi**: Bổ sung state tooMany cho `VerifyEmailForm` — match Stitch handoff `docs/superpowers/handoffs/xac-thuc-email-het-luot-thu.md`

## 1. Scope

Hiện tại `VerifyEmailForm.tsx` đã có logic `inlineError.type === "tooMany"` (chỉ set banner + cooldown) nhưng **CHƯA có UI đầy đủ** theo Stitch state tooMany. Cần bổ sung:

- **UI khoá hoàn toàn** khi tooMany: 6 ô OTP bị disable + hiển thị "—" (gạch ngang) — không phải input nữa
- **Icon phong bì + ổ khoá đỏ** thay cho check xanh
- **Banner vàng cảnh báo bảo mật** (khác banner đỏ ở state B): "Mã xác thực cũ đã bị vô hiệu hóa để đảm bảo an toàn. Hãy gửi yêu cầu mã mới."
- **Tiêu đề "Đã hết lượt thử"** + mô tả "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới để tiếp tục."
- **Nút primary "Gửi mã mới"** (icon refresh) thay cho "Xác thực"/"Thử lại"
- **Link phụ "Hoặc quay lại đăng ký với email khác"** + **"Quay lại đăng ký"** (icon arrow back)
- **Stepper bước 2 = "error"** (vòng tròn đỏ + ring đỏ) — đã có state trong OtpStepper, chỉ cần kích hoạt
- **Mock**: 5 lần sai liên tiếp → trả `OTP_TOO_MANY_ATTEMPTS` (đã có sẵn trong `mocks.ts`)
- **i18n**: key mới cho state tooMany

## 2. Tham khảo

| Tài liệu | Mục đích |
|---|---|
| `docs/superpowers/handoffs/xac-thuc-email-het-luot-thu.md` | UI chuẩn Stitch state tooMany |
| `docs/CLAUDE.md` mục §3, §4, §5, §11 | Design tokens, 1 nút primary, component reuse |
| `.cursor/rules/i18n.mdc` | next-intl, key `auth.verifyEmail.tooMany.*` |
| `.cursor/rules/testing-required.mdc` | TDD: test đỏ trước |
| `.cursor/rules/component-pattern.mdc` | cva, RHF, props |
| `.cursor/rules/error-handling.mdc` | ApiError mapping |
| `docs/superpowers/plans/2026-10-13-verify-email-otp-form.md` | Plan gốc, đã có foundation (mock, hook, schema) |

## 3. Stack

- Tiếp tục dùng stack hiện tại: RHF + Zod, next-intl, TanStack Query, Material Symbols Outlined (đã có sẵn).
- Không thêm dep mới.

## 4. Subplan (1 commit duy nhất — concern đồng nhất: state tooMany)

### Bước A: TDD — test đỏ trước (RED)
File: `src/components/auth/VerifyEmailForm.test.tsx` — thêm các test case:

1. **State tooMany: title đổi thành "Đã hết lượt thử"** khi nhận `OTP_TOO_MANY_ATTEMPTS`
2. **State tooMany: 6 ô OTP bị disable** + hiển thị "—"
3. **State tooMany: 6 ô OTP có data-state="disabled"** (dùng để testid)
4. **State tooMany: banner vàng cảnh báo bảo mật** (khác banner đỏ ở state B)
5. **State tooMany: icon phong bì có ổ khoá đỏ** (data-state="locked")
6. **State tooMany: nút primary đổi text thành "Gửi mã mới"** với icon refresh
7. **State tooMany: click nút "Gửi mã mới" gọi `resendMutate`**
8. **State tooMany: hiển thị link "Đăng ký email khác"** + "Quay lại đăng ký"
9. **State tooMany: stepper bước 2 có data-state="error"** (đã có sẵn logic, chỉ kích hoạt)
10. **State tooMany: mô tả hiển thị đúng text** "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới để tiếp tục."

### Bước B: GREEN — sửa code

#### B.1 i18n (`messages/vi.json` + `messages/en.json`)
Thêm key mới vào `auth.verifyEmail.tooMany`:

| vi | en |
|---|---|
| `title: "Đã hết lượt thử"` | `title: "Too many attempts"` |
| `description: "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới để tiếp tục."` | `description: "You have entered the wrong code too many times. Please request a new code to continue."` |
| `securityTitle: "Bảo mật tài khoản:"` | `securityTitle: "Account security:"` |
| `securityDesc: "Mã xác thực cũ đã bị vô hiệu hóa để đảm bảo an toàn. Hãy gửi yêu cầu mã mới."` | `securityDesc: "The old code has been disabled for security. Please request a new code."` |
| `sendNew: "Gửi mã mới"` | `sendNew: "Send new code"` |
| `orSignUpDifferent: "Hoặc quay lại"` | `orSignUpDifferent: "Or go back to"` |
| `signUpDifferentLink: "đăng ký với email khác"` | `signUpDifferentLink: "sign up with a different email"` |

#### B.2 Component `OtpInput.tsx`
- Thêm prop `disabledState?: "default" | "locked"` (mặc định "default")
- Khi `disabledState === "locked"`: render 6 ô **read-only** với text "—" thay cho input thật, cursor not-allowed, nền `#F1F5F9` (slate-100), border `#CBD5E1` (slate-300)
- Forward `aria-disabled="true"` cho accessibility
- Khi `disabledState === "locked"`: KHÔNG cho phép click/focus/paste

#### B.3 Component `VerifyEmailForm.tsx`
- Thêm nhánh render state tooMany **hoàn toàn tách biệt** (early return hoặc conditional) — match Stitch UI
- Khi `isTooMany`:
  - Title: `t("tooMany.title")`
  - Description: `t("tooMany.description")` (KHÔNG hiển thị email ở state này)
  - Banner vàng: `bg-amber-50 border-amber-200` thay cho banner đỏ
  - 6 ô OTP: dùng `OtpInput` với `disabledState="locked"`
  - Ẩn: timer validity, banner đỏ inline, nút submit gốc, resend countdown cũ
  - Nút primary "Gửi mã mới" (icon refresh) gọi `handleResend`
  - Link phụ: "Hoặc quay lại đăng ký với email khác" (link `/register`) + "Quay lại đăng ký" (link `/register` icon arrow back)
  - Stepper: bước 2 = `"error"` (đã có logic, kích hoạt bằng `isTooMany`)
- **Audit file**: tất cả là LOGIC (state machine, render branching) → đã có test cover

#### B.4 Mock — `src/features/auth/mocks.ts`
- Logic đã có sẵn: `attempts >= 5` → throw `OTP_TOO_MANY_ATTEMPTS` ✅
- KHÔNG cần sửa gì

#### B.5 Hook — `src/features/auth/hooks.ts`
- Hook `useVerifyOtpMutation` đã map `OTP_TOO_MANY_ATTEMPTS` đúng ✅
- KHÔNG cần sửa

## 5. Test strategy

| Layer | Test (RED → GREEN) |
|---|---|
| Component `VerifyEmailForm` (state tooMany) | 10 test case mới ở Bước A |
| Component `OtpInput` (disabledState="locked") | Test riêng: render 6 ô với text "—", không cho click/focus |
| i18n | Test không cần (chỉ là data) |
| Mock `OTP_TOO_MANY_ATTEMPTS` | Test cũ đã pass (logic đã có) |

## 6. Tiêu chí hoàn thành (DoD)

- [ ] Tất cả test pass (`npm run test` — bao gồm 10 test mới + 30 test cũ)
- [ ] `npm run lint` pass
- [ ] `npm run tsc --noEmit` pass
- [ ] i18n key có đủ `vi` + `en` (key mới `auth.verifyEmail.tooMany.*`)
- [ ] Component không dùng hex màu trực tiếp (chỉ dùng token `warning` + slate tailwind class cho locked OTP — match Stitch handoff)
- [ ] Stepper đã có state `"error"` cho bước 2
- [ ] Commit message EN + Conventional Commits
- [ ] Không tự push (chờ user duyệt)

## 7. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Component quá dài (> 200 dòng) | Tách sub-component `TooManyState` nếu > 200 dòng |
| Conflict visual state B (invalid) với state tooMany | Tách early return cho tooMany — không chồng lấn logic |
| Mock đã throw đúng nhưng component chưa nhận | Đã verify bằng test cũ — OK |
| Stepper state error đã có sẵn từ state B | Tận dụng lại, không duplicate |

## 8. File thay đổi dự kiến (audit Bước 5.0)

| File | Loại | Có test? |
|---|---|---|
| `messages/vi.json` | EDIT – thêm key `auth.verifyEmail.tooMany.*` | N/A (i18n data) |
| `messages/en.json` | EDIT – thêm key tương ứng | N/A (i18n data) |
| `src/components/auth/VerifyEmailForm.tsx` | EDIT – thêm nhánh render state tooMany | LOGIC → cần test (mở rộng test hiện có) |
| `src/components/auth/OtpInput.tsx` | EDIT – thêm prop `disabledState="locked"` | LOGIC → cần test |
| `src/components/auth/VerifyEmailForm.test.tsx` | EDIT – thêm 10 test case state tooMany | test |
| `src/components/auth/OtpInput.test.tsx` | EDIT – thêm test cho `disabledState="locked"` | test |

**Tổng**: 6 file (2 i18n, 1 component edit, 1 component edit, 2 test edit) — 1 commit duy nhất.
