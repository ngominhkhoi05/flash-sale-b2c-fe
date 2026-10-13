# Search Page UI — Stitch Implementation

> **Date**: 2026-10-13
> **Branch**: `feat/search-page-ui` (từ `dev`)
> **Scope**: Trang `/search` (Storefront) + feature module `src/features/search/`
> **Reference**: `docs/superpowers/handoffs/tim-kiem-san-pham.md` (1064 dòng)
> **Sibling**: `docs/superpowers/handoffs/trang-flash-sale.md` (706 dòng) — pattern tham khảo

## 1. Background

FE cần trang `/search` cho Storefront để user xem kết quả tìm kiếm sản phẩm với:
- Breadcrumb + heading ("Kết quả cho '{q}'" + tổng số SP)
- Banner "Shop Mall chính hãng" Sony nếu match (optional, có thể làm sau)
- Sidebar filter (Danh mục con / Nơi bán / Khoảng giá / Đánh giá sao / Dịch vụ & Khuyến mãi)
- Sort bar (Liên quan / Mới nhất / Bán chạy / Giá tăng–giảm) + mini pagination
- Active filter chips
- Product grid 4 cột (mobile 2) — dùng `ProductCard` Modern Clean đã có
- Empty state (khi không có kết quả)
- Pagination dưới cùng (42 trang, kiểu `1 2 3 4 ... 42`)

URL design: `/search?q=tai+nghe+bluetooth&category=true-wireless&priceMin=200000&priceMax=1500000&city=HCM&rating=4&sort=price_asc&page=2`

## 2. Tham khảo

- `docs/CLAUDE.md` §2, §4, §5, §6, §7, §10, §11 — design system + token + a11y
- `.cursor/rules/component-pattern.mdc`
- `.cursor/rules/validation-forms.mdc`
- `.cursor/rules/i18n.mdc` — namespace mới `storefront.search.*` + `error.*`
- `.cursor/rules/stack-versions.mdc` — Next 16.3.8, searchParams là **async** (Next 16)
- `.cursor/rules/feature-migration.mdc` — template feature
- Code hiện có:
  - `src/components/storefront/ProductCard/ProductCard.tsx` (Modern Clean) — dùng lại 100%
  - `src/components/storefront/StorefrontHeader.tsx` — đã có search form, cần update `action` thành `/search?q=...`
  - `src/components/storefront/MobileBottomNav.tsx` — không cần đổi
  - `src/components/common/EmptyState.tsx`, `ErrorState.tsx` — dùng lại
  - `src/features/products/types.ts` — `RecommendedProduct` đã có các field cần
  - `src/lib/format.ts` — `formatVND`, `formatShortNumber`
  - `src/lib/constants.ts` — `ROUTES.SEARCH = "/search"` (đã có)
  - `src/lib/api.ts` (cần check) — `apiFetch`
  - `src/app/(storefront)/flash-sale/page.tsx` — pattern tham khảo cho page wrapper + content component

## 3. Subplan

### Subplan A — Types + mock data + hooks (`src/features/search/`)
> 1 subagent chạy tuần tự trong 1 dispatch.

**Files**:
- `src/features/search/types.ts` — `SearchFilters`, `SearchSort`, `SearchResult`, `SearchFacet`, `SearchMall`
- `src/features/search/mocks.ts` — 20 products (mirror Stitch), filters facet, 1 Mall (Sony)
- `src/features/search/api.ts` — `searchProducts({ q, filters, sort, page })` — gọi `apiFetch` khi BE ready
- `src/features/search/hooks.ts` — `useSearchProducts`, `productSearchKeys`
- `src/features/search/index.ts` — public API
- `src/features/search/mocks.test.ts` — verify mock data shape
- `src/features/search/hooks.test.tsx` — verify hook trả về data + loading/error states
- `src/features/search/schemas.ts` — Zod schema cho URL params (parse `q`, `priceMin`, etc.)
- `src/features/search/schemas.test.ts` — verify parse + validate

**Logic**:
- `SearchFilters` = `{ categories: string[]; cities: string[]; priceMin?: number; priceMax?: number; minRating?: number; services: string[] }`
- `SearchSort` = `'relevance' | 'newest' | 'best_selling' | 'price_asc' | 'price_desc'`
- `SearchResult` = `{ items: RecommendedProduct[]; total: number; page: number; pageSize: number; facets: SearchFacet; mall?: SearchMall }`
- `useSearchProducts` — TanStack Query, queryKey: `["search", { q, filters, sort, page }]`
- `api.ts` — khi `NEXT_PUBLIC_USE_MOCK=true` → return mock; ngược lại `apiFetch("/products/search", { query: { q, ... } })` (BE sẽ thêm sau)
- `schemas.ts` — `searchParamsSchema` parse từ URL `searchParams` object (Next 16 async API)

### Subplan B — Page + Content + Sub-components (`src/app/(storefront)/search/`)
> 1 subagent chạy tuần tự sau Subplan A.

