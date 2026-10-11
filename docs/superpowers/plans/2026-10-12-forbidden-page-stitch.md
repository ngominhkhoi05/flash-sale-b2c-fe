# Plan: Forbidden (403) Page — Stitch-Pixel-Perfect

> **Source of design**: Stitch screen `projects/15206106541998912100/screens/8bea7c520e7f4d2c8896e7771210450a`
> "Màn hình Lỗi 403 - Vibe Mart" (DESKTOP 2560×2048)
> **Yêu cầu user**: giống toàn bộ mọi thứ (visual + copy + icon), đụng tất cả file liên quan.
> **Branch**: `feat/forbidden-page-stitch` (đã tạo từ `origin/dev` ở Bước 0.1)

## 1. Scope

Biến `src/app/forbidden/page.tsx` từ stub 22 dòng → trang 403 đầy đủ theo thiết kế Stitch.

## 2. Tham khảo (Source of Truth priority)

1. **Stitch source HTML** (đã tải về `docs/superpowers/plans/stitch-403-source.html`) — nguyên mẫu.
2. **Stitch screenshot** (`docs/superpowers/plans/stitch-403-screenshot.png`) — visual reference.
3. `docs/CLAUDE.md` § 3 (design tokens), § 6 (i18n), § 10 (responsive & a11y).
4. `tailwind.config.ts` — KHÔNG tồn tại (Tailwind 4 dùng `@theme` trong `globals.css` → đã đủ tokens).
5. `src/app/globals.css` — đã khai báo đủ tokens: `primary`, `primary-fixed`, `primary-fixed-dim`, `surface-container`, `surface-container-low`, `surface-container-lowest`, `surface-container-highest`, `secondary`, `secondary-fixed`, `secondary-container`, `tertiary`, `outline`, `outline-variant`, … + spacing tokens `space-xs/sm/md/lg/xl` + typography tokens `display-lg`, `headline-sm`, `body-lg`, `body-sm`, `label-md`, `label-sm`, `label-lg`.
6. `src/app/layout.tsx` — Material Symbols font đã load sẵn ở `<head>`.
7. `src/components/ui/material-symbol.tsx` (nếu có) — helper render icon.
8. `next-intl` — sẵn (`I18nProvider` mount ở root, locale `vi` default).

## 3. Cấu trúc thiết kế Stitch cần tái dựng

| Vùng | Nội dung | Stitch class gốc | Map sang dự án |
|---|---|---|---|
| Background watermark | "shopping_bag VIBE MART" mờ 3% | `bg-surface` + `opacity-[0.03]` + `material-symbols-outlined text-[120px]` + `font-display-lg text-[100px]` | Giữ nguyên (token đủ) |
| Glow backdrop 1 | Blob xanh primary mờ | `bg-primary-fixed-dim/20 blur-3xl` | OK |
| Glow backdrop 2 | Blob secondary mờ | `bg-secondary-container/30 blur-2xl` | OK |
| Brand tag pill | "🛍 Vibe Mart Security • ID: 403-FORBIDDEN" | `bg-surface-container rounded-full` + icon `shopping_bag filled` + label `text-label-md` + divider dot + `text-outline text-label-sm tracking-widest` | OK |
| Centerpiece shield | Circle gradient `from-primary-fixed via-surface-container-low to-surface-container` → circle trắng → icon `shield_lock` filled 56px + dot ping secondary | `rounded-full` × 2 layers | OK |
| Sub-pill "Khu vực giới hạn" | `lock` icon 16px + text-label-sm | `bg-surface-container-highest border-outline-variant/30` | OK |
| Heading H1 | "Bạn không có quyền truy cập" | `font-display-lg text-display-lg` | OK |
| Body paragraph | "Tài khoản hiện tại của bạn chưa được cấp thẩm quyền xem phân hệ này. Vui lòng xác thực bằng tài khoản quản trị hoặc liên hệ bộ phận hỗ trợ chủ gian hàng." | `font-body-lg text-body-lg text-on-surface-variant max-w-lg leading-relaxed` | OK |
| Primary button | "🏠 Về trang chủ" → `href="/"` | `bg-primary text-on-primary px-7 py-3.5 rounded-xl shadow-md hover:bg-primary-container` | **Sửa href → `/trang-chu`** (CLAUDE.md § 2: URL tiếng Việt không dấu) |
| Ghost button | "🔄 Đăng nhập tài khoản khác" → `href="/login?ref=forbidden_retry"` | `bg-surface-container-lowest text-on-surface px-7 py-3.5 rounded-xl shadow-sm hover:bg-surface-container` | **Sửa href → `/dang-nhap?ref=forbidden_retry`** (route project) |
| Role diagnostic capsule | "Phiên đăng nhập hiện tại" + badge "Khách mua hàng" + "user_guest_8924@vibemart.local • Cần quyền STORE_ADMIN" | `bg-surface-container-low rounded-xl p-space-md` | OK |
| Footer support | "✉ Hỗ trợ kỹ thuật: hotro@vibemart.vn" + "📞 Hotline 24/7: 1900 8888" | `text-outline font-body-sm` | OK |

