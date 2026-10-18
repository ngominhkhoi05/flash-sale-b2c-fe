# Handoff — BE: Cart add-to-cart fails với `[object Error]` (nghi CORS preflight)

> Ngày: 2026-10-18 | Từ: FE team | Đến: BE team | Mức độ: **HIGH** (block UX flow chính)

## TL;DR

User báo "không thể thêm sản phẩm vào giỏ hàng" trên FE chạy ở `http://localhost:3000`, gọi tới BE production ở `http://180.93.137.28`. Console chỉ in `[object Error]` (không có ApiError) → nghi vấn cao là **CORS preflight fail** ở BE, không phải bug logic cart.

FE đã fix xong phần debuggability (commit `953e184`). **KHÔNG cần sửa gì thêm trên FE**. Cần team BE kiểm tra và sửa CORS.

## Triệu chứng chính xác

### FE Console (browser DevTools)

```
[cart.useAddToCart] { error: '[object Error]', variables: { quantity: 1, variantId: 14 } }
    at Object.t1 [as onError] (file://.../src_1j_gewx._.js:3116:21)
    at async handleAddToCart (file://.../src_2080yqv._.js:2608:17)
```

### FE Network tab (cần user verify)

Cần kiểm tra request `POST http://180.93.137.28/api/v1/cart/items`:
- **Nếu status `(failed)` hoặc `CORS error`**: confirm CORS preflight fail.
- **Nếu status 4xx/5xx thật từ server**: bug logic, không phải CORS.

## Bằng chứng CORS là nghi vấn cao nhất

| # | Bằng chứng | File/Source |
|---|---|---|
| 1 | FE `.env` line 1: `NEXT_PUBLIC_API_URL=http://180.93.137.28` | `flash-sale-b2c-fe/.env` |
| 2 | FE dev chạy ở `http://localhost:3000` | Next.js dev server |
| 3 | → Cross-origin: `localhost:3000` → `180.93.137.28` | Tính chất CORS |
| 4 | `fetch` throw `TypeError: Failed to fetch` → FE in `[object Error]` | `flash-sale-b2c-fe/src/lib/api/client.ts` (đã fix ở commit 953e184 để in rõ hơn) |
| 5 | BE `application.yaml` line 119 default CORS: `http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000` | `flash-sale-b2c-UTC2/src/main/resources/application.yaml` |
| 6 | BE `application-prod.yaml` line 48 cũng default như vậy, đọc env `CORS_ALLOWED_ORIGINS` | `flash-sale-b2c-UTC2/src/main/resources/application-prod.yaml` |
| 7 | BE CorsConfig có fix cho credentialed CORS nhưng vẫn cần origin được list | `flash-sale-b2c-UTC2/src/main/java/com/b2c/flash_sale_b2c_UTC2/config/CorsConfig.java` |

## Hướng dẫn verify

### 1. Check biến môi trường BE production

SSH vào server `180.93.137.28` (hoặc check qua PM2/systemd env) và xem:

```bash
# Nếu dùng PM2:
pm2 env <app-name> | grep CORS_ALLOWED_ORIGINS

# Hoặc nếu dùng systemd:
systemctl show <service-name> | grep -i cors
```

Nếu biến **không tồn tại** hoặc **không chứa `http://localhost:3000`**, đó là root cause.

### 2. Test trực tiếp từ terminal

```bash
# Preflight OPTIONS:
curl -X OPTIONS http://180.93.137.28/api/v1/cart/items \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  -i

# Response phải có:
#   Access-Control-Allow-Origin: http://localhost:3000
#   Access-Control-Allow-Credentials: true
#   Access-Control-Allow-Methods: POST
#   Access-Control-Allow-Headers: content-type,authorization
```

Nếu thiếu `Allow-Origin: http://localhost:3000` → confirm CORS fail.

## Hướng sửa (cho team BE quyết)

### Option A: Set env `CORS_ALLOWED_ORIGINS` cho prod (khuyến nghị)

```bash
# Thêm vào env deploy:
CORS_ALLOWED_ORIGINS=https://vibe-mart-utc2.canluaz.io.vn,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

Restart BE service.

### Option B: Hard-code localhost vào `application-prod.yaml` (KHÔNG khuyến nghị vì mất 12-Factor)

Mở `application-prod.yaml` line 48, sửa default:

```yaml
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:https://vibe-mart-utc2.canluaz.io.vn,http://localhost:3000}
```

### Option C: Mở rộng CorsConfig để auto-allow localhost trong dev (cần check thêm)

Đã có logic convert `*` → `null` (CorsConfig line 48-50). Có thể thêm rule: nếu origin là `localhost` hoặc `127.0.0.1` → tự allow (dù có credentials). Cẩn thận với security, chỉ làm khi đã review.

## Sau khi BE sửa xong

User sẽ:
1. Reload FE ở `localhost:3000`
2. Test lại "Thêm vào giỏ" với product `sac-du-phong-pro-6`, variantId=14, quantity=1
3. Verify toast "Đã thêm vào giỏ" + badge cart ở header tăng lên
4. Nếu vẫn lỗi → quay lại team BE, gửi Network tab screenshot

## Reference

- FE plan: `docs/superpowers/plans/2026-10-18-cart-api-error-network-wrap.md`
- FE commit: `953e184` (branch `fix/cart-api-error-network-wrap`)
- BE files liên quan:
  - `src/main/java/com/b2c/flash_sale_b2c_UTC2/config/CorsConfig.java`
  - `src/main/java/com/b2c/flash_sale_b2c_UTC2/config/SecurityConfig.java`
  - `src/main/resources/application.yaml` (line 119)
  - `src/main/resources/application-prod.yaml` (line 48)
- Endpoint bị ảnh hưởng: `POST /api/v1/cart/items` (CartController line 45-52)
- Related: tất cả POST/PUT/DELETE cross-origin request từ FE đều có thể bị ảnh hưởng (giỏ hàng, order, checkout, payment, ...)
