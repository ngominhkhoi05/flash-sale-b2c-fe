/**
 * Tests for CheckoutOrderSummary.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CheckoutOrderSummary,
  type CheckoutOrderSummaryLine,
} from "./CheckoutOrderSummary";

const SAMPLE_LINES: CheckoutOrderSummaryLine[] = [
  {
    label: "Tạm tính (3 sản phẩm)",
    value: "1.332.000₫",
  },
  {
    label: "Phí vận chuyển (2 đơn)",
    value: "30.000₫",
  },
  {
    label: "Voucher shop",
    value: "−20.000₫",
    highlight: "sale",
  },
  {
    label: "Voucher VibeMart (FREESHIP50K)",
    value: "−50.000₫",
    highlight: "sale",
  },
];

describe("CheckoutOrderSummary", () => {
  it("hiển thị tiêu đề và các dòng tổng kết", () => {
    render(
      <CheckoutOrderSummary
        lines={SAMPLE_LINES}
        grandTotal="1.292.000₫"
        paymentMethod="ZALOPAY"
        isSubmitting={false}
        canSubmit
        onSubmit={() => {}}
      />,
    );

    expect(screen.getByText("Tóm tắt đơn hàng")).toBeInTheDocument();
    expect(screen.getByText("Tạm tính (3 sản phẩm)")).toBeInTheDocument();
    expect(screen.getByText("1.292.000₫")).toBeInTheDocument();
    expect(screen.getByTestId("grand-total")).toHaveTextContent("1.292.000₫");
  });

  it("gọi onSubmit khi click nút Đặt hàng ngay", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CheckoutOrderSummary
        lines={SAMPLE_LINES}
        grandTotal="1.292.000₫"
        paymentMethod="ZALOPAY"
        isSubmitting={false}
        canSubmit
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByTestId("submit-order-button"));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("vô hiệu hóa nút khi canSubmit = false", () => {
    render(
      <CheckoutOrderSummary
        lines={SAMPLE_LINES}
        grandTotal="1.292.000₫"
        paymentMethod="ZALOPAY"
        isSubmitting={false}
        canSubmit={false}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByTestId("submit-order-button")).toBeDisabled();
  });

  it("hiển thị spinner khi isSubmitting = true", () => {
    render(
      <CheckoutOrderSummary
        lines={SAMPLE_LINES}
        grandTotal="1.292.000₫"
        paymentMethod="ZALOPAY"
        isSubmitting
        canSubmit
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText("Đang xử lý...")).toBeInTheDocument();
  });

  it("hiển thị thông báo lỗi khi hasError = true", () => {
    render(
      <CheckoutOrderSummary
        lines={SAMPLE_LINES}
        grandTotal="1.292.000₫"
        paymentMethod="COD"
        isSubmitting={false}
        hasError
        canSubmit
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByTestId("submit-error")).toBeInTheDocument();
  });

  it("hiển thị thông báo giữ chỗ 5 phút khi payment = ZALOPAY", () => {
    render(
      <CheckoutOrderSummary
        lines={SAMPLE_LINES}
        grandTotal="1.292.000₫"
        paymentMethod="ZALOPAY"
        isSubmitting={false}
        canSubmit
        onSubmit={() => {}}
      />,
    );
    expect(
      screen.getByText(/giữ chỗ trong 5 phút/i),
    ).toBeInTheDocument();
  });

  it("không hiển thị thông báo giữ chỗ khi payment = COD", () => {
    render(
      <CheckoutOrderSummary
        lines={SAMPLE_LINES}
        grandTotal="1.292.000₫"
        paymentMethod="COD"
        isSubmitting={false}
        canSubmit
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByText(/giữ chỗ trong 5 phút/i)).not.toBeInTheDocument();
  });
});
