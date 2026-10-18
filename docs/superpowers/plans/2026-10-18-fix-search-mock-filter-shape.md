# Plan — Fix TS errors ở `searchProductsMock` (thiếu field trong type)

> **Date**: 2026-10-18
> **Branch**: `fix/search-fe-product-card-shape` (đã có sẵn từ session trước, base = `dev`)
> **Scope**: Fix 7 TypeScript errors ở `src/features/search/api.ts` + cài deps thiếu.
> **Triggers**: Background task 85675 (tsc check) failed sau khi cài `recharts` + `uuid` + `@types/uuid`.

## 1. Background

Sau khi chạy background task `npx tsc --noEmit` (task 85675), phát hiện:

1. **5 module errors** gốc — đã fix bằng `npm install recharts@^3.10.1 uuid@^14.0.3 @types/uuid@^10.0.0` (xem `terminals/85679.txt`).
2. **7 type errors mới** lộ ra ở `src/features/search/api.ts` — code dùng field không tồn tại trong `RecommendedProductResponse`:
   - L108, L111: `it.voucherLabel` (BE chưa trả field này)
   - L116, L119: `it.price` (BE trả `minPrice`/`maxPrice`, không có field `price`)
   - L124: `it.rating` (BE chưa trả rating — xác nhận trong comment `map-to-product-card.ts` L28)
   - L128: `sortItems` generic conflict vì `RecommendedProductResponse` thiếu `price`

## 2. Tham khảo

- `.cursor/rules/testing-required.mdc` — TDD BẮT BUỘC, test phải FAIL trên code cũ trước.
- `.cursor/rules/workflow-process.mdc` — 6 bước + 5 check parallel work.
- `src/features/products/map-to-product-card.ts` L28: comment xác nhận "BE chưa trả rating".
- `docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md` — Subplan A (đã merge) có `mocks.ts` với 20 items KHÔNG có `price`/`rating`/`voucherLabel`.
- Test coverage hiện tại: `mocks.test.ts` chỉ verify required fields (id, name, imageUrl, storeName, minPrice, maxPrice, totalStock) — không cover `price`/`rating`/`voucherLabel` → đó là lý do bug không bị phát hiện.

## 3. Quyết định thiết kế

Em chọn **phương án A: Bỏ filter dùng field chưa có BE** (vs phương án B: thêm optional field vào type).

| Phương án | Ưu | Nhược |
|---|---|---|
| **A. Bỏ filter `voucherLabel`/`rating`/`price` trong `searchProductsMock`** (CHỌN) | Đúng với BE contract; không bịa field; test pass ngay | Mất 1 số filter ở mock (mock sẽ chỉ filter theo price range + service) |
| B. Thêm optional field `voucherLabel?: string \| null`, `rating?: number`, `price?: number` vào `RecommendedProductResponse` | Giữ code filter | Bịa field BE chưa trả → vỡ type khi BE ready; tạo dead code |

**Lý do chọn A**:
- BE search endpoint (`GET /api/v1/products/search`) trả cùng shape `RecommendedProductResponse` (xem `map-to-product-card.ts` L8-19 + `api.ts` L78-87).
- Service filter ("freeship", "voucher") đã được encode trong field `label` (xem `SearchProductGrid.tsx` L78-87), không cần `voucherLabel` riêng.
- Rating filter: chờ BE bổ sung field `rating` trong `RecommendedProductResponse` → ticket riêng.
- Price filter (range): dùng `minPrice` (giá bán hiện tại) thay cho `price`.

## 4. Subplan

### Subplan A — Fix `searchProductsMock` filter + bổ sung test (1 subagent, tuần tự)

**Files thay đổi**:
- `src/features/search/api.ts` — sửa `searchProductsMock` (L100-145) bỏ filter `voucherLabel` + `rating`, đổi `it.price` → `it.minPrice`, sửa `sortItems` generic.
- `src/features/search/api.test.ts` — thêm test cho các filter bị ảnh hưởng (service `freeship`, `voucher` qua `label`, price range, sort).

**Test RED (phải viết TRƯỚC)**:
1. `searchProductsMock` với `filters.services: ["freeship"]` → chỉ return items có `label === "freeship"`.
2. `searchProductsMock` với `filters.services: ["voucher"]` → chỉ return items có `label === "voucher"`.
3. `searchProductsMock` với `filters.priceMin: 1000000` → chỉ return items có `minPrice >= 1000000`.
4. `searchProductsMock` với `filters.priceMax: 1000000` → chỉ return items có `minPrice <= 1000000`.
5. `sortItems` sort by `price_asc` → items sorted by `minPrice` asc.

**Test GREEN**: sửa code để pass.

**Out of scope (làm sau khi BE ready)**:
- Filter theo `minRating` — chờ BE bổ sung `rating` field.
- Filter theo `voucherLabel` text — chờ BE bổ sung field.

## 5. Test Strategy

| File test | Mới/Sửa | Verify |
|---|---|---|
| `src/features/search/api.test.ts` | Sửa + thêm | (a) `searchProductsMock` lọc đúng theo `label` (service filter), (b) `minPrice` filter, (c) sort `price_asc` theo `minPrice`, (d) regression: query string test cũ vẫn pass |

**Lệnh verify**:
```bash
npx tsc --noEmit                                  # phải 0 errors
npx vitest run src/features/search/api.test.ts    # tất cả pass
npx vitest run src/features/search                # toàn bộ feature pass
```

## 6. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | `mocks.test.ts` đang pass nhưng vẫn có thể stale (không check field mới) | Sau khi fix, chạy lại toàn bộ `vitest run src/features/search` |
| R2 | Plan `2026-10-18-search-endpoint-be-wire-fe.md` được reference nhưng file chưa tồn tại | Ghi `// TODO(plan)` trong code hoặc bỏ comment nếu thừa |
| R3 | Có 2 subagent/chat cùng session có thể đụng `api.ts` | Đã check worktree list — chỉ có 1 worktree `fix/search-fe-product-card-shape` |

## 7. Files Summary

**Sửa (2 files)**:
- `src/features/search/api.ts` — fix 7 TS errors + logic filter
- `src/features/search/api.test.ts` — thêm test cho service/price/sort filter

**Không động đến**:
- `src/features/search/mocks.ts` — giữ nguyên 20 items
- `src/features/search/types.ts` — không thêm field bịa
- `src/features/homepage/api.ts` — không thêm field bịa vào `RecommendedProductResponse`

## 8. Commits (theo git-workflow.mdc)

1. `chore(deps): install missing recharts, uuid, @types/uuid` — commit `package.json` + `package-lock.json` (commit TRƯỚC, tách concern).
2. `fix(search): align searchProductsMock filter with BE RecommendedProductResponse shape` — commit code + test (Subplan A).

Mỗi commit list file test trong body.

## 9. Auto-commit Policy

Sau khi fix xong + test pass + tsc clean, em sẽ **auto-commit** (theo `git-workflow.mdc`) rồi báo cáo. KHÔNG push (chờ user duyệt).

## 10. Out of Scope

- Thêm field `rating` / `voucherLabel` / `price` vào `RecommendedProductResponse` (chờ BE bổ sung).
- BE search endpoint thật (`/api/v1/products/search`) — đã có wire nhưng chưa tích hợp ở test (cần MSW handler riêng).
- Auto-fix các file `TrafficChart.tsx` còn lỗi `implicit any` (chưa verify, làm sau).
