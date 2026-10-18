# Handoff — BE team: Sửa WS 404 trên VPS `vibe-mart-utc2.canluaz.io.vn`

> **Tác giả**: FE team (`flash-sale-b2c-fe`)
> **Ngày**: 2026-10-18
> **Trạng thái**: ⏳ Chờ BE phản hồi
> **Mức độ**: 🔴 P1 — ảnh hưởng toàn bộ page có WebSocket (PDP flash sale, checkout realtime, countdown)

---

## 1. Tóm tắt triệu chứng

Trên môi trường production VPS `https://vibe-mart-utc2.canluaz.io.vn`, khi user vào **bất kỳ trang nào có mount `WsConnectionProvider`** (PDP `/products/{slug}`, checkout, flash sale, home), console trình duyệt spam lỗi:

```
GET https://vibe-mart-utc2.canluaz.io.vn/info?token=<JWT>&t=<timestamp> 404 (Not Found)

(anonymous) @ 1cf8xnpccspnk.js:6
webSocketFactory @ 1cf8xnpccspnk.js:6
_createWebSocket @ 1cf8xnpccspnk.js:6
_connect @ 1cf8xnpccspnk.js:6
_schedule_reconnect @ 1cf8xnpccspnk.js:6
onWebSocketClose @ 1cf8xnpccspnk.js:6
```

Stack trace cho thấy SockJS retry liên tục theo exponential backoff (3s → 6s → 12s → 30s), không bao giờ connect được. Kèm theo `Minified React error #441` (render exception do WS subscribe fail).

**Trên local (FE dev `http://localhost:3000` gọi backend `http://180.93.137.28:8080`): chạy bình thường.**

---

## 2. Root cause (FE đã verify)

### 2.1. Chuỗi sự kiện

1. FE build image Docker với `NEXT_PUBLIC_WS_URL=""` (theo template `.env.production.example` cũ — comment nói "để trống → SockJS tự dùng `window.location.host`").
2. Lúc runtime, `src/lib/stomp.ts` → `getWsUrl()` trả về chuỗi rỗng `""`.
3. SockJS nhận URL rỗng → tự fallback same-origin `https://vibe-mart-utc2.canluaz.io.vn/ws` (suy ra từ `window.location.host`).
4. Trước khi upgrade WebSocket, SockJS browser luôn gọi endpoint `/info` (server info) để kiểm tra server có hỗ trợ không.
5. Request `GET /info` được **Next.js dev/prod server** xử lý (vì same-origin) → Next.js **không có route `/info`** → trả **404 Not Found**.
6. SockJS không connect được → tự retry theo `WS_RECONNECT_BACKOFF_MS = [3000, 6000, 12000, 30000]`.

### 2.2. Tại sao local không lỗi

Local `.env` có `NEXT_PUBLIC_WS_URL=http://180.93.137.28/ws` → SockJS gọi **cross-origin** thẳng IP backend (180.93.137.28) → backend Spring Boot có handler SockJS `/info` → 200 OK → upgrade WebSocket thành công.

### 2.3. FE đã sửa gì (commit `fix/stomp-empty-env-error`)

- `src/lib/stomp.ts` → `getWsUrl()` **throw error sớm** khi `NEXT_PUBLIC_WS_URL` rỗng/undefined/whitespace (test đỏ → xanh).
- `.env.production.example` → comment cũ "để trống OK" là **SAI**, đã sửa thành hướng dẫn bắt buộc set giá trị.

→ Sau khi BE fix infra, FE chỉ cần set env đúng giá trị trong `.env.production` của container là chạy được.

---

## 3. Việc BE cần làm

### 🔧 Task 1 — Cấu hình Nginx reverse proxy (BẮT BUỘC)

**Mục tiêu**: Cho phép FE browser gọi `https://vibe-mart-utc2.canluaz.io.vn/ws` (same-origin), Nginx sẽ proxy sang backend Spring Boot `backend:8080/ws`.

