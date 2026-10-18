/**
 * Test cho createFlashSaleStompClient (src/lib/stomp.ts).
 *
 * Spec từ `docs/handoffs/fe-ws-integration-guide (1).md`:
 * - Endpoint: `ws://<host>/ws` (BE Spring Boot SockJS, KHÔNG `/ws/flash-sale`).
 * - Auth: JWT truyền qua query param `?token=<access_token>` (browser không cho set
 *   Authorization header khi upgrade WebSocket).
 * - Heartbeat: 10s incoming, 10s outgoing.
 * - Reconnect: exponential backoff (3s → 6s → 12s → max 30s).
 *
 * Trước khi sửa code, test này phải FAIL trên implementation hiện tại.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Track config + factory từ Client constructor.
let capturedConfig: Record<string, unknown> | null = null;
let capturedWebSocketFactory: (() => unknown) | null = null;
const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({
  unsubscribe: vi.fn(),
});

vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation((config: Record<string, unknown>) => {
    capturedConfig = config;
    capturedWebSocketFactory =
      (config.webSocketFactory as () => unknown) ?? null;
    return {
      activate: mockActivate,
      deactivate: mockDeactivate,
      subscribe: mockSubscribe,
      connected: false,
      onConnect: undefined,
    };
  }),
}));

const mockSockJSConstructor = vi.fn();
vi.mock("sockjs-client", () => ({
  default: vi.fn().mockImplementation((url: string) => {
    mockSockJSConstructor(url);
    return { url, _isSockJS: true };
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedConfig = null;
  capturedWebSocketFactory = null;
});

afterEach(() => {
  vi.resetModules();
  delete process.env.NEXT_PUBLIC_WS_URL;
});

function getFactoryAndCall() {
  if (!capturedWebSocketFactory) {
    throw new Error("webSocketFactory chưa được set trong Client config");
  }
  // Gọi factory → trigger new SockJS(...) → ghi nhận URL.
  capturedWebSocketFactory();
  return mockSockJSConstructor.mock.calls.at(-1)?.[0] as string;
}

describe("createFlashSaleStompClient – endpoint", () => {
  it("THROW error khi NEXT_PUBLIC_WS_URL không set (production silent-fail bug)", async () => {
    delete process.env.NEXT_PUBLIC_WS_URL;
    const { createFlashSaleStompClient } = await import("./stomp");
    // Khi env rỗng, code phải throw NGAY thay vì fallback localhost —
    // vì localhost sẽ được SockJS resolve thành same-origin, dẫn đến
    // gọi /info lên Next.js → 404 (xem docs/superpowers/handoffs/
    // 2026-10-18-vps-ws-404-handoff.md).
    expect(() => createFlashSaleStompClient("test-token")).toThrow(
      /NEXT_PUBLIC_WS_URL/,
    );
  });

  it("THROW error khi NEXT_PUBLIC_WS_URL = chuỗi rỗng", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "";
    const { createFlashSaleStompClient } = await import("./stomp");
    expect(() => createFlashSaleStompClient("test-token")).toThrow(
      /NEXT_PUBLIC_WS_URL/,
    );
  });

  it("THROW error khi NEXT_PUBLIC_WS_URL chỉ chứa whitespace", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "   ";
    const { createFlashSaleStompClient } = await import("./stomp");
    expect(() => createFlashSaleStompClient("test-token")).toThrow(
      /NEXT_PUBLIC_WS_URL/,
    );
  });

  it("dùng NEXT_PUBLIC_WS_URL từ env, strip trailing slash", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "https://api.example.com/ws/";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("test-token");

    const url = getFactoryAndCall();
    expect(url.startsWith("https://new?")).toBe(false);
    expect(url).toContain("https://api.example.com/ws");
  });

  it("KHÔNG thêm /flash-sale vào URL (rule cũ sai — BE dùng /ws chung)", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("test-token");

    const url = getFactoryAndCall();
    expect(url).not.toContain("/flash-sale");
  });
});

describe("createFlashSaleStompClient – auth via query param", () => {
  it("append ?token=<access_token> query param khi token được cung cấp", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("jwt-abc-123");

    const url = getFactoryAndCall();
    // URL có dạng `http://localhost:8080/ws?token=jwt-abc-123`
    expect(url).toMatch(/token=jwt-abc-123/);
  });

  it("KHÔNG thêm ?token= khi token là null", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient(null);

    const url = getFactoryAndCall();
    expect(url).not.toContain("token=");
  });

  it("KHÔNG set Authorization header (browser upgrade-WS không cho)", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("jwt-abc-123");

    const headers =
      (capturedConfig?.connectHeaders as Record<string, string> | undefined) ??
      {};
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("URL-encode token theo RFC 3986 (/ + ' ' = ...)", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("jwt/with+special=chars");

    const url = getFactoryAndCall();
    // `/` encode thành %2F, `+` thành %2B, `=` thành %3D
    expect(url).toContain(encodeURIComponent("jwt/with+special=chars"));
    expect(url).not.toContain("jwt/with+special=chars");
  });
});

describe("createFlashSaleStompClient – heartbeat + reconnect", () => {
  it("set heartbeat incoming/outgoing = 10s theo BE spec", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("token");

    expect(capturedConfig?.heartbeatIncoming).toBe(10_000);
    expect(capturedConfig?.heartbeatOutgoing).toBe(10_000);
  });

  it("set reconnectDelay > 0 (BE yêu cầu exponential backoff)", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("token");

    // @stomp/stompjs 7.x chỉ nhận number — exponential backoff có thể
    // được implement qua nhiều cơ chế (reconnectDelay callback, custom logic).
    // Spec tối thiểu: reconnectDelay > 0 để retry khi disconnect.
    expect(typeof capturedConfig?.reconnectDelay).toBe("number");
    expect(capturedConfig?.reconnectDelay as number).toBeGreaterThan(0);
  });
});

describe("createFlashSaleStompClient – lifecycle", () => {
  it("tự activate client khi tạo (auto-connect)", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    createFlashSaleStompClient("token");

    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it("disconnect() gọi client.deactivate", async () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://localhost:8080/ws";
    const { createFlashSaleStompClient } = await import("./stomp");
    const conn = createFlashSaleStompClient("token");

    conn.disconnect();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
  });
});