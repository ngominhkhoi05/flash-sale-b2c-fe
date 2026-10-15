import { Client, type IMessage, type StompConfig } from "@stomp/stompjs";
import { WS_RECONNECT_DELAY_MS } from "@/lib/constants";

/**
 * STOMP client factory (rule websocket-realtime).
 * - Tự reconnect với backoff đơn giản.
 * - Truyền JWT qua connectHeaders (Authorization Bearer) cho Spring Security.
 * - KHÔNG xử lý nghiệp vụ ở đây; chỉ mount, subscribe/unsubscribe do hook làm.
 *
 * Lưu ý quan trọng (migrate 2026-10-15):
 * - Trước đây dùng `new SockJS(wsUrl)` trong webSocketFactory. SockJS 1.x
 *   attach 'unload' event listener → Chrome cảnh báo
 *   `[Violation] Permissions policy violation: unload is not allowed`.
 * - Migrate sang `new WebSocket(wsUrl)` thuần. Spring Boot hỗ trợ native
 *   WebSocket endpoint qua @EnableWebSocketMessageBroker + STOMP.
 *   Nếu BE chỉ hỗ trợ SockJS (vd: cũ < 2.0), cần đổi lại wsUrl sang
 *   path /ws-native hoặc giữ SockJS.
 */
export interface FlashSaleStompClient {
  client: Client;
  subscribe: (destination: string, cb: (msg: IMessage) => void) => () => void;
  disconnect: () => void;
}

function getWsUrl(): string {
  const raw = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8080/ws";
  return raw.replace(/\/$/, "");
}

/**
 * Convert ws:// hoặc wss:// từ http(s):// URL (Spring Boot mặc định
 * dùng http(s):// cho cả WS endpoint; cần đổi scheme khi dùng native
 * WebSocket vì browser yêu cầu ws(s):// protocol).
 */
function toNativeWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}

export function createFlashSaleStompClient(
  accessToken: string | null
): FlashSaleStompClient {
  const wsUrl = toNativeWsUrl(getWsUrl());

  const config: StompConfig = {
    // Native WebSocket — KHÔNG dùng SockJS (xem comment migrate ở đầu file).
    webSocketFactory: () => new WebSocket(wsUrl),
    reconnectDelay: WS_RECONNECT_DELAY_MS,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
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
