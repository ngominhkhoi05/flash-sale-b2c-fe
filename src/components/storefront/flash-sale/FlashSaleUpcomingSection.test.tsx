/**
 * Smoke test cho FlashSaleUpcomingSection.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashSaleUpcomingSection } from "./FlashSaleUpcomingSection";
import type { PublicFlashSaleItemResponse } from "@/features/flash-sale";

function mkItem(id: number, name: string, stock: number, sold: number): PublicFlashSaleItemResponse {
  return {
    id,
    flashSaleSlotId: 4,
    productId: 100 + id,
    productName: name,
    productSlug: `p-${id}`,
    thumbnailUrl: `https://picsum.photos/seed/${id}/400/400`,
    originalPrice: 1_000_000,
    flashPrice: 500_000,
    totalStock: stock,
    soldCount: sold,
    status: "APPROVED",
    limitPerUser: 2,
  };
}

const upcomingSlot = {
  id: 4,
  startTime: "2026-10-13T15:00:00.000Z",
  endTime: "2026-10-13T18:00:00.000Z",
  status: "UPCOMING" as const,
  label: "15:00",
};

const items: PublicFlashSaleItemResponse[] = [
  mkItem(1, "Tai nghe Bluetooth", 50, 0),
  mkItem(2, "Chuột gaming", 30, 0),
  mkItem(3, "Bàn phím cơ", 20, 0),
];

describe("FlashSaleUpcomingSection", () => {
  it("renders section title", () => {
    render(<FlashSaleUpcomingSection slot={upcomingSlot} items={items} />);
    expect(screen.getByText(/sắp diễn ra/i)).toBeInTheDocument();
  });

  it("renders product count", () => {
    render(<FlashSaleUpcomingSection slot={upcomingSlot} items={items} />);
    expect(screen.getByText(/3 sản phẩm/i)).toBeInTheDocument();
  });

  it("renders 3 reminder buttons (one per item)", () => {
    render(<FlashSaleUpcomingSection slot={upcomingSlot} items={items} />);
    const buttons = screen.getAllByTestId("reminder-button");
    expect(buttons).toHaveLength(3);
  });

  it("renders product names", () => {
    render(<FlashSaleUpcomingSection slot={upcomingSlot} items={items} />);
    expect(screen.getByText("Tai nghe Bluetooth")).toBeInTheDocument();
    expect(screen.getByText("Chuột gaming")).toBeInTheDocument();
    expect(screen.getByText("Bàn phím cơ")).toBeInTheDocument();
  });
});
