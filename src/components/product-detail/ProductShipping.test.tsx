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
  it("renders the 'Vận Chuyển:' label from i18n", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(screen.getByText(/Vận Chuyển:/)).toBeInTheDocument();
  });

  it("renders FREESHIP XTRA badge with freeship text", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(screen.getByText("FREESHIP XTRA")).toBeInTheDocument();
    expect(screen.getByText(/Miễn phí vận chuyển đơn từ 150K/)).toBeInTheDocument();
  });

  it("renders ship-to row with location icon and address", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(screen.getByText(/Vận chuyển tới:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Phường Tăng Nhơn Phú B, TP. Thủ Đức/)
    ).toBeInTheDocument();
  });

  it("renders 'Đổi địa chỉ' link (primary color)", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    const changeLink = screen.getByRole("button", { name: /Đổi địa chỉ/ });
    expect(changeLink).toBeInTheDocument();
  });

  it("renders estimated delivery row with time + schedule icon", () => {
    renderWithIntl(<ProductShipping shipping={MOCK_SHIPPING} />);
    expect(screen.getByText(/Thời gian nhận dự kiến:/)).toBeInTheDocument();
    expect(screen.getByText(/1 - 2 ngày làm việc/)).toBeInTheDocument();
  });

  // ── Defensive null test (2026-10-18 bug #4 fix) ─────────────────────────
  it("returns null when shipping is null (BE runtime có thể trả null)", () => {
    const { container } = renderWithIntl(
      <ProductShipping shipping={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when shipping is undefined", () => {
    const { container } = renderWithIntl(
      <ProductShipping shipping={undefined} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
