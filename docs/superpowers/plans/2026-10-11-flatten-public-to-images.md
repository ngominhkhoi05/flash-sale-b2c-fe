# Plan: Flatten public/ into public/images/

## Scope

Di chuyển **tất cả** asset trong `public/` về `public/images/` (flatten), đổi reference ở `src/`, xoá folder rỗng.

### File move

| From | To |
|---|---|
| `public/images/vibe-mart-logo.png` | (giữ nguyên) |
| `public/brand/logo/vibe-mart-logo-lockup-light.png` | `public/images/vibe-mart-logo-lockup-light.png` |
| `public/brand/logo/vibe-mart-logo-lockup-light-transparent.png` | `public/images/vibe-mart-logo-lockup-light-transparent.png` |
| `public/brand/logo/vibe-mart-logo-lockup-dark.png` | `public/images/vibe-mart-logo-lockup-dark.png` |
| `public/brand/logo/vibe-mart-logo-lockup-dark-transparent.png` | `public/images/vibe-mart-logo-lockup-dark-transparent.png` |
| `public/brand/logo/vibe-mart-logo-mark-light.png` | `public/images/vibe-mart-logo-mark-light.png` |
| `public/brand/logo/vibe-mart-logo-mark-light-transparent.png` | `public/images/vibe-mart-logo-mark-light-transparent.png` |
| `public/brand/logo/README.md` | `public/images/brand-README.md` |
| `public/brand/favicon/vibe-mart-favicon-16.ico` | `public/images/vibe-mart-favicon-16.ico` |
| `public/brand/favicon/vibe-mart-favicon-16.png` | `public/images/vibe-mart-favicon-16.png` |
| `public/brand/favicon/vibe-mart-favicon-32.ico` | `public/images/vibe-mart-favicon-32.ico` |
| `public/brand/favicon/vibe-mart-favicon-32.png` | `public/images/vibe-mart-favicon-32.png` |
| `public/brand/favicon/vibe-mart-favicon-180.png` | `public/images/vibe-mart-favicon-180.png` |
| `public/brand/favicon/vibe-mart-favicon-192.png` | `public/images/vibe-mart-favicon-192.png` |
| `public/brand/favicon/vibe-mart-favicon-512.png` | `public/images/vibe-mart-favicon-512.png` |
| `public/brand/favicon/vibe-mart-logo-mark-on-square.png` | `public/images/vibe-mart-logo-mark-on-square.png` |
| `public/brand/favicon/README.md` | `public/images/favicon-README.md` |
| `public/storefront/logo.png` | `public/images/storefront-logo.png` |
| `public/storefront/default-avatar.svg` | `public/images/default-avatar.svg` |
| `public/favicon.ico` | (giữ nguyên — Next.js App Router convention) |
| `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg` | (giữ nguyên — Next.js default) |

### Tham khảo

- `docs/CLAUDE.md` mục 11 (quy ước code) — sửa UI text path OK vì chỉ là asset URL, không phải UI text.
- Quyết định user chat 2026-10-11: flatten TẤT CẢ về `public/images/`.
- Bảo toàn 2 file: `favicon.ico` ở root (Next tự nhận), default Next.js SVG (clean cho scaffold).

### Code references cần sửa

| File | Path cũ | Path mới |
|---|---|---|
| `src/components/auth/AuthBrandPanel.tsx:37` | `/brand/logo/vibe-mart-logo-lockup-light-transparent.png` | `/images/vibe-mart-logo-lockup-light-transparent.png` |
| `src/components/auth/AuthHeader.tsx:28` | `/brand/logo/vibe-mart-logo-lockup-light-transparent.png` | `/images/vibe-mart-logo-lockup-light-transparent.png` |
| `src/components/storefront/StorefrontHeader.tsx:69,167` | `/storefront/logo.png` | `/images/storefront-logo.png` |
| `src/components/storefront/StorefrontHeader.tsx:242` | `/storefront/default-avatar.svg` | `/images/default-avatar.svg` |
| `src/components/storefront/StorefrontFooter.tsx:48` | `/images/vibe-mart-logo.png` | (giữ nguyên) |
| `src/app/layout.tsx` (icons) | (chưa có) | thêm `icons.icon = "/images/vibe-mart-logo-mark-light.png"` |
| `src/components/storefront/StorefrontHeader.test.tsx:199` | (mô tả) | cập nhật comment mô tả path mới |

### Subplan

1. **Subplan A — Move file + xoá folder rỗng** (chạy thẳng, không cần subagent)
   - `git mv` từng file về `public/images/`
   - `rmdir` `public/brand/logo/`, `public/brand/favicon/`, `public/brand/`, `public/storefront/`
2. **Subplan B — Update src/ references** (chạy thẳng)
   - Sửa 5 file trong `src/` bằng `StrReplace`
3. **Subplan C — Update layout.tsx + test description** (chạy thẳng)
   - Thêm `icons.icon` vào metadata
   - Cập nhật comment trong test
4. **Subplan D — Verify** (chạy thẳng)
   - `npm run lint` + `npm run test` + `npx tsc --noEmit` + build smoke

### Test strategy

- Chạy `npm run test` — `StorefrontHeader.test.tsx` kiểm tra path cụ thể, cần pass.
- Chạy `npx tsc --noEmit` — không có type mới, chỉ đổi string.
- Chạy `npm run lint` — pass.
- Build smoke `npm run build` — Next phát hiện asset thiếu (404 trong log).
- Snapshot test cho trang chủ — không ảnh hưởng vì path string thay đổi không phá snapshot nếu ảnh thật vẫn load được. Nếu fail → cập nhật snapshot.

### Risk

- **Trung bình**: nhiều file move, dễ quên reference.
- Mitigate: `Grep` lại toàn bộ `src/` sau khi move để chắc không còn `/brand/` hay `/storefront/` path.
- Brand README mô tả path `../logo/`, `../../favicon.ico` — sẽ hỏng. Đổi tên thành `brand-README.md` + cập nhật path trong nội dung, hoặc xoá luôn (vì đã có comment ở layout.tsx). Tôi sẽ chỉnh sửa path trong nội dung.

### Tham khảo docs

- `docs/CLAUDE.md` — UI rule, không liên quan asset path.
- `.cursor/rules/no-overengineering.mdc` — không thêm PWA/dark mode, OK.
- `.cursor/rules/git-workflow.mdc` — pre-commit checklist (không có test mới, chỉ update 1 test description).
