# 📧 Yêu cầu Backend bổ sung — API endpoints cho Trang chủ Storefront

> **Người gửi**: Team FE (flash-sale-b2c-fe)
> **Người nhận**: Team Backend (flash-sale-b2c-UTC2)
> **Ngày**: 2026-10-10
> **Mức độ**: 🟠 **Important** — block tích hợp FE↔BE cho 4 sections trên trang chủ
> **Liên quan**: Stitch trang chủ "Trang chủ Storefront - Vibe Mart" (`33db6dd859b643bda103e6045378886b`); FE branch `feature/storefront-homepage-stitch` (commit `a86ab16`)

---

## 1. Bối cảnh

FE đã hoàn thành UI 7 sections trên trang chủ Storefront theo đúng pixel-match Stitch (xem commit `a86ab16`). Tuy nhiên **4 sections đang dùng mock data** (file `src/components/storefront/sections/home-mocks.ts`) vì API backend **chưa đủ** để render đúng theo design.

| Section | Hiện tại | Cần API |
|---|---|---|
| HeroBanner | Static i18n | ✅ Không cần |
| QuickActions | Static const | ✅ Không cần |
| CategoryGrid | Mock 8 categories tĩnh | ⚠️ Cần `GET /categories` có list |
| **FlashSaleStrip** | Mock 5 deals | ⚠️ Có `GET /flash-sales/slots` nhưng **thiếu field** |
| **VoucherGrid** | Mock 4 tickets | ⚠️ Có `GET /vouchers/platform` nhưng **thiếu field `voucherType`** |
| **FeaturedStores** | Mock 4 stores | ❌ **KHÔNG CÓ** endpoint public list stores |
| **Recommended** | Mock 6 products | ⚠️ Có `GET /products` nhưng **thiếu field `discountPercent` + `voucherLabel`** |

Tài liệu tham chiếu: `docs/api-reference.md` (791 dòng, version 2026-10-10).

---

## 2. Yêu cầu bổ sung — chia theo mức độ

### 🔴 P0 — Endpoint KHÔNG TỒN TẠI (cần tạo mới)

#### 2.1 `GET /api/v1/stores` — List public stores cho "Shop nổi bật"

**Lý do cần**: Section "Shop nổi bật chính hãng" trên trang chủ hiển thị 4-8 store cards. Hiện `docs/api-reference.md` chỉ có `GET /stores/{id}` (single) và `GET /stores/me` (Seller) — **không có list public**.

**Yêu cầu**:

```http
GET /api/v1/stores
Query (optional):
  status      = APPROVED            (default APPROVED — chỉ hiện store active)
  isMall      = true|false          (filter store "Vibe Mall" — verified badge)
  page        = 0                   (default 0)
  size        = 8                   (default 8, max 20)
  sort        = "rating,desc" | "followers,desc" | "newest,desc"
```

**Response (đề xuất) — `StoreSummaryResponse[]`**:

```json
[
  {
    "id": 1,
    "storeName": "Anker Official Store",
    "logoUrl": "https://...",
    "isMall": true,                 // ⭐ MỚI: hiển thị badge "MALL"
    "rating": 4.9,                  // ⭐ MỚI: cần thêm (avg review)
    "totalReviews": 1234,            // ⭐ MỚI
    "followers": 12300,             // ⭐ MỚI: số follower
    "productCount": 56,             // ⭐ MỚI: số SKU đang bán
    "status": "APPROVED",
    "createdAt": "..."
  }
]
```

**Cần trong DB** (nếu chưa có):

- Bảng `store_ratings` (review aggregate) hoặc tính từ `reviews` table
- Bảng `store_followers` (user-store follow) hoặc đếm từ 1 bảng tương đương
- Field `is_mall` trong bảng `stores` (boolean) — cho badge "Vibe Mall"

**Quy ước hiển thị trên FE** (để Backend biết UI cần gì):

