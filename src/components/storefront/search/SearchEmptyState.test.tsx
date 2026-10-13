/**
 * Test for SearchEmptyState.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/__tests__/test-wrapper";

import { SearchEmptyState } from "./SearchEmptyState";

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

describe("SearchEmptyState", () => {
  it("renders title, description and both action buttons", () => {
    render(
      <TestWrapper>
        <SearchEmptyState query="xyz123" />
      </TestWrapper>,
    );
    expect(
      screen.getByText(/Không tìm thấy sản phẩm phù hợp/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Xóa bộ lọc tìm kiếm/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Về trang chủ mua sắm/i }),
    ).toBeInTheDocument();
  });

  it("shows suggested keywords section", () => {
    render(
      <TestWrapper>
        <SearchEmptyState query="xyz" />
      </TestWrapper>,
    );
    expect(screen.getByText(/Gợi ý từ khóa/i)).toBeInTheDocument();
  });

  it("displays the current query keyword", () => {
    render(
      <TestWrapper>
        <SearchEmptyState query="abcxyz" />
      </TestWrapper>,
    );
    expect(screen.getByText(/abcxyz/)).toBeInTheDocument();
  });

  it("invokes onClearFilters when clicking clear button", () => {
    const cb = vi.fn();
    render(
      <TestWrapper>
        <SearchEmptyState query="abc" onClearFilters={cb} />
      </TestWrapper>,
    );
    const btn = screen.getByRole("button", { name: /Xóa bộ lọc tìm kiếm/i });
    btn.click();
    expect(cb).toHaveBeenCalled();
  });
});