**Files**:
- `src/app/(storefront)/search/page.tsx` — Server Component, parse `searchParams` (async), pass xuống Content
- `src/app/(storefront)/search/page.test.tsx` — render test + query string
- `src/components/storefront/search/SearchPageContent.tsx` — client composition chính
- `src/components/storefront/search/SearchBreadcrumb.tsx` — Trang chủ / Thiết bị điện tử / Tai nghe
- `src/components/storefront/search/SearchHeading.tsx` — "Kết quả cho '{q}'" + count + tab toggle (Có kết quả / Empty)
- `src/components/storefront/search/SearchMallBanner.tsx` — banner Sony Mall (3 mini cards)
- `src/components/storefront/search/SearchFilterSidebar.tsx` — left column (3 cols desktop)
  - Sub-components: `SubcategoryFilter`, `CityFilter`, `PriceRangeFilter`, `RatingFilter`, `ServiceFilter`, `ClearFiltersButton`
- `src/components/storefront/search/SearchSortBar.tsx` — sort buttons + mini pagination
- `src/components/storefront/search/SearchActiveFilterChips.tsx` — chip hiện tại
- `src/components/storefront/search/SearchProductGrid.tsx` — grid 4 cột, dùng `ProductCard`
- `src/components/storefront/search/SearchPagination.tsx` — pagination 1 2 3 ... 42
- `src/components/storefront/search/SearchEmptyState.tsx` — empty state với gợi ý từ khoá
- `src/components/storefront/search/SearchPageContent.test.tsx` — render test
- `src/components/storefront/search/SearchFilterSidebar.test.tsx` — interaction test
- `src/components/storefront/search/SearchEmptyState.test.tsx` — render + suggest click test

**Logic**:
- Page (server): nhận `searchParams` (async), build `filters` object, render `<SearchPageContent initialQ={q} initialFilters={...} />`
- Content (client): 4 trạng thái — `loading | error | empty | hasResults`
- Khi user thay đổi filter → update URL bằng `useRouter().push('/search?...')` + `router.refresh()` (giữ SSR friendly)
- ProductCard: dùng `ProductCardDiscount` (có % off) cho items có discount, `ProductCardDefault` cho items không discount
- Empty state: 4 suggested keywords click → fill input
- Filter state lưu URL (rule §7 — không tính toán client-side logic nghiệp vụ, chỉ là UI)

### Subplan C — i18n + MaterialSymbol icons + StorefrontHeader fix
> 1 subagent chạy song song với A/B hoặc sau — không conflict.

**Files**:
- `src/components/ui/material-symbol.tsx` — thêm icons: `tune`, `restart_alt`, `search_off`, `filter_alt_off`, `star`, `trending_up`, `close`
- `messages/vi.json` — thêm namespace `storefront.search` (~30 keys)
- `messages/en.json` — tương ứng tiếng Anh
- `src/components/storefront/StorefrontHeader.tsx` — sửa form `action` từ `MAINTENANCE(SEARCH_SUBMIT)` thành `/search` để submit q vào search page thật

**i18n keys** (mỗi key có cả vi + en):
- `search.title` "Tìm kiếm sản phẩm"
- `search.heading` "Kết quả cho '{q}'" (interpolation)
- `search.resultsCount` "({count} sản phẩm tìm thấy trên toàn sàn)"
- `search.tab.results` "Có kết quả ({count})"
- `search.tab.empty` "Không tìm thấy (Empty State)"
- `search.breadcrumb.home` "Trang chủ"
- `search.breadcrumb.electronics` "Thiết bị điện tử"
- `search.breadcrumb.headphones` "Tai nghe"
- `search.filter.title` "BỘ LỌC TÌM KIẾM"
- `search.filter.reset` "Thiết lập lại"
- `search.filter.subcategories` "Danh mục con"
- `search.filter.cities` "Nơi bán"
- `search.filter.priceRange` "Khoảng giá (₫)"
- `search.filter.applyPrice` "Áp dụng khoảng giá"
- `search.filter.rating` "Đánh giá sao"
- `search.filter.rating5` "5 sao tuyệt đối"
- `search.filter.rating4` "Từ 4 sao trở lên"
- `search.filter.rating3` "Từ 3 sao trở lên"
- `search.filter.services` "Dịch vụ & Khuyến mãi"
- `search.filter.service.flashSale` "Đang Flash Sale"
- `search.filter.service.voucher` "Voucher giảm giá"
- `search.filter.service.freeship` "Freeship Xtra"
- `search.filter.service.official` "Hàng chính hãng 100%"
- `search.filter.clearAll` "Xóa tất cả bộ lọc"
- `search.sort.label` "Sắp xếp theo:"
- `search.sort.relevance` "Liên quan"
- `search.sort.newest` "Mới nhất"
- `search.sort.bestSelling` "Bán chạy"
- `search.sort.priceAsc` "Giá: Thấp đến Cao"
- `search.sort.priceDesc` "Giá: Cao đến Thấp"
- `search.activeChips.label` "Đang lọc:"
- `search.activeChips.clearAll` "Xóa tất cả"
- `search.empty.title` "Không tìm thấy sản phẩm phù hợp"
- `search.empty.description` "Hãy thử kiểm tra lỗi chính tả..."
- `search.empty.clearFilters` "Xóa bộ lọc tìm kiếm"
- `search.empty.backHome` "Về trang chủ mua sắm"
- `search.empty.suggested` "Gợi ý từ khóa tìm kiếm phổ biến:"
- `search.mall.badge` "MALL"
- `search.mall.official` "Mall Chính Hãng"
- `search.mall.rating` "{rating} ({count} đánh giá)"
- `search.mall.responseRate` "Phản hồi: {rate}%"
- `search.mall.productCount` "Sản phẩm: {count}"
- `search.mall.viewShop` "Xem Shop"

