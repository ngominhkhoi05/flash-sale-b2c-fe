# Plan: 2026-10-14 — Defensive guard cho `formatCount` trong ProductStoreCard

## Scope

Fix runtime crash tại `/products/tui-xach-mini-3`:
```
TypeError: Cannot read properties of undefined (reading 'toString')
  at formatCount (src/components/product-detail/ProductStoreCard.tsx:138:12)
  at ProductStoreCard (src/components/product-detail/ProductStoreCard.tsx:94:17)
  at ProductDetailRoute (src/app/(storefront)/products/[slug]/page.tsx:51:7)
```

## Tham khảo

- `docs/CLAUDE.md` mục 7: "Không tin dữ liệu phía client".
- `docs/CLAUDE.md` mục 11: "Không để số 'ma thuật'".
- `.cursor/rules/error-handling.mdc` mục 1: Validation error → hiện inline, không crash.

## Nguyên nhân

`GET /api/v1/products/slug/{slug}` (slug `tui-xach-mini-3`) trả về `storeProfile` nhưng
**field `ratingCount` bị thiếu** (undefined). Function `formatCount` (line 137–139 của
`ProductStoreCard.tsx`) gọi `n.toString()` không có guard:

```ts
function formatCount(n: number): string {
  if (n >= 1000) { ... }
  return n.toString();   // ← crash khi n = undefined
}
```

Khi BE thiếu field (common case với product mới, store cũ, hoặc partial response),
FE cần fallback an toàn thay vì throw page-level error.

## Subplan

Không chia — task nhỏ, 1 file logic + 1 file test.

## Cách fix

1. Đổi `formatCount` để nhận `number | undefined | null`:
   - `undefined` / `null` → trả về `"0"` (an toàn, không lộ chi tiết BE).
2. Tương tự guard ở `formatJoinedDuration` cho `joinedAt` nếu có thể null.
3. Không thay đổi type `StoreProfile` — vẫn giữ `ratingCount: number` trong contract.
   Component tự defensive (cross-check với BE là bước sau).

## Test strategy

- Test `formatCount` qua component render (đã có `ProductStoreCard.test.tsx`).
- Cập nhật test:
  - Pass `ratingCount: undefined` → render "0", không crash.
  - Pass `ratingCount: 42500` → render "42.5k" (existing case).
  - Pass `ratingCount: 0` → render "0".
  - Pass `ratingCount: 500` → render "500".

## Out of scope

- Không đụng `src/features/products/types.ts` (chỉnh type quá lớn, ảnh hưởng nhiều nơi).
- Không đụng `src/features/products/mock.ts` (mock đã đầy đủ — bug ở runtime BE response).
- Không sync với BE hôm nay (riêng).
