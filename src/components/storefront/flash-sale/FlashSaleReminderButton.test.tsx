/**
 * Smoke + state test cho FlashSaleReminderButton.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashSaleReminderButton } from "./FlashSaleReminderButton";

describe("FlashSaleReminderButton", () => {
  it("renders 'Nhắc tôi' label by default", () => {
    render(<FlashSaleReminderButton />);
    expect(screen.getByText(/nhắc tôi/i)).toBeInTheDocument();
  });

  it("toggles to 'Đã đặt nhắc hẹn' after click", async () => {
    const user = userEvent.setup();
    render(<FlashSaleReminderButton />);
    const btn = screen.getByRole("button", { name: /nhắc tôi/i });
    await user.click(btn);
    expect(screen.getByText(/đã đặt nhắc hẹn/i)).toBeInTheDocument();
  });

  it("toggles back to 'Nhắc tôi' on second click", async () => {
    const user = userEvent.setup();
    render(<FlashSaleReminderButton />);
    const btn = screen.getByRole("button", { name: /nhắc tôi/i });
    await user.click(btn);
    const btn2 = screen.getByRole("button", { name: /đã đặt nhắc hẹn/i });
    await user.click(btn2);
    expect(screen.getByText(/nhắc tôi/i)).toBeInTheDocument();
  });
});
