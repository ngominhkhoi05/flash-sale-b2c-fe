import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGallery } from "./ProductGallery";
import { TestWrapper } from "@/__tests__/test-wrapper";
import userEvent from "@testing-library/user-event";
import type { ProductImage } from "@/features/products";

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

const MOCK_IMAGES: ProductImage[] = [
  {
    id: 1,
    url: "https://example.com/img1.jpg",
    alt: "Hình 1",
    displayOrder: 0,
    isPrimary: true,
  },
  {
    id: 2,
    url: "https://example.com/img2.jpg",
    alt: "Hình 2",
    displayOrder: 1,
    isPrimary: false,
  },
  {
    id: 3,
    url: "https://example.com/img3.jpg",
    alt: "Hình 3",
    displayOrder: 2,
    isPrimary: false,
  },
];

describe("ProductGallery", () => {
  it("renders main image (defaults to primary) and 3 thumbnails", () => {
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />,
    );
    const mainImg = document.querySelector(
      '[data-testid="gallery-main-image"]',
    );
    expect(mainImg).toBeInTheDocument();
    // Initial image is img1 (primary)
    expect(mainImg).toHaveAttribute("src", "https://example.com/img1.jpg");
    // 3 thumbnails (rendered as listitem inside a list)
    const thumbButtons = screen.getAllByRole("listitem");
    expect(thumbButtons.length).toBe(3);
  });

  it("swaps main image src when a thumbnail is clicked", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />,
    );
    // Thumbs are accessible via aria-label "Hình N"
    const thumb2 = screen.getByLabelText("Hình 2");
    await user.click(thumb2);
    const mainImg = document.querySelector(
      '[data-testid="gallery-main-image"]',
    );
    expect(mainImg).toHaveAttribute("src", "https://example.com/img2.jpg");
  });

  it("opens lightbox when zoom button clicked", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />,
    );
    const zoomBtn = screen.getByLabelText("Phóng to");
    expect(zoomBtn).toBeInTheDocument();
    await user.click(zoomBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes lightbox when close button clicked", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />,
    );
    const zoomBtn = screen.getByLabelText("Phóng to");
    await user.click(zoomBtn);
    const closeBtn = screen.getByLabelText("Close");
    await user.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});