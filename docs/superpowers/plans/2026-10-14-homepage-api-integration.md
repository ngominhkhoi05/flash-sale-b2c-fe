# Plan — Homepage API Integration (Storefront `/`)

**Date**: 2026-10-14
**Branch**: `feat/homepage-api-integration`
**Owner**: FE agent
**Stack**: Next 16.3.8 · React 19.2 · TS 5.x · Tailwind 4.x · TanStack Query

## 1. Scope

Wire 4 sections của trang chủ Storefront với backend API thật:

1. **CategoryGridSection** — thay 8 items hardcoded → gọi `GET /api/v1/categories`
2. **HeroBannerSection** — endpoint `/banners/home` KHÔNG CÓ trong backend → fallback lấy top 3-5 featured products
3. **FeaturedStoresSection** — endpoint `/stores/featured` KHÔNG CÓ → dùng `GET /api/v1/stores/{id}` cho từng storeId được define (TODO: backend cần thêm endpoint)
4. **RecommendedSection** — endpoint `/products/recommended` KHÔNG CÓ → fallback `GET /api/v1/products` với pagination để lấy 20 sản phẩm nổi bật

3 sections đã wire đúng giữ nguyên (FlashSale, Voucher, QuickActions không cần API).

## 2. Tham khảo

- `docs/api-document.md` (1.786 dòng) — backend OpenAPI spec
- `docs/superpowers/plans/2026-10-14-api-audit-config.md` (đã merge) — báo cáo audit
- `src/features/homepage/api.ts` — function hiện tại (4 hook sai endpoint)
- `src/features/homepage/hooks.ts` — TanStack Query hooks
- `src/components/storefront/sections/*.tsx` — 7 sections của trang chủ
- `.cursor/rules/api-data.mdc` — convention API layer

## 3. Files sẽ thay đổi

| File | Loại | Logic? | Cần test? |
|---|---|---|---|
| `src/features/homepage/api.ts` | SỬA — thêm `fetchCategories`, `fetchFeaturedProducts`; sửa `fetchHomeBanners`/`fetchFeaturedStores`/`fetchRecommendedProducts` fallback | ✅ | ✅ |
| `src/features/homepage/hooks.ts` | SỬA — thêm `useCategories`, `useFeaturedProducts`; sửa các hook hiện tại (giữ nguyên interface) | ✅ | ✅ |
| `src/features/homepage/types.ts` | MỚI — extract types ra file riêng | ✅ | ✅ |
| `src/features/homepage/index.ts` | SỬA — re-export types + hooks | ❌ (re-export) | ❌ |
| `src/components/storefront/sections/HeroBannerSection.tsx` | SỬA — fallback featured products khi banner API fail | ✅ | ✅ |
| `src/components/storefront/sections/CategoryGridSection.tsx` | SỬA — thay hardcode bằng `useCategories()` | ✅ | ✅ |
| `src/components/storefront/sections/FeaturedStoresSection.tsx` | SỬA — fallback sang `useFeaturedProducts()` | ✅ | ✅ |
| `src/components/storefront/sections/RecommendedSection.tsx` | SỬA — đổi sang `useFeaturedProducts()` (gộp data) | ✅ | ✅ |
| `src/components/storefront/sections/FlashSaleStripSection.tsx` | KHÔNG ĐỔI | — | — |
| `src/components/storefront/sections/VoucherGridSection.tsx` | KHÔNG ĐỔI | — | — |
| `src/components/storefront/sections/QuickActionsSection.tsx` | KHÔNG ĐỔI (no API) | — | — |
| `src/app/page.test.tsx` | CẬP NHẬT — mock API mới | ✅ | ✅ |
| `src/components/storefront/sections/*/*.test.tsx` | CẬP NHẬT — mock API mới | ✅ | ✅ |
| `messages/vi.json` + `messages/en.json` | SỬA — thêm i18n keys cho section sử dụng categories | ❌ (i18n) | ❌ |

**Tổng cộng**: ~14 file thay đổi (8 logic + 2 i18n + 4 test).

## 4. Subplan

### Phase A — Backend DTO + Adapter (TDD)

