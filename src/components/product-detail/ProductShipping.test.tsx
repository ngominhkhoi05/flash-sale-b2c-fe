import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductShipping } from "./ProductShipping";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { ShippingInfo } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_SHIPPING: ShippingInfo = {
  freeshipBadge: "FREESHIP XTRA",
  freeshipText: "Miễn phí vận chuyển đơn từ 150K",
  shipTo: "Phường Tăng Nhơn Phú B, TP. Thủ Đức (Quận 9), TP.HCM",
  estimatedDays: "1 - 2 ngày làm việc",
};

describe("ProductShipping", () => {
  it("renders freeship badge + text", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(screen.getByText("FREESHIP XTRA")).toBeInTheDocument();
    expect(screen.getByText(/Miễn phí vận chuyển/)).toBeInTheDocument();
  });

  it("renders ship-to address", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(
      screen.getByText(/Phường Tăng Nhơn Phú B/)
    ).toBeInTheDocument();
  });

  it("renders estimated delivery time", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(screen.getByText(/1 - 2 ngày làm việc/)).toBeInTheDocument();
  });

  it("renders 'Đổi địa chỉ' button", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(
      screen.getByRole("button", { name: /Đổi địa chỉ/ })
    ).toBeInTheDocument();
  });
});
