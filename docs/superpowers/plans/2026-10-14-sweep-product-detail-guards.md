# Plan: 2026-10-14 — Sweep defensive guards cho toàn bộ ProductDetail components

## Context

Đã fix 4 lỗi lẻ (`formatCount`, `descriptionRich`, `related products`, `best sellers`).
Cùng root cause: BE trả ProductDetail với field optional mà FE component giả định strict.
Sweep này fix dứt điểm 9 component còn lại để dứt whack-a-mole.

## Scope

9 component cần audit + fix defensive:

| # | File | Chỗ rủi ro | Status |
|---|---|---|---|
| 1 | `ProductHeaderInfo.tsx` | `n.toString()` line 127, `k.toFixed(1)` line 123 (sold count) | CẦN FIX |
| 2 | `ProductReviewsCard.tsx` | `review.mediaUrls.length` line 103, `ratingAvg.toFixed(1)` line 178 | CẦN FIX |
| 3 | `ProductVariantSelectors.tsx` | `colors.map` line 45, `sizes.map` line 76 | CẦN FIX |
| 4 | `ProductCommitments.tsx` | `badges.length/map` line 59, 68 | CẦN FIX |
| 5 | `ProductVouchers.tsx` | `vouchers.length/map` line 29, 52 (đã có guard `!vouchers`, kiểm tra) | CẦN KIỂM |
| 6 | `ProductGallery.tsx` | `images.map` line 81 | CẦN FIX |
| 7 | `ProductSpecsTable.tsx` | `rows.map` line 54 | CẦN FIX |
| 8 | `ProductBestSellers.tsx` line 86 | `product.rating.toFixed(1)` (chỉ render khi `rating !== undefined`, OK) | OK |
| 9 | `ProductDetailPage.tsx` | `tier.options.map` line 64, 84 (defensive ở helper, OK) | OK |

## Cách fix chung

1. Mở rộng prop type thành `T | T[] | null | undefined` (hoặc riêng null/undefined).
2. Thêm file-local helper `asArray<T>(input: T[] | null | undefined): T[]`.
3. Render dùng `list` thay vì `prop trực tiếp`.
4. Với function `formatCount` / `formatSold` → nhận `number | null | undefined`, fallback an toàn.

## Test strategy

- Mỗi component thêm 1-2 test case (null / undefined cho prop array).
- Mỗi format helper thêm test (undefined → fallback "0").
- Giữ nguyên test cũ (regression).

## Out of scope

- Không đổi `ProductDetail` type trong `types.ts` (giữ strict).
- Không refactor sang shared helper toàn cục (tránh over-engineering).
- Không sync BE contract (riêng).
