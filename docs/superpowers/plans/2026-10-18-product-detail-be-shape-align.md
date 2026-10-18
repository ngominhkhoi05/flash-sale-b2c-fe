# Plan: 2026-10-18 — Adapt FE types/components to BE ProductDetailResponse

## Context (Bước 0 — user đã duyệt)

User audit mapping API chi tiết sản phẩm (`GET /api/v1/products/{id}` +
`GET /api/v1/products/slug/{slug}` ↔ `src/features/products/types.ts` + 16
component trong `src/components/product-detail/`).

User chọn:
- **Approach**: Adapt FE → BE (types + components theo BE runtime shape).
- **Scope**: All-listed (11 field bao gồm minor).

**Source BE thật**: `http://180.93.137.28/v3/api-docs` schema
`ProductDetailResponse` + sample runtime `GET /api/v1/products/3` (slug
`tui-xach-mini-3` — đã verify field shape runtime).

## Findings — 11 field mismatch cần sửa

### 🔴 CRITICAL — mismatch SHAPE (cần viết lại component hoặc normalize)

| # | Field | BE runtime shape | FE hiện tại | Hướng sửa |
|---|---|---|---|---|
| 1 | `descriptionRich` | object `{intro, highlights[], paragraphs[]}` | `string[]` (HTML) | (a) Đổi type FE → `DescriptionRichDto`; (b) Rewrite `ProductDescriptionCard` để render 3 section (intro/highlights/paragraphs) thay vì `dangerouslySetInnerHTML` |
| 2 | `specs` | object `{origin, weight, material, warranty}` | `ProductSpecs` (6 field: category/material/origin/style/sku/careInstructions) | (a) Đổi type FE → `ProductSpecsDto`; (b) Rewrite `ProductSpecsTable` để render 4 row BE có |
| 3 | `features` | `string[]` | `ProductFeature[]` (object với icon) | (a) Đổi type FE → `string[]`; (b) Rewrite `ProductDescriptionCard` feature section: render text-only thay vì icon+title+desc |
| 4 | `sizeChart` | object `{large: {width_cm, height_cm}, standard: {width_cm, height_cm}}` | `SizeChartRow[]` | (a) Đổi type FE → `SizeChartDto`; (b) Rewrite size chart section trong `ProductDescriptionCard` |
| 5 | `flashSales` | array `ActiveFlashSaleDto[]` (slotStartTime/EndTime/itemId/variantId/originalPrice/flashSalePrice/stockAvailable) | `flashSale: FlashSaleInfo \| null` (object singular) | (a) Đổi type FE → `flashSales: ActiveFlashSale[]` (BE schema); (b) Update `ProductDetailPage` để pick phần tử đầu (active) hoặc null; (c) FE có thêm `soldStock`/`maxQtyPerUser`/`discountPercent` mà BE không trả → compute từ `totalStock` + variant stock, hoặc để null + ẩn flash UI |

### 🟡 MEDIUM — type widening (nullable + rename)

| # | Field | BE runtime | FE hiện tại | Hướng sửa |
|---|---|---|---|---|
| 6 | `minPrice` | `number \| null` | `number` | Đổi FE → `number \| null`; update `ProductPricingBox` defensive (đã có `?? 0`) |
| 7 | `maxPrice` | `number \| null` | `number` | Đổi FE → `number \| null`; update `ProductPricingBox` defensive |
| 8 | `storeProfile.joinedAt` | (BE không có) | `string` (FE thêm) | Xoá `joinedAt` khỏi `StoreProfile`; update `ProductStoreCard` nếu dùng |
| 9 | `relatedSameStore` / `relatedBestSellers` | `ProductSummaryResponse[]` (BE int64 `id`, `minPrice`/`maxPrice`, KHÔNG có `price`/`totalSold`/`rating`/`imageAlt`/`href`) | `RecommendedProduct[]` (string `id`, có `price`/`totalSold`/`rating`/`imageAlt`/`href`) | (a) **Tạo type mới `RelatedProductSummary`** (mirror `ProductSummaryResponse`), (b) đổi `ProductDetail.relatedSameStore`/`relatedBestSellers` từ `RecommendedProduct[]` → `RelatedProductSummary[]`, (c) **KHÔNG sửa `RecommendedProduct`** (vẫn dùng cho homepage/search/sections), (d) update `ProductRelatedStores`/`ProductBestSellers` theo shape mới |

### 🟢 MINOR — bổ sung hoặc dùng field mới

| # | Field | Hướng sửa |
|---|---|---|
| 10 | `slug` | FE đã có `slug: string` → dùng `product.slug` (BE trả) thay vì `slugifyAscii(name)` trong `ProductBreadcrumb.tsx` (chỗ tạo category slug). **Product detail page đã dùng param slug, không cần sửa routing.** |
| 11 | `ratingDistribution` | BE trả `{stars5..stars1}` — có thể bổ sung cho `ProductReviewsCard` (optional). **Defer — không nằm trong UI hiện tại.** |

## Scope

### Files sẽ sửa

**Type definitions** (1 file):
- `src/features/products/types.ts` — rewrite `ProductDetail`, thêm `DescriptionRichDto`, `ProductSpecsDto`, `SizeChartDto`, `ActiveFlashSaleDto`, đổi `RecommendedProduct` shape, xoá `StoreProfile.joinedAt`, đổi `ProductDetail.reviews` (BE tách endpoint riêng `/products/{id}/reviews` — defer).

**Components** (8 files):
- `src/components/product-detail/ProductDescriptionCard.tsx` — render 3 section (intro/highlights/paragraphs) thay vì `dangerouslySetInnerHTML`; features thành text list; size chart thành 2-row table (large/standard)
- `src/components/product-detail/ProductSpecsTable.tsx` — 4 row thay vì 6
- `src/components/product-detail/ProductDetailPage.tsx` — pick `flashSales[0]` thay vì `flashSale`; clamp `minPrice`/`maxPrice` null
- `src/components/product-detail/ProductPricingBox.tsx` (đọc qua ProductDetailPage) — defensive null
- `src/components/product-detail/ProductStoreCard.tsx` — bỏ `joinedAt`
- `src/components/product-detail/ProductRelatedStores.tsx` — đổi shape (`id: number`, không có `price`/`totalSold`/`rating`)
- `src/components/product-detail/ProductBestSellers.tsx` — tương tự
- `src/components/product-detail/ProductBreadcrumb.tsx` — dùng `product.slug` cho routing (chỗ nào liên quan)

**Mock data** (1 file):
- `src/features/products/mock.ts` — rewrite `mockProductDetail` theo BE shape (`descriptionRich` object, `specs` 4 field, `features` string[], `sizeChart` object, `flashSales` array). **Mục tiêu: mock có thể thay thế bằng API thật 1:1 không cần đổi UI.**

**Tests** (4 file test liên quan phải update + 1 mới):
- `src/features/products/mock.test.ts` — update assertion (số ảnh giữ 1, specs 4 row, features 5 string, sizeChart object, flashSales array)
- `src/components/product-detail/ProductDescriptionCard.test.tsx` — rewrite test theo 3-section render
- `src/components/product-detail/ProductSpecsTable.test.tsx` — 4 row thay vì 6
- `src/components/product-detail/ProductRelatedStores.test.tsx` — id number, không có price/totalSold
- `src/components/product-detail/ProductBestSellers.test.tsx` — tương tự
- `src/components/product-detail/ProductDetailPage.test.tsx` — flash sale pick đầu tiên, min/max null

### Files KHÔNG sửa (out of scope)

- `src/features/products/api.ts` — endpoint đã đúng
- `src/features/products/hooks.ts` — query key + useQuery đã đúng
- `src/features/products/index.ts` — chỉ re-export types
- `src/lib/api/client.ts` — không liên quan
- BE side — không sửa backend