**Snippets Nginx đề xuất** (paste vào server block của `vibe-mart-utc2.canluaz.io.vn`):

```nginx
# WebSocket SockJS endpoint — proxy sang backend Spring Boot
location /ws {
    proxy_pass http://backend/ws;   # hoặc http://<container-name>:8080/ws

    # WebSocket upgrade headers (BẮT BUỘC để upgrade thành công)
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Forward JWT để HandshakeAuthInterceptor phía BE đọc được
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeout dài cho WebSocket (BE spec heartbeat 10s, nên set > 30s)
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    # KHÔNG buffer request body
    proxy_buffering off;
}
```

**Verify sau khi config**:

```bash
# Từ server VPS, test Nginx config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Test bằng curl (KHÔNG cần browser, KHÔNG cần JWT)
curl -i https://vibe-mart-utc2.canluaz.io.vn/info
# Expect: 200 OK + JSON SockJS info {"entropy":...,"origins":[...],"cookie_needed":false,...}
```

Nếu response là HTML (Next.js 404 page) hoặc 404 → Nginx chưa proxy đúng, kiểm tra lại `location /ws` và `proxy_pass`.

### 📝 Task 2 — Cập nhật `.env.production` của FE container

Sau khi Nginx proxy xong, set env trong docker-compose hoặc frontend container:

```bash
NEXT_PUBLIC_WS_URL=https://vibe-mart-utc2.canluaz.io.vn/ws
```

(Giá trị này tương ứng với pattern Nginx proxy ở Task 1.)

Rebuild image FE và restart container.

### ✅ Task 3 — Verify end-to-end

1. Mở `https://vibe-mart-utc2.canluaz.io.vn/products/13` (hoặc bất kỳ trang PDP).
2. Mở DevTools → Network → WS filter.
3. Phải thấy:
   - 1 request `GET /info` → **200 OK** (không còn 404).
   - 1 connection WebSocket upgrade → status `101 Switching Protocols`.
4. Trigger 1 event flash sale (vd reserve slot) → nhận được STOMP message trên WS.

---

## 4. Câu hỏi / Cần BE xác nhận

| # | Câu hỏi | Mặc định nếu không phản hồi |
|---|---|---|
| 1 | Nginx đã có sẵn location `/ws` chưa, hay phải thêm mới? | Thêm mới (theo Task 1). |
| 2 | `proxy_pass http://backend/ws` — dùng service name `backend` hay IP `180.93.137.28:8080`? | Service name nếu là docker-compose; IP nếu là static. |
| 3 | Backend Spring Boot có handler SockJS `/ws` đang chạy ổn định không? (curl thẳng `http://180.93.137.28:8080/ws/info` phải trả 200 + JSON.) | Coi như ổn định (local FE đang gọi thành công). |

---

## 5. File liên quan (FE side, để BE tham khảo)

| File | Vai trò |
|---|---|
| `src/lib/stomp.ts` | Khởi tạo SockJS client, build URL từ `NEXT_PUBLIC_WS_URL` |
| `src/providers/WsConnectionProvider.tsx` | Mount STOMP ở root layout, auto-reconnect |
| `src/hooks/useFlashSaleWs.ts` | Hook subscribe stock/order events |
| `.env.production.example` | Template env cho FE container |

---

## 6. Tại sao KHÔNG phải bug BE

- Backend Spring Boot `/ws/info` hoạt động bình thường (FE local đã verify gọi thẳng được).
- Nguyên nhân là **FE env không được set** + **Nginx không proxy `/ws`** → request đi nhầm sang Next.js.
- Backend không cần đổi code.

---

## 7. Liên hệ

- FE owner: trang (Cursor session hiện tại)
- Backend owner: @BE-team
- Handoff này đặt tại: `flash-sale-b2c-fe/docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md`

Khi BE xong, ping lại FE để rebuild image với env đúng và verify.