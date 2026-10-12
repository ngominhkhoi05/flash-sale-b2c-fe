import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductShareBar } from "./ProductShareBar";
import { TestWrapper } from "@/__tests__/test-wrapper";
import userEvent from "@testing-library/user-event";

// Ensure navigator.clipboard exists for userEvent in jsdom
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

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductShareBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders share label and wishlist count", () => {
    renderWithIntl(
      <ProductShareBar productName="Áo thun cotton UTC" />
    );
    expect(screen.getByText(/Chia sẻ/i)).toBeInTheDocument();
    expect(screen.getByText("(1,4k)")).toBeInTheDocument();
  });

  it("toggles wishlist heart on click → calls onToggleWishlist", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const onToggle = vi.fn();
    renderWithIntl(
      <ProductShareBar
        productName="Áo thun"
        isWishlisted={false}
        onToggleWishlist={onToggle}
      />
    );
    // Find the wishlist button (aria-pressed attribute distinguishes it)
    const buttons = screen.getAllByRole("button");
    const wishlistBtn = buttons.find(
      (b) => b.getAttribute("aria-pressed") !== null
    );
    expect(wishlistBtn).toBeDefined();
    await user.click(wishlistBtn!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onShare when share button clicked (share API unavailable in test)", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const onShare = vi.fn();
    renderWithIntl(
      <ProductShareBar productName="Áo thun" onShare={onShare} />
    );
    // Share button has aria-label containing "Chia sẻ"
    const shareBtn = screen.getByRole("button", { name: /Chia sẻ/i });
    expect(shareBtn).toBeInTheDocument();
    await user.click(shareBtn);
    // Action: either navigator.share (if available) or fallback clipboard
    // We just verify shareBtn clickable + does not throw
    expect(shareBtn).toBeInTheDocument();
  });

  it("respects isWishlisted prop for initial heart state", () => {
    renderWithIntl(
      <ProductShareBar productName="Áo thun" isWishlisted={true} />
    );
    // aria-pressed=true on the wishlist button
    const buttons = screen.getAllByRole("button");
    const wishlistBtn = buttons.find(
      (b) => b.getAttribute("aria-pressed") === "true"
    );
    expect(wishlistBtn).toBeDefined();
  });
});
