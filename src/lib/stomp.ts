import { Client, type IMessage, type StompConfig } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_RECONNECT_BACKOFF_MS } from "@/lib/constants";

/**
 * STOMP client factory — BE contract 2026-10-15.
 *
 * Source of truth: `docs/handoffs/fe-ws-integration-guide (1).md`.
 *
 * Spec:
 * - Endpoint: `<NEXT_PUBLIC_WS_URL>/ws` (mặc định `http://localhost:8080/ws`).
 *   KHÔNG thêm `/flash-sale` — Spring Boot WS handler tên `/ws`.
 * - Auth: JWT truyền qua query param `?token=<access_token>`.
 *   Browser KHÔNG cho set Authorization header khi upgrade WebSocket.
 * - Heartbeat: 10s incoming, 10s outgoing (BE spec §2.4).
 * - Reconnect: exponential backoff (3s → 6s → 12s → max 30s).
 *   Hiện dùng `reconnectDelay: WS_RECONNECT_BACKOFF_MS[0]` (=3s) — STOMP 7.x chỉ
 *   nhận number, exponential được implement ở handler tầng trên
 *   (xem `WsConnectionProvider`).
 *
 * KHÔNG xử lý nghiệp vụ ở đây; chỉ mount, subscribe/unsubscribe do hook làm.
 */
export interface FlashSaleStompClient {
  client: Client;
  subscribe: (destination: string, cb: (msg: IMessage) => void) => () => void;
  disconnect: () => void;
}

function getWsUrl(): string {
  // NEXT_PUBLIC_WS_URL có thể là host thuần (vd "http://localhost:8080")
  // hoặc đã có /ws. Luôn normalize về `<base>/ws` + ?token=<JWT>.
  const raw = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8080/ws";
  return raw.replace(/\/$/, "");
}

function buildSockJsUrl(base: string, token: string | null): string {
  // KHÔNG dùng Authorization header — browser không cho set khi upgrade WS.
  // BE đọc token qua HandshakeAuthInterceptor từ query param `token=`.
  if (!token) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

export function createFlashSaleStompClient(
  accessToken: string | null
): FlashSaleStompClient {
  const wsBase = getWsUrl();

  const config: StompConfig = {
    // Truyền token qua URL query param cho handshake interceptor
    // (BE `HandshakeAuthInterceptor` đọc `token` query param).
    webSocketFactory: () =>
      new SockJS(buildSockJsUrl(wsBase, accessToken)) as unknown as WebSocket,
    reconnectDelay: WS_RECONNECT_BACKOFF_MS[0],
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    // KHÔNG set Authorization header — dùng query param ở trên.
    connectHeaders: {},
    debug: () => {
      // Tắt log mặc định để khỏi spam console – rule §11.
    },
  };

  const client = new Client(config);
  client.activate();

  const subscribe = (destination: string, cb: (msg: IMessage) => void) => {
    let sub: ReturnType<Client["subscribe"]> | null = null;
    const trySubscribe = () => {
      if (!client.connected) return;
      sub = client.subscribe(destination, cb);
    };
    if (client.connected) trySubscribe();
    else client.onConnect = () => trySubscribe();
    return () => {
      try {
        sub?.unsubscribe();
      } catch {
        // ignore
      }
    };
  };

  const disconnect = () => {
    try {
      client.deactivate();
    } catch {
      // ignore
    }
  };

  return { client, subscribe, disconnect };
}