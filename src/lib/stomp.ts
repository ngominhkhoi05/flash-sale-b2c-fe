import { Client, type IMessage, type StompConfig } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_RECONNECT_BACKOFF_MS } from "@/lib/constants";
import { isTokenExpired } from "@/features/auth/jwt";

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
  //
  // Lưu ý quan trọng (VPS bug 2026-10-18): khi env rỗng/undefined/whitespace,
  // KHÔNG throw — fallback về same-origin (`window.location.host`) để SockJS
  // resolve <window.location.host>/ws. Đây là pattern build production qua
  // Nginx reverse-proxy cùng host (xem `.env.production.example`). Vẫn
  // `console.warn` để dev/prod biết env bị thiếu. Trước đó commit 8ed08b5
  // đã throw sớm nhưng làm app crash trên VPS — revert lại fail-safe behavior.
  const raw = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (!raw) {
    // Chỉ chạy được trên browser (WebSocket client). SSR fallback
    // về localhost để tránh crash server bundle (không có window).
    const fallback =
      typeof window !== "undefined" && window.location?.host
        ? `${window.location.protocol}//${window.location.host}/ws`
        : "http://localhost:8080/ws";
    if (typeof console !== "undefined") {
      console.warn(
        "[stomp] NEXT_PUBLIC_WS_URL is empty. Falling back to",
        fallback,
        "— set NEXT_PUBLIC_WS_URL in your env to silence this warning.",
      );
    }
    return fallback.replace(/\/$/, "");
  }
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
  // Nếu token đã hết hạn, không gửi query param token để fallback về public access an toàn
  const validToken = accessToken && !isTokenExpired(accessToken) ? accessToken : null;

  const config: StompConfig = {
    // Truyền token qua URL query param cho handshake interceptor
    // (BE `HandshakeAuthInterceptor` đọc `token` query param).
    // Giới hạn transport an toàn, bỏ jsonp/iframe để tránh CORS error và fallback storm
    webSocketFactory: () =>
      new SockJS(buildSockJsUrl(wsBase, validToken), null, {
        transports: ["websocket", "xhr-streaming", "xhr-polling"],
      }) as unknown as WebSocket,
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