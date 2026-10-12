import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductVariantSwitcher } from "./ProductVariantSwitcher";
import { TestWrapper } from "@/__tests__/test-wrapper";
import userEvent from "@testing-library/user-event";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductVariantSwitcher", () => {
  it("renders both options", () => {
    const onModeChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher
        mode="standard"
        onModeChange={onModeChange}
      />
    );
    expect(screen.getByRole("button", { name: /Biến thể A/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Biến thể B/i })).toBeInTheDocument();
  });

  it("calls onModeChange with 'flash' when B is clicked", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher
        mode="standard"
        onModeChange={onModeChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /Biến thể B/i }));
    expect(onModeChange).toHaveBeenCalledWith("flash");
  });

  it("calls onModeChange with 'standard' when A is clicked", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher
        mode="flash"
        onModeChange={onModeChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /Biến thể A/i }));
    expect(onModeChange).toHaveBeenCalledWith("standard");
  });

  it('aria-pressed is true for active mode, false for inactive', () => {
    const onModeChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher
        mode="standard"
        onModeChange={onModeChange}
      />
    );
    const btnA = screen.getByRole("button", { name: /Biến thể A/i });
    const btnB = screen.getByRole("button", { name: /Biến thể B/i });
    expect(btnA).toHaveAttribute("aria-pressed", "true");
    expect(btnB).toHaveAttribute("aria-pressed", "false");
  });
});
