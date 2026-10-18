/**
 * Test for SearchHeading.
 * Covers: i18n placeholder interpolation + total count variants.
 *
 * Regression: trước đây `resultsFor` trong messages/vi.json dùng `'{q}'`
 * (single-quoted), khiến next-intl render literal `{q}` thay vì giá trị query.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestWrapper } from "@/__tests__/test-wrapper";

import { SearchHeading } from "./SearchHeading";

describe("SearchHeading", () => {
  it("renders query value in resultsFor (interpolates {q}, no literal placeholder)", () => {
    render(
      <TestWrapper>
        <SearchHeading query="sạc" total={42} />
      </TestWrapper>,
    );
    // Phải hiển thị 'Kết quả cho "sạc"' chứ không phải 'Kết quả cho {q}'.
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/Kết quả cho.*sạc/);
    expect(heading.textContent ?? "").not.toContain("{q}");
  });

  it("falls back to ellipsis when query is empty", () => {
    render(
      <TestWrapper>
        <SearchHeading query="" total={0} />
      </TestWrapper>,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/Kết quả cho.*…/);
  });

  it("renders total count when total > 0", () => {
    render(
      <TestWrapper>
        <SearchHeading query="tai nghe" total={1234} />
      </TestWrapper>,
    );
    // Số phải được format vi-VN (dấu chấm phân cách hàng nghìn).
    expect(screen.getByText(/1\.234 sản phẩm/)).toBeInTheDocument();
    // Đảm bảo placeholder {total} cũng được interpolate.
    expect(screen.queryByText("{total}")).not.toBeInTheDocument();
  });

  it("renders zero-state message when total = 0", () => {
    render(
      <TestWrapper>
        <SearchHeading query="xyz" total={0} />
      </TestWrapper>,
    );
    expect(screen.getByText(/Không tìm thấy sản phẩm nào/)).toBeInTheDocument();
  });
});
