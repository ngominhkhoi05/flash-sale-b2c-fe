/**
 * Smoke test cho FlashSaleSlotNav – 5 slot với active highlight.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashSaleSlotNav } from "./FlashSaleSlotNav";

// Cố định "now" để test isTomorrowSlot deterministic theo local day.
// 2026-10-14 10:00 +07:00 = 2026-10-14 03:00 UTC.
// Khi đó slot 5 (15 Oct 03:00 UTC = 15 Oct 10:00 +07:00) là "Ngày mai" theo local.
const FIXED_NOW = new Date("2026-10-14T03:00:00.000Z");

function mkSlot(
  id: number,
  startTime: string,
  status: "UPCOMING" | "ACTIVE" | "ENDED",
): {
  id: number;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  label: string;
} {
  return {
    id,
    startTime,
    endTime: new Date(Date.parse(startTime) + 3 * 60 * 60 * 1000).toISOString(),
    status,
    label: new Date(startTime).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

const slots = [
  mkSlot(1, "2026-10-13T06:00:00.000Z", "ENDED"),
  mkSlot(2, "2026-10-13T09:00:00.000Z", "ACTIVE"),
  mkSlot(3, "2026-10-13T12:00:00.000Z", "UPCOMING"),
  mkSlot(4, "2026-10-13T15:00:00.000Z", "UPCOMING"),
  // Slot 5 ở 15 Oct (chứ không phương 14) để chắc chắn "Ngày mai" theo local day,
  // kết hợp vi.useFakeTimers để cố định "now" = 2026-10-14 10:00 local (xem
  // beforeEach). Tránh phụ thuộc vào ngày thực tế khi chạy test.
  mkSlot(5, "2026-10-15T03:00:00.000Z", "UPCOMING"),
];

describe("FlashSaleSlotNav", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders 5 slot buttons", () => {
    render(<FlashSaleSlotNav slots={slots} activeSlotId={2} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("renders 'Đang diễn ra' label on the ACTIVE slot", () => {
    render(<FlashSaleSlotNav slots={slots} activeSlotId={2} />);
    expect(screen.getByText(/đang diễn ra/i)).toBeInTheDocument();
  });

  it("renders 'Sắp diễn ra' label on UPCOMING slots", () => {
    render(<FlashSaleSlotNav slots={slots} activeSlotId={2} />);
    const upcomingLabels = screen.getAllByText(/sắp diễn ra/i);
    expect(upcomingLabels.length).toBeGreaterThanOrEqual(2);
  });

  it("renders 'Đã kết thúc' label on ENDED slot", () => {
    render(<FlashSaleSlotNav slots={slots} activeSlotId={2} />);
    expect(screen.getByText(/đã kết thúc/i)).toBeInTheDocument();
  });

  it("renders 'Ngày mai' label for slot 5 (crosses midnight)", () => {
    render(<FlashSaleSlotNav slots={slots} activeSlotId={2} />);
    expect(screen.getByText(/ngày mai/i)).toBeInTheDocument();
  });

  it("invokes onSelect when user clicks a slot", async () => {
    // Test này cần real timers vì userEvent tương tác với DOM trực tiếp.
    // Fake timers bị tắt cục bộ, sau đó bật lại để giữ deterministic cho
    // các test khác trong describe.
    vi.useRealTimers();
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <FlashSaleSlotNav slots={slots} activeSlotId={2} onSelect={onSelect} />,
    );
    // Click slot 3 (UPCOMING at 12:00)
    const slot3 = screen.getAllByRole("button")[2];
    await user.click(slot3);
    expect(onSelect).toHaveBeenCalledWith(3);
    // Bật lại fake timers cho cleanup của describe
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  it("keeps actual status labels when an UPCOMING slot is selected", () => {
    // Chọn slot 3 (UPCOMING) thay vì slot 2 (ACTIVE)
    render(<FlashSaleSlotNav slots={slots} activeSlotId={3} />);

    const slot2Btn = screen.getByTestId("slot-2");
    const slot3Btn = screen.getByTestId("slot-3");
    const slot1Btn = screen.getByTestId("slot-1");
    const slot5Btn = screen.getByTestId("slot-5");

    // Slot 3 được chọn nhưng nhãn phải là "Sắp diễn ra", không phải "Đang diễn ra"
    expect(slot3Btn).toHaveAttribute("aria-current", "true");
    expect(slot3Btn).toHaveTextContent(/sắp diễn ra/i);
    expect(slot3Btn).not.toHaveTextContent(/đang diễn ra/i);

    // Slot 2 vẫn là ACTIVE trong thực tế nên phải giữ nhãn "Đang diễn ra"
    expect(slot2Btn).toHaveTextContent(/đang diễn ra/i);

    // Slot 1 (ENDED) vẫn là "Đã kết thúc"
    expect(slot1Btn).toHaveTextContent(/đã kết thúc/i);

    // Slot 5 (Ngày mai) vẫn là "Ngày mai"
    expect(slot5Btn).toHaveTextContent(/ngày mai/i);

    // Live ping dot chỉ nằm ở slot 2, không nằm ở slot 3
    expect(slot2Btn.querySelector(".animate-ping")).toBeInTheDocument();
    expect(slot3Btn.querySelector(".animate-ping")).toBeNull();
  });
});
