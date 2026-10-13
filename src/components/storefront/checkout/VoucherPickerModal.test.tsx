/**
 * Tests for VoucherPickerModal.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoucherPickerModal } from "./VoucherPickerModal";
import type { Voucher } from "@/features/checkout";

const VOUCHERS: Voucher[] = [
  {
    id: 1,
    code: "FREESHIP50K",
    label: "Freeship 50K",
    scope: "PLATFORM",
    discountAmount: 50000,
    status: "ACTIVE",
    expiresAtLabel: "30/12/2026",
  },
  {
    id: 2,
    code: "VIBE30K",
    label: "VIBE30K",
    scope: "PLATFORM",
    discountAmount: 30000,
    status: "EXPIRED",
    expiresAtLabel: "01/01/2026",
  },
];

describe("VoucherPickerModal", () => {
  it("không render khi open = false", () => {
    const { container } = render(
      <VoucherPickerModal
        open={false}
        vouchers={VOUCHERS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("render danh sách voucher và tab", () => {
    render(
      <VoucherPickerModal
        open
        vouchers={VOUCHERS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId("voucher-option-FREESHIP50K")).toBeInTheDocument();
    expect(screen.getByTestId("voucher-option-VIBE30K")).toBeInTheDocument();
    expect(screen.getByTestId("voucher-tab-all")).toBeInTheDocument();
    expect(screen.getByTestId("voucher-tab-active")).toBeInTheDocument();
  });

  it("gọi onSelect khi bấm Áp dụng voucher ACTIVE", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <VoucherPickerModal
        open
        vouchers={VOUCHERS}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    );
    const btn = screen.getByTestId("voucher-apply-FREESHIP50K");
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onSelect).toHaveBeenCalledWith(VOUCHERS[0]);
  });

  it("nút Áp dụng bị disabled khi voucher EXPIRED", () => {
    render(
      <VoucherPickerModal
        open
        vouchers={VOUCHERS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    const btn = screen.getByTestId("voucher-apply-VIBE30K");
    expect(btn).toBeDisabled();
  });

  it("gọi onClose khi bấm nút Đóng", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <VoucherPickerModal
        open
        vouchers={VOUCHERS}
        onSelect={() => {}}
        onClose={onClose}
      />,
    );
    // Có 2 nút "Đóng" (icon X ở header + footer) — lấy cái cuối
    const closeButtons = screen.getAllByRole("button", { name: /Đóng/ });
    await user.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });
});
