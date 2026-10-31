"use client";

import { useState, useEffect, useCallback } from "react";
import { getSellerOrders } from "@/lib/api/seller";
import type { SellerOrderResponse } from "@/types/seller";
import { toast } from "sonner";
import { formatVND } from "@/lib/utils";
import { createFlashSaleStompClient } from "@/lib/stomp";
import { getAccessToken } from "@/lib/api/client";

const SEEN_STORAGE_KEY = "seller_seen_order_ids";
const EVENT_NAME = "seller-order-notifications-changed";
export const ORDER_EVENT_NEW = "seller_new_order_received";

function getSeenIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(Number) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-200)));
  } catch {
    // Ignore storage errors
  }
}

export function useSellerOrderNotifications() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [allPendingOrders, setAllPendingOrders] = useState<SellerOrderResponse[]>([]);

  // Đánh dấu tất cả đơn hàng hiện tại là đã xem -> reset badge về 0
  const markAllAsSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    const seen = getSeenIds();
    allPendingOrders.forEach((o) => seen.add(o.id));
    saveSeenIds(seen);
    setUnreadCount(0);
    // Bắn event đồng bộ tức thì giữa Sidebar và Topbar
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { unreadCount: 0 } }));
  }, [allPendingOrders]);

  const checkOrders = useCallback(async (isInitial = false) => {
    try {
      const res = await getSellerOrders(0, 25);
      const list = res.items || res.content || [];
      // Lọc các đơn hàng cần xử lý: PENDING hoặc PENDING_PAYMENT
      const pending = list.filter(
        (o) => o.status === "PENDING" || o.status === "PENDING_PAYMENT"
      );

      setAllPendingOrders((prev) => {
        if (prev.length !== pending.length) return pending;
        const isDiff = prev.some((o, i) => o.id !== pending[i]?.id || o.status !== pending[i]?.status);
        return isDiff ? pending : prev;
      });

      const seen = getSeenIds();
      const unseen = pending.filter((o) => !seen.has(o.id));
      setUnreadCount((prev) => (prev !== unseen.length ? unseen.length : prev));

      // Nếu có đơn hàng mới phát sinh (không phải lần đầu nạp), bắn toast thông báo
      if (!isInitial && unseen.length > 0) {
        const latest = unseen[0];
        const toastKey = `notified_toast_${latest.id}`;
        if (typeof window !== "undefined" && !sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, "1");
          toast.info(`🔔 Đơn hàng mới #${latest.orderCode}!`, {
            description: `Khách hàng ${latest.recipientName || "người mua"} vừa đặt đơn ${formatVND(
              latest.totalAmount || 0
            )}`,
            duration: 5000,
          });
        }
      }
    } catch (err) {
      console.warn("Check seller orders warning:", err);
    }
  }, []);

  useEffect(() => {
    // Nạp lần đầu (defer qua setTimeout để không trigger setState đồng bộ trong effect)
    const initialTimer = setTimeout(() => {
      void checkOrders(true);
    }, 0);

    // Lắng nghe event đồng bộ giữa các component
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<{ unreadCount?: number }>;
      if (typeof custom.detail?.unreadCount === "number") {
        setUnreadCount(custom.detail.unreadCount);
      }
    };
    window.addEventListener(EVENT_NAME, handleSync);

    // Kết nối WebSocket STOMP nhận thông báo đơn hàng theo thời gian thực (0ms latency)
    let stomp: { disconnect: () => void } | null = null;
    try {
      const token = getAccessToken();
      const client = createFlashSaleStompClient(token);
      stomp = client;

      const handleRealtimeOrder = (payload: any) => {
        const order: SellerOrderResponse = payload.data || payload;
        if (!order || (!order.id && !order.orderCode)) return;

        const code = order.orderCode || (order as any).code || (order.id ? `#${order.id}` : "");
        const toastKey = `notified_toast_${order.id || code}`;
        if (typeof window !== "undefined" && !sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, "1");
          toast.info(`🔔 Đơn hàng mới #${code}!`, {
            description: `Khách hàng ${order.recipientName || "Người mua"} vừa đặt đơn ${formatVND(
              order.totalAmount || 0
            )}`,
            duration: 6000,
          });
        }

        // Bắn CustomEvent để trang Quản lý đơn hàng và Dashboard nạp ngay dữ liệu
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(ORDER_EVENT_NEW, { detail: order })
          );
        }

        // Cập nhật lại danh sách đơn hàng ngầm và unread count
        void checkOrders(false);
      };

      client.subscribe("/topic/seller/orders", (msg) => {
        try {
          const body = JSON.parse(msg.body);
          handleRealtimeOrder(body);
        } catch (e) {
          console.warn("WS parse /topic/seller/orders error:", e);
        }
      });

      client.subscribe("/topic/orders", (msg) => {
        try {
          const body = JSON.parse(msg.body);
          handleRealtimeOrder(body);
        } catch (e) {
          console.warn("WS parse /topic/orders error:", e);
        }
      });
    } catch (wsErr) {
      console.warn("WS init error in useSellerOrderNotifications:", wsErr);
    }

    // Polling ngầm kiểm tra đơn hàng mới mỗi 15 giây dự phòng
    const timer = setInterval(() => {
      void checkOrders(false);
    }, 15000);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener(EVENT_NAME, handleSync);
      clearInterval(timer);
      if (stomp) {
        try {
          stomp.disconnect();
        } catch {}
      }
    };
  }, [checkOrders]);

  return {
    unreadCount,
    allPendingOrders,
    markAllAsSeen,
    refreshOrders: () => checkOrders(false),
  };
}
