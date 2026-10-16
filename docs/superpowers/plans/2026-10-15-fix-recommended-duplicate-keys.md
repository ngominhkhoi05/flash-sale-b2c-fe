# Plan — Fix Duplicate React Keys in RecommendedSection

## Context

User báo console error khi mở trang chủ:

```text
Encountered two children with the same key, `195`. Keys should be unique
so that components maintain their identity across updates.
```

Stack frame:
- `_RecommendedSectionProductsMap` (artifact của Turbopack khi compile `.map`)
- `RecommendedSection` → `HomepageView` → `HomePage`

## Root cause analysis

File `src/components/storefront/sections/RecommendedSection.tsx` render products trong 1 `<div>` grid. Mỗi product map thành 1 `<Link key={product.id}>` — nhưng có 4 branch (`if/if/if/else`) chọn variant khác nhau cho cùng key. Mỗi product chỉ đi qua đúng 1 branch → không có duplicate key **trong code**.

Duplicate key `195` chỉ có thể xảy ra khi response API chứa 2 product cùng `id=195`. Backend Spring Boot `/api/v1/products/recommended` có thể trả duplicate khi product đó vừa nằm trong tab "forYou" lẫn "hotDeals" và React render cả 2 tab trong cùng 1 DOM trước khi React reconciliation xảy ra — hoặc đơn giản backend query trả duplicate rows.

Frontend phải **defensive**: dedupe trước khi render. Đây là convention dự án (xem `ProductBestSellers.tsx`, `ProductRelatedStores.tsx` cũng dùng `key={product.id}` — chưa fix lần này, scope giới hạn ở RecommendedSection theo error report).

## Scope

| File | Loại | Lý do |
|---|---|---|
| `src/components/storefront/sections/RecommendedSection.tsx` | SỬA | Dedupe `products` list trước khi render, dùng `${activeTab}-${product.id}` làm key để tránh clash khi switch tab |
| `src/components/storefront/sections/RecommendedSection.test.tsx` | SỬA | Thêm reproduction test: 2 product cùng id trong `forYou` → không còn duplicate-key warning, vẫn render đúng 1 card |

## Files KHÔNG sửa (out of scope)

- `ProductBestSellers.tsx`, `ProductRelatedStores.tsx` — cùng pattern nhưng user chỉ báo RecommendedSection. Sẽ đề xuất fix follow-up.
- `src/features/homepage/api.ts` — không thay đổi API contract. Backend fix duplicate là việc riêng.
- `src/features/homepage/hooks.ts` — không liên quan.

## Tham khảo

- `docs/CLAUDE.md` mục 7 (Error handling) + mục 5 (component reuse).
- `.cursor/rules/error-handling.mdc` — frontend phải defensive khi data không đảm bảo unique.
- `.cursor/rules/testing-required.mdc` — bugfix BẮT BUỘC có reproduction test.

## Test strategy

| Test | Type | Expected |
|---|---|---|
| Reproduction: `forYou` chứa 2 product cùng id=195 | NEW unit | Render 1 card duy nhất (dedupe), không có warning trong console spy |
| Existing 8 tests | Giữ nguyên | PASS |

## Implementation outline

1. Trong `RecommendedSection.tsx`:
   - Thêm `uniqueProducts = useMemo(() => dedupe by id, [products])`.
   - Đổi tất cả `key={product.id}` → `key={`${activeTab}-${product.id}`}` (an toàn khi switch tab).
   - Đảm bảo cả 4 branch render đều dùng key mới.
2. Trong test:
   - Thêm test "renders unique cards when API returns duplicate ids" — spy `console.error` để verify không có warning.
   - Thêm test "preserves order after dedupe".

## Pre-commit verification

- [ ] `npm run test -- RecommendedSection` → 10+ tests PASS (gồm 2 mới)
- [ ] `npm run lint` → PASS
- [ ] `npm run tsc --noEmit` → PASS
- [ ] Manual smoke: mở `http://localhost:3000/` → không còn warning duplicate key

## Risks

- **Risk thấp**: Thay đổi local trong 1 file, không động logic API.
- **Risk**: Đổi key từ `product.id` → `${activeTab}-${product.id}` có thể làm React remount card khi switch tab (mất internal state). Acceptable vì ProductCard không có internal state quan trọng.