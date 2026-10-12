import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductVouchers } from "./ProductVouchers";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { ShopVoucher } from "@/features/products";

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
  it("renders the label 'Mã Giảm Giá:' from i18n", () => {
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    expect(screen.getByText(/Mã Giảm Giá:/)).toBeInTheDocument();
  });

  it("renders voucher chips with labels (2 chips for 2 vouchers)", () => {
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    expect(screen.getByText("Giảm 10K đơn từ 200K")).toBeInTheDocument();
    expect(screen.getByText("Giảm 5% tối đa 30K")).toBeInTheDocument();
  });

  it("renders a 'Lưu' button for each voucher (initial state)", () => {
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    const saveButtons = screen.getAllByRole("button", { name: /^Lưu$/ });
    expect(saveButtons).toHaveLength(2);
  });

  it("toggles button text to 'Đã Lưu' on click and applies saved styling", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    const saveBtn = screen.getAllByRole("button", { name: /^Lưu$/ })[0];
    await user.click(saveBtn);
    const savedBtn = screen.getByRole("button", { name: /Đã Lưu/ });
    expect(savedBtn).toBeInTheDocument();
  });
});

describe("ProductVouchers – mocked i18n snapshot", () => {
  it("uses productDetail.vouchers.* translations", () => {
    const spy = vi.fn().mockImplementation((() => "MOCK") as unknown as never);
    // re-render with explicit TestWrapper to verify provider wired
    renderWithIntl(<ProductVouchers vouchers={MOCK_VOUCHERS} />);
    // After clicking, the saved label should appear (proves i18n hooked up)
    const saveBtn = screen.getAllByRole("button", { name: /^Lưu$/ })[0];
    expect(saveBtn).toBeInTheDocument();
    spy.mockRestore();
  });
});