| FE hiển thị | Field cần |
|---|---|
| Avatar chữ cái đầu (`A`, `U`...) | Tính từ `storeName[0]` client-side, OK |
| Tên shop | `storeName` |
| Badge "verified" | `isMall` (verified = mall) |
| `★ 4.9` | `rating` |
| `12,3k theo dõi` | `followers` (FE sẽ format 12300 → "12,3k") |
| 3 thumbnail sản phẩm | ❌ Cần thêm `topProducts` array (xem 2.2) |

**Acceptance**:

- [ ] `GET /api/v1/stores?size=4` trả 200 với array 4 store APPROVED
- [ ] Mỗi store có đủ field `rating`, `followers`, `isMall`
- [ ] Filter `?isMall=true` chỉ trả store có `isMall=true`
- [ ] Sort `?sort=rating,desc` hoạt động đúng
- [ ] Response time < 200ms (query đơn giản, có thể cache 5 phút)

---

#### 2.2 `GET /api/v1/stores/{id}/top-products` — Top 3 sản phẩm nổi bật (optional nhưng khuyến nghị)

**Lý do**: Store card cần 3 thumbnail sản phẩm để user nhìn nhanh. Hiện không có endpoint lấy top products theo store.

**Yêu cầu**:

```http
GET /api/v1/stores/{id}/top-products
Query (optional):
  size = 3                          (default 3, max 6)
```

**Response (đề xuất)** — chỉ trả fields cần cho thumbnail:

```json
[
  {
    "id": 42,
    "name": "Củ sạc nhanh Type-C 65W",
    "imageUrl": "https://..."
  }
]
```

**Acceptance**:

- [ ] Trả 200 với 0-3 sản phẩm (theo `size`)
- [ ] Nếu store không có product ACTIVE → trả `[]`
- [ ] Sort theo `totalStock DESC` hoặc `createdAt DESC` (đề xuất: totalStock DESC để ưu tiên sp còn hàng)

---

### 🟠 P1 — Endpoint CÓ nhưng THIẾU field (cần bổ sung response)

#### 2.3 `GET /api/v1/flash-sales/slots` — Thêm field cho UI section

**Hiện tại** (`docs/api-reference.md` mục `PublicFlashSaleSlotResponse`):

```json
{
  "id": 1,
  "title": "...",
  "startTime": "...",
  "endTime": "...",
  "status": "UPCOMING|ACTIVE|ENDED",
  "items": [
    {
      "id": 7,
      "slotId": 1,
      "variantId": 42,
      "sku": "AT-DEN-M",
      "variantName": "Đen, Size M",
      "productName": "Áo thun nam",
      "imageUrl": "...",
      "originalPrice": 199000,
      "flashSalePrice": 99000,
      "allocatedStock": 100,
      "availableStock": 87,
      "userPurchaseLimit": 2,
      "status": "APPROVED"
    }
  ]
}
```

**FE cần thêm các field** (cho section "Flash Sale Hot" hiển thị stock bar + 5 deal):

| FE cần | Hiện có | Giải pháp đề xuất |
|---|---|---|
| Discount % (vd `-45%`) | ❌ | Tính FE: `Math.round((1 - flashSalePrice/originalPrice) * 100)` — OK, không cần thêm |
| Sold count (vd `ĐÃ BÁN 72`) | ⚠️ Có `allocatedStock` và `availableStock` | Tính FE: `allocatedStock - availableStock` |
| Stock percent (vd `72%`) | ⚠️ | Tính FE từ sold/allocated |
| `limitPerBuyer` text | ✅ Có `userPurchaseLimit` | Map thẳng |
| `endsAt` cho countdown | ✅ Có `endTime` của slot | Map thẳng |
| 5 deal đầu tiên của slot ACTIVE | ⚠️ Cần filter | FE sẽ filter `status === 'ACTIVE'`, sort theo `availableStock` ascending, lấy 5 đầu |

**Yêu cầu Backend**:

