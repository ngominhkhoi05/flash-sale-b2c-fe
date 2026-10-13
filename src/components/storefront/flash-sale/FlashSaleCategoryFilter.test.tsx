/**
 * Smoke test cho FlashSaleCategoryFilter.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashSaleCategoryFilter } from "./FlashSaleCategoryFilter";

const categories = [
  { key: "all", label: "Tất cả", count: 10 },
  { key: "phone", label: "Điện thoại", count: 4 },
  { key: "laptop", label: "Laptop", count: 3 },
  { key: "audio", label: "Âm thanh", count: 2 },
  { key: "watch", label: "Đồng hồ", count: 1 },
];

describe("FlashSaleCategoryFilter", () => {
  it("renders 'Tất cả' chip with total count", () => {
    render(<FlashSaleCategoryFilter categories={categories} active="all" />);
    expect(screen.getByText("Tất cả")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders 5 category chips", () => {
    render(<FlashSaleCategoryFilter categories={categories} active="all" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("marks active chip with aria-pressed=true", () => {
    render(<FlashSaleCategoryFilter categories={categories} active="phone" />);
    const phoneBtn = screen.getByRole("button", { name: /điện thoại/i });
    expect(phoneBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("invokes onChange when user clicks a chip", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FlashSaleCategoryFilter
        categories={categories}
        active="all"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /laptop/i }));
    expect(onChange).toHaveBeenCalledWith("laptop");
  });
});
