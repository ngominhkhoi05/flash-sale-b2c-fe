# Refactor — Đổi toàn bộ route sang tiếng Anh (URL English only)

> **Date**: 2026-10-12
> **Branch**: `refactor/english-routes` (tạo từ `dev`)
> **Owner**: FE agent
> **Scope**: Toàn bộ URL path trong storefront + auth + static + admin + seller, kèm `ROUTES` constant, i18n routing, AGENTS.md, tests.

---

## 1. Bối cảnh

`docs/CLAUDE.md` mục 2 quy định **tiếng Việt không dấu** (`/don-hang`, `/kho-voucher`).
`AGENTS.md` + `.cursor/rules/i18n.mdc` nói **tiếng Anh không dấu** (`/login`, `/orders`, ...).
Hai rule **mâu thuẫn** nhau. User chọn: **tiếng Anh** (đổi toàn bộ URL sang tiếng Anh không dấu, KHÔNG giữ URL Việt).

Cập nhật theo:
- `AGENTS.md` (rule index + dòng "URL tiếng Anh không dấu" — đã đúng)
- `.cursor/rules/i18n.mdc` (đã đúng)
- **KHÔNG sửa** `docs/CLAUDE.md` (read-only — user đã chọn "update_agents_only").

## 2. Mapping (VN → EN)

| Nhóm | URL cũ | URL mới | Ghi chú |
|---|---|---|---|
| Auth | `/dang-nhap` | `/login` | |
| Auth | `/dang-ky` | `/register` | |
| Auth | `/quen-mat-khau` | `/forgot-password` | |
| Auth | `/xac-thuc-email` | `/verify-email` | |
| Static | `/chinh-sach-bao-mat` | `/privacy` | |
| Static | `/dieu-khoan` | `/terms` | |
| Static | `/gioi-thieu` | `/about` | |
| Static | `/ho-tro` | `/support` | |
| Static | `/lien-he` | `/contact` | |
| Static | `/tro-giup` | `/help` | |
| Storefront | `/trang-chu` | `/` | **Trang chủ về root** — `/` thay cho `/trang-chu` |
| Storefront | `/flash-sale` | `/flash-sale` | (giữ — tiếng Anh sẵn) |
| Storefront | `/san-pham/[slug]` | `/products/[slug]` | |
| Storefront | `/tim-kiem` | `/search` | |
| Storefront | `/gio-hang` | `/cart` | |
| Storefront | `/thanh-toan` | `/checkout` | |
| Storefront | `/don-hang` | `/orders` | |
| Storefront | `/tai-khoan` | `/account` | |
| Storefront | `/kho-voucher` | `/vouchers` | |
| Storefront | `/dang-ky-ban-hang` | `/seller/register` | (chưa có folder) |
| Admin | `/admin/tong-quan` | `/admin` | (admin root) |
| Seller | `/seller/tong-quan` | `/seller` | (seller root) |
| Seller | `/seller/ho-so-cho-duyet` | `/seller/pending-review` | |
| System | `/bao-tri` | `/maintenance` | (kèm `?feature=...` query) |
| System | `/forbidden` | `/forbidden` | (giữ — tiếng Anh sẵn) |
| System | `/not-found` | `/not-found` | (giữ — tiếng Anh sẵn, App Router auto) |

**Lưu ý quan trọng về `/`**:
- Hiện `/` chưa có route — sau khi đổi, `src/app/page.tsx` sẽ được thêm để render trang chủ.
- Trước đó user vào `/trang-chu`, sau sẽ vào `/` (root).

## 3. Phạm vi thay đổi (estimate)

| Concern | File / Folder | Loại | Có test? |
|---|---|---|---|
| **Folder routes** (19 folder) | `src/app/**/<vn-name>/` → `src/app/**/<en-name>/` | rename | — |
| `src/app/page.tsx` | tạo mới (render trang chủ) | add | có (copy từ `trang-chu/page.test.tsx`) |
| `src/lib/constants.ts` | `ROUTES` object | edit | có (cần test ROUTES nếu có) |
| 36 test files | update `href` / route literal | edit | giữ nguyên (rename file kèm) |
| Link trong component | mọi `href="/...vn..."` | edit | theo test |
| `src/middleware.ts` | chưa có — KHÔNG thêm (out-of-scope) | — | — |
| `src/i18n/routing.ts` | `localePrefix` giữ `as-needed` | — | — |
| `AGENTS.md` | rule index đã đúng | edit 1 dòng | — |
| `.cursor/rules/i18n.mdc` | đã đúng | — | — |
| `.cursor/rules/routing-guards.mdc` | cập nhật ví dụ URL | edit | — |
| `.cursor/rules/docs-sync.mdc` | không liên quan | — | — |
| 3 plan cùng ngày (`maintenance`, `not-found`, `forbidden`) | KHÔNG cần update — plan đã ship | — | — |
| `docs/CLAUDE.md` | KHÔNG đụng (user chọn "agents_only") | — | — |

## 4. Test strategy

- **TDD (Bước 5.1)**: KHÔNG có behavior mới (chỉ đổi tên). Test hiện có cover render/Link/redirect → **update test cùng lúc** (không cần red→green, vì chỉ đổi string).
- **Coverage**: giữ nguyên — không tăng threshold.
- **Verify sau khi đổi**:
  - `npm run lint` PASS
  - `npm run test` PASS (36 test files)
  - `npm run tsc --noEmit` PASS
  - `npm run build` PASS
  - Grep `/dang-|/trang-|/gio-|/kho-|/tai-|/don-|/san-|/thanh-|/tim-|/quen-|/xac-|/bao-tri|/chinh-|/dieu-|/ho-tro|/lien-|/tro-giup|/gioi-thieu|/ho-so-cho-duyet|/tong-quan` → 0 hit
  - Grep `href="/...vn..."` → 0 hit

## 5. Subplan (Bước 2)

| # | Subplan | Model | Loại | Ghi chú |
|---|---|---|---|---|
| SP-1 | Rename folders + di chuyển test files | `general-purpose` | code | 19 folder rename, giữ git history (git mv) |
| SP-2 | Tạo `src/app/page.tsx` + chuyển nội dung từ `trang-chu/page.tsx` | `general-purpose` | code | |
| SP-3 | Update `src/lib/constants.ts` `ROUTES` + map đầy đủ | `general-purpose` | code | |
| SP-4 | Update tất cả `href` / `router.push` / test file tham chiếu URL cũ | `general-purpose` | code | chạy grep trước để có danh sách |
| SP-5 | Update rule files (`routing-guards.mdc`, `i18n.mdc`, `AGENTS.md`) | `general-purpose` | docs | |
| SP-6 | Verify: lint + test + tsc + build + grep | `general-purpose` | verify | |

**Quyết định**: vì task là rename thuần + có coupling chéo (SP-1 phải xong trước SP-4), tôi sẽ **chạy tuần tự trong main session** thay vì dispatch song song. Lý do:
- Có chuỗi phụ thuộc (SP-1 → SP-2 → SP-3 → SP-4)
- Cần audit thống nhất (không muốn 2 agent cùng sửa 1 file)
- Theo `workflow-process.mdc` Bước 2: "Task có chuỗi phụ thuộc (B phải chờ A) → chạy thẳng"

## 6. Audit file (Bước 5.0 — sẽ làm trước mỗi edit)

| File | Loại | Logic? | Cần test? |
|---|---|---|---|
| Folder rename | copy thuần (chỉ đổi tên) | — | rename kèm test |
| `src/lib/constants.ts` ROUTES | logic (centralized config) | có | update test nếu có ROUTES test |
| `src/app/page.tsx` (mới) | render → copy từ `trang-chu` | có | copy test kèm |
| 36 test files | logic (assert URL) | có | update path trong test |
| Component href | logic (navigation) | có | update test kèm |
| Rule `.mdc` | copy/doc | — | không |

## 7. Risk

| Risk | Mitigation |
|---|---|
| 19 folder rename → git history phức tạp | Dùng `git mv` cho từng folder (giữ lịch sử) |
| External link (3 plan vừa ship) dùng URL cũ | Plan đã ship, không sửa. Document trong commit body |
| Test file path cũ vẫn reference | Verify bằng grep 0 hit |
| 36 test files → dễ miss | Verify bằng `npm run test` |
| Build fail vì route cũ được import trong constant | Verify bằng `npm run build` + grep |

## 8. Commit strategy

Vì task là 1 concern (đổi URL), 1 commit duy nhất đủ — nhưng theo `git-workflow.mdc` mục "Nhiều concern trong 1 subplan", tôi sẽ **tách 2 commit**:

1. `refactor(routes): rename app folders from Vietnamese to English` (rename + tests rename)
2. `refactor(routes): update ROUTES constant and all href references` (constants + component refs)

Hoặc gộp 1 commit nếu user thích. Mặc định: **2 commit** để dễ review.

## 9. KHÔNG làm

- KHÔNG sửa `docs/CLAUDE.md` (user chọn agents_only)
- KHÔNG thêm redirect từ URL cũ → mới (project đồ án, chưa có traffic thật)
- KHÔNG thêm `middleware.ts` (out-of-scope)
- KHÔNG thêm `next.config.ts` redirect rule (chưa cần)
- KHÔNG đổi `localePrefix` trong i18n routing
- KHÔNG đổi UI text (chỉ URL)

## 10. Definition of Done

- [ ] 19 folder đã đổi tên (`git mv` giữ history)
- [ ] `src/app/page.tsx` tồn tại, render trang chủ
- [ ] `src/lib/constants.ts` `ROUTES` đã update
- [ ] 0 reference nào đến URL Việt cũ (grep verify)
- [ ] `npm run test` PASS (36 tests)
- [ ] `npm run lint` PASS
- [ ] `npm run tsc --noEmit` PASS
- [ ] `npm run build` PASS
- [ ] 2 commit (hoặc 1) trên `refactor/english-routes`
- [ ] Báo cáo Changes / Implementation / Tests / Notes
