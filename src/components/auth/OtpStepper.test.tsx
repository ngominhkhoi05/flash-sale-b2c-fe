import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OtpStepper } from "./OtpStepper";
import { TestWrapper } from "@/__tests__/test-wrapper";

function withI18n(ui: React.ReactNode) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("OtpStepper", () => {
  it("render 3 bước theo mặc định (done / active / pending)", () => {
    withI18n(<OtpStepper />);
    expect(screen.getByTestId("otp-step-0")).toHaveAttribute("data-state", "done");
    expect(screen.getByTestId("otp-step-1")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("otp-step-2")).toHaveAttribute("data-state", "pending");
  });

  it("hiển thị nhãn tiếng Việt từ i18n", () => {
    withI18n(<OtpStepper />);
    expect(screen.getByText("Tạo tài khoản")).toBeInTheDocument();
    expect(screen.getByText("Xác thực email")).toBeInTheDocument();
    expect(screen.getByText("Hoàn tất")).toBeInTheDocument();
  });

  it("step done hiển thị checkmark (svg check)", () => {
    withI18n(<OtpStepper />);
    const circle = screen.getByTestId("otp-step-circle-0");
    // Có svg check bên trong
    expect(circle.querySelector("svg")).toBeInTheDocument();
  });

  it("step active hiển thị số 2", () => {
    withI18n(<OtpStepper />);
    const circle = screen.getByTestId("otp-step-circle-1");
    expect(circle.textContent).toBe("2");
  });

  it("step pending hiển thị số 3", () => {
    withI18n(<OtpStepper />);
    const circle = screen.getByTestId("otp-step-circle-2");
    expect(circle.textContent).toBe("3");
  });

  it("render 2 line nối giữa 3 step", () => {
    withI18n(<OtpStepper />);
    expect(screen.getByTestId("otp-step-line-0")).toBeInTheDocument();
    expect(screen.getByTestId("otp-step-line-1")).toBeInTheDocument();
  });

  it("chấp nhận prop steps tuỳ chỉnh", () => {
    withI18n(<OtpStepper steps={["active", "pending", "pending"]} />);
    expect(screen.getByTestId("otp-step-0")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("otp-step-1")).toHaveAttribute("data-state", "pending");
  });
});
