"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWs, type ConnectionState } from "@/providers/WsConnectionProvider";
import { ADMIN_QUERY_KEYS } from "./useAdminQueries";

export interface AdminRealtimeEvent {
  eventType?: "ITEM_REGISTERED" | "ITEM_APPROVED" | "ITEM_REJECTED" | "SLOT_ACTIVATED" | "SLOT_CLOSED" | "STOCK_UPDATED";
  slotId?: number;
  itemId?: number;
  productName?: string;
  storeName?: string;
  pendingCount?: number;
  message?: string;
  occurredAt?: string;
}

/**
 * useAdminRealtime – Hook kết nối WebSocket STOMP thời gian thực cho Admin Console.
 * - Nhận thông báo tự động khi Người bán nộp đơn đăng ký SKU mới.
 * - Tự động đồng bộ số lượng badge chờ duyệt trên Sidebar & Topbar.
 * - Tự động cập nhật danh sách duyệt SKU mà không cần F5.
 * - Cung cấp trạng thái kết nối WebSocket (`connectionState`) để hiển thị badge Live.
 */
export function useAdminRealtime(): { connectionState: ConnectionState } {
  const { ensureClient, connectionState } = useWs();
  const queryClient = useQueryClient();
  const qcRef = useRef(queryClient);

  useEffect(() => {
    qcRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    let client: ReturnType<typeof ensureClient> | null = null;
    const unsubs: Array<() => void> = [];

    try {
      client = ensureClient();

      // 1. Kênh đếm số lượng & thông báo duyệt SKU admin
      const offCounts = client.subscribe("/topic/admin/flash-sale/counts", (msg) => {
        try {
          const envelope = JSON.parse(msg.body) as { data?: AdminRealtimeEvent };
          const data = envelope.data || (JSON.parse(msg.body) as AdminRealtimeEvent);

          // Cập nhật số pending nếu có
          if (typeof data.pendingCount === "number") {
            window.dispatchEvent(
              new CustomEvent("admin:sku-pending-count", { detail: data.pendingCount })
            );
          }

          // Invalidate cache để load số lượng mới nhất
          void qcRef.current.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.counts() });
          void qcRef.current.invalidateQueries({ queryKey: ["admin", "flash-sale", "approvals"] });

          if (data.eventType === "ITEM_REGISTERED") {
            toast.info("⚡ SKU Flash Sale mới cần duyệt!", {
              description: `Gian hàng ${data.storeName || "Shop"} vừa đăng ký SKU ${data.productName ? `"${data.productName}"` : ""} vào phiên.`,
              duration: 5000,
            });
          }
        } catch {
          // ignore malformed
        }
      });
      unsubs.push(offCounts);

      // 2. Kênh cập nhật slot Flash Sale (kích hoạt, kết thúc, tạm dừng)
      const offSlots = client.subscribe("/topic/flash-sale/slot/+/status", () => {
        void qcRef.current.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.slots });
      });
      unsubs.push(offSlots);
    } catch (err) {
      console.warn("[Admin WS] Failed to subscribe to admin topics:", err);
    }

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // ignore
        }
      });
    };
  }, [ensureClient]);

  return { connectionState };
}
