import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ResendCountdown } from "./ResendCountdown";
import { TestWrapper } from "@/__tests__/test-wrapper";

function withI18n(ui: React.ReactNode) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ResendCountdown", () => {
  it("hiển thị countdown khi còn giây", () => {
    withI18n(<ResendCountdown seconds={60} />);
    expect(screen.getByTestId("resend-countdown")).toBeInTheDocument();
    expect(screen.queryByTestId("resend-button")).not.toBeInTheDocument();
    // Format "01:00" từ i18n resendCountdown
    expect(screen.getByTestId("resend-countdown-timer")).toHaveTextContent("01:00");
  });

  it("đếm ngược mỗi giây", () => {
    withI18n(<ResendCountdown seconds={5} />);
    expect(screen.getByTestId("resend-countdown-timer")).toHaveTextContent("00:05");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("resend-countdown-timer")).toHaveTextContent("00:03");
  });

  it("khi về 0: hiển thị button Resend thay vì countdown", () => {
    withI18n(<ResendCountdown seconds={2} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("resend-button")).toBeInTheDocument();
    expect(screen.queryByTestId("resend-countdown")).not.toBeInTheDocument();
  });

  it("click Resend button gọi onResend callback", () => {
    const onResend = vi.fn();
    render(
      <TestWrapper>
        <ResendCountdown seconds={0} onResend={onResend} />
      </TestWrapper>
    );
    screen.getByTestId("resend-button").click();
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it("isPending=true: button bị disable", () => {
    render(
      <TestWrapper>
        <ResendCountdown seconds={0} isPending />
      </TestWrapper>
    );
    const button = screen.getByTestId("resend-button") as HTMLButtonElement;
    expect(button).toBeDisabled();
  });

  it("reset countdown khi seconds prop thay đổi", () => {
    const { rerender } = render(
      <TestWrapper>
        <ResendCountdown seconds={60} />
      </TestWrapper>
    );
    // Tua 5s
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("resend-countdown-timer")).toHaveTextContent("00:55");
    // Parent set lại seconds=60 → reset
    rerender(
      <TestWrapper>
        <ResendCountdown seconds={60} resetKey="reset-1" />
      </TestWrapper>
    );
    expect(screen.getByTestId("resend-countdown-timer")).toHaveTextContent("01:00");
  });

  it("cleanup interval khi unmount (không lỗi)", () => {
    const { unmount } = withI18n(<ResendCountdown seconds={10} />);
    expect(() => unmount()).not.toThrow();
    // Advance sau unmount không lỗi
    act(() => {
      vi.advanceTimersByTime(15000);
    });
  });
});
