/**
 * ProductQuantityStepper – Section 13.
 * Tests: render value, +/-, min disables minus, max disables plus.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductQuantityStepper } from "./ProductQuantityStepper";
import { TestWrapper } from "@/__tests__/test-wrapper";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductQuantityStepper", () => {
  it("renders input with value prop and stock count text", () => {
    renderWithIntl(
      <ProductQuantityStepper
        value={2}
        min={1}
        max={10}
        stockCount={48}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("2");
    expect(input).toHaveAttribute("readonly");
    // Stock text mentions bold 48
    const stockText = screen.getByText(/48/);
    expect(stockText).toBeInTheDocument();
  });

  it("calls onChange with incremented value when + is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <ProductQuantityStepper
        value={1}
        min={1}
        max={10}
        stockCount={48}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /plus|increment/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onChange with decremented value when − is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <ProductQuantityStepper
        value={3}
        min={1}
        max={10}
        stockCount={48}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /minus|decrement/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("disables minus button when value equals min", () => {
    renderWithIntl(
      <ProductQuantityStepper
        value={1}
        min={1}
        max={10}
        stockCount={48}
        onChange={() => {}}
      />
    );
    const minusBtn = screen.getByRole("button", { name: /minus|decrement/i });
    expect(minusBtn).toBeDisabled();
  });

  it("disables plus button when value equals max", () => {
    renderWithIntl(
      <ProductQuantityStepper
        value={10}
        min={1}
        max={10}
        stockCount={48}
        onChange={() => {}}
      />
    );
    const plusBtn = screen.getByRole("button", { name: /plus|increment/i });
    expect(plusBtn).toBeDisabled();
  });

  it("uses min=1 by default", () => {
    renderWithIntl(
      <ProductQuantityStepper
        value={1}
        max={10}
        stockCount={48}
        onChange={() => {}}
      />
    );
    const minusBtn = screen.getByRole("button", { name: /minus|decrement/i });
    expect(minusBtn).toBeDisabled();
  });
});
