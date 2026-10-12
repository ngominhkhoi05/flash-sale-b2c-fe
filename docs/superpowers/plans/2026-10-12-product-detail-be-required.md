# BE-Required: Product Detail API Gap Analysis (Stitch 31bc6af5)

> **Date**: 2026-10-12
> **From**: FE Agent (`flash-sale-b2c-fe`)
> **To**: BE Team (`flash-sale-b2c-UTC2`)
> **Context**: Triển khai trang **Chi tiết sản phẩm** theo Stitch design [`31bc6af5008e445b877c60ca77cff328`](https://lh3.googleusercontent.com/aida/AEtjO1XlxhcVX3BGXLevMKC5fY4r-qxNqGRsmGlF4H3SkrQPcJ9BkWd6Bj7PQBN153Bz2bnFw-HiF0sGMZLTo-DtRMyRnWo-4j2IdWKIKiAtlqXSLf9pMX8Q6n1y4t3gtP6_OVyZ3Gxwe8jK_D5aTMFrsis-5OeRGQFcgZK27koVvH5Wki4ekVhDG1W3C3Z6sHucIpcUuDkMHpLp_uYGy5cLdxy3lgyZ7OXX0DxoBKNSkdU_3x5m7RGl8eKTUzGm) (2560×8280 desktop).
> **Swagger source**: `http://180.93.137.28/v3/api-docs` (snapshot tại `docs/api-research/swagger.json` trong FE repo).

---

## 0. TL;DR

Stitch design yêu cầu **rất nhiều field/section** mà API hiện tại **CHƯA CÓ**. FE không thể implement pixel-perfect 100% nếu thiếu các mục dưới đây. Tài liệu này liệt kê đầy đủ gap, phân loại theo priority, để BE bổ sung trước khi FE integrate.

| Priority | Mục | Section trong Stitch | Hiện trạng API |
|---|---|---|---|
| 🔴 P0 | Product Detail: thiếu field rating, soldCount, priceRange, discountPercent | Hero / Header | `ProductDetailResponse` thiếu 5/9 field UI cần |
| 🔴 P0 | Endpoint **Reviews** cho sản phẩm | "Đánh Giá Sản Phẩm" (~500px) | **Không tồn tại** |
| 🔴 P0 | Endpoint **Related Products** (cùng shop) | "Cùng Shop UTC" | **Không tồn tại** |
| 🟠 P1 | Endpoint **Best Sellers** (cùng ngành) | "Bán Chạy Cùng Ngành" | **Không tồn tại** |
| 🟠 P1 | Endpoint **Store Profile** (rating, responseRate, joinedAt, productCount) | "Store Profile Card" | `StoreResponse` thiếu 4/6 field UI cần |
| 🟠 P1 | Endpoint **Vouchers by Store** (đang hiển thị ở product detail) | "Mã Giảm Giá" trong pricing box | Đã có `/vouchers/store/{storeId}` ✅ — cần verify response shape |
| 🟠 P1 | Endpoint **Flash Sale Item** (activePrice, sold, total) | Pricing Box "Biến thể B" | `FlashSaleItemResponse` có nhưng chưa link với product detail |
| 🟡 P2 | Product Detail: thêm `slug` (route friendly) | URL `/products/[slug]` | Hiện dùng `id` (int64) — không SEO-friendly |
| 🟡 P2 | Endpoint **Q&A** (76 câu hỏi được trả lời) | Stats line | **Không tồn tại** |
| 🟡 P2 | Endpoint **Shipping estimate** (1-2 ngày làm việc) | "Thời gian nhận dự kiến" | **Không tồn tại** (phụ thuộc address) |

---

## 1. P0 — Bắt buộc có trước khi FE implement

### 1.1 Mở rộng `ProductDetailResponse`

**Hiện tại** (BE trả):
```jsonc
{
  "id": 0,
  "storeId": 0,
  "storeName": "string",
  "categoryId": 0,
  "categoryName": "string",
  "name": "string",
  "imageUrl": "string",       // ❌ chỉ 1 ảnh, Stitch có 5 ảnh
  "description": "string",
  "tierVariationConfigs": [...],
  "status": "string",
  "createdAt": "2026-10-12T...",
  "variants": [...]
}
```

**FE cần** (bổ sung):
```jsonc
{
  // ... các field hiện có giữ nguyên ...
  "slug": "ao-thun-unisex-cotton-utc-basic",         // 🆕 P2: route friendly
  "ratingAvg": 4.8,                                  // 🆕 P0: thay cho Stitch hardcode "4.8"
  "ratingCount": 326,                                // 🆕 P0: "(326 đánh giá)"
  "soldCount": 2100,                                 // 🆕 P0: "Đã bán 2,1k"
  "questionCount": 76,                               // 🆕 P2: "76 câu hỏi được trả lời"
  "minPrice": 89000,                                 // 🆕 P0: cho related product card
  "maxPrice": 159000,                                // 🆕 P0: cho related product card
  "discountPercent": 44,                             // 🆕 P0: "-44%" badge (nếu product đang flash sale)
  "images": [                                        // 🆕 P0: thay cho `imageUrl` đơn lẻ
    { "id": 1, "url": "https://...", "displayOrder": 0, "isPrimary": true, "alt": "..." },
    { "id": 2, "url": "https://...", "displayOrder": 1, "isPrimary": false, "alt": "..." }
  ]
}
```

**Quyết định thiết kế**:
- Giữ `imageUrl` để backward-compatible (cache), đồng thời thêm `images[]`.
- `ratingAvg` / `ratingCount` / `soldCount` aggregate từ Reviews + OrderHistory. Có thể cache 5 phút.
- `discountPercent` = `(originalPrice - flashSalePrice) / originalPrice * 100`, `null` nếu không có flash sale.

### 1.2 Endpoint mới: `GET /api/v1/products/{id}/reviews`

**Mục đích**: Render section "Đánh Giá Sản Phẩm" (~500px) trong Stitch.

**Request**:
```
GET /api/v1/products/{id}/reviews?page=0&size=10&rating=5&hasMedia=true
```

**Response shape** (FE đề xuất):
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 123,
        "userDisplayName": "nguyenvan_92",         // đã mask nếu cần
        "userAvatarUrl": "https://...",             // có thể null
        "rating": 5,
        "title": null,                              // optional
        "content": "Áo giao cực kỳ ưng ý luôn...",
        "variantSku": "UTC-TS-001-WHT-L",           // để hiển thị "Phân loại: Trắng, Size L"
        "variantAttributes": { "Màu": "Trắng", "Size": "L" },
        "mediaUrls": [                              // ảnh/video từ customer
          "https://...",
          "https://..."
        ],
        "sellerReply": {                            // 🆕 phản hồi của shop
          "content": "Dạ UTC chân thành cảm ơn...",
          "repliedAt": "2026-10-10T..."
        },
        "isVerifiedPurchase": true,
        "createdAt": "2026-10-10T..."
      }
    ],
    "ratingDistribution": {                        // 🆕 để render filter chips
      "5": 280,
      "4": 32,
      "3": 10,
      "2": 2,
      "1": 2
    },
    "mediaCount": 184,                             // "Có hình ảnh / video (184)"
    "page": 0,
    "size": 10,
    "totalElements": 326,
    "totalPages": 33
  }
}
```

**Note**:
- Filter `rating=5` (hoặc 4, 3, 2, 1), `hasMedia=true` (chỉ review có ảnh/video).
- `sellerReply` có thể null (review không có reply).

### 1.3 Endpoint mới: `GET /api/v1/products/{id}/related?type=same_store`

**Mục địch**: Render card "Cùng Shop UTC" (~250px) trong Stitch.

**Response shape**:
```jsonc
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Quần short kaki co giãn",
      "imageUrl": "https://...",
      "minPrice": 139000,
      "soldCount": 890,
      "ratingAvg": 4.7
    }
    // ... max 4 items
  ]
}
```

### 1.4 Endpoint mới: `GET /api/v1/products/{id}/related?type=best_sellers`

**Mục đích**: Render card "Bán Chạy Cùng Ngành" (~250px) trong Stitch.

**Response shape**: giống 1.3, nhưng `type=best_sellers` lấy theo `categoryId`, sort theo `soldCount` desc, lấy top 3-5.

**Có thể gộp 1.3 + 1.4 thành 1 endpoint với enum `type`**:
```
GET /api/v1/products/{id}/related?type={SAME_STORE | BEST_SELLERS | SAME_CATEGORY}
```

---

## 2. P1 — Cần có để implement đầy đủ (có thể phase 2)

### 2.1 Mở rộng `StoreResponse`

**Hiện tại** (FE đã thấy schema):
```jsonc
{
  "id": 0,
  "name": "string",
  // ... các field khác
}
```

**Stitch UI cần** (từ "Store Profile Card"):
| Field UI | API field cần thêm | Note |
|---|---|---|
| `4.9 ⭐ (42.5k)` | `ratingAvg`, `ratingCount` | Aggregate từ reviews của tất cả product trong shop |
| `128 mẫu` | `productCount` | `SELECT COUNT(*) FROM products WHERE store_id = ?` |
| `99% (Vài phút)` | `responseRate` (int 0-100), `responseTimeLabel` (string) | BE tính từ chat history |
| `2 năm trước` | `joinedAt` (date) | Render "X năm trước" ở FE |
| `Online 5 phút trước` | `lastActiveAt` (datetime) | FE tính relative time |
| `UTC Fashion Official` | `name` | ✅ có sẵn |
| `Official Mall` badge | `isOfficial` (bool) | Cần check tier store |

**Response shape mong muốn**:
```jsonc
{
  "id": 1,
  "name": "UTC Fashion Official",
  "logoUrl": "https://...",
  "isOfficial": true,                  // 🆕
  "ratingAvg": 4.9,                    // 🆕
  "ratingCount": 42500,                // 🆕
  "productCount": 128,                 // 🆕
  "responseRate": 99,                  // 🆕 (% phản hồi chat)
  "responseTimeLabel": "Vài phút",     // 🆕 (string, ngắn gọn)
  "joinedAt": "2024-10-12T...",        // 🆕
  "lastActiveAt": "2026-10-12T..."     // 🆕
}
```

### 2.2 Endpoint mới: `GET /api/v1/vouchers/store/{storeId}` — verify response

Endpoint đã tồn tại ✅. Cần BE confirm response shape:

```jsonc
// Expected
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "GIAM10K200K",
      "name": "Giảm 10K đơn từ 200K",
      "discountType": "FIXED_AMOUNT",         // FIXED_AMOUNT | PERCENT
      "discountValue": 10000,
      "minOrderValue": 200000,
      "maxDiscount": null,                    // for PERCENT
      "expiresAt": "2026-12-31T..."
    }
  ]
}
```

### 2.3 Endpoint: `GET /api/v1/flash-sale-items/active?productId={id}`

**Mục đích**: Nếu product đang trong Flash Sale, lấy giá flash, sold, total, endsAt cho Pricing Box "Biến thể B".

**Response shape** (dùng lại `FlashSaleItemResponse` hoặc tạo mới):
```jsonc
{
  "success": true,
  "data": {
    "flashSaleItemId": 1,
    "productId": 1,
    "variantId": 1,
    "flashSalePrice": 89000,
    "originalPrice": 159000,
    "discountPercent": 44,
    "totalStock": 100,
    "soldStock": 72,
    "maxQtyPerUser": 2,
    "endsAt": "2026-10-12T18:00:00Z"
  }
}
```

> Hiện đã có `FlashSaleItemResponse` (xem swagger). Cần BE confirm field shape hoặc thêm các field còn thiếu.

---

## 3. P2 — Nice-to-have (có thể bỏ qua phase 1)

### 3.1 Thêm `slug` vào `ProductDetailResponse`

URL frontend dùng `/products/[slug]` (đã có `ROUTES.PRODUCT_DETAIL(slug)` trong `src/lib/constants.ts`). BE chỉ trả `id` (int64) hiện tại → FE phải tự generate slug từ `name` (không SEO-friendly).

**Đề xuất BE thêm**:
```jsonc
{
  "id": 1,
  "slug": "ao-thun-unisex-cotton-utc-basic",     // 🆕
  // ...
}
```

### 3.2 Endpoint: `GET /api/v1/products/{id}/questions`

**Mục đích**: Hiển thị "76 câu hỏi được trả lời" → click mở tab "Hỏi & Đáp" (có thể phase sau).

Phase 1 chỉ cần `questionCount: 76` trong `ProductDetailResponse` (xem 1.1).

### 3.3 Endpoint: `GET /api/v1/shipping/estimate`

**Mục đích**: "Thời gian nhận dự kiến: 1 - 2 ngày làm việc".

**Request**:
```
GET /api/v1/shipping/estimate?fromStoreId=1&toDistrictId=...&toWardId=...
```

**Response**:
```jsonc
{
  "success": true,
  "data": {
    "minDays": 1,
    "maxDays": 2,
    "shippingFee": 0,                    // 0 = freeship
    "freeShipThreshold": 150000,         // "Miễn phí vận chuyển đơn từ 150K"
    "carrierName": "GHTK"
  }
}
```

Phase 1 FE có thể hardcode "1-2 ngày" + "FREESHIP XTRA" badge nếu thiếu API này.

---

## 4. Tổng kết gap matrix

| API hiện có | Field/Section UI | Status |
|---|---|---|
| `ProductDetailResponse` cơ bản | Tên, ảnh, mô tả, variants | ✅ dùng được |
| `ProductDetailResponse.ratingAvg` | ⭐ 4.8 | ❌ cần thêm (1.1) |
| `ProductDetailResponse.soldCount` | "Đã bán 2,1k" | ❌ cần thêm (1.1) |
| `ProductDetailResponse.images[]` | Gallery 5 ảnh | ❌ cần thêm (1.1) |
| `ProductDetailResponse.slug` | URL `/products/[slug]` | ❌ cần thêm (3.1) |
| `GET /api/v1/products/{id}/reviews` | Section Reviews | ❌ thiếu endpoint (1.2) |
| `GET /api/v1/products/{id}/related` | "Cùng Shop" + "Bán chạy" | ❌ thiếu endpoint (1.3, 1.4) |
| `StoreResponse` (rating, productCount, ...) | "Store Profile Card" | ❌ thiếu nhiều field (2.1) |
| `GET /api/v1/vouchers/store/{storeId}` | "Mã Giảm Giá" | ⚠️ verify shape (2.2) |
| `FlashSaleItemResponse` (price, sold, total) | Pricing Box "Biến thể B" | ⚠️ cần link productId (2.3) |
| `GET /api/v1/shipping/estimate` | "1-2 ngày làm việc" | ❌ thiếu endpoint (3.3) |

---

## 5. Đề xuất Phase

**Phase 1 (BE làm trước, ~3-5 ngày)**:
- [ ] Mở rộng `ProductDetailResponse` (1.1) — P0
- [ ] Endpoint Reviews (1.2) — P0
- [ ] Endpoint Related (1.3 + 1.4) — P0

**Phase 2 (BE làm sau, ~3-5 ngày)**:
- [ ] Mở rộng `StoreResponse` (2.1) — P1
- [ ] Verify Vouchers response (2.2) — P1
- [ ] Link FlashSaleItem với product (2.3) — P1

**Phase 3 (tùy chọn, có thể bỏ)**:
- [ ] Slug (3.1) — P2
- [ ] Q&A (3.2) — P2
- [ ] Shipping estimate (3.3) — P2

**FE sẽ block** cho đến khi **Phase 1** xong. Sau khi nhận API mới, FE sẽ:
1. Tạo `src/features/products/types.ts` (DTOs).
2. Tạo `src/features/products/api.ts` (TanStack Query hooks).
3. Implement `src/app/(storefront)/products/[slug]/page.tsx` (pixel-perfect theo Stitch 31bc6af5).
4. Verify từng section 1-1 với Stitch screenshot.

---

## 6. Phụ lục: Stitch section ↔ API mapping

| # | Section trong Stitch | Pixel height | API endpoint | Field cần |
|---|---|---|---|---|
| 1 | Header + Topbar | 160 | n/a | static |
| 2 | Breadcrumb | 32 | `ProductDetailResponse.categoryName` | ✅ có |
| 3 | Variant switcher (A/B) | 32 | conditional | UI only |
| 4 | Image Gallery + thumbs + zoom | 580 | `images[]` (1.1) | ❌ |
| 5 | Share + Wishlist bar | 48 | n/a (UI only) | — |
| 6 | 3 commitment badges | 60 | static | — |
| 7 | Header tags + Title + Rating | 100 | `name`, `ratingAvg`, `ratingCount`, `soldCount` (1.1) | ❌ |
| 8 | Pricing Box A (Thường) | 100 | `variants[].originalPrice`, `minPrice`/`maxPrice` (1.1) | ⚠️ |
| 9 | Pricing Box B (Flash Sale) | 150 | FlashSaleItem (2.3) | ❌ |
| 10 | Shop Vouchers | 60 | `/vouchers/store/{storeId}` (2.2) | ⚠️ verify |
| 11 | Shipping Section | 90 | `/shipping/estimate` (3.3) | ❌ |
| 12 | Color + Size selectors | 200 | `tierVariationConfigs` + `variants[].attributes` | ✅ có |
| 13 | Quantity + stock | 60 | `variants[].stockQuantity` | ✅ có |
| 14 | CTA buttons (Mua ngay / Add to cart) | 60 | conditional logic | UI only |
| 15 | Store Profile Card | 120 | `StoreResponse` (2.1) | ❌ |
| 16 | Card 1: Chi Tiết Sản Phẩm (specs table) | 240 | `description` (parse specs?) | ⚠️ |
| 17 | Card 2: Mô Tả + 3 features + Size Chart | 600 | `description` (rich text) | ✅ |
| 18 | Card 3: Reviews | 500 | `/products/{id}/reviews` (1.2) | ❌ |
| 19 | Right: Cùng Shop UTC | 250 | `/related?type=same_store` (1.3) | ❌ |
| 20 | Right: Bán Chạy Cùng Ngành | 250 | `/related?type=best_sellers` (1.4) | ❌ |
| 21 | Footer | 200 | n/a | static |

**Total: 21 sections, trong đó**:
- ✅ Có data: 4 (12, 13, 17, 21)
- ⚠️ Cần verify/format: 3 (8, 10, 16)
- ❌ Thiếu: 7 (4, 7, 9, 11, 15, 18, 19, 20)
- UI only: 5 (1, 2, 3, 5, 6, 14) — không cần API

**Tỉ lệ data cần từ BE**: ~7/21 sections = **33%** content bị block.

---

## 7. Liên hệ

- FE Agent: gửi question trong chat `flash-sale-b2c-fe` repo
- Swagger: snapshot tại `docs/api-research/swagger.json` (auto-refresh mỗi lần FE sync)
- Stitch design: project `15206106541998912100`, screen `31bc6af5008e445b877c60ca77cff328`
- File này: `docs/superpowers/plans/2026-10-12-product-detail-be-required.md`
