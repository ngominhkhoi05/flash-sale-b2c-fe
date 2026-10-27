"use client";

import { useEffect, useRef, useState } from "react";

export interface UseScrollHeaderOptions {
  /**
   * Khoảng cách scroll từ đỉnh trang (px) trước khi cho phép ẩn header.
   * Giúp header không bị ẩn khi người dùng vừa mới cuộn nhẹ ở đầu trang.
   * Mặc định: 80px.
   */
  threshold?: number;
  /**
   * Khoảng cách cuộn xuống tối thiểu (px) để kích hoạt ẩn.
   * Mặc định: 10px.
   */
  scrollDownDelta?: number;
  /**
   * Khoảng cách cuộn lên tối thiểu (px) để hiện ngay lập tức.
   * Mặc định: 5px (rất nhạy để hiện ngay khi người dùng cuộn lên).
   */
  scrollUpDelta?: number;
  /**
   * Buộc header luôn hiển thị (ví dụ: khi modal / search dialog đang mở hoặc input đang focus).
   */
  forceVisible?: boolean;
}

/**
 * Hook điều khiển ẩn/hiện header theo hướng cuộn trang (Smart Header / Headroom):
 * - Cuộn xuống (scroll down) -> ẩn header đi (trượt lên trên).
 * - Cuộn lên (scroll up) -> hiện header ngay lập tức (trượt xuống).
 * - Ở gần đầu trang (<= threshold) -> luôn hiển thị.
 */
export function useScrollHeader(options: UseScrollHeaderOptions = {}) {
  const {
    threshold = 80,
    scrollDownDelta = 10,
    scrollUpDelta = 5,
    forceVisible = false,
  } = options;

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Cập nhật ref để tránh stale closure trong requestAnimationFrame callback
  isVisibleRef.current = isVisible;

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = Math.max(0, window.scrollY);

    let isTicking = false;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (isTicking) return;
      isTicking = true;

      rafId = window.requestAnimationFrame(() => {
        isTicking = false;
        rafId = null;

        if (forceVisible) {
          if (!isVisibleRef.current) setIsVisible(true);
          lastScrollYRef.current = Math.max(0, window.scrollY);
          return;
        }

        const currentScrollY = window.scrollY;

        // Bỏ qua overscroll ở đỉnh hoặc đáy trang (bounce effect trên iOS / macOS)
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        if (currentScrollY > maxScroll) {
          return;
        }

        const delta = currentScrollY - lastScrollYRef.current;

        // 1. Khi ở gần đỉnh trang: luôn hiển thị
        if (currentScrollY <= threshold) {
          if (!isVisibleRef.current) {
            setIsVisible(true);
          }
        }
        // 2. Khi lướt lên: hiện ngay lập tức
        else if (delta < -scrollUpDelta) {
          if (!isVisibleRef.current) {
            setIsVisible(true);
          }
        }
        // 3. Khi lướt xuống: ẩn đi nếu vượt quá ngưỡng và delta đủ lớn
        else if (delta > scrollDownDelta) {
          if (isVisibleRef.current) {
            setIsVisible(false);
          }
        }

        lastScrollYRef.current = Math.max(0, currentScrollY);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [threshold, scrollDownDelta, scrollUpDelta, forceVisible]);

  return forceVisible ? true : isVisible;
}