## 4. Thay đổi so với Stitch (bắt buộc để khớp dự án)

| # | Stitch | Dự án | Lý do |
|---|---|---|---|
| 1 | `<a href="/">` (primary) | `<a href="/trang-chu">` | CLAUDE.md § 2: URL tiếng Việt không dấu |
| 2 | `window.location.href = '/login?ref=forbidden_retry'` (ghost) | `<a href="/dang-nhap?ref=forbidden_retry">` | CLAUDE.md § 2 |
| 3 | Inline `onclick="handleSwitchAccount()"` JS | Server Component + `<a>` thuần (no JS) | Stitch preview; production là App Router RSC |
| 4 | Inline `style="font-variation-settings: 'FILL' 1;"` | Dùng `<MaterialSymbol variant="filled" />` (nếu có) hoặc class riêng | Helper đã có `src/components/ui/material-symbol.tsx` |
| 5 | All copy inline | Extract vào `messages/vi.json` + `messages/en.json` namespace `error.forbidden.*` | i18n.mdc (bắt buộc) |

## 5. File sẽ thay đổi

| File | Loại | Lý do |
|---|---|---|
| `src/app/forbidden/page.tsx` | modify (logic + UI) | Tái dựng UI theo Stitch |
| `src/components/forbidden/ForbiddenPage.tsx` | add | Tách component cho testable (RSC nhưng tách để viết test) |
| `src/components/forbidden/ForbiddenPage.test.tsx` | add | Test render + 2 link href đúng |
| `messages/vi.json` | modify | Thêm namespace `error.forbidden.*` (8 keys) |
| `messages/en.json` | modify | Thêm namespace `error.forbidden.*` (8 keys tương ứng) |
| `docs/superpowers/plans/stitch-403-source.html` | ref (không commit) | Lưu local làm tham chiếu — gitignore hoặc xoá sau commit |
| `docs/superpowers/plans/stitch-403-screenshot.png` | ref (không commit) | Lưu local — gitignore hoặc xoá |

**Quyết định về file ref**: để vào `docs/superpowers/plans/2026-10-12-stitch-403-source.html` (rename) + `.gitignore` cho extension `.html` tạm. Hoặc xoá sau khi code xong. Tôi sẽ **gitignore 2 file này** để không commit.

## 6. i18n keys mới (namespace `error.forbidden`)

```jsonc
// vi
"forbidden": {
  "brandTag": "Vibe Mart Security",
  "idBadge": "ID: 403-FORBIDDEN",
  "restrictedZone": "Khu vực giới hạn",
  "title": "Bạn không có quyền truy cập",
  "description": "Tài khoản hiện tại của bạn chưa được cấp thẩm quyền xem phân hệ này. Vui lòng xác thực bằng tài khoản quản trị hoặc liên hệ bộ phận hỗ trợ chủ gian hàng.",
  "primaryAction": "Về trang chủ",
  "secondaryAction": "Đăng nhập tài khoản khác",
  "sessionLabel": "Phiên đăng nhập hiện tại",
  "sessionRole": "Khách mua hàng",
  "sessionEmail": "user_guest_8924@vibemart.local",
  "requiredRole": "STORE_ADMIN",
  "requiredRolePrefix": "Cần quyền",
  "supportLabel": "Hỗ trợ kỹ thuật:",
  "supportEmail": "hotro@vibemart.vn",
  "hotlineLabel": "Hotline 24/7:",
  "hotlineNumber": "1900 8888"
}
```