## Subplan

### Subplan A — Type definitions + index (LOGIC, cần test)

- `src/features/products/types.ts`: rewrite ProductDetail + helper types
- Tác động: tất cả import từ `@/features/products` về types — TS compile check sẽ liệt kê vi phạm.

### Subplan B — Component rewrite (LOGIC + UI, cần test)

- `ProductDescriptionCard.tsx` + test
- `ProductSpecsTable.tsx` + test
- `ProductStoreCard.tsx` (xoá joinedAt)
- `ProductRelatedStores.tsx` + test
- `ProductBestSellers.tsx` + test
- `ProductDetailPage.tsx` + test (flash sale pick, null defensive)

### Subplan C — Mock data realign (LOGIC, cần test)

- `src/features/products/mock.ts` — rewrite theo BE shape
- `src/features/products/mock.test.ts` — update assertion

## Test strategy

- **Unit test**: `mock.test.ts` verify shape mới (descriptionRich object, specs 4 field, features 5 string, sizeChart object, flashSales array)
- **Component test**: từng component phải render đúng với BE shape + defensive khi thiếu field
- **Integration test**: `ProductDetailPage.test.tsx` verify render end-to-end với mock mới
- **TS compile**: `npx tsc --noEmit` exit 0 (sau khi sửa types)
- **Lint**: `npm run lint` pass
- **Manual smoke**: chạy dev server, mở `/products/ao-thun-unisex-cotton-utc-basic` (slug mock) — nếu BE không có slug này thì dùng `tui-xach-mini-3` (slug thật từ sample)

## Reference docs

- `src/features/products/types.ts` — current FE types
- `src/features/products/mock.ts` — current mock (mirror BE cũ)
- `src/components/product-detail/*.tsx` — 16 components + 16 tests
- Backend OpenAPI: `http://180.93.137.28/v3/api-docs` (ProductDetailResponse)
- Backend sample: `GET http://180.93.137.28/api/v1/products/3` (id=3)
- Plan cũ: `docs/superpowers/plans/2026-10-13-product-detail-api-integration.md`
- Plan cũ: `docs/superpowers/plans/2026-10-14-product-detail-api.md`

## Rủi ro

- **High**: `RecommendedProduct` được import ở **nhiều file ngoài scope** (`src/features/homepage/`, `src/features/search/`, `src/components/storefront/sections/RecommendedSection.tsx`, `HeroBannerSection.tsx`, `FeaturedStoresSection.tsx`). Nếu đổi shape → break các file đó.
- **Mitigation**: **Tạo type mới** `RelatedProductSummary` (mirror `ProductSummaryResponse` BE) dùng riêng cho `ProductDetail.relatedSameStore`/`relatedBestSellers`. **KHÔNG sửa `RecommendedProduct` interface.** Scope chỉ thay đổi field type của `ProductDetail.relatedSameStore`/`relatedBestSellers` từ `RecommendedProduct[]` → `RelatedProductSummary[]`.
- **High**: `ProductRelatedStores`/`ProductBestSellers` component hiện dùng `product.price`/`product.totalSold`/`product.rating` — phải rewrite render theo field mới (`minPrice`/`maxPrice` + không có sold/rating).
- **Medium**: Mock rewrite có thể làm unit test khác fail (vd `src/components/product-detail/ProductDetailPage.test.tsx` dùng `mockProductDetail`).
- **Low**: BE trả `minPrice: null`/`maxPrice: null` → UI hiển thị "Liên hệ" hoặc empty state — cần defensive component.

## Out of scope

- BE changes (không sửa backend)
- Thay đổi routing (`/products/[slug]` vẫn dùng slug SEO)
- Endpoint `/products/{id}/reviews` (BE tách riêng, defer — hiện dùng `product.reviews` từ ProductDetailResponse, sẽ empty khi gọi API thật)
- `ProductReviewsCard` tích hợp endpoint reviews riêng
- `ratingDistribution` UI (minor)