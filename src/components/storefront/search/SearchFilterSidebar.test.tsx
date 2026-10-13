/**
 * Test for SearchFilterSidebar.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/__tests__/test-wrapper";
import type { SearchFacets, SearchFilters } from "@/features/search/types";

import { SearchFilterSidebar } from "./SearchFilterSidebar";

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
  cities: [
    { key: "HCM", label: "HCM", count: 824 },
    { key: "HN", label: "Hanoi", count: 312 },
  ],
  ratings: [
    { key: "5", label: "5 sao", count: 642 },
    { key: "4", label: "4 sao", count: 1180 },
  ],
  services: [
    { key: "flash-sale", label: "Flash Sale", count: 0 },
    { key: "freeship", label: "Freeship", count: 0 },
  ],
};

const EMPTY_FILTERS: SearchFilters = {};

describe("SearchFilterSidebar", () => {
  it("renders all 5 sections", () => {
    render(
      <TestWrapper>
        <SearchFilterSidebar facets={FACETS} current={EMPTY_FILTERS} />
      </TestWrapper>,
    );
    expect(screen.getByTestId("search-filter-sidebar")).toBeInTheDocument();
    // Subcategory + city + price + rating + services headers
    expect(screen.getAllByText(/Danh mục con/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nơi bán/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Khoảng giá/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Đánh giá sao/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dịch vụ/i).length).toBeGreaterThan(0);
  });

  it("checks current subcategory checkboxes", () => {
    render(
      <TestWrapper>
        <SearchFilterSidebar
          facets={FACETS}
          current={{ categories: ["true-wireless"] }}
        />
      </TestWrapper>,
    );
    const checkbox = screen.getByRole("checkbox", { name: /True Wireless/i });
    expect(checkbox).toBeChecked();
  });

  it("applies price range on form submit", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SearchFilterSidebar facets={FACETS} current={EMPTY_FILTERS} />
      </TestWrapper>,
    );
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0] ?? inputs[1]!, "200000");
    await user.type(inputs[1] ?? inputs[0]!, "1500000");
    const applyBtn = screen.getByRole("button", { name: /Áp dụng khoảng giá/i });
    expect(applyBtn).toBeInTheDocument();
  });

  it("renders clear all button", () => {
    render(
      <TestWrapper>
        <SearchFilterSidebar facets={FACETS} current={EMPTY_FILTERS} />
      </TestWrapper>,
    );
    expect(
      screen.getByRole("button", { name: /Xóa tất cả bộ lọc/i }),
    ).toBeInTheDocument();
  });
});
