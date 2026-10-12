# Plan — Gắn `/bao-tri` vào các tính năng chưa có (storefront header/footer)

| Field | Value |
|---|---|
| Date | 2026-10-12 |
| Branch base | `feature/maintenance-page-stitch` @ `2c14996` (vừa commit trang `/bao-tri`) |
| Goal | Mọi link `href="#"` / route chưa có page trong header + footer Storefront phải dẫn về `/bao-tri?feature=<code>` thay vì 404 hoặc không đi đâu |
| Type | feat (UX glue, không thêm tính năng mới) |
| Risk | Thấp — chỉ đổi `href` + i18n copy, không đổi component logic |
| Test | 6 file test header/footer phải update vì trước đó check `href="#"` thì giờ sẽ check `href` chứa `/bao-tri` |

## 1. Scope

### File sẽ sửa (3 file)

| # | File | Loại thay đổi | Có test? |
|---|---|---|---|
| 1 | `src/components/storefront/StorefrontHeader.tsx` | Đổi `href="#"` (3 chỗ) + `href="/danh-muc"` (1 chỗ) + avatar dropdown button → link tới `/bao-tri?feature=<code>` | Có (`StorefrontHeader.test.tsx`) |
| 2 | `src/components/storefront/StorefrontFooter.tsx` | Đổi `href="/ho-tro/huong-dan-dat-hang"` (3 chỗ sub-route chưa có) + App Store/Google Play (2 chỗ) | Có (`StorefrontFooter.test.tsx`) |
| 3 | `src/lib/constants.ts` | Thêm `MAINTENANCE_FEATURES` (feature code constants) | N/A (constant) |

### File sẽ sửa TEST (2 file)

| # | File | Lý do |
|---|---|---|
| 4 | `src/components/storefront/StorefrontHeader.test.tsx` | Test cũ không check link href → cần thêm 1 test "all hrefs are valid routes" |
| 5 | `src/components/storefront/StorefrontFooter.test.tsx` | Tương tự |

### File sẽ thêm (3 file mới)

| # | File | Lý do |
|---|---|---|
| 6 | `src/lib/constants.ts` (extend) | Thêm `MAINTENANCE_FEATURES` map `{ code: { labelVi, labelEn } }` |
| 7 | `src/components/maintenance/feature-code.ts` (mới) | Helper `getFeatureLabel(code, locale)` để `MaintenancePage` đọc feature từ URL `?feature=` |
| 8 | `src/components/maintenance/feature-code.test.ts` (mới) | Unit test cho helper |

### File KHÔNG động (giữ nguyên)

- `src/app/bao-tri/page.tsx` (đã xong)
- `src/components/maintenance/MaintenancePage.tsx` — chỉ **thêm prop** `featureCode?: string` để hiển thị label, KHÔNG redesign
- Logic component, design tokens, i18n namespace "maintenance" đã có

## 2. Feature codes (URL `?feature=`)

| Code | UI label (vi) | Áp dụng cho |
|---|---|---|
| `download-app` | "Tính năng tải ứng dụng" | Header top bar "Tải app" + Footer App Store/Google Play (2 chỗ) |
| `social-facebook` | "Tính năng kết nối mạng xã hội" | Header top bar "Facebook" |
| `social-zalo` | (cùng) | Header top bar "Zalo" |
| `language-switch` | "Tính năng chuyển ngôn ngữ" | Header top bar "Ngôn ngữ" button |
| `notifications` | "Tính năng thông báo" | Header icon "Thông báo" |
| `category` | "Danh mục sản phẩm" | Header nav pill "Danh mục" + Footer "Tìm theo danh mục" |
| `featured-brands` | "Trang Hãng nổi bật" | Header nav pill "Hãng nổi bật" |
| `best-sellers` | "Trang Bán chạy" | Header nav pill "Bán chạy" |
| `account-dropdown` | "Tuỳ chỉnh tài khoản" | Header avatar khi đã auth (bấm vào avatar phải mở dropdown — tạm thời redirect /bao-tri) |
| `search-submit` | "Tìm kiếm nâng cao" | Header search bar — form submit hiện không có handler → bấm Enter sẽ link tới `/bao-tri?feature=search-submit` |
| `help-shopping-guide` | "Hướng dẫn mua hàng" | Footer `/ho-tro/huong-dan-dat-hang` |
| `help-shipping-policy` | "Chính sách vận chuyển" | Footer `/ho-tro/chinh-sach-van-chuyen` |
| `help-return-policy` | "Chính sách đổi trả" | Footer `/ho-tro/chinh-sach-bao-hanh` |
| `app-store` | "Tải ứng dụng iOS" | Footer App Store |
| `google-play` | "Tải ứng dụng Android" | Footer Google Play |
| `seller-register` | "Đăng ký bán hàng" | Header top bar "Trở thành người bán" — route `/dang-ky-ban-hang` chưa có page |

**Tổng 15 chỗ sẽ gắn** (Header: 7 + Footer: 5 + helper: 3 nơi dùng lại).

## 3. i18n copy

Namespace `maintenance` đã có key `title`, `description`, `progress`, `note`. Thêm 3 key mới vào `vi.json` + `en.json`:

```json
{
  "maintenance": {
    "title": "Tính năng đang được nâng cấp",
    "description": "Chúng tôi đang hoàn thiện và tối ưu trải nghiệm {{feature}} để phục vụ bạn trọn vẹn hơn. Xin vui lòng quay lại sau ít phút.",
    "progress": "Tiến trình nâng cấp tự động",
    "note": "Dự kiến hoàn tất trong chốc lát. Đơn hàng, giỏ hàng và các hoạt động mua sắm khác của bạn vẫn diễn ra bình thường và được đảm bảo an toàn tuyệt đối.",
    "featureLabels": {
      "download-app": "Tính năng tải ứng dụng",
      "social-facebook": "Tính năng kết nối Facebook",
      "social-zalo": "Tính năng kết nối Zalo",
      "language-switch": "Tính năng chuyển ngôn ngữ",
      "notifications": "Trung tâm thông báo",
      "category": "Danh mục sản phẩm",
      "featured-brands": "Trang Hãng nổi bật",
      "best-sellers": "Trang Bán chạy",
      "account-dropdown": "Tuỳ chỉnh tài khoản",
      "search-submit": "Tìm kiếm nâng cao",
      "help-shopping-guide": "Hướng dẫn mua hàng",
      "help-shipping-policy": "Chính sách vận chuyển",
      "help-return-policy": "Chính sách đổi trả",
      "app-store": "Tải ứng dụng iOS",
      "google-play": "Tải ứng dụng Android",
      "seller-register": "Đăng ký bán hàng"
    }
  }
}
```

Pattern dùng `t('description', { feature: t('featureLabels.<code>') })` — giữ nguyên `{{feature}}` placeholder.

## 4. Test strategy

### Red-Green-Refactor

1. **Red**: Sửa test header/footer — assert mọi link href phải bắt đầu bằng `/` (không phải `#`).
2. **Green**: Sửa header/footer → link sang `/bao-tri?feature=<code>`.
3. **Refactor**: Helper `MAINTENANCE_LINKS` constant trong `constants.ts` để dùng chung, không hard-code URL.

### Test mới

| File | Test |
|---|---|
| `feature-code.test.ts` (mới) | `getFeatureLabel("download-app", "vi")` → "Tính năng tải ứng dụng"; invalid code → fallback "tính năng" |
| `StorefrontHeader.test.tsx` (extend) | Thêm `it("no link has href='#'", ...)` kiểm tra không còn `href="#"` |
| `StorefrontFooter.test.tsx` (extend) | Tương tự |
| `MaintenancePage.test.tsx` (extend) | Test prop `featureCode="download-app"` → description có chứa "Tính năng tải ứng dụng" |

## 5. Subplan

| # | Subplan | File | Độc lập? |
|---|---|---|---|
| 1 | Extend `constants.ts` + `feature-code.ts` helper | 1 const + 1 helper | OK |
| 2 | Update `MaintenancePage` để nhận `featureCode` prop | 1 component + 1 test extend | OK |
| 3 | Update `messages/{vi,en}.json` | 2 file i18n | OK |
| 4 | Update `StorefrontHeader.tsx` + test | 2 file | OK (đợi subplan 1) |
| 5 | Update `StorefrontFooter.tsx` + test | 2 file | OK (đợi subplan 1) |

**Có thể dispatch song song**: 1, 2, 3 chạy tuần tự (helper trước). Sau đó 4 + 5 song song.

## 6. Risk & rollback

- **Risk 1**: Search bar form submit vốn không có handler. Đổi thành `<Link>` thay vì `<button>` là phá UX. → **Giải pháp**: GIỮ `<button>` nhưng thêm `onClick={() => router.push(ROUTES.MAINTENANCE("search-submit"))}`. Test phải check button có handler.
- **Risk 2**: Avatar user area đang là `<div>` (không clickable). Thêm `onClick` cần convert thành `<button>`. → **Giải pháp**: wrap trong `<Link href={ROUTES.MAINTENANCE("account-dropdown")}>`.
- **Risk 3**: Test header cũ check `screen.getByText(/kênh người bán/i)` có thể fail nếu text bị split. → **Giải pháp**: đọc lại test trước khi sửa.
- **Rollback**: `git revert <commit>` — branch độc lập, chưa push.

## 7. Out of scope (KHÔNG làm trong plan này)

- Sửa trang `/dang-ky-ban-hang` thật (sẽ làm ở task khác)
- Implement dropdown thật cho avatar (chỉ redirect /bao-tri)
- Implement dropdown thật cho language switcher
- Sửa search bar logic (form submit thật)
- Redesign trang /bao-tri
- Tạo placeholder page cho `/danh-muc`, `/ho-tro/*`

## 8. Commit strategy

Mỗi concern 1 commit:

1. `feat(maintenance): add feature codes helper + extend i18n`
2. `feat(maintenance): accept featureCode prop in MaintenancePage`
3. `feat(storefront): link header placeholder buttons to /bao-tri`
4. `feat(storefront): link footer placeholder links to /bao-tri`

Mỗi commit phải pass: test + lint + TS + build.

## 9. Approval

User đã chọn:
- Approach: **Đổi href từ `#`/route 404 → `/bao-tri?feature=<code>`** (option 1)
- Scope: **Tất cả 12 chỗ** (HIGH + MEDIUM + LOW)

Branch base: `feature/maintenance-page-stitch` @ `2c14996` (tiếp tục trên branch này, commit mới sẽ layer trên).
