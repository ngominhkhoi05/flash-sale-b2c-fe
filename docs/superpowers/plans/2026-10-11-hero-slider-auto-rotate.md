# 2026-10-11 – Hero Slider auto-rotate

## Scope

Biến **HeroBannerSection** tĩnh (1 slide cứng) thành **carousel 4 slides** có
auto-rotate, pause-on-hover, manual click, a11y đầy đủ.

| File | Loại | Mô tả |
|---|---|---|
| `src/components/storefront/sections/useCarousel.ts` | new | Hook state + auto-rotate + reduced-motion + pause/resume |
| `src/components/storefront/sections/useCarousel.test.ts` | new | 10 tests (RED → GREEN) |
| `src/components/storefront/sections/HeroBannerSection.tsx` | refactor | Tách `HeroSlideContent` + dùng `useCarousel` |
| `src/components/storefront/sections/HeroBannerSection.test.tsx` | new | 10 tests cho render + click dot + auto-advance + pause + a11y |
| `src/components/storefront/sections/home-mocks.ts` | modify | Thêm `HERO_SLIDES: HeroSlide[]` (4 slides) |
| `messages/vi.json` + `messages/en.json` | modify | Thêm `hero.ariaLabel` + `hero.slides[0..3]` |
| `src/app/(storefront)/trang-chu/__snapshots__/page.test.tsx.snap` | auto-update | HTML đổi (4 slides vs 1) → snapshot cập nhật |

## Tham khảo

- `docs/CLAUDE.md` mục 3 (design tokens), 4 (quy tắc UX), 5 (component dùng chung), 11 (quy ước code)
- `.cursor/rules/component-pattern.mdc` mục 3.2 (cva), 10 (next/image)
- `.cursor/rules/i18n.mdc` mục 5 (error key)
- `docs/i18n-convention.md` mục 7 (checklist khi thêm key)
- `src/components/ui/material-symbol.tsx` (allow-list icon names)

## Quyết định design (đã chốt với user)

| Câu hỏi | Chọn |
|---|---|
| Animation | Cross-fade 700ms |
| Số slide | 4 (đúng số dots hiện có) |
| Auto-rotate | 5s + pause on hover/focus + respect `prefers-reduced-motion` |

## Subplan

1. **Subplan 1 — Hook**: Viết `useCarousel` + test hook (10 tests).
2. **Subplan 2 — Data + i18n**: Thêm `HERO_SLIDES` + i18n keys.
3. **Subplan 3 — Component**: Refactor `HeroBannerSection` + test component (10 tests).
4. **Subplan 4 — Snapshot**: Update homepage snapshot vì HTML đổi.

Mỗi subplan độc lập, có thể chạy tuần tự trong 1 session (không cần dispatch subagent).

## Test strategy

| Tầng | Test |
|---|---|
| Hook | 10 tests: initial, advance, wrap, goTo, out-of-range, pause, resume, cleanup, reduced-motion (2) |
| Component | 10 tests: render region, 4 slides, slide 0 active, dots, click dot, auto-advance, mouseenter/leave, focus/blur, reduced-motion, ARIA |
| Snapshot | Cập nhật tự động (HTML 4 slides) |
| i18n parity | Pass — 9 tests |

## API / WS

Không có — pure UI.

## Rủi ro

| Rủi ro | Xử lý |
|---|---|
| React 19 cấm truy cập ref trong render | Pattern: `useEffect` đọc `matchMedia` + `useState` mirror |
| File HeroBannerSection dài | Tách `HeroSlideContent` sub-component (mỗi file < 200 dòng) |
| Test dùng `vi.useFakeTimers` + `act()` | Pattern chuẩn React 19 + Testing Library |
| `<img>` vs `next/image` | Giữ `<img>` (mock URL Google CDN, không qua Next optimizer); warning lint OK vì cũ |

## Kết quả

- ✅ 31 test files, 271 tests pass (was 251, +20)
- ✅ TSC clean
- ✅ ESLint: 0 errors, 9 warnings (cũ)
- ✅ i18n parity: 9 tests pass
- ✅ Build: `npm run build` pass
- ✅ Snapshot updated

## Notes

- Image URL hiện dùng Google CDN public (từ Stitch reference). Khi backend có CDN thật, chỉ thay `imageUrl` trong `home-mocks.ts`.
- 4 gradient variants: primary/secondary/tertiary đều dùng (phân biệt rõ từng slide, đúng rule §3 "Một vùng nhìn tối đa 3 màu").
- Cross-fade 700ms + `prefers-reduced-motion` tôn trọng rule a11y mục 10.
- Arrow key navigation wired: `ArrowLeft/ArrowRight` chuyển slide (focus tabindex 0 trên region).
- `tabIndex={-1}` trên Link của slide inactive → không tab vào CTA ẩn.
