# Plan: Auth-guard cho Storefront Protected Routes + Post-Login Refresh

> **Ngày**: 2026-10-10
> **Branch**: `feature/storefront-homepage-stitch` (tiếp tục từ commit `24bddf4`)
> **Tác giả**: Cursor Agent
> **Trạng thái**: DRAFT — chờ user duyệt Bước 4

---

## 1. Scope (Bước 1)

### 1.1 Vấn đề

User yêu cầu:

1. **Sửa đường dẫn**: "đối với chức năng nào yêu cầu auth thì trực tiếp dẫn đến trang đăng nhập"
   - User chọn scope: **3 trang chính** — Giỏ hàng (`/gio-hang`), Kho voucher (`/kho-voucher`), Tài khoản (`/tai-khoan`)
   - Các link này khi click → check `useAuth()` → nếu chưa login → redirect `/dang-nhap?redirect=<path>` (thay vì vào trang rồi mới báo lỗi).

2. **Cập nhật API sau khi đăng nhập** trên trang chủ: "ở trang chủ cũng phải có 1 số cập nhập API sau khi đăng nhập"
   - User chọn: **3 API** — số giỏ hàng (cart count), voucher cá nhân, đều xuất cá nhân hóa (recommendations)
   - Sau khi `useLoginMutation` success → invalidate các query key tương ứng để trang chủ refetch tự động.

3. **Redirect query**: Có `?redirect=<path>` (sau đăng nhập thành công → quay lại path cũ).

### 1.2 Phạm vi KHÔNG bao gồm (out of scope)

- Tạo UI đầy đủ cho 3 trang mới (`gio-hang`, `kho-voucher`, `tai-khoan`) — chỉ tạo **stub page** với EmptyState + skeleton, tập trung vào flow auth.
- Refactor toàn bộ 7 sections trang chủ sang API thật (đã có plan riêng trong file `2026-10-10-frontend-storefront-homepage-api-requests.md` — đang chờ Backend).
- Thêm auth-guard cho route Seller/Admin (đã có sẵn trong `proxy.ts`).
- Multi-tab logout / session expiry handling (xử lý sau).

---

## 2. Tham khảo (Source of Truth)

| File | Mục đích |
|---|---|
| `docs/CLAUDE.md` mục 9 | Phân quyền & điều hướng — quy ước `/seller/**`, `/admin/**` |
| `.cursor/rules/routing-guards.mdc` | Pattern auth-guard + middleware (sẽ load khi cần) |
| `.cursor/rules/auth-jwt.mdc` | JWT, refresh, persist key, session cookie bridge |
| `.cursor/rules/component-pattern.mdc` | Pattern component, cva, forwardRef |
| `.cursor/rules/i18n.mdc` | next-intl namespace, key `error.*` |
| `.cursor/rules/testing-required.mdc` | TDD bắt buộc, file test cạnh file |
| `.cursor/rules/anti-drift-workflow.mdc` | 9-step checklist đầu mỗi response |
| `node_modules/next/dist/docs/` (sẽ check) | Next 16 proxy.ts vs middleware.ts convention |
| `src/features/auth/hooks.ts` | `useLoginMutation` hiện tại |
| `src/stores/auth.store.ts` | Zustand auth state + persist |
| `src/proxy.ts` | Hiện chỉ chặn `/seller/**`, `/admin/**` |
| `src/components/auth/LoginForm.tsx` | Chưa đọc `?redirect=` |
| `src/components/storefront/StorefrontHeader.tsx` | Cart count hardcode "3" |

---

## 3. Subplan (Bước 2)

Task lớn này chia thành **4 subplan độc lập**, mỗi subplan có thể chạy tuần tự (vì có phụ thuộc nhẹ) hoặc song song nếu user chọn.

### Subplan A — `AuthGuard` component + auth-aware navigation helper (FOUNDATION)

> Mục tiêu: Có được lớp bảo vệ dùng chung cho mọi trang yêu cầu auth.

**Tạo mới**:
- `src/components/auth/AuthGuard.tsx` — Client Component, props `{ children, fallback? }`. Check `useAuth().isAuthenticated` + `isHydrated`. Nếu chưa authenticated → `router.replace('/dang-nhap?redirect=' + encodeURIComponent(currentPath))`.
- `src/components/auth/AuthGuard.test.tsx` — cover: (1) render children khi authenticated, (2) redirect khi unauthenticated, (3) render fallback trong khi chờ hydration.
- `src/lib/auth/require-auth.ts` — helper function `requireAuthOrRedirect(pathname: string, isAuth: boolean, router: Router): boolean` (pure function, dễ test).
- `src/lib/auth/require-auth.test.ts` — cover redirect URL encoding, edge cases (pathname rỗng, có query).

