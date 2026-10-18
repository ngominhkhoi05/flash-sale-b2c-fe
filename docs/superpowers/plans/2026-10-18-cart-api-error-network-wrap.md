# Fix: apiFetch throw plain Error khi network fail (cart add-to-cart bug) + điều tra BE root cause

> Plan tạo: 2026-10-18 | Cập nhật: 2026-10-18 (sau khi đọc BE) | Trạng thái: open | Branch FE: `fix/cart-api-error-network-wrap` | Branch BE: (chưa tạo, chờ user verify)

## 1. Background (bug gốc)

User báo: "tôi không thể thêm sản phẩm vào giỏ hàng". Console error:

```
[cart.useAddToCart] { error: '[object Error]', variables: { quantity: 1, variantId: 14 } }
    at Object.t1 [as onError] (file://.../src_1j_gewx._.js:3116:21)
    at async handleAddToCart (file://.../src_2080yqv._.js:2608:17)
```

Server log: tương tự, `error = [object Error]`.

## 2. Root cause — phát hiện sau khi đọc BE repo

### 2.1 Bug FE thật (code-level, vi phạm rule error-handling.mdc mục 2)

Trong `src/lib/api/client.ts` dòng 290-302, khi `fetch()` throw (network error, CORS preflight fail, DNS fail, server down), `err` là plain `Error` (vd `TypeError: Failed to fetch`), KHÔNG phải `ApiError`. `retries` mặc định 0 → loop chạy 1 lần → `if (lastError instanceof Error) throw lastError` → throw plain Error.

Hệ quả:

1. **`ProductDetailPage.onError` fail rẽ nhánh `instanceof ApiError`**: code rơi vào nhánh `else` → toast "Không thể cập nhật giỏ hàng. Vui lòng thử lại." — UX kém.
2. **Debug khó**: `console.error({ error, variables })` in ra `{ error: '[object Error]', ... }` vì `Error.prototype.toString()` mặc định trả `"[object Error]"`. Mất luôn message thật.
3. **Vi phạm `error-handling.mdc` mục 2**: rule yêu cầu "apiFetch throw ApiError khi response không OK" — bao gồm cả case không có response (network fail, CORS fail).

### 2.2 Nghi vấn root cause sâu hơn — CORS preflight fail từ BE

Căn cứ khi đọc BE repo:

| Bằng chứng | Chi tiết |
|---|---|
| FE `.env` line 1 | `NEXT_PUBLIC_API_URL=http://180.93.137.28` (remote server, không phải localhost) |
| User chạy FE | `http://localhost:3000` (Next.js dev server) |
| → Cross-origin request | `localhost:3000` → `180.93.137.28` (khác origin) |
| BE `application.yaml` line 119 | `cors.allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000}` — đọc từ env |
| BE `application-prod.yaml` line 48 | Cũng đọc `CORS_ALLOWED_ORIGINS` từ env, default giống |
| Hậu quả | Nếu BE prod KHÔNG set env `CORS_ALLOWED_ORIGINS` (hoặc set khác `localhost:3000`) → preflight OPTIONS trả `Access-Control-Allow-Origin` KHÔNG chứa `localhost:3000` → browser block request có credentials → `fetch` throw `TypeError: Failed to fetch` |

→ Triệu chứng `[object Error]` cho thấy rất có thể **CORS preflight fail ở BE prod**, không phải logic bug.

**Cần user verify** (KHÔNG agent tự quyết):
- Mở browser DevTools → Network tab → gọi "Thêm vào giỏ" → check request `POST /api/v1/cart/items`:
  - Status `CORS error` hoặc `(failed)` trong DevTools → confirm CORS
  - Status 4xx/5xx từ server → không phải CORS, là bug logic
- Hoặc check response trên terminal BE: có log `Business Exception` / `Unhandled System Exception` không?
- Hoặc check biến `CORS_ALLOWED_ORIGINS` ở deploy `180.93.137.28` (cần SSH/PM2 env)

### 2.3 Format error response BE (cần biết cho FE)

Khi BE có lỗi, `ApiResponse.error()` trả:

```json
{ "success": false, "code": 500, "message": "Lỗi máy chủ nội bộ không xác định", "data": null, "timestamp": "..." }
```

Đặc điểm: `code` là **number** (HTTP status), KHÔNG phải string. Khi FE `apiFetch` parse:

```ts
const errCode = payload?.code ?? payload?.error?.code ?? `HTTP_${res.status}`;
```

→ `errCode = 500` (number) → truyền vào `ApiError({ code: 500 })` (TypeScript expect string nhưng runtime OK). Khi `ProductDetailPage.onError` gọi `t("error.500")` → undefined → fallback toast.

