import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductReviewsCard } from "@/components/product-detail/ProductReviewsCard";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { Review } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    userId: 101,
    userDisplayName: "nguyenvan_92",
    userAvatarColor: "bg-primary-fixed text-primary",
    rating: 5,
    content:
      "Áo giao cực kỳ đẹp luôn mà giá lại mềm! Chất vải cotton dày dặn 220gsm săn rất mát tay mà mặc lên mát mặt không bị bí bách. Form áo chuẩn mẫu, giặt lần đầu nước lạnh không hề co rút hay xảy láng. Rất hài lòng với chất lượng của UTC Fashion!",
    variantSku: "UTC-TS-001-WHT-L",
    variantAttributes: { "Màu Sắc": "Trắng", "Kích Thước": "L" },
    mediaUrls: [
      "https://lh3.googleusercontent.com/photo1",
      "https://lh3.googleusercontent.com/photo2",
      "https://lh3.googleusercontent.com/photo3",
    ],
    sellerReply: {
      content:
        "Dạ UTC chân thành cảm ơn bạn nguyenvan_92 đã tin tưởng đồng hành sản phẩm của shop ạ! Chắc bạn luôn tin tưởng và có những trải nghiệm thật tuyệt vời cùng chiếc áo thun này nhé!",
      storeName: "UTC Fashion",
      repliedAt: "2026-10-10T10:00:00Z",
    },
    isVerifiedPurchase: true,
    createdAt: "2026-10-10T08:00:00Z",
  },
  {
    id: 2,
    userId: 102,
    userDisplayName: "tran_thanh_huyen",
    userAvatarColor: "bg-secondary-fixed text-secondary",
    rating: 5,
    content:
      "Đóng gói cực chu đáo 2 lớp kèm túi zip xịn xò, máy hít ra thêm phụ kiện mới nước hoa nhẹ nhàng. Màu đen tuyền rất sang, không bị phai màu. 10 điểm cho sự chỉn chu của shop.",
    variantSku: "UTC-TS-001-DEN-M",
    variantAttributes: { "Màu Sắc": "Đen", "Kích Thước": "M" },
    mediaUrls: [
      "https://lh3.googleusercontent.com/photo4",
      "https://lh3.googleusercontent.com/photo5",
    ],
    sellerReply: null,
    isVerifiedPurchase: true,
    createdAt: "2026-10-07T08:00:00Z",
  },
  {
    id: 3,
    userId: 103,
    userDisplayName: "minh_vu_tech",
    userAvatarColor: "bg-surface-container text-on-surface",
    rating: 4,
    content:
      "Màu vàng pastel ngoài trời đẹp hơn trong ảnh web nhiều nha, mặc sáng da tắm nắng lắm. Trừ 1 sao do bưu điện vận chuyển giao trễ. hơn dự kiến nửa ngày, còn chất lượng sản phẩm thì rất okela.",
    variantSku: "UTC-TS-001-VANG-S",
    variantAttributes: { "Màu Sắc": "Vàng nhạt", "Kích Thước": "S" },
    mediaUrls: [],
    sellerReply: null,
    isVerifiedPurchase: true,
    createdAt: "2026-10-05T08:00:00Z",
  },
];

describe("ProductReviewsCard", () => {
  const defaultProps = {
    reviews: MOCK_REVIEWS,
    ratingAvg: 4.8,
    ratingCount: 326,
  };

  test("renders rating overview", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    expect(screen.getByText("4.8")).toBeInTheDocument();
    // "326" appears in both "326 lượt đánh giá" and "Tất cả (326)" - use getAllByText
    expect(screen.getAllByText(/326/).length).toBeGreaterThan(0);
    expect(screen.getByTestId("product-reviews-card")).toBeInTheDocument();
  });

  test("renders filter chips", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    // "Tất cả" filter should be active by default
    expect(screen.getByRole("button", { name: /tất cả/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /5 sao/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /có hình ảnh/i })).toBeInTheDocument();
  });

  test("renders reviews list", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    expect(screen.getByText("nguyenvan_92")).toBeInTheDocument();
    expect(screen.getByText("tran_thanh_huyen")).toBeInTheDocument();
    expect(screen.getByText("minh_vu_tech")).toBeInTheDocument();
  });

  test("renders verified purchase badge", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    expect(screen.getAllByText(/đã mua hàng tại/i)).toHaveLength(3);
  });

  test("renders seller reply when present", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    // First review has seller reply
    expect(screen.getByText(/dạ utc chân thành/i)).toBeInTheDocument();
  });

  test("renders review media thumbnails", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    // First review has 3 media URLs
    const thumbnails = screen.getAllByRole("img");
    expect(thumbnails.length).toBeGreaterThan(0);
  });

  test("renders pagination controls", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    // Should have prev/next navigation
    const prevBtn = screen.getByRole("button", { name: /trước/i });
    const nextBtn = screen.getByRole("button", { name: /sau/i });
    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
  });

  test("renders section heading", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  test("renders empty state when no reviews", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} reviews={[]} ratingAvg={0} ratingCount={0} />);
    expect(screen.getByTestId("product-reviews-card")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    renderWithIntl(<ProductReviewsCard {...defaultProps} className="my-custom-class" />);
    expect(screen.getByTestId("product-reviews-card")).toHaveClass("my-custom-class");
  });
});

describe("ProductReviewsCard – defensive guards (BE nullable)", () => {
  const baseProps = {
    reviews: MOCK_REVIEWS,
    ratingAvg: 4.8,
    ratingCount: 326,
  };

  test("does NOT crash when reviews is undefined (BE missing field)", () => {
    expect(() =>
      renderWithIntl(
        <ProductReviewsCard
          {...baseProps}
          reviews={undefined as unknown as Review[]}
        />,
      ),
    ).not.toThrow();
  });

  test("does NOT crash when reviews is null (BE explicit null)", () => {
    expect(() =>
      renderWithIntl(
        <ProductReviewsCard
          {...baseProps}
          reviews={null as unknown as Review[]}
        />,
      ),
    ).not.toThrow();
  });

  test("does NOT crash when ratingAvg is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductReviewsCard
          {...baseProps}
          ratingAvg={undefined as unknown as number}
        />,
      ),
    ).not.toThrow();
  });

  test("does NOT crash when ratingCount is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductReviewsCard
          {...baseProps}
          ratingCount={undefined as unknown as number}
        />,
      ),
    ).not.toThrow();
  });

  test("does NOT crash when review.mediaUrls is undefined (BE partial)", () => {
    const reviewsMissingMedia = [
      {
        ...MOCK_REVIEWS[0],
        mediaUrls: undefined as unknown as string[],
      },
    ];
    expect(() =>
      renderWithIntl(
        <ProductReviewsCard
          reviews={reviewsMissingMedia}
          ratingAvg={5}
          ratingCount={1}
        />,
      ),
    ).not.toThrow();
  });
});
