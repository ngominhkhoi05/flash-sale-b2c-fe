# 2026-10-11 – SEO config (single source of truth)

## Scope

Tách phần SEO metadata (title, description, keywords, og:image, og:image:alt,
locale, siteUrl, themeColor) của toàn site ra **1 file TypeScript** duy nhất
ở `src/config/seo.config.ts`. Wire-up vào `RootLayout` để layout đọc
`defaultSeo` thay vì inline string.

| File | Loại | Mô tả |
|---|---|---|
| `src/config/seo.config.ts` | new | `SeoConfig` interface + `defaultSeo` + `pageSeo` + `resolveSeo(pageKey)` |
| `src/config/seo.config.test.ts` | new | 17 tests: required fields, length caps, ogImage URL, locale, pageSeo merge, immutability |
| `src/app/layout.tsx` | refactor | `metadata` đọc từ `defaultSeo`, thêm `openGraph` + `twitter` cards |
| `docs/superpowers/plans/2026-10-11-seo-config.md` | new | Plan docs |

## Tham khảo

- `node_modules/next/dist/docs/app/api-reference/functions/generate-metadata`
  (Next 16 `Metadata` API + `Viewport` API)
- `docs/CLAUDE.md` mục 11 (quy ước code) + 12.5 (commit message body)
- `.env.example` (`NEXT_PUBLIC_SITE_URL`)

## Quyết định design (đã chốt với user)

| Câu hỏi | Chọn |
|---|---|
| Scope | Global SEO config (1 file toàn site, không per-slide) |
| Format | TypeScript (typed, refactor-friendly) |

## Subplan

1. **Subplan 1 — Test RED**: viết 17 test cho contract (required fields, length caps, pageSeo merge, immutability).
2. **Subplan 2 — Implementation GREEN**: tạo `seo.config.ts` với `SeoConfig` + `defaultSeo` + `pageSeo` + `resolveSeo()`.
3. **Subplan 3 — Wire-up**: refactor `src/app/layout.tsx` import `defaultSeo` thay vì inline string.

Mỗi subplan độc lập, chạy tuần tự trong 1 session (không cần dispatch subagent).

## Test strategy

| Tầng | Test |
|---|---|
| `defaultSeo` shape | 8 tests: required, title ≤ 60, desc ≤ 160, keywords non-empty, ogImage format, ogImageAlt, siteUrl, siteName, themeColor, locale |
| `pageSeo` overrides | 3 tests: defined, home override, flashSale override |
| `resolveSeo()` | 4 tests: home merges, nonexistent falls back, immutability, shape |
| **Tổng** | **17 tests** |

## API / WS

Không có — pure config.

## Rủi ro

| Rủi ro | Xử lý |
|---|---|
| `process.env.NEXT_PUBLIC_SITE_URL` có thể undefined | Helper `resolveSiteUrl()` fallback về `http://localhost:3000`, không throw |
| Layout metadata có thể break nếu `defaultSeo` thiếu field | Test bắt buộc required fields |
| ogImage là path relative `/images/og-...jpg` (chưa có file) | Test cho phép cả absolute + relative; sau này designer tạo file |
| `pageSeo` bị mutate bởi caller | `resolveSeo()` trả về object mới (`{...defaultSeo, ...override}`) — test bắt buộc |

## Kết quả

- ✅ 32 test files, 291 tests pass (was 274, +17)
- ✅ TSC clean
- ✅ ESLint: 0 errors, 1 warning cũ
- ✅ Build: `npm run build` pass

## Notes

- `ogImage` dùng path relative (`/images/og-vibe-mart-default.jpg`) — khi file
  này tồn tại ở `public/images/` thì Next tự resolve qua request URL.
- Designer sẽ cần tạo 3 file OG: `og-vibe-mart-default.jpg` (1200x630),
  `og-vibe-mart-home.jpg`, `og-vibe-mart-flash-sale.jpg` — đã note trong
  commit message.
- `themeColor` từ `#0284c7` (cũ) → `#006194` (đồng bộ với `--color-primary`).
- Cấu trúc chuẩn bị cho `generateMetadata({ params })` per-page (chưa cần
  ngay vì chỉ 1 layout.tsx + page.tsx).