Ngoài ra, nếu request fail vì Security filter (401, 403), SecurityConfig trả raw map (line 50-77) cũng dùng `code: HttpStatus.UNAUTHORIZED.value()` = 401 (number). Tương tự lỗi tương tự.

## 3. Scope

### File sẽ thay đổi (FE — chắc chắn)

| File | Loại | Lý do |
|---|---|---|
| `src/lib/api/client.ts` | sửa | Wrap plain Error → ApiError ở cuối retry loop + ApiError override toString |
| `src/lib/api/client.test.ts` | sửa | Thêm 3 test RED |

### File KHÔNG thuộc scope (defer)

- `src/components/product-detail/ProductDetailPage.tsx` — đã có fallback toast
- `src/features/cart/hooks.ts` — đã đúng pattern
- **BE**: KHÔNG tự sửa — nếu user confirm là CORS, sẽ tạo branch BE riêng

## 4. Tham khảo

- `.cursor/rules/error-handling.mdc` mục 2 (ApiError class), mục 3 (throw vs catch)
- `.cursor/rules/testing-required.mdc` mục "TDD Workflow"
- `src/lib/api/client.ts` dòng 8-23 (ApiError class), 290-302 (loop)
- BE: `CorsConfig.java`, `application.yaml` line 119, `application-prod.yaml` line 48
- BE: `GlobalExceptionHandler.java`, `ApiResponse.java`, `CommonErrorCode.java`

## 5. Test strategy (TDD)

### 3 test mới trong `client.test.ts` (RED trước)

1. **network fail → ApiError code='NETWORK_ERROR', status=0**
2. **AbortError → ApiError code='REQUEST_ABORTED'** (lưu ý: DOMException trong jsdom không `instanceof Error` — cần handle)
3. **ApiError.toString() trả format chứa code+status+message**

## 6. Implementation

### Edit 1: `client.ts` dòng 8-23 — ApiError custom toString

```ts
toString(): string {
  return `[ApiError ${this.code} ${this.status}]: ${this.message}`;
}
```

### Edit 2: `client.ts` dòng 290-302 — wrap plain Error thành ApiError

```ts
if (lastError instanceof ApiError) throw lastError;
if (lastError) {
  const errName = (lastError as { name?: string }).name;
  if (errName === "AbortError") {
    throw new ApiError({ status: 0, code: "REQUEST_ABORTED", message: "Yêu cầu đã bị huỷ" });
  }
  if (lastError instanceof Error) {
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: `Mất kết nối mạng hoặc máy chủ không phản hồi: ${lastError.message}`,
      details: { originalName: lastError.name, originalMessage: lastError.message },
    });
  }
  // Fallback cho non-Error throw (vd DOMException trong jsdom)
  throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Mất kết nối mạng hoặc máy chủ không phản hồi" });
}
```

## 7. Subplan

| # | Subplan | Loại | Output |
|---|---|---|---|
| 1 | Viết 3 test RED trong `client.test.ts` | code | 3 test FAIL |
| 2 | Fix `apiFetch` exit point + ApiError.toString | code | 3 test PASS |
| 3 | Auto-commit FE + báo cáo | commit | 1 commit |
| 4 | (Sau khi user verify) Nếu CORS fail → mở branch BE riêng | commit BE | TBD |

## 8. Risks

- Fix FE không giải quyết được nếu root cause là CORS (Plan §2.2 đã liệt kê verify)
- DOMException không `instanceof Error` trong jsdom → đã handle bằng check `name` trước
- Fix chỉ giải quyết debug/UX, không thay đổi root cause behavior

## 9. Commit

- Branch FE: `fix/cart-api-error-network-wrap` (đã tạo từ `dev@0c9b707`)
- Message: `fix(api): wrap network errors as ApiError for consistent error handling`
- KHÔNG push — chờ user duyệt

## 10. Next steps

1. User verify root cause (CORS hay logic) qua Network tab.
2. Nếu CORS fail → tạo branch BE `fix/cors-allow-frontend-origin` từ `dev@d0d949f`:
   - Có thể cần sửa `CorsConfig.java` hoặc `application-prod.yaml` để accept `localhost:3000`
   - Hoặc set env `CORS_ALLOWED_ORIGINS` cho prod chứa `https://vibe-mart-utc2.canluaz.io.vn` (đã có ở FE `.env` `NEXT_PUBLIC_SITE_URL`)
3. Nếu không phải CORS → bug ở variantId/stock/session, FE đã handle qua `instanceof ApiError` (sau khi fix wrap).
