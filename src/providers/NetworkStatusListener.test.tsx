import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { NetworkStatusListener } from "./NetworkStatusListener";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("NetworkStatusListener component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers offline and online event listeners", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<NetworkStatusListener />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );
  });

  it("shows toast.error when browser goes offline", () => {
    render(<NetworkStatusListener />);

    window.dispatchEvent(new Event("offline"));

    expect(toast.error).toHaveBeenCalledWith(
      "Mất kết nối mạng! Không thể kết nối đến máy chủ.",
      expect.objectContaining({ id: "network-status" })
    );
  });

  it("shows toast.success when browser comes back online", () => {
    render(<NetworkStatusListener />);

    // First trigger offline then online
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));

    expect(toast.success).toHaveBeenCalledWith(
      "Đã khôi phục kết nối mạng internet!",
      expect.objectContaining({ id: "network-status" })
    );
  });
});
