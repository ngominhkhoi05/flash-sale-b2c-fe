import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCommitments } from "./ProductCommitments";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { CommitmentBadge } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_COMMITMENTS: CommitmentBadge[] = [
  { icon: "eco", iconClass: "text-secondary", label: "100% Cotton Tự Nhiên" },
  { icon: "published_with_changes", iconClass: "text-primary", label: "Đổi trả 30 ngày dễ dàng" },
  { icon: "verified_user", iconClass: "text-secondary", label: "Bảo hành may 6 tháng" },
];

describe("ProductCommitments", () => {
  it("renders all 3 commitment badges", () => {
    renderWithIntl(
      <ProductCommitments commitments={MOCK_COMMITMENTS} />
    );
    expect(screen.getByText("100% Cotton Tự Nhiên")).toBeInTheDocument();
    expect(screen.getByText("Đổi trả 30 ngày dễ dàng")).toBeInTheDocument();
    expect(screen.getByText("Bảo hành may 6 tháng")).toBeInTheDocument();
  });

  it("renders 3 SVG icons", () => {
    renderWithIntl(
      <ProductCommitments commitments={MOCK_COMMITMENTS} />
    );
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });

  it("renders 0 badge items when commitments is empty", () => {
    renderWithIntl(
      <ProductCommitments commitments={[]} />
    );
    // No labels rendered
    expect(screen.queryByText(/Cotton/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Đổi trả/i)).not.toBeInTheDocument();
  });
});
