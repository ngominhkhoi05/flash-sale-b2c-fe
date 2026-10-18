# Plan: Bỏ header `X-User-Id` khỏi FE apiFetch (fix CORS preflight)

**Date**: 2026-10-18
**Branch**: `fix/remove-x-user-id-header`
**Author**: Cursor Agent
**Status**: Ready for review

## 1. Context (vấn đề)

Browser ở `http://localhost:3000` không gọi được tới BE `http://180.93.137.28/api/v1/**` (CORS preflight fail). BE đã whitelist origin `http://localhost:3000` (xem `docs/handoffs/2026-10-18-fe-cors-fix.md`) nhưng vẫn fail vì thiếu 1 header: **`X-User-Id`**.

**Test evidence** (2026-10-18, PowerShell `Invoke-WebRequest`):
- `OPTIONS /api/v1/auth/register` với header `content-type, x-user-id, accept` → **204 OK**, nhưng `Access-Control-Allow-Headers` trả về:
  ```
  Authorization, Content-Type, Accept, Origin, X-Requested-With, Idempotency-Key, X-Idempotency-Key
  ```
  → **Không có `X-User-Id`**.

**Root cause**:
- `src/lib/api/client.ts:230` tự động gắn `X-User-Id: <userId>` vào mọi request.
- `X-User-Id` không nằm trong BE `CorsConfig.allowedHeaders`.
- Browser đọc `Access-Control-Allow-Headers` response → thấy header mình vừa request không có → block.

**Audit kết quả**:
| File | Có đọc `X-User-Id`? |
|---|---|
| `src/lib/api/client.ts` | ❌ Chỉ là producer (gửi đi) |
| `src/proxy.ts` | ❌ Không |
| `src/middleware.ts` | ❌ Không tồn tại |
| `src/app/**` (Server Components) | ❌ Không |
| `docs/api-contract.md` | ✅ Mô tả "quy ước tạm thời", đã lỗi thời vì Auth đã xong |

→ `X-User-Id` là **dead header** (gửi thừa, BE không đọc, đang gây CORS block).

## 2. Scope

### Files thay đổi

| File | Loại | Thay đổi |
|---|---|---|
| `src/lib/api/client.ts` | SỬA LOGIC | Xóa 3 chỗ: (a) `getCurrentUserId` + `setMockUserId` helpers (dòng 93-112), (b) JSDoc mention `X-User-Id` (dòng 208), (c) `finalHeaders["X-User-Id"]` (dòng 230). |
| `docs/api-contract.md` | SỬA DOCS | Cập nhật mục 3 (quy ước header) — bỏ `X-User-Id`, chỉ giữ `Authorization: Bearer`. Cập nhật mục 2.5 (Buy Now) — bỏ `X-User-Id` khỏi Headers. |
| `src/lib/api/client.test.ts` | KHÔNG SỬA | Test chỉ check URL, không check header `X-User-Id`. |
| `.env`, `.env.example`, `next.config.ts` | KHÔNG SỬA | Không liên quan. |

### Files KHÔNG thay đổi

- Tất cả `src/features/*/api.ts` (chỉ dùng `apiFetch`, không truy cập `getCurrentUserId`).
- Tất cả `.test.ts(x)` khác (không test `getCurrentUserId`).
- BE config (repo khác).

## 3. Tham khảo

- `.cursor/rules/flash-sale-b2c-api.mdc` — contract rules.
- `.cursor/rules/auth-jwt.mdc` — `Authorization: Bearer <access_token>` là source of truth.
- `docs/handoffs/2026-10-18-fe-cors-fix.md` — BE đã whitelist origin, thiếu header.
- `docs/api-contract.md` mục 3 — note "Khi Auth hoàn tất, header này sẽ thay thế bằng `Authorization: Bearer <JWT_TOKEN>`".

## 4. Subplan

1 subplan (chạy thẳng vì < 3 file, < 50 dòng thay đổi).

## 5. Test strategy

### Manual verification (post-change)

```bash
# Test 1: preflight không còn request X-User-Id
Invoke-WebRequest -Uri "http://180.93.137.28/api/v1/auth/register" -Method OPTIONS `
  -Headers @{
    "Origin" = "http://localhost:3000"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "content-type,authorization"   # bỏ x-user-id
  }
# Expected: 204 + Allow-Headers chứa content-type, authorization

# Test 2: thực tế gọi register từ browser
# Mở http://localhost:3000/register, submit form
# Expected: không còn CORS error trong DevTools
```

### Automated

- `npm run test` — chạy tất cả test, expect pass.
- `npm run lint` — pass.
- `npm run tsc --noEmit` — pass.

## 6. Risk

| Risk | Mức | Mitigation |
|---|---|---|
| Có code nào khác đọc `X-User-Id` từ server? | Thấp | Đã Grep toàn repo — không có. |
| Test nào cover `getCurrentUserId`? | Thấp | `client.test.ts` chỉ check URL, không check. |
| BE có thật sự không cần `X-User-Id`? | Trung bình | BE hợp đồng: xác thực qua JWT. `docs/api-contract.md` đã ghi "sẽ thay thế bằng Authorization". |

## 7. Commit strategy

**1 commit duy nhất** (concern: fix CORS):
```
fix(api): remove X-User-Id header to fix CORS preflight block

- Remove getCurrentUserId/setMockUserId helpers from client.ts
- Stop sending X-User-Id in every request
- Update docs/api-contract.md to reflect Authorization-only auth

Test:
- Manual: OPTIONS preflight now succeeds without X-User-Id in request
- npm run test: pass
- npm run lint: pass

Files copy only (no test required):
- docs/api-contract.md: text-only update reflecting new auth convention
```

## 8. Out of scope

- Sửa BE `CorsConfig.java` (repo khác, báo BE team).
- Rollback auth changes (Auth đang chạy OK qua `Authorization: Bearer`).
- Tối ưu thêm headers khác (idempotency-key đã có trong allow list, không cần đụng).