```jsonc
// en (mirror)
"forbidden": {
  "brandTag": "Vibe Mart Security",
  "idBadge": "ID: 403-FORBIDDEN",
  "restrictedZone": "Restricted zone",
  "title": "You don't have access",
  "description": "Your current account has not been granted permission to view this area. Please verify with an administrator account or contact store support.",
  "primaryAction": "Back to home",
  "secondaryAction": "Sign in with another account",
  "sessionLabel": "Current session",
  "sessionRole": "Customer",
  "sessionEmail": "user_guest_8924@vibemart.local",
  "requiredRole": "STORE_ADMIN",
  "requiredRolePrefix": "Requires role",
  "supportLabel": "Technical support:",
  "supportEmail": "hotro@vibemart.vn",
  "hotlineNumber": "1900 8888",
  "hotlineLabel": "24/7 Hotline:"
}
```

## 7. Test strategy

1. **Component test** (`ForbiddenPage.test.tsx`):
   - Render heading + description đúng nội dung i18n.
   - Primary action href = `/trang-chu`.
   - Secondary action href = `/dang-nhap?ref=forbidden_retry`.
   - Brand tag pill hiển thị đầy đủ 3 phần: icon + "Vibe Mart Security" + dot + "ID: 403-FORBIDDEN".
   - Support email link `mailto:`.
   - Hotline link `tel:`.
   - Role diagnostic capsule hiển thị required role với màu tertiary.
2. **i18n parity**: verify vi.json + en.json đều có đủ 17 keys.
3. **Build & lint**:
   - `npm run build` (Next 16) pass.
   - `npm run lint` pass.
   - `npx tsc --noEmit` pass.

## 8. Subplan (chia plan → subagent)

| Subplan | Model | Concern | Output |
|---|---|---|---|
| 1. `feat(forbidden): re-design 403 page theo Stitch` | `general-purpose` | UI + i18n + tests | Tất cả file thay đổi |

Vì task này **thuộc 1 concern duy nhất** (UI 1 trang) + tất cả file đều phụ thuộc nhau (i18n ↔ page ↔ test), chạy thẳng không cần subagent. Theo `workflow-process.mdc` Bước 2: "Task nhỏ (< 3 file logic) → chạy thẳng".

## 9. Rủi ro

| Rủi ro | Mitigation |
|---|---|
| Material Symbols filled variant chưa đúng cách render | Verify với helper `material-symbol.tsx` (nếu có) hoặc dùng class Material Symbols CSS class |
| Pixel-perfect không khớp 100% do Stitch preview dùng Tailwind CDN khác config | Dự án dùng tokens `@theme` đã match; ưu tiên đúng token, đúng spacing scale, đúng typography class |
| `border-outline-variant/30` (Tailwind 4 opacity modifier syntax) có thể không generate class | Test bằng `npm run build`; nếu fail, dùng inline style `bg-[color-mix(...)]` |
| Test fail vì RSC không cho hook test client | Tách component phần interactive (link/button) sang Client Component nếu cần; còn lại RSC |

## 10. Commit strategy

1 commit duy nhất (1 concern):
```
feat(forbidden): redesign 403 page to match Stitch (8bea7c52)

- Rewrite src/app/forbidden/page.tsx with brand watermark,
  glow backdrop, shield centerpiece, role diagnostic capsule,
  and support footer per Stitch design system.
- Extract all copy to messages/{vi,en}.json namespace
  error.forbidden.* (17 keys each).
- Add ForbiddenPage.test.tsx (render + href + i18n parity).
- Map Stitch primary action href "/" -> /trang-chu
  and secondary action href "/login" -> /dang-nhap
  per CLAUDE.md § 2 (URL tiếng Việt không dấu).
- Replace inline JS onclick with semantic <a> link (RSC).

Test:
- src/components/forbidden/ForbiddenPage.test.tsx (added)
```

**Sẽ KHÔNG commit** 2 file tham chiếu `stitch-403-source.html` + `stitch-403-screenshot.png` (sẽ thêm vào `.gitignore` nếu cần — hoặc xoá sau khi verify).

## 11. Out of scope

- Không sửa `not-found.tsx` (404) dù thiết kế tương tự (user yêu cầu chỉ 403).
- Không thêm animation `animate-ping` nếu test fail reduce-motion (đã có global rule trong globals.css).
- Không tạo component Common mới (vd `SecurityShieldCard`) — phạm vi quá nhỏ, inline được.
- Không touch middleware/proxy/auth flow.
