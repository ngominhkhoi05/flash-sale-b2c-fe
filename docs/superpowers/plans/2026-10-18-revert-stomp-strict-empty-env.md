# Plan — Revert strict-empty check trong `src/lib/stomp.ts` (sửa bug VPS production 18/10/2026)

> **Date**: 2026-10-18
> **Branch**: `fix/revert-stomp-strict-empty-env` (đã tạo từ `origin/dev` lúc 22:50+7)
> **Scope**: Revert 1 phần của commit `fix/stomp-empty-env-error` (8ed08b5): đổi behavior từ "throw khi env rỗng" về "fallback an toàn" — để deploy trên VPS hôm nay có thể connect WS ngay (chờ BE Nginx fix sau).
> **Triggers**: Console browser trên `vibe-mart-utc2.canluaz.io.vn` spam `[stomp] NEXT_PUBLIC_WS_URL is empty. Set it to your backend SockJS endpoint.` Đồng thời 1 lỗi 401 `/api/v1/vouchers/platform` (giải quyết sau).

## 1. Background

### 1.1 Bug tái hiện

Trên `https://vibe-mart-utc2.canluaz.io.vn`, browser console liên tục:

```text
Uncaught Error: [stomp] NEXT_PUBLIC_WS_URL is empty. Set it to your backend SockJS endpoint.
Recommended: 'https://vibe-mart-utc2.canluaz.io.vn/ws' (Nginx reverse-proxies /ws to backend:8080/ws).
Or direct: 'https://<backend-host>/ws'. See docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md.
```

Đồng thời:

```text
GET https://vibe-mart-utc2.canluaz.io.vn/api/v1/vouchers/platform 401 (Unauthorized)
```

### 1.2 Lịch sử commit dẫn đến bug

| Commit | Date | Tác động |
|---|---|---|
| `feat(ws): sync STOMP client + provider to BE WS contract 2026-10-15` (54f245e) | 2026-10-16 | Sync code → dùng `?token=` query, heartbeat 10s, reconnect backoff 3s |
| `feat(ws): update useFlashSaleWs hook signature` (d5a9184) | 2026-10-16 | Options-object API |
| `fix(stomp): throw error when NEXT_PUBLIC_WS_URL is empty` (**8ed08b5**) | **2026-10-18 16:56** | **Thêm `throw` khi env rỗng** + thêm 3 test RED expect throw + cập nhật `.env.production.example` |
| `chore(lint): fix 40 eslint warnings` (3ffceea) | 2026-10-18 (sau) | Lint cleanup 30 file |

### 1.3 Tại sao bug xảy ra trên VPS

`.env.production.example` ghi rõ cách build Docker:

```dockerfile
docker build \
    --build-arg NEXT_PUBLIC_API_URL=/api/v1 \
    --build-arg NEXT_PUBLIC_WS_URL= \      # ← ĐỂ TRỐNG (giá trị = "")
    -f deploy-b2c-utc2/docker/frontend.Dockerfile .
```

`NEXT_PUBLIC_WS_URL=""` → code `getWsUrl()` throw ngay tại runtime → app không kết nối WS được. Trước commit `8ed08b5`, code fallback về `localhost:8080/ws` và tự hoạt động (SockJS resolve same-origin qua Nginx).

### 1.4 Tại sao user chọn phương án A

User chọn phương án 1 ("Revert fix throw → cho phép empty") vì:
- Bundle deploy đã được build với `NEXT_PUBLIC_WS_URL=""` → revert `getWsUrl()` về fallback sẽ connect được ngay.
- BE team vẫn chưa confirm Nginx đã proxy `/ws` (xem `docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md` — gửi sáng nay nhưng chưa có reply).
- Ưu tiên unblock production nhanh; fix "throw sớm" sẽ giữ lại làm defense-in-depth ở local dev (`console.warn` thay vì throw).

## 2. Tham khảo

- `.cursor/rules/websocket-realtime.mdc` §2 (auth handshake), §11 (KHÔNG).
- `.cursor/rules/stack-versions.mdc` (STOMP 7.x).
- `.cursor/rules/testing-required.mdc` — TDD bắt buộc (Bước 5.1).
- `.cursor/rules/workflow-process.mdc` — 6 bước + Bước 0.0 5 check parallel work.
- `.cursor/rules/git-workflow.mdc` — pre-commit 7 mốc + auto-commit policy.
- `docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md` — handoff cho BE (KHÔNG sửa, chỉ note).

## 3. Quyết định thiết kế

