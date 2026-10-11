/**
 * Unit tests cho RecommendedTabs.
 * - filterProductsByTab pure function: 3 tabs
 * - Render: tabs visible, onTabChange callback
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RecommendedTabs,
  filterProductsByTab,
  type RecommendedTab,
} from "./RecommendedTabs";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { RecommendedProduct } from "./home-mocks";

const FIXTURES: RecommendedProduct[] = [
  // id 1: high soldCount, has discount
  {
    id: "1",
    imageUrl: "",
    imageAlt: "",
    name: "Popular product",
    price: "100.000₫",
    originalPrice: "200.000₫",
    discountPercent: 50,
    rating: 4.9,
    soldCount: "5,6k",
    location: "HN",
    href: "/sp/1",
  },
  // id 2: low soldCount, no discount
  {
    id: "2",
    imageUrl: "",
    imageAlt: "",
    name: "Casual product",
    price: "50.000₫",
    rating: 4.5,
    soldCount: "950",
    location: "HCM",
    href: "/sp/2",
  },
  // id 3: high soldCount, no discount
  {
    id: "3",
    imageUrl: "",
    imageAlt: "",
    name: "Bestseller",
    price: "80.000₫",
    rating: 4.7,
    soldCount: "1,2k",
    location: "DN",
    href: "/sp/3",
  },
];

describe("filterProductsByTab", () => {
  it("returns all products when tab is forYou", () => {
    expect(filterProductsByTab(FIXTURES, "forYou")).toHaveLength(3);
  });

  it("returns only products with soldCount >= 1000 for bestSellers", () => {
    const result = filterProductsByTab(FIXTURES, "bestSellers");
    expect(result.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("returns only products with discountPercent > 0 for hotDeals", () => {
    const result = filterProductsByTab(FIXTURES, "hotDeals");
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("returns empty array for bestSellers when nothing >= 1000", () => {
    const items: RecommendedProduct[] = FIXTURES.map((p) => ({ ...p, soldCount: "500" }));
    expect(filterProductsByTab(items, "bestSellers")).toHaveLength(0);
  });
});

describe("RecommendedTabs – render", () => {
  const fakeT = (key: string) => {
    const map: Record<string, string> = {
      "recommended.tabForYou": "Dành cho bạn",
      "recommended.tabBestSellers": "Bán chạy",
      "recommended.tabHotDeals": "Ưu đãi sốc",
    };
    return map[key] ?? key;
  };

  it("renders 3 tabs", () => {
    render(
      <RecommendedTabs activeTab="forYou" onTabChange={() => {}} t={fakeT} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByTestId("tab-forYou")).toBeInTheDocument();
    expect(screen.getByTestId("tab-bestSellers")).toBeInTheDocument();
    expect(screen.getByTestId("tab-hotDeals")).toBeInTheDocument();
  });

  it("marks active tab with aria-selected", () => {
    render(
      <RecommendedTabs activeTab="bestSellers" onTabChange={() => {}} t={fakeT} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByTestId("tab-bestSellers")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByTestId("tab-forYou")).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("calls onTabChange with clicked tab key", async () => {
    const user = userEvent.setup();
    const handle = vi.fn();
    render(
      <RecommendedTabs activeTab="forYou" onTabChange={handle} t={fakeT} />,
      { wrapper: TestWrapper }
    );
    await user.click(screen.getByTestId("tab-hotDeals"));
    expect(handle).toHaveBeenCalledWith("hotDeals" satisfies RecommendedTab);
  });
});
