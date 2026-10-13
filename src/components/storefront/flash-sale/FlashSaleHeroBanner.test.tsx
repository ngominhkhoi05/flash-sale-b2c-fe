/**
 * Smoke test cho FlashSaleHeroBanner.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashSaleHeroBanner } from "./FlashSaleHeroBanner";

describe("FlashSaleHeroBanner", () => {
  it("renders 'FLASH SALE' title", () => {
    render(<FlashSaleHeroBanner />);
    expect(screen.getByText(/flash sale/i)).toBeInTheDocument();
  });

  it("renders 'Hôm Nay' badge", () => {
    render(<FlashSaleHeroBanner />);
    expect(screen.getByText("Hôm Nay")).toBeInTheDocument();
  });

  it("renders authentic trust badge text", () => {
    render(<FlashSaleHeroBanner />);
    expect(screen.getByText(/100% cam kết chính hãng/i)).toBeInTheDocument();
  });

  it("renders subtitle with discount hint", () => {
    render(<FlashSaleHeroBanner />);
    expect(screen.getByText(/giảm tới 50%/i)).toBeInTheDocument();
  });
});
