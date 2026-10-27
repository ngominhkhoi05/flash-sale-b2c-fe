import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServerConnectionError } from "./ServerConnectionError";

describe("ServerConnectionError component", () => {
  it("renders default title and message", () => {
    render(<ServerConnectionError />);

    expect(screen.getByText("Không thể kết nối đến máy chủ")).toBeDefined();
    expect(
      screen.getByText(
        "Mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng kiểm tra lại kết nối internet của bạn và thử lại."
      )
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /về trang chủ/i })).toBeDefined();
  });

  it("calls onRetry callback when click Thử lại", () => {
    const onRetryMock = vi.fn();
    render(<ServerConnectionError onRetry={onRetryMock} />);

    const retryBtn = screen.getByRole("button", { name: /thử lại/i });
    fireEvent.click(retryBtn);

    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("renders custom title and message", () => {
    render(
      <ServerConnectionError
        title="Máy chủ đang bảo trì"
        message="Vui lòng quay lại sau 15 phút."
      />
    );

    expect(screen.getByText("Máy chủ đang bảo trì")).toBeDefined();
    expect(screen.getByText("Vui lòng quay lại sau 15 phút.")).toBeDefined();
  });

  it("hides home button when showHomeButton = false", () => {
    render(<ServerConnectionError showHomeButton={false} />);

    expect(screen.queryByRole("link", { name: /về trang chủ/i })).toBeNull();
  });
});