**Sửa**:
- `src/components/storefront/StorefrontHeader.tsx` (line 195) — sửa `Link href="/gio-hang"` → wrap trong helper hoặc đổi sang onClick handler check auth (xem mục 4 để quyết).
- `src/components/storefront/MobileBottomNav.tsx` — tương tự: các tab Giỏ hàng, Tài khoản.

**Test**: 2 file mới (AuthGuard.test.tsx, require-auth.test.ts) + có thể thêm test cho StorefrontHeader (nếu sửa logic).

**Phụ thuộc**: Không. Có thể chạy đầu tiên.

### Subplan B — `proxy.ts` (Next 16 middleware) thêm handler cho storefront protected routes (SERVER GUARD)

> Mục tiêu: Chặn ở edge trước khi render — defense-in-depth, tránh flash nội dung khi user chưa login nhưng vẫn vào `/gio-hang` qua URL trực tiếp.

**Sửa**:
- `src/proxy.ts` — thêm block:
  ```ts
  const storefrontProtected = ['/gio-hang', '/kho-voucher', '/tai-khoan', '/don-hang'];
  if (storefrontProtected.some(p => pathname.startsWith(p))) {
    const accessToken = request.cookies.get('access_token')?.value;
    if (!accessToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/dang-nhap';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  ```
- KHÔNG cần test riêng cho `proxy.ts` (theo `testing-required.mdc` mục "Khi nào KHÔNG cần test" — config-level file, không có business logic). Nhưng có thể thêm integration test nếu user yêu cầu (out of scope hiện tại).

**Phụ thuộc**: Subplan A (để biết convention AuthGuard đặt tên thế nào).

### Subplan C — LoginForm đọc `?redirect=` + useLoginMutation mở rộng invalidate (REDIRECT LOGIC)

> Mục tiêu: Sau đăng nhập thành công → navigate về path ban đầu (nếu có) + invalidate các query cần refetch.

**Sửa**:
- `src/components/auth/LoginForm.tsx` (line 50-55) — đổi `push(ROUTES.HOME)` → đọc `useSearchParams().get('redirect')`, nếu có thì `router.push(redirect)`, nếu không thì `router.push(ROUTES.HOME)`. Phải validate redirect path là internal path (bắt đầu bằng `/`, không phải URL ngoài) để tránh open redirect attack.
- `src/features/auth/hooks.ts` (line ~55) — `useLoginMutation.onSuccess` mở rộng:
  ```ts
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    // MỚI — refetch 3 nhóm data trên trang chủ
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['vouchers', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['products', 'recommended'] }),
    ]);
  }
  ```
- Thêm helper `src/lib/auth/safe-redirect.ts` — function `sanitizeRedirectPath(input: string | null): string` (trả về path hợp lệ hoặc default `/`).
- `src/lib/auth/safe-redirect.test.ts` — cover: valid path, URL ngoài (`https://evil.com`), `//evil.com`, `javascript:...`, `null` → default.

**Test**: 1 file mới (safe-redirect.test.ts) + có thể thêm test cho LoginForm redirect (nếu chưa có).

**Phụ thuộc**: Subplan A (để có query key convention).

### Subplan D — 3 features hook (cart count, my vouchers, recommended) + 3 stub page (FEATURE WIRING)

> Mục tiêu: Có query key cho 3 API để invalidate, đồng thời có page thật (dù chỉ stub) để AuthGuard bảo vệ.

**Tạo mới**:
- `src/features/cart/api.ts` — `getCartItems()`, `getCartSummary()` (hiện dùng mock, tương lai gắn API thật).
- `src/features/cart/hooks.ts` — `useCart()`, `useCartCount()` (TanStack Query).
- `src/features/cart/types.ts` — `CartItem`, `CartSummary`.
- `src/features/cart/schemas.ts` — zod schema (nếu cần).
- `src/features/cart/index.ts` — re-export.
- `src/features/cart/api.test.ts` + `src/features/cart/hooks.test.ts` — test cơ bản.
- `src/features/vouchers/api.ts` — `getMyVouchers()`.
- `src/features/vouchers/hooks.ts` — `useMyVouchers()`.
- `src/features/vouchers/types.ts` — `UserVoucher`.
- `src/features/vouchers/index.ts`.
- `src/features/vouchers/api.test.ts` + `src/features/vouchers/hooks.test.ts`.
- `src/features/products/api.ts` — `getRecommendedProducts()`.
- `src/features/products/hooks.ts` — `useRecommendedProducts()`.
- `src/features/products/types.ts` — `Product` (subset của `ProductSummaryResponse`).
- `src/features/products/index.ts`.
- `src/features/products/hooks.test.ts` (cover query key + select function).
- `src/app/(storefront)/gio-hang/page.tsx` — stub page dùng `AuthGuard`, hiển thị EmptyState + skeleton, có cart count từ hook.
- `src/app/(storefront)/gio-hang/page.test.tsx` — test render trong AuthGuard.
- `src/app/(storefront)/kho-voucher/page.tsx` + test — tương tự.
- `src/app/(storefront)/tai-khoan/page.tsx` + test — tương tự.

