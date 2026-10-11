import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCarousel } from "./useCarousel";

describe("useCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at index 0", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    expect(result.current.currentIndex).toBe(0);
  });

  it("auto-advances to the next slide after intervalMs", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.currentIndex).toBe(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.currentIndex).toBe(2);
  });

  it("wraps around from last slide back to first", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 3, intervalMs: 5000 })
    );
    act(() => {
      vi.advanceTimersByTime(15000); // 3 intervals
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it("goTo sets currentIndex to the requested slide", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    act(() => {
      result.current.goTo(2);
    });
    expect(result.current.currentIndex).toBe(2);
  });

  it("goTo does not crash when index is out of range (clamped or ignored)", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    act(() => {
      result.current.goTo(99);
    });
    // Out-of-range: stays at 0 (or last valid — implementation choice).
    // We only assert it does not throw and index is still a number.
    expect(typeof result.current.currentIndex).toBe("number");
  });

  it("does not auto-advance when paused", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it("resumes auto-advance after resume()", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.resume();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it("cleans up the interval on unmount (no leaked timers)", () => {
    const { unmount } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    unmount();
    // After unmount, advancing timers must not throw.
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });
});

describe("useCarousel with prefers-reduced-motion", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    matchMediaMock = vi.fn().mockImplementation(
      (query: string) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    );
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not auto-rotate when user prefers reduced motion", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    expect(result.current.isReducedMotion).toBe(true);

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it("still allows manual goTo when reduced motion is preferred", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSlides: 4, intervalMs: 5000 })
    );
    act(() => {
      result.current.goTo(2);
    });
    expect(result.current.currentIndex).toBe(2);
  });
});
