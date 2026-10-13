/**
 * Test for SearchPageContent (composite).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/__tests__/test-wrapper";
import {
  MOCK_SEARCH_RESULT,
} from "@/features/search/mocks";
import type { SearchQuery } from "@/features/search/types";

import { SearchPageContent } from "./SearchPageContent";

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

const QUERY: SearchQuery = {
  q: "tai nghe",
  filters: {},
  sort: "relevance",
  page: 1,
};

describe("SearchPageContent", () => {
  it("renders error state when isError is true", () => {
    const cb = vi.fn();
    render(
      <TestWrapper>
        <SearchPageContent
          query={QUERY}
          result={null}
          isLoading={false}
          isError
          totalPages={1}
          onRetry={cb}
        />
      </TestWrapper>,
    );
    expect(screen.getByText(/Không tải được kết quả/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thử lại/i }),
    ).toBeInTheDocument();
  });

  it("renders empty state when result is null but no error", () => {
    render(
      <TestWrapper>
        <SearchPageContent
          query={QUERY}
          result={null}
          isLoading={false}
          isError={false}
          totalPages={1}
        />
      </TestWrapper>,
    );
    // total = 0, no error → empty state
    expect(
      screen.getByText(/Không tìm thấy sản phẩm phù hợp/i),
    ).toBeInTheDocument();
  });

  it("renders results + mall banner when result has items and mall", () => {
    render(
      <TestWrapper>
        <SearchPageContent
          query={QUERY}
          result={MOCK_SEARCH_RESULT}
          isLoading={false}
          isError={false}
          totalPages={42}
        />
      </TestWrapper>,
    );
    expect(screen.getByTestId("search-mall-banner")).toBeInTheDocument();
    expect(screen.getByTestId("search-grid")).toBeInTheDocument();
    expect(screen.getByTestId("search-sort-bar")).toBeInTheDocument();
    expect(screen.getByTestId("search-pagination")).toBeInTheDocument();
  });

  it("renders skeleton grid when isLoading is true", () => {
    render(
      <TestWrapper>
        <SearchPageContent
          query={QUERY}
          result={null}
          isLoading
          isError={false}
          totalPages={1}
        />
      </TestWrapper>,
    );
    // Trong skeleton mode: result null + isLoading → page renders grid skeleton (skeleton cùng data-testid 'search-grid' but class).
    // Empty state vẫn KHÔNG render (vì isLoading). Mall banner không render.
    expect(screen.queryByTestId("search-mall-banner")).not.toBeInTheDocument();
  });
});
