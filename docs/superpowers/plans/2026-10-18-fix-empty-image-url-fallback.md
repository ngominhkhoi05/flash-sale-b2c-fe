# Plan — Fix Empty Image URL Crash (ProductCardVoucher / Next.js Image)

> **Date**: 2026-10-18
> **Branch**: `fix/empty-image-url-fallback` (từ `dev`)
> **Status**: APPROVED (user nói "ok fix" sau khi đề xuất)
> **Related**: Báo cáo console error ở localhost, stack trace `ProductCardVoucher`

---

## 1. Background & Root Cause

### 1.1 Triệu chứng (console error ở localhost)

```
Console Error
An empty string ("") was passed to the src attribute. This may cause the
browser to download the whole page again over the network. To fix this,
either do not render the element at all or pass null to src instead of an
empty string.

  at img (<anonymous>:null:null)
  at ProductCardVoucher
  at ProductCard
  at RecommendedSection[products.map()]
  at HomepageView
```

### 1.2 Root cause (xác nhận từ code đọc trước)

- `RecommendedSection` map `products` → render `ProductCard` cho mỗi product
- `ProductCard` (Modern Clean) chứa sub-component `ProductCardVoucher` render `<Image src={...}>` hoặc `<img src={...}>`
- Data `imageUrl` đến từ `useFeaturedProducts()` → `src/features/homepage/api.ts` → gọi `GET /api/v1/products/featured` từ backend `http://localhost:8080`
- Khi BE Spring Boot dev trả một trong các trường hợp:
  - `imageUrl: ""` (chuỗi rỗng, dễ gặp khi entity JPA có `@Column(name = "image_url")` và giá trị null được serialize thành `""`)
  - `imageUrl: null` (nếu check `if (!imageUrl)` thì OK, nhưng nếu check `=== null` thì miss `""`)
  - `imageUrl: undefined` (hiếm, có thể do type safety lỏng)
- React/Next.js throw console error: **empty string là invalid** cho `<img>` / `<Image>` src
- Pattern lỗi lặp lại ở nhiều component render ảnh từ data động (`ProductCardVoucher`, có thể `HeroBannerSection` đã có guard, `ProductDetailPage`, ...)

### 1.3 Tại sao "fix triệt để" thay vì 1 dòng `|| null`

User yêu cầu: **"có cách fix triệt để không? kiểu null thì nó sẽ default là 1 link ảnh nào đó?"**

→ 1 lần sửa 1 component KHÔNG đủ. Cần:
1. Helper chuẩn hoá `imageUrl` ở 1 chỗ duy nhất
2. Tầng API parse response (chuẩn hoá `""` → `null` ngay khi nhận)
3. Defensive guard ở component (last resort)
4. Fallback placeholder ảnh cho từng loại (product, avatar, banner, store)

→ **3 lớp bảo vệ** (defense in depth).

---

## 2. Scope

### 2.1 Trong scope

| # | File | Loại | Mô tả |
|---|---|---|---|
| 1 | `src/lib/images/placeholders.ts` | **MỚI** | Constant `FALLBACK_BY_KIND: { product, avatar, banner, store }` trỏ về local `/images/placeholder-*.png` (file local trong `public/`) |
| 2 | `src/lib/images/with-fallback.ts` | **MỚI** | Helper `imageUrlWithFallback(url, kind)` chuẩn hoá: null/undefined/"" → fallback; relative URL → ghép `NEXT_PUBLIC_API_URL`; absolute → as-is |
| 3 | `src/lib/images/with-fallback.test.ts` | **MỚI** | Unit test 8 case: null, undefined, "", "  ", "https://...", "http://...", "/relative", "no-slash" |
| 4 | `public/images/placeholder-product.png` | **MỚI** | Ảnh placeholder 1x1 hoặc SVG 200x200, dùng cho product |
| 5 | `public/images/placeholder-avatar.png` | **MỚI** | Ảnh placeholder 1x1, dùng cho avatar |
| 6 | `public/images/placeholder-store.png` | **MỚI** | Ảnh placeholder 1x1, dùng cho store |
| 7 | `src/features/homepage/api.ts` | **SỬA** | Normalize `imageUrl`: trim → `null` nếu rỗng, ngay khi parse response từ `useFeaturedProducts` + `useHomeBanners` |
| 8 | `src/components/storefront/ProductCard/ProductCard.tsx` | **SỬA** | Dùng `imageUrlWithFallback` cho mọi `<Image src={...}>` trong `ProductCardVoucher` + các sub-component khác |
| 9 | `src/components/storefront/sections/HeroBannerSection.tsx` | **SỬA (defensive)** | Đã có guard `!slide.imageUrl`, bổ sung check `slide.imageUrl.trim() === ''` để cover chuỗi rỗng |
| 10 | (nếu có) `src/components/storefront/ProductCard/ProductCard.test.tsx` | **CẬP NHẬT** | Thêm test render với `imageUrl: ""` → expect KHÔNG throw, expect render placeholder |
| 11 | `src/components/storefront/sections/HeroBannerSection.test.tsx` | **CẬP NHẬT** | Thêm test render với `imageUrl: ""` → expect KHÔNG throw |

### 2.2 NGOÀI scope (defer)

- ❌ Sửa BE Spring Boot trả `""` thay vì `null` — thuộc `flash-sale-b2c-UTC2` repo
- ❌ Sửa mọi component render ảnh trong toàn project — out of scope lần này, làm từ từ nếu user yêu cầu
- ❌ PWA / service worker cache ảnh placeholder
- ❌ Lazy load ảnh placeholder

