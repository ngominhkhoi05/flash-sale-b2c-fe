import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StorefrontError from "./error";

describe("StorefrontError boundary component", () => {
  it("renders ServerConnectionError when error is network related", () => {
    const error = new Error("Mất kết nối mạng hoặc máy chủ không phản hồi: fetch failed");
    const resetMock = vi.fn();

    render(<StorefrontError error={error} reset={resetMock} />);

    expect(screen.getByText("Không thể kết nối đến máy chủ")).toBeDefined();
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /thử lại/i }));
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it("renders generic error state for non-network errors", () => {
    const error = new Error("Something went wrong");
    const resetMock = vi.fn();

    render(<StorefrontError error={error} reset={resetMock} />);

    expect(screen.getByText("Đã có sự cố xảy ra")).toBeDefined();
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /về trang chủ/i })).toBeDefined();
  });
});
