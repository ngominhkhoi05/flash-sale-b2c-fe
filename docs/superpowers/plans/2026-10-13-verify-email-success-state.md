# Plan: VerifyEmail – State (d) Thành công

**Ngày tạo**: 2026-10-13
**Nhánh**: `feat/verify-email-success` (từ `feat/verify-email-too-many`)
**Phạm vi**: Trang `/verify-email/success` hiển thị thông báo xác thực thành công + auto-redirect về `/login`

## 1. Scope

Khi user submit OTP thành công trên `VerifyEmailForm`:
- Hiện tại: `window.location.href = redirectTo` (mặc định `/login`) — UX kém, user không thấy xác nhận thành công
- Cần: chuyển sang trang `/verify-email/success?email=<...>` hiển thị card thành công + auto-redirect 5s về `/login`

### User chọn scope (xác nhận Bước 0)

| # | Quyết định | Lựa chọn |
|---|---|---|
| 1 | Implementation | **full_match_stitch** – tạo route mới + card success đầy đủ |
| 2 | Auto-redirect | 5s về `/login` (sau khi đăng ký xong → đăng nhập) |
| 3 | Nút primary | "Bắt đầu mua sắm" → cũng về `/login` (đồng bộ với auto-redirect) |

## 2. Tham khảo

| Tài liệu | Mục đích |
|---|---|
| `docs/superpowers/handoffs/xac-thu-email-thanh-cong.md` | UI chuẩn Stitch state success |
| `docs/CLAUDE.md` mục §3, §4, §5 | Design tokens, 1 nút primary, component reuse |
| `.cursor/rules/i18n.mdc` | next-intl, key `auth.verifyEmail.success.*` |
| `.cursor/rules/testing-required.mdc` | TDD: test đỏ trước |
| `src/app/(auth)/verify-email/page.tsx` | Pattern trang verify-email hiện tại (Suspense + searchParams) |
| `src/components/auth/VerifyEmailForm.tsx` | Component cần update onSuccess redirect |
| `src/lib/constants.ts` | `ROUTES.VERIFY_EMAIL_SUCCESS` (cần thêm) |
| `src/app/(auth)/layout.tsx` | Layout chung cho `(auth)` group |
| `src/components/auth/AuthHeader.tsx`, `AuthFooter.tsx` | Reuse từ layout cha |

## 3. Stack

- React (Server Component cho page wrapper) + Client Component cho page có searchParams
- next/navigation `useSearchParams` + `useRouter`
- next-intl
- Không thêm dep mới.

## 4. Subplan (1 commit duy nhất — concern đồng nhất: state D success)

### Bước A: TDD — test đỏ trước (RED)

**A.1** File MỚI: `src/components/auth/VerifyEmailSuccess.test.tsx` (test component `VerifyEmailSuccessCard`)

Test cases:
1. Render đầy đủ: stepper 3 bước (bước 1 ✓, bước 2 ✓, bước 3 active), title "Email đã được xác thực", mô tả có email masked
2. Box tài khoản hiển thị email + badge "Đã kích hoạt"
3. Nút primary "Bắt đầu mua sắm" có href="/login"
4. Countdown "Tự chuyển trang sau 5 giây" hiển thị đúng
5. Sau 5s, gọi router.push('/login')
6. Email rỗng → vẫn render (dùng placeholder)

**A.2** File MỚI: `src/app/(auth)/verify-email/success/page.test.tsx` (test page-level)

Test cases:
1. Page render `VerifyEmailSuccessCard` với email từ searchParams
2. Layout 2 cột (AuthBrandPanel + SuccessCard) — match pattern trang verify-email

### Bước B: GREEN — sửa code

#### B.1 i18n (`messages/vi.json` + `messages/en.json`)
Thêm key mới vào `auth.verifyEmail.success`:

| vi | en |
|---|---|
| `title: "Email đã được xác thực"` | `title: "Email verified"` |
| `description: "Tài khoản của bạn đã sẵn sàng."` | `description: "Your account is ready."` |
| `descriptionWithEmail: "{email} đã được kích hoạt thành công."` | `descriptionWithEmail: "{email} has been successfully activated."` |
| `accountLabel: "Tài khoản"` | `accountLabel: "Account"` |
| `activatedBadge: "Đã kích hoạt"` | `activatedBadge: "Activated"` |
| `shopNow: "Bắt đầu mua sắm"` | `shopNow: "Start shopping"` |
| `autoRedirect: "Tự chuyển trang sau"` | `autoRedirect: "Auto redirect in"` |
| `autoRedirectUnit: "giây."` | `autoRedirectUnit: "seconds."` |
| `placeholderEmail: "email của bạn"` | `placeholderEmail: "your email"` (đã có sẵn — reuse) |

#### B.2 Routes (`src/lib/constants.ts`)
Thêm:
```ts
VERIFY_EMAIL_SUCCESS: "/verify-email/success",
```

#### B.3 Component `VerifyEmailSuccessCard.tsx` (MỚI)
File: `src/components/auth/VerifyEmailSuccessCard.tsx`
- `"use client"` (cần useEffect cho countdown + useRouter)
- Props: `email: string`, `redirectTo?: string` (mặc định `/login`), `redirectSeconds?: number` (mặc định 5)
- Render:
  - **Stepper**: bước 1 = done, bước 2 = done, bước 3 = active (sửa `OtpStepper` để nhận state này)
  - **Top accent line**: gradient `from-success via-primary to-success`
  - **Icon**: emerald-50 + check xanh + pulse ring (CSS animation)
  - **Title**: `t("success.title")`
  - **Description**: `t("success.description")` + masked email (dùng `maskEmail` từ `VerifyEmailForm`)
  - **Box tài khoản**: icon person + email + badge "Đã kích hoạt"
  - **Nút primary**: `Link` với href={redirectTo} (KHÔNG phải `window.location` để dùng được prefetch của Next)
  - **Countdown spinner + text**: "Tự chuyển trang sau **5** giây." — đếm từ 5 → 0
  - **useEffect**: setInterval mỗi 1s, khi về 0 thì `router.push(redirectTo)`
