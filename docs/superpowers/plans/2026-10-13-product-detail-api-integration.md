# Plan: Product Detail API Integration

> Branch: `feat/cart-page-ui` (tiếp tục)
> Date: 2026-10-13

## Problem Statement

- URL `/products/[slug]` dùng slug (string) cho SEO
- API `GET /api/v1/products/{id}` nhận `id` (number)
- Backend **không track slugs** — `ProductDetailResponse` schema không có slug field

## Approach

**Slug → ID mapping**: Duy trì local cache mapping slug ↔ productId. Cache được populate từ:
1. Product list API (`GET /api/v1/products`) 
2. Product detail API response (`id` field)

Khi user truy cập `/products/ao-thun-unisex-cotton-utc-basic`:
1. Check slug → ID cache
2. Nếu cache miss → fetch product list → update cache
3. Dùng ID để fetch product detail

## API Contract

```
GET /api/v1/products?filter={...}&pageable={...}
→ 200: ApiResponsePageResponseProductSummaryResponse
{
  content: ProductSummaryResponse[],
  totalPages, totalElements, size, number
}

GET /api/v1/products/{id}
→ 200: ApiResponseProductDetailResponse (ProductDetailResponse)
```

### ProductDetailResponse fields (từ OpenAPI)
```json
{
  "id": "int64",
  "storeId": "int64",
  "storeName": "string",
  "categoryId": "int32",
  "categoryName": "string",
  "name": "string",
  "imageUrl": "string",
  "description": "string",
  "tierVariationConfigs": "TierVariationConfigDto[]",
  "status": "string",
  "createdAt": "date-time",
  "variants": "ProductVariantResponse[]",
  "ratingAvg": "double",
  "ratingCount": "int32",
  "soldCount": "int32",
  "minPrice": "number",
  "maxPrice": "number",
  "discountPercent": "int32",
  "images": "ProductImageDto[]",
  "flashSales": "ActiveFlashSaleDto[]"
}
```

### ProductVariantResponse
```json
{
  "id": "int64",
  "productId": "int64",
  "sku": "string",
  "variantName": "string",
  "attributes": "Record<string,string>",
  "originalPrice": "number",
  "stockQuantity": "int32",
  "imageUrl": "string",
  "status": "string",
  "version": "int64",
  "createdAt": "date-time"
}
```

## Subplan

### Subplan 1: Refactor types + API layer
- Thêm `ProductListParams`, `ProductListResponse` types
- Thêm `getProductDetail(id)` API function
- Thêm `getProducts(params)` API function (public products list)
- Keep existing mock types for fields BE doesn't have yet (relatedSameStore, relatedBestSellers, storeProfile, vouchers, etc.)

### Subplan 2: Create slug→ID cache + hooks
- Tạo `slugIdMap` store (Zustand hoặc module-level Map)
- `useProductIdFromSlug(slug)` — lookup ID từ slug (fetch list nếu cần)
- Refactor `useProductDetail` để nhận `id` thay vì `slug`
- `useProducts(params)` — product list query

### Subplan 3: Update page.tsx + ProductDetailPage
- Page nhận `slug` → lookup ID → fetch detail
- Fallback: nếu slug không match, hiển thị 404
- Thêm loading/error states
- Update ProductDetailPage props để dùng API types

### Subplan 4: Write tests
- `hooks.test.tsx`: update tests cho `useProductDetail(id)` thay vì `useProductDetail(slug)`
- Test slug→ID lookup flow
- Test product list fetch

## Files

| File | Action | Mô tả |
|------|--------|--------|
| `src/features/products/types.ts` | Edit | Thêm API response types |
| `src/features/products/api.ts` | Edit | Thêm getProductDetail, getProducts |
| `src/features/products/hooks.ts` | Edit | useProductIdFromSlug, useProductDetail(id), useProducts |
| `src/features/products/index.ts` | Edit | Export mới |
| `src/features/products/hooks.test.tsx` | Edit | Update tests |
| `src/app/(storefront)/products/[slug]/page.tsx` | Edit | Lookup ID → fetch detail |

## Notes

- Backend không có: `relatedSameStore`, `relatedBestSellers`, `storeProfile`, `vouchers`, `specs`, `features`, `commitments` → giữ mock data cho những field này
- Backend có: `ratingAvg`, `ratingCount`, `soldCount`, `images`, `variants`, `flashSales` → dùng API data
- `slug` → `id` mapping cần persist (dùng module-level Map với SSR-safe initialization)
