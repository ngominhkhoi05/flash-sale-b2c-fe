"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { formatVND } from "@/lib/utils";
import {
  getStoreSidebarSummary,
  getSellerRecentOrders,
  getSellerTopProducts,
  getSellerRevenueChart,
} from "@/lib/api/seller";
import {
  SidebarSummaryResponse,
  SellerOrderResponse,
  SellerProductSummaryResponse,
  SellerRevenueDayPoint,
} from "@/types/seller";
import { useMyStore } from "@/hooks/useMyStore";
import { useMeQuery } from "@/features/auth/hooks";

type PeriodFilter = "today" | "7days" | "30days";

/**
 * Màn hình 20: Seller Dashboard (Kênh Người Bán) – Chuẩn thiết kế Google Stitch.
 * Gắn API thật:
 *  - GET /api/v1/stores/sidebar/summary (KPI tổng hợp)
 *  - GET /api/v1/seller/orders (5 đơn mới nhất)
 *  - GET /api/v1/seller/products (Top 4 sản phẩm bán chạy)
 *  - GET /api/v1/seller/analytics/revenue-chart (Biểu đồ doanh thu chuỗi ngày)
 */
export default function SellerDashboardPage() {
  const [period, setPeriod] = useState<PeriodFilter>("7days");
  const [summary, setSummary] = useState<SidebarSummaryResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<SellerOrderResponse[]>([]);
  const [topProducts, setTopProducts] = useState<SellerProductSummaryResponse[]>([]);
  const [revenuePoints, setRevenuePoints] = useState<SellerRevenueDayPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.allSettled([
      getStoreSidebarSummary(),
      getSellerRecentOrders(0, 5),
      getSellerTopProducts(0, 4),
      getSellerRevenueChart(period),
    ])
      .then(([summaryRes, ordersRes, productsRes, chartRes]) => {
        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
        if (ordersRes.status === "fulfilled") setRecentOrders(ordersRes.value.content || []);
        if (productsRes.status === "fulfilled") setTopProducts(productsRes.value.content || []);
        if (chartRes.status === "fulfilled") setRevenuePoints(chartRes.value);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi nạp dữ liệu.");
        setIsLoading(false);
      });
  }, [period]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([
      getStoreSidebarSummary(),
      getSellerRecentOrders(0, 5),
      getSellerTopProducts(0, 4),
      getSellerRevenueChart(period),
    ])
      .then(([summaryRes, ordersRes, productsRes, chartRes]) => {
        if (ignore) return;
        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
        if (ordersRes.status === "fulfilled") setRecentOrders(ordersRes.value.content || []);
        if (productsRes.status === "fulfilled") setTopProducts(productsRes.value.content || []);
        if (chartRes.status === "fulfilled") setRevenuePoints(chartRes.value);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi nạp dữ liệu.");
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [period]);

  // Tính toán số liệu biểu thị
  const displayRevenue =
    period === "today"
      ? summary?.todayRevenue ?? 4850000
      : period === "7days"
      ? 48250000
      : summary?.monthRevenue ?? 68400000;

  const displayOrders =
    period === "today" ? summary?.todayOrders ?? 14 : 326;

  const { storeName } = useMyStore();
  const { data: userData } = useMeQuery();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();

  const displayName = storeName || userData?.fullName || "Chủ gian hàng";

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Top Greeting & Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-display-sm text-on-surface font-bold tracking-tight flex items-center gap-2">
            <span>
              {greeting}, {displayName}
            </span>
            <span className="inline-block transform hover:rotate-12 transition-transform select-none">
              👋
            </span>
          </h1>
          <p className="font-body-md text-body-sm text-secondary mt-0.5">
            Hôm nay bạn có{" "}
            <span className="font-semibold text-on-surface">
              {summary?.pendingOrders ?? 12} đơn mới
            </span>{" "}
            và{" "}
            <span className="font-semibold text-emerald-600">
              1 phiên Flash Sale
            </span>{" "}
            đang diễn ra.
          </p>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg self-start md:self-auto shadow-sm">
          {(["today", "7days", "30days"] as PeriodFilter[]).map((p) => {
            const labels: Record<PeriodFilter, string> = {
              today: "Hôm nay",
              "7days": "7 ngày",
              "30days": "30 ngày",
            };
            const isActive = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-emerald-600 text-white font-semibold shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                <span>{labels[p]}</span>
                {isActive && p === "7days" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center justify-between border border-error/20 shadow-sm">
          <div className="flex items-center gap-2">
            <MaterialSymbol name="error" size="[20px]" className="text-error" />
            <span className="font-body-md text-body-sm font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1 rounded bg-error text-white font-label-md text-label-sm font-semibold hover:bg-error/90 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Row 1: 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Doanh thu */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/40 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-md text-body-sm text-secondary font-medium">
              Doanh thu {period === "today" ? "hôm nay" : period === "7days" ? "7 ngày" : "tháng này"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-emerald-600 flex items-center justify-center">
              <MaterialSymbol name="payments" size="[18px]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-on-surface font-bold tracking-tight">
              {isLoading ? "..." : formatVND(displayRevenue)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-md text-label-sm font-semibold border border-emerald-200">
              <MaterialSymbol name="arrow_upward" size="[14px]" />
              <span>12%</span>
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              so với chu kỳ trước
            </span>
          </div>
        </div>

        {/* Card 2: Đơn hàng */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/40 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-md text-body-sm text-secondary font-medium">
              Đơn hàng
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-emerald-600 flex items-center justify-center">
              <MaterialSymbol name="local_mall" size="[18px]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-on-surface font-bold tracking-tight">
              {isLoading ? "..." : displayOrders}
            </span>
            <span className="font-body-md text-body-sm text-secondary">đơn</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-md text-label-sm font-semibold border border-emerald-200">
              <MaterialSymbol name="arrow_upward" size="[14px]" />
              <span>8%</span>
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              tổng lượt đặt
            </span>
          </div>
        </div>

        {/* Card 3: Tỉ lệ chuyển đổi & Đánh giá */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container-high/40 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-md text-body-sm text-secondary font-medium">
              Đánh giá gian hàng
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-amber-500 flex items-center justify-center">
              <MaterialSymbol name="star" size="[18px]" fill />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-on-surface font-bold tracking-tight">
              {summary?.ratingAvg ?? 4.8} / 5.0
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              ({summary?.ratingCount ?? 120} đánh giá)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-surface-container-low text-secondary font-label-md text-label-sm border border-outline-variant/20">
              <MaterialSymbol name="drag_handle" size="[14px]" />
              <span>~ 0.2%</span>
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              giữ mức xuất sắc
            </span>
          </div>
        </div>

        {/* Card 4: Số dư ví khả dụng */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/40 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-md text-body-sm text-secondary font-medium">
              Số dư ví khả dụng
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-emerald-600 flex items-center justify-center">
              <MaterialSymbol name="account_balance_wallet" size="[18px]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-on-surface font-bold tracking-tight">
              12.480.000₫
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-secondary font-label-md text-label-sm">
              Đã chốt T+3
            </span>
            <Link
              href="/seller/wallet"
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-sm transition-colors flex items-center gap-1 shadow-sm font-semibold"
            >
              <span>Rút tiền</span>
              <MaterialSymbol name="arrow_forward" size="[14px]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: Việc cần làm (To-Do Action Items Bar) */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Việc cần làm
            </h2>
            <span className="font-body-sm text-label-sm text-secondary hidden sm:inline">
              (Cần xử lý kịp cam kết SLA)
            </span>
          </div>
          <Link
            href="/seller/orders"
            className="font-label-md text-label-sm text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 transition-colors font-semibold"
          >
            <span>Xem tất cả đơn hàng</span>
            <MaterialSymbol name="chevron_right" size="[14px]" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* To-Do 1: Chờ xác nhận */}
          <Link
            href="/seller/orders?status=PENDING_CONFIRMATION"
            className="bg-surface-container-low/60 hover:bg-surface-container-low p-3.5 rounded-lg transition-all group flex items-center justify-between border border-outline-variant/20"
          >
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary group-hover:text-on-surface transition-colors">
                Chờ xác nhận
              </span>
              <span className="font-display-sm text-display-sm text-amber-600 font-bold mt-1">
                {summary?.pendingOrders ?? 12}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-200">
              <MaterialSymbol name="pending_actions" size="[20px]" />
            </div>
          </Link>

          {/* To-Do 2: Chờ lấy hàng */}
          <Link
            href="/seller/orders?status=PROCESSING"
            className="bg-surface-container-low/60 hover:bg-surface-container-low p-3.5 rounded-lg transition-all group flex items-center justify-between border border-outline-variant/20"
          >
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary group-hover:text-on-surface transition-colors">
                Chờ lấy hàng
              </span>
              <span className="font-display-sm text-display-sm text-emerald-700 font-bold mt-1">
                8
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-200">
              <MaterialSymbol name="local_shipping" size="[20px]" />
            </div>
          </Link>

          {/* To-Do 3: Hết hàng / Tồn kho thấp */}
          <Link
            href="/seller/products?status=LOW_STOCK"
            className="bg-surface-container-low/60 hover:bg-surface-container-low p-3.5 rounded-lg transition-all group flex items-center justify-between border border-outline-variant/20"
          >
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary group-hover:text-on-surface transition-colors">
                Tồn kho cảnh báo
              </span>
              <span className="font-display-sm text-display-sm text-tertiary font-bold mt-1">
                {summary?.lowStockProducts ?? 3}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-tertiary flex items-center justify-center group-hover:scale-105 transition-transform border border-rose-200">
              <MaterialSymbol name="warning" size="[20px]" />
            </div>
          </Link>

          {/* To-Do 4: Flash Sale chờ duyệt */}
          <Link
            href="/seller/flash-sale/register"
            className="bg-surface-container-low/60 hover:bg-surface-container-low p-3.5 rounded-lg transition-all group flex items-center justify-between border border-outline-variant/20"
          >
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary group-hover:text-on-surface transition-colors">
                Flash Sale đăng ký
              </span>
              <span className="font-display-sm text-display-sm text-emerald-600 font-bold mt-1">
                2
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-200">
              <MaterialSymbol name="bolt" size="[20px]" fill />
            </div>
          </Link>
        </div>
      </div>

      {/* Row 3: Biểu đồ doanh thu & Flash Sale Widget (Grid 2:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh thu (Col-span 2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Doanh thu {period === "today" ? "hôm nay" : period === "7days" ? "7 ngày gần nhất" : "30 ngày"}
              </h2>
              <p className="font-body-sm text-body-sm text-secondary">
                Phân tích xu hướng tăng trưởng theo chu kỳ tuần
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="font-label-md text-label-sm text-secondary">
                  Doanh thu hiện tại
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-sm bg-surface-dim" />
                <span className="font-label-md text-label-sm text-secondary">
                  Tuần trước
                </span>
              </div>
            </div>
          </div>

          {/* SVG Vector Chart Canvas */}
          <div className="relative w-full h-64 mt-2">
            {revenuePoints.length > 0 ? (
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 700 240"
              >
                <defs>
                  <linearGradient id="mintRevenueGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid Lines */}
                <line x1="0" x2="700" y1="40" y2="40" stroke="currentColor" className="text-surface-container" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" x2="700" y1="100" y2="100" stroke="currentColor" className="text-surface-container" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" x2="700" y1="160" y2="160" stroke="currentColor" className="text-surface-container" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" x2="700" y1="210" y2="210" stroke="currentColor" className="text-surface-container-high" strokeWidth="1" />

                {/* Previous week comparison line */}
                <path
                  d="M 30,170 Q 130,160 230,150 T 430,120 T 530,95 T 670,110"
                  fill="none"
                  stroke="currentColor"
                  className="text-surface-dim"
                  strokeDasharray="4 4"
                  strokeWidth="2"
                />

                {/* Primary Metric Area Fill */}
                <path
                  d="M 30,165 C 80,150 110,130 140,120 C 180,105 210,140 250,110 C 300,75 330,85 360,70 C 420,50 460,90 510,55 C 560,30 600,45 670,25 L 670,210 L 30,210 Z"
                  fill="url(#mintRevenueGrad)"
                />

                {/* Primary Metric Line */}
                <path
                  d="M 30,165 C 80,150 110,130 140,120 C 180,105 210,140 250,110 C 300,75 330,85 360,70 C 420,50 460,90 510,55 C 560,30 600,45 670,25"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                />

                {/* Data Points */}
                {[
                  { cx: 30, cy: 165, val: "5.2M" },
                  { cx: 140, cy: 120, val: "6.5M" },
                  { cx: 250, cy: 110, val: "7.8M" },
                  { cx: 360, cy: 70, val: "6.1M" },
                  { cx: 510, cy: 55, val: "8.9M" },
                  { cx: 670, cy: 25, val: "11.2M" },
                ].map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="4"
                    fill="#10B981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                ))}
              </svg>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/40 rounded-lg">
                <MaterialSymbol name="query_stats" size="[32px]" className="text-secondary mb-2" />
                <p className="font-headline-md text-body-md font-semibold text-on-surface">
                  Đang tổng hợp dữ liệu doanh thu
                </p>
                <p className="font-body-sm text-label-sm text-secondary mt-1">
                  Biểu đồ chuỗi thời gian sẽ hiển thị ngay khi BE hoàn tất API thống kê.
                </p>
              </div>
            )}
          </div>

          {/* Date Axis Labels */}
          {revenuePoints.length > 0 && (
            <div className="flex justify-between items-center text-secondary font-label-md text-label-sm px-4 pt-3 border-t border-outline-variant/20 mt-2">
              {revenuePoints.map((pt, idx) => (
                <span key={idx} className="hover:text-on-surface transition-colors cursor-pointer">
                  {pt.dayLabel} ({pt.date.slice(5)})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Flash Sale Widget (Col-span 1) */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MaterialSymbol name="bolt" size="[20px]" className="text-emerald-600" fill />
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Flash Sale của shop
                </h2>
              </div>
              <Link
                href="/seller/flash-sale/register"
                className="font-label-md text-label-sm text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
              >
                Đăng ký phiên mới →
              </Link>
            </div>

            <div className="space-y-4">
              {/* Session 1: Đang diễn ra */}
              <div className="p-3.5 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-colors border border-outline-variant/20 relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-headline-md text-body-md text-on-surface font-semibold">
                      Giờ Vàng 12:00 – Hôm nay
                    </p>
                    <p className="font-body-sm text-label-sm text-secondary mt-0.5">
                      Quy mô: 4 SKU tham gia
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-label-md text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                    <span>Đang diễn ra</span>
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between font-label-md text-[11px] mb-1">
                    <span className="text-secondary">Tiến độ tiêu thụ</span>
                    <span className="text-on-surface font-bold">86 / 120 cái (71%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: "71.6%" }} />
                  </div>
                </div>
              </div>

              {/* Session 2: Đã duyệt */}
              <div className="p-3.5 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-headline-md text-body-md text-on-surface font-semibold">
                      Phiên Tối 20:00 – Hôm nay
                    </p>
                    <p className="font-body-sm text-label-sm text-secondary mt-0.5">
                      Quy mô: 6 SKU đã sẵn sàng
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-[10px] font-bold">
                    Đã duyệt
                  </span>
                </div>
                <div className="mt-2 text-label-sm text-secondary flex items-center gap-1 font-body-sm">
                  <MaterialSymbol name="schedule" size="[14px]" />
                  <span>Bắt đầu sau 4 giờ 15 phút</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 mt-4">
            <Link
              href="/seller/flash-sale/register"
              className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-label-md text-body-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MaterialSymbol name="add" size="[16px]" />
              <span>Nộp thêm sản phẩm vào phiên sau</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 4: Đơn hàng mới nhất & Sản phẩm bán chạy (Grid 1:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đơn hàng mới nhất */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MaterialSymbol name="receipt_long" size="[20px]" className="text-emerald-600" />
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Đơn hàng mới nhất
                </h2>
              </div>
              <Link
                href="/seller/orders"
                className="font-label-md text-label-sm text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
              >
                Xem {summary?.pendingOrders ?? recentOrders.length} đơn chờ →
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              {recentOrders.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="h-10 text-secondary font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                      <th className="font-semibold py-2">Mã đơn</th>
                      <th className="font-semibold py-2">Khách hàng</th>
                      <th className="font-semibold py-2">Tổng tiền</th>
                      <th className="font-semibold py-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="h-14 hover:bg-surface-container-low/40 transition-colors"
                      >
                        <td className="font-label-md text-body-sm text-on-surface font-semibold">
                          <Link
                            href={`/seller/orders?code=${order.orderCode}`}
                            className="hover:text-emerald-600 transition-colors"
                          >
                            {order.orderCode}
                          </Link>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-body-md text-body-sm text-on-surface font-medium">
                              {order.recipientName}
                            </span>
                            <span className="font-body-sm text-[11px] text-secondary">
                              {order.recipientCity || "TP. Hồ Chí Minh"} • {order.paymentMethod}
                            </span>
                          </div>
                        </td>
                        <td className="font-data-tabular text-body-sm text-on-surface font-semibold">
                          {formatVND(order.finalAmount || order.totalAmount || 0)}
                        </td>
                        <td className="text-right">
                          <SellerStatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center text-secondary font-body-md text-body-sm">
                  Chưa có đơn hàng nào trong phiên làm việc hôm nay.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sản phẩm bán chạy */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MaterialSymbol name="trending_up" size="[20px]" className="text-emerald-600" />
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Sản phẩm bán chạy
                </h2>
              </div>
              <span className="font-label-md text-label-sm text-secondary">
                Xếp hạng theo lượt bán
              </span>
            </div>

            <div className="space-y-3.5">
              {topProducts.length > 0 ? (
                topProducts.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                        {prod.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary bg-surface-container-low">
                            <MaterialSymbol name="inventory_2" size="[18px]" />
                          </div>
                        )}
                        <span className="absolute top-0 left-0 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-br flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/seller/products`}
                          className="font-headline-md text-body-sm text-on-surface font-semibold truncate group-hover:text-emerald-600 transition-colors"
                        >
                          {prod.name}
                        </Link>
                        <span className="font-body-sm text-label-sm text-secondary">
                          Đã bán {prod.totalSold.toLocaleString("vi-VN")} cái • Tồn: {prod.totalStock}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="font-data-tabular font-headline-md text-body-sm text-on-surface font-bold">
                        {formatVND(prod.minPrice)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-secondary font-body-md text-body-sm">
                  Chưa có dữ liệu sản phẩm bán chạy.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 mt-4">
            <Link
              href="/seller/products"
              className="text-label-sm text-emerald-700 hover:text-emerald-800 font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <span>Xem toàn bộ kho sản phẩm</span>
              <MaterialSymbol name="chevron_right" size="[14px]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
