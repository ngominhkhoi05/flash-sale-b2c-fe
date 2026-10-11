# 2026-10-11 – feature/storefront-hero: Push prep

## Tóm tắt branch

- **Branch mới**: `feature/storefront-hero` (rename từ `feature/hero-slider`)
- **Base**: `origin/dev` @ `1307079`
- **Commits ahead of dev**: 9
- **Commits behind dev**: 0 (không cần merge dev vào)
- **Conflicts**: 0

## 9 commit mới (theo thứ tự thời gian, mới nhất trên đầu)

| # | Hash | Type | Message |
|---|---|---|---|
| 1 | `fd91751` | fix | give each hero slide a unique Unsplash image |
| 2 | `a50f9bf` | test | add guard against copy-paste hero image URLs |
| 3 | `a1faf64` | refactor | wire RootLayout metadata to defaultSeo + add OG/Twitter cards |
| 4 | `0676176` | feat | add site-wide SEO config with type-safe overrides |
| 5 | `ba29768` | refactor | simplify HeroSlide data + drop unused i18n text |
| 6 | `01453d0` | refactor | make HeroBanner full-image click-through, drop text overlay |
| 7 | `ce9fa5e` | refactor | convert HeroBanner to auto-rotating 4-slide carousel |
| 8 | `cfcf9ed` | feat | add 4 hero slides data + i18n keys |
| 9 | `ba935a1` | feat | add useCarousel hook with auto-rotate + a11y |

## Quality gate (pre-push)

| Check | Status |
|---|---|
| `npx vitest run` | ✅ 32 files, 292 tests pass |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx eslint src/...` | ✅ 0 errors, 8 warnings (đều cũ, không từ task này) |
| `npm run build` | ✅ Compiled successfully |

## Tổng scope thay đổi

| Concern | Loại | Mô tả |
|---|---|---|
| `src/hooks/useCarousel.ts` | new | Hook carousel: auto-rotate, pause, dot nav, reduced-motion |
| `src/components/storefront/sections/HeroBannerSection.tsx` | refactor | Carousel image-only, click anywhere → ctaHref |
| `src/components/storefront/sections/HeroBannerSection.test.tsx` | new + update | 14 tests (TDD red→green) |
| `src/components/storefront/sections/home-mocks.ts` | refactor | 4 slide data + 4 distinct Unsplash images |
| `src/config/seo.config.ts` | new | Type-safe SEO config: defaultSeo + pageSeo + resolveSeo() |
| `src/config/seo.config.test.ts` | new | 17 tests (TDD red→green) |
| `src/app/layout.tsx` | refactor | Wire RootLayout metadata to defaultSeo + add OG/Twitter cards |
| `src/app/(storefront)/trang-chu/page.test.tsx` | update | Drop h1 assertion (hero không còn text) |
| `src/app/(storefront)/trang-chu/__snapshots__/page.test.tsx.snap` | update | Match new HTML structure |
| `messages/vi.json` + `messages/en.json` | update | Bỏ hero text i18n keys (giữ ariaLabel) |
| `docs/superpowers/plans/2026-10-11-*.md` | new | 3 plan docs |

## Push command (CHỜ user duyệt)

```bash
git push -u origin feature/storefront-hero
```

## Risk assessment

- ✅ Branch tên EN, không dấu (`feature/storefront-hero` — 23 chars, hyphens OK)
- ✅ Không có file "lạ" lẫn vào (working tree sạch)
- ✅ Không có conflict với dev
- ✅ Không có force push (chỉ push 9 commit mới)
- ⚠️ 1 file untracked: `docs/superpowers/plans/2026-10-11-default-logo-remove-transparent.md` — file từ session trước, KHÔNG commit để giữ commit clean
