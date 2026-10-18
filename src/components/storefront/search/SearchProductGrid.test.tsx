/**
 * Tests for SearchProductGrid rendering with RecommendedProductResponse items
 * (post-BE-wire shape).
 *
 * Plan: docs/superpowers/plans/2026-10-18-search-endpoint-be-wire-fe.md
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestWrapper } from "@/__tests__/test-wrapper";
import type { RecommendedProductResponse } from "@/features/homepage/api";

import { SearchProductGrid } from "./SearchProductGrid";

const ITEM: RecommendedProductResponse = {
  id: 101,
  storeId: 1,
  storeName: "Sony Audio Official Store",
  name: "Tai nghe Sony WF-C500",
  imageUrl: "https://example.com/wf-c500.jpg",
  minPrice: 990000,
  maxPrice: 1520000,
  totalStock: 100,
  totalSold: 1800,
  label: "freeship",
};

describe("SearchProductGrid", () => {
  it("renders ProductCard with real price from BE shape (no 0 ₫ regression)", () => {
    render(
      <TestWrapper>
        <SearchProductGrid items={[{ ...ITEM, label: null }]} />
      </TestWrapper>,
    );

    // Discount variant renders both price + originalPrice (line-through).
    // 990.000₫ — formatted price (FE formatVND with vi locale, no space before ₫)
    expect(screen.getByText("990.000₫")).toBeInTheDocument();
    // Original price 1.520.000₫ (rendered as <span class="line-through">)
    expect(screen.getByText("1.520.000₫")).toBeInTheDocument();
    // Discount pill -35%
    expect(screen.getByText("-35%")).toBeInTheDocument();
    // Sold count formatted (1,8k for 1800)
    expect(screen.getByText(/Đã bán\s+1[,.]?8k/i)).toBeInTheDocument();
    // Store name appears as location
    expect(screen.getByText(/Sony Audio Official Store/i)).toBeInTheDocument();
  });

  it("wraps each card in a Link to /products/:id", () => {
    render(
      <TestWrapper>
        <SearchProductGrid items={[ITEM]} />
      </TestWrapper>,
    );
    const link = screen.getByRole("link", { name: /wf-c500/i });
    expect(link).toHaveAttribute("href", "/products/101");
  });

  it("renders freeship variant when label === freeship", () => {
    render(
      <TestWrapper>
        <SearchProductGrid items={[{ ...ITEM, label: "freeship" }]} />
      </TestWrapper>,
    );
    // Freeship corner tag is rendered as text
    expect(screen.getByText("Freeship")).toBeInTheDocument();
  });

  it("renders voucher variant with label when label === voucher", () => {
    render(
      <TestWrapper>
        <SearchProductGrid items={[{ ...ITEM, label: "voucher" }]} />
      </TestWrapper>,
    );
    expect(screen.getByText("Voucher")).toBeInTheDocument();
  });

  it("renders discount variant when has discount and no label", () => {
    render(
      <TestWrapper>
        <SearchProductGrid
          items={[{ ...ITEM, label: null }]}
        />
      </TestWrapper>,
    );
    // -35% discount pill from ProductCardDiscount variant
    expect(screen.getByText("-35%")).toBeInTheDocument();
  });

  it("renders default variant when no discount and no label", () => {
    render(
      <TestWrapper>
        <SearchProductGrid
          items={[{ ...ITEM, minPrice: 1000000, maxPrice: 1000000, label: null }]}
        />
      </TestWrapper>,
    );
    // No discount pill
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    // Price shown
    expect(screen.getByText("1.000.000₫")).toBeInTheDocument();
  });

  it("renders skeleton grid when isLoading=true", () => {
    render(
      <TestWrapper>
        <SearchProductGrid items={[]} isLoading />
      </TestWrapper>,
    );
    expect(screen.getByTestId("search-grid-skeleton")).toBeInTheDocument();
  });

  it("renders multiple items in a grid layout", () => {
    const items: RecommendedProductResponse[] = [
      ITEM,
      { ...ITEM, id: 102, name: "Soundcore A40", minPrice: 1390000, maxPrice: 2300000 },
    ];
    render(
      <TestWrapper>
        <SearchProductGrid items={items} />
      </TestWrapper>,
    );
    const grid = screen.getByTestId("search-grid");
    // 2 product cards (via accessible links)
    const links = within(grid).getAllByRole("link");
    expect(links.length).toBe(2);
  });
});
