/**
 * Unit tests cho RecommendedTabs (API-driven).
 * - 3 tabs render correctly
 * - TAB_TO_API mapping
 * - onTabChange callback
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RecommendedTabs,
  TAB_TO_API,
  type RecommendedTab,
} from "./RecommendedTabs";
import { TestWrapper } from "@/__tests__/test-wrapper";

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

describe("TAB_TO_API mapping", () => {
  it("maps forYou to 'for_you'", () => {
    expect(TAB_TO_API.forYou).toBe("for_you");
  });

  it("maps bestSellers to 'best_seller'", () => {
    expect(TAB_TO_API.bestSellers).toBe("best_seller");
  });

  it("maps hotDeals to 'hot_deal'", () => {
    expect(TAB_TO_API.hotDeals).toBe("hot_deal");
  });

  it("all 3 tabs are mapped", () => {
    expect(Object.keys(TAB_TO_API)).toHaveLength(3);
  });
});
