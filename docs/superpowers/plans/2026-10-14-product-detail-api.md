# Plan — Product Detail API Integration

**Date**: 2026-10-14
**Branch**: `feat/homepage-api-integration` (tiếp tục, cùng concern API wiring)
**Owner**: FE agent
**Stack**: Next 16.3.8 · React 19.2 · TS 5.x · Tailwind 4.x · TanStack Query

> **Context (2026-10-14 14:44)**: User báo bug — click sản phẩm trong section (Recommended / Hero / Featured) trả HTTP 200 nhưng UI 404. Nguyên nhân: section link dùng `/products/<id>` (id 1, 3, 7, 12...), mock chỉ có **1 sản phẩm (id=1)** với `mockProductIdToSlug[1] = "ao-thun-..."`. Click id khác → `notFound()`. User chọn fix bằng cách chuyển page detail sang API thật.

## 1. Scope

Wire page detail `/products/[slug]` với backend thật:

1. Nếu `slug` là số (id) → gọi `GET /api/v1/products/{id}` → lấy `slug` từ response → redirect sang `/products/{slug}` SEO
2. Nếu `slug` không phải số (slug SEO) → gọi `GET /api/v1/products/slug/{slug}` → render

Bỏ `mockProductIdToSlug` và `mockProductsBySlug` (mock không còn dùng cho production, chỉ làm fallback dev).

## 2. Tham khảo

- `docs/api-document.md` + Swagger verified tại `http://180.93.137.28/v3/api-docs`
- `src/features/products/api.ts` — có `useProductDetail(id)` hook hiện tại
- `src/features/products/types.ts` — `ProductDetail` type (đã có)
- `src/features/products/mock.ts` — chỉ dùng làm fallback
- `.env` đã có `NEXT_PUBLIC_API_URL=http://180.93.137.28`
- `.cursor/rules/flash-sale-b2c-api.mdc`
- `.cursor/rules/api-data.mdc`

## 3. Endpoint BE (verified)

| Route | Endpoint | Response DTO |
|---|---|---|
| Detail by id | `GET /api/v1/products/{id}` | `ApiResponseProductDetailResponse` → `ProductDetailResponse` |
| Detail by slug | `GET /api/v1/products/slug/{slug}` | `ApiResponseProductDetailResponse` → `ProductDetailResponse` |

Cả 2 đều **public** (không cần auth), chỉ trả về product ACTIVE của store APPROVED.

## 4. Files sẽ thay đổi

| File | Loại | Logic? | Cần test? |
|---|---|---|---|
| `src/features/products/api.ts` | SỬA — thêm `fetchProductDetailBySlug(slug)`, `fetchProductDetailById(id)` | ✅ | ✅ |
| `src/features/products/hooks.ts` | SỬA — thêm `useProductDetailBySlug(slug)` | ✅ | ✅ |
| `src/app/(storefront)/products/[slug]/page.tsx` | SỬA — gọi API thật, redirect id → slug | ✅ | ✅ |
| `src/app/(storefront)/products/[slug]/page.test.tsx` | CẬP NHẬT — mock API thật | ✅ | — (mới) |
| `src/features/products/mock.ts` | THU NHỎ — chỉ giữ làm `__DEV_FALLBACK__` (env-gated) | ❌ fallback | ❌ |
| `src/features/products/index.ts` | SỬA — re-export API mới | ❌ re-export | ❌ |

**Tổng cộng**: 6 file thay đổi.

## 5. Subplan

### Subplan 1 — API + Hooks (TDD)
1. **TEST FIRST** (`api.test.ts`): parse DTO cho `fetchProductDetailById` + `fetchProductDetailBySlug`
2. Implement `fetchProductDetailById(id)` + `fetchProductDetailBySlug(slug)` trong `api.ts`
3. **TEST FIRST** (`hooks.test.tsx`): `useProductDetailBySlug` returns data
4. Implement hook
5. Run test → PASS

### Subplan 2 — Page detail (TDD)
6. **TEST FIRST** (`page.test.tsx` mới):
   - `/products/<numeric-id>` → fetch by id → redirect to slug
   - `/products/<slug>` → fetch by slug → render ProductDetailPage
   - 404 case (slug không tồn tại) → render not-found
7. Implement `page.tsx` dùng API thật
8. Run test → PASS

### Subplan 3 — Cleanup mock
9. Thu nhỏ `mock.ts` (chỉ giữ cho dev fallback nếu BE down — gate bằng `NEXT_PUBLIC_USE_MOCK=true`)
10. Update `index.ts` re-exports
11. Run test + lint + tsc

## 6. Test Strategy

| Test | Coverage |
|---|---|
| `features/products/api.test.ts` | Parse DTO cho 2 endpoint mới |
| `features/products/hooks.test.tsx` | Query key, queryFn, error state |
| `app/(storefront)/products/[slug]/page.test.tsx` | Redirect id→slug, render by slug, 404 |

**TDD gate**: RED → GREEN → refactor.

## 7. Rủi ro

- **ProductDetailResponse** rất lớn (60+ field) → cần `satisfies ProductDetail` để verify shape.
- **API thật có thể chậm / CORS** → dùng Next 16 `fetch` cache + revalidate, không block UI.
- **Mock còn dùng ở test** — KHÔNG xóa `mockProductDetail` mà chỉ ẩn khỏi `mockProductsBySlug` index.
- **Slug có thể chứa ký tự đặc biệt** → cần `encodeURIComponent` khi build URL.

## 8. Out of scope

- Wire các trang khác (search, category list) — task riêng
- Rewrite ProductDetailPage UI — không đổi behavior
- Xử lý ảnh placeholder khi `imageUrl` rỗng — fix riêng

## 9. Commit Strategy

- 2 commits theo concern:
  1. `feat(products): add fetchProductDetailById and fetchProductDetailBySlug with hooks`
  2. `feat(products): wire product detail page to backend API`

Mỗi commit tự pass 7 mốc pre-commit checklist.

## 10. Liên kết

- Plan trước: `2026-10-14-homepage-api-integration.md`
- API spec: `docs/api-document.md`
- Swagger verified: `http://180.93.137.28/v3/api-docs`
