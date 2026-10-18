# Plan — FE WS Integration Future-Focused Guide

> **Ngày**: 2026-10-18
> **Nhánh**: `docs/fe-ws-integration-future-guide`
> **Loại**: Docs-only — không có code logic, không cần test.
> **Output**: 1 file mới `docs/fe-ws-integration-guide.md` (~400–500 dòng).
> **Không đụng**: `docs/handoffs/fe-ws-integration-guide (1).md` (BE 2026-10-15 — giữ nguyên làm tài liệu gốc).

---

## 1. Scope

Viết file tổng hợp, hướng dẫn FE tích hợp WebSocket với Spring Boot STOMP backend. Mục tiêu:

- **Source of truth 1** cho FE khi cần tra cứu nhanh: endpoint, auth, destinations, event types, hook signature, store update, deploy env.
- Phản ánh **code thật** trong repo tại thời điểm 2026-10-18 (đã sync với `src/lib/stomp.ts`, `src/providers/WsConnectionProvider.tsx`, `src/hooks/useFlashSaleWs.ts`, `src/features/flash-sale/types.ts`).
- Đối chiếu với **2 tài liệu gốc** — ghi rõ "xem thêm" ở cuối mỗi mục.
- Đề cập **điểm lệch** giữa doc cũ (2026-10-15) và code hiện tại để agent/user biết đã update.

## 2. Tham khảo

| Nguồn | Vai trò |
|---|---|
| `docs/handoffs/fe-ws-integration-guide (1).md` | **Tài liệu gốc từ BE** (2026-10-15). Mục 1–6 mô tả endpoint + payload + sample code. **KHÔNG sửa**, dùng làm cross-ref. |
| `src/lib/stomp.ts` | Factory STOMP (query param token, heartbeat, reconnect). |
| `src/providers/WsConnectionProvider.tsx` | Mount STOMP ở root, state machine, exponential backoff. |
| `src/hooks/useFlashSaleWs.ts` | Hook subscribe (signature mới + backward compat). |
| `src/features/flash-sale/types.ts` | `WS_EVENT_TYPES` + `WS_DESTINATIONS` + `WsEvent` union. |
| `src/stores/flash-sale.store.ts` | Zustand snapshot + watchingSlots/Orders + lastReservation. |
| `src/lib/constants.ts` | `WS_RECONNECT_BACKOFF_MS = [3000, 6000, 12000, 30000]`. |
| `.cursor/rules/websocket-realtime.mdc` | Convention policy (read-only tham khảo). |
| `.cursor/rules/flash-sale-payment.mdc` | Reservation/payment flow (WS là 1 phần). |
| `docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md` | Runbook VPS deploy (P1 chờ BE). |
| `docs/api-document.md` + `docs/api-reference.md` | REST API kích hoạt WS (BE 2026-10-15). |

## 3. Subplan

Task này là docs-only, không cần subagent. 1 người viết 1 file.

| Subplan | Loại | File output |
|---|---|---|
| 1. Viết file hướng dẫn | docs | `docs/fe-ws-integration-guide.md` |

## 4. Test strategy

- Docs thuần (markdown) → KHÔNG có test theo rule `.cursor/rules/testing-required.mdc` mục "Khi nào KHÔNG cần test".
- Verify: render preview trong Cursor IDE xem format đúng, đếm dòng 400–500, checklist 10 mục đầy đủ.
- Cross-check với code thật: mỗi URL/pattern/destination phải match đúng với `WS_DESTINATIONS` builder + `WS_EVENT_TYPES` constant.
- Cross-check với doc gốc: ghi rõ "đã cập nhật 2026-10-18 so với 2026-10-15" ở mỗi mục có điểm lệch.

## 5. Checklist nội dung (10 mục)

1. **Tổng quan & kiến trúc** — diagram text, tóm tắt 3 lớp (provider → hook → store/query), vị trí WS trong stack.
2. **Endpoint & Auth** — `${NEXT_PUBLIC_WS_URL}/ws`, query param `?token=`, lý do không dùng `Authorization` header.
3. **Connection lifecycle** — state machine `idle|connecting|connected|disconnected|reconnecting`, exponential backoff, cleanup.
4. **Mount provider ở root** — snippet `Providers.tsx`, đã có sẵn; KHÔNG tạo mới.
5. **Hook API (`useFlashSaleWs`)** — signature mới (options object) + backward compat, bảng tham số.
6. **STOMP Destinations & Event types** — bảng 9 destinations, bảng 9 event types + payload fields + FE xử lý.
7. **Store & Query updates** — khi nào `setSnapshot`, khi nào `queryClient.invalidateQueries`, khi nào `queryClient.setQueryData`.
8. **Connection state UI** — chip "Đang kết nối lại…", bảng màu badge theo state.
9. **Testing** — mock `vi.mock('@/lib/stomp')`, 5 file test hiện có, danh sách test case nên có.
10. **Troubleshooting & Runbook** — 6 lỗi thường gặp (404 /info, token rỗng, CORS, heartbeat fail, disconnect loop, parse fail), kèm link tới `2026-10-18-vps-ws-404-handoff.md`.
11. **FAQ** — 8 câu hỏi thường gặp (có cần set JWT riêng?, subscribe nhiều slot?, token hết hạn?, ...).
12. **Glossary** — STOMP, SockJS, handshake, principal, destination, topic, queue, heartbeat, backoff.
13. **Cross-references** — link tới 5 tài liệu liên quan (gốc BE, rule, handoff VPS, API doc, payment flow).
14. **Change log** — bảng so sánh 2026-10-15 (BE doc) → 2026-10-18 (FE doc này): 13 điểm khác biệt.

## 6. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Docs trở nên stale khi code thay đổi | Ghi rõ "Last verified: 2026-10-18" ở đầu file; commit message bắt buộc update doc khi đổi WS contract. |
| Doc dài gây khó đọc | Mục lục anchor + collapsible H2/H3; không copy nguyên code, chỉ snippet quan trọng. |
| Xung đột với doc BE gốc | Ghi rõ "Doc này tổng hợp cho FE, đối chiếu với BE doc tại X" ở phần đầu; không sửa BE doc. |
| Sensitive (token, internal URL) lộ | KHÔNG ghi token thật, KHÔNG ghi IP production; chỉ dùng placeholder `https://api.example.com`. |

## 7. Files thay đổi

| File | Loại | Dòng ước tính |
|---|---|---|
| `docs/fe-ws-integration-guide.md` | Thêm mới | ~450 dòng |

## 8. Commit message dự kiến

```
docs(ws): add FE WS integration future-focused guide

- Create docs/fe-ws-integration-guide.md (~450 lines) as single
  source-of-truth for FE team when integrating STOMP WS.
- Cover: endpoint/auth, lifecycle, provider mount, hook API,
  destinations + 9 events, store/query updates, connection UI,
  testing, troubleshooting runbook, FAQ, glossary, cross-refs,
  change log (2026-10-15 BE → 2026-10-18 FE).
- Reflect current code state (stomp.ts, WsConnectionProvider,
  useFlashSaleWs hook, flash-sale/types, flash-sale.store).
- Do NOT modify docs/handoffs/fe-ws-integration-guide (1).md
  (BE source of truth, 2026-10-15).

Files copy/template (no test required):
- docs/fe-ws-integration-guide.md: docs only, no logic change
```

## 9. Sau khi xong

- Bước 6: auto-commit (không push — chờ user duyệt).
- Báo cáo: file đã tạo, hash, danh sách section, số dòng.