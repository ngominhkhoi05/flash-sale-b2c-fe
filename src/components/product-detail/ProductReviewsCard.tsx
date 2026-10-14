/**
 * ProductReviewsCard - Section 18 (Stitch `31bc6af5`).
 *
 * Card with:
 *   - Section heading "Đánh Giá Sản Phẩm"
 *   - Rating overview: rating avg (big number) + 5 stars + total count
 *   - Filter chips: Tất cả, 5 Sao, 4 Sao, 3 Sao, 2 Sao, 1 Sao, Có hình ảnh
 *   - Reviews list: each review shows user avatar (initials), name,
 *     BadgeCheck purchase badge, time ago, star rating, variant info,
 *     content, media thumbnails, optional seller reply
 *   - Pagination: prev/next chevrons + page numbers
 *
 * i18n namespace: `productDetail.reviews.*`.
 */
"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, Store, BadgeCheck, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/features/products";

export interface ProductReviewsCardProps {
  reviews: Review[] | null | undefined;
  /** Defensive: BE có thể trả null. */
  ratingAvg: number | null | undefined;
  ratingCount: number | null | undefined;
  className?: string;
}

function formatTimeAgo(createdAt: string): string {
  const date = new Date(createdAt);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Hôm nay";
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const iconSize = size === "lg" ? "text-lg" : "text-sm";
  return (
    <div
      className="flex items-center gap-1 text-amber-500"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(iconSize, rating >= i ? "fill-current" : "opacity-30")}
          data-testid={`star-${rating >= i ? "filled" : "empty"}-${i}`}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const t = useTranslations("productDetail.reviews");
  const variantLabel = Object.entries(review.variantAttributes)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  // Initials from userDisplayName
  const initials = review.userDisplayName
    .split("_")
    .map((s) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <div className="flex items-start gap-4 rounded-xl bg-surface-container-low p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold",
          review.userAvatarColor,
        )}
      >
        {initials}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-label-lg font-semibold text-on-surface">
              {review.userDisplayName}
            </span>
            {review.isVerifiedPurchase && (
              <span className="flex items-center gap-1 rounded-full bg-secondary-container/40 px-2 py-0.5 text-label-sm font-semibold text-on-secondary-container">
                <BadgeCheck className="text-xs" />
                {t("verified")}
              </span>
            )}
          </div>
          <span className="text-body-sm text-outline">{formatTimeAgo(review.createdAt)}</span>
        </div>
        <StarRating rating={review.rating} />
        {variantLabel && (
          <div className="text-body-sm text-outline">
            Phân loại: <strong className="text-on-surface">{variantLabel}</strong>
          </div>
        )}
        <p className="text-body-md text-on-surface">{review.content}</p>
        {review.mediaUrls && review.mediaUrls.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {review.mediaUrls.map((url, idx) => (
              <div
                key={idx}
                className="h-16 w-16 overflow-hidden rounded-lg bg-surface-container shadow-sm"
              >
                <Image
                  src={url}
                  alt={`Review media ${idx + 1}`}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        {review.sellerReply && (
          <div className="mt-2 flex flex-col gap-1 rounded-lg bg-surface-container p-3 text-body-sm text-on-surface-variant">
            <span className="text-label-md flex items-center gap-1 font-bold text-primary">
              <Store className="text-sm" />
              {t("sellerReply")} ({review.sellerReply.storeName}):
            </span>
            <p>{review.sellerReply.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductReviewsCard({
  reviews,
  ratingAvg,
  ratingCount,
  className,
}: ProductReviewsCardProps) {
  const t = useTranslations("productDetail.reviews");
  const list = Array.isArray(reviews) ? reviews : [];
  const safeRatingAvg = ratingAvg == null ? 0 : ratingAvg;
  const safeRatingCount = ratingCount == null ? 0 : ratingCount;

  if (list.length === 0) {
    return (
      <div
        data-testid="product-reviews-card"
        className={cn(
          "flex flex-col gap-6 rounded-2xl bg-surface-container-lowest p-6 shadow-sm",
          className,
        )}
      >
        <h2 className="text-headline-md flex items-center gap-2 font-bold text-on-surface">
          <span className="inline-block h-6 w-1.5 rounded-full bg-primary" />
          {t("title")}
        </h2>
        <p className="text-body-md text-outline">Chưa có đánh giá nào cho sản phẩm này.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="product-reviews-card"
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-surface-container-lowest p-6 shadow-sm",
        className,
      )}
    >
      <h2 className="text-headline-md flex items-center gap-2 font-bold text-on-surface">
        <span className="inline-block h-6 w-1.5 rounded-full bg-primary" />
        {t("title")}
      </h2>

      {/* Rating Overview */}
      <div className="flex flex-col items-center gap-6 rounded-xl bg-surface-container-low p-5 md:flex-row">
        <div className="flex shrink-0 flex-col items-center justify-center border-outline-variant/30 pr-0 text-center md:border-r md:pr-6">
          <span className="text-display-lg text-4xl font-bold text-primary">
            {safeRatingAvg.toFixed(1)}
          </span>
          <StarRating rating={Math.round(safeRatingAvg)} size="lg" />
          <span className="text-label-sm text-outline">{safeRatingCount} lượt đánh giá</span>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-surface-container-lowest px-3.5 py-1.5 text-label-sm font-bold text-primary shadow-sm outline outline-2 outline-primary"
          >
            Tất cả ({safeRatingCount})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              className="rounded-lg bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
            >
              {star} Sao
            </button>
          ))}
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
          >
            <Camera className="text-sm" />
            Có hình ảnh / video
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-6">
        {list.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center gap-2 py-4">
        <button
          type="button"
          aria-label={t("pagination.prev")}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <ChevronLeft className="text-lg" />
        </button>
        {[1, 2, 3, 4].map((page, idx) => (
          <button
            key={page}
            type="button"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-label-md transition-colors",
              idx === 0
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high",
            )}
          >
            {page}
          </button>
        ))}
        <span className="flex h-10 w-10 items-center justify-center text-label-md text-outline">
          ...
        </span>
        <button
          type="button"
          aria-label={t("pagination.next")}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <ChevronRight className="text-lg" />
        </button>
      </div>
    </div>
  );
}