**Sửa**:
- `src/components/storefront/StorefrontHeader.tsx` (line 195) — đổi cart count từ hardcode "3" → dùng `useCartCount()`.
- `src/components/storefront/StorefrontHeader.test.tsx` (nếu có) — thêm test cho cart count hook integration.

**i18n keys mới** (cần thêm vào `messages/vi.json` + `messages/en.json`):
- `cart.*` — `title`, `empty`, `loading`
- `voucher.*` — `title`, `empty`, `loading`
- `account.*` — `title`, `empty`, `loading`, `profile`, `orders`, `logout`
- `auth.login.redirectNotice` — "Vui lòng đăng nhập để tiếp tục" (kèm tên trang được redirect)

**Test**:
- 3 file api.test.ts (mock apiFetch)
- 3 file hooks.test.ts (TanStack Query wrapper test)
- 3 file page.test.tsx (AuthGuard + render)

**Phụ thuộc**: Subplan A (AuthGuard), Subplan C (query key convention).

---

## 4. Quyết định cần user xác nhận (Bước 4)

Trước khi chạy Bước 5, tôi sẽ hỏi user 1 câu hỏi (xem bên dưới).

---

## 5. Thứ tự chạy & effort estimate

| Subplan | Effort | Files touched | Lines estimate |
|---|---|---|---|
| A — AuthGuard + require-auth | 2h | 4 tạo + 2 sửa | ~250 dòng + ~200 dòng test |
| B — proxy.ts | 30min | 1 sửa | ~20 dòng |
| C — LoginForm redirect + invalidate | 1.5h | 1 tạo + 2 sửa | ~50 dòng + ~80 dòng test |
| D — 3 features + 3 stub pages | 3h | 13 tạo + 2 sửa | ~500 dòng + ~300 dòng test |
| **Total** | **~7h** | **20+ file** | **~1400 dòng** |

Chạy tuần tự: A → C → D (vì D phụ thuộc C), chèn B giữa A và C (vì C cần biết proxy không chặn `?redirect=...`).

---

## 6. Test strategy

Theo `testing-required.mdc` — TDD bắt buộc, mọi file logic phải có test kèm:

| File | Test kèm |
|---|---|
| `AuthGuard.tsx` | ✅ `AuthGuard.test.tsx` |
| `require-auth.ts` | ✅ `require-auth.test.ts` |
| `safe-redirect.ts` | ✅ `safe-redirect.test.ts` |
| `features/cart/api.ts` | ✅ `api.test.ts` (mock apiFetch) |
| `features/cart/hooks.ts` | ✅ `hooks.test.ts` (TanStack Query wrapper) |
| `features/vouchers/api.ts` | ✅ `api.test.ts` |
| `features/vouchers/hooks.ts` | ✅ `hooks.test.ts` |
| `features/products/api.ts` | ✅ `api.test.ts` |
| `features/products/hooks.ts` | ✅ `hooks.test.ts` |
| 3 page `page.tsx` | ✅ `page.test.tsx` |
| `proxy.ts` | ❌ Không (config-level, theo rule) |
| `LoginForm.tsx` (sửa) | ⚠️ Nếu đã có test → update; nếu chưa → tạo mới |
| `StorefrontHeader.tsx` (sửa) | ⚠️ Nếu đã có test → update |
| i18n `messages/*.json` | ❌ Không (data file) |

---

## 7. Khi hoàn thành

- `npm run test` PASS (toàn bộ test cũ + mới)
- `npm run lint` PASS
- `npm run build` PASS
- Auto-commit theo convention 1 commit / concern:
  - `feat(auth): add AuthGuard component for protected routes`
  - `feat(middleware): protect storefront auth-required routes via proxy.ts`
  - `feat(auth): support ?redirect= query param in LoginForm + invalidate cart/vouchers/recommended on login`
  - `feat(features): add cart, vouchers, products hooks + stub pages for gio-hang, kho-voucher, tai-khoan`
- Báo cáo với format chuẩn (xem `AGENTS.md` cuối file).
- KHÔNG push (chờ user duyệt).

---

## 8. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Open redirect attack (URL ngoài qua `?redirect=`) | Helper `sanitizeRedirectPath` reject mọi URL không bắt đầu bằng `/` đơn |
| Flash redirect khi hydration chưa xong | `AuthGuard` check `isHydrated` từ `useAuth()` trước khi redirect |
| 7 sections trang chủ chưa gắn query → invalidate không có effect | Subplan C chỉ invalidate query key đã có (sẽ setup ở Subplan D trước khi C chạy) |
| Test nhiều → chậm | Chạy song song các subagent test, hoặc chạy tuần tự nhưng chia batch |
| `proxy.ts` syntax Next 16 khác Next 15 | Đọc `node_modules/next/dist/docs/` mục proxy trước khi sửa |
