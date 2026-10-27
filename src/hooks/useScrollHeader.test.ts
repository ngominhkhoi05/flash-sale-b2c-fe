import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollHeader } from "./useScrollHeader";

describe("useScrollHeader hook", () => {
  beforeEach(() => {
    // Reset scrollY
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    });

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mặc định luôn hiển thị header (isVisible = true)", () => {
    const { result } = renderHook(() => useScrollHeader());
    expect(result.current).toBe(true);
  });

  it("khi lướt nhẹ ở đỉnh trang (scrollY <= threshold), header vẫn hiển thị", () => {
    const { result } = renderHook(() => useScrollHeader({ threshold: 80 }));

    act(() => {
      window.scrollY = 50;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("khi lướt xuống vượt quá threshold với delta > scrollDownDelta, header ẩn đi (isVisible = false)", () => {
    const { result } = renderHook(() =>
      useScrollHeader({ threshold: 80, scrollDownDelta: 10 })
    );

    act(() => {
      window.scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
  });

  it("khi đang ẩn mà lướt lên (scroll up), header hiện ngay lập tức (isVisible = true)", () => {
    const { result } = renderHook(() =>
      useScrollHeader({ threshold: 80, scrollDownDelta: 10, scrollUpDelta: 5 })
    );

    // Bước 1: cuộn xuống 200 -> ẩn đi
    act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);

    // Bước 2: cuộn lên 190 (delta = -10 < -5) -> hiện ngay lập tức
    act(() => {
      window.scrollY = 190;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
  });

  it("khi cuộn về lại đỉnh trang (scrollY <= threshold), header luôn hiển thị", () => {
    const { result } = renderHook(() =>
      useScrollHeader({ threshold: 80, scrollDownDelta: 10 })
    );

    // Cuộn xuống 300 -> ẩn
    act(() => {
      window.scrollY = 300;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);

    // Cuộn thẳng về 0 (đỉnh trang) -> hiện
    act(() => {
      window.scrollY = 0;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
  });

  it("khi forceVisible = true, header luôn hiển thị bất kể cuộn xuống", () => {
    const { result, rerender } = renderHook(
      ({ forceVisible }) =>
        useScrollHeader({ threshold: 80, scrollDownDelta: 10, forceVisible }),
      { initialProps: { forceVisible: false } }
    );

    act(() => {
      window.scrollY = 300;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);

    // Mở modal / dropdown (forceVisible = true)
    rerender({ forceVisible: true });
    expect(result.current).toBe(true);
  });
});