- [ ] Giữ nguyên schema hiện tại (FE tự tính các field phái sinh)
- [ ] **QUAN TRỌNG**: Sort `items` theo `availableStock ASC` trong response (để deal "sắp cháy hàng" lên đầu)
- [ ] Optional: thêm field `slotTitle` lặp lại trong từng item để FE không phải join

**Acceptance**:

- [ ] `GET /api/v1/flash-sales/slots` trả items sort theo `availableStock ASC`
- [ ] FE có thể render được 5 deal + countdown mà không cần gọi thêm API

---

#### 2.4 `GET /api/v1/vouchers/platform` — Phân loại voucher FREESHIP

**Hiện tại** (`docs/api-reference.md` mục `VoucherResponse`):

```json
{
  "id": 1,
  "code": "SALE10",
  "storeId": null,
  "discountType": "PERCENT",
  "discountValue": 0.10,
  "minOrderAmount": 100000,
  "maxDiscountAmount": 50000,
  "totalQuantity": 1000,
  "usedQuantity": 12,
  "userUsageLimit": 1,
  "startTime": "...",
  "endTime": "...",
  "status": "ACTIVE",
  "createdAt": "..."
}
```

**FE cần cho UI** (4 ticket types: `50K` / `100K` / `FREESHIP` / `15%`):

| FE hiển thị | Backend có | Mapping |
|---|---|---|
| "Giảm 50K" | `discountType=FIXED_AMOUNT, discountValue=50000` | ✅ Map được |
| "Giảm 100K" | `discountType=FIXED_AMOUNT, discountValue=100000` | ✅ Map được |
| "FREESHIP" | ❌ **KHÔNG CÓ** | Cần phân biệt |
| "Giảm 15%" | `discountType=PERCENT, discountValue=15` | ✅ Map được |

**Vấn đề**: "FREESHIP" trên UI là 1 loại voucher riêng (giảm phí ship), nhưng backend hiện không có field phân loại. Có 2 hướng:

**Hướng A — Thêm enum `voucherType`** (khuyến nghị):

```json
{
  "id": 1,
  "code": "FREESHIP30K",
  "voucherType": "FREESHIP",        // ⭐ MỚI: FREESHIP | DISCOUNT
  "discountType": "FIXED_AMOUNT",
  "discountValue": 30000,
  "scope": "SHIPPING",              // ⭐ MỚI (optional): SHIPPING | ORDER
  ...
}
```

**Hướng B — Dùng tag trong `code`**: prefix code `FS_*` = FREESHIP. FE sẽ check `code.startsWith("FS_")`. **Không khuyến nghị** (hack).

**Yêu cầu Backend**:

- [ ] (A) Thêm field `voucherType` enum `FREESHIP` | `DISCOUNT` (default `DISCOUNT`)
- [ ] (A) Thêm field `scope` enum `SHIPPING` | `ORDER` (default `ORDER`)
- [ ] Migration: set `voucherType='DISCOUNT', scope='ORDER'` cho tất cả voucher hiện tại
- [ ] Cho phép Admin tạo voucher mới với `voucherType=FREESHIP` qua `POST /api/v1/admin/vouchers`

**Acceptance**:

- [ ] `GET /api/v1/vouchers/platform` trả array có cả voucher DISCOUNT + FREESHIP
- [ ] FE có thể render 4 loại ticket: `50K` / `100K` / `FREESHIP` / `15%`
- [ ] Khi user lưu voucher FREESHIP → POST `/vouchers/apply?code=FS_xxx` hoạt động đúng (giảm `shippingFee`, không giảm `subtotalAmount`)

---

#### 2.5 `GET /api/v1/products` — Thêm field cho UI section

**Hiện tại** (`docs/api-reference.md` mục `ProductSummaryResponse`):

```json
{
  "id": 1,
  "storeId": 2,
  "storeName": "...",
  "categoryId": 1,
  "categoryName": "...",
  "name": "...",
  "imageUrl": "...",
  "minPrice": 99000,
  "maxPrice": 199000,
  "totalStock": 50,
  "status": "ACTIVE",
  "createdAt": "..."
}
```

