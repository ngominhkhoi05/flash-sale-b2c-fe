"use client";

import React from "react";
import { ReportedReview } from "@/types/permissions";

interface ReviewModerationTabProps {
  reviews: ReportedReview[];
  onModerate: (review: ReportedReview, action: "keep" | "hide" | "restore") => void;
}

export function ReviewModerationTab({
  reviews,
  onModerate,
}: ReviewModerationTabProps) {
  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <section className="flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-tertiary/10 text-tertiary">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
          </span>
          <h2 className="font-headline-md text-base font-bold text-on-surface">
            Hàng đợi kiểm duyệt đánh giá (Content Moderation Queue)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full font-label-sm text-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold">
            {pendingCount} mục cần xử lý
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md">
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-secondary bg-surface-container-lowest rounded-xl border border-outline-variant/20">
            Không có đánh giá nào bị báo cáo vi phạm trong hàng đợi
          </div>
        ) : (
          reviews.map((review) => {
            const isHidden = review.status === "HIDDEN";
            const isResolved = review.status === "RESOLVED";

            return (
              <div
                key={review.id}
                className={`rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-space-md relative overflow-hidden border transition-all ${
                  isHidden
                    ? "bg-surface-container-lowest/70 border-outline-variant/20 opacity-80"
                    : isResolved
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-surface-container-lowest border-outline-variant/30"
                }`}
              >
                <div className="flex items-start gap-space-md flex-1">
                  {/* Reviewer Avatar & ID */}
                  <div className="flex flex-col items-center gap-1 min-w-[72px]">
                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed font-bold text-base">
                      {review.reviewerInitials}
                    </div>
                    <span className="font-body-sm text-xs font-semibold text-on-surface text-center">
                      {review.reviewerName}
                    </span>
                    <span className="font-label-sm text-[11px] text-secondary">
                      Buyer ID #{review.reviewerId}
                    </span>
                  </div>

                  {/* Review Content Body */}
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Star Rating */}
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`material-symbols-outlined text-[16px] ${
                              i < review.rating
                                ? "fill-current"
                                : "text-outline-variant"
                            }`}
                            style={{
                              fontVariationSettings:
                                i < review.rating ? "'FILL' 1" : "'FILL' 0",
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>

                      <span className="font-label-sm text-xs text-secondary">
                        Đăng lúc: {review.createdAt}
                      </span>

                      {/* Status / Report Badge */}
                      {review.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <span className="material-symbols-outlined text-[13px]">
                            report
                          </span>
                          Bị báo cáo: {review.reportCount} lượt ({review.reportReason})
                        </span>
                      ) : review.status === "HIDDEN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-xs font-semibold bg-surface-container text-secondary">
                          <span className="material-symbols-outlined text-[13px]">
                            block
                          </span>
                          Đã ẩn hiển thị
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                          <span className="material-symbols-outlined text-[13px]">
                            check_circle
                          </span>
                          Đã giữ lại hợp lệ
                        </span>
                      )}
                    </div>

                    {/* Comment Text */}
                    <p
                      className={`font-body-md text-sm p-3 rounded-lg leading-relaxed ${
                        isHidden
                          ? "bg-surface-container-low/30 text-secondary italic"
                          : "bg-surface-container-low/60 text-on-surface font-medium"
                      }`}
                    >
                      &quot;{review.commentText}&quot;
                    </p>

                    {/* Product Anchor with Thumbnail */}
                    <div className="flex items-center gap-3 pt-1">
                      {review.productImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.productImageUrl}
                          alt={review.productName}
                          className="w-10 h-10 rounded-lg object-cover bg-surface-container border border-outline-variant/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-[20px]">
                            inventory_2
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-body-sm text-xs font-semibold text-on-surface">
                          {review.productName}
                        </span>
                        <span className="font-label-sm text-[11px] text-secondary">
                          Gian hàng:{" "}
                          <strong className="text-primary font-semibold">
                            {review.storeName}
                          </strong>
                          {review.isMall && (
                            <span className="ml-1 px-1 py-0.2 rounded bg-primary text-on-primary text-[9px] font-bold uppercase">
                              Mall
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {review.moderatedBy && (
                      <span className="text-[11px] text-secondary">
                        Xử lý bởi: {review.moderatedBy}
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center md:flex-col gap-2 min-w-[150px] self-end md:self-center">
                  {review.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onModerate(review, "keep")}
                        className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-xs font-semibold transition-all border border-outline-variant/30"
                      >
                        Giữ lại đánh giá
                      </button>
                      <button
                        type="button"
                        onClick={() => onModerate(review, "hide")}
                        className="w-full px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          visibility_off
                        </span>
                        <span>Ẩn đánh giá</span>
                      </button>
                    </>
                  )}

                  {review.status === "HIDDEN" && (
                    <button
                      type="button"
                      onClick={() => onModerate(review, "restore")}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary hover:text-on-surface font-label-sm text-xs font-medium transition-colors border border-outline-variant/30"
                    >
                      Khôi phục hiển thị
                    </button>
                  )}

                  {review.status === "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => onModerate(review, "hide")}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low text-rose-600 hover:bg-rose-50 font-label-sm text-xs font-medium transition-colors border border-rose-200"
                    >
                      Ẩn đánh giá này
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
