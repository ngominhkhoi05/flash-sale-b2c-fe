/**
 * Test cho createFlashSaleStompClient (src/lib/stomp.ts).
 *
 * Verify:
 * 1. SockJS đã được loại bỏ — webSocketFactory trả về native WebSocket.
 *    Trước đây dùng SockJS gây 'Permissions policy violation: unload is
 *    not allowed' warning trên console (do SockJS 1.x attach 'unload'
 *    event). Migrate sang WebSocket thuần để khắc phục.
 * 2. Client vẫn kết nối được với cùng API (createClient, activate, ...).
 * 3. Access token được truyền qua connectHeaders (Bearer).
 *
 * Note: ta KHÔNG test trực tiếp việc connect đến BE (cần mock WebSocket)
 * — chỉ verify cấu hình client đúng.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock @stomp/stompjs — ta cần inspect StompConfig được truyền vào Client
const mockClientInstances: Array<{
  config: unknown;
  activate: ReturnType<typeof vi.fn>;
  deactivate: ReturnType<typeof vi.fn>;
}> = [];
vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation((config: unknown) => {
    const instance = {
      config,
      activate: vi.fn(),
      deactivate: vi.fn(),
    };
    mockClientInstances.push(instance);
    return instance;
  }),
}));

// Mock sockjs-client để verify nó KHÔNG được import khi chạy test này
// (giả định module bị loại bỏ khỏi code).
vi.mock("sockjs-client", () => ({
  default: vi.fn(),
}));

import { createFlashSaleStompClient } from "./stomp";

describe("createFlashSaleStompClient – no SockJS (migrate sang WebSocket thuần)", () => {
  beforeEach(() => {
    mockClientInstances.length = 0;
  });

  it("webSocketFactory trả về native WebSocket (không phải SockJS)", () => {
    // Spy constructor WebSocket để verify stomp.ts dùng class này.
    // Dùng vi.fn() thay cho vi.spyOn(globalThis, "WebSocket") vì Vitest
    // không hỗ trợ spy class constructor với type strict — return object
    // mô phỏng các method mà webSocketFactory không gọi đến.
    const webSocketSpy = vi.fn(() => ({
      close: vi.fn(),
      send: vi.fn(),
    }));
    const originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = webSocketSpy as unknown as typeof WebSocket;

    try {
      createFlashSaleStompClient("test-token");
      expect(mockClientInstances.length).toBe(1);
      const config = mockClientInstances[0]?.config as {
        webSocketFactory: () => unknown;
      };
      expect(config.webSocketFactory).toBeDefined();

      // Gọi factory → phải return 1 instance của WebSocket
      const ws = config.webSocketFactory();
      expect(webSocketSpy).toHaveBeenCalledTimes(1);
      expect(ws).toBeDefined();
    } finally {
      globalThis.WebSocket = originalWebSocket;
    }
  });

  it("client activate được gọi ngay khi tạo (auto-connect)", () => {
    createFlashSaleStompClient(null);
    expect(mockClientInstances.length).toBe(1);
    expect(mockClientInstances[0]?.activate).toHaveBeenCalledTimes(1);
  });

  it("access token được truyền vào connectHeaders.Authorization khi có token", () => {
    createFlashSaleStompClient("my-jwt-token");
    const config = mockClientInstances[0]?.config as {
      connectHeaders: Record<string, string>;
    };
    expect(config.connectHeaders.Authorization).toBe("Bearer my-jwt-token");
  });

  it("KHÔNG có Authorization header khi accessToken = null", () => {
    createFlashSaleStompClient(null);
    const config = mockClientInstances[0]?.config as {
      connectHeaders: Record<string, string>;
    };
    expect(config.connectHeaders.Authorization).toBeUndefined();
  });

  it("reconnect delay được set từ WS_RECONNECT_DELAY_MS (3000ms)", () => {
    createFlashSaleStompClient(null);
    const config = mockClientInstances[0]?.config as {
      reconnectDelay: number;
    };
    expect(config.reconnectDelay).toBe(3000);
  });
});
