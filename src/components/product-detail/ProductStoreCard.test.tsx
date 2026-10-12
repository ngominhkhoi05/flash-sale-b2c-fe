import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductStoreCard } from "./ProductStoreCard";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { StoreProfile } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const STORE: StoreProfile = {
  id: 1,
  name: "UTC Fashion Official",
  initials: "UTC",
  initialsBgClass: "bg-primary text-on-primary",
  isOfficial: true,
  ratingAvg: 4.9,
  ratingCount: 42500,
  productCount: 128,
  productCountUnit: "mẫu",
  responseRate: 99,
  responseTimeLabel: "Vài phút",
  joinedAt: "2024-10-12T00:00:00Z",
  lastActiveLabel: "Online 5 phút trước",
};

describe("ProductStoreCard", () => {
  it("renders store name", () => {
    renderWithIntl(<ProductStoreCard store={STORE} />);
    expect(
      screen.getByRole("heading", { name: /UTC Fashion Official/ })
    ).toBeInTheDocument();
  });

  it("renders store initials (UTC)", () => {
    const { container } = renderWithIntl(<ProductStoreCard store={STORE} />);
    // Initials displayed in avatar circle
    expect(container.textContent).toContain("UTC");
    // Initials appear inside avatar (rendered as text in a div)
    const avatar = container.querySelector('[data-testid="store-initials"]');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent("UTC");
  });

  it("renders Mall badge", () => {
    renderWithIntl(<ProductStoreCard store={STORE} />);
    expect(screen.getByText("Mall")).toBeInTheDocument();
  });

  it("renders Official Mall badge when store.isOfficial=true", () => {
    renderWithIntl(<ProductStoreCard store={STORE} />);
    expect(screen.getByText(/Official Mall/)).toBeInTheDocument();
  });

  it("renders 4 stat columns", () => {
    renderWithIntl(<ProductStoreCard store={STORE} />);
    // Shop rating
    expect(screen.getByText(/Đánh Giá Shop/)).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    // Products
    expect(screen.getByText(/Sản Phẩm/)).toBeInTheDocument();
    expect(screen.getByText(/128/)).toBeInTheDocument();
    // Response rate
    expect(screen.getByText(/Tỉ Lệ Phản Hồi/)).toBeInTheDocument();
    expect(screen.getByText(/99%/)).toBeInTheDocument();
    // Joined
    expect(screen.getByText(/Tham Gia Sàn/)).toBeInTheDocument();
    expect(screen.getByText(/2 năm/)).toBeInTheDocument();
  });

  it("renders 'Xem Shop' + 'Chat ngay' buttons", () => {
    renderWithIntl(<ProductStoreCard store={STORE} />);
    expect(
      screen.getByRole("button", { name: /Xem Shop/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Chat ngay/ })
    ).toBeInTheDocument();
  });

  it("renders online status text from store.lastActiveLabel", () => {
    renderWithIntl(<ProductStoreCard store={STORE} />);
    expect(screen.getByText(/Online 5 phút trước/)).toBeInTheDocument();
  });
});
