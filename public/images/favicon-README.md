# Brand Assets – Favicon

Thư mục chứa favicon cho Vibe Mart (icon hiển thị trên tab trình duyệt, bookmark, mobile home screen, PWA shortcut nếu có).

## Quy ước đặt tên

`vibe-mart-favicon-<size>.<ext>` hoặc theo quy ước Next.js App Router.

| File cần có                  | Kích thước | Định dạng | Dùng cho                              |
|------------------------------|------------|-----------|---------------------------------------|
| `vibe-mart-favicon-16.ico`   | 16×16      | `.ico`    | Tab trình duyệt (kích thước nhỏ)      |
| `vibe-mart-favicon-32.ico`   | 32×32      | `.ico`    | Tab trình duyệt (kích thước chuẩn)    |
| `vibe-mart-favicon-180.png`  | 180×180    | `.png`    | Apple touch icon (iOS home screen)     |
| `vibe-mart-favicon-192.png`  | 192×192    | `.png`    | Android home screen, PWA (nếu bật)    |
| `vibe-mart-favicon-512.png`  | 512×512    | `.png`    | PWA splash (nếu bật), Android adaptive|
| `favicon.ico` _(bản copy)_   | 32×32      | `.ico`    | Next.js App Router convention: copy từ `vibe-mart-favicon-32.ico` ra `public/favicon.ico` để Next tự nhận |

## File hiện có

| File                                | Kích thước    | Nguồn                  |
|-------------------------------------|---------------|------------------------|
| `vibe-mart-logo-mark-on-square.png`     | 581×581 (228 KB)  | Designer upload 2026-10-09 — V trên nền vuông xanh |
| `vibe-mart-favicon-16.ico`          | 16×16         | Xuất LANCZOS từ on-square.png |
| `vibe-mart-favicon-16.png`          | 16×16         | Xuất LANCZOS từ on-square.png |
| `vibe-mart-favicon-32.ico`          | 32×32         | Xuất LANCZOS từ on-square.png |
| `vibe-mart-favicon-32.png`          | 32×32         | Xuất LANCZOS từ on-square.png |
| `vibe-mart-favicon-180.png`         | 180×180       | Apple touch icon (iOS) |
| `vibe-mart-favicon-192.png`         | 192×192       | Android home screen, PWA (nếu bật) |
| `vibe-mart-favicon-512.png`         | 512×512       | PWA splash, Android adaptive |
| `../../favicon.ico` _(bản copy)_    | 32×32         | Next.js App Router convention — copy từ `vibe-mart-favicon-32.ico` |

## File cần tạo thêm (tối thiểu) — _chưa có_

| File                                  | Kích thước | Ghi chú |
|---------------------------------------|------------|---------|
| `vibe-mart-favicon-48.ico`            | 48×48      | Kích thước trung gian cho Windows shortcut |
| `vibe-mart-favicon.ico` _(multi-size)_| 16+32+48   | File `.ico` gộp nhiều size (tùy tool) |

## Ghi chú kỹ thuật

- **Source gốc nên là SVG** (`vibe-mart-logo-mark-light.svg` ở thư mục `../logo/`), xuất ra nhiều kích thước raster.
- Background phải **đặc** (không trong suốt) để hiển thị tốt trên tab sáng + tab tối.
- Màu nền: brand chính `#0284C7` (theo `docs/CLAUDE.md` mục 3 token `brand`).
- File `.ico` đa kích thước: có thể gộp 16/32/48 vào 1 file `.ico` duy nhất (tùy tool xuất).
- Khi copy ra `public/favicon.ico`, Next.js App Router 16 sẽ tự động nhận và serve ở `/favicon.ico` — không cần khai báo trong metadata. Tab icon mặc định được khai báo trong `src/app/layout.tsx` (`metadata.icons.icon = "/images/vibe-mart-logo-mark-light.png"`).
- Nếu muốn dùng icon riêng cho Apple touch, khai báo trong `src/app/layout.tsx`:
  ```ts
  icons: {
    icon: '/images/vibe-mart-favicon-32.ico',
    apple: '/images/vibe-mart-favicon-180.png',
  }
  ```
- File `.gitignore`: thư mục này **KHÔNG** nằm trong `.gitignore` — favicon là asset production.
- **Công cụ tạo file**: dùng `rembg` với model `u2net` (chất lượng cao, 176MB) để xoá nền; resize bằng `PIL.Image.LANCZOS`. Script xử lý 1 lần, không lưu vào repo.
