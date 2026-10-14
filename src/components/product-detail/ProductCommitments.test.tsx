import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCommitments } from "./ProductCommitments";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { BackendProductCommitment } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_BE_COMMITMENTS: BackendProductCommitment = {
  return_days: 7,
  warranty_months: 3,
  authentic_guarantee: true,
  shipping_time_hours: 48,
  free_shipping_threshold: 0,
};

describe("ProductCommitments (BE shape)", () => {
  it("renders return-days badge when return_days > 0", () => {
    renderWithIntl(
      <ProductCommitments commitments={MOCK_BE_COMMITMENTS} />,
    );
    // Số ngày đổi trả phải xuất hiện trong text
    expect(screen.getByText(/7/)).toBeInTheDocument();
  });

  it("renders warranty badge when warranty_months > 0", () => {
    renderWithIntl(
      <ProductCommitments commitments={MOCK_BE_COMMITMENTS} />,
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("renders authentic badge when authentic_guarantee is true", () => {
    renderWithIntl(
      <ProductCommitments commitments={MOCK_BE_COMMITMENTS} />,
    );
    // Badge chính hãng có icon verified_user và text "Chính hãng"
    expect(screen.getByText(/chính hãng/i)).toBeInTheDocument();
  });

  it("does NOT render when commitments is null", () => {
    const { container } = renderWithIntl(
      <ProductCommitments commitments={null} />,
    );
    // Không có badge nào hiển thị
    expect(container.querySelectorAll("svg").length).toBe(0);
  });

  it("does NOT render any badge when all flags are 0/false", () => {
    const { container } = renderWithIntl(
      <ProductCommitments
        commitments={{
          return_days: 0,
          warranty_months: 0,
          authentic_guarantee: false,
          shipping_time_hours: 0,
          free_shipping_threshold: 0,
        }}
      />,
    );
    expect(container.querySelectorAll("svg").length).toBe(0);
  });
});