- **Audit file**: tất cả là LOGIC (countdown state, route push, JSX) → cần test
- Tách `maskEmail` ra util riêng nếu dùng chung (hoặc duplicate logic — đơn giản hơn)

#### B.4 Sửa `OtpStepper.tsx` — hỗ trợ bước 3 = "done"
- Hiện tại: chỉ hỗ trợ 4 state: `"done" | "active" | "error" | "pending"` — "done" đã có sẵn
- Không cần sửa, chỉ cần truyền `["done", "done", "active"]` là đủ

#### B.5 Sửa `VerifyEmailForm.tsx` — update onSuccess
- Sửa `handleSubmit → onSuccess`:
  - Hiện tại: `window.location.href = redirectTo`
  - Mới: `router.push(ROUTES.VERIFY_EMAIL_SUCCESS + '?email=' + encodeURIComponent(email))`
- Cần import `useRouter` từ `next/navigation` (đã có trong `useSearchParams` mock)
- Cập nhật test cũ `submit gọi verifyMutate` và `clear inline error khi resend` — nếu cần
- **Audit file**: chỉ sửa nhánh onSuccess (1 dòng logic) → cần test
- Test cũ `clear inline error khi user bắt đầu sửa` đã cover `user.paste` — cần test mới cho success redirect

#### B.6 Page `src/app/(auth)/verify-email/success/page.tsx` (MỚI)
- Pattern giống `src/app/(auth)/verify-email/page.tsx`:
  - Server Component wrap với `<Suspense>` + Client Component đọc `useSearchParams`
  - 2 cột: `AuthBrandPanel` (trái) + `VerifyEmailSuccessCard` (phải)
  - Container giống trang verify-email
- File test: `src/app/(auth)/verify-email/success/page.test.tsx`

## 5. Test strategy

| Layer | Test (RED → GREEN) |
|---|---|
| Component `VerifyEmailSuccessCard` | 6 test case (A.1) |
| Page `/verify-email/success` | 2 test case (A.2) |
| Component `VerifyEmailForm` (sửa onSuccess) | 1 test mới: success → router.push('/verify-email/success?email=...') |
| i18n | Test không cần (chỉ là data) |
| Routes constant | Type-only, không cần test |

## 6. Tiêu chí hoàn thành (DoD)

- [ ] Tất cả test pass (`npm run test` — bao gồm test mới + test cũ không vỡ)
- [ ] `npm run lint` pass trên file thay đổi
- [ ] `npm run tsc --noEmit` pass
- [ ] i18n key có đủ `vi` + `en` (key mới `auth.verifyEmail.success.*`)
- [ ] Component không dùng hex màu trực tiếp (chỉ dùng token `success`, `primary`, `emerald-*` chỉ dùng cho Tailwind class chuẩn — match Stitch handoff)
- [ ] Dùng lại `AuthBrandPanel`, `AuthHeader`, `AuthFooter` (qua layout cha)
- [ ] Auto-redirect hoạt động đúng 5s
- [ ] Commit message EN + Conventional Commits
- [ ] Không tự push (chờ user duyệt)

## 7. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| `maskEmail` duplicate ở 2 component | Tách ra util `src/lib/format/mask-email.ts` |
| Test `VerifyEmailForm` cũ bị vỡ do đổi redirect | Update test cũ + thêm test mới cho success flow |
| Countdown timer bị ảnh hưởng khi component unmount | Cleanup interval trong useEffect |
| Next router.push cần Provider (QueryClient) | Đã có ở `Providers.tsx` |
| Route `/verify-email/success` không tồn tại trong `(auth)/layout.tsx` | Layout tự động áp dụng (Next App Router) |

## 8. File thay đổi dự kiến (audit Bước 5.0)

| File | Loại | Có test? |
|---|---|---|
| `messages/vi.json` | EDIT – thêm key `auth.verifyEmail.success.*` | N/A (i18n data) |
| `messages/en.json` | EDIT – thêm key tương ứng | N/A (i18n data) |
| `src/lib/constants.ts` | EDIT – thêm `VERIFY_EMAIL_SUCCESS` | N/A (route constant) |
| `src/lib/format/mask-email.ts` (MỚI) | UTIL (pure function) | cần test |
| `src/lib/format/mask-email.test.ts` (MỚI) | test | – |
| `src/components/auth/VerifyEmailForm.tsx` | EDIT – onSuccess dùng router.push | LOGIC → cần test (mở rộng test hiện có) |
| `src/components/auth/VerifyEmailForm.test.tsx` | EDIT – update test redirect | test |
| `src/components/auth/VerifyEmailSuccessCard.tsx` (MỚI) | LOGIC (countdown, route push) | cần test |
| `src/components/auth/VerifyEmailSuccessCard.test.tsx` (MỚI) | test | – |
| `src/app/(auth)/verify-email/success/page.tsx` (MỚI) | LOGIC (route param, render) | cần test |
| `src/app/(auth)/verify-email/success/page.test.tsx` (MỚI) | test | – |

**Tổng**: 11 file (3 i18n/const, 1 util + test, 1 component edit + test, 2 component mới + test, 1 page mới + test) — 1 commit duy nhất.
