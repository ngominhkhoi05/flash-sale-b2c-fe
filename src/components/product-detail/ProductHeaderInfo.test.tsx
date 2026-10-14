import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductHeaderInfo } from "./ProductHeaderInfo";
import { TestWrapper } from "@/__tests__/test-wrapper";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductHeaderInfo", () => {
  it("renders the product title in an h1", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{ favorite: true, official: true, sku: "UTC-TS-001" }}
        title="Áo thun unisex cotton UTC Basic"
        ratingAvg={4.8}
        ratingCount={326}
        soldCount={2100}
        questionCount={76}
      />
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Áo thun unisex cotton UTC Basic");
  });

  it("renders favorite badge when tag.favorite=true", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{ favorite: true }}
        title="X"
        ratingAvg={4.5}
        ratingCount={10}
        soldCount={5}
        questionCount={1}
      />
    );
    expect(screen.getByText(/YÊU THÍCH/)).toBeInTheDocument();
  });

  it("does not render favorite badge when tag.favorite=false", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{ favorite: false }}
        title="X"
        ratingAvg={4.5}
        ratingCount={10}
        soldCount={5}
        questionCount={1}
      />
    );
    expect(screen.queryByText(/YÊU THÍCH/)).not.toBeInTheDocument();
  });

  it("renders official chip when tag.official=true", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{ official: true }}
        title="X"
        ratingAvg={4.5}
        ratingCount={10}
        soldCount={5}
        questionCount={1}
      />
    );
    expect(screen.getByText(/Chính Hãng/)).toBeInTheDocument();
  });

  it("renders SKU label when tag.sku provided", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{ sku: "UTC-TS-001" }}
        title="X"
        ratingAvg={4.5}
        ratingCount={10}
        soldCount={5}
        questionCount={1}
      />
    );
    expect(screen.getByText(/UTC-TS-001/)).toBeInTheDocument();
  });

  it("renders rating + count link", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{}}
        title="X"
        ratingAvg={4.8}
        ratingCount={326}
        soldCount={2100}
        questionCount={76}
      />
    );
    expect(screen.getByText("4.8")).toBeInTheDocument();
    const reviewLink = screen.getByRole("link", { name: /\(326 đánh giá\)/ });
    expect(reviewLink).toHaveAttribute("href", "#reviews-section");
  });

  it("formats sold count with k suffix (2,1k for 2100)", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{}}
        title="X"
        ratingAvg={4.5}
        ratingCount={10}
        soldCount={2100}
        questionCount={1}
      />
    );
    expect(screen.getByText(/2,1k/)).toBeInTheDocument();
  });

  it("renders question count", () => {
    renderWithIntl(
      <ProductHeaderInfo
        tags={{}}
        title="X"
        ratingAvg={4.5}
        ratingCount={10}
        soldCount={5}
        questionCount={76}
      />
    );
    expect(screen.getByText(/76 câu hỏi/)).toBeInTheDocument();
  });
});

describe("ProductHeaderInfo – defensive guards (BE nullable)", () => {
  const baseProps = {
    tags: {},
    title: "Áo thun unisex cotton",
    ratingAvg: 4.8,
    ratingCount: 326,
    soldCount: 2100,
    questionCount: 76,
  };

  it("does NOT crash when soldCount is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductHeaderInfo
          {...baseProps}
          soldCount={undefined as unknown as number}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when soldCount is null (BE explicit null)", () => {
    expect(() =>
      renderWithIntl(
        <ProductHeaderInfo
          {...baseProps}
          soldCount={null as unknown as number}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when ratingCount is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductHeaderInfo
          {...baseProps}
          ratingCount={undefined as unknown as number}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when questionCount is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductHeaderInfo
          {...baseProps}
          questionCount={undefined as unknown as number}
        />,
      ),
    ).not.toThrow();
  });
});
