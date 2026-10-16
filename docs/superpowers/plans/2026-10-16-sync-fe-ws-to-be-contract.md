# 2026-10-16 — Sync FE WebSocket config với BE contract

## 0. Bối cảnh

BE đã gửi hướng dẫn tích hợp WS trong `docs/handoffs/fe-ws-integration-guide (1).md` (v1.0, 2026-10-15). Hướng dẫn này **khác biệt lớn** so với code/rule hiện tại của FE:

| Concern | Hiện tại (rule + code) | BE yêu cầu |
|---|---|---|
| Endpoint | `/ws/flash-sale` (rule §1) hoặc `/ws` (lib/stomp.ts) | `/ws` |
| Auth | `Authorization: Bearer <token>` (rule §7) hoặc `?access_token=` (lib/stomp.ts) | **`?token=<access_token>`** (query param) |
| Event types | 5 (STOCK_UPDATED, SOLD_OUT, SLOT_STARTED, SLOT_ENDED, RESERVATION_CONFIRMED) | **10** (STOCK_DECREMENTED, STOCK_RESTORED, STOCK_RETURNED_UNSOLD, SLOT_ACTIVATED, SLOT_CLOSED, ORDER_RESERVED, ORDER_CANCELLED_TIMEOUT, ORDER_STATUS_CHANGED, PAYMENT_STATUS_CHANGED) |
| Topic paths | `/topic/flash-sale/<slotId>` (đơn giản) | `/topic/flash-sale/slot/{slotId}/stock-update` + `/topic/flash-sale/slot/{slotId}/status` + `/user/queue/flash-sale/...` |
| Hook signature | `useFlashSaleWs(destination, onMessage)` | `useFlashSaleWs({enabled, subscribeSlotIds, subscribeOrderCodes, onMessage})` |
| Store role | cache realtime metadata (slotIds, lastEventAt) | cache stock snapshot theo itemId + reservation/order state |
| WS = source of truth? | rule §5 nói "luôn refetch, không update state trực tiếp" | BE phụ lục A cho phép `setStock(itemId, availableStock)` trực tiếp trong Zustand |
| i18n status | Đã có `ORDER_STATUS_LABELS` cho 7 status | BE trả thêm `PAID`, `SHIPPED`, `CANCELLED` (khác tên enum) |

## 1. Scope thay đổi

### 1.1 Code logic (PHẢI có test)

1. `src/lib/stomp.ts` — đổi endpoint `/ws` + truyền token qua `?token=` query param (KHÔNG dùng Authorization header).
2. `src/hooks/useFlashSaleWs.ts` — đổi API surface từ `(destination, onMessage)` → `({enabled, subscribeSlotIds, subscribeOrderCodes, onMessage, destination?})` để tương thích ngược cho page hiện tại.
3. `src/providers/WsConnectionProvider.tsx` — refactor share 1 connection duy nhất + thêm state connection (connecting/connected/disconnected) cho UI chip "Đang kết nối lại…".
4. `src/stores/flash-sale.store.ts` — thêm fields: `stocks: Record<itemId, number>`, `lastReservation: { orderCode, expiresAt } | null`, `watchingOrders: Set<orderCode>`. KHÔNG xóa `byItem` (giữ để backward compat) — đổi tên thành `snapshots` nếu cần.
5. `src/features/flash-sale/types.ts` — export thêm `WsEvent` union type (10 events) + `WsEventType` enum + `WS_DESTINATION` helper (build destination path).
6. `src/lib/constants.ts` — thêm `WS_EVENT_TYPES`, `WS_DESTINATIONS`, `WS_RECONNECT_BACKOFF_MS` (mảng [3000, 6000, 12000, 30000]).

### 1.2 i18n + types

7. `src/lib/constants.ts` — thêm labels cho 5 status mới/sửa tên:
   - `PAID` (đã có trong PAYMENT_STATUS nhưng thiếu trong ORDER_STATUS — kiểm tra)
   - `SHIPPED` (BE dùng `SHIPPED` thay vì `SHIPPING` hiện tại)
   - `CANCELLED` (BE dùng status thuần `CANCELLED` cho cả seller cancel + buyer cancel)
8. `messages/vi.json` + `messages/en.json` — thêm keys cho `order.status.SHIPPED`, `order.status.CANCELLED` (nếu chưa có) + keys cho event toast (`ws.toast.orderReserved`, `ws.toast.orderCancelledTimeout`, ...).

### 1.3 Docs (KHÔNG cần test)

9. `.cursor/rules/websocket-realtime.mdc` — rewrite cho khớp BE guide.
10. `docs/CLAUDE.md` — thêm mục §13 về WebSocket contract (read-only, nhưng user đã duyệt cho sửa).

### 1.4 KHÔNG thuộc scope

- KHÔNG sửa API endpoint REST (chỉ WS).
- KHÔNG sửa logic Reserve/Payment/ZaloPay (chỉ sửa WS hook để nhận event).
- KHÔNG refactor `WsConnectionProvider` thành share-1-connection ở mức "mọi page dùng chung 1 client" (chỉ refactor để tránh duplicate client khi mount nhiều lần — tối thiểu để page hiện tại hoạt động).
- KHÔNG tạo feature folder mới cho WS (giữ ở `src/hooks/` + `src/stores/` + `src/lib/`).
- KHÔNG viết test E2E (xem `no-overengineering.mdc`).

## 2. Tham khảo

