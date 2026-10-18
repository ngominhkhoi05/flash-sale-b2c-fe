# Plan: 2026-10-18 — ProductDescriptionCard defensive guard cho BE `sizeChart` runtime shape

## Context (Bước 0 — user đã duyệt)

User báo bug trên `/products/giay-the-thao-standard-7`:

```
TypeError: Cannot read properties of undefined (reading 'width_cm')
  at ProductDescriptionCard
```

Sau khi audit root cause từ FE ↔ BE:

| Layer | Phát hiện |
|---|---|
| BE `ProductDetailResponse.java` | `sizeChart` khai báo `Object`, default `new ArrayList<>()` |
| BE seed `script_python/generate_all_seeds.py:757-792` | 70% sản phẩm có size chart, **50% apparel** (`{S,M,L,XL}` + `chest_cm/length_cm`) / **50% non-apparel** (`{standard,large}` + `width_cm/height_cm`); 30% trả `""` |
| BE `ProductServiceImpl.java:804` | `safeSizeChart = product.getSizeChart() != null ? product.getSizeChart() : List.of()` → truyền nguyên xi `Object` xuống response |
| FE `ProductDescriptionCard.tsx:131` | Render guard `if (sizeChart && ...)` — pass khi `sizeChart` truthy (`{S,M,L,XL}` truthy) |
| FE `ProductDescriptionCard.tsx:156-170` | Truy cập `sizeChart.standard.width_cm` + `sizeChart.large.width_cm` không defensive |

**Slug user test**: `giay-the-thao-standard-7` (giày) → apparel branch ở BE → FE crash.

**User chọn**: **Phương án C — Quick fix FE defensive** (~10 phút, không đụng BE).

## Approach

Sửa `ProductDescriptionCard.tsx` render guard để cover mọi BE runtime shape của `sizeChart`:

| BE runtime value | Behavior mong muốn |
|---|---|
| `null` / `undefined` | Skip table (đã OK) |
| `""` (empty string từ BE) | Skip table (đã OK — falsy) |
| `[]` (empty ArrayList default) | Skip table (MỚI — fail hiện tại) |
| `{S,M,L,XL}` (apparel) | Skip table (MỚI — fail hiện tại) |
| `{standard, large}` (non-apparel) | Render table (giữ nguyên) |

Guard mới: `typeof sizeChart === 'object' && !Array.isArray(sizeChart) && 'standard' in sizeChart && typeof sizeChart.standard.width_cm === 'number'`.

## Scope

### Files sẽ sửa

- `src/components/product-detail/ProductDescriptionCard.tsx` — render guard size chart section (~5 dòng thay đổi).
- `src/components/product-detail/ProductDescriptionCard.test.tsx` — thêm 3-4 test case mới (defensive cho apparel shape, empty string, empty array, partial standard/large).

### Files KHÔNG sửa

- `src/features/products/types.ts` — `SizeChartDto` giữ nguyên vì user chọn A-C, không migrate BE shape.
- `src/features/products/mock.ts` — mock vẫn đúng (non-apparel shape).
- BE (file trong `flash-sale-b2c-UTC2/`) — không thuộc scope task này; nếu cần, file ticket BE riêng.

## Subplan

### Subplan A — `ProductDescriptionCard.tsx` defensive + tests (LOGIC, cần test)

Độc lập, không cần output từ subplan khác. Gồm 3 task:

1. **RED — viết test đỏ trước**: thêm test `it('does NOT crash when sizeChart has apparel shape {S,M,L,XL} (no standard/large)')`, `it('does NOT crash when sizeChart is empty string "" (BE nullable)')`, `it('does NOT crash when sizeChart is empty array [] (BE default)')`, `it('does NOT render the size chart table when sizeChart is partial (has only standard, no large)')`.

2. **GREEN — sửa render guard**: đổi `{sizeChart && ( ... )}` thành guard đủ thoáng: `typeof === 'object' && !Array.isArray && standard?.width_cm typeof number`.

3. **Refactor + verify**: chạy full test file, verify 4 test mới pass + 12 test cũ pass.

## Test strategy

```bash
# Trước commit (Bước 6 audit):
npx vitest run src/components/product-detail/ProductDescriptionCard.test.tsx
# Expect: all 16 tests PASS (12 existing + 4 new)
```

| Test case | Expect |
|---|---|
| `it('does NOT crash when sizeChart has apparel shape {S,M,L,XL}', ...)` | `not.toThrow()` + query `getByTestId('size-chart')` returns `null` |
| `it('does NOT crash when sizeChart is empty string ""', ...)` | `not.toThrow()` + size chart not rendered |
| `it('does NOT crash when sizeChart is empty array []', ...)` | `not.toThrow()` + size chart not rendered |
| `it('does NOT render size chart when only standard row present (no large)', ...)` | `not.toThrow()` + size chart not rendered (guard fails) |

## Risk

| Rủi ro | Cách giảm |
|---|---|
| Guard mới có thể lọc nhầm row `large` hợp lệ | Test render `large: { width_cm: 56, height_cm: 75 }` alone → vẫn render (guard chỉ check `standard.width_cm` thay vì check cả `large`) |
| `Array.isArray` polyfill edge case SSR | `@types/node` đã có, an toàn |
| Quên 1 BE shape khác (vd `null` JSON token) | Thêm test cho `null` đã có sẵn ở file test (line 188-200) |

## Khi nào xong

- [ ] All 16 test cases in `ProductDescriptionCard.test.tsx` PASS
- [ ] `npm run lint` PASS (no new warning)
- [ ] `npm run tsc --noEmit` PASS (no new error)
- [ ] Auto-commit với message EN + Conventional Commits
- [ ] KHÔNG push (chờ user duyệt)

## Out of scope

- Sửa BE shape (cần ticket riêng nếu user muốn chuẩn hóa `{large, standard}` global)
- Migrate `SizeChartDto` type thành `unknown` (giữ type strict, FE defensive ở render layer)
- Render bảng size cho apparel shape `S/M/L/XL` (chỉ làm khi có yêu cầu thật — `no-overengineering.mdc`)
