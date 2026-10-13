/**
 * Tests for CheckoutPaymentMethodCard.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutPaymentMethodCard } from "./CheckoutPaymentMethodCard";

describe("CheckoutPaymentMethodCard", () => {
  it("hiển thị 2 phương thức ZaloPay và COD", () => {
    render(
      <CheckoutPaymentMethodCard value="ZALOPAY" onChange={() => {}} />,
    );
    expect(screen.getByText("ZaloPay – Quét mã QR")).toBeInTheDocument();
    expect(screen.getByText("Thanh toán khi nhận hàng (COD)")).toBeInTheDocument();
  });

  it("đánh dấu option đang active", () => {
    render(
      <CheckoutPaymentMethodCard value="COD" onChange={() => {}} />,
    );
    const codOption = screen.getByTestId("payment-option-COD");
    expect(codOption).toHaveAttribute("data-active", "true");
    const zaloOption = screen.getByTestId("payment-option-ZALOPAY");
    expect(zaloOption).toHaveAttribute("data-active", "false");
  });

  it("gọi onChange với method mới khi user chọn", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckoutPaymentMethodCard value="ZALOPAY" onChange={onChange} />,
    );
    await user.click(screen.getByTestId("payment-option-COD"));
    expect(onChange).toHaveBeenCalledWith("COD");
  });

  it("disabled khi prop disabled = true", () => {
    render(
      <CheckoutPaymentMethodCard
        value="ZALOPAY"
        onChange={() => {}}
        disabled
      />,
    );
    const radios = screen.getAllByRole("radio");
    radios.forEach((r) => expect(r).toBeDisabled());
  });
});
