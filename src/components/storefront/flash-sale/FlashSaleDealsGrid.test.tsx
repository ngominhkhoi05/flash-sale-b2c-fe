/**
 * Smoke test cho FlashSaleDealsGrid.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashSaleDealsGrid } from "./FlashSaleDealsGrid";
import type { PublicFlashSaleItemResponse } from "@/features/flash-sale";

function mkItem(
  id: number,
  name: string,
  status: "APPROVED" | "PENDING_APPROVAL" | "REJECTED" | "ENDED",
  sold: number,
  stock: number,
): PublicFlashSaleItemResponse {
  return {
    id,
    flashSaleSlotId: 2,
    productId: 100 + id,
    productName: name,
    productSlug: `p-${id}`,
    thumbnailUrl: `https://picsum.photos/seed/${id}/400/400`,
    originalPrice: 1_000_000,
    flashPrice: 500_000,
    totalStock: stock,
    soldCount: sold,
    status,
    limitPerUser: 2,
  };
}

const items: PublicFlashSaleItemResponse[] = [
  mkItem(1, "iPhone 15 Pro Max", "APPROVED", 50, 100),
  mkItem(2, "Samsung Galaxy S24", "APPROVED", 90, 100),
  mkItem(3, "Xiaomi 14 Ultra", "APPROVED", 100, 100),
  mkItem(4, "Pixel 9 Pro", "APPROVED", 0, 50),
];

describe("FlashSaleDealsGrid", () => {
  it("renders 1 child per item", () => {
    render(<FlashSaleDealsGrid items={items} renderItem={(it) => <span key={it.id}>{it.productName}</span>} />);
    expect(screen.getByText("iPhone 15 Pro Max")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy S24")).toBeInTheDocument();
    expect(screen.getByText("Xiaomi 14 Ultra")).toBeInTheDocument();
    expect(screen.getByText("Pixel 9 Pro")).toBeInTheDocument();
  });

  it("renders EmptyState when items empty", () => {
    render(
      <FlashSaleDealsGrid
        items={[]}
        renderItem={(it) => <span key={it.id}>{it.productName}</span>}
        emptyTitle="Chưa có sản phẩm"
        emptyHint="Hãy thử chọn danh mục khác"
      />,
    );
    expect(screen.getByText("Chưa có sản phẩm")).toBeInTheDocument();
    expect(screen.getByText(/thử chọn danh mục khác/i)).toBeInTheDocument();
  });

  it("applies custom className to root", () => {
    const { container } = render(
      <FlashSaleDealsGrid
        items={items}
        renderItem={(it) => <span key={it.id}>{it.productName}</span>}
        className="custom-grid"
      />,
    );
    expect(container.firstChild).toHaveClass("custom-grid");
  });
});
