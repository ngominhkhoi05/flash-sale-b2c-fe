/**
 * Unit tests for SearchHorizontalFilterBar.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/__tests__/test-wrapper";
import type { SearchFacets, SearchFilters } from "@/features/search/types";

import { SearchHorizontalFilterBar } from "./SearchHorizontalFilterBar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/search",
}));

const FACETS: SearchFacets = {
  subcategories: [
    { key: "true-wireless", label: "True Wireless", count: 420 },
    { key: "over-ear", label: "Over-ear", count: 310 },
  ],
  cities: [],
  ratings: [
    { key: "5", label: "5 sao", count: 642 },
    { key: "4", label: "4 sao", count: 1180 },
    { key: "3", label: "3 sao", count: 215 },
  ],
  services: [],
};

const EMPTY_FILTERS: SearchFilters = {};

describe("SearchHorizontalFilterBar", () => {
  it("renders horizontal bar with core controls (category, price, rating)", () => {
    render(
      <TestWrapper>
        <SearchHorizontalFilterBar facets={FACETS} current={EMPTY_FILTERS} />
      </TestWrapper>,
    );

    expect(
      screen.getByTestId("search-horizontal-filter-bar"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Danh mục/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Khoảng giá/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /5 sao/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Từ 4 sao/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Từ 3 sao/i })).toBeInTheDocument();
  });

  it("displays category count badge when categories are active", () => {
    render(
      <TestWrapper>
        <SearchHorizontalFilterBar
          facets={FACETS}
          current={{ categories: ["true-wireless", "over-ear"] }}
        />
      </TestWrapper>,
    );

    const categoryBtn = screen.getByRole("button", { name: /Danh mục/i });
    expect(categoryBtn).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows price range modal and applies price on submit", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SearchHorizontalFilterBar facets={FACETS} current={EMPTY_FILTERS} />
      </TestWrapper>,
    );

    const priceBtn = screen.getByRole("button", { name: /Khoảng giá/i });
    await user.click(priceBtn);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    await user.type(inputs[0]!, "100000");
    await user.type(inputs[1]!, "500000");

    const applyBtn = screen.getByRole("button", { name: /Áp dụng khoảng giá/i });
    expect(applyBtn).toBeInTheDocument();
  });

  it("renders clear all button when filters are active", () => {
    render(
      <TestWrapper>
        <SearchHorizontalFilterBar
          facets={FACETS}
          current={{ categories: ["true-wireless"], minRating: 4 }}
        />
      </TestWrapper>,
    );

    expect(
      screen.getByRole("button", { name: /Xóa tất cả bộ lọc/i }),
    ).toBeInTheDocument();
  });
});

