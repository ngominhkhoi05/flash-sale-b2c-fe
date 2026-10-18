/**
 * Test for SearchBreadcrumb.
 * Covers: dynamic query ở segment cuối + fallback khi query rỗng.
 *
 * Regression: trước đây segment cuối hard-code `t("current")` ("Tai nghe" / "Headphones")
 * thay vì hiển thị query người dùng gõ vào.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestWrapper } from "@/__tests__/test-wrapper";

import { SearchBreadcrumb } from "./SearchBreadcrumb";

describe("SearchBreadcrumb", () => {
  it("renders query value in the last segment (interpolates {q})", () => {
    render(
      <TestWrapper>
        <SearchBreadcrumb query="sạc" />
      </TestWrapper>,
    );
    const current = screen.getByTestId("search-breadcrumb-current");
    expect(current).toHaveTextContent(/sạc/);
    // Không render literal placeholder.
    expect(current.textContent ?? "").not.toContain("{q}");
  });

  it("renders 'Tất cả sản phẩm' fallback when query is empty", () => {
    render(
      <TestWrapper>
        <SearchBreadcrumb query="" />
      </TestWrapper>,
    );
    expect(
      screen.getByTestId("search-breadcrumb-current").textContent ?? "",
    ).toMatch(/Tất cả sản phẩm/);
  });

  it("renders 'Tất cả sản phẩm' fallback when query is whitespace only", () => {
    render(
      <TestWrapper>
        <SearchBreadcrumb query="   " />
      </TestWrapper>,
    );
    expect(
      screen.getByTestId("search-breadcrumb-current").textContent ?? "",
    ).toMatch(/Tất cả sản phẩm/);
  });

  it("renders home + category links (vi locale)", () => {
    render(
      <TestWrapper>
        <SearchBreadcrumb query="tai nghe" />
      </TestWrapper>,
    );
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText("Thiết bị điện tử")).toBeInTheDocument();
  });

  it("renders home + category in en locale", () => {
    render(
      <TestWrapper locale="en">
        <SearchBreadcrumb query="headphones" />
      </TestWrapper>,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(
      screen.getByTestId("search-breadcrumb-current").textContent ?? "",
    ).toMatch(/headphones/);
  });
});
