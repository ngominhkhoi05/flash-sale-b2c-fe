import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductDescriptionCard } from "./ProductDescriptionCard";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { ProductFeature, SizeChartRow } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const RICH = [
  "Áo thun basic unisex <strong>UTC Basic Cotton Compact</strong> là sản phẩm chủ lực.",
  "Thiết kế form dáng <em>Regular Fit</em> hiện đại chuẩn form cơ thể người trẻ Việt.",
];

const FEATURES: ProductFeature[] = [
  {
    icon: "air",
    iconBgClass: "bg-primary-fixed",
    iconTextClass: "text-primary",
    title: "Thoáng Khí Tối Đa",
    description: "Cấu trúc dệt mắt lưới siêu nhỏ giúp lưu thông khí.",
  },
  {
    icon: "all_inclusive",
    iconBgClass: "bg-secondary-container",
    iconTextClass: "text-on-secondary-container",
    title: "Co Giãn 4 Chiều",
    description: "Độ đàn hồi tự nhiên nhờ kỹ thuật xe sợi xoắn kép.",
  },
  {
    icon: "layers",
    iconBgClass: "bg-surface-container-highest",
    iconTextClass: "text-on-surface",
    title: "Bo Cổ Dệt Gân 3 Lớp",
    description: "Cổ áo bổ sung sợi spandex tăng cường độ đàn hồi.",
  },
];

const SIZE_CHART: SizeChartRow[] = [
  { size: "S", height: "1m50-1m62", weight: "45-55", width: "48", length: "66", isCurrent: false, isOutOfStock: false },
  { size: "M", height: "1m60-1m70", weight: "55-65", width: "50", length: "69", isCurrent: true, isOutOfStock: false },
  { size: "L", height: "1m68-1m78", weight: "65-75", width: "53", length: "72", isCurrent: false, isOutOfStock: false },
  { size: "XL", height: "1m75-1m85", weight: "75-88", width: "56", length: "75", isCurrent: false, isOutOfStock: true },
];

describe("ProductDescriptionCard", () => {
  it("renders card title", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />
    );
    expect(
      screen.getByRole("heading", { name: /Mô Tả Sản Phẩm Chi Tiết/ })
    ).toBeInTheDocument();
  });

  it("renders 2 description paragraphs with HTML", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />
    );
    // First <p> contains <strong>UTC Basic Cotton Compact</strong>
    const strongEl = screen.getByText(/UTC Basic Cotton Compact/);
    expect(strongEl.tagName).toBe("STRONG");
    // Second <p> contains <em>Regular Fit</em>
    const emEl = screen.getByText(/Regular Fit/);
    expect(emEl.tagName).toBe("EM");
  });

  it("renders 3 feature cards", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />
    );
    expect(screen.getByText(/Thoáng Khí Tối Đa/)).toBeInTheDocument();
    expect(screen.getByText(/Co Giãn 4 Chiều/)).toBeInTheDocument();
    expect(screen.getByText(/Bo Cổ Dệt Gân 3 Lớp/)).toBeInTheDocument();
  });

  it("renders size chart with 4 rows", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />
    );
    const rows = screen.getAllByTestId("size-chart-row");
    expect(rows).toHaveLength(4);
  });

  it("applies highlight class to the current size row", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />
    );
    const rows = screen.getAllByTestId("size-chart-row");
    expect(rows[1]).toHaveClass("bg-primary-fixed");
  });

  it("marks OOS row with grayed style", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={RICH}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />
    );
    const rows = screen.getAllByTestId("size-chart-row");
    // Last row is OOS XL
    expect(rows[3]).toHaveClass("text-outline");
    expect(rows[3]).toHaveClass("opacity-60");
  });
});

describe("ProductDescriptionCard – defensive guards (BE nullable)", () => {
  it("does NOT crash when descriptionRich is undefined (BE missing field)", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={undefined as unknown as string[]}
          features={FEATURES}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when descriptionRich is null (BE explicit null)", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={null as unknown as string[]}
          features={FEATURES}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when descriptionRich is a single string (BE joined)", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={"Một chuỗi HTML duy nhất" as unknown as string[]}
          features={FEATURES}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
    // Normalize: string → wrap thành array, render 1 paragraph.
    expect(screen.getByText(/Một chuỗi HTML duy nhất/)).toBeInTheDocument();
  });

  it("renders 2 paragraphs when descriptionRich is an array of 2 strings", () => {
    renderWithIntl(
      <ProductDescriptionCard
        descriptionRich={["Đoạn 1", "Đoạn 2"]}
        features={FEATURES}
        sizeChart={SIZE_CHART}
      />,
    );
    expect(screen.getByText(/Đoạn 1/)).toBeInTheDocument();
    expect(screen.getByText(/Đoạn 2/)).toBeInTheDocument();
  });

  it("does NOT crash when features is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={RICH}
          features={undefined as unknown as ProductFeature[]}
          sizeChart={SIZE_CHART}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when sizeChart is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductDescriptionCard
          descriptionRich={RICH}
          features={FEATURES}
          sizeChart={undefined as unknown as SizeChartRow[]}
        />,
      ),
    ).not.toThrow();
  });
});
