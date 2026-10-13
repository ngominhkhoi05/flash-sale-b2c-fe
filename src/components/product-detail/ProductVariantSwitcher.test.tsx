import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductVariantSwitcher } from "./ProductVariantSwitcher";
import { TestWrapper } from "@/__tests__/test-wrapper";
import userEvent from "@testing-library/user-event";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductVariantSwitcher", () => {
  it("renders both standard and flash options", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher value="flash" onChange={onChange} />,
    );
    expect(
      screen.getByRole("button", { name: /Biến thể A/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Biến thể B/i }),
    ).toBeInTheDocument();
  });

  it("emits onChange('flash') when flash button clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher value="standard" onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: /Biến thể B/i }));
    expect(onChange).toHaveBeenCalledWith("flash");
  });

  it("emits onChange('standard') when standard button clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher value="flash" onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: /Biến thể A/i }));
    expect(onChange).toHaveBeenCalledWith("standard");
  });

  it("selected option has aria-pressed=true; non-selected has aria-pressed=false", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <ProductVariantSwitcher value="standard" onChange={onChange} />,
    );
    const btnA = screen.getByRole("button", { name: /Biến thể A/i });
    const btnB = screen.getByRole("button", { name: /Biến thể B/i });
    expect(btnA).toHaveAttribute("aria-pressed", "true");
    expect(btnB).toHaveAttribute("aria-pressed", "false");
  });
});