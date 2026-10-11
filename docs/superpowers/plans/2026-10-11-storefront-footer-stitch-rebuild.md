# Plan – StorefrontFooter: rebuild theo Stitch (project 15206106541998912100)

**Date**: 2026-10-11
**Branch**: `feature/storefront-homepage-stitch` (đã có, không tạo nhánh mới)
**Owner**: agent (user review cuối)

## Scope

Sửa `src/components/storefront/StorefrontFooter.tsx` để khớp 4 cột của Stitch footer (screenshot trang chủ Storefront).

**Tham khảo**:
- Stitch: `projects/15206106541998912100/screens/33db6dd859b643bda103e6045378886b` (đã lưu tại `tmp/stitch/footer.html`)
- `docs/CLAUDE.md` mục 3 (design tokens), mục 5 (component tái sử dụng)
- `.cursor/rules/i18n.mdc` (locale vi/en)
- `.cursor/rules/component-pattern.mdc`

## Subplan

Đây là 1 subplan duy nhất (1 file component + 2 file i18n + 1 file test).

### Files thay đổi

| File | Loại | Lý do |
|---|---|---|
| `src/components/storefront/StorefrontFooter.tsx` | LOGIC (rewrite) | 4 cột concept khác hoàn toàn, 9 điểm delta |
| `src/components/storefront/StorefrontFooter.test.tsx` | LOGIC (new) | BẮT BUỘC theo testing-required.mdc |
| `messages/vi.json` | DATA (new keys) | Thêm key i18n cho hotline, payment, shipper, app, badge |
| `messages/en.json` | DATA (new keys) | Tương tự |
| `src/components/storefront/sections/home-mocks.ts` | KHÔNG đổi | Footer không dùng mock (data tĩnh trong component) |

### Footer Stitch 4 cột (spec)

| Cột | Nội dung | Component dùng |
|---|---|---|
| 1 — Brand | Logo + tagline (3-4 dòng) + badge "100% Hàng Chính Hãng • Đổi Trả Dễ Dàng" (icon `verified_user`, `bg-secondary-fixed/50 text-secondary rounded-lg`) | `<img>` cho logo, `<MaterialSymbol>` cho icon badge |
| 2 — Hỗ trợ khách hàng | **Headline** "Hỗ trợ khách hàng" (`font-headline-sm`); **Hotline 24/7: 1900 8888** (icon `headset_mic`, màu primary); **email** `cskh@vibemart.vn` (icon `mail`); **4 link** (FAQ / Hướng dẫn đặt hàng / Vận chuyển / Bảo hành) | `<MaterialSymbol>` + `<a>` |
| 3 — Thanh toán & Vận chuyển | **Headline** "Thanh toán & Vận chuyển"; label "Cổng thanh toán bảo mật:" + **6 pill** (Visa / Mastercard / MoMo / ZaloPay / VNPay / COD) `bg-surface-container rounded px-2.5 py-1 text-label-sm`; label "Đối tác vận chuyển tin cậy:" + **4 pill** (GHTK / GHN / Viettel Post / J&T) `bg-surface-container-high rounded` | `<span>` cho pill |
| 4 — Theo dõi & Tải ứng dụng | **Headline** "Theo dõi & Tải ứng dụng"; text "Quét mã QR để tải app Vibe Mart ngay:"; **QR placeholder** 80x80 (text "QR Code Vibe App") + **2 button** App Store / Google Play (icon `phone_iphone` / `android`); badge "Đã đăng ký Bộ Công Thương" (icon `verified`, `bg-surface-container-high text-primary rounded`) | `<div>` cho QR placeholder, `<span>` cho button |
| Bottom | "© 2026 Vibe Mart. Tất cả quyền được bảo lưu." (trái) + **3 link** (Điều khoản sử dụng / Chính sách bảo mật / Quy chế hoạt động) (phải) | `<p>` + `<a>` |

### Delta với hiện tại

1. Cột 1: thiếu badge "100% Hàng Chính Hãng" → THÊM
2. Cột 2: thiếu hotline + email → THÊM, giảm 5 link → 4 link
3. Cột 3: concept hoàn toàn sai (5 link lạ → 6+4 pill) → VIẾT LẠI
4. Cột 4: concept hoàn toàn sai (5 link lạ → QR + app + badge) → VIẾT LẠI
5. Cột "About Us" (cũ) → BỎ
6. Bottom: thêm 3 link pháp lý (chỉ có 1 span copyright cũ) → THÊM

### i18n keys (cần thêm)

Namespace `storefront.footer.*`:

