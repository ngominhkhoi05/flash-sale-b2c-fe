/**
 * Smoke test cho FlashSaleSlotNav – 5 slot với active highlight.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashSaleSlotNav } from "./FlashSaleSlotNav";

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
  mkSlot(5, "2026-10-14T03:00:00.000Z", "UPCOMING"),
];

describe("FlashSaleSlotNav", () => {
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
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <FlashSaleSlotNav slots={slots} activeSlotId={2} onSelect={onSelect} />,
    );
    // Click slot 3 (UPCOMING at 12:00)
    const slot3 = screen.getAllByRole("button")[2];
    await user.click(slot3);
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
