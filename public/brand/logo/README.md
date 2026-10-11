# Brand Assets – Logo

Thư mục chứa logo chính của **Vibe Mart** dùng cho header, footer, auth chrome, splash, OG image, v.v.

## Quy ước đặt tên

`vibe-mart-logo-<purpose>-<variant>.<ext>`

| Token       | Ý nghĩa                                                              |
|-------------|----------------------------------------------------------------------|
| `purpose`   | `mark` (chỉ biểu tượng) · `wordmark` (chỉ chữ) · `lockup` (mark + wordmark) |
| `variant`   | `light` (nền sáng, mặc định) · `dark` (nền tối) · `mono` (1 màu)     |
| `ext`       | `.svg` (ưu tiên) · `.png` (fallback khi SVG không khả thi)           |

## File hiện có

| File                                  | Kích thước gốc | Trạng thái     | Nguồn                |
|---------------------------------------|----------------|----------------|----------------------|
| `vibe-mart-logo-lockup-light.png`         | 1024×307 (104 KB) | có nền gradient  | Designer upload 2026-10-09 |
| `vibe-mart-logo-mark-light.png`           | 439×439 (51 KB)  | có nền trắng  | Designer upload 2026-10-09 |
| `vibe-mart-logo-lockup-dark.png`          | 751×410 (69 KB)  | có nền đen     | Designer upload 2026-10-09 |

> **File app-icon (`vibe-mart-logo-mark-on-square.png`)** ở `../favicon/` vì nó đã có nền vuông xanh, dùng làm favicon — KHÔNG xoá nền.

## File cần tạo thêm (tối thiểu) — _chưa có_

| File                                  | Kích thước | Màu                  | Dùng cho                       |
|---------------------------------------|------------|----------------------|--------------------------------|
| `vibe-mart-wordmark-light.svg`        | 160×32     | Ink chính            | Footer (chỉ chữ, không mark)   |
| `vibe-mart-wordmark-dark.svg`         | 160×32     | Trắng                | Background tối                 |

## Ghi chú kỹ thuật

- **Ưu tiên SVG** để scale tốt và nhẹ. PNG chỉ dùng khi SVG không khả thi (ảnh bitmap, mockup designer).
- Màu thương hiệu: tham chiếu `docs/CLAUDE.md` mục 3 (token `brand` = `#0284C7` cho Storefront).
  - Lưu ý: Stitch mẫu dùng `#006194` (xanh biển đậm hơn) — chỉ dùng trong `AuthHeader` / `AuthFooter` nếu cần match bản Stitch, **không** dùng cho storefront chính.
- ViewBox chuẩn: 1 tỉ lệ duy nhất cho mỗi biến thể, **không** hard-code `width`/`height` trong SVG (để CSS Tailwind `w-*`/`h-*` điều khiển).
- Tên thương hiệu trong file phải chính xác **"Vibe Mart"** (có khoảng trắng, viết hoa chữ cái đầu mỗi từ).
- Khi import vào Next.js: dùng `<Image src="/brand/logo/..." />` (KHÔNG `<img>` thường) — xem `component-pattern.mdc` mục 10.
- File `.gitignore`: thư mục này **KHÔNG** nằm trong `.gitignore` — logo là asset production, phải track.