**FE cần** (cho section "Gợi ý hôm nay" hiển thị giá giảm + voucher tag):

| FE cần | Backend có | Mapping |
|---|---|---|
| Giá hiển thị (đã giảm) | `minPrice` (chưa giảm) | ⚠️ Cần `discountedPrice` |
| Badge `-25%` | ❌ | Tính FE: `(1 - minPrice/maxPrice) * 100` nếu có discount |
| Tag "Giảm 10K" / "Freeship" | ❌ | Cần thêm (xem dưới) |
| Rating `★ 4.8` | ❌ | Cần thêm (xem dưới) |
| Sold count `Đã bán 1,2k` | ❌ | Cần thêm (xem dưới) |

**Yêu cầu Backend — bổ sung các field sau vào `ProductSummaryResponse`**:

```json
{
  "id": 1,
  "name": "...",
  "imageUrl": "...",
  "minPrice": 99000,                // giá gốc (giữ nguyên)
  "maxPrice": 199000,               // giá gốc cao nhất (giữ nguyên)
  "discountPrice": 74000,           // ⭐ MỚI: giá sau giảm (null nếu không có KM)
  "discountPercent": 25,            // ⭐ MỚI: % giảm (null nếu không có KM)
  "voucherLabel": "Giảm 10K",       // ⭐ MỚI: text label voucher đính kèm (optional)
  "rating": 4.8,                    // ⭐ MỚI: avg rating (1-5)
  "totalReviews": 234,              // ⭐ MỚI
  "totalSold": 1200,                // ⭐ MỚI: số lượng đã bán (sum order_items)
  "location": "Hà Nội",             // ⭐ MỚI: city của store
  ...
}
```

**Yêu cầu DB** (nếu chưa có):

- Bảng `product_ratings` aggregate hoặc join từ `reviews` (avg, count)
- Bảng `order_items` để đếm `totalSold` (đã có sẵn, cần query aggregate)
- Field `store.city` hoặc `store.province` (nếu chưa có thì lấy từ `store_address` default)

**Acceptance**:

- [ ] `GET /api/v1/products?page=0&size=20&sort=totalSold,desc` trả 20 product có field `discountPrice`, `rating`, `totalSold`
- [ ] Field `voucherLabel` chỉ xuất hiện nếu product có voucher đính kèm (null nếu không)
- [ ] Response time < 500ms (cần index `total_sold`, `rating`)

---

### 🟡 P2 — Endpoint CÓ nhưng THIẾU variant (cần thêm)

#### 2.6 `GET /api/v1/categories` — Đã có, FE chỉ cần verify

Endpoint public này **đã tồn tại** (`docs/api-reference.md` mục `Category Module`). FE sẽ tự filter theo `parentId` hoặc lấy top-level để hiển thị 8 danh mục nổi bật. **KHÔNG cần Backend thay đổi** — chỉ cần verify response có đủ field:

```json
{ "id": 1, "name": "Thời trang nam", "slug": "thoi-trang-nam", "commissionRate": 0.10, "description": "..." }
```

**Field cần bổ sung** (optional, để hiển thị icon):

| FE cần | Backend có | Mapping |
|---|---|---|
| Icon cho danh mục (Material Symbol name) | ❌ | ⭐ Thêm `icon: "man"` (string) |
| Hình ảnh banner danh mục | ❌ | ⭐ Thêm `bannerUrl: "https://..."` (optional) |
| Thứ tự sắp xếp | ❌ | ⭐ Thêm `displayOrder: 1` (int) |

**Yêu cầu**:

- [ ] (Optional) Thêm `icon`, `bannerUrl`, `displayOrder` vào `CategoryResponse`
- [ ] Migration: set icon mặc định cho 8 danh mục nổi bật (`Thời trang nam`, `Điện thoại`, ...)
- [ ] (Optional) Endpoint `GET /api/v1/categories/featured?size=8` trả 8 danh mục `displayOrder` ASC

---

## 3. Tổng hợp — Checklist gửi Backend

| # | Mức độ | Endpoint | Hành động | Effort |
|---|---|---|---|---|
| 2.1 | 🔴 P0 | `GET /stores` (NEW) | Tạo mới + bổ sung schema (`rating`, `followers`, `isMall`) | M (3-5 ngày) |
| 2.2 | 🟠 P1 | `GET /stores/{id}/top-products` (NEW) | Tạo mới | S (1 ngày) |
| 2.3 | 🟡 P2 | `GET /flash-sales/slots` | Sort `items` theo `availableStock ASC` | XS (1 giờ) |
| 2.4 | 🟠 P1 | `GET /vouchers/platform` | Thêm `voucherType` + `scope` enum | M (2-3 ngày) |
| 2.5 | 🟠 P1 | `GET /products` | Thêm `discountPrice`, `rating`, `totalSold`, `location` | L (5-7 ngày) |
| 2.6 | 🟡 P2 | `GET /categories` | (Optional) Thêm `icon`, `displayOrder` | S (1 ngày) |

**Ưu tiên đề xuất**: 2.4 → 2.1 → 2.5 → 2.3 → 2.2 → 2.6

Sau khi Backend bổ sung 2.4 + 2.1 + 2.5 (3 task đầu), FE có thể gắn API thật cho **3/4 sections** đang dùng mock. Section "FeaturedStores" cần cả 2.1 + 2.2 mới render đúng.

---

## 4. Acceptance chung (Definition of Done)

- [ ] Tất cả endpoint ở mục 2 hoạt động đúng theo spec
- [ ] Response time < 500ms cho mỗi endpoint (p95)
- [ ] Có Swagger/OpenAPI doc update (file `docs/api-reference.md`)
- [ ] Test cases backend: happy path + edge case (empty list, invalid query, auth missing)
- [ ] Báo lại cho FE team khi deploy để verify tích hợp

---

## 5. Liên hệ & thông tin môi trường

| Mục | Giá trị |
|---|---|
| FE version | Next.js 16.3.8, React 19.2 |
| FE branch | `feature/storefront-homepage-stitch` (commit `a86ab16`) |
| BE base URL | `http://180.93.137.28` |
| Người báo cáo | Team FE (qua chat handoff) |
| File tham chiếu | `docs/api-reference.md` (791 dòng, 2026-10-10) |
| FE file cần sửa khi có API | `src/components/storefront/sections/*Section.tsx` (gọi TanStack Query hook thay vì const) |

---

## 6. Phụ lục — Mẫu API request mà FE sẽ gọi (sau khi Backend bổ sung)

```ts
// src/features/flash-sale/hooks.ts (FE sẽ thêm)
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export function useActiveFlashSaleDeals() {
  return useQuery({
    queryKey: ['flash-sale', 'active-deals'],
    queryFn: () => apiFetch<PublicFlashSaleSlotResponse[]>(
      '/api/v1/flash-sales/slots'
    ),
    select: (slots) => {
      const active = slots.find(s => s.status === 'ACTIVE');
      if (!active) return [];
      return active.items
        .sort((a, b) => a.availableStock - b.availableStock)
        .slice(0, 5)
        .map(item => ({
          id: String(item.id),
          name: item.productName,
          flashPrice: formatVND(item.flashSalePrice),
          originalPrice: formatVND(item.originalPrice),
          soldCount: item.allocatedStock - item.availableStock,
          maxStock: item.allocatedStock,
          // ...
        }));
    },
  });
}
```

```ts
// src/features/vouchers/hooks.ts
export function usePlatformVouchers() {
  return useQuery({
    queryKey: ['vouchers', 'platform'],
    queryFn: () => apiFetch<VoucherResponse[]>(
      '/api/v1/vouchers/platform'
    ),
  });
}
```

Cảm ơn Backend team đã hỗ trợ. Khi triển khai xong, vui lòng báo lại để FE verify và tích hợp vào commit tiếp theo. 🙏