## 4. Test Strategy

| File | Type | Verify |
|---|---|---|
| `mocks.test.ts` | Unit | mock data shape, 20 items, mall có 3 sub-products |
| `hooks.test.tsx` | Hook | `useSearchProducts` trả về items + total + facets; loading + error states |
| `schemas.test.ts` | Unit | parse `?q=tai+nghe&priceMin=100000&category=tw` đúng, reject invalid |
| `page.test.tsx` | Component | render heading với q đúng, breadcrumb, sort bar, grid |
| `SearchPageContent.test.tsx` | Component | 4 states (loading/error/empty/data), filter thay đổi → URL update |
| `SearchFilterSidebar.test.tsx` | Component | check/uncheck filter, click "Xóa tất cả", price range apply |
| `SearchEmptyState.test.tsx` | Component | render + click suggested keyword trigger callback |

## 5. Risks

- **R1 — URL filter state**: User thay đổi filter phải sync URL (Next 16 searchParams async). Nếu không đúng sẽ break share-link và browser back. → Dùng `useRouter().replace('/search?...')` + `router.refresh()`.
- **R2 — Mock data structure vs BE**: Mock phải mirror DTO BE sẽ trả. Hiện chưa có BE contract → ghi rõ `// TODO(api)` trong `api.ts`, BE sẽ map theo.
- **R3 — i18n key coverage**: Phải đủ key cả vi + en. Mỗi lần thêm key mới phải check cả 2 file. → Test riêng (không có trong scope này).
- **R4 — Stitch dùng Material Symbols trực tiếp**: Project dùng `MaterialSymbol` wrapper → cần thêm 7 icons mới (tune, restart_alt, search_off, filter_alt_off, star, trending_up, close).
- **R5 — StorefrontHeader form action**: Sửa `action={ROUTES.MAINTENANCE(SEARCH_SUBMIT)}` thành `action="/search"`. Đây là file đã merged vào dev, có test riêng → cần regression test.

## 6. Out of Scope (làm sau)

- Search **autocomplete dropdown** trên header input (Stitch chỉ show suggest dưới dạng kết quả trang).
- Search **trên mobile** có filter riêng (mobile bottom sheet) — Stitch chỉ có desktop view, mobile sẽ dùng filter button → bottom sheet (làm ở task riêng).
- **SEO meta** cho từng query — chỉ set title mặc định.
- **Phân trang server-side** thật — UI chỉ thay đổi `?page=N` trong URL, page=1 default.
- **Mall banner** chỉ hiển thị khi match brand từ query (vd "sony", "apple") — tạm thời luôn hiển thị Sony theo Stitch, BE sẽ dynamic sau.

## 7. Files Summary

**Mới tạo (15 files)**:
- 8 files feature: `src/features/search/{types,mocks,api,hooks,index,schemas}.{ts}` + 2 test
- 9 files components: `src/components/storefront/search/{SearchPageContent,SearchBreadcrumb,SearchHeading,SearchMallBanner,SearchFilterSidebar,SearchSortBar,SearchActiveFilterChips,SearchProductGrid,SearchPagination,SearchEmptyState}.tsx` + 3 test
- 2 files page: `src/app/(storefront)/search/{page.tsx,page.test.tsx}`

**Sửa (3 files)**:
- `src/components/ui/material-symbol.tsx` — thêm 7 icon names
- `src/components/storefront/StorefrontHeader.tsx` — form action → `/search`
- `messages/{vi,en}.json` — thêm namespace `storefront.search.*` (~30 keys)

## 8. Commits

Theo `git-workflow.mdc`:
1. `feat(search): add search feature data layer with mocks, schemas, hooks` (Subplan A)
2. `feat(search): wire SearchPage with 10 sub-components matching Stitch design` (Subplan B)
3. `feat(search): add i18n + MaterialSymbol icons + wire StorefrontHeader to /search` (Subplan C)

Mỗi commit đều list file test trong body.
