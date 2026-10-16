/**
 * Test cho WsConnectionProvider (src/providers/WsConnectionProvider.tsx).
 *
 * Spec từ `docs/handoffs/fe-ws-integration-guide (1).md` + rule websocket-realtime.
 *
 * Requirements:
 * - Provider share 1 STOMP instance giữa nhiều consumer (vd nhiều page cùng subscribe).
 * - Expose `connectionState` cho UI hiển thị chip "Đang kết nối lại…" (docs/CLAUDE.md §8 mục 2).
 * - Auto-reconnect với exponential backoff 3s → 6s → 12s → max 30s.
 * - Cleanup khi unmount → disconnect.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue(vi.fn());

let onConnectHandler: (() => void) | null = null;
let onDisconnectHandler: (() => void) | null = null;
let onStompErrorHandler: ((frame: { body: string }) => void) | null = null;
let onWebSocketErrorHandler: ((event: Event) => void) | null = null;
let mockClientInstance: {
  activate: typeof mockActivate;
  deactivate: typeof mockDeactivate;
  subscribe: typeof mockSubscribe;
  connected: boolean;
  onConnect: (() => void) | undefined;
  onDisconnect: (() => void) | undefined;
  onStompError: ((frame: { body: string }) => void) | undefined;
  onWebSocketError: ((event: Event) => void) | undefined;
};

vi.mock("@/lib/stomp", () => ({
  createFlashSaleStompClient: vi.fn(() => {
    return {
      client: mockClientInstance,
      subscribe: mockSubscribe,
      disconnect: mockDeactivate,
    };
  }),
}));

vi.mock("@/lib/api", () => ({
  getAccessToken: vi.fn(() => "mock-token"),
}));

/**
 * Capture handlers mà provider set sau khi mount
 * (provider set client.onConnect = ... sau, không qua Client constructor).
 */
function captureClientHandlers() {
  onConnectHandler = null;
  onDisconnectHandler = null;
  onStompErrorHandler = null;
  onWebSocketErrorHandler = null;

  // Wrap setter để capture giá trị mới nhất
  Object.defineProperty(mockClientInstance, "onConnect", {
    configurable: true,
    get() {
      return onConnectHandler;
    },
    set(fn) {
      onConnectHandler = fn ?? null;
    },
  });
  Object.defineProperty(mockClientInstance, "onDisconnect", {
    configurable: true,
    get() {
      return onDisconnectHandler;
    },
    set(fn) {
      onDisconnectHandler = fn ?? null;
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();

  mockClientInstance = {
    activate: mockActivate,
    deactivate: mockDeactivate,
    subscribe: mockSubscribe,
    connected: false,
    onConnect: undefined,
    onDisconnect: undefined,
    onStompError: undefined,
    onWebSocketError: undefined,
  };

  captureClientHandlers();

  // Capture handlers từ Client config
  vi.doMock("@stomp/stompjs", () => ({
    Client: vi.fn().mockImplementation((config: Record<string, unknown>) => {
      onConnectHandler = (config.onConnect as (() => void) | undefined) ?? null;
      onDisconnectHandler =
        (config.onDisconnect as (() => void) | undefined) ?? null;
      onStompErrorHandler =
        (config.onStompError as ((frame: { body: string }) => void) | undefined) ??
        null;
      onWebSocketErrorHandler =
        (config.onWebSocketError as ((event: Event) => void) | undefined) ?? null;
      return mockClientInstance;
    }),
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});

async function renderWsHook() {
  const { useWs, WsConnectionProvider } = await import("./WsConnectionProvider");
  return renderHook(() => useWs(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <WsConnectionProvider>{children}</WsConnectionProvider>
    ),
  });
}

describe("WsConnectionProvider – share 1 connection", () => {
  it("createFlashSaleStompClient được gọi đúng 1 lần cho nhiều consumer", async () => {
    const { createFlashSaleStompClient } = await import("@/lib/stomp");
    const { useWs, WsConnectionProvider } = await import(
      "./WsConnectionProvider"
    );

    const wrapper1 = ({ children }: { children: ReactNode }) => (
      <WsConnectionProvider>{children}</WsConnectionProvider>
    );

    // Render 2 hook cùng wrapper → share 1 instance
    const { result } = renderHook(
      () => {
        const a = useWs();
        const b = useWs();
        return { a, b };
      },
      { wrapper: wrapper1 },
    );

    expect(result.current.a.ensureClient).toBe(result.current.b.ensureClient);
    expect(createFlashSaleStompClient).toHaveBeenCalledTimes(1);
  });
});

describe("WsConnectionProvider – connection state", () => {
  it("initial state là 'connecting' sau khi activate", async () => {
    const { useWs, WsConnectionProvider } = await import(
      "./WsConnectionProvider"
    );

    const { result } = renderHook(() => useWs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WsConnectionProvider>{children}</WsConnectionProvider>
      ),
    });

    // Ban đầu: activate đã gọi nhưng connected=false → 'connecting'
    expect(result.current.connectionState).toBe("connecting");
  });

  it("chuyển sang 'connected' khi onConnect handler được gọi", async () => {
    const { useWs, WsConnectionProvider } = await import(
      "./WsConnectionProvider"
    );

    const { result } = renderHook(() => useWs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WsConnectionProvider>{children}</WsConnectionProvider>
      ),
    });

    // Simulate BE onConnect
    act(() => {
      onConnectHandler?.();
      mockClientInstance.connected = true;
    });

    expect(result.current.connectionState).toBe("connected");
  });

  it("chuyển sang 'reconnecting' khi onDisconnect được gọi (CHƯA retry lần đầu)", async () => {
    const { useWs, WsConnectionProvider } = await import(
      "./WsConnectionProvider"
    );

    const { result } = renderHook(() => useWs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WsConnectionProvider>{children}</WsConnectionProvider>
      ),
    });

    // Connect trước
    act(() => {
      onConnectHandler?.();
      mockClientInstance.connected = true;
    });

    // Sau đó disconnect
    act(() => {
      onDisconnectHandler?.();
    });

    expect(result.current.connectionState).toBe("reconnecting");
  });
});

