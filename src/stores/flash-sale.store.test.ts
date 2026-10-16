/**
 * Test cho useFlashSaleStore (src/stores/flash-sale.store.ts).
 *
 * Spec từ `docs/handoffs/fe-ws-integration-guide (1).md` Phụ lục A + B:
 * - Cache realtime stock theo itemId.
 * - Tracking watching slots + orders.
 * - Track last reservation result.
 *
 * KHÔNG persist (rule state-management §3 + websocket-realtime §6).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useFlashSaleStore } from "./flash-sale.store";

beforeEach(() => {
  // Reset store giữa mỗi test
  useFlashSaleStore.setState({
    byItem: {},
    watchingSlots: [],
    watchingOrders: [],
    lastReservation: null,
  });
});

describe("useFlashSaleStore – stock snapshot", () => {
  it("setSnapshot cập nhật stock cho 1 itemId", () => {
    useFlashSaleStore.getState().setSnapshot({
      flashSaleItemId: "100",
      sold: 0,
      remaining: 7,
      serverTime: "2026-10-16T10:00:00Z",
    });
    const state = useFlashSaleStore.getState();
    expect(state.byItem["100"]).toEqual({
      flashSaleItemId: "100",
      sold: 0,
      remaining: 7,
      serverTime: "2026-10-16T10:00:00Z",
    });
  });

  it("setSnapshot KHÔNG ghi đè snapshot cũ của itemId khác", () => {
    useFlashSaleStore.getState().setSnapshot({
      flashSaleItemId: "100",
      sold: 0,
      remaining: 7,
      serverTime: "t1",
    });
    useFlashSaleStore.getState().setSnapshot({
      flashSaleItemId: "200",
      sold: 0,
      remaining: 3,
      serverTime: "t2",
    });
    const state = useFlashSaleStore.getState();
    expect(state.byItem["100"]?.remaining).toBe(7);
    expect(state.byItem["200"]?.remaining).toBe(3);
  });

  it("setSnapshot update với cùng itemId → ghi đè giá trị mới", () => {
    useFlashSaleStore.getState().setSnapshot({
      flashSaleItemId: "100",
      sold: 0,
      remaining: 7,
      serverTime: "t1",
    });
    useFlashSaleStore.getState().setSnapshot({
      flashSaleItemId: "100",
      sold: 0,
      remaining: 3,
      serverTime: "t2",
    });
    expect(useFlashSaleStore.getState().byItem["100"]?.remaining).toBe(3);
  });

  it("setMany ghi đè toàn bộ byItem với nhiều snapshot", () => {
    useFlashSaleStore.setState({
      byItem: {
        "100": {
          flashSaleItemId: "100",
          sold: 0,
          remaining: 9,
          serverTime: "t0",
        },
      },
    });
    useFlashSaleStore.getState().setMany([
      {
        flashSaleItemId: "200",
        sold: 0,
        remaining: 3,
        serverTime: "t1",
      },
      {
        flashSaleItemId: "300",
        sold: 0,
        remaining: 1,
        serverTime: "t1",
      },
    ]);
    const state = useFlashSaleStore.getState();
    // Snapshot cũ bị xoá vì setMany ghi đè toàn bộ
    expect(state.byItem["100"]).toBeUndefined();
    expect(state.byItem["200"]?.remaining).toBe(3);
    expect(state.byItem["300"]?.remaining).toBe(1);
  });

  it("reset xoá tất cả snapshot + watching + lastReservation", () => {
    useFlashSaleStore.getState().setSnapshot({
      flashSaleItemId: "100",
      sold: 0,
      remaining: 7,
      serverTime: "t",
    });
    useFlashSaleStore.getState().addWatchingSlot(1);
    useFlashSaleStore.getState().addWatchingOrder("FS-A");
    useFlashSaleStore.getState().setLastReservation({
      orderCode: "FS-A",
      expiresAt: "t",
    });

    useFlashSaleStore.getState().reset();

    const state = useFlashSaleStore.getState();
    expect(state.byItem).toEqual({});
    expect(state.watchingSlots).toEqual([]);
    expect(state.watchingOrders).toEqual([]);
    expect(state.lastReservation).toBeNull();
  });
});

describe("useFlashSaleStore – watching slots (FE §6 mục 'theo dõi')", () => {
  it("addWatchingSlot thêm slotId vào watchingSlots (no duplicate)", () => {
    useFlashSaleStore.getState().addWatchingSlot(1);
    useFlashSaleStore.getState().addWatchingSlot(1);
    useFlashSaleStore.getState().addWatchingSlot(2);

    expect(useFlashSaleStore.getState().watchingSlots).toEqual([1, 2]);
  });

  it("removeWatchingSlot xoá slotId khỏi watchingSlots", () => {
    useFlashSaleStore.setState({ watchingSlots: [1, 2, 3] });
    useFlashSaleStore.getState().removeWatchingSlot(2);

    expect(useFlashSaleStore.getState().watchingSlots).toEqual([1, 3]);
  });
});

describe("useFlashSaleStore – watching orders (cho order status WS)", () => {
  it("addWatchingOrder thêm orderCode (no duplicate)", () => {
    useFlashSaleStore.getState().addWatchingOrder("FS-A");
    useFlashSaleStore.getState().addWatchingOrder("FS-A");
    useFlashSaleStore.getState().addWatchingOrder("FS-B");

    expect(useFlashSaleStore.getState().watchingOrders).toEqual([
      "FS-A",
      "FS-B",
    ]);
  });

  it("removeWatchingOrder xoá orderCode", () => {
    useFlashSaleStore.setState({ watchingOrders: ["FS-A", "FS-B"] });
    useFlashSaleStore.getState().removeWatchingOrder("FS-A");

    expect(useFlashSaleStore.getState().watchingOrders).toEqual(["FS-B"]);
  });
});

describe("useFlashSaleStore – lastReservation (cho UI countdown payment)", () => {
  it("setLastReservation lưu orderCode + expiresAt", () => {
    useFlashSaleStore.getState().setLastReservation({
      orderCode: "FS-261001-A7K2Q",
      expiresAt: "2026-10-16T10:05:00Z",
    });

    const r = useFlashSaleStore.getState().lastReservation;
    expect(r).toEqual({
      orderCode: "FS-261001-A7K2Q",
      expiresAt: "2026-10-16T10:05:00Z",
    });
  });

  it("clearLastReservation set null", () => {
    useFlashSaleStore.getState().setLastReservation({
      orderCode: "FS-A",
      expiresAt: "t",
    });
    useFlashSaleStore.getState().clearLastReservation();
    expect(useFlashSaleStore.getState().lastReservation).toBeNull();
  });
});