# Handoff: BE tier.options mismatch với variant.attributes values

**Ngày tạo**: 2026-10-18
**Từ FE team → BE team**
**Trạng thái**: OPEN — chờ BE sửa
**Priority**: Medium (không block release, FE đã defensive)

## TL;DR

`ProductDetailResponse.tierVariationConfigs[].options` của BE **không match** với `variants[].attributes[key]` values runtime. Hậu quả: user không chọn được mọi color/size mà product thật có → variant selector rỗng → CTA fail.

## Bằng chứng (audit runtime 2026-10-18, 12:50 UTC+7)

### Sample 1: `/api/v1/products/slug/tui-xach-mini-3`

```json
{
  "tierVariationConfigs": [
    { "name": "Size", "options": ["S", "M", "L"] },
    { "name": "Color", "options": ["Black", "White"] }
  ],
  "variants": [
    { "id": 6, "attributes": { "size": "L", "color": "Yellow", "variant_index": "1" }, ... },
    { "id": 7, "attributes": { "size": "S", "color": "White", "variant_index": "2" }, ... }
  ]
}
```

- `Color` tier chỉ khai báo `["Black", "White"]` → user chỉ thấy 2 màu
- Nhưng variant 6 có `color: "Yellow"` tồn tại → user không thể chọn từ UI
- `Size` tier khớp OK trong sample này

### Sample 2: `/api/v1/products/slug/sac-du-phong-pro-6`

```json
{
  "tierVariationConfigs": [
    { "name": "Size", "options": ["S", "M", "L"] },
    { "name": "Color", "options": ["Black", "White"] }
  ],
  "variants": [
    { "id": 14, "attributes": { "size": "M", "color": "Green" } },
    { "id": 15, "attributes": { "size": "L", "color": "Black" } },
    { "id": 16, "attributes": { "size": "XXL", "color": "Gray" } },
    { "id": 17, "attributes": { "size": "S", "color": "Red" } }
  ]
}
```

- `Color` tier chỉ `["Black", "White"]` → user chỉ thấy 2 màu. Nhưng variants có 4 màu (Green, Black, Gray, Red).
- `Size` tier chỉ `["S", "M", "L"]` → user chỉ thấy 3 size. Nhưng variants có 4 size (M, L, XXL, S) — `XXL` không selectable.

## Tác động

- Variant selector UI chỉ hiển thị color/size từ `tier.options` → user không chọn được hết
- FE defensive code (commit `04ed8da..ec8fc7b` + sắp tới `fix/variant-attribute-key-casing`) sẽ auto-pick variant ACTIVE có stock đầu tiên → user vẫn mua được, nhưng UX tối ưu hơn nếu BE cung cấp tier đầy đủ
- Risk: BE trả 0 variant nào match `tier.options` → user không mua được → revenue loss

## Đề xuất fix (BE side)

**Rule**: `tierVariationConfigs[].options` PHẢI là **union unique** của tất cả `variant.attributes[tier.name]` values (lowercase key) trong product đó.

### Pseudo-code BE (giả định Java/Spring)

```java
// Sau khi load product + variants từ DB
List<TierVariationConfig> tierConfigs = new ArrayList<>();
Set<String> allColors = variants.stream()
    .map(v -> v.getAttributes().get("color"))
    .filter(Objects::nonNull)
    .collect(Collectors.toCollection(TreeSet::new));
Set<String> allSizes = variants.stream()
    .map(v -> v.getAttributes().get("size"))
    .filter(Objects::nonNull)
    .collect(Collectors.toCollection(TreeSet::new));

if (!allColors.isEmpty()) {
    tierConfigs.add(new TierVariationConfig("Color", new ArrayList<>(allColors)));
}
if (!allSizes.isEmpty()) {
    tierConfigs.add(new TierVariationConfig("Size", new ArrayList<>(allSizes)));
}
product.setTierVariationConfigs(tierConfigs);
```

### Migration consideration

- Nếu DB có bảng `tier_variation_configs` lưu cứng options → cần trigger hoặc batch job recompute từ `variants.attributes`
- Nếu `tier_variation_configs` được generate on-the-fly từ variants → chỉ cần sửa logic builder
- Có thể cần thêm API admin để manually re-sync sau khi import product mới

## Vấn đề thứ 2 (liên quan) — Variant attribute key casing

BE runtime trả:

- `tierVariationConfigs[].name` = `"Color"`, `"Size"` (uppercase)
- `variants[].attributes` = `{size: ..., color: ...}` (lowercase)

→ FE phải handle 2 casing. Đề xuất: **chuẩn hóa 1 trong 2**:
- Option A: đổi `tier.name` → lowercase (`"color"`, `"size"`) cho khớp với `attributes` keys
- Option B: đổi `attributes` keys → uppercase (`"Color"`, `"Size"`) cho khớp với `tier.name`

FE hiện normalize lowercase → uppercase tại API layer (defensive, idempotent), nhưng tốt nhất BE chọn 1 convention để tránh confusion cho FE khác trong tương lai.

## Liên quan

- Plan: `docs/superpowers/plans/2026-10-18-variant-attribute-key-fix.md` (FE side, sẽ merge sau khi BE handoff acknowledged)
- Plan cũ: `docs/superpowers/plans/2026-10-18-product-detail-runtime-fixes.md` (đã merge 6ba966a, miss case casing này)
- BE source: `flash-sale-b2c-UTC2/` (ProductController, ProductService)

## Action items

| # | Owner | Task | Status |
|---|---|---|---|
| 1 | BE | Review handoff + xác nhận convention (uppercase vs lowercase) | ⏳ |
| 2 | BE | Fix tier.options = union từ variants.attributes | ⏳ |
| 3 | FE | Verify sau khi BE deploy (manual test trên `/products/tui-xach-mini-3`) | ⏳ |
| 4 | BE | Update Swagger / `docs/api-document.md` nếu response shape đổi | ⏳ |

## Reproduction nhanh cho BE team

```bash
# PowerShell
Invoke-WebRequest -Uri "http://180.93.137.28/api/v1/products/slug/sac-du-phong-pro-6" -OutFile product.json
# So sánh tier.options vs unique values từ variants.attributes
```

Hoặc dùng Swagger: `http://180.93.137.28/v3/api-docs` → `ProductController.getProductBySlug` → response schema.

## Contact

FE agent (Cursor) — chat hiện tại. Ping lại khi BE có update.