| # | Quyết định | Lý do |
|---|---|---|
| 1 | `getWsUrl()` cho phép env rỗng/undefined → fallback đến `<window.location.host>/ws` (chỉ tại runtime client, không SSR) | "Reconnect silent-fail đợi BE Nginx" là tốt hơn "crash app". Bug VPS 18/10/2026 chỉ 1 lần vì bundle mới + template cũ; revert giải quyết ngay. |
| 2 | Vẫn `console.warn` khi env rỗng (không throw) | Dev/prod vẫn biết env thiếu, nhưng app vẫn chạy. |
| 3 | Trim trailing slash vẫn giữ | Giữ nguyên rule cũ. |
| 4 | Không sửa `.env.production.example` (chỉ note trong commit body) | Template này phản ánh đúng cách build production qua Nginx proxy cùng host. Việc sửa template nằm ngoài scope revert này. |
| 5 | Cập nhật 3 test trong `src/lib/stomp.test.ts` từ `expect throw` → `expect fallback + console.warn` | TDD thuần: test phải fail trên code hiện tại (still throws) trước, pass sau khi sửa code. |

## 4. Subplan

### Subplan duy nhất (1 subagent, chạy thẳng)

**Vì sao 1 subplan**: chỉ 1 concern duy nhất (env-empty behavior trong `stomp.ts`), 2 file thay đổi, code + test cùng 1 module. Không có lý do tách subagent.

**File thay đổi**:
- `src/lib/stomp.ts` — `getWsUrl()` bỏ throw, thêm fallback an toàn + `console.warn` (file LOGIC, có test).
- `src/lib/stomp.test.ts` — sửa 3 test (dòng 67–93) từ `expect throw /NEXT_PUBLIC_WS_URL/` → `expect trimmed URL + console.warn` (file test LOGIC).

**File KHÔNG động**:
- `.env.production.example` — giữ nguyên, ghi nhận trong commit body là "out of scope".
- `docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md` — handoff vẫn đúng cho BE, không cập nhật.
- `src/hooks/useFlashSaleWs.ts` — chỉ là consumer của `createFlashSaleStompClient`; behavior fallback tự lan truyền.
- `src/providers/WsConnectionProvider.tsx` — không can thiệp, giữ logic reconnect backoff.

### Bước TDD

1. **RED**: `src/lib/stomp.test.ts` đã có 3 test (dòng 67–93) expect throw. **Hiện tại test PASS** trên code hiện tại (code throws) → phải **INVERT test TRƯỚC** thành "expect fallback + warn" → chạy test → expect FAIL (vì code vẫn throw). Sau đó mới sửa code.
2. **GREEN**: Sửa `getWsUrl()` → chạy test → expect PASS.
3. **REFACTOR**: Clean code (giữ test xanh).
4. **COMMIT**: Sau khi `npm run test` PASS + `npm run lint` PASS + `npx tsc --noEmit` PASS → auto-commit.

### Test RED (chi tiết 3 test cần invert)

| Test cũ (dòng) | Test mới |
|---|---|
| L67 `THROW error khi NEXT_PUBLIC_WS_URL không set` | `fallback về <window.location.host>/ws khi env undefined` (mock `window.location.host = "https://vibe-mart-utc2.canluaz.io.vn"`, expect SockJS URL = `"https://vibe-mart-utc2.canluaz.io.vn/ws?token=..."`) |
| L82 `THROW error khi NEXT_PUBLIC_WS_URL = chuỗi rỗng` | `fallback về <window.location.host>/ws khi env = ""` (expect URL có `vibe-mart-utc2.canluaz.io.vn/ws`, có `console.warn` được gọi) |
| L89 `THROW error khi NEXT_PUBLIC_WS_URL chỉ chứa whitespace` | `fallback về <window.location.host>/ws khi env = "   "` (whitespace coi như rỗng, có `console.warn`) |

**Mock `window.location`**: dùng `Object.defineProperty(window, 'location', { value: { host: '...', protocol: 'https:' }, writable: true })` (hoặc `vi.stubGlobal`).

## 5. Test Strategy

| File test | Thay đổi | Verify |
|---|---|---|
| `src/lib/stomp.test.ts` | **Sửa** 3 test (dòng 67–93) theo bảng trên + giữ nguyên 10 test còn lại | (a) 3 test mới PASS, (b) 10 test cũ vẫn PASS (regression), (c) `npm run test src/lib/stomp.test.ts` toàn bộ PASS, (d) `npm run test src/hooks/useFlashSaleWs.test.ts` + `src/providers/WsConnectionProvider.test.tsx` vẫn PASS (regression ở module láng giềng) |

**Lệnh verify**:

```bash
npx tsc --noEmit                                                 # 0 errors
npx vitest run src/lib/stomp.test.ts                             # toàn bộ pass
npx vitest run src/hooks/useFlashSaleWs.test.ts                  # regression
npx vitest run src/providers/WsConnectionProvider.test.tsx       # regression
npm run lint                                                     # 0 errors / 0 warnings mới
```

## 6. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Revert có thể khiến BE team chưa fix Nginx nhầm là "FE chấp nhận deploy sai" | Comment trong commit body ghi rõ: "Defense-in-depth disabled temporarily; revert ngay sau khi Nginx proxy /ws được verify" |
| R2 | Bundle prod chưa được rebuild sau commit này thì trên VPS vẫn throw | Khi commit, ghi trong commit body: "Cần rebuild Docker image prod sau khi merge" |
| R3 | `window` không tồn tại khi unit test chạy ở node (mặc dù vitest happy-dom vẫn có) | Trước khi test, kiểm tra `package.json#vitest.environment` — nếu là `happy-dom` hoặc `jsdom` thì OK; nếu `node` thì phải polyfill `window` trước. |
| R4 | Có 2 task `docs/superpowers/plans/2026-10-18-*` chưa merge ngày hôm nay có thể đụng `stomp.ts` | Đã check `git log --since="7 days ago" -- src/lib/stomp.ts` — không có commit nào khác trong 7 ngày ngoài `8ed08b5` (commit muốn revert) |
| R5 | `WsConnectionProvider.test.tsx` đã check behavior WS → nếu mình vô tình đổi `getWsUrl()` sai, có thể test láng giềng fail | Chạy đầy đủ `vitest run src/` để verify regression |
| R6 | Plan `2026-10-18-*` được reference trong commit message dạng `(see #XXX)` không tồn tại → dễ bị CI fail | KHÔNG reference issue number; chỉ ghi `See docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md` |
| R7 | Branch name đang vi phạm rule "không dấu tiếng Việt" — phải verify: `fix/revert-stomp-strict-empty-env` đã OK (chỉ ASCII). | Đã check: pass qua regex `^[a-z0-9-]+$`. |

## 7. Files Summary

**Sửa (2 files)**:

- `src/lib/stomp.ts` — `getWsUrl()` đổi behavior.
- `src/lib/stomp.test.ts` — 3 test (dòng 67–93) đổi expectation.

**Không động**:

- `.env.production.example` — note trong commit body.
- `docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md` — vẫn đúng.
- Toàn bộ modules khác (`useFlashSaleWs.ts`, `WsConnectionProvider.tsx`, ...).

## 8. Commits (theo git-workflow.mdc)

**1 commit duy nhất** (1 concern = 1 commit):

```text
fix(stomp): allow empty NEXT_PUBLIC_WS_URL with safe window.location fallback

- src/lib/stomp.ts: getWsUrl() no longer throws when env is empty/whitespace/
  undefined. Falls back to `${window.location.protocol}//${window.location.host}/ws`
  and emits console.warn so dev/prod still notices the misconfig.
- src/lib/stomp.test.ts: invert 3 tests that previously expected throw; now
  expect fallback URL + console.warn.

Why: Deploy bundle for VPS vibe-mart-utc2.canluaz.io.vn was built with
NEXT_PUBLIC_WS_URL="" (per .env.production.example comment for Nginx reverse-
proxy same-origin deployment), which caused the recent strict-empty check
(commit 8ed08b5) to throw at runtime, leaving WS unusable. Reverting the
strict throw restores connectivity. Once BE confirms Nginx /ws proxy works,
re-introduce strict throw behind a feature flag or env guard.

Test:
- src/lib/stomp.test.ts (modified): 3 tests inverted for fallback behavior,
  regression on 10 existing tests for URL/token encoding/heartbeat still
  pass.

Files kept (no change, mentioned for review):
- .env.production.example — comment reflects correct prod build pattern (empty
  env + Nginx proxy); decision to soften also affect this in future.
- docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md — BE handoff
  remains valid.

Deploy note: Must rebuild Docker image after merge to pick up new behavior.
```

## 9. Auto-commit Policy

Sau khi `npm run test` PASS + `npm run lint` PASS + `npx tsc --noEmit` PASS → **auto-commit** theo `git-workflow.mdc`. KHÔNG push (chờ user duyệt push).

## 10. Out of Scope

- Sửa `.env.production.example` template (out of scope revert).
- Verify Nginx config trên VPS (BE team phụ trách, xem handoff).
- Fix lỗi 401 `/api/v1/vouchers/platform` (user defer).
- Re-introduce strict throw dưới dạng feature flag (làm sau khi Nginx verified).