---

## 3. Tham khảo

- `.cursor/rules/component-pattern.mdc` mục 10 (next/image)
- `.cursor/rules/flash-sale-b2c-api.mdc` (response shape)
- `.cursor/rules/testing-required.mdc` (TDD workflow + test pattern)
- `.cursor/rules/design-system.mdc` (color tokens cho placeholder nếu cần gradient)
- `src/lib/api/client.ts` (xem pattern normalize response hiện tại)
- `src/features/homepage/api.ts` (xem response shape thật từ BE)
- `src/components/storefront/ProductCard/ProductCard.tsx` (xem cấu trúc sub-component + render image)
- Upstream `e615e3d fix(next-image-localhost-hostname-only)` — KHÔNG liên quan đến fix này (đó là whitelist hostname, fix này là normalize data)

---

## 4. Subplan & chia task

### Subplan 1 — Helper + test (TDD)

- **Concern**: Core logic chuẩn hoá URL
- **File**: `src/lib/images/with-fallback.ts` + test + `placeholders.ts`
- **Model**: `inherit` (general-purpose hoặc chạy thẳng)
- **Output**: Helper + 8 test cases pass
- **Tại sao tách**: Có thể test độc lập, không phụ thuộc component

### Subplan 2 — Audit & sửa component (TDD nếu logic)

- **Concern**: Áp dụng helper vào component thật
- **File**: `ProductCard.tsx` + `HeroBannerSection.tsx` + test update
- **Model**: `inherit`
- **Output**: Không còn empty src ở console
- **Tại sao tách**: Phụ thuộc Subplan 1, chạy sau

### Subplan 3 — API layer normalize (TDD)

- **Concern**: Chuẩn hoá data từ BE
- **File**: `src/features/homepage/api.ts` + test
- **Model**: `inherit`
- **Output**: Response từ FE API layer luôn là `string | null`, không bao giờ `""`
- **Tại sao tách**: Defense in depth, phòng BE trả `""` ở tương lai

### Subplan 4 — Placeholder images (chạy thẳng, copy only)

- **Concern**: File ảnh local
- **File**: 3 file `.png` 1x1 trong `public/images/`
- **Model**: `inherit`
- **Output**: 3 file ảnh tồn tại, dev dùng được
- **Tại sao tách**: Tạo file ảnh, không cần subagent

### Quyết định: Tôi sẽ chạy tuần tự vì phụ thuộc nhau (Subplan 2 cần Subplan 1 xong, Subplan 3 cần Subplan 1 xong). Subplan 4 có thể chạy song song với 1.

---

## 5. Test strategy

### 5.1 Unit test cho helper (Subplan 1)

```ts
describe('imageUrlWithFallback', () => {
  it('returns fallback for null', ...)
  it('returns fallback for undefined', ...)
  it('returns fallback for empty string', ...)
  it('returns fallback for whitespace-only string', ...)
  it('returns absolute https URL as-is', ...)
  it('returns absolute http URL as-is', ...)
  it('prepends base URL to relative path with leading slash', ...)
  it('prepends base URL with slash to relative path without leading slash', ...)
  it('strips trailing slash from base URL', ...)
  it('uses kind-specific fallback (product vs avatar)', ...)
});
```

### 5.2 Component test (Subplan 2)

- Test `ProductCardVoucher` render với `imageUrl: ""` → expect placeholder, không throw
- Test `ProductCardVoucher` render với `imageUrl: null` → expect placeholder
- Test `ProductCardVoucher` render với `imageUrl: "https://..."` → expect real image

### 5.3 API normalize test (Subplan 3)

- Test `parseProductsResponse` với `imageUrl: ""` → expect `imageUrl: null`
- Test `parseProductsResponse` với `imageUrl: "  "` → expect `imageUrl: null`
- Test `parseProductsResponse` với `imageUrl: "https://..."` → expect unchanged

### 5.4 Verify manual

- `npm run dev` → mở `localhost:3000` → console KHÔNG còn lỗi "empty string src"
- DevTools Network: request ảnh placeholder `/images/placeholder-product.png` → 200 OK

---

## 6. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Helper logic sai → silent fallback production | Low | Med | 8 test case cover edge cases |
| Placeholder image quá to → bundle tăng | Med | Low | Dùng ảnh 1x1 PNG (< 1KB mỗi cái) hoặc SVG 200x200 |
| Helper ghép URL sai → 404 image | Med | Med | Test riêng case relative + base URL có/không trailing slash |
| Component khác ngoài `ProductCard` cũng có lỗi tương tự | High | Med | Helper ready, có thể grep-replace sau. Lần này chỉ fix 2 component trong scope |
| Auto-commit vi phạm pre-commit checklist | Low | High | Tuân thủ 7 mốc pre-commit |

---

## 7. Definition of Done

- [ ] Helper `imageUrlWithFallback` + 8 test case pass
- [ ] 3 file placeholder ảnh tồn tại trong `public/images/`
- [ ] `ProductCardVoucher` không còn throw console error khi `imageUrl: ""`
- [ ] `HeroBannerSection` defensive guard cover `""`
- [ ] `homepage/api.ts` normalize `""` → `null`
- [ ] `npm run test` pass (toàn project, không phải chỉ file mới)
- [ ] `npm run tsc --noEmit` pass
- [ ] `npm run lint` pass
- [ ] Manual smoke `localhost:3000` → console sạch
- [ ] Auto-commit với message EN + body liệt kê test file
- [ ] Báo cáo với format yêu cầu ở `workflow-process.mdc` Bước 6
