# Plan: 2026-10-14 — Guard `products` null trong ProductRelatedStores

## Scope

Bug lần 3 cùng pattern defensive guard (sau `formatCount`, `descriptionRich`):

```
TypeError: Cannot read properties of null (reading 'length')
  at ProductRelatedStores (ProductRelatedStores.tsx:47:23)
```

## Tham khảo

- Plan cũ: `2026-10-14-fix-formatcount-undefined.md`, `2026-10-14-fix-description-rich-undefined.md`
- Cùng pattern: FE type strict + component defensive.

## Cách fix

1. `products` prop type: `RecommendedProduct[] | null | undefined`.
2. `asArray(products)` để normalize về `[]` khi null/undefined.
3. Render: nếu rỗng → empty state (đã có sẵn, chỉ cần đảm bảo length 0 thay vì crash).

## Test

Thêm 3 case vào `ProductRelatedStores.test.tsx`:
- `products: undefined` → render không crash.
- `products: null` → render không crash, hiển thị empty state.
- `products: []` (đã có ở test cũ) → regression.

## Out of scope

- Không đổi `ProductDetail` type trong `types.ts` (giữ strict).
- KHÔNG thêm helper chung `asArray` toàn cục (chỉ file-local) — tránh over-engineering.
