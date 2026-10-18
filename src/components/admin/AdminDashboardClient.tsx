"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { KpiCard } from "@/components/admin/KpiCard";
import { getMockAdminDashboard } from "@/lib/mocks/admin.mock";

interface TopStore {
  id: string;
  name: string;
  legalName: string;
  revenue: number;
  orders: number;
  avatarUrl: string;
}

const TOP_STORES: TopStore[] = [
  {
    id: "1",
    name: "Coolmate Official",
    legalName: "Cty TNHH FASHION LAB",
    revenue: 184500000,
    orders: 1240,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAbz76SRjW8_3yPmbvexhST_wIFQiYLumarocjtOVufren4m0-TVaMANG3U73E_07kLVfZ_SXV6oiDoL9iCMgqT-05TVuwX8nIG92rGi2Z2pb8Q-Di2YtgrY0StAy5R9rPGS4LJREjIRHZ9l-WaT5bwbdVT-Ot_p07PE3W18JpMZiV065KXmd9odEolIfJnhCm_B3QkAkRS9jF3eQGctcSnPSQQsuzZimqkYc1JfwDTjzlC6D_CvFJogg",
  },
  {
    id: "2",
    name: "Anker Flagship Store",
    legalName: "Anker Innovations VN",
    revenue: 142800000,
    orders: 890,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD3NVJSakeKNPo_drP6zlOEOJzrgF9fwtzi5alaYkof1sxxudxRLBx2DYM-c6EVVgCwYAaYRUO08c9mFZFLqn6icZC3Sjnrt6Q4L0sMfGNsX05uRMvcqnHdewruddS4YuXBcX-dGaBbWsyIGI1NxdMZPJLNZ1-0gNwalNT3lHsG9xFbRCESxBIYA04HQwP6HDVMbVc7rPoDKwzFt1yrUxLKaqc1h52IrobAd1_m5dUwBkhMNjgHSM6TEQ",
  },
  {
    id: "3",
    name: "Lock&Lock Vietnam",
    legalName: "Lock&Lock Living Corp",
    revenue: 98240000,
    orders: 615,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYM66B6-NBicCLaGkAVwVYfTsT9hIhQLg86tFx8KkpQxuxWozaWWk5xr-golKmjIRv4xHD_o552YctzTv59M6gjxvOoIxnIsnHn1O7ZlVHBeRGbrILhtmXch80xnuChcGtRDCfO9OAX_IXC4G8F3DI5Zx8dSCGqxhEYwxxRt6bIkyA2vJoH3FrHbAdpJb-98Oym6T48UGAhk71RcpvekWxtDato8g7WLpRtNV5tGa0dvV2xIqgZHrrUg",
  },
  {
    id: "4",
    name: "GUMAC Fashion",
    legalName: "GUMAC Fashion Retail",
    revenue: 76900000,
    orders: 542,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB38peK0mL-8Y6iqDLkNG8Rr0OSNtIxqeXM_zZRv31Bkhlt_C0J2Z4IxF-YUJmWBI87EkJIQrhfqXtLL30Wqfd0WlKeduqJ-1nvxdutQ7D0NXNFkl-76t6N1BO7QyX5M-FmyT6dOCpgyQm5W8gpmbHCMnYOvZdZlkkNXLs-W9hSJ743V3Dr-CkFprZndoeHMThkiFw6rF9ydgfnJydDMGrRqt5qduYNSo1oEi7XLjjaRS-NYHDcDae4ZQ",
  },
  {
    id: "5",
    name: "Sunhouse Mall",
    legalName: "Tập đoàn Sunhouse",
    revenue: 65410000,
    orders: 438,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiSfS1TGyR1qIb_xV0UBOnZd0z2Dq7Q5haoxY1Ssu9oq-zC73PbOy3vC1-j7_ebTD_4gshXbgvpSHhw3vrxCdOPfRycG5AisEACXF8KetuW5FxvDRKsdPZGsEvuh2NJmfi4zmbX5n7OjRXhh7OCBX6lgGU32E186f-q4qS0PaoD06_qciJ79cBepoLRkNBYH-90w5UVc62ArRpdOybHXXgJieXAqLUD2iweknZxgKxulrCmf6QaRhYwg",
  },
];

interface CategoryShare {
  name: string;
  share: number;
  revenue: string;
  color: string;
}

