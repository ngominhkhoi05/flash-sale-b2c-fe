/**
 * Test cho useFlashSaleWs (src/hooks/useFlashSaleWs.ts).
 *
 * Spec từ `docs/handoffs/fe-ws-integration-guide (1).md`:
 * - Hook signature: `({enabled?, subscribeSlotIds, subscribeOrderCodes, onMessage})`.
 * - Auto subscribe `/topic/flash-sale/slot/{slotId}/stock-update` cho mỗi slotId.
 * - Auto subscribe `/user/queue/flash-sale/orders/{code}/status` cho mỗi orderCode.
 * - Auto subscribe `/user/queue/flash-sale/reservation-result` (luôn luôn).
 * - Unmount → unsubscribe tất cả.
 * - onMessage được gọi với `WsEvent` (parsed từ `msg.body.data`).
 * - Backward compatible: chấp nhận cũ `useFlashSaleWs(destination, onMessage)`.
 *
 * Trước khi sửa code, test này phải FAIL trên implementation hiện tại
 * (chỉ nhận 1 destination, không auto-subscribe 3 loại).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock @/lib/stomp factory
const mockSubscribe = vi.fn().mockReturnValue(vi.fn()); // unsub
const mockDisconnect = vi.fn();
const mockStompClient = {
  subscribe: mockSubscribe,
  disconnect: mockDisconnect,
  client: {},
};

vi.mock("@/lib/stomp", () => ({
  createFlashSaleStompClient: vi.fn(() => mockStompClient),
}));

vi.mock("@/lib/api", () => ({
  getAccessToken: vi.fn(() => "mock-token"),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscribe.mockReturnValue(vi.fn());
});

afterEach(() => {
  vi.resetModules();
});

describe("useFlashSaleWs – signature mới (options object)", () => {
  it("accepts options object với enabled, subscribeSlotIds, subscribeOrderCodes, onMessage", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    const onMessage = vi.fn();

    expect(() => {
      renderHook(() =>
        useFlashSaleWs({
          enabled: true,
          subscribeSlotIds: [1, 2],
          subscribeOrderCodes: ["FS-001"],
          onMessage,
        }),
      );
    }).not.toThrow();
  });

  it("subscribe stock topic cho từng slotId khi mount", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    renderHook(() =>
      useFlashSaleWs({
        enabled: true,
        subscribeSlotIds: [1, 2, 5],
        subscribeOrderCodes: [],
        onMessage: vi.fn(),
      }),
    );

    const subscribed = mockSubscribe.mock.calls.map((c) => c[0] as string);
    expect(subscribed).toContain("/topic/flash-sale/slot/1/stock-update");
    expect(subscribed).toContain("/topic/flash-sale/slot/2/stock-update");
    expect(subscribed).toContain("/topic/flash-sale/slot/5/stock-update");
  });

  it("subscribe order status queue cho từng orderCode khi mount", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    renderHook(() =>
      useFlashSaleWs({
        enabled: true,
        subscribeSlotIds: [],
        subscribeOrderCodes: ["FS-A1", "FS-B2"],
        onMessage: vi.fn(),
      }),
    );

    const subscribed = mockSubscribe.mock.calls.map((c) => c[0] as string);
    expect(subscribed).toContain("/user/queue/flash-sale/orders/FS-A1/status");
    expect(subscribed).toContain("/user/queue/flash-sale/orders/FS-B2/status");
  });

  it("luôn subscribe /user/queue/flash-sale/reservation-result", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    renderHook(() =>
      useFlashSaleWs({
        enabled: true,
        subscribeSlotIds: [],
        subscribeOrderCodes: [],
        onMessage: vi.fn(),
      }),
    );

    const subscribed = mockSubscribe.mock.calls.map((c) => c[0] as string);
    expect(subscribed).toContain("/user/queue/flash-sale/reservation-result");
  });

  it("unsubscribe + disconnect khi unmount", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    const unsub1 = vi.fn();
    const unsub2 = vi.fn();
    mockSubscribe
      .mockReturnValueOnce(unsub1)
      .mockReturnValueOnce(unsub2);

    const { unmount } = renderHook(() =>
      useFlashSaleWs({
        enabled: true,
        subscribeSlotIds: [1],
        subscribeOrderCodes: [],
        onMessage: vi.fn(),
      }),
    );

    unmount();

    expect(unsub1).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("không connect khi enabled=false", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    const { createFlashSaleStompClient } = await import("@/lib/stomp");
    renderHook(() =>
      useFlashSaleWs({
        enabled: false,
        subscribeSlotIds: [1],
        subscribeOrderCodes: [],
        onMessage: vi.fn(),
      }),
    );

    expect(createFlashSaleStompClient).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});

describe("useFlashSaleWs – onMessage xử lý WsEvent", () => {
  it("onMessage nhận parsed `data` field từ envelope (BE format: {success, code, data})", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    const onMessage = vi.fn();
    let stockCallback: ((msg: { body: string }) => void) | undefined;

    mockSubscribe.mockImplementation(
      (destination: string, cb: (msg: { body: string }) => void) => {
        if (destination.includes("stock-update")) {
          stockCallback = cb;
        }
        return vi.fn();
      },
    );

    renderHook(() =>
      useFlashSaleWs({
        enabled: true,
        subscribeSlotIds: [42],
        subscribeOrderCodes: [],
        onMessage,
      }),
    );

    // Simulate BE message
    stockCallback?.({
      body: JSON.stringify({
        success: true,
        code: 200,
        message: "stock updated",
        data: {
          eventType: "STOCK_DECREMENTED",
          slotId: 42,
          flashSaleItemId: 100,
          availableStock: 7,
          occurredAt: "2026-10-16T10:00:00Z",
        },
        timestamp: "2026-10-16T10:00:00Z",
      }),
    });

    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "STOCK_DECREMENTED",
        slotId: 42,
        flashSaleItemId: 100,
        availableStock: 7,
      }),
    );
  });

  it("skip message nếu parse JSON fail (không throw)", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    const onMessage = vi.fn();
    let cb: ((msg: { body: string }) => void) | undefined;

    mockSubscribe.mockImplementation(
      (_d: string, callback: (msg: { body: string }) => void) => {
        cb = callback;
        return vi.fn();
      },
    );

    renderHook(() =>
      useFlashSaleWs({
        enabled: true,
        subscribeSlotIds: [1],
        subscribeOrderCodes: [],
        onMessage,
      }),
    );

    expect(() => cb?.({ body: "invalid-json{" })).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });
});

describe("useFlashSaleWs – backward compat với signature cũ", () => {
  it("chấp nhận (destination, onMessage) kiểu cũ", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");

    expect(() => {
      renderHook(() =>
        useFlashSaleWs(
          "/topic/flash-sale/legacy" as never,
          vi.fn(),
        ),
      );
    }).not.toThrow();
  });

  it("signature cũ vẫn subscribe được destination đó", async () => {
    const { useFlashSaleWs } = await import("./useFlashSaleWs");
    renderHook(() =>
      useFlashSaleWs(
        "/topic/flash-sale/legacy" as never,
        vi.fn(),
      ),
    );

    const subscribed = mockSubscribe.mock.calls.map((c) => c[0] as string);
    expect(subscribed).toContain("/topic/flash-sale/legacy");
  });
});