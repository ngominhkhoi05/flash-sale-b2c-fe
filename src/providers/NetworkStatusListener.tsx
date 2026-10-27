"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Component lắng nghe sự kiện online / offline của trình duyệt
 * và hiển thị thông báo toast tức thì cho người dùng khi mất mạng hoặc có mạng trở lại.
 */
export function NetworkStatusListener() {
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      toast.error("Mất kết nối mạng! Không thể kết nối đến máy chủ.", {
        id: "network-status",
        duration: 8000,
        description: "Vui lòng kiểm tra lại đường truyền WiFi/4G của bạn.",
      });
    };

    const handleOnline = () => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      toast.success("Đã khôi phục kết nối mạng internet!", {
        id: "network-status",
        duration: 3000,
      });
    };

    // Nếu lúc mount đang offline thì thông báo ngay
    if (!navigator.onLine) {
      handleOffline();
    }
    isFirstMount.current = false;

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
