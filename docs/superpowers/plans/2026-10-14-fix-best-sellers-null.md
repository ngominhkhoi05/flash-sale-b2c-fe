# Plan: 2026-10-14 — Guard `products` null trong ProductBestSellers

## Scope

Bug lần 4 cùng pattern defensive guard:

```
TypeError: Cannot read properties of null (reading 'length')
  at ProductBestSellers (ProductBestSellers.tsx:51:17)
```

URL: `/products/dien-thoai-pro-10` (BE slug khác → shape khác).

## Cách fix

Cùng pattern `ProductRelatedStores`:
1. `products` prop: `RecommendedProduct[] | null | undefined`.
2. `asArray` helper file-local.
3. Render dùng `list` thay vì `products`.

## Test

Thêm 2 case vào `ProductBestSellers.test.tsx`:
- `products: undefined` → render không crash.
- `products: null` → render không crash, hiển thị empty state.
