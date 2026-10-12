# Plan: Product Detail Page – Stitch-Pixel-Perfect (Mock Data)

> **Source of design**: Stitch screen [`31bc6af5008e445b877c60ca77cff328`](https://lh3.googleusercontent.com/aida/AEtjO1XlxhcVX3BGXLevMKC5fY4r-qxNqGRsmGlF4H3SkrQPcJ9BkWd6Bj7PQBN153Bz2bnFw-HiF0sGMZLTo-DtRMyRnWo-4j2IdWKIKiAtlqXSLf9pMX8Q6n1y4t3gtP6_OVyZ3Gxwe8jK_D5aTMFrsis-5OeRGQFcgZK27koVvH5Wki4ekVhDG1W3C3Z6sHucIpcUuDkMHpLp_uYGy5cLdxy3lgyZ7OXX0DxoBKNSkdU_3x5m7RGl8eKTUzGm) (2560×8280 desktop, full responsive).
> **Yêu cầu user**: full desktop + mobile responsive + interactive switcher A/B (Standard vs Flash Sale).
> **Data**: **Mock** (`src/features/products/mock.ts`) vì backend chưa bổ sung các endpoint P0 (xem plan `2026-10-12-product-detail-be-required.md`).
> **Branch**: `feature/product-detail-stitch` (đã có 2 commit research + plan BE, đã merge dev mới nhất).

---

## 1. Scope (Full MVP theo user chọn)

Tạo **trang chi tiết sản phẩm pixel-perfect 100%** theo Stitch `31bc6af5`, gồm:

- **Route**: `src/app/(storefront)/products/[slug]/page.tsx` (dynamic route theo slug).
- **Layout**: Top header (reuse `StorefrontHeader`) + main content 21 sections + footer (reuse `StorefrontFooter`) + `MobileBottomNav`.
- **Data**: Mock data đầy đủ trong `src/features/products/mock.ts` (DTO khớp `ProductDetailResponse` của BE + bổ sung field thiếu từ Stitch).
- **Interactive**:
  - Variant switcher A (Standard) ↔ B (Flash Sale) → toggle UI states.
  - Thumbnail gallery (5 ảnh) + main image swap.
  - Color chip selector (3 màu).
  - Size chip selector (4 size, 1 disabled).
  - Quantity input (−/+ buttons, max theo variant).
  - CTA "Mua ngay" / "Thêm vào giỏ" (mock, hiện toast).
- **Responsive**:
  - Desktop (≥1024px): grid 12 col, gallery 5/12 + specs 7/12, right sidebar 3/12.
  - Tablet (768-1023px): stack columns, gallery full-width + specs full-width.
  - Mobile (<768px): single column, compact sections, sticky bottom CTA.
- **i18n**: Full `vi` + `en` qua `next-intl`, namespace `productDetail.*`.
- **TDD**: Component test cho mỗi sub-component, hook test cho `useProductDetail`.

---

## 2. Tham khảo (Source of Truth priority)

1. **Stitch HTML source** (`docs/stitch-screens/product-detail-31bc6af5.html`) — nguyên mẫu.
2. **Stitch screenshot** (`docs/stitch-screens/product-detail-31bc6af5.png`) — visual reference.
3. **Stitch BE gap analysis** (`docs/superpowers/plans/2026-10-12-product-detail-be-required.md`) — field nào mock, field nào sẽ từ BE.
4. `docs/CLAUDE.md` §3 (design tokens), §5 (component reuse), §6 (i18n), §10 (responsive & a11y).
5. Plan tương tự đã làm: `2026-10-12-not-found-page-stitch.md` (pattern page-level component + i18n + test).
6. `src/components/storefront/StorefrontHeader.tsx` (đã có, dùng lại).
7. `src/components/storefront/StorefrontFooter.tsx` (đã có, dùng lại).
8. `src/components/storefront/MobileBottomNav.tsx` (đã có, dùng lại).
9. `src/components/common/Countdown.tsx`, `PriceText.tsx`, `StatusBadge.tsx` (đã có, dùng lại).
10. `src/features/products/types.ts` (đã có `RecommendedProduct` → tôi sẽ thêm `ProductDetail`, `ProductVariant`).
11. `src/lib/constants.ts` (đã có `ROUTES.PRODUCT_DETAIL(slug)`).
12. `.cursor/rules/stitch-workflow.mdc` — **refactor gate** (không copy HTML nguyên, dùng token).

---

## 3. Stitch sections ↔ FE component mapping (21 sections)

| # | Section Stitch | Pixel height (≈) | FE component | Note |
|---|---|---|---|---|
| 1 | Header (Top bar + Main + Nav pills) | 160 | `<StorefrontHeader />` | reuse |
| 2 | Breadcrumb | 32 | `<ProductBreadcrumb />` | new |
| 3 | Variant switcher (A/B) | 32 | `<ProductVariantSwitcher />` | new, interactive |
| 4 | Image Gallery + thumbs + zoom | 580 | `<ProductGallery />` | new, interactive |
| 5 | Share + Wishlist bar | 48 | `<ProductShareBar />` | new |
| 6 | 3 commitment badges | 60 | `<ProductCommitments />` | new |
| 7 | Header tags + Title + Rating | 100 | `<ProductHeaderInfo />` | new |
| 8 | Pricing Box A (Standard) | 100 | `<ProductPricingBox variant="standard" />` | new, conditional render |
| 9 | Pricing Box B (Flash Sale) + countdown + progress | 150 | `<ProductPricingBox variant="flash" />` | new, conditional render + countdown |
| 10 | Shop Vouchers | 60 | `<ProductVouchers />` | new |
| 11 | Shipping Section | 90 | `<ProductShipping />` | new |
| 12 | Color + Size selectors | 200 | `<ProductVariantSelectors />` | new, interactive |
| 13 | Quantity + stock | 60 | `<ProductQuantityStepper />` | new, interactive |
| 14 | CTA buttons (Mua ngay / Add to cart) | 60 | `<ProductCtaButtons />` | new, interactive (mock submit) |
| 15 | Store Profile Card | 120 | `<ProductStoreCard />` | new |
| 16 | Card 1: Chi Tiết Sản Phẩm (specs table) | 240 | `<ProductSpecsTable />` | new |
| 17 | Card 2: Mô Tả + 3 features + Size Chart | 600 | `<ProductDescriptionCard />` | new |
| 18 | Card 3: Reviews | 500 | `<ProductReviewsCard />` | new (3 sample reviews) |
| 19 | Right: Cùng Shop UTC | 250 | `<ProductRelatedStores />` | new |
| 20 | Right: Bán Chạy Cùng Ngành | 250 | `<ProductBestSellers />` | new |
| 21 | Footer | 200 | `<StorefrontFooter />` | reuse |

**Layout structure** (desktop ≥1024px):

```
<StorefrontHeader />
<main className="pt-40">
  <ProductBreadcrumb />          {/* section 2 */}
  <ProductVariantSwitcher />     {/* section 3 */}
  <ProductGalleryAndInfo>        {/* sections 4-14, 12-col grid 5/7 */}
    <ProductGallery />            {/* section 4 */}
    <ProductShareBar />           {/* section 5 */}
    <ProductCommitments />        {/* section 6 */}
    <ProductHeaderInfo />         {/* section 7 */}
    <ProductPricingBox />         {/* sections 8-9 */}
    <ProductVouchers />           {/* section 10 */}
    <ProductShipping />           {/* section 11 */}
    <ProductVariantSelectors />   {/* section 12 */}
    <ProductQuantityStepper />    {/* section 13 */}
    <ProductCtaButtons />         {/* section 14 */}
  </ProductGalleryAndInfo>
  <ProductStoreCard />            {/* section 15 */}
  <ProductLowerSection>           {/* 12-col grid 9/3 */}
    <ProductSpecsTable />         {/* section 16 */}
    <ProductDescriptionCard />    {/* section 17 */}
    <ProductReviewsCard />        {/* section 18 */}
    <ProductRelatedStores />      {/* section 19 */}
    <ProductBestSellers />        {/* section 20 */}
  </ProductLowerSection>
</main>
<StorefrontFooter />
<MobileBottomNav />              {/* mobile only */}
```

**Mobile (<768px)**: stack tất cả sections, sections 4-14 theo thứ tự dọc, sections 16-20 theo thứ tự dọc (không 2 cột). Sticky bottom CTA bar trên mobile.

---

## 4. File structure (sẽ tạo)

```
src/
  app/(storefront)/products/[slug]/
    page.tsx                              # Server Component, fetch mock + render
    page.test.tsx                         # integration test
  components/product-detail/
    ProductDetailPage.tsx                 # Client Component (orchestrator)
    ProductDetailPage.test.tsx
    ProductBreadcrumb.tsx
    ProductBreadcrumb.test.tsx
    ProductVariantSwitcher.tsx
    ProductVariantSwitcher.test.tsx
    ProductGallery.tsx
    ProductGallery.test.tsx
    ProductShareBar.tsx
    ProductCommitments.tsx
    ProductHeaderInfo.tsx
    ProductHeaderInfo.test.tsx
    ProductPricingBox.tsx
    ProductPricingBox.test.tsx
    ProductVouchers.tsx
    ProductShipping.tsx
    ProductVariantSelectors.tsx
    ProductVariantSelectors.test.tsx
    ProductQuantityStepper.tsx
    ProductQuantityStepper.test.tsx
    ProductCtaButtons.tsx
    ProductCtaButtons.test.tsx
    ProductStoreCard.tsx
    ProductStoreCard.test.tsx
    ProductSpecsTable.tsx
    ProductDescriptionCard.tsx
    ProductDescriptionCard.test.tsx
    ProductReviewsCard.tsx
    ProductReviewsCard.test.tsx
    ProductRelatedStores.tsx
    ProductBestSellers.tsx
  features/products/
    types.ts                              # ADD: ProductDetail, ProductVariant, Review, etc.
    types.test.ts                         # type-level test (optional)
    mock.ts                               # NEW: full mock data
    mock.test.ts                          # NEW: mock structure sanity test
    hooks.ts                              # ADD: useProductDetail(slug)
    hooks.test.tsx                        # ADD: hook test with renderHook
  messages/
    vi.json                               # ADD: productDetail.* namespace (~80 keys)
    en.json                               # ADD: productDetail.* namespace (~80 keys)
  lib/
    format.ts (nếu chưa có)               # ADD: formatVND if not exists
    decimal.ts                            # (đã có hoặc tạo)
```

**Quyết định tách folder**:
- `src/components/product-detail/` — 21 components stitch-specific (dùng 1 lần cho trang này).
- `src/features/products/` — types + mock + hooks (theo pattern `features-migration.mdc`).
- KHÔNG tạo `src/features/products/components/` vì product detail là 1 page rất stitch-specific.

---

## 5. Mock data shape (`src/features/products/mock.ts`)

```ts
// Mirror ProductDetailResponse từ BE + bổ sung field từ Stitch
export const mockProductDetail: ProductDetail = {
  id: 1,
  slug: 'ao-thun-unisex-cotton-utc-basic',
  storeId: 1,
  storeName: 'UTC Fashion Official',
  store: mockStore, // bổ sung (BE chưa có, FE cần)
  categoryId: 1,
  categoryName: 'Thời trang Unisex',
  name: 'Áo thun unisex cotton UTC Basic thoáng khí dệt kim cao cấp',
  imageUrl: '...',
  images: [/* 5 ảnh từ Stitch */],
  description: '...',
  tierVariationConfigs: [
    { name: 'Màu Sắc', options: ['Trắng Tinh Khôi', 'Đen Huyền Bí', 'Vàng Pastel'] },
    { name: 'Kích Thước', options: ['S', 'M', 'L', 'XL'] },
  ],
  ratingAvg: 4.8,
  ratingCount: 326,
  soldCount: 2100,
  questionCount: 76,
  minPrice: 89000,
  maxPrice: 159000,
  discountPercent: 44,
  status: 'ACTIVE',
  createdAt: '2026-10-01T00:00:00Z',
  variants: [
    { id: 1, sku: 'UTC-TS-001-WHT-M', variantName: 'Trắng, M', attributes: { 'Màu Sắc': 'Trắng', 'Kích Thước': 'M' }, originalPrice: 159000, stockQuantity: 48, imageUrl: '...', status: 'ACTIVE' },
    // ... 12 variants (3 màu x 4 size, 1 disabled)
  ],
  flashSale: { // bổ sung
    active: true,
    price: 89000,
    originalPrice: 159000,
    discountPercent: 44,
    soldStock: 72,
    totalStock: 100,
    maxQtyPerUser: 2,
    endsAt: '2026-10-12T18:00:00Z',
  },
  reviews: mockReviews, // 3 sample
  relatedSameStore: mockRelatedSameStore, // 4 items
  relatedBestSellers: mockBestSellers, // 3 items
  specs: { // bổ sung (parse từ description)
    category: 'Vibe Mart > Thời trang Unisex > Áo thun cổ tròn',
    material: '100% Cotton Compact chải kỹ định lượng dày 220gsm',
    origin: 'Việt Nam (Xưởng dệt kim UTC Tân Bình)',
    style: 'Unisex suông vừa Regular Fit, tay lỡ nhẹ thoải mái',
    sku: 'UTC-TS-001-WHT',
    careInstructions: '...',
  },
  sizeChart: mockSizeChart,
  features: mockFeatures, // 3 feature cards
  descriptionRich: mockDescriptionRich, // 2 paragraphs
  storeProfile: mockStoreProfile, // Store rating, response rate, etc.
  vouchers: mockVouchers, // 2 vouchers
  shipping: mockShipping, // "1-2 ngày làm việc", FREESHIP XTRA
  commitments: mockCommitments, // 3 badges
};
```

---

## 6. i18n namespace (mới)

Namespace: `productDetail.*` (~80 keys). Examples:

```jsonc
{
  "breadcrumb": { "home": "Trang chủ", "category": "Thời trang Unisex" },
  "switcher": { 
    "label": "Chế độ xem:",
    "standard": "Biến thể A (Thường)",
    "flash": "⚡ Biến thể B (Flash Sale)",
  },
  "gallery": { "zoom": "Phóng to" },
  "share": { "label": "Chia sẻ:", "copied": "Đã sao chép liên kết sản phẩm!" },
  "wishlist": { "liked": "Đã thích", "count": "(1,4k)" },
  "tags": { "favorite": "YÊU THÍCH+", "official": "Chính Hãng UTC 100%", "sku": "Mã SKU" },
  "rating": { "reviews": "(326 đánh giá)", "sold": "Đã bán", "questions": "câu hỏi được trả lời" },
  "pricing": {
    "flashBanner": "FLASH SALE GIỜ VÀNG",
    "endsIn": "Kết thúc sau",
    "flashDeal": "⚡ FLASH DEAL CHỈ CÒN 28 SUẤT",
    "soldProgress": "Đã bán {sold}/{total} sản phẩm",
    "remaining": "Còn lại {count} suất",
    "maxQtyNote": "Lưu ý: Mỗi khách hàng chỉ được mua tối đa {max} sản phẩm theo giá Flash Sale",
    "trustGuarantee": "Cam kết hoàn tiền 111% nếu phát hiện hàng giả, hàng nhái kém chất lượng",
    "goodPriceDaily": "Giá tốt mỗi ngày",
  },
  "vouchers": { "label": "Mã Giảm Giá:", "save": "Lưu", "saved": "Đã Lưu" },
  "shipping": {
    "label": "Vận Chuyển:",
    "freeshipBadge": "FREESHIP XTRA",
    "freeshipText": "Miễn phí vận chuyển đơn từ 150K",
    "shipTo": "Vận chuyển tới:",
    "changeAddress": "Đổi địa chỉ",
    "estimatedTime": "Thời gian nhận dự kiến:",
  },
  "selectors": {
    "color": "Màu Sắc:",
    "size": "Kích Thước:",
    "sizeGuide": "Bảng quy đổi kích thước chuẩn người Việt",
    "outOfStock": "(Hết hàng)",
  },
  "quantity": {
    "label": "Số Lượng:",
    "inStock": "Còn <strong>{count}</strong> sản phẩm có sẵn trong kho",
  },
  "cta": {
    "addToCart": "Thêm Vào Giỏ Hàng",
    "buyNow": "Mua Ngay",
    "buyNowFlash": "⚡ Mua ngay – Giữ hàng 5 phút",
  },
  "store": {
    "viewShop": "Xem Shop",
    "chatNow": "Chat ngay",
    "rating": "Đánh Giá Shop",
    "products": "Sản Phẩm",
    "productsUnit": "mẫu",
    "responseRate": "Tỉ Lệ Phản Hồi",
    "joined": "Tham Gia Sàn",
    "online": "Online {time} trước",
  },
  "specs": { "title": "Chi Tiết Sản Phẩm", "category": "Danh mục", /* ... */ },
  "description": { "title": "Mô Tả Sản Phẩm Chi Tiết", /* ... */ },
  "reviews": {
    "title": "Đánh Giá Sản Phẩm",
    "filter": { "all": "Tất cả", "5star": "5 Sao", /* ... */, "withMedia": "Có hình ảnh / video" },
    "verified": "Đã mua hàng tại Vibe Mart",
    "sellerReply": "Phản hồi của Người bán",
    "pagination": { "prev": "Trước", "next": "Sau" },
  },
  "related": { 
    "sameStore": "Cùng Shop UTC", "seeAll": "Xem hết",
    "bestSellers": "Bán Chạy Cùng Ngành", "hot": "HOT",
  },
  "commitments": {
    "natural": "100% Cotton Tự Nhiên",
    "returns": "Đổi trả 30 ngày dễ dàng",
    "warranty": "Bảo hành may 6 tháng",
  },
  "toast": {
    "addedToCart": "Đã thêm vào giỏ hàng",
    "redirectingCheckout": "Chuyển đến màn hình thanh toán tức thì",
    "flashMaxQty": "Trong sự kiện Flash Sale, mỗi khách chỉ được đặt tối đa {max} áo!",
  },
}
```

(80 keys — sẽ tạo đầy đủ trong implementation.)

---

## 7. TDD strategy

| Component | Test file | Test cases |
|---|---|---|
| `useProductDetail` hook | `hooks.test.tsx` | return mock khi slug hợp lệ; return null khi slug không tồn tại; loading state |
| `ProductBreadcrumb` | `Breadcrumb.test.tsx` | render đúng category + name; click category link |
| `ProductVariantSwitcher` | `Switcher.test.tsx` | toggle A↔B; default A; emit callback |
| `ProductGallery` | `Gallery.test.tsx` | render 5 thumbs + main; click thumb swap; zoom button |
| `ProductHeaderInfo` | `HeaderInfo.test.tsx` | render tags + title + rating; rating link |
| `ProductPricingBox` | `PricingBox.test.tsx` | render standard; render flash; countdown ticks |
| `ProductVariantSelectors` | `Selectors.test.tsx` | select color; select size; out-of-stock disabled |
| `ProductQuantityStepper` | `QuantityStepper.test.tsx` | increment; decrement; min 1; max stock; max flash qty |
| `ProductCtaButtons` | `CtaButtons.test.tsx` | render standard buttons; render flash button; click handler |
| `ProductStoreCard` | `StoreCard.test.tsx` | render name + rating + stats; chat button |
| `ProductDescriptionCard` | `DescriptionCard.test.tsx` | render description + features + size chart |
| `ProductReviewsCard` | `ReviewsCard.test.tsx` | render rating summary + filter chips + 3 reviews + pagination |
| `ProductDetailPage` | `Page.test.tsx` | integration: render toàn bộ sections, switcher A↔B hoạt động |
| `mock` data | `mock.test.ts` | structure sanity: required fields, types, image URLs valid |

---

## 8. Subplan (chia thành các subagent độc lập)

Mỗi subplan = 1 subagent = 1 concern độc lập, dispatch song song nếu không conflict file.

| Subplan | Files | Model | Deps |
|---|---|---|---|
| **SP1: Setup** | `messages/vi.json`, `messages/en.json` (add `productDetail.*` namespace), `src/features/products/types.ts` (extend), `src/features/products/mock.ts` (new), `src/features/products/mock.test.ts`, `src/features/products/hooks.ts` (add `useProductDetail`), `src/features/products/hooks.test.tsx` | `general-purpose` | none |
| **SP2: Top sections** (2, 3, 4, 5, 6) | `ProductBreadcrumb`, `ProductVariantSwitcher`, `ProductGallery`, `ProductShareBar`, `ProductCommitments` + tests | `general-purpose` | SP1 |
| **SP3: Pricing + Vouchers + Shipping** (8, 9, 10, 11) | `ProductPricingBox` (hỗ trợ cả A/B), `ProductVouchers`, `ProductShipping` + tests | `general-purpose` | SP1 |
| **SP4: Selectors + Quantity + CTA** (12, 13, 14) | `ProductVariantSelectors`, `ProductQuantityStepper`, `ProductCtaButtons` + tests | `general-purpose` | SP1 |
| **SP5: Store card + Lower 3-card** (15, 16, 17, 18) | `ProductStoreCard`, `ProductSpecsTable`, `ProductDescriptionCard`, `ProductReviewsCard` + tests | `general-purpose` | SP1 |
| **SP6: Right sidebar + Page** (19, 20, page) | `ProductRelatedStores`, `ProductBestSellers`, `ProductDetailPage`, `src/app/(storefront)/products/[slug]/page.tsx`, `page.test.tsx` | `general-purpose` | SP1 + SP2-SP5 |
| **SP7: Verify + commit** | chạy `npm run lint`, `npm run tsc --noEmit`, `npm run test`, fix issues, auto-commit | `general-purpose` | SP1-SP6 |

**Dispatch order**:
- SP1 chạy trước (foundation: types + mock + i18n + hook).
- SP2-SP5 chạy song song (mỗi cái touch 1 concern khác nhau, không conflict file).
- SP6 chạy sau (orchestrator + page).
- SP7 cuối cùng (verify + commit).

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Stitch HTML có nhiều inline style phức tạp (variant A/B switch) | Refactor thành React state, dùng `cn()` toggle class. KHÔNG copy HTML nguyên. |
| Image URLs Stitch là Google lh3 (public) | Mock sẽ dùng URL Stitch (công khai, dùng cho demo). Khi integrate BE → thay. |
| 5 reviews Stitch có data thật | Hardcode 3 reviews trong mock (đủ demo filter + pagination). |
| Mobile responsive cần test thủ công | Sau khi commit, smoke test bằng browser thật (không cần E2E). |
| API design của mock phải khớp `ProductDetailResponse` để migrate dễ | Mock shape = BE shape + bổ sung field. Khi BE xong → xoá field bổ sung, chỉ fetch thật. |
| Task rất lớn (21 sections + 80 i18n keys + 14+ test files) | Chia thành 7 subplan để parallel + dễ review từng phần. |

---

## 10. Out of scope (sẽ làm sau khi BE ready)

- **Integrate BE thật** thay mock: chờ Phase 1 BE (xem plan BE gap analysis).
- **WebSocket realtime stock**: hiện không có, sẽ thêm khi backend WS ready.
- **Real reviews pagination API**: hiện hardcode 3, sẽ thay khi BE có `/products/{id}/reviews`.
- **Real related products API**: hiện hardcode, sẽ thay khi BE có `/products/{id}/related`.

---

## 11. Definition of Done

- [ ] Tất cả 21 sections render đúng theo Stitch (verified bằng screenshot so sánh).
- [ ] Interactive switcher A↔B hoạt động (countdown flash sale, CTA button, price color).
- [ ] Thumbnail gallery swap main image, color/size selector, quantity stepper với max validation.
- [ ] Mobile responsive (375px / 768px / 1280px) không tràn ngang, layout đúng.
- [ ] i18n đầy đủ `vi` + `en` (80 keys), không hard-code text.
- [ ] Component test + hook test pass (`npm run test`).
- [ ] Lint + tsc pass (`npm run lint`, `npm run tsc --noEmit`).
- [ ] Auto-commit (English, Conventional Commits, body liệt kê test files).
- [ ] KHÔNG push lên remote (chờ user duyệt).
- [ ] Báo cáo Changes/Implementation/Tests/Notes đầy đủ.

---

## 12. References

- Stitch HTML: `docs/stitch-screens/product-detail-31bc6af5.html` (77KB)
- Stitch PNG: `docs/stitch-screens/product-detail-31bc6af5.png` (30KB)
- BE gap plan: `docs/superpowers/plans/2026-10-12-product-detail-be-required.md`
- Pattern reference: `docs/superpowers/plans/2026-10-12-not-found-page-stitch.md`
- Stitch workflow: `.cursor/rules/stitch-workflow.mdc`

---

## 13. Status: DONE (2026-10-12)

**Branch**: `feature/product-detail-stitch-100pct` (off `feature/product-detail-stitch` merged via PR #31).

**Scope shipped (this branch over PR #31)**:
- 16 sub-components under `src/components/product-detail/` (Breadcrumb, VariantSwitcher, Gallery, ShareBar, Commitments, HeaderInfo, PricingBox [A+B], Vouchers, Shipping, VariantSelectors, QuantityStepper, CtaButtons, StoreCard, SpecsTable, DescriptionCard).
- `ProductDetailPage` orchestrator (Client Component, Next 16 async params) with state for variant/quantity/colour/size.
- `/products/[slug]` Server Component route at `src/app/(storefront)/products/[slug]/page.tsx`.
- i18n: `productDetail.*` namespace extended for both `vi.json` and `en.json`.
- ProductDetail types, mock fixtures, `useProductDetail` hook (from SP1, merged via PR #31).

**File counts** (this branch only):
- 9 component pairs (.tsx + .test.tsx) newly added: CtaButtons, DescriptionCard, DetailPage, HeaderInfo, QuantityStepper, SpecsTable, StoreCard, VariantSelectors + ProductDetailPage.
- 8 component pairs (.tsx + .test.tsx) modified: Breadcrumb, Commitments, Gallery, PricingBox, ShareBar, Shipping, VariantSwitcher, Vouchers.
- 2 i18n files modified (`messages/vi.json`, `messages/en.json`).
- 1 route file added (`src/app/(storefront)/products/[slug]/page.tsx`).
- 1 file intentionally excluded (out of scope): `docs/homepage-api-request.md` (homepage gap analysis, owned by a future homepage task).

**Test results** (final SP7 verification):
- `npx tsc --noEmit` → exit 0 (pass, no output).
- `npx vitest run` → 53/53 files, 492/492 tests pass.
- `npx eslint src/components/product-detail src/app` → 0 errors, 1 pre-existing warning in `src/app/layout.tsx:83` (custom-font, NOT in product-detail scope).
- `npm run build` → pass; `/products/[slug]` registered as dynamic segment.

**Code hygiene fix during SP7**:
- Removed unused `productName` prop from `ProductShareBar` (was 1 ESLint warning in scope), updated call sites in `ProductDetailPage.tsx` and 3 usages in `ProductShareBar.test.tsx`.

**Notes for parent**:
- Single auto-commit on this branch; no push to remote.
- Mock-only data; BE integration deferred to Phase 1 (see plan `2026-10-12-product-detail-be-required.md`).
- Pre-existing warning in `src/app/layout.tsx` (about font loading in app router) is outside the scope of this PR.