const CATEGORY_SHARES: CategoryShare[] = [
  { name: "Thời trang & Phụ kiện", share: 34, revenue: "435 triệu₫", color: "bg-primary" },
  { name: "Điện thoại & Thiết bị số", share: 26, revenue: "332 triệu₫", color: "bg-primary-container" },
  { name: "Nhà cửa & Đời sống", share: 18, revenue: "230 triệu₫", color: "bg-secondary" },
  { name: "Sức khỏe & Sắc đẹp", share: 12, revenue: "153 triệu₫", color: "bg-secondary-fixed-dim" },
  { name: "Mẹ & Bé", share: 6, revenue: "77 triệu₫", color: "bg-tertiary" },
  { name: "Thể thao & Dã ngoại", share: 4, revenue: "51 triệu₫", color: "bg-outline" },
];

export function AdminDashboardClient() {
  const [data] = useState(() => getMockAdminDashboard());
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Đã xuất báo cáo tổng quan hệ thống định dạng CSV thành công.");
    }, 800);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg select-none">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Tổng quan hệ thống
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-xs bg-primary-fixed text-on-primary-fixed-variant font-semibold">
              Live Mode
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary mt-0.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-secondary">update</span>
            Cập nhật lần cuối:{" "}
            <span className="font-data-tabular font-medium text-on-surface">
              {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} –{" "}
              {new Date().toLocaleDateString("vi-VN")}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-space-xs px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-sm font-medium shadow-sm hover:bg-surface-container-low transition-colors border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              calendar_today
            </span>
            <span>Hôm nay ({new Date().toLocaleDateString("vi-VN")})</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary text-on-primary font-body-md text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExporting ? "sync" : "file_download"}
            </span>
            <span>{isExporting ? "Đang xuất..." : "Xuất báo cáo"}</span>
          </button>
        </div>
      </div>

      {/* Realtime Flash Sale Alert Banner */}
      <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed shadow-sm border border-tertiary/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-tertiary flex items-center justify-center text-on-tertiary shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-headline-md text-sm sm:text-base font-bold text-tertiary">
              Phiên Flash Sale đang mở
            </span>
            <span className="text-tertiary font-bold">•</span>
            <span className="inline-flex items-center gap-1 font-data-tabular text-xs sm:text-sm font-semibold text-on-tertiary-fixed-variant bg-surface-container-lowest/80 px-2 py-0.5 rounded-md">
              <span className="material-symbols-outlined text-[16px] text-tertiary">timer</span>
              Hệ thống trực tiếp
            </span>
            <span className="text-tertiary font-bold">•</span>
            <span className="font-data-tabular text-xs sm:text-sm font-bold text-on-surface">
              2.315 đơn đã xác nhận
            </span>
          </div>
        </div>
        <Link
          href="/admin/flash-sale/monitor"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-tertiary font-headline-md text-sm font-semibold hover:bg-white shadow-sm transition-all shrink-0"
        >
          <span>Mở giám sát</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {data.kpis.map((kpi, idx) => (
          <KpiCard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            iconName={kpi.iconName}
            trend={kpi.trend}
            isMockSample={kpi.isMockSample}
          />
        ))}
      </div>

      {/* Row 2: Charts (8 cols) & Pending Tasks (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
        {/* Chart Panel */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-4">
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">
                GMV và số đơn 14 ngày
              </h2>
              <p className="font-body-sm text-xs text-secondary mt-0.5">
                Biểu đồ kép trực quan theo chu kỳ nửa tháng
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-body-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                <span className="text-secondary font-medium">GMV (Tỷ VNĐ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" />
                <span className="text-secondary font-medium">Số đơn hàng (Nghìn đơn)</span>
              </div>
            </div>
          </div>

          {/* Dual Visual Chart Canvas (SVG) */}
          <div className="relative w-full h-64 select-none">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 740 220">
              <defs>
                <linearGradient id="barGmvGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#006194" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#007bb9" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="lineGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#545f73" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#545f73" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line stroke="#e5eeff" strokeDasharray="4 4" strokeWidth="1" x1="30" x2="720" y1="20" y2="20" />
              <line stroke="#e5eeff" strokeDasharray="4 4" strokeWidth="1" x1="30" x2="720" y1="70" y2="70" />
              <line stroke="#e5eeff" strokeDasharray="4 4" strokeWidth="1" x1="30" x2="720" y1="120" y2="120" />
              <line stroke="#e5eeff" strokeWidth="1" x1="30" x2="720" y1="170" y2="170" />

              <text className="text-[10px] fill-secondary font-data-tabular" x="5" y="24">1.5B</text>
              <text className="text-[10px] fill-secondary font-data-tabular" x="5" y="74">1.0B</text>
              <text className="text-[10px] fill-secondary font-data-tabular" x="5" y="124">0.5B</text>
              <text className="text-[10px] fill-secondary font-data-tabular" x="12" y="174">0</text>

              {/* 14 Day Bars (GMV) */}
              <rect fill="url(#barGmvGrad)" height="65" rx="3" width="22" x="42" y="105" />
              <rect fill="url(#barGmvGrad)" height="75" rx="3" width="22" x="91" y="95" />
              <rect fill="url(#barGmvGrad)" height="90" rx="3" width="22" x="140" y="80" />
              <rect fill="url(#barGmvGrad)" height="60" rx="3" width="22" x="189" y="110" />
              <rect fill="url(#barGmvGrad)" height="95" rx="3" width="22" x="238" y="75" />
              <rect fill="url(#barGmvGrad)" height="110" rx="3" width="22" x="287" y="60" />
              <rect fill="url(#barGmvGrad)" height="85" rx="3" width="22" x="336" y="85" />
              <rect fill="url(#barGmvGrad)" height="100" rx="3" width="22" x="385" y="70" />
              <rect fill="url(#barGmvGrad)" height="105" rx="3" width="22" x="434" y="65" />
              <rect fill="url(#barGmvGrad)" height="115" rx="3" width="22" x="483" y="55" />
              <rect fill="url(#barGmvGrad)" height="95" rx="3" width="22" x="532" y="75" />
              <rect fill="url(#barGmvGrad)" height="110" rx="3" width="22" x="581" y="60" />
              <rect fill="url(#barGmvGrad)" height="122" rx="3" width="22" x="630" y="48" />
              <rect fill="url(#barGmvGrad)" height="130" rx="3" width="22" x="679" y="40" />

              {/* Orders Area Fill */}
              <path
                d="M 53 118 L 102 108 L 151 92 L 200 120 L 249 84 L 298 72 L 347 98 L 396 79 L 445 74 L 494 62 L 543 83 L 592 68 L 641 53 L 690 44 L 690 170 L 53 170 Z"
                fill="url(#lineGlow)"
              />
              <polyline
                fill="none"
                points="53,118 102,108 151,92 200,120 249,84 298,72 347,98 396,79 445,74 494,62 543,83 592,68 641,53 690,44"
                stroke="#545f73"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />

              {/* Data points */}
              {[
                [53, 118], [102, 108], [151, 92], [200, 120], [249, 84],
                [298, 72], [347, 98], [396, 79], [445, 74], [494, 62],
                [543, 83], [592, 68], [641, 53], [690, 44]
              ].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  fill={i === 13 ? "#545f73" : "#ffffff"}
                  r={i === 13 ? 4.5 : 3.5}
                  stroke={i === 13 ? "#ffffff" : "#545f73"}
                  strokeWidth="2"
                />
              ))}

              <text className="text-[11px] fill-secondary font-label-sm" x="43" y="195">Day 1</text>
              <text className="text-[11px] fill-secondary font-label-sm" x="186" y="195">Day 4</text>
              <text className="text-[11px] fill-secondary font-label-sm" x="333" y="195">Day 7</text>
              <text className="text-[11px] fill-secondary font-label-sm" x="480" y="195">Day 10</text>
              <text className="text-[11px] fill-primary font-bold font-label-sm" x="668" y="195">Hôm nay</text>
            </svg>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-secondary text-xs bg-surface-container-low px-4 py-2 rounded-lg">
            <span>Tổng 14 ngày: <strong className="text-on-surface font-data-tabular">16,42 tỷ₫</strong> GMV</span>
            <span>Trung bình: <strong className="text-on-surface font-data-tabular">1,17 tỷ₫/ngày</strong></span>
            <span>Tỷ lệ hoàn thành: <strong className="text-primary font-data-tabular font-bold">96.8%</strong></span>
          </div>
        </div>

        {/* Pending Tasks Panel */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-base font-bold text-on-surface">Chờ xử lý</h2>
                <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-[11px] font-bold">
                  25
                </span>
              </div>
            </div>
            <p className="font-body-sm text-xs text-secondary mb-3">
              Các hành động cần ban quản trị phê duyệt ngay
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Item 1 */}
              <Link
                href="/admin/stores?tab=pending"
                className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-container-low transition-colors group border border-outline-variant/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-sm font-medium text-on-surface">
                      Gian hàng chờ duyệt
                    </span>
                    <span className="font-body-sm text-xs text-secondary">
                      Đăng ký mới hồ sơ kinh doanh
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-data-tabular font-bold text-[13px] bg-secondary-fixed text-on-secondary-fixed-variant">
                    6
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </Link>

              {/* Item 2 */}
              <Link
                href="/admin/flash-sale/approvals"
                className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-container-low transition-colors group border border-outline-variant/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[20px]">flash_on</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-sm font-medium text-on-surface">
                      Sản phẩm Flash Sale
                    </span>
                    <span className="font-body-sm text-xs text-secondary">
                      Đăng ký phiên khung giờ tới
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-data-tabular font-bold text-[13px] bg-tertiary-container text-on-tertiary-container">
                    14
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </Link>

              {/* Item 3 */}
              <Link
                href="/admin/permissions"
                className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-container-low transition-colors group border border-outline-variant/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[20px]">flag</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-sm font-medium text-on-surface">
                      Đánh giá bị báo cáo
                    </span>
                    <span className="font-body-sm text-xs text-secondary">
                      Nghi vấn vi phạm tiêu chuẩn
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-data-tabular font-bold text-[13px] bg-secondary-container text-on-secondary-container">
                    3
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </Link>

              {/* Item 4 */}
              <Link
                href="/admin/reconciliation"
                className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-container-low transition-colors group border border-outline-variant/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">assignment_return</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-sm font-medium text-on-surface">
                      Yêu cầu khiếu nại
                    </span>
                    <span className="font-body-sm text-xs text-secondary">
                      Tranh chấp đối soát & hoàn tiền
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-data-tabular font-bold text-[13px] bg-primary-fixed text-on-primary-fixed-variant">
                    2
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/20">
            <span className="font-label-sm text-xs text-secondary uppercase font-semibold">
              Tự động hóa SLA
            </span>
            <span className="inline-flex items-center gap-1 font-label-md text-xs text-primary font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Đang bật (≤ 2 giờ)
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Top Stores & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-stretch">
        {/* Top Stores Table Card */}
        <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-headline-md text-base font-bold text-on-surface">
                  Top gian hàng theo doanh thu
                </h2>
                <p className="font-body-sm text-xs text-secondary mt-0.5">
                  Xếp hạng đối tác có sản lượng lớn nhất hôm nay
                </p>
              </div>
              <span className="font-label-sm text-xs px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-semibold">
                Realtime
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-label-sm text-xs uppercase">
                    <th className="py-2.5 px-3 rounded-l-lg">Gian hàng</th>
                    <th className="py-2.5 px-3 text-right">Doanh thu</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Số đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {TOP_STORES.map((store) => (
                    <tr key={store.id} className="hover:bg-surface transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <Image
                            src={store.avatarUrl}
                            alt={store.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover shadow-xs shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-body-md font-semibold text-on-surface truncate">
                              {store.name}
                            </span>
                            <span className="font-body-sm text-xs text-secondary truncate">
                              {store.legalName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-data-tabular font-bold text-on-surface">
                        {store.revenue.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="py-3 px-3 text-right font-data-tabular text-secondary font-medium">
                        {store.orders} đơn
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/20">
            <Link
              href="/admin/stores"
              className="font-body-sm text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span>Xem báo cáo hiệu suất toàn bộ gian hàng</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Category Revenue Progress Bar Card */}
        <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-headline-md text-base font-bold text-on-surface">
                  Doanh thu theo danh mục
                </h2>
                <p className="font-body-sm text-xs text-secondary mt-0.5">
                  Tỷ trọng đóng góp GMV của 6 ngành hàng chủ đạo
                </p>
              </div>
              <span className="font-label-sm text-xs px-2.5 py-1 rounded bg-primary-fixed text-on-primary-fixed-variant font-semibold">
                100% Phân bổ
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {CATEGORY_SHARES.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-body-sm">
                    <span className="font-medium text-on-surface">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-data-tabular text-secondary">{cat.revenue}</span>
                      <span className="font-bold text-on-surface font-data-tabular w-9 text-right">
                        {cat.share}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color}`}
                      style={{ width: `${cat.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/20">
            <Link
              href="/admin/categories"
              className="font-body-sm text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span>Quản lý danh mục & hoa hồng</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
