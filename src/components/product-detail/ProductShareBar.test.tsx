import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductShareBar } from "./ProductShareBar";
import { TestWrapper } from "@/__tests__/test-wrapper";
import userEvent from "@testing-library/user-event";

if (!globalThis.navigator) {
  Object.defineProperty(globalThis, "navigator", {
    value: {},
    configurable: true,
  });
}
if (!globalThis.navigator.clipboard) {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
}
if (!globalThis.alert) {
  Object.defineProperty(globalThis, "alert", {
    value: vi.fn(),
    configurable: true,
  });
}

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductShareBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders share label, 3 share buttons, wishlist with liked count", () => {
    renderWithIntl(
      <ProductShareBar
        likedCount="(1,4k)"
      />,
    );
    // Share label
    expect(screen.getByText(/Chia sẻ/i)).toBeInTheDocument();
    // Wishlist liked count text "(1,4k)" appears inside the right section
    expect(screen.getByText(/\(1,4k\)/)).toBeInTheDocument();
    // "Đã thích" label
    expect(screen.getByText(/Đã thích/i)).toBeInTheDocument();
  });

  it("clicking copy-link button writes to clipboard", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const writeSpy = vi.spyOn(navigator.clipboard, "writeText");
    renderWithIntl(
      <ProductShareBar likedCount="(1,4k)" />,
    );
    const linkBtn = screen.getByLabelText(/Sao chép link/i);
    expect(linkBtn).toBeInTheDocument();
    await user.click(linkBtn);
    expect(writeSpy).toHaveBeenCalled();
  });

  it("renders 3 share icon buttons (Facebook, Messenger, Copy link)", () => {
    renderWithIntl(
      <ProductShareBar likedCount="(1,4k)" />,
    );
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Messenger")).toBeInTheDocument();
    expect(screen.getByLabelText(/Sao chép link/i)).toBeInTheDocument();
  });
});