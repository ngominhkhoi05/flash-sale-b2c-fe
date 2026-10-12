import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductVouchers } from "./ProductVouchers";
import { TestWrapper } from "@/__tests__/test-wrapper";
import userEvent from "@testing-library/user-event";
import type { ShopVoucher } from "@/features/products";

// Ensure navigator.clipboard exists for userEvent
if (!globalThis.navigator.clipboard) {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
}

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_VOUCHERS: ShopVoucher[] = [
  { id: 1, label: "Giảm 10K đơn từ 200K" },
  { id: 2, label: "Giảm 5% tối đa 30K" },
];

describe("ProductVouchers", () => {
  it("renders all voucher labels", () => {
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    expect(screen.getByText("Giảm 10K đơn từ 200K")).toBeInTheDocument();
    expect(screen.getByText("Giảm 5% tối đa 30K")).toBeInTheDocument();
  });

  it("renders 'Lưu' button for each voucher (initial state)", () => {
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    const saveButtons = screen.getAllByRole("button", { name: /^Lưu$/ });
    expect(saveButtons.length).toBe(2);
  });

  it("toggles button text to 'Đã Lưu' on click", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    const saveBtn = screen.getAllByRole("button", { name: /^Lưu$/ })[0];
    await user.click(saveBtn);
    // Now there's a 'Đã Lưu' button
    const savedBtn = screen.getByRole("button", { name: /Đã Lưu/ });
    expect(savedBtn).toBeInTheDocument();
  });

  it("renders nothing when vouchers is empty", () => {
    const { container } = renderWithIntl(<ProductVouchers vouchers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