| Key | vi | en |
|---|---|---|
| `trustBadge` | 100% Hàng Chính Hãng • Đổi Trả Dễ Dàng | 100% Authentic • Easy Returns |
| `colCustomerCare` | Hỗ trợ khách hàng | Customer Care |
| `hotlineLabel` | Hotline 24/7 | 24/7 Hotline |
| `hotlineNumber` | 1900 8888 | 1900 8888 |
| `supportEmail` | cskh@vibemart.vn | cskh@vibemart.vn |
| `links.helpCenter` (giữ) | Trung tâm trợ giúp & FAQ | Help Center & FAQ |
| `links.shoppingGuide` (giữ) | Hướng dẫn đặt hàng & Thanh toán | Ordering & Payment Guide |
| `links.shippingPolicy` (giữ) | Chính sách vận chuyển & Giao nhận | Shipping & Delivery Policy |
| `links.returnPolicy` (giữ) | Chính sách bảo hành & Đổi trả | Warranty & Return Policy |
| `colPaymentShipping` | Thanh toán & Vận chuyển | Payment & Shipping |
| `paymentGateways` | Cổng thanh toán bảo mật | Secure Payment Gateways |
| `shippingPartners` | Đối tác vận chuyển tin cậy | Trusted Shipping Partners |
| `colAppDownload` | Theo dõi & Tải ứng dụng | Follow & Download App |
| `qrAppDesc` | Quét mã QR để tải app Vibe Mart ngay: | Scan QR to download Vibe Mart app now: |
| `qrPlaceholder` | QR Code Vibe App | Vibe App QR Code |
| `appStore` | App Store | App Store |
| `googlePlay` | Google Play | Google Play |
| `ministryCert` | Đã đăng ký Bộ Công Thương | Registered with Ministry of Industry & Trade |
| `links.terms` | Điều khoản sử dụng | Terms of Use |
| `links.privacy` | Chính sách bảo mật | Privacy Policy |
| `links.operationRules` | Quy chế hoạt động | Operation Rules |

Keys **XÓA** (không còn dùng):
- `colAboutUs` (toàn bộ cột)
- `links.aboutUs`, `links.termsOfUse`, `links.privacyPolicy`, `links.careers`, `links.press`
- `colPayment` (cột 4 cũ)
- `address`, `businessLicense` (không có trong Stitch)

### Test (RED → GREEN)

File `src/components/storefront/StorefrontFooter.test.tsx` mới (vitest + RTL):

```tsx
describe("StorefrontFooter", () => {
  it("renders 4 columns", () => {...});
  it("renders brand logo + tagline + trust badge", () => {...});
  it("renders hotline number 1900 8888", () => {...});
  it("renders support email cskh@vibemart.vn", () => {...});
  it("renders 4 customer-care links", () => {...});
  it("renders 6 payment methods (Visa/Mastercard/MoMo/ZaloPay/VNPay/COD)", () => {...});
  it("renders 4 shipping partners (GHTK/GHN/Viettel Post/J&T)", () => {...});
  it("renders app download section with QR placeholder + App Store + Google Play + ministry badge", () => {...});
  it("renders bottom bar with copyright + 3 legal links", () => {...});
  it("uses semantic html (footer + headings h3)", () => {...});
  it("all links have valid href (not empty)", () => {...});
});
```

## Test strategy

- Component test (Vitest + RTL) — kiểm tra render đủ element
- Build: `npm run build` không lỗi
- Lint: `npm run lint` không lỗi
- Manual: mở trang chủ storefront, scroll xuống footer, đối chiếu Stitch

## Out of scope

- Tạo logo thật → dùng text "Vibe Mart" đậm với icon `shopping_bag` (Material Symbol) thay cho Google CDN
- QR code thật → dùng text placeholder 80x80 (giống Stitch wireframe)
- Real hotline/email → dùng mock value từ i18n key (admin sẽ đổi sau)
- Ảnh shipper / payment logo thật → dùng text pill (giống Stitch wireframe)

## Risks

| Risk | Mitigation |
|---|---|
| i18n key cũ bị xóa → component khác (nếu có) dùng key đó sẽ lỗi | Grep toàn repo trước khi xóa, đảm bảo chỉ footer dùng |
| `<img>` Google CDN URL vi phạm "no external assets" | Dùng `<MaterialSymbol>` icon + text "Vibe Mart" thay logo |
| Headline font-weight 700 (`font-bold`) có thể đậm hơn CLAUDE.md spec (label-lg 600) | Match Stitch ưu tiên hơn spec — ghi nhận trong Notes |
| 4 cột thay vì 5 (bỏ About Us) → có thể tăng khoảng trống giữa các cột | Stitch dùng `gap-space-xl` (32px) — đã áp dụng |

## Implementation order

1. Viết test RED (file `.test.tsx` mới, tất cả FAIL vì component cũ không có các element mới)
2. Run test → xác nhận FAIL đúng lý do
3. Rewrite `StorefrontFooter.tsx` theo spec
4. Cập nhật `messages/vi.json` + `messages/en.json` (add new keys, remove old keys)
5. Run test → xác nhận PASS
6. `npm run lint` + `npm run tsc --noEmit` → sạch
7. Auto-commit với message EN + body liệt kê file test

## Notes

- Stitch header "Hỗ trợ khách hàng" dùng `font-headline-sm text-headline-sm font-bold` (16-18px, 600-700) — KHÔNG uppercase tracking-wide như bản cũ. Áp dụng đúng Stitch.
- Pill `bg-surface-container` vs `bg-surface-container-high` có khác biệt nhẹ — pill payment dùng container, pill shipper dùng container-high. Stitch explicit.
- Logo Google CDN KHÔNG dùng → thay bằng `<MaterialSymbol name="shopping_bag" />` + text "Vibe Mart" bold 20px.
- Trust badge dùng `bg-secondary-fixed/50 text-secondary` (màu mint nhạt) — theo design system có secondary-fixed = `#6ffbbe`.
