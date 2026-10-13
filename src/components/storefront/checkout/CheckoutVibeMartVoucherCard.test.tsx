/**
 * Tests for CheckoutVibeMartVoucherCard.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutVibeMartVoucherCard } from "./CheckoutVibeMartVoucherCard";
import type { Voucher } from "@/features/checkout";

const MOCK_VOUCHER: Voucher = {
  id: 1,
  code: "VIBE30K",
  label: "Giảm 30K",
  shortDescription: "Đơn từ 1.000.000₫",
  scope: "PLATFORM",
  discountAmount: 30000,
  status: "ACTIVE",
  discountLabel: "30.000₫",
};

describe("CheckoutVibeMartVoucherCard", () => {
  it("hiển thị input và nút Áp dụng", () => {
    render(
      <CheckoutVibeMartVoucherCard
        appliedVoucher={null}
        onApply={() => {}}
        onRemove={() => {}}
        onOpenPicker={() => {}}
      />,
    );
    expect(screen.getByTestId("voucher-code-input")).toBeInTheDocument();
    expect(screen.getByTestId("voucher-apply-button")).toBeInTheDocument();
  });

  it("gọi onApply khi bấm Áp dụng với code hợp lệ", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <CheckoutVibeMartVoucherCard
        appliedVoucher={null}
        onApply={onApply}
        onRemove={() => {}}
        onOpenPicker={() => {}}
      />,
    );
    const input = screen.getByTestId("voucher-code-input");
    await user.type(input, "VIBE30K");
    await user.click(screen.getByTestId("voucher-apply-button"));
    expect(onApply).toHaveBeenCalledWith("VIBE30K");
  });

  it("gọi onApply khi nhấn Enter", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <CheckoutVibeMartVoucherCard
        appliedVoucher={null}
        onApply={onApply}
        onRemove={() => {}}
        onOpenPicker={() => {}}
      />,
    );
    const input = screen.getByTestId("voucher-code-input");
    await user.type(input, "VIBE30K{enter}");
    expect(onApply).toHaveBeenCalledWith("VIBE30K");
  });

  it("hiển thị voucher đã áp dụng với chip xanh", () => {
    render(
      <CheckoutVibeMartVoucherCard
        appliedVoucher={MOCK_VOUCHER}
        onApply={() => {}}
        onRemove={() => {}}
        onOpenPicker={() => {}}
      />,
    );
    const applied = screen.getByTestId("voucher-applied");
    expect(applied).toBeInTheDocument();
    expect(applied).toHaveTextContent("VIBE30K");
    expect(applied).toHaveTextContent("30.000₫");
  });

  it("gọi onRemove khi bấm nút gỡ", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <CheckoutVibeMartVoucherCard
        appliedVoucher={MOCK_VOUCHER}
        onApply={() => {}}
        onRemove={onRemove}
        onOpenPicker={() => {}}
      />,
    );
    await user.click(screen.getByTestId("voucher-remove-button"));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("hiển thị thông báo lỗi khi có errorMessage", () => {
    render(
      <CheckoutVibeMartVoucherCard
        appliedVoucher={null}
        onApply={() => {}}
        onRemove={() => {}}
        onOpenPicker={() => {}}
        errorMessage="Mã không hợp lệ"
      />,
    );
    expect(screen.getByTestId("voucher-error")).toHaveTextContent(
      "Mã không hợp lệ",
    );
  });

  it("gọi onOpenPicker khi bấm Xem thêm mã", async () => {
    const user = userEvent.setup();
    const onOpenPicker = vi.fn();
    render(
      <CheckoutVibeMartVoucherCard
        appliedVoucher={null}
        onApply={() => {}}
        onRemove={() => {}}
        onOpenPicker={onOpenPicker}
      />,
    );
    await user.click(screen.getByTestId("voucher-picker-trigger"));
    expect(onOpenPicker).toHaveBeenCalledOnce();
  });
});
