"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  createFlashSaleStompClient,
  type FlashSaleStompClient,
} from "@/lib/stomp";
import { getAccessToken } from "@/lib/api";
import { useFlashSaleStore } from "@/stores/flash-sale.store";
import {
  WS_DESTINATIONS,
  type WsEvent,
  type WsEventType,
} from "@/features/flash-sale/types";

/**
 * useFlashSaleWs – mount STOMP subscriptions cho Flash Sale realtime.
 *
 * Spec: `docs/handoffs/fe-ws-integration-guide (1).md` §4.1 + §3.
 *
 * Hai dạng signature được hỗ trợ:
 * 1. Mới (preferred): `useFlashSaleWs({enabled?, subscribeSlotIds, subscribeOrderCodes, onMessage})`
 *    - Auto subscribe:
 *      - `/topic/flash-sale/slot/{slotId}/stock-update` cho từng slotId
 *      - `/user/queue/flash-sale/orders/{code}/status` cho từng orderCode
 *      - `/user/queue/flash-sale/reservation-result` (luôn luôn)
 *    - Parsed WsEvent (lấy field `data` từ BE envelope `{success, code, data}`)
 *      rồi gọi onMessage.
 * 2. Cũ (backward compatible, deprecated): `useFlashSaleWs(destination, onMessage)`
 *
 * Tự ghi stock snapshot vào `useFlashSaleStore.setSnapshot()` để component
 * có thể subscribe realtime stock qua Zustand mà không cần refetch cả page
 * (xem `docs/CLAUDE.md` §8 mục 2).
 */

export interface UseFlashSaleWsOptions {
  enabled?: boolean;
  subscribeSlotIds?: number[];
  subscribeOrderCodes?: string[];
  onMessage?: (event: WsEvent) => void;
}

export type UseFlashSaleWsArg =
  | UseFlashSaleWsOptions
  // Legacy: `(destination: string | null, onMessage: (snapshot: unknown) => void)`
  | [string | null, (snapshot: unknown) => void]
  | string
  | null;

export function useFlashSaleWs(
  arg1: UseFlashSaleWsArg,
  arg2?: (snapshot: unknown) => void,
): void {
  // Detect signature – LUÔN tạo `options` để hooks bên dưới gọi được
  // (không early return – tránh vi phạm react-hooks/rules-of-hooks).
  let options: UseFlashSaleWsOptions;

  if (
    arg1 !== null &&
    typeof arg1 === "object" &&
    !Array.isArray(arg1) &&
    "onMessage" in (arg1 as object)
  ) {
    // Mới: options object
    options = arg1 as UseFlashSaleWsOptions;
  } else if (typeof arg1 === "string" && typeof arg2 === "function") {
    // Cũ: (destination, onMessage)
    const destination = arg1;
    const onMessage = arg2;
    // Map legacy destination thành options đơn giản
    options = {
      enabled: !!destination,
      subscribeSlotIds: [],
      subscribeOrderCodes: [],
      // Wrap onMessage để skip WsEvent structure (legacy caller tự parse)
      onMessage: (event: WsEvent) => onMessage(event as unknown),
    };
  } else {
    // Edge: caller không hợp lệ → no-op an toàn (tất cả hooks vẫn chạy)
    options = {
      enabled: false,
      subscribeSlotIds: [],
      subscribeOrderCodes: [],
      onMessage: undefined,
    };
  }

  const enabled = options.enabled ?? true;
  // useMemo để giữ reference ổn định qua các render — tránh trigger
  // re-subscribe mỗi lần parent re-render (xem rule react-hooks/exhaustive-deps).
  const subscribeSlotIds = useMemo(
    () => options.subscribeSlotIds ?? [],
    [options.subscribeSlotIds],
  );
  const subscribeOrderCodes = useMemo(
    () => options.subscribeOrderCodes ?? [],
    [options.subscribeOrderCodes],
  );
  const onMessage = options.onMessage;

  const cbRef = useRef(onMessage);
  useEffect(() => {
    cbRef.current = onMessage;
  }, [onMessage]);

  const setSnapshot = useFlashSaleStore((s) => s.setSnapshot);

  // Legacy destination lưu trong ref (subscribe 1 lần duy nhất cho legacy path)
  const legacyDestinationRef = useRef<string | null>(
    typeof arg1 === "string" ? arg1 : null,
  );

  useEffect(() => {
    if (!enabled) return;
    if (!legacyDestinationRef.current) return; // legacy + options call khác nhau

    const token = getAccessToken();
    const conn: FlashSaleStompClient = createFlashSaleStompClient(token);
    const off = conn.subscribe(legacyDestinationRef.current, (msg) => {
      try {
        const parsed = JSON.parse(msg.body) as WsEvent;
        cbRef.current?.(parsed);
      } catch {
        // ignore malformed
      }
    });
    return () => {
      off();
      conn.disconnect();
    };
  }, [enabled, legacyDestinationRef]);

  useEffect(() => {
    if (!enabled) return;
    // Nếu là legacy call thì effect trên đã handle
    if (legacyDestinationRef.current) return;

    const token = getAccessToken();
    const conn: FlashSaleStompClient = createFlashSaleStompClient(token);

    const unsubs: Array<() => void> = [];

    // 1. Subscribe stock topic cho từng slot
    for (const slotId of subscribeSlotIds) {
      const dest = WS_DESTINATIONS.slotStock(slotId);
      const off = conn.subscribe(dest, (msg) => {
        handleWsMessage(msg.body, cbRef.current, setSnapshot);
      });
      unsubs.push(off);
    }

    // 2. Subscribe order status cho từng orderCode
    for (const code of subscribeOrderCodes) {
      const dest = WS_DESTINATIONS.orderStatus(code);
      const off = conn.subscribe(dest, (msg) => {
        handleWsMessage(msg.body, cbRef.current, setSnapshot);
      });
      unsubs.push(off);
    }

    // 3. LUÔN subscribe reservation result (private queue — buyer vừa reserve).
    //    Cho phép component không truyền slotIds/orderCodes vẫn nhận được
    //    event khi đặt hàng thành công.
    const resDest = WS_DESTINATIONS.reservationResult;
    unsubs.push(
      conn.subscribe(resDest, (msg) => {
        handleWsMessage(msg.body, cbRef.current, setSnapshot);
      }),
    );

    return () => {
      unsubs.forEach((u) => u());
      conn.disconnect();
    };
  }, [
    enabled,
    subscribeSlotIds,
    subscribeOrderCodes,
    setSnapshot,
    legacyDestinationRef,
  ]);
}

/**
 * Parse BE envelope `{success, code, data}` → unwrap `data` thành WsEvent.
 * Update Zustand store nếu event có flashSaleItemId + availableStock (BE §3.1).
 */
function handleWsMessage(
  body: string,
  onMessage: ((s: WsEvent) => void) | undefined,
  setSnapshot: (snap: {
    flashSaleItemId: string;
    sold: number;
    remaining: number;
    serverTime: string;
  }) => void,
): void {
  try {
    const envelope = JSON.parse(body) as { data?: unknown };
    const event = envelope.data as WsEvent | undefined;
    if (!event || typeof event !== "object") return;
    if (!isWsEventType(event.eventType)) return;

    // Cache realtime stock vào Zustand (xem docs/CLAUDE.md §8 mục 2).
    if (
      (event.eventType === "STOCK_DECREMENTED" ||
        event.eventType === "STOCK_RESTORED") &&
      event.flashSaleItemId !== undefined &&
      event.availableStock !== undefined
    ) {
      setSnapshot({
        flashSaleItemId: String(event.flashSaleItemId),
        sold: 0, // BE không trả sold → giữ 0 cho lần đầu, query sẽ fill
        remaining: event.availableStock,
        serverTime: event.occurredAt ?? new Date().toISOString(),
      });
    }

    onMessage?.(event);
  } catch {
    // ignore malformed JSON
  }
}

const KNOWN_WS_EVENT_TYPES: ReadonlySet<string> = new Set<WsEventType>([
  "STOCK_DECREMENTED",
  "STOCK_RESTORED",
  "STOCK_RETURNED_UNSOLD",
  "SLOT_ACTIVATED",
  "SLOT_CLOSED",
  "ORDER_RESERVED",
  "ORDER_CANCELLED_TIMEOUT",
  "ORDER_STATUS_CHANGED",
  "PAYMENT_STATUS_CHANGED",
]);

function isWsEventType(value: unknown): value is WsEventType {
  return typeof value === "string" && KNOWN_WS_EVENT_TYPES.has(value);
}