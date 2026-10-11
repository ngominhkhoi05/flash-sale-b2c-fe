/**
 * useCarousel – Lightweight auto-rotating carousel state.
 *
 * Behavior:
 * - `currentIndex` advances every `intervalMs` when not paused.
 * - `pause()` / `resume()` exposed for mouse/focus hover handlers.
 * - `prefers-reduced-motion: reduce` ⇒ no auto-rotation; manual
 *   `goTo()` still works. Respects a11y without disabling the UI.
 * - Wraps around (last → first).
 * - `goTo(index)` is a no-op when `index` is out of range; current
 *   index is preserved.
 * - Cleans up the interval on unmount (no leaked timers).
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCarouselOptions {
  totalSlides: number;
  /** Auto-advance interval in milliseconds. Default 5000. */
  intervalMs?: number;
}

export interface UseCarouselResult {
  currentIndex: number;
  goTo: (index: number) => void;
  pause: () => void;
  resume: () => void;
  /** True when user has hovered/focused the carousel. */
  isPaused: boolean;
  /** True when user prefers reduced motion (no auto-rotation). */
  isReducedMotion: boolean;
}

export function useCarousel({
  totalSlides,
  intervalMs = 5000,
}: UseCarouselOptions): UseCarouselResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const reducedMotionRef = useRef(false);
  const pausedRef = useRef(false);

  // Read prefers-reduced-motion once on mount (jsdom-friendly).
  // The ref + state mirror the current value so other effects (auto-rotate)
  // can read it without re-subscribing to the media query.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const update = () => {
      const matches = mq.matches;
      reducedMotionRef.current = matches;
      setIsReducedMotion(matches);
    };
    update();
    // Modern API
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Auto-rotate loop.
  useEffect(() => {
    if (totalSlides <= 1) return;
    const tick = () => {
      if (reducedMotionRef.current || pausedRef.current) return;
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [totalSlides, intervalMs]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;
      setCurrentIndex(index);
    },
    [totalSlides]
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
  }, []);

  return {
    currentIndex,
    goTo,
    pause,
    resume,
    isPaused,
    isReducedMotion,
  };
}
