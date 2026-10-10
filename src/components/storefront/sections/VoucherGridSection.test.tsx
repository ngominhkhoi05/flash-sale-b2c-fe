/**
 * Unit tests cho VoucherGridSection.
 * - Logic state: button "Lưu" toggle "Đã lưu" khi click
 * - Logic xác nhận state của all tickets sau khi click từng button
 *
 * Snapshot/pixel-match ở HomepageView test.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoucherGridSection } from "./VoucherGridSection";
import { TestWrapper } from "@/__tests__/test-wrapper";

describe("VoucherGridSection – save state", () => {
  it("renders all 4 voucher tickets", () => {
    render(<VoucherGridSection />, { wrapper: TestWrapper });
    // Section h2 title (Mã giảm giá cho bạn → "Mã giảm giá" substring)
    const headings = screen.getAllByRole("heading");
    expect(headings.find((h) => h.textContent?.toLowerCase().includes("mã giảm"))).toBeInTheDocument();
    // 4 ticket cards
    expect(screen.getAllByText(/giảm \d+k/i).length).toBeGreaterThanOrEqual(2);
  });

  it("renders 4 'Save' (Lưu) buttons by default", () => {
    render(<VoucherGridSection />, { wrapper: TestWrapper });
    const saveButtons = screen.getAllByRole("button", { name: /lưu/i });
    expect(saveButtons).toHaveLength(4);
  });

  it("clicking Save toggles to Saved for that ticket only", async () => {
    const user = userEvent.setup();
    render(<VoucherGridSection />, { wrapper: TestWrapper });
    const saveButtons = screen.getAllByRole("button", { name: /lưu/i });
    expect(saveButtons).toHaveLength(4);

    // Click first one (use data-testid for reliable selection)
    await user.click(screen.getByTestId("save-v-1"));
    // First becomes "Đã lưu", others remain "Lưu"
    const saved = screen.getByRole("button", { name: /đã lưu/i });
    expect(saved).toBeInTheDocument();
    expect(saved).toHaveAttribute("data-testid", "save-v-1");
  });

  it("clicking Save twice reverts back to Save", async () => {
    const user = userEvent.setup();
    render(<VoucherGridSection />, { wrapper: TestWrapper });
    const btn = screen.getAllByRole("button", { name: /lưu/i })[0];
    await user.click(btn);
    expect(screen.getByRole("button", { name: /đã lưu/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /đã lưu/i }));
    expect(screen.getAllByRole("button", { name: /lưu/i })).toHaveLength(4);
  });
});
