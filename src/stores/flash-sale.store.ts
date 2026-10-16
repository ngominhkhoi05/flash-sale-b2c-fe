"use client";

import { create } from "zustand";

/**
 * Flash-sale realtime cache (rule websocket-realtime, state-management).
 * - In-memory, KHÔNG persist.
 * - Cập nhật trực tiếp từ STOMP theo BE phụ lục A
 *   (`docs/handoffs/fe-ws-integration-guide (1).md`).
 * - Dùng kết hợp với queryClient.setQueryData ở hook để tránh refetch cả trang.
 *
 * Fields:
 * - `byItem`: stock snapshot realtime theo itemId (WS STOCK_DECREMENTED / STOCK_RESTORED).
 * - `watchingSlots`: slotId user đang theo dõi (UI badge "sắp bắt đầu").
 * - `watchingOrders`: orderCode user đang chờ thanh toán (WS ORDER_STATUS_CHANGED).
 * - `lastReservation`: orderCode + expiresAt từ WS ORDER_RESERVED (countdown payment).
 */
export interface StockSnapshot {
  flashSaleItemId: string;
  sold: number;
  remaining: number;
  serverTime: string; // ISO
}

export interface LastReservation {
  orderCode: string;
  expiresAt: string; // ISO
}

interface FlashSaleState {
  byItem: Record<string, StockSnapshot>;
  watchingSlots: number[];
  watchingOrders: string[];
  lastReservation: LastReservation | null;

  // Stock snapshot (từ WS STOCK_DECREMENTED / STOCK_RESTORED)
  setSnapshot: (snap: StockSnapshot) => void;
  setMany: (snaps: StockSnapshot[]) => void;

  // Watching slots (UI tracking)
  addWatchingSlot: (slotId: number) => void;
  removeWatchingSlot: (slotId: number) => void;

  // Watching orders (WS subscription tracking)
  addWatchingOrder: (orderCode: string) => void;
  removeWatchingOrder: (orderCode: string) => void;

  // Last reservation (countdown payment)
  setLastReservation: (res: LastReservation) => void;
  clearLastReservation: () => void;

  // Reset toàn bộ
  reset: () => void;
}

function dedupePush<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr : [...arr, value];
}

export const useFlashSaleStore = create<FlashSaleState>((set) => ({
  byItem: {},
  watchingSlots: [],
  watchingOrders: [],
  lastReservation: null,

  setSnapshot: (snap) =>
    set((state) => ({
      byItem: { ...state.byItem, [snap.flashSaleItemId]: snap },
    })),

  setMany: (snaps) =>
    set(() => {
      const next: Record<string, StockSnapshot> = {};
      for (const s of snaps) next[s.flashSaleItemId] = s;
      return { byItem: next };
    }),

  addWatchingSlot: (slotId) =>
    set((state) => ({
      watchingSlots: dedupePush(state.watchingSlots, slotId),
    })),

  removeWatchingSlot: (slotId) =>
    set((state) => ({
      watchingSlots: state.watchingSlots.filter((id) => id !== slotId),
    })),

  addWatchingOrder: (orderCode) =>
    set((state) => ({
      watchingOrders: dedupePush(state.watchingOrders, orderCode),
    })),

  removeWatchingOrder: (orderCode) =>
    set((state) => ({
      watchingOrders: state.watchingOrders.filter((c) => c !== orderCode),
    })),

  setLastReservation: (res) => set({ lastReservation: res }),

  clearLastReservation: () => set({ lastReservation: null }),

  reset: () =>
    set({
      byItem: {},
      watchingSlots: [],
      watchingOrders: [],
      lastReservation: null,
    }),
}));