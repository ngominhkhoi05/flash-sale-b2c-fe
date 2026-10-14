# Plan — Homepage API Integration (Storefront `/`)

**Date**: 2026-10-14
**Branch**: `feat/homepage-api-integration`
**Owner**: FE agent
**Stack**: Next 16.3.8 · React 19.2 · TS 5.x · Tailwind 4.x · TanStack Query

> **Revise log (2026-10-14 14:30)**: Plan ban đầu giả định `/banners/home`, `/stores/featured`, `/products/recommended` KHÔNG CÓ trong backend và cần fallback. Sau khi verify Swagger tại `http://180.93.137.28/v3/api-docs`, **cả 3 endpoint đều CÓ** — cập nhật plan để dùng API thẳng, không cần fallback.

## 1. Scope

Wire 4 sections của trang chủ Storefront với backend API thật:

1. **CategoryGridSection** — `GET /api/v1/categories` → lấy 8 đầu
2. **HeroBannerSection** — `GET /api/v1/banners/home` → mainSlides (5 slide)
3. **FeaturedStoresSection** — `GET /api/v1/stores/featured?limit=4`
4. **RecommendedSection** — `GET /api/v1/products/recommended?tab=all` → 3 tab (for_you, best_seller, hot_deal)

3 sections còn lại (FlashSale, Voucher, QuickActions) **không thuộc scope** plan này.

## 2. Tham khảo

- `docs/api-document.md` (1.786 dòng) — backend OpenAPI spec
- `docs/superpowers/plans/2026-10-14-api-audit-config.md` (đã merge) — báo cáo audit
- Backend Swagger thực tế: `http://180.93.137.28/v3/api-docs` (verified 2026-10-14 14:25)
- `src/features/homepage/api.ts` — function hiện tại
- `src/features/homepage/hooks.ts` — TanStack Query hooks hiện tại
- `src/components/storefront/sections/*.tsx` — 7 sections trang chủ
- `.cursor/rules/api-data.mdc` — convention API layer
- `.cursor/rules/flash-sale-b2c-api.mdc` — index các rule API

## 3. Endpoint thật từ Swagger (verified)

| Section | Endpoint BE | Response DTO |
|---|---|---|
| CategoryGrid | `GET /api/v1/categories` | `ApiResponseListCategoryResponse` → `CategoryResponse[]` |
| HeroBanner | `GET /api/v1/banners/home` | `ApiResponseHomeBannersResponse` → `{ mainSlides: BannerResponse[], sideBanners: BannerResponse[] }` |
| FeaturedStores | `GET /api/v1/stores/featured?limit=4` | `ApiResponseListFeaturedStoreResponse` → `FeaturedStoreResponse[]` |
| Recommended | `GET /api/v1/products/recommended?tab=all` | `ApiResponseRecommendedProductsResponse` → `{ forYou, bestSellers, hotDeals }: RecommendedProductResponse[]` |

Tất cả đều public (không cần auth).

## 4. Files sẽ thay đổi

| File | Loại | Logic? | Cần test? |
|---|---|---|---|
| `src/features/homepage/types.ts` | MỚI — DTO khớp BE | ✅ | ✅ |
| `src/features/homepage/api.ts` | SỬA — gọi 4 endpoint BE | ✅ | ✅ |
| `src/features/homepage/hooks.ts` | SỬA — 4 hook `useQuery` mới | ✅ | ✅ |
| `src/features/homepage/index.ts` | SỬA — re-export types | ❌ | ❌ |
| `src/features/homepage/api.test.ts` | SỬA — test cho 4 endpoint | ✅ | — (đã có) |
| `src/components/storefront/sections/CategoryGridSection.tsx` | SỬA — `useCategories()` | ✅ | ✅ |
| `src/components/storefront/sections/CategoryGridSection.test.tsx` | CẬP NHẬT mock | ✅ | — (đã có) |
| `src/components/storefront/sections/HeroBannerSection.tsx` | SỬA — `useHomeBanners()` | ✅ | ✅ |
| `src/components/storefront/sections/HeroBannerSection.test.tsx` | CẬP NHẬT mock | ✅ | — (đã có) |
| `src/components/storefront/sections/FeaturedStoresSection.tsx` | SỬA — `useFeaturedStores()` | ✅ | ✅ |
| `src/components/storefront/sections/FeaturedStoresSection.test.tsx` | CẬP NHẬT mock | ✅ | — (đã có) |
| `src/components/storefront/sections/RecommendedSection.tsx` | SỬA — `useRecommendedProducts(tab)` | ✅ | ✅ |
| `src/components/storefront/sections/RecommendedSection.test.tsx` | CẬP NHẬT mock | ✅ | — (đã có) |
| `src/app/page.test.tsx` | CẬP NHẬT mock | ✅ | — (đã có) |
| `src/app/page.tsx` | CÓ THỂ SỬA nếu cần | ✅ | ✅ |
| `messages/vi.json` + `messages/en.json` | CÓ THỂ THÊM key nếu cần | ❌ | ❌ |

**Tổng cộng**: ~14 file thay đổi.

## 5. Subplan (chia nhỏ để dispatch)

### Subplan 1 — API layer (TDD)
1. **TEST FIRST** (`api.test.ts`): parse DTO cho 4 endpoint
2. Tạo `src/features/homepage/types.ts` (extract DTO từ Swagger)
3. Implement `src/features/homepage/api.ts` (gọi `apiFetch`)
4. Run test → PASS

### Subplan 2 — Hooks layer (TDD)
5. **TEST FIRST** (`hooks.test.tsx`): query key, queryFn, isLoading, isError
6. Implement `src/features/homepage/hooks.ts` (4 useQuery)
7. Run test → PASS

### Subplan 3 — UI Sections (TDD)
8. Update test + implement `CategoryGridSection.tsx`
9. Update test + implement `HeroBannerSection.tsx`
10. Update test + implement `FeaturedStoresSection.tsx`
11. Update test + implement `RecommendedSection.tsx`

### Subplan 4 — Verify
12. Update `src/app/page.test.tsx` (mock 4 hook)
13. `npm run test` → all PASS
14. `npm run lint` → PASS
15. `npm run tsc --noEmit` → PASS
16. `npm run build` → PASS

## 6. Test Strategy

| Test | Coverage |
|---|---|
| `api.test.ts` | Parse DTO cho 4 endpoint |
| `hooks.test.tsx` | Query key, queryFn, isLoading, isError, data shape |
| `CategoryGridSection.test.tsx` | Render categories, loading, error, empty |
| `HeroBannerSection.test.tsx` | Render banners, loading, error |
| `FeaturedStoresSection.test.tsx` | Render stores, loading, error |
| `RecommendedSection.test.tsx` | Render 3 tab, switching tab |
| `page.test.tsx` | Homepage render toàn bộ section |

**TDD gate**: KHÔNG sửa code trước khi có test đỏ (rule §5.1 testing-required.mdc).

## 7. Rủi ro

- **API thật có CORS / timeout** → cần `apiFetch` retry 1 lần + error boundary.
- **Type mismatch** giữa DTO swagger và hiện trạng component: `CategoryResponse` chỉ có `id, name, slug, commissionRate, description` — không có `icon`. CategoryGrid hiện dùng `icon` → cần map slug → icon.
- **Banner fallback** khi BE down: chưa có fallback strategy. Acceptable cho dev: hiện skeleton.
- **FeaturedStoreResponse** không có `slug` (chỉ có `id`) → link `/shop/[id]` tạm OK, sau sẽ cần BE bổ sung.
- **RecommendedProductResponse** không có `slug` → link `/products/{id}` (đã fix redirect id → slug ở turn trước).

## 8. Out of scope

- Backend modifications (FE-only task)
- Search bar wire
- Mobile-specific homepage
- Section `FlashSaleStripSection` (đã wire riêng ở task khác)
- Section `VoucherGridSection` (đã wire riêng)
- Section `QuickActionsSection` (no API)

## 9. Commit Strategy

- 4 commits theo concern:
  1. `feat(homepage): add API DTO types and apiFetch wrappers`
  2. `feat(homepage): add TanStack Query hooks for homepage data`
  3. `feat(homepage): wire CategoryGrid and HeroBanner to API`
  4. `feat(homepage): wire FeaturedStores and Recommended to API`

Mỗi commit tự pass 7 mốc pre-commit checklist.

## 10. Liên kết

- Audit plan: `docs/superpowers/plans/2026-10-14-api-audit-config.md`
- API spec: `docs/api-document.md`
- Backend Swagger (verified): `http://180.93.137.28/v3/api-docs`