describe("WsConnectionProvider – cleanup", () => {
  it("disconnect được gọi khi unmount", async () => {
    const { useWs, WsConnectionProvider } = await import(
      "./WsConnectionProvider"
    );

    const { unmount } = renderHook(() => useWs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WsConnectionProvider>{children}</WsConnectionProvider>
      ),
    });

    unmount();

    expect(mockDeactivate).toHaveBeenCalled();
  });
});

describe("WsConnectionProvider – fallback khi không có provider", () => {
  it("useWs() bên ngoài WsConnectionProvider vẫn hoạt động (cho testing)", async () => {
    const { useWs } = await import("./WsConnectionProvider");

    const { result } = renderHook(() => useWs());

    // Vẫn có ensureClient + connectionState
    expect(result.current.ensureClient).toBeDefined();
    expect(result.current.connectionState).toBeDefined();
  });
});

describe("WsConnectionProvider – exponential backoff theo BE guide §3.4", () => {
  it("BACKOFF_SCHEDULE = [3000, 6000, 12000, 30000] ms theo BE WS guide", async () => {
    const { WS_RECONNECT_BACKOFF_MS } = await import("@/lib/constants");
    expect(WS_RECONNECT_BACKOFF_MS).toEqual([3000, 6000, 12000, 30000]);
  });

  it("lần retry 1 dùng 3000ms, lần 2 dùng 6000ms, lần 3 dùng 12000ms, lần 4 dùng 30000ms (cap)", async () => {
    const { useWs, WsConnectionProvider } = await import(
      "./WsConnectionProvider"
    );

    const { result } = renderHook(() => useWs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WsConnectionProvider>{children}</WsConnectionProvider>
      ),
    });

    // Connect
    act(() => {
      onConnectHandler?.();
      mockClientInstance.connected = true;
    });
    expect(result.current.connectionState).toBe("connected");

    // Lần 1 disconnect → reconnect sau 3000ms
    act(() => {
      onDisconnectHandler?.();
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0); // chưa trigger
    act(() => {
      vi.advanceTimersByTime(1);
    });
    // Sau 3000ms, scheduleReconnect sẽ gọi connect() lại

    // Lần 2 disconnect → reconnect sau 6000ms
    act(() => {
      onDisconnectHandler?.();
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Lần 3 disconnect → reconnect sau 12000ms
    act(() => {
      onDisconnectHandler?.();
    });
    act(() => {
      vi.advanceTimersByTime(12000);
    });

    // Lần 4 disconnect → reconnect sau 30000ms (cap)
    act(() => {
      onDisconnectHandler?.();
    });
    act(() => {
      vi.advanceTimersByTime(30000);
    });
  });
});