import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGallery } from "./ProductGallery";
import { TestWrapper } from "@/__tests__/test-wrapper";
import userEvent from "@testing-library/user-event";
import type { ProductImage } from "@/features/products";

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
  it("renders main image (defaults to primary)", () => {
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />
    );
    // Use container query (testid only on main image element)
    const mainImg = document.querySelector('[data-testid="gallery-main-image"]');
    expect(mainImg).toBeInTheDocument();
    expect(mainImg).toHaveAttribute("src", "https://example.com/img1.jpg");
  });

  it("renders 3 thumbnails (role=listitem buttons)", () => {
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />
    );
    // role="listitem" buttons are the thumbnails
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });

  it("swaps main image on thumbnail click", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />
    );
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
    await user.click(items[1]);
    // Main image src should now be img2
    const mainImg = document.querySelector('[data-testid="gallery-main-image"]');
    expect(mainImg).toHaveAttribute("src", "https://example.com/img2.jpg");
  });

  it("has zoom button that opens lightbox", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />
    );
    // Zoom button has aria-label "Phóng to" (exact)
    const zoomBtn = screen.getByLabelText("Phóng to");
    expect(zoomBtn).toBeInTheDocument();
    await user.click(zoomBtn);
    // Lightbox renders a dialog
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes lightbox on close button click", async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithIntl(
      <ProductGallery images={MOCK_IMAGES} productName="Áo thun" />
    );
    const zoomBtn = screen.getByLabelText("Phóng to");
    await user.click(zoomBtn);
    const closeBtn = screen.getByLabelText("Close");
    await user.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
