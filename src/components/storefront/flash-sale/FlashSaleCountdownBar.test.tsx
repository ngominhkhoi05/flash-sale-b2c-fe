/**
 * Smoke test cho FlashSaleCountdownBar.
 *
 * Lưu ý: client side render bằng Date.now() nên dùng fake timers để
 * tránh lệch giây. Ở test mình truyền fixed target = now + 5s và
 * advance timer để kiểm tra giá trị thay đổi.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { FlashSaleCountdownBar } from "./FlashSaleCountdownBar";

describe("FlashSaleCountdownBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders 4 time units (days/hours/minutes/seconds) for >24h", () => {
    const now = new Date("2026-10-13T10:00:00.000Z");
    vi.setSystemTime(now);
    const target = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();
    render(<FlashSaleCountdownBar endsAt={target} liveViewers={4200} />);
    // 25h = 1 day 1h 0m 0s → expect "ngày" label and HH:MM:SS segments
    expect(screen.getByText(/ngày/i)).toBeInTheDocument();
    const timer = screen.getByRole("timer");
    expect(timer.textContent).toMatch(/01.*01.*00.*00/);
  });

  it("renders 'kết thúc' when endsAt is in the past", () => {
    const now = new Date("2026-10-13T10:00:00.000Z");
    vi.setSystemTime(now);
    const target = new Date(now.getTime() - 1000).toISOString();
    render(<FlashSaleCountdownBar endsAt={target} liveViewers={100} />);
    expect(screen.getByText("Phiên đã kết thúc")).toBeInTheDocument();
  });

  it("renders live viewers chip with k/M formatting", () => {
    const now = new Date("2026-10-13T10:00:00.000Z");
    vi.setSystemTime(now);
    const target = new Date(now.getTime() + 5 * 1000).toISOString();
    const { rerender } = render(<FlashSaleCountdownBar endsAt={target} liveViewers={4200} />);
    expect(screen.getByText(/4\.2k đang xem/i)).toBeInTheDocument();
    rerender(<FlashSaleCountdownBar endsAt={target} liveViewers={1500000} />);
    expect(screen.getByText(/1\.5M đang xem/i)).toBeInTheDocument();
  });

  it("ticks down after 1 second", () => {
    const now = new Date("2026-10-13T10:00:00.000Z");
    vi.setSystemTime(now);
    const target = new Date(now.getTime() + 30 * 1000).toISOString();
    const { container } = render(<FlashSaleCountdownBar endsAt={target} liveViewers={100} />);
    const timer = container.querySelector('[role="timer"]')!;
    expect(timer.textContent).toMatch(/00/);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(timer.textContent).toMatch(/29/);
  });

  it("renders 'Bắt đầu sau' and 'đang chờ săn deal' when status is UPCOMING", () => {
    const now = new Date("2026-10-13T10:00:00.000Z");
    vi.setSystemTime(now);
    const start = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    render(
      <FlashSaleCountdownBar
        startsAt={start}
        endsAt={end}
        status="UPCOMING"
        liveViewers={500}
      />,
    );
    expect(screen.getByText("Bắt đầu sau")).toBeInTheDocument();
    expect(screen.getByText(/500 đang chờ săn deal/i)).toBeInTheDocument();
  });
});