1. **TEST FIRST**: viết `homepage.api.test.ts` cho:
   - `fetchCategories()` parse response đúng
   - `fetchFeaturedProducts()` parse product list
   - `fetchHomeBanners()` fallback khi API trả 404
2. Implement API functions trong `src/features/homepage/api.ts`
3. Run test → PASS

### Phase B — Hooks (TDD)

4. **TEST FIRST**: viết `homepage.hooks.test.tsx` cho:
   - `useCategories()` returns data
   - `useFeaturedProducts()` returns data
   - `useHomeBanners()` fallback to mock khi API 404
5. Implement trong `src/features/homepage/hooks.ts`
6. Run test → PASS

### Phase C — UI Sections (TDD)

7. **TEST FIRST**: update `CategoryGridSection.test.tsx`:
   - Render categories từ API
   - Loading state
   - Error state
   - Empty state
8. Implement CategoryGridSection → dùng `useCategories()`
9. **TEST FIRST**: update `HeroBannerSection.test.tsx`:
   - Render featured products khi banner fail
   - Loading state
10. Implement HeroBannerSection fallback
11. **TEST FIRST**: update `FeaturedStoresSection.test.tsx`:
    - Render products từ `useFeaturedProducts()` thay vì stores
    - Loading/empty state
12. Implement FeaturedStoresSection
13. **TEST FIRST**: update `RecommendedSection.test.tsx`:
    - Render products từ `useFeaturedProducts()`
14. Implement RecommendedSection

### Phase D — i18n + Page test

15. Update `messages/vi.json` + `messages/en.json` (thêm key `categoryGrid.items.*` từ API response — không cần thêm vì dùng fallback label)
16. Update `src/app/page.test.tsx` (mock tất cả API hooks)

### Phase E — Verify

17. `npm run lint` → PASS
18. `npm run tsc --noEmit` → PASS
19. `npm run test` → all PASS
20. `npm run build` → PASS

## 5. Test Strategy

| Test | Coverage |
|---|---|
| `homepage.api.test.ts` | Parse DTO + fallback khi 404 |
| `homepage.hooks.test.tsx` | Query key, queryFn, fallback, error state |
| `CategoryGridSection.test.tsx` | Render categories, loading, error, empty |
| `HeroBannerSection.test.tsx` | Render featured products fallback |
| `FeaturedStoresSection.test.tsx` | Render products (không phải stores) |
| `RecommendedSection.test.tsx` | Render products với tab |
| `page.test.tsx` | Homepage render toàn bộ section |

**TDD gate**: KHÔNG sửa code trước khi có test đỏ (rule §5.1 testing-required.mdc).

## 6. Rủi ro

- **Mock data shape mismatch**: khi fallback, types phải khớp giữa products và stores/cards. Cần adapter cẩn thận.
- **i18n labels**: categories từ API không có labelKey, phải dùng `t(category.slug)` hoặc fallback theo id.
- **Hero fallback UX**: 5 slide từ featured products có thể không đẹp bằng banner thật. Acceptable cho dev mock.
- **CategoryGrid item count**: backend `/categories` có thể trả nhiều hơn 8 → chỉ lấy 8 đầu + "Xem tất cả".
- **API spec 2026-10-07**: backend có thể đã update. Verify Swagger khi backend available.

## 7. Out of scope

- Backend modifications (FE-only task)
- Banner CMS UI (chưa có)
- Store featured flag (`isFeatured` boolean) — chưa có backend
- Search bar wire (đã có ở search feature)
- Mobile-specific homepage

## 8. Commit Strategy

- 4 commits theo concern (Phase A → B → C → D):
  1. `feat(homepage): add real API integration with fallback`
  2. `feat(homepage): wire CategoryGrid to API`
  3. `feat(homepage): wire Hero/Featured/Recommended fallback`
  4. `test(homepage): update page.tsx integration test`

Mỗi commit tự pass 7 mốc pre-commit checklist.

## 9. Liên kết

- Audit plan: `docs/superpowers/plans/2026-10-14-api-audit-config.md`
- API spec: `docs/api-document.md`
- Backend Swagger: `http://180.93.137.28/swagger-ui/index.html#` (hiện không truy cập được từ agent)
