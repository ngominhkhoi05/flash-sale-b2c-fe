"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createFlashSaleStompClient,
  type FlashSaleStompClient,
} from "@/lib/stomp";
import { getAccessToken } from "@/lib/api";
import { WS_RECONNECT_BACKOFF_MS } from "@/lib/constants";

/**
 * WsConnectionProvider – mount STOMP duy nhất cho toàn app.
 *
 * Spec: `docs/handoffs/fe-ws-integration-guide (1).md` + `docs/CLAUDE.md` §8 + §13.
 *
 * Cung cấp:
 * - `ensureClient()`: factory trả về FlashSaleStompClient (cho hook `useFlashSaleWs`).
 * - `connectionState`: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
 *   → UI dùng để hiển thị chip "Đang kết nối lại…" (rule websocket-realtime §8).
 *
 * Auto-reconnect theo exponential backoff: 3s → 6s → 12s → max 30s.
 * Cleanup khi unmount → disconnect.
 *
 * Fallback: nếu component dùng useWs() ngoài provider (vd testing),
 * vẫn trả về object đầy đủ với instance riêng.
 */
export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

interface WsContextValue {
  ensureClient: () => FlashSaleStompClient;
  connectionState: ConnectionState;
}

const WsCtx = createContext<WsContextValue | null>(null);

// Exponential backoff theo BE rule (§3.4): 3s → 6s → 12s → 30s
const BACKOFF_SCHEDULE = WS_RECONNECT_BACKOFF_MS;

/**
 * External store cho connection state — dùng useSyncExternalStore (React 18+)
 * thay vì useState + setState trong effect (bị react-hooks/set-state-in-effect flag).
 */
function createConnectionStateStore() {
  let state: ConnectionState = "connecting";
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (next: ConnectionState) => {
      if (state === next) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe: (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

export function WsConnectionProvider({ children }: { children: ReactNode }) {
  // Per-provider store: mỗi Provider có state machine riêng.
  // Lazy init qua useState để tránh eslint react-hooks/refs (access ref in render).
  const [store] = useState(createConnectionStateStore);
  const connectionState = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );

  // Hold client instance + reconnect bookkeeping
  const connRef = useRef<FlashSaleStompClient | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef<string | null>(getAccessToken());
  /** Ref tới hàm connect — tránh eslint react-hooks/immutability khi
   *  setTimeout callback tham chiếu `connect` trước khi useCallback kết thúc. */
  const connectRef = useRef<(() => FlashSaleStompClient) | null>(null);

  const teardown = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (connRef.current) {
      try {
        connRef.current.disconnect();
      } catch {
        // ignore
      }
      connRef.current = null;
    }
  }, []);

  const connect = useCallback((): FlashSaleStompClient => {
    teardown();
    const token = getAccessToken();
    tokenRef.current = token;
    const conn = createFlashSaleStompClient(token);

    // Subscribe lifecycle events của underlying Client
    const client = conn.client;
    client.onConnect = () => {
      reconnectAttemptRef.current = 0;
      store.setState("connected");
    };
    client.onDisconnect = () => {
      // Disconnect không phải lỗi nếu user chủ động logout
      if (!getAccessToken()) {
        store.setState("disconnected");
        return;
      }
      scheduleReconnect();
    };
    client.onStompError = () => {
      scheduleReconnect();
    };
    client.onWebSocketError = () => {
      scheduleReconnect();
    };

    connRef.current = conn;
    store.setState("connecting");

    function scheduleReconnect() {
      store.setState("reconnecting");
      const attemptIdx = Math.min(
        reconnectAttemptRef.current,
        BACKOFF_SCHEDULE.length - 1,
      );
      const delayMs = BACKOFF_SCHEDULE[attemptIdx];
      reconnectAttemptRef.current += 1;

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connectRef.current?.();
      }, delayMs);
    }

    return conn;
  }, [teardown, store]); // store stable (lazy init), include for lint

  // Lưu connect vào ref để setTimeout callback dùng được
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Mount: tạo client ngay (external system lifecycle) + unmount cleanup.
  useEffect(() => {
    connect();
    return () => {
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: chỉ mount/unmount, không depend vào callback

  const ensureClient = useCallback(() => {
    if (!connRef.current) {
      // Lazy create (vd testing hoặc trước khi effect chạy)
      connRef.current = connect();
    }
    return connRef.current;
  }, [connect]);

  const value = useMemo<WsContextValue>(
    () => ({ ensureClient, connectionState }),
    [ensureClient, connectionState],
  );

  return <WsCtx.Provider value={value}>{children}</WsCtx.Provider>;
}

export function useWs(): WsContextValue {
  const ctx = useContext(WsCtx);
  if (!ctx) {
    // Fallback: standalone (testing, storybook).
    // Dùng local variable thay vì useRef vì hook này fallback
    // cho context (không nằm trong component lifecycle).
    const token = getAccessToken();
    let localConn: FlashSaleStompClient | null = null;
    if (!localConn) {
      localConn = createFlashSaleStompClient(token);
    }
    return {
      ensureClient: () => localConn!,
      connectionState: "connecting",
    };
  }
  return ctx;
}
