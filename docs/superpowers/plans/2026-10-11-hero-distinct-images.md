# 2026-10-11 – Hero slides dùng 4 ảnh phân biệt

## Scope

Sửa bug copy-paste: 4 hero slide đang dùng **CÙNG 1 URL** ảnh (lighthouse URL
cũ từ Google CDN). Thay bằng 4 ảnh **Unsplash** khác nhau, mỗi slide 1 ảnh
chuyên về chủ đề.

| File | Loại | Mô tả |
|---|---|---|
| `src/components/storefront/sections/home-mocks.ts` | modify | 4 `imageUrl` mới (Unsplash) |
| `src/components/storefront/sections/HeroBannerSection.test.tsx` | modify | Thêm test "renders 4 DISTINCT images" — guard chống copy-paste lần sau |
| `src/app/(storefront)/trang-chu/__snapshots__/page.test.tsx.snap` | auto-update | 4 URL mới → snapshot updated |
| `docs/superpowers/plans/2026-10-11-hero-distinct-images.md` | new | Plan docs |

## Tham khảo

- 4 URL verify trả 200 bằng `Invoke-WebRequest -Method Head` (PowerShell)
- Unsplash License: https://unsplash.com/license — free commercial use

## Mapping slide → ảnh

| Slide ID | Chủ đề | URL Unsplash | Verify |
|---|---|---|---|
| `10-10-tech-fashion` | Đa dạng sản phẩm (shopping + tech) | `photo-1607082348824-0a96f2a4b9da` | ✅ 200 |
| `flash-sale-live` | Đồng hồ đếm ngược, urgency | `photo-1556742044-3c52d6e88c62` | ✅ 200 |
| `voucher-freeship` | Voucher / gift card | `photo-1556742208-999815fca738` | ✅ 200 |
| `new-arrivals` | Sản phẩm mới (boxes / unbox) | `photo-1491637639811-60e2756cc1c7` | ✅ 200 |

Query string: `?auto=format&fit=crop&w=1600&q=80`
- `auto=format` — tự chọn format tối ưu (AVIF/WebP theo browser)
- `fit=crop&w=1600` — width 1600px, crop về tỉ lệ
- `q=80` — chất lượng 80 (cân bằng size/quality)

## Subplan

1. **Subplan 1 — Test RED**: thêm assertion "4 distinct image URLs" vào HeroBannerSection.test.tsx → fail vì 4 URL trùng.
2. **Subplan 2 — Data fix GREEN**: đổi 4 URL thành 4 Unsplash URL → test pass.
3. **Subplan 3 — Snapshot update**: HTML snapshot cập nhật.

## Test strategy

| Tầng | Test |
|---|---|
| HeroBannerSection.test.tsx | +1 test: "renders 4 DISTINCT images (no copy-paste URL bug)" — dùng `Set` để assert 4 URL unique |
| Snapshot | Tự update vì HTML đổi |
| Tổng | 292 tests pass (was 291, +1) |

## API / WS

Không có — pure data + test.

## Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Unsplash URL có thể die trong tương lai | Đã verify 200 ngay bây giờ; nếu cần stable hơn → tải về `public/images/hero-*.jpg` |
| 4 ảnh không đúng chủ đề | User chọn Unsplash + xem 4 ảnh preview trong browser |
| `next/image` warning vẫn còn | Đã tồn tại từ trước (rule §git-workflow mốc 5: "warning cũ OK") |

## Kết quả

- ✅ 32 test files, 292 tests pass (was 291, +1)
- ✅ TSC clean
- ✅ ESLint: 0 errors, 3 warnings cũ
- ✅ Build: `npm run build` pass
- ✅ 4 URL Unsplash verify 200 OK
