import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductDescriptionCard } from "./ProductDescriptionCard";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { DescriptionRichDto, SizeChartDto } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const RICH: DescriptionRichDto = {
  intro: "Áo thun basic unisex UTC Basic Cotton Compact là sản phẩm chủ lực.",
  highlights: [
    "Thoáng Khí Tối Đa",
    "Co Giãn 4 Chiều",
    "Bo Cổ Dệt Gân 3 Lớp",
  ],
  paragraphs: [
    "Thiết kế form dáng Regular Fit hiện đại chuẩn form cơ thể người trẻ Việt.",
    "Chất liệu cotton compact 220gsm mềm mại, bền màu sau nhiều lần giặt.",
  ],
};

const FEATURES: string[] = [
  "Cấu trúc dệt mắt lưới siêu nhỏ giúp lưu thông khí.",
  "Độ đàn hồi tự nhiên nhờ kỹ thuật xe sợi xoắn kép.",
  "Cổ áo bổ sung sợi spandex tăng cường độ đàn hồi.",
];

const SIZE_CHART: SizeChartDto = {
  large: { width_cm: 56, height_cm: 75 },
  standard: { width_cm: 50, height_cm: 69 },
};

describe("ProductDescriptionCard", () => {
  it("renders card title", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Mô Tả Sản Phẩm Chi Tiết/ }),
    ).toBeInTheDocument();
  });

  it("renders intro paragraph text", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    const intro = screen.getByTestId("description-intro");
    expect(intro).toHaveTextContent(/UTC Basic Cotton Compact/);
  });

  it("renders 3 highlight bullets", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    const list = screen.getByTestId("description-highlights");
    expect(list.querySelectorAll("li")).toHaveLength(3);
  });

  it("renders 2 description paragraphs", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    const paraContainer = screen.getByTestId("description-paragraphs");
    expect(paraContainer.querySelectorAll("p")).toHaveLength(2);
    expect(paraContainer).toHaveTextContent(/Regular Fit/);
  });

  it("renders 3 feature items as string list", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    const featureList = screen.getByTestId("feature-list");
    expect(featureList.querySelectorAll('[data-testid="feature-item"]')).toHaveLength(3);
  });

  it("renders size chart with 2 rows (standard + large)", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    const rows = screen.getAllByTestId("size-chart-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute("data-row", "standard");
    expect(rows[1]).toHaveAttribute("data-row", "large");
  });

  it("renders size chart values (BE shape)", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    // standard: 50 cm width, 69 cm height
    expect(screen.getByText("50 cm")).toBeInTheDocument();
    expect(screen.getByText("69 cm")).toBeInTheDocument();
    // large: 56 cm width, 75 cm height
    expect(screen.getByText("56 cm")).toBeInTheDocument();
    expect(screen.getByText("75 cm")).toBeInTheDocument();
  });
});

describe("ProductDescriptionCard – defensive guards (BE nullable)", () => {
  it("does NOT crash when descriptionRich is undefined", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={undefined as unknown as DescriptionRichDto}
          features={FEATURES}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when descriptionRich is null", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={null as unknown as DescriptionRichDto}
          features={FEATURES}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when features is undefined", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={RICH}
          features={undefined as unknown as string[]}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when features is null", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={RICH}
          features={null as unknown as string[]}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when sizeChart is undefined", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={RICH}
          features={FEATURES}
          sizeChart={undefined as unknown as SizeChartDto}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when sizeChart is null", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={RICH}
          features={FEATURES}
          sizeChart={null as unknown as SizeChartDto}
        />,
      ),
    ).not.toThrow();
  });
});