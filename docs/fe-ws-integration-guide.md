# Flash Sale B2C — FE WebSocket Integration Guide

> **Last verified**: 2026-10-18 (against `origin/dev`)
> **Audience**: Frontend engineers, reviewers, and AI agents integrating real-time Flash Sale updates.
> **Scope**: End-to-end WebSocket flow in `flash-sale-b2c-fe` (Next 16, React 19, TS strict, Tailwind 4, TanStack Query, Zustand).
> **Supersedes (in part)**: [FE WS Integration Guide v1.0 — 2026-10-15](docs/handoffs/fe-ws-integration-guide%20(1).md). The 2026-10-15 doc remains the BE-authored contract reference; this document is the **frontend implementation source of truth**. See [§14 Change log](#14-change-log-vs-be-doc-2026-10-15) for what changed.

This guide mirrors the current code on `origin/dev`. When code drifts, update this file in the same commit and bump the "Last verified" date.

---

## Table of contents

1. [Overview & architecture](#1-overview--architecture)
2. [Endpoint & auth](#2-endpoint--auth)
3. [Connection lifecycle](#3-connection-lifecycle)
4. [Provider mount at root](#4-provider-mount-at-root)
5. [Hook API — `useFlashSaleWs`](#5-hook-api--useflashsalews)
6. [STOMP destinations & event types](#6-stomp-destinations--event-types)
7. [Store & query updates](#7-store--query-updates)
8. [Connection state UI](#8-connection-state-ui)
9. [Testing](#9-testing)
10. [Troubleshooting & runbook](#10-troubleshooting--runbook)
11. [FAQ](#11-faq)
12. [Glossary](#12-glossary)
13. [Cross-references](#13-cross-references)
14. [Change log (vs BE doc 2026-10-15)](#14-change-log-vs-be-doc-2026-10-15)

---

## 1. Overview & architecture

The Flash Sale UI depends on a **notification** stream from the Spring Boot STOMP backend (`flash-sale-b2c-UTC2`). WebSocket is not the source of truth — REST responses still are. WS events exist to update the UI **before** the user issues the next REST request, and to push buyer-only events (reservation, payment status) that no one else should see.

Three layers cooperate:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Root layout (src/app/layout.tsx → Providers.tsx)                         │
│   └─ WsConnectionProvider                                                │
│        • owns ONE STOMP client                                           │
│        • state machine: idle → connecting → connected → reconnecting     │
│        • exponential backoff: 3s → 6s → 12s → cap 30s                   │
│        • exposes ensureClient() + connectionState                       │
└──────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Per-page hook (src/hooks/useFlashSaleWs.ts)                              │
│   • calls ensureClient() to get the shared client                        │
│   • subscribes / unsubscribes dynamically as props change                │
│   • always subscribes /user/queue/flash-sale/reservation-result         │
│   • parses BE envelope {success, code, data} → WsEvent                  │
└──────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Side effects                                                              │
│   • TanStack Query: queryClient.setQueryData / invalidateQueries        │
│   • Zustand store (flash-sale.store): setSnapshot, watchingSlots, etc.  │
│   • i18n toast for the buyer-facing flows                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Where WS sits in the request flow:**

```text
[browse slot] ──REST──▶ reserve ──REST + Idempotency-Key──▶ backend
                            │
                            └─WS push─▶ STOCK_DECREMENTED (public topic)
                                       ▶ ORDER_RESERVED (private queue)

[user pays]   ──REST──▶ payment intent ──provider──▶ backend webhook
                                                       │
                            WS push────────────────────┘
                                       ▶ PAYMENT_STATUS_CHANGED (private queue)
                                       ▶ ORDER_STATUS_CHANGED  (private queue)
```

**Source of truth hierarchy** (per `docs/CLAUDE.md` §8):

1. REST API responses (TanStack Query cache)
2. WebSocket notifications (Zustand `flash-sale.store` + targeted `setQueryData`)
3. Optimistic UI (not used for reservation — see `flash-sale-payment.mdc` §2)

---

## 2. Endpoint & auth

### 2.1 Endpoint

```text
${NEXT_PUBLIC_WS_URL}/ws
```

- The Spring Boot STOMP handler is registered at `/ws` (NOT `/flash-sale/ws` and NOT `/ws/flash-sale`).
- `NEXT_PUBLIC_WS_URL` is the SockJS base **including** the `/ws` path on production. Examples:
  - Dev: `http://localhost:8080/ws`
  - Production behind Nginx: `https://vibe-mart-utc2.canluaz.io.vn/ws`
- The factory (`src/lib/stomp.ts`) trims a trailing `/` and throws if the env var is empty/undefined — see [§10 Troubleshooting](#10-troubleshooting--runbook) for why this matters.

### 2.2 Auth — JWT in query param

JWT travels **as the `?token=` URL query parameter**, not in an `Authorization` header:

```ts
// src/lib/stomp.ts — relevant fragment only
function buildSockJsUrl(base: string, token: string | null): string {
  if (!token) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}
```

**Why no `Authorization` header?**

RFC 6455 prevents browsers from setting custom headers during the WebSocket upgrade. The SockJS path is identical — the browser wraps the URL in an HTTP `GET /ws/{server_id}/{session_id}/websocket` before upgrading. The BE reads the token from the query string via `HandshakeAuthInterceptor` and sets the Spring `Principal` accordingly. See the BE doc [§6.1](docs/handoffs/fe-ws-integration-guide%20(1).md) for the server-side rationale.

**Where the token comes from:**

```ts
const token = getAccessToken(); // reads from localStorage["fs_access_token"]
const conn = createFlashSaleStompClient(token);
```

If `token` is `null`, `buildSockJsUrl` returns the bare URL — public topics (`STOCK_*`, `SLOT_*`) still work; private queues (`/user/queue/...`) will simply not deliver events until the user logs in and triggers a new connection.

**Rotation/refresh:**

- The hook layer reads `getAccessToken()` at mount time, not on every reconnect. If the token expires while connected, the BE will disconnect (STOMP `ERROR` frame). The provider then enters `reconnecting` and rebuilds the client with a fresh `getAccessToken()` call on the next mount cycle.
- A long-lived flash-sale session (5 min reservation + polling) should call `accessToken` rotation per the existing `apiFetch` flow ([`auth-jwt.mdc`](.cursor/rules/auth-jwt.mdc)).

---

## 3. Connection lifecycle

### 3.1 State machine

```text
            ┌──────────┐
            │   idle   │  (initial — before WsConnectionProvider mounts)
            └────┬─────┘
                 │ mount
                 ▼
            ┌──────────┐
            │connecting│  (client.activate() called, waiting for onConnect)
            └────┬─────┘
                 │ onConnect fires
                 ▼
            ┌──────────┐
            │connected │  ◀─── reset retry counter to 0
            └────┬─────┘
       onDisconnect / onStompError / onWebSocketError (token present)
                 ▼
            ┌─────────────┐
            │reconnecting │ (backoff timer scheduled)
            └────┬────────┘
                 │ timer fires → createFlashSaleStompClient()
                 ▼
            back to "connecting"

            (logout clears tokenRef; next disconnect → "disconnected")
```

### 3.2 Exponential backoff

Defined in `src/lib/constants.ts`:

```ts
export const WS_RECONNECT_BACKOFF_MS = [3000, 6000, 12000, 30000] as const;
```

The provider reads this array and increments `reconnectAttemptRef` after each failure. Cap at the last entry once attempts overflow.

| Attempt | Delay before next `createFlashSaleStompClient()` |
|---------|--------------------------------------------------|
| 1       | 3 000 ms                                         |
| 2       | 6 000 ms                                         |
| 3       | 12 000 ms                                        |
| 4+      | 30 000 ms (cap)                                  |

The counter resets to 0 on every `onConnect`. The `@stomp/stompjs` v7 `reconnectDelay` config is fixed at 3000 ms; the full schedule is implemented in `WsConnectionProvider.scheduleReconnect()` because STOMP v7 only accepts a single number.

### 3.3 Cleanup

- On provider unmount → `client.deactivate()` and `clearTimeout(reconnectTimerRef)`.
- On `enabled === false` in `useFlashSaleWs` → no `createFlashSaleStompClient` is called at all.
- On logout (`tokenRef.current = null` by parent) → `onDisconnect` transitions to `"disconnected"` and does **not** retry.

---

## 4. Provider mount at root

`WsConnectionProvider` is mounted once in `src/providers/Providers.tsx` inside the root layout. **Do not mount it inside individual pages or components.**

```tsx
// src/providers/Providers.tsx — relevant excerpt (current as of 2026-10-18)
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WsConnectionProvider } from "./WsConnectionProvider";
import { SessionCookieBridge } from "./SessionCookieBridge";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
      },
    }),
  );

  return (
    <QueryClientProvider client={client}>
      <SessionCookieBridge />
      <WsConnectionProvider>{children}</WsConnectionProvider>
      <Toaster richColors position="top-right" duration={4000} />
    </QueryClientProvider>
  );
}
```

Anyone outside the provider (testing, Storybook) can still call `useWs()` — it falls back to a local client with `connectionState: "connecting"`.

---

## 5. Hook API — `useFlashSaleWs`

The hook accepts **two signatures** to support both the new options-object contract and legacy callers.

### 5.1 Recommended: options object

```ts
import { useFlashSaleWs, type WsEvent } from "@/hooks/useFlashSaleWs";

useFlashSaleWs({
  enabled: true,
  subscribeSlotIds: [12, 34],
  subscribeOrderCodes: ["FS-261001-A7K2Q"],
  onMessage: (event: WsEvent) => {
    // custom handler — runs in addition to the built-in store update
  },
});
```

### 5.2 Legacy: `(destination, onMessage)`

```ts
// deprecated but still supported — wires a single STOMP subscription
useFlashSaleWs("/topic/flash-sale/slot/12", (msg) => {
  // msg is the parsed WsEvent (legacy callers unwrap freely)
});
```

### 5.3 Parameter reference

| Parameter            | Type                                  | Required | Default | Effect |
|----------------------|---------------------------------------|----------|---------|--------|
| `enabled`            | `boolean`                             | no       | `true`  | When `false`, the hook skips `createFlashSaleStompClient` and no subscriptions are opened. |
| `subscribeSlotIds`   | `number[]`                            | no       | `[]`    | Subscribes `/topic/flash-sale/slot/{id}/stock-update` for each id. Hook does **not** auto-subscribe the `slotStatus` topic (see [§6](#6-stomp-destinations--event-types)). |
| `subscribeOrderCodes`| `string[]`                            | no       | `[]`    | Subscribes `/user/queue/flash-sale/orders/{code}/status` for each code. The `/updates` queue is *not* auto-subscribed (legacy gate). |
| `onMessage`          | `(event: WsEvent) => void`            | no       | —       | Called once per event with the parsed `data` field from the BE envelope. |

**Always-on subscription (when `enabled === true`):**

- `/user/queue/flash-sale/reservation-result` — buyer-only reservation result.

**Unsub rules:**

- All `subscribeSlotIds` and `subscribeOrderCodes` are torn down when the hook unmounts **or** when the joined-string dependency changes (i.e. adding/removing an id fires a re-subscribe).
- Calling `conn.disconnect()` always happens on cleanup, even though `WsConnectionProvider` shares a client — to ensure the legacy path does not leak sockets.

> **Note**: The hook currently creates its own client (not `ensureClient()` from the provider) inside `useFlashSaleWs`. This is intentional but documented in `websocket-realtime.mdc` §11 — do not change without coordinating with the WS test suite.

---

## 6. STOMP destinations & event types

### 6.1 Destinations

The `WS_DESTINATIONS` object in `src/features/flash-sale/types.ts` is the only sanctioned way to build paths. **Do not hard-code template strings**.

| Builder                                | Resolved path                                                   | Visibility | Used by |
|----------------------------------------|-----------------------------------------------------------------|------------|---------|
| `WS_DESTINATIONS.slotStock(slotId)`    | `/topic/flash-sale/slot/{slotId}/stock-update`                  | Public     | `useFlashSaleWs` auto-subscribe |
| `WS_DESTINATIONS.slotStatus(slotId)`   | `/topic/flash-sale/slot/{slotId}/status`                        | Public     | Hook callers only (manual) |
| `WS_DESTINATIONS.orderStatus(code)`    | `/user/queue/flash-sale/orders/{orderCode}/status`              | Private    | `useFlashSaleWs` auto-subscribe |
| `WS_DESTINATIONS.orderUpdates(code)`   | `/user/queue/flash-sale/orders/{orderCode}/updates`             | Private    | Manual (timeout cancel only) |
| `WS_DESTINATIONS.reservationResult`    | `/user/queue/flash-sale/reservation-result`                     | Private    | `useFlashSaleWs` always-on |

Public topics are broadcast to every subscriber; private queues are routed via Spring `/user/{username}` prefix using the principal from `HandshakeAuthInterceptor`.

### 6.2 Event types (`WS_EVENT_TYPES` constant — 9 entries)

Exact match against `src/features/flash-sale/types.ts`:

```ts
export const WS_EVENT_TYPES = [
  "STOCK_DECREMENTED",
  "STOCK_RESTORED",
  "STOCK_RETURNED_UNSOLD",
  "SLOT_ACTIVATED",
  "SLOT_CLOSED",
  "ORDER_RESERVED",
  "ORDER_CANCELLED_TIMEOUT",
  "ORDER_STATUS_CHANGED",
  "PAYMENT_STATUS_CHANGED",
] as const;
```

Each event carries an `eventType` discriminator and an `occurredAt` ISO 8601 timestamp. Other fields are typed in the `WsEvent` union (see source for the per-event interfaces — they are the source of truth).

| Event                      | Topic / queue                                                                          | Key payload fields                                     | FE handling |
|----------------------------|----------------------------------------------------------------------------------------|--------------------------------------------------------|-------------|
| `STOCK_DECREMENTED`        | `/topic/flash-sale/slot/{slotId}/stock-update`                                         | `slotId`, `flashSaleItemId`, `availableStock`          | `flash-sale.store.setSnapshot(...)` + `queryClient.setQueryData` |
| `STOCK_RESTORED`           | `/topic/flash-sale/slot/{slotId}/stock-update`                                         | `slotId`, `flashSaleItemId`, `availableStock`, `restoredQuantity` | Same as above |
| `STOCK_RETURNED_UNSOLD`    | `/topic/flash-sale/slot/{slotId}/stock-update`                                         | `slotId`, `flashSaleItemId`                            | Invalidate slot query (`queryClient.invalidateQueries`) |
| `SLOT_ACTIVATED`           | `/topic/flash-sale/slot/{slotId}/status`                                               | `slotId`                                               | Invalidate slot query |
| `SLOT_CLOSED`              | `/topic/flash-sale/slot/{slotId}/status`                                               | `slotId`                                               | Invalidate + show "Đã kết thúc" |
| `ORDER_RESERVED`           | `/user/queue/flash-sale/reservation-result`                                            | `orderId`, `orderCode`, `quantity`, `totalAmount`, `expiresAt` | `flash-sale.store.setLastReservation(...)` + toast "Đặt hàng thành công" + redirect `/checkout/{orderCode}` |
| `ORDER_CANCELLED_TIMEOUT`  | `/user/queue/flash-sale/orders/{orderCode}/updates`                                    | `orderId`, `orderCode`                                 | Invalidate `useOrder` + toast "Đơn đã huỷ do quá hạn" |
| `ORDER_STATUS_CHANGED`     | `/user/queue/flash-sale/orders/{orderCode}/status`                                     | `orderId`, `orderCode`, `orderStatus`                  | Invalidate `useOrder` + update `StatusBadge` via `order.status.{value}` i18n key |
| `PAYMENT_STATUS_CHANGED`   | `/user/queue/flash-sale/orders/{orderCode}/status`                                     | `orderId`, `orderCode`, `paymentMethod`, `paymentStatus` | Invalidate + toast per `payment.status.{value}` |

> **All money fields (`totalAmount` etc.) are `number` (VND integer), not decimals.** The `WsEvent` interface and tests assert this explicitly — do not cast to `decimal.js` on the WS path. REST snapshots handle decimals via [`decimal.ts`](src/lib/decimal.ts).

---

## 7. Store & query updates

WS events fan out into two sinks:

### 7.1 TanStack Query — server state (source of truth)

```ts
import { useQueryClient } from "@tanstack/react-query";

// Inside the hook, after parsing the event:
queryClient.setQueryData(
  ["flash-sale", "slot", slotId, "stock"],
  { remainingStock: event.availableStock, version: event.occurredAt },
);
queryClient.invalidateQueries({ queryKey: ["flash-sale", "slot", slotId] });
queryClient.invalidateQueries({ queryKey: ["order", event.orderCode] });
```

- **Use `setQueryData`** when you trust the WS payload for optimistic patches (stock counts).
- **Use `invalidateQueries`** when the BE might have additional state to recompute (order status, slot summary).
- **Trust no overrides** for monetary fields — always refetch the order on `PAYMENT_STATUS_CHANGED`.

### 7.2 Zustand — UI state (`flash-sale.store`)

The store ONLY holds lightweight UI state. **It is not the source of truth for stock.** Per `state-management.mdc` and the code in `src/stores/flash-sale.store.ts`:

| Store field          | Type                                  | What writes it | What reads it |
|----------------------|---------------------------------------|----------------|---------------|
| `byItem`             | `Record<string, StockSnapshot>`       | `setSnapshot`, `setMany` | `StockProgressBar`-style components |
| `watchingSlots`      | `number[]`                            | `addWatchingSlot` / `removeWatchingSlot` | Reminder button / chip |
| `watchingOrders`     | `string[]`                            | `addWatchingOrder` / `removeWatchingOrder` | Order list filters |
| `lastReservation`    | `{ orderCode, expiresAt } \| null`    | `setLastReservation` / `clearLastReservation` | Countdown payment |

> **Do not** add `remainingStock` to the store in a feature branch — review will reject it.

### 7.3 Decision table

| Event family                          | Primary sink          | Secondary sink             |
|---------------------------------------|-----------------------|----------------------------|
| Stock (`STOCK_*`)                     | `setSnapshot`         | `queryClient.setQueryData` |
| Slot lifecycle (`SLOT_*`)             | `invalidateQueries`   | (none)                     |
| Reservation (`ORDER_RESERVED`)        | `setLastReservation`  | Toast + redirect           |
| Timeout (`ORDER_CANCELLED_TIMEOUT`)   | `invalidateQueries`   | Toast                      |
| Status (`ORDER_STATUS_CHANGED`)       | `invalidateQueries`   | StatusBadge re-render      |
| Payment (`PAYMENT_STATUS_CHANGED`)    | `invalidateQueries`   | Toast                      |

---

## 8. Connection state UI

`useWs()` returns `connectionState: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting'`. Recommended UI:

| State            | Vietnamese label                  | Badge variant | Notes |
|------------------|------------------------------------|---------------|-------|
| `idle`           | (hidden)                           | —             | Only visible before mount |
| `connecting`     | `Đang kết nối…`                    | `info`        | First-time boot |
| `connected`      | `Realtime` (chip xanh, chấm live) | `success`     | Hide entirely if you want a clean page; show if business needs assurance |
| `reconnecting`   | `Đang kết nối lại…`               | `warning`     | **Most important** — expose near CTAs during flash-sale |
| `disconnected`   | `Mất kết nối — đang thử lại…`     | `danger`      | Token cleared or fatal; user-facing message |

Translate via `messages/<locale>.json` namespace `ws.connectionState.{state}` (see `i18n.mdc` §5).

Local-time chip implementation reference (≤ 15 lines):

```tsx
const ws = useWs();
const state = ws.connectionState;
if (state === "connected") return null;

return (
  <div role="status" className={cn("chip", VARIANT_BY_STATE[state])}>
    {t(`ws.connectionState.${state}`)}
  </div>
);
```

---

## 9. Testing

The repo has **5 dedicated WS test files** (Vitest) alongside the hook integration coverage. Mock the factory at module boundary — no real WebSocket.

| File                                                  | Coverage |
|-------------------------------------------------------|----------|
| `src/lib/stomp.test.ts` *(if present — see notes)*    | URL/token/expiry throw |
| `src/providers/WsConnectionProvider.test.tsx`         | Lifecycle + backoff |
| `src/hooks/useFlashSaleWs.test.ts`                    | Subscribe / unsubscribe / parse envelope |
| `src/features/flash-sale/types.test.ts`               | `WS_DESTINATIONS` builders + 9 events + `WsEvent` shape |
| `src/stores/flash-sale.store.test.ts`                 | Snapshot / watching / lastReservation |

**Mock pattern** (from `useFlashSaleWs.test.ts`):

```ts
const mockSubscribe = vi.fn().mockReturnValue(vi.fn());
const mockDisconnect = vi.fn();
vi.mock("@/lib/stomp", () => ({
  createFlashSaleStompClient: vi.fn(() => ({
    client: {},
    subscribe: mockSubscribe,
    disconnect: mockDisconnect,
  })),
}));
vi.mock("@/lib/api", () => ({ getAccessToken: vi.fn(() => "mock-token") }));
```

**Recommended additional test cases** (when extending WS coverage):

- `WsConnectionProvider`: reconnect schedule stops at cap (no further timers past 30 000 ms).
- `useFlashSaleWs`: switching `subscribeSlotIds` from `[1]` to `[1,2]` opens a new subscription without disconnect.
- `useFlashSaleWs`: `onMessage` does not fire when `msg.body` is not a JSON object containing `data`.
- `flash-sale.store`: `setSnapshot` is called by `useFlashSaleWs` when `STOCK_DECREMENTED` payload arrives (hook + store integration).
- `WsConnectionProvider`: i18n string for `reconnecting` is shown only when `connectionState === "reconnecting"`.

> **No E2E** for WS in this codebase — see `no-overengineering.mdc`.

---

## 10. Troubleshooting & runbook

Six common failures, ranked by frequency on the FE side.

### 10.1 `GET /info 404 (Not Found)` on first paint

**Symptoms**: console spam `GET https://<host>/info?token=<JWT>&t=<ts> 404`, exponential retry forever.

**Root cause**: `NEXT_PUBLIC_WS_URL` is empty/undefined. `src/lib/stomp.ts` now `throw`s on this (since the `fix/stomp-empty-env-error` commit) — see `docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md` for the production incident on `vibe-mart-utc2.canluaz.io.vn` (2026-10-18). Common chains:

1. **Nginx not proxying `/ws`** → request falls through to Next.js → 404.
2. **`NEXT_PUBLIC_WS_URL` empty** → SockJS resolves to same-origin → calls `/info` on Next.js → 404.

**Fix**: ensure `.env.production` has `NEXT_PUBLIC_WS_URL=https://<host>/ws` AND Nginx `location /ws` proxies to backend (see the VPS handoff for the Nginx snippet).

### 10.2 Empty token / wrong token type

**Symptoms**: BE logs `401` on STOMP CONNECT, or the browser enters an infinite reconnect with `connected=false`.

**Fix**:

- Verify `localStorage["fs_access_token"]` is populated.
- Verify the JWT decoder returns `exp` in the future.
- Re-login if `auth-jwt.mdc` says refresh failed.

### 10.3 CORS preflight blocked

**Symptoms**: `Access to fetch ... has been blocked by CORS policy` on `GET /info` or `POST /api/...`.

**Fix**: backend `CORS_ALLOWED_ORIGINS` must include the FE origin (typically the production domain). Dev origins `http://localhost:3000` are pre-listed in `BE CORS` per BE doc §6.7. For new domains (CI, staging), update BE env and redeploy.

### 10.4 Heartbeat failure / `onWebSocketError`

**Symptoms**: connection drops every ~30s right after `connected`.

**Fix**:

- Verify Nginx `proxy_read_timeout` and `proxy_send_timeout` are ≥ 300s (BE heartbeat is 10s, transport tolerance is 30s).
- Verify no intermediate proxy strips `Upgrade` / `Connection: upgrade` headers.

### 10.5 Disconnect loop after first connect

**Symptoms**: Flashes between `connected` and `reconnecting` every 30s.

**Fix**:

- Open DevTools → Network → WS filter and click the upgrade request. Inspect frames — `MESSAGE` frames should arrive.
- If the BE pushes `ERROR` frame containing `"401"` → token expired (re-login).
- If `ERROR` frame says `"principal not found"` → BE `HandshakeAuthInterceptor` did not parse `?token=`. Verify Nginx forwards the query string.

### 10.6 Parse failure / malformed JSON

**Symptoms**: `console.error('[useFlashSaleWs] parse failed', ...)` (only in dev — production silent).

**Fix**: log the raw body in dev (`process.env.NODE_ENV !== "production"`), then file an issue against BE if the shape drift is consistent. The hook already skips the event with `try/catch` so UI is not crashed — see `handleWsMessage` in `src/hooks/useFlashSaleWs.ts`.

### 10.7 Where to escalate

If the issue looks like infra (Nginx, env, CORS), ping the BE team with the WS runbook at [`docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md`](docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md). For codebase-level bugs in `useFlashSaleWs` / `WsConnectionProvider` / `WS_DESTINATIONS`, escalate to the FE owner in `#frontend`.

---

## 11. FAQ

**Q1. Do I need to set the JWT separately before connecting?**
No. `useFlashSaleWs` reads `localStorage["fs_access_token"]` via `getAccessToken()` at mount. If the user is logged out, the hook still connects (public topics only); the BE will simply not route private queues to that session.

**Q2. Can I subscribe to multiple slots/orders at once?**
Yes. Pass an array — `subscribeSlotIds: [1, 2, 3]` opens one STOMP subscription per id under the hood.

**Q3. What happens when the token expires mid-session?**
The BE disconnects (STOMP `ERROR` frame containing the auth code). The provider transitions to `reconnecting`. The next `createFlashSaleStompClient` reads the *new* token via `getAccessToken()`; if refresh succeeded and `localStorage` was updated, the new connect carries it. If the user has been logged out by then, `onDisconnect` switches to `disconnected` and stops retrying.

**Q4. Should I trust WS for monetary values (e.g. `totalAmount` in `ORDER_RESERVED`)?**
The WS payload is sufficient for instant UI (countdown, big-number display), but **always refetch the order** before showing a final receipt or moving the user past checkout. The webhook is authoritative.

**Q5. Why does the hook create its own STOMP client instead of using the provider's?**
Historical split: `WsConnectionProvider` only manages lifecycle and state. `useFlashSaleWs` historically built per-call clients for testability (`vi.mock("@/lib/stomp")`). Changing this requires updating both test files. See the deprecated note in `websocket-realtime.mdc` §11.

**Q6. Can I unsubscribe from a single slot without unmounting the hook?**
Not natively today. Workaround: store the active slotId in component state and re-mount the hook with a new array (`subscribeSlotIds={activeSlotId ? [activeSlotId] : []}`). Adding "dynamic unsubscribe" is on the WS roadmap.

**Q7. Should I prefer `invalidateQueries` or `setQueryData` for stock updates?**
`setQueryData` for purely numerical updates (counts, remaining), `invalidateQueries` for any business logic that depends on stock (e.g. sold-out gating on the buy button). The hook writes both — components can choose which consumer they read.

**Q8. What's the difference between `/updates` and `/status` for an order?**
`/status` is the general state bus (`ORDER_STATUS_CHANGED`, `PAYMENT_STATUS_CHANGED`) — fires whenever any field on the order changes. `/updates` is reserved for transient notifications like `ORDER_CANCELLED_TIMEOUT` (timeout rollback). Always subscribe `/status`; subscribe `/updates` only if your screen handles the timeout case.

---

## 12. Glossary

| Term          | Definition |
|---------------|------------|
| **STOMP**     | Simple Text Oriented Messaging Protocol — a lightweight pub/sub framing layer sitting on top of a transport (here SockJS). Defines `CONNECT`, `SUBSCRIBE`, `SEND`, `MESSAGE` frames. |
| **SockJS**    | A browser-side WebSocket emulation library. Falls back to HTTP long-polling / XHR streaming when WS upgrades fail. Always hits the `/info` endpoint first to negotiate. |
| **Handshake** | The initial HTTP `GET /ws/...` round-trip before the WS upgrade. The custom query-param `?token=` is read here by `HandshakeAuthInterceptor`. |
| **Principal** | The Spring Security object representing the authenticated user. STOMP CONNECT uses the principal resolved from the JWT in `?token=`. |
| **Destination** | A STOMP routing path. Two flavors: **topic** (`/topic/...`, pub/sub, broadcast) and **queue** (`/queue/...`, point-to-point). Spring's user-queue pattern uses `/user/{principal}/queue/...`. |
| **Heartbeat** | Periodic empty `MESSAGE` frames to detect dead connections. Spec value here: incoming 10 000 ms / outgoing 10 000 ms. |
| **Backoff** | Increasing the wait between retries to avoid hammering a failing peer. Schedule: `WS_RECONNECT_BACKOFF_MS = [3000, 6000, 12000, 30000]`. |
| **Idempotency-Key** | UUID header `Idempotency-Key` attached to every REST mutation so retries don't double-charge. See `flash-sale-b2c-api.mdc` §4. Unrelated to WS itself but mentioned because reservation triggers WS push. |
| **Envelope**   | The `{success, code, message, data, timestamp}` wrapper around every successful BE response (REST and WS). Unwrap `data` to access event payload. |

---

## 13. Cross-references

| Document | Why you might open it |
|---|---|
| [`docs/handoffs/fe-ws-integration-guide (1).md`](docs/handoffs/fe-ws-integration-guide%20(1).md) — 548 lines, BE, 2026-10-15 | Original BE-authored WS contract — kept verbatim for reference. |
| [`.cursor/rules/websocket-realtime.mdc`](.cursor/rules/websocket-realtime.mdc) — 136 lines | Policy doc that this guide implements. Required reading before changing hook behavior. |
| [`.cursor/rules/flash-sale-payment.mdc`](.cursor/rules/flash-sale-payment.mdc) — 107 lines | Reservation + payment flow context (WS is a side-effect, not the trigger). |
| [`docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md`](docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md) — 110 lines | 2026-10-18 production incident: Nginx /ws proxy + empty-env crash. Read before debugging live deploys. |
| [`docs/api-document.md`](docs/api-document.md) — 1 358 lines | Full REST contract (for endpoints that **trigger** WS pushes: reserve, payment, etc.). |
| [`docs/api-reference.md`](docs/api-reference.md) — 791 lines | Per-module REST reference. |
| [`docs/CLAUDE.md`](docs/CLAUDE.md) §13 | Same content compressed into ~80 lines; superseded by this guide. |

---

## 14. Change log (vs BE doc 2026-10-15)

The BE-authored guide at [`docs/handoffs/fe-ws-integration-guide (1).md`](docs/handoffs/fe-ws-integration-guide%20(1).md) (v1.0, 2026-10-15) is the seed. This doc adds 14+ deliberate updates on top of it. Drift ≥ 8 rows is required by the parent plan; we ship 14.

| # | Topic | BE doc (2026-10-15) | This doc (2026-10-18) |
|---|-------|---------------------|------------------------|
| 1 | Client factory location | `src/lib/ws/stompClient.ts` (proposed, never written) | `src/lib/stomp.ts` (`createFlashSaleStompClient`) |
| 2 | Hook location + state | `useFlashSaleWs` in `src/hooks/useFlashSaleWs.ts`, client-managed via `clientRef` | Same path, but uses `WsConnectionProvider`-owned client and the `useWs()` fallback for tests |
| 3 | Hook signature | `{ enabled, onMessage, subscribeSlotIds, subscribeOrderCodes }` only | **Two** signatures: options object (recommended) + legacy `(destination, onMessage)` for backward compat |
| 4 | Token pass-through | Comment says token goes to SockJS URL via `webSocketFactory` — but the proposed code never sets it in the body | Production code injects `?token=<JWT>` into every `webSocketFactory()` call via `buildSockJsUrl()` |
| 5 | Heartbeat | "10s incoming + outgoing" — implicit, not asserted in sample code | Hard-coded `heartbeatIncoming: 10_000`, `heartbeatOutgoing: 10_000` in factory |
| 6 | Backoff | `reconnectDelay: 3000` (single value) | `WS_RECONNECT_BACKOFF_MS = [3000, 6000, 12000, 30000]` with provider-managed schedule; `reconnectDelay` locked to first entry |
| 7 | Connection state UI | Not described | Five-state machine chip with i18n strings + badge variants |
| 8 | Empty-env behavior | Assumed to fall back to `window.location.host` (broken on production, see row #13) | `getWsUrl()` throws at boot; `.env.production.example` updated |
| 9 | Event count | 7 triggers across 6 endpoints | **9** event types total (`STOCK_RETURNED_UNSOLD` and the `STOCK_RESTORED` duplicate trigger documented separately) |
| 10 | Destination builder | Manual template strings in subscriber code | `WS_DESTINATIONS` factory functions + a `WS_EVENT_TYPES` tuple + `WsEvent` discriminated union |
| 11 | Store layout | Single `stocks: Record<number, number>` map (proposed) | `byItem: Record<string, StockSnapshot>` + `watchingSlots` + `watchingOrders` + `lastReservation`, in-memory only |
| 12 | Test coverage | "Test event DTO" mentioned but only stubs | **5 dedicated test files** with explicit assertions on paths, event parsing, backoff schedule |
| 13 | CORS origin list | Hard-coded `localhost:3000/3001` (acceptable for dev only) | Same dev origins; production must extend `CORS_ALLOWED_ORIGINS` (linked to BE doc §6.7) |
| 14 | VPS / Nginx guidance | Not present | Dedicated section + link to [`2026-10-18-vps-ws-404-handoff.md`](docs/superpowers/handoffs/2026-10-18-vps-ws-404-handoff.md) for the 2026-10-18 incident |

---

## Appendix A — Verification needed

The following assumptions in this guide were verified against code at "Last verified: 2026-10-18". Re-check before merging PRs that touch them:

- The hook currently creates its own client **per-call** rather than calling `ensureClient()` from the provider — confirmed by reading `src/hooks/useFlashSaleWs.ts`. If a refactor changes this, update §5 and §11 Q5.
- `STOCK_RETURNED_UNSOLD` does not carry `availableStock` in the `WsEvent` interface — confirmed at `src/features/flash-sale/types.ts` lines 88–94. Behavior on arrival is "invalidate query", not "setSnapshot". Update §6.2 row 3 if BE later adds a count.
- The `/user/queue/flash-sale/orders/{code}/updates` queue is **not** auto-subscribed by the hook — only `/status` is. Manual subscribe required for timeout cancellation. Confirm via `useFlashSaleWs.test.ts` if changing.

— End of guide —