- `docs/handoffs/fe-ws-integration-guide (1).md` — source of truth từ BE.
- `docs/CLAUDE.md` §8 mục 2 — yêu cầu cũ "subscribe STOMP topic tồn kho + cập nhật StockBar qua queryClient.setQueryData, mất kết nối hiện chip Đang kết nối lại" (giữ nguyên nguyên tắc này).
- `.cursor/rules/websocket-realtime.mdc` — rule hiện tại sẽ được rewrite.
- `.cursor/rules/auth-jwt.mdc` §1, §7 — token storage.
- `.cursor/rules/state-management.mdc` §3 — Zustand patterns.
- `.cursor/rules/flash-sale-payment.mdc` §3 — StockProgressBar dùng `queryClient.setQueryData`.
- `.cursor/rules/testing-required.mdc` — TDD gate.

## 3. Subplan (chia theo concern, mỗi subplan 1 commit)

| # | Subplan | Concern | File | Test |
|---|---|---|---|---|
| 1 | Sửa stomp client + endpoint/auth | feat | `src/lib/stomp.ts` (+ `.test.ts`) | unit test cho URL build + query param |
| 2 | Đổi signature `useFlashSaleWs` hook | feat | `src/hooks/useFlashSaleWs.ts` (+ `.test.ts`) | unit test cho subscribe/unsubscribe + lifecycle |
| 3 | Refactor `WsConnectionProvider` share 1 connection + connection state | refactor | `src/providers/WsConnectionProvider.tsx` (+ `.test.ts`) | unit test cho connection state transitions |
| 4 | Mở rộng `flash-sale.store.ts` (stock, reservation, watching orders) | feat | `src/stores/flash-sale.store.ts` (+ `.test.ts`) | unit test cho setStock, lastReservation, watching |
| 5 | Thêm `WsEvent` types + `WS_DESTINATIONS` constants | feat | `src/features/flash-sale/types.ts` (+ `.test.ts`) + `src/lib/constants.ts` | unit test cho WS_DESTINATIONS builder |
| 6 | Thêm i18n labels cho status mới + event toasts | feat | `src/lib/constants.ts` + `messages/vi.json` + `messages/en.json` | snapshot test cho messages JSON |
| 7 | Rewrite `.cursor/rules/websocket-realtime.mdc` | docs | rule file | (không cần test) |
| 8 | Thêm mục §13 WS vào `docs/CLAUDE.md` | docs | doc file | (không cần test) |

**Quy ước chạy**: subplan 1-2-3-4-5 phụ thuộc nhau (hook dùng store + provider dùng stomp). Chạy **tuần tự** trong main session (general-purpose có thể chạy 1 cái, không parallel vì sửa cùng concern). Subplan 6-7-8 có thể chạy song song sau khi 1-5 xong (concern khác nhau).

## 4. Test strategy

### Unit tests (Vitest) — bắt buộc cho mọi file logic

| File test | Cover |
|---|---|
| `src/lib/stomp.test.ts` | URL build, query param token, no Authorization header, reconnect delay |
| `src/hooks/useFlashSaleWs.test.ts` | subscribe 3 loại destination (slot stock, order status, reservation), unsubscribe khi unmount, parse event đúng |
| `src/providers/WsConnectionProvider.test.tsx` | share 1 instance giữa nhiều component useWs(), connection status state transitions |
| `src/stores/flash-sale.store.test.ts` | setStock, reduceStock, restoreStock, setLastReservation, addWatchingOrder |
| `src/features/flash-sale/types.test.ts` | WS_DESTINATIONS builder cho 4 pattern (slot stock, slot status, order status, order updates, reservation) |
| `messages/vi.test.ts` + `messages/en.test.ts` | snapshot keys cho status mới + ws.toast.* |

### Manual smoke test

Sau khi tất cả test pass + lint/tsc pass → chạy `npm run dev`, mở `http://localhost:3000/flash-sale`, kiểm tra:
1. Page load → flash sale slots hiển thị (data từ REST).
2. Console hiển thị `[WS] Connected` nếu có token.
3. Không crash khi không có token (dev null) — fallback an toàn.
4. Hot reload không tạo duplicate connection.

### TDD order (cho mỗi subplan code)

1. RED — viết test cho behavior mới (vd: `stomp.test.ts` kiểm tra URL có `?token=...`).
2. RUN — test FAIL trên code cũ (hiện tại URL không có token).
3. GREEN — sửa code.
4. RUN — test PASS.
5. REFACTOR — clean code, giữ test xanh.

## 5. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Breaking change với page hiện dùng `useFlashSaleWs(destination, onMessage)` | Subplan 2 giữ signature cũ (deprecated), thêm signature mới với options object. TypeScript sẽ cảnh báo nơi nào dùng cũ — list trong commit body. |
| BE guide có thể update trong tương lai (event types mới) | `WS_EVENT_TYPES` + `WS_DESTINATIONS` constants → chỉ cần sửa 1 chỗ khi BE thêm event. |
| Token leak trong URL (query param) | URL chỉ gửi qua WSS/SockJS tới BE domain đã whitelist CORS — không gửi qua link. BE phát biểu đây là cách duy nhất vì browser không cho set header khi upgrade WS. |
| Test trùng giữa hook + store | Mỗi test file test 1 concern: hook test subscribe lifecycle, store test state mutation. |

## 6. Sau khi xong

- Báo cáo ở Bước 6 với format yêu cầu.
- Liệt kê nơi nào còn dùng signature cũ `useFlashSaleWs(destination, onMessage)` → follow-up PR.
- Liệt kê `TODO(api)` còn lại nếu event type BE chưa rõ semantics.