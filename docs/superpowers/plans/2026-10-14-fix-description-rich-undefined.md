# Plan: 2026-10-14 — Defensive guard cho `descriptionRich` trong ProductDescriptionCard

## Scope

Fix runtime crash thứ 2 tại `/products/tui-xach-mini-3` (sau khi fix `formatCount`):

```
TypeError: descriptionRich.map is not a function
  at ProductDescriptionCard (src/components/product-detail/ProductDescriptionCard.tsx:53:26)
```

## Tham khảo

- `docs/CLAUDE.md` mục 7: "Không tin dữ liệu phía client".
- Plan cũ `2026-10-14-fix-formatcount-undefined.md` (cùng pattern defensive guard).

## Nguyên nhân

`ProductDescriptionCard` line 53:

```ts
{descriptionRich.map((html, idx) => ( ... ))}
```

Cùng pattern với bug `formatCount` trước:
- FE type khai báo `descriptionRich: string[]` (types.ts line 72).
- Mock đầy đủ (mock.ts line 376).
- Nhưng runtime BE `/api/v1/products/slug/tui-xach-mini-3` trả về:
  - Có thể `descriptionRich` undefined (BE không có field này).
  - Có thể `descriptionRich` không phải array (BE trả string/object).
  - Có thể BE dùng `description` (string đã join) thay vì `descriptionRich` (string[]).

Component giả định array → crash toàn page khi shape khác.

## Cách fix

1. Đổi `descriptionRich` prop type thành `string[] | string | null | undefined`.
2. Normalize ở component:
   - Nếu array → giữ nguyên.
   - Nếu string → wrap `[html]`.
   - Nếu null/undefined → `[]` (render không có paragraph, không crash).
3. Áp dụng tương tự cho `features` và `sizeChart` (cùng pattern, BE có thể thiếu).
4. Không thay đổi `ProductDetail` type trong `types.ts` (giữ strict cho BE integration; component tự defensive).

## Test strategy

- Update `ProductDescriptionCard.test.tsx` thêm 4 case:
  - `descriptionRich: undefined` → render không crash, không có paragraph.
  - `descriptionRich: null` → render không crash.
  - `descriptionRich: "single string"` → render 1 paragraph.
  - `descriptionRich: ["a", "b"]` → render 2 paragraphs (existing case).
- Cũng guard `features: undefined` → render không có feature card (không crash).
- Cũng guard `sizeChart: undefined` → render không có row.

## Out of scope

- Không sync với BE về shape `descriptionRich` (riêng).
- Không đổi types.ts (cross-cutting impact).
