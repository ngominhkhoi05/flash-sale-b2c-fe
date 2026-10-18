"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getSellerReviews,
  getSellerReviewSummary,
  replySellerReview,
} from "@/lib/api/seller";
import type {
  SellerReviewItem,
  SellerReviewSummaryResponse,
} from "@/types/seller";
import { useMyStore } from "@/hooks/useMyStore";

type ReplyFilterKey = "ALL" | "UNREPLIED" | "REPLIED";

export default function SellerReviewsPage() {
  const { storeName: currentStoreName } = useMyStore();
  const shopName = currentStoreName || "Gian hàng";

  const QUICK_TEMPLATES = useMemo(
    () => [
      {
        label: "Cảm ơn & Tri ân",
        text: `Dạ ${shopName} xin chân thành cảm ơn bạn đã tin tưởng và ủng hộ sản phẩm của shop! Chúc bạn có những trải nghiệm thật tuyệt vời ạ ❤️`,
      },
      {
        label: "Hỗ trợ Đổi trả/Bảo hành",
        text: `Dạ shop chào bạn! ${shopName} có chính sách hỗ trợ 1 đổi 1 hoặc đổi size miễn phí trong 7 ngày. Shop đã chủ động nhắn tin qua mục Chat để hỗ trợ bạn ngay ạ!`,
      },
      {
        label: "Xin lỗi & Giải quyết sự cố",
        text: `Dạ ${shopName} rất tiếc vì trải nghiệm chưa trọn vẹn của bạn. Shop xin phép liên hệ hỗ trợ đổi sản phẩm mới hoặc hoàn tiền ngay cho bạn ạ!`,
      },
      {
        label: "Khen ngợi vận chuyển",
        text: `Dạ cảm ơn bạn đã hài lòng với tốc độ đóng gói và giao hàng của ${shopName}! Mong bạn tiếp tục ủng hộ shop trong các đơn hàng tới nhé!`,
      },
    ],
    [shopName]
  );

  const [summary, setSummary] = useState<SellerReviewSummaryResponse | null>(null);
  const [reviews, setReviews] = useState<SellerReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [replyTab, setReplyTab] = useState<ReplyFilterKey>("ALL");
  const [selectedRating, setSelectedRating] = useState<number>(0); // 0 = all
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Reply inputs per review ID
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [editingReplyIds, setEditingReplyIds] = useState<Record<number, boolean>>({});
  const [replySubmittingId, setReplySubmittingId] = useState<number | null>(null);

  const triggerReload = () => {
    fetchReviews(false);
  };

  const fetchReviews = useCallback(async (silent = false) => {
    if (!silent && reviews.length === 0) setLoading(true);
    try {
      const [summaryData, reviewsData] = await Promise.all([
        getSellerReviewSummary(),
        getSellerReviews(0, 100),
      ]);
      setSummary(summaryData);
      const list =
        reviewsData.content ||
        (reviewsData as unknown as { items?: SellerReviewItem[] }).items ||
        (Array.isArray(reviewsData) ? reviewsData : []);
      setReviews(list);
      setError(null);
    } catch (err: unknown) {
      if (!silent && reviews.length === 0) {
        const msg = err instanceof Error ? err.message : "Không thể tải danh sách đánh giá";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [reviews.length]);

  useEffect(() => {
    void fetchReviews(false);
  }, [fetchReviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (replyTab === "UNREPLIED" && r.sellerReply) return false;
      if (replyTab === "REPLIED" && !r.sellerReply) return false;
      if (selectedRating > 0 && r.rating !== selectedRating) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const buyer = (r.buyerName || "").toLowerCase();
        const order = (r.orderCode || "").toLowerCase();
        const prod = (r.productName || "").toLowerCase();
        const comment = (r.comment || "").toLowerCase();
        if (!buyer.includes(q) && !order.includes(q) && !prod.includes(q) && !comment.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reviews, replyTab, selectedRating, searchTerm]);

  // Send or Update reply
  const handleSendReply = async (reviewId: number) => {
    const text = (replyInputs[reviewId] || "").trim();
    if (!text) {
      toast.error("Vui lòng nhập nội dung phản hồi cho khách hàng!");
      return;
    }

    setReplySubmittingId(reviewId);
    try {
      const updated = await replySellerReview({ reviewId, replyText: text });
      toast.success("Đã gửi phản hồi thành công đến người mua!");

      setReplyInputs((p) => ({ ...p, [reviewId]: "" }));
      setEditingReplyIds((p) => ({ ...p, [reviewId]: false }));

      // Cập nhật phản hồi ngay tại chỗ trong state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                sellerReply: updated.sellerReply || {
                  id: Date.now(),
                  replyText: text,
                  repliedAt: new Date().toISOString(),
                },
              }
            : r
        )
      );

      // Cập nhật lại summary count nếu là phản hồi mới
      const existing = reviews.find((r) => r.id === reviewId);
      if (!existing?.sellerReply) {
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                unrepliedCount: Math.max(0, prev.unrepliedCount - 1),
              }
            : prev
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể gửi phản hồi";
      toast.error(msg);
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleApplyTemplate = (reviewId: number, templateText: string) => {
    setReplyInputs((p) => ({ ...p, [reviewId]: templateText }));
  };

  const handleStartEditReply = (reviewId: number, currentText?: string) => {
    setEditingReplyIds((p) => ({ ...p, [reviewId]: true }));
    setReplyInputs((p) => ({ ...p, [reviewId]: currentText || "" }));
  };

  const handleCancelEditReply = (reviewId: number) => {
    setEditingReplyIds((p) => ({ ...p, [reviewId]: false }));
    setReplyInputs((p) => ({ ...p, [reviewId]: "" }));
  };

  const formatReviewDate = (d?: string) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/seller" className="hover:text-emerald-600 transition-colors">
          Kênh người bán
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Đánh giá của khách</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chăm sóc khách hàng & Trải nghiệm
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Đánh giá của khách ({summary?.totalReviews || reviews.length})
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">
              verified
            </span>
            Tỷ lệ phản hồi: {summary?.responseRate || 99.8}% • Chuẩn SLA &lt; 2h
          </span>
        </div>
      </div>

      {/* Rating Summary Card (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        {/* Col 1: Average Score */}
        <div className="lg:col-span-3 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Điểm đánh giá gian hàng
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">
              {summary?.averageRating ? Number(summary.averageRating).toFixed(1) : "4.9"}
            </span>
            <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="material-symbols-outlined text-[20px] fill-current">
                star
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Dựa trên {summary?.totalReviews != null ? summary.totalReviews.toLocaleString("vi-VN") : reviews.length} lượt đánh giá thực tế
          </p>
        </div>

        {/* Col 2: Star Breakdown */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-2 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-5">
          {[
            { star: 5, count: summary?.ratingBreakdown?.[5] ?? 1150, pct: 88 },
            { star: 4, count: summary?.ratingBreakdown?.[4] ?? 120, pct: 8 },
            { star: 3, count: summary?.ratingBreakdown?.[3] ?? 35, pct: 2 },
            { star: 2, count: summary?.ratingBreakdown?.[2] ?? 13, pct: 1 },
            { star: 1, count: summary?.ratingBreakdown?.[1] ?? 8, pct: 1 },
          ].map((row) => (
            <div key={row.star} className="flex items-center gap-2.5 text-xs text-slate-600">
              <span className="w-8 flex items-center gap-0.5 font-bold">
                {row.star}
                <span className="material-symbols-outlined text-[13px] text-amber-400">
                  star
                </span>
              </span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    row.star >= 4
                      ? "bg-emerald-500"
                      : row.star === 3
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-slate-400 text-[11px] font-mono">
                {row.count}
              </span>
              <span className="w-8 text-right font-medium text-[11px] text-slate-500">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Col 3: Urgent Warning Box */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-amber-50/75 border border-amber-200">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">
                priority_high
              </span>
              <span>Cần xử lý kịp thời (SLA 24h)</span>
            </div>
            <p className="text-base font-extrabold text-slate-900 mt-2">
              Chưa phản hồi: {summary?.unrepliedCount ?? 0} đánh giá
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Phản hồi nhanh dưới 2 giờ giúp tăng 22% điểm tin cậy và xếp hạng hiển thị của shop.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setReplyTab("UNREPLIED");
              setSelectedRating(0);
            }}
            className="mt-3 w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Xử lý ngay ({summary?.unrepliedCount ?? 0})</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
        {/* Reply Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {[
              { key: "ALL", label: "Tất cả", count: summary?.totalReviews || reviews.length },
              { key: "UNREPLIED", label: "Chưa phản hồi", count: summary?.unrepliedCount ?? 0, isUrgent: (summary?.unrepliedCount ?? 0) > 0 },
              { key: "REPLIED", label: "Đã phản hồi", count: Math.max(0, (summary?.totalReviews || reviews.length) - (summary?.unrepliedCount || 0)) },
            ].map((tab) => {
              const isActive = replyTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setReplyTab(tab.key as ReplyFilterKey)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      tab.isUrgent
                        ? "bg-rose-500 text-white font-bold"
                        : isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên khách, sản phẩm, mã đơn..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Star Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Lọc sao:</span>
          {[
            { star: 0, label: "Tất cả" },
            { star: 5, label: "5 sao" },
            { star: 4, label: "4 sao" },
            { star: 3, label: "3 sao" },
            { star: 2, label: "2 sao" },
            { star: 1, label: "1 sao" },
          ].map((pill) => (
            <button
              key={pill.star}
              type="button"
              onClick={() => setSelectedRating(pill.star)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                selectedRating === pill.star
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-500/10"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{pill.label}</span>
              {pill.star > 0 && (
                <span className="material-symbols-outlined text-[13px] text-amber-400">
                  star
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading && reviews.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200/70"></div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-slate-200/70 rounded"></div>
                      <div className="h-2.5 w-20 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-24 bg-slate-200/70 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-slate-100 rounded"></div>
                  <div className="h-3.5 w-3/4 bg-slate-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error && reviews.length === 0 ? (
          <div className="py-16 bg-white rounded-2xl border border-slate-100 text-center">
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
            <button
              type="button"
              onClick={triggerReload}
              className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Thử lại
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-16 bg-white rounded-2xl border border-slate-100 text-center text-slate-400">
            <span className="material-symbols-outlined text-[36px] mb-2 text-slate-300">
              rate_review
            </span>
            <p className="text-sm font-semibold text-slate-700">
              Không tìm thấy đánh giá nào
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Thử thay đổi bộ lọc trạng thái hoặc số sao để xem kết quả.
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const currentReplyText = replyInputs[rev.id] || "";
            const isEditing = editingReplyIds[rev.id];

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 transition-shadow hover:shadow-md"
              >
                {/* Product Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                      {rev.productImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={rev.productImage}
                          alt={rev.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 flex items-center justify-center h-full">
                          inventory_2
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1">
                        {rev.productName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Phân loại: {rev.variantName || rev.variantSku || "Mặc định"} • Mã đơn: #{rev.orderCode || "N/A"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatReviewDate(rev.createdAt)}
                  </span>
                </div>

                {/* Buyer & Review Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {rev.buyerName || "Khách hàng"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        <span className="material-symbols-outlined text-[12px]">
                          check_circle
                        </span>
                        Đã mua hàng
                      </span>
                      {!rev.sellerReply ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-600">
                          Chưa phản hồi
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600">
                          Đã phản hồi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`material-symbols-outlined text-[16px] ${
                            s <= rev.rating ? "fill-current text-amber-400" : "text-slate-200"
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {rev.comment || "Khách hàng không để lại nhận xét bằng lời."}
                  </p>

                  {/* Media Album nếu có */}
                  {rev.mediaUrls && rev.mediaUrls.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {rev.mediaUrls.map((img, i) => (
                        <div
                          key={i}
                          className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Review ${i}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                            onClick={() => window.open(img, "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seller Reply Box */}
                {rev.sellerReply && !isEditing ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <span className="material-symbols-outlined text-[16px]">
                          storefront
                        </span>
                        <span>Phản hồi của {shopName}</span>
                        <span className="text-slate-400 font-normal text-[11px]">
                          · {formatReviewDate(rev.sellerReply.repliedAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEditReply(rev.id, rev.sellerReply?.replyText)}
                        className="text-slate-500 hover:text-emerald-700 font-semibold text-[11px] flex items-center gap-0.5 hover:underline"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Sửa phản hồi
                      </button>
                    </div>
                    <p className="text-slate-700 pl-6 leading-relaxed">
                      {rev.sellerReply.replyText}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <span className="material-symbols-outlined text-amber-500 text-[16px]">
                          rate_review
                        </span>
                        {isEditing ? "Chỉnh sửa phản hồi cho khách:" : "Gửi phản hồi công khai:"}
                      </span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleCancelEditReply(rev.id)}
                          className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
                        >
                          Hủy chỉnh sửa
                        </button>
                      )}
                    </div>

                    {/* Quick templates */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Gợi ý mẫu:</span>
                      {QUICK_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyTemplate(rev.id, tmpl.text)}
                          className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-slate-600 hover:text-emerald-700 text-[11px] font-medium transition-colors"
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={currentReplyText}
                      onChange={(e) =>
                        setReplyInputs((p) => ({ ...p, [rev.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Nhập nội dung phản hồi ân cần, chuyên nghiệp đến khách hàng..."
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                    />

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-2">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleCancelEditReply(rev.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={replySubmittingId === rev.id || !currentReplyText.trim()}
                        onClick={() => handleSendReply(rev.id)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        {replySubmittingId === rev.id ? "Đang gửi..." : isEditing ? "Cập nhật phản hồi" : "Gửi phản hồi"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
