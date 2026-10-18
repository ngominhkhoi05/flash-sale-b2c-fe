# Fix 3 pre-existing test failures

## Problem

3 tests fail khi chạy `npm run test` (full suite):

| # | File | Test | Root cause |
|---|---|---|---|
| 1 | `src/components/storefront/checkout/FailedModule.test.tsx` | `countdown ticks down by 1 second after 1s` (line 192–210) | **Duplicate test** (line 116–136 đã cover). Test này dùng `screen.getByText(/0[34]:\d\d/)` match multiple elements (countdown text "Còn 04:14" + subtitle "đến 03:36" + voucher warning "trước 03:36"). |
| 2 | `src/components/auth/GoogleLoginButton.test.tsx` | `KHÔNG lưu sessionStorage khi URL không có ?redirect=` | **Test pollution**: test trước (`lưu ?redirect= vào sessionStorage`) không mock `sessionStorage` → setItem được gọi trên `window.sessionStorage` thật. Test sau (`sessionStorageMock` riêng) vẫn thấy setItem calls leak từ real sessionStorage. |
| 3 | `src/components/auth/GoogleLoginButton.test.tsx` | `sanitize redirect path: KHÔNG lưu protocol-relative URL` | **Test pollution** tương tự #2. |

## Scope

**Chỉ fix test (component logic đã đúng — đã được user xác nhận)**.

User explicitly chose option 1: *"Fix test (component logic đã đúng)"*.

## Subplan

### Subplan A — Fix `FailedModule.test.tsx`

- **RED**: Chạy test hiện tại → 1 fail (line 200).
- **GREEN**: Xoá duplicate test (line 192–210), giữ test gốc (line 116–136) — đã cover đầy đủ. Hoặc sửa regex dùng `data-testid="failed-countdown-text"` thay vì regex text.

**Quyết định**: Sửa test (không xoá) — dùng `getByTestId` chính xác. Lý do: test cũ cover happy path, test mới (line 192) có thêm assertion `expect(initial).not.toBe(after)` — có giá trị. Nhưng cùng ý → sửa regex thôi.

### Subplan B — Fix `GoogleLoginButton.test.tsx`

- **RED**: Chạy test hiện tại → 2 fail (pollution từ test 1).
- **GREEN**: Test 1 (`lưu ?redirect=`) mock `sessionStorage` đúng cách. Hoặc test 1 dùng `vi.spyOn(Storage.prototype, 'setItem')` thay vì thật.

**Quyết định**: Thêm mock `sessionStorage` cho test 1. Test 1 hiện `render(<GoogleLoginButton />)` không có `sessionStorage` mock → component dùng `window.sessionStorage.setItem` thật → state leak sang test sau.

## Test strategy

- Chạy `npx vitest run src/components/storefront/checkout/FailedModule.test.tsx src/components/auth/GoogleLoginButton.test.tsx` → expect 0 fail.
- Chạy `npm run test` (full suite) → expect 0 fail.

## Risk

- **Low**: chỉ sửa test, không động vào component logic.
- **Migration**: N/A.

## Out of scope

- Component `CountdownPill` logic (đã đúng, đã pass 11/12 test trong `FailedModule.test.tsx`).
- Logic `sanitizeRedirectPath` (đã pass riêng).
