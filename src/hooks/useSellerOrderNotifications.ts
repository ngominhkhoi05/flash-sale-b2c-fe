"use client";

import { useState, useEffect, useCallback } from "react";
import { getSellerOrders } from "@/lib/api/seller";
import type { SellerOrderResponse } from "@/types/seller";
import { toast } from "sonner";
import { formatVND } from "@/lib/utils";

const SEEN_STORAGE_KEY = "seller_seen_order_ids";
const EVENT_NAME = "seller-order-notifications-changed";

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

      setAllPendingOrders(pending);

      const seen = getSeenIds();
      const unseen = pending.filter((o) => !seen.has(o.id));
      setUnreadCount(unseen.length);

      // Nếu có đơn hàng mới phát sinh (không phải lần đầu nạp), bắn toast thông báo
      if (!isInitial && unseen.length > 0) {
        const latest = unseen[0];
        const toastKey = `notified_toast_${latest.id}`;
        if (typeof window !== "undefined" && !sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, "1");
          toast.info(`🔔 Đơn hàng mới #${latest.orderCode}!`, {
            description: `Khách hàng ${latest.recipientName} vừa đặt đơn ${formatVND(
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
    // Nạp lần đầu
    checkOrders(true);

    // Lắng nghe event đồng bộ giữa các component
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<{ unreadCount?: number }>;
      if (typeof custom.detail?.unreadCount === "number") {
        setUnreadCount(custom.detail.unreadCount);
      }
    };
    window.addEventListener(EVENT_NAME, handleSync);

    // Polling ngầm kiểm tra đơn hàng mới mỗi 8 giây
    const timer = setInterval(() => {
      checkOrders(false);
    }, 8000);

    return () => {
      window.removeEventListener(EVENT_NAME, handleSync);
      clearInterval(timer);
    };
  }, [checkOrders]);

  return {
    unreadCount,
    allPendingOrders,
    markAllAsSeen,
    refreshOrders: () => checkOrders(false),
  };
}
