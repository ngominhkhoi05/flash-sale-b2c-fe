"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import XLSX from "xlsx-js-style";
import { KpiCard } from "@/components/admin/KpiCard";
import {
  getAdminDashboardSummary,
  type AdminDashboardSummary,
} from "@/lib/api/admin";
import { formatVND } from "@/lib/utils";

type FilterMode = "DAY" | "MONTH" | "YEAR";

const CATEGORY_COLORS = [
  "bg-emerald-600",
  "bg-blue-600",
  "bg-amber-500",
  "bg-purple-600",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-slate-500",
];

// Bộ nhớ đệm module-level giữ số liệu dashboard tổng quan khi chuyển trang (0ms transition)
const dashboardCache = new Map<string, AdminDashboardSummary>();

export function AdminDashboardClient() {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDateStr = today.toISOString().slice(0, 10);

  // Filter States
  const [filterMode, setFilterMode] = useState<FilterMode>("MONTH");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string>(currentDateStr);

  // Popover state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Temp states for popover form
  const [tempMode, setTempMode] = useState<FilterMode>("MONTH");
  const [tempYear, setTempYear] = useState<number>(currentYear);
  const [tempMonth, setTempMonth] = useState<number>(currentMonth);
  const [tempDate, setTempDate] = useState<string>(currentDateStr);

  // Initial key for cache lookup
  const initialCacheKey = `MONTH_${currentYear}_${currentMonth}_${currentDateStr}`;

  // Data states
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(() => dashboardCache.get(initialCacheKey) || null);
  const [isLoading, setIsLoading] = useState(!dashboardCache.has(initialCacheKey));
  const [isExporting, setIsExporting] = useState(false);

  // Hover state for interactive chart tooltip
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDatePickerOpen]);

  // Load summary data from API
  const loadDashboard = useCallback(async () => {
    const key = `${filterMode}_${selectedYear}_${selectedMonth}_${selectedDate}`;
    if (!dashboardCache.has(key)) {
      setIsLoading(true);
    }
    try {
      const res = await getAdminDashboardSummary({
        periodType: filterMode,
        year: selectedYear,
        month: selectedMonth,
        date: selectedDate,
      });
      dashboardCache.set(key, res);
      setSummary(res);
    } catch (err) {
      console.error("Lỗi tải dữ liệu dashboard:", err);
      if (!dashboardCache.has(key)) {
        toast.error("Không thể tải dữ liệu báo cáo tổng quan từ máy chủ.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, selectedYear, selectedMonth, selectedDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  // Apply filter from popover
  const handleApplyFilter = () => {
    setFilterMode(tempMode);
    setSelectedYear(tempYear);
    setSelectedMonth(tempMonth);
    setSelectedDate(tempDate);
    setIsDatePickerOpen(false);
  };

  // Open popover and sync temp states
  const handleOpenPopover = () => {
    setTempMode(filterMode);
    setTempYear(selectedYear);
    setTempMonth(selectedMonth);
    setTempDate(selectedDate);
    setIsDatePickerOpen(true);
  };

  // Current display label
  const periodDisplayLabel = useMemo(() => {
    if (summary?.periodLabel) return summary.periodLabel;
    if (filterMode === "DAY") {
      const parts = selectedDate.split("-");
      if (parts.length === 3) return `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
      return `Ngày ${selectedDate}`;
    }
    if (filterMode === "YEAR") return `Năm ${selectedYear}`;
    return `Tháng ${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;
  }, [summary?.periodLabel, filterMode, selectedDate, selectedMonth, selectedYear]);

  // Xuất file Excel (.xlsx) đa sheet dựa vào dữ liệu đang lọc
  // Xuất file Excel (.xlsx) chuyên nghiệp đa khối & đa sheet dựa vào dữ liệu đang lọc
  const handleExport = () => {
    if (!summary) {
      toast.error("Chưa có dữ liệu báo cáo để xuất.");
      return;
    }

    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const exportTime = new Date().toLocaleString("vi-VN");

      // ==========================================
      // SHEET 1: BÁO CÁO TỔNG HỢP TOÀN DIỆN (Executive Report)
      // ==========================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mainRows: any[][] = [];
      const mainMerges: XLSX.Range[] = [];

      // Dòng 1: Tên Sàn
      mainRows.push(["SÀN THƯƠNG MẠI ĐIỆN TỬ VIBE MART MARKETPLACE", "", "", "", "", ""]);
      mainMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });

      // Dòng 2: Tiêu đề Báo Cáo
      mainRows.push(["BÁO CÁO HIỆU SUẤT HOẠT ĐỘNG & TỔNG QUAN KINH DOANH", "", "", "", "", ""]);
      mainMerges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });

      // Dòng 3: Metadata
      mainRows.push([
        `Kỳ thống kê: ${summary.periodLabel}   |   Thời gian xuất: ${exportTime}   |   Người lập: Ban Quản Trị Hệ Thống (Admin)`,
        "",
        "",
        "",
        "",
        "",
      ]);
      mainMerges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });

      mainRows.push([""]); // Dòng cách quãng

      // --- PHẦN I: CHỈ SỐ KINH DOANH CHÍNH (KPI) ---
      const rKpi = mainRows.length;
      mainRows.push(["I. BẢNG CHỈ SỐ HOẠT ĐỘNG KINH DOANH CỐT LÕI (KPI TOÀN SÀN)", "", "", "", "", ""]);
      mainMerges.push({ s: { r: rKpi, c: 0 }, e: { r: rKpi, c: 5 } });

      mainRows.push(["STT", "Chỉ số hoạt động", "Đơn vị tính", "Kỳ này (Thực tế)", "Tăng trưởng kỳ trước (%)", "Đánh giá"]);
      mainRows.push([
        1,
        "Tổng doanh thu toàn sàn (GMV)",
        "VNĐ",
        summary.totalRevenue,
        `${summary.revenueGrowthPercent > 0 ? "+" : ""}${summary.revenueGrowthPercent}%`,
        summary.revenueGrowthPercent >= 0 ? "Tăng trưởng dương" : "Giảm sút",
      ]);
      mainRows.push([
        2,
        "Tổng số đơn hàng hoàn tất",
        "Đơn hàng",
        summary.totalOrders,
        `${summary.ordersGrowthPercent > 0 ? "+" : ""}${summary.ordersGrowthPercent}%`,
        summary.ordersGrowthPercent >= 0 ? "Tăng trưởng dương" : "Giảm sút",
      ]);
      mainRows.push([
        3,
        "Người dùng / Khách hàng mới đăng ký",
        "Người dùng",
        summary.newUsers,
        `${summary.usersGrowthPercent > 0 ? "+" : ""}${summary.usersGrowthPercent}%`,
        summary.usersGrowthPercent >= 0 ? "Mở rộng người dùng" : "Ổn định",
      ]);
      mainRows.push([
        4,
        "Gian hàng mới thành lập trên sàn",
        "Gian hàng",
        summary.newStores,
        `${summary.storesGrowthPercent > 0 ? "+" : ""}${summary.storesGrowthPercent}%`,
        summary.storesGrowthPercent >= 0 ? "Gia tăng đối tác" : "Ổn định",
      ]);

      mainRows.push([""]); // Dòng cách quãng

      // --- PHẦN II: NHIỆM VỤ VẬN HÀNH & KIỂM DUYỆT ---
      const rSla = mainRows.length;
      mainRows.push(["II. NHIỆM VỤ VẬN HÀNH & KIỂM DUYỆT HỆ THỐNG (CAM KẾT SLA ≤ 2 GIỜ)", "", "", "", "", ""]);
      mainMerges.push({ s: { r: rSla, c: 0 }, e: { r: rSla, c: 5 } });

      mainRows.push(["STT", "Hạng mục kiểm duyệt", "Đơn vị tính", "Số lượng tồn đọng", "Cam kết SLA", "Mức độ ưu tiên"]);
      mainRows.push([
        1,
        "Gian hàng mới đăng ký chờ duyệt hồ sơ",
        "Hồ sơ",
        summary.pendingTasks.pendingStores,
        "≤ 2 giờ",
        summary.pendingTasks.pendingStores > 0 ? "Cần xử lý ngay" : "Đã hoàn thành",
      ]);
      mainRows.push([
        2,
        "Sản phẩm đăng ký Flash Sale chờ xét duyệt",
        "Sản phẩm",
        summary.pendingTasks.pendingFlashSaleItems,
        "≤ 2 giờ",
        summary.pendingTasks.pendingFlashSaleItems > 0 ? "Cần xử lý ngay" : "Đã hoàn thành",
      ]);
      mainRows.push([
        3,
        "Yêu cầu rút tiền từ ví người bán chờ duyệt",
        "Yêu cầu",
        summary.pendingTasks.pendingWithdrawals,
        "≤ 2 giờ",
        summary.pendingTasks.pendingWithdrawals > 0 ? "Cần xử lý ngay" : "Đã hoàn thành",
      ]);

      mainRows.push([""]); // Dòng cách quãng

      // --- PHẦN III: TOP GIAN HÀNG DOANH THU CAO NHẤT ---
      const rStore = mainRows.length;
      mainRows.push([`III. BẢNG XẾP HẠNG TOP GIAN HÀNG DOANH THU XUẤT SẮC TRONG KỲ (${summary.periodLabel})`, "", "", "", "", ""]);
      mainMerges.push({ s: { r: rStore, c: 0 }, e: { r: rStore, c: 5 } });

      mainRows.push(["Thứ hạng", "Tên gian hàng", "Pháp nhân / Chủ shop", "Doanh thu GMV (VNĐ)", "Số đơn hàng", "Doanh thu TB / Đơn (VNĐ)"]);
      if (summary.topStores.length === 0) {
        mainRows.push(["-", "Chưa có phát sinh giao dịch trong kỳ này", "-", 0, 0, 0]);
      } else {
        summary.topStores.forEach((st, idx) => {
          const avgPerOrder = st.orders > 0 ? Math.round(st.revenue / st.orders) : 0;
          mainRows.push([
            idx + 1,
            st.name,
            st.legalName || st.name,
            st.revenue,
            st.orders,
            avgPerOrder,
          ]);
        });
      }

      mainRows.push([""]); // Dòng cách quãng

      // --- PHẦN IV: CƠ CẤU DOANH THU THEO DANH MỤC NGÀNH HÀNG ---
      const rCat = mainRows.length;
      mainRows.push([`IV. CƠ CẤU DOANH THU THEO DANH MỤC NGÀNH HÀNG (${summary.periodLabel})`, "", "", "", "", ""]);
      mainMerges.push({ s: { r: rCat, c: 0 }, e: { r: rCat, c: 5 } });

      mainRows.push(["STT", "Ngành hàng / Danh mục", "Doanh thu đóng góp (VNĐ)", "Tỷ trọng GMV (%)", "Phân loại", "Ghi chú"]);
      if (summary.categoryShares.length === 0) {
        mainRows.push(["-", "Chưa có phát sinh ngành hàng trong kỳ này", 0, "0%", "-", "-"]);
      } else {
        summary.categoryShares.forEach((cat, idx) => {
          mainRows.push([
            idx + 1,
            cat.name,
            cat.revenue,
            `${cat.sharePercentage}%`,
            cat.sharePercentage >= 20 ? "Chủ lực" : "Tiềm năng",
            "",
          ]);
        });
      }

      mainRows.push([""]); // Dòng cách quãng

      // --- PHẦN V: DIỄN BIẾN THEO THỜI GIAN ---
      const rChart = mainRows.length;
      mainRows.push([`V. DIỄN BIẾN DOANH THU & ĐƠN HÀNG THEO CHUỖI THỜI GIAN (${summary.periodLabel})`, "", "", "", "", ""]);
      mainMerges.push({ s: { r: rChart, c: 0 }, e: { r: rChart, c: 5 } });

      mainRows.push(["STT", "Mốc thời gian", "Doanh thu GMV (VNĐ)", "Số đơn hàng", "Doanh thu TB / Đơn (VNĐ)", "Ghi chú"]);
      if (summary.chartPoints.length === 0) {
        mainRows.push(["-", "Chưa có phát sinh dữ liệu trong kỳ này", 0, 0, 0, "-"]);
      } else {
        summary.chartPoints.forEach((pt, idx) => {
          const avg = pt.orders > 0 ? Math.round(pt.revenue / pt.orders) : 0;
          mainRows.push([
            idx + 1,
            pt.label,
            pt.revenue,
            pt.orders,
            avg,
            "",
          ]);
        });
      }

      mainRows.push([""]);
      mainRows.push([""]);

      // Chữ ký xác nhận chuyên nghiệp
      const rSign = mainRows.length;
      mainRows.push(["", "NGƯỜI LẬP BÁO CÁO", "", "", "GIÁM ĐỐC ĐIỀU HÀNH VẬN HÀNH", ""]);
      mainMerges.push({ s: { r: rSign, c: 1 }, e: { r: rSign, c: 2 } });
      mainMerges.push({ s: { r: rSign, c: 4 }, e: { r: rSign, c: 5 } });

      mainRows.push(["", "(Ký và ghi rõ họ tên)", "", "", "(Ký tên và đóng dấu)", ""]);
      mainMerges.push({ s: { r: rSign + 1, c: 1 }, e: { r: rSign + 1, c: 2 } });
      mainMerges.push({ s: { r: rSign + 1, c: 4 }, e: { r: rSign + 1, c: 5 } });

      const wsMain = XLSX.utils.aoa_to_sheet(mainRows);
      wsMain["!merges"] = mainMerges;
      wsMain["!cols"] = [
        { wch: 8 },   // STT / Hạng
        { wch: 38 },  // Tên chỉ số / Tên gian hàng / Ngành hàng
        { wch: 24 },  // Đơn vị tính / Pháp nhân
        { wch: 26 },  // Doanh thu (VNĐ)
        { wch: 24 },  // Tăng trưởng / Số đơn
        { wch: 24 },  // Đánh giá / Doanh thu TB
      ];

      // Định nghĩa bảng màu & typography chuẩn Corporate sang trọng
      const styleBrandHeader = {
        font: { name: "Segoe UI", sz: 13, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "center", vertical: "center" },
      };

      const styleReportTitle = {
        font: { name: "Segoe UI", sz: 16, bold: true, color: { rgb: "047857" } },
        alignment: { horizontal: "center", vertical: "center" },
      };

      const styleMetadata = {
        font: { name: "Segoe UI", sz: 10, italic: true, color: { rgb: "64748B" } },
        alignment: { horizontal: "center", vertical: "center" },
      };

      const styleSectionHeader = {
        font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "065F46" } },
        fill: { fgColor: { rgb: "ECFDF5" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "A7F3D0" } },
          bottom: { style: "thin", color: { rgb: "A7F3D0" } },
        },
      };

      const styleTableHeader = {
        font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "059669" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "047857" } },
          bottom: { style: "medium", color: { rgb: "047857" } },
          left: { style: "thin", color: { rgb: "34D399" } },
          right: { style: "thin", color: { rgb: "34D399" } },
        },
      };

      const styleCellDefault = {
        font: { name: "Segoe UI", sz: 10, color: { rgb: "1E293B" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } },
        },
      };

      const sectionRows = new Set([rKpi, rSla, rStore, rCat, rChart]);
      const tableHeaderRows = new Set([rKpi + 1, rSla + 1, rStore + 1, rCat + 1, rChart + 1]);

      // Duyệt qua tất cả các ô của wsMain để gán style in đậm, căn giữa và màu sắc
      Object.keys(wsMain).forEach((k) => {
        if (k.startsWith("!")) return;
        const cell = wsMain[k];
        if (!cell) return;
        const decoded = XLSX.utils.decode_cell(k);
        const r = decoded.r;
        const c = decoded.c;

        if (r === 0) {
          cell.s = styleBrandHeader;
        } else if (r === 1) {
          cell.s = styleReportTitle;
        } else if (r === 2) {
          cell.s = styleMetadata;
        } else if (sectionRows.has(r)) {
          cell.s = styleSectionHeader;
        } else if (tableHeaderRows.has(r)) {
          cell.s = styleTableHeader;
        } else if (r === rSign) {
          cell.s = {
            font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "0F172A" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        } else if (r === rSign + 1) {
          cell.s = {
            font: { name: "Segoe UI", sz: 9, italic: true, color: { rgb: "64748B" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        } else if (cell.v !== undefined && cell.v !== "") {
          const isNum = typeof cell.v === "number";
          const align = c === 0 || c === 2 ? "center" : isNum ? "right" : "left";
          cell.s = {
            ...styleCellDefault,
            alignment: { horizontal: align, vertical: "center" },
          };
          if (isNum) {
            cell.t = "n";
            cell.z = "#,##0";
          }
        }
      });

      XLSX.utils.book_append_sheet(wb, wsMain, "Bao_Cao_Tong_Quan");

      // ==========================================
      // SHEET 2: CHI TIẾT TOP GIAN HÀNG
      // ==========================================
      const storeHeaders = [["Thứ hạng", "Tên gian hàng", "Pháp nhân / Chủ shop", "Doanh thu GMV (VNĐ)", "Số đơn hàng hoàn tất", "Doanh thu TB / Đơn (VNĐ)"]];
      const storeRows = summary.topStores.map((st, idx) => [
        idx + 1,
        st.name,
        st.legalName || st.name,
        st.revenue,
        st.orders,
        st.orders > 0 ? Math.round(st.revenue / st.orders) : 0,
      ]);
      const wsStores = XLSX.utils.aoa_to_sheet([...storeHeaders, ...storeRows]);
      wsStores["!cols"] = [{ wch: 10 }, { wch: 32 }, { wch: 30 }, { wch: 24 }, { wch: 20 }, { wch: 24 }];
      Object.keys(wsStores).forEach((k) => {
        if (k.startsWith("!")) return;
        const cell = wsStores[k];
        if (!cell) return;
        const decoded = XLSX.utils.decode_cell(k);
        if (decoded.r === 0) {
          cell.s = styleTableHeader;
        } else {
          const isNum = typeof cell.v === "number";
          const align = decoded.c === 0 ? "center" : isNum ? "right" : "left";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
          if (isNum) {
            cell.t = "n";
            cell.z = "#,##0";
          }
        }
      });
      XLSX.utils.book_append_sheet(wb, wsStores, "Top_Gian_Hang");

      // ==========================================
      // SHEET 3: CHI TIẾT DIỄN BIẾN THEO THỜI GIAN
      // ==========================================
      const chartHeaders = [["STT", "Mốc thời gian", "Doanh thu GMV (VNĐ)", "Số đơn hàng", "Doanh thu TB / Đơn (VNĐ)"]];
      const chartRows = summary.chartPoints.map((pt, idx) => [
        idx + 1,
        pt.label,
        pt.revenue,
        pt.orders,
        pt.orders > 0 ? Math.round(pt.revenue / pt.orders) : 0,
      ]);
      const wsChart = XLSX.utils.aoa_to_sheet([...chartHeaders, ...chartRows]);
      wsChart["!cols"] = [{ wch: 8 }, { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 24 }];
      Object.keys(wsChart).forEach((k) => {
        if (k.startsWith("!")) return;
        const cell = wsChart[k];
        if (!cell) return;
        const decoded = XLSX.utils.decode_cell(k);
        if (decoded.r === 0) {
          cell.s = styleTableHeader;
        } else {
          const isNum = typeof cell.v === "number";
          const align = decoded.c === 0 || decoded.c === 1 ? "center" : isNum ? "right" : "left";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
          if (isNum) {
            cell.t = "n";
            cell.z = "#,##0";
          }
        }
      });
      XLSX.utils.book_append_sheet(wb, wsChart, "Dien_Bien_Thoi_Gian");

      // ==========================================
      // SHEET 4: DOANH THU THEO NGÀNH HÀNG
      // ==========================================
      const catHeaders = [["STT", "Ngành hàng / Danh mục", "Doanh thu đóng góp (VNĐ)", "Tỷ trọng GMV (%)"]];
      const catRows = summary.categoryShares.map((cat, idx) => [
        idx + 1,
        cat.name,
        cat.revenue,
        `${cat.sharePercentage}%`,
      ]);
      const wsCats = XLSX.utils.aoa_to_sheet([...catHeaders, ...catRows]);
      wsCats["!cols"] = [{ wch: 8 }, { wch: 32 }, { wch: 26 }, { wch: 22 }];
      Object.keys(wsCats).forEach((k) => {
        if (k.startsWith("!")) return;
        const cell = wsCats[k];
        if (!cell) return;
        const decoded = XLSX.utils.decode_cell(k);
        if (decoded.r === 0) {
          cell.s = styleTableHeader;
        } else {
          const isNum = typeof cell.v === "number";
          const align = decoded.c === 0 || decoded.c === 3 ? "center" : isNum ? "right" : "left";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
          if (isNum) {
            cell.t = "n";
            cell.z = "#,##0";
          }
        }
      });
      XLSX.utils.book_append_sheet(wb, wsCats, "Co_Cau_Nganh_Hang");

      // Ghi file Excel
      const cleanSlug = summary.periodLabel
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
      const fileName = `Bao-cao-tong-quan-${cleanSlug}-${today.toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Đã xuất báo cáo Excel theo ${summary.periodLabel} thành công!`);
    } catch (err) {
      console.error("Lỗi xuất file Excel:", err);
      toast.error("Có lỗi xảy ra khi tạo tệp Excel báo cáo.");
    } finally {
      setIsExporting(false);
    }
  };

  // Tính toán chỉ số cho biểu đồ SVG linh hoạt
  const chartPoints = useMemo(() => summary?.chartPoints || [], [summary?.chartPoints]);
  const maxRevenue = useMemo(() => {
    if (!chartPoints.length) return 1;
    const max = Math.max(...chartPoints.map((p) => p.revenue));
    return max > 0 ? max : 1;
  }, [chartPoints]);

  // Year choices for dropdown
  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex flex-col w-full gap-space-lg select-none">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Tổng quan hệ thống
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-xs bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
              {isLoading ? "Đang đồng bộ..." : "Dữ liệu thực tế"}
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary mt-0.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-secondary">update</span>
            Kỳ lọc:{" "}
            <span className="font-data-tabular font-bold text-emerald-700">
              {periodDisplayLabel}
            </span>
            <span className="text-slate-300">|</span>
            <span>Cập nhật: {today.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>

        {/* Filter & Export Actions */}
        <div className="flex items-center gap-space-sm flex-wrap relative">
          {/* Date Picker Button with Dropdown Modal */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={handleOpenPopover}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-800 font-medium text-sm shadow-xs hover:bg-slate-50 transition-all border border-slate-200 hover:border-emerald-500 group"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600 group-hover:scale-110 transition-transform">
                calendar_month
              </span>
              <span className="font-semibold">{periodDisplayLabel}</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-emerald-600 transition-colors">
                arrow_drop_down
              </span>
            </button>

            {/* Time Filter Popover Modal */}
            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">tune</span>
                    Chọn thời gian thống kê
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Mode Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setTempMode("MONTH")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      tempMode === "MONTH"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempMode("DAY")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      tempMode === "DAY"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Theo Ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempMode("YEAR")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      tempMode === "YEAR"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Theo Năm
                  </button>
                </div>

                {/* Form Content by Mode */}
                {tempMode === "MONTH" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">Chọn năm:</span>
                      <select
                        value={tempYear}
                        onChange={(e) => setTempYear(Number(e.target.value))}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-emerald-500"
                      >
                        {availableYears.map((y) => (
                          <option key={y} value={y}>
                            Năm {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTempMonth(m)}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                            tempMonth === m
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          Th {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tempMode === "DAY" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTempDate(currentDateStr)}
                        className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${
                          tempDate === currentDateStr
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Hôm nay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 1);
                          setTempDate(d.toISOString().slice(0, 10));
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                      >
                        Hôm qua
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600">Chọn ngày cụ thể:</label>
                      <input
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50"
                      />
                    </div>
                  </div>
                )}

                {tempMode === "YEAR" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {availableYears.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setTempYear(y)}
                          className={`py-3 text-xs font-semibold rounded-xl border transition-all ${
                            tempYear === y
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          Năm {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-xs transition-all disabled:opacity-60 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExporting ? "sync" : "file_download"}
            </span>
            <span className="font-semibold">{isExporting ? "Đang xuất Excel..." : "Xuất báo cáo"}</span>
          </button>
        </div>
      </div>

      {/* Realtime Alert Banner */}
      <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-emerald-50 text-emerald-950 shadow-xs border border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm sm:text-base text-emerald-900">
              Báo cáo hiệu suất Vibe Mart
            </span>
            <span className="text-emerald-400 font-bold">•</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
              Kỳ: {periodDisplayLabel}
            </span>
            <span className="text-emerald-400 font-bold">•</span>
            <span className="text-xs sm:text-sm text-emerald-800">
              {summary ? `${summary.totalOrders} đơn hàng phát sinh` : "Đang tính toán..."}
            </span>
          </div>
        </div>
        <Link
          href="/admin/flash-sale/monitor"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-emerald-700 text-xs sm:text-sm font-bold hover:bg-emerald-100/50 shadow-2xs border border-emerald-200 transition-all shrink-0"
        >
          <span>Giám sát Flash Sale</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <KpiCard
          title="Tổng doanh thu (GMV)"
          value={summary ? formatVND(summary.totalRevenue) : "0 ₫"}
          iconName="payments"
          isMockSample={false}
          trend={{
            direction: (summary?.revenueGrowthPercent || 0) > 0 ? "up" : (summary?.revenueGrowthPercent || 0) < 0 ? "down" : "neutral",
            percentage: Math.abs(summary?.revenueGrowthPercent || 0),
            comparisonText: "so với kỳ trước",
          }}
        />
        <KpiCard
          title="Đơn hàng toàn sàn"
          value={summary ? `${summary.totalOrders.toLocaleString("vi-VN")} đơn` : "0 đơn"}
          iconName="shopping_bag"
          isMockSample={false}
          trend={{
            direction: (summary?.ordersGrowthPercent || 0) > 0 ? "up" : (summary?.ordersGrowthPercent || 0) < 0 ? "down" : "neutral",
            percentage: Math.abs(summary?.ordersGrowthPercent || 0),
            comparisonText: "so với kỳ trước",
          }}
        />
        <KpiCard
          title="Người dùng mới"
          value={summary ? `${summary.newUsers.toLocaleString("vi-VN")}` : "0"}
          iconName="person_add"
          isMockSample={false}
          trend={{
            direction: (summary?.usersGrowthPercent || 0) > 0 ? "up" : (summary?.usersGrowthPercent || 0) < 0 ? "down" : "neutral",
            percentage: Math.abs(summary?.usersGrowthPercent || 0),
            comparisonText: "so với kỳ trước",
          }}
        />
        <KpiCard
          title="Gian hàng mới"
          value={summary ? `${summary.newStores.toLocaleString("vi-VN")}` : "0"}
          iconName="storefront"
          isMockSample={false}
          trend={{
            direction: (summary?.storesGrowthPercent || 0) > 0 ? "up" : (summary?.storesGrowthPercent || 0) < 0 ? "down" : "neutral",
            percentage: Math.abs(summary?.storesGrowthPercent || 0),
            comparisonText: "so với kỳ trước",
          }}
        />
      </div>

      {/* Row 2: Charts (8 cols) & Pending Tasks (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
        {/* Dynamic Interactive Chart Panel */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Diễn biến doanh thu & đơn hàng</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {periodDisplayLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thống kê thực tế tương ứng với kỳ đã chọn
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
                <span className="text-slate-600">GMV (VNĐ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-600">Số đơn hàng</span>
              </div>
            </div>
          </div>

          {/* Dynamic SVG Visual Chart Canvas */}
          <div className="relative w-full h-64 select-none">
            {chartPoints.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="material-symbols-outlined text-[32px]">bar_chart</span>
                <p className="text-xs font-semibold">Chưa có phát sinh dữ liệu trong kỳ này</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col justify-end">
                {/* Tooltip on hover */}
                {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3 z-10 pointer-events-none">
                    <span className="font-bold text-emerald-400">
                      {chartPoints[hoveredPointIndex].label}
                    </span>
                    <span>Doanh thu: <strong>{formatVND(chartPoints[hoveredPointIndex].revenue)}</strong></span>
                    <span>Đơn: <strong>{chartPoints[hoveredPointIndex].orders}</strong></span>
                  </div>
                )}

                {/* Bars & line grid */}
                <div className="flex items-end justify-between gap-1 w-full h-48 border-b border-slate-200 px-2 pb-1">
                  {chartPoints.map((pt, idx) => {
                    const heightPercent = maxRevenue > 0 ? Math.min(100, Math.max(4, (pt.revenue / maxRevenue) * 100)) : 4;
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        <div
                          className={`w-full max-w-[28px] rounded-t-md transition-all ${
                            isHovered
                              ? "bg-emerald-500 scale-y-105 shadow-sm"
                              : "bg-emerald-600/85 hover:bg-emerald-500"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 pt-2 overflow-x-hidden">
                  {chartPoints.map((pt, idx) => {
                    // Show reduced labels if too many points
                    const step = Math.ceil(chartPoints.length / 10);
                    if (idx % step !== 0 && idx !== chartPoints.length - 1) {
                      return <span key={idx} className="flex-1 text-center opacity-0" />;
                    }
                    return (
                      <span key={idx} className="flex-1 text-center font-mono truncate font-medium">
                        {pt.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-slate-500 text-xs bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 gap-2">
            <span>
              Tổng GMV: <strong className="text-slate-900 font-bold">{summary ? formatVND(summary.totalRevenue) : "0 ₫"}</strong>
            </span>
            <span>
              Tổng đơn: <strong className="text-slate-900 font-bold">{summary ? summary.totalOrders : 0} đơn</strong>
            </span>
            <span>
              Kỳ thống kê: <strong className="text-emerald-700 font-bold">{periodDisplayLabel}</strong>
            </span>
          </div>
        </div>

        {/* Pending Tasks Panel */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Nhiệm vụ chờ duyệt</h2>
                <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  {summary
                    ? summary.pendingTasks.pendingStores +
                      summary.pendingTasks.pendingFlashSaleItems +
                      summary.pendingTasks.pendingWithdrawals
                    : 0}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Các yêu cầu cần quản trị viên xử lý ngay
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Item 1: Stores */}
              <Link
                href="/admin/stores"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors group border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      Gian hàng chờ duyệt
                    </span>
                    <span className="text-xs text-slate-500">
                      Hồ sơ đăng ký kinh doanh mới
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-blue-100 text-blue-800">
                    {summary?.pendingTasks.pendingStores || 0}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </Link>

              {/* Item 2: Flash Sale */}
              <Link
                href="/admin/flash-sale/approvals"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors group border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <span className="material-symbols-outlined text-[20px]">flash_on</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      Sản phẩm Flash Sale
                    </span>
                    <span className="text-xs text-slate-500">
                      Đăng ký khung giờ tới
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-amber-100 text-amber-800">
                    {summary?.pendingTasks.pendingFlashSaleItems || 0}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </Link>

              {/* Item 3: Withdrawals */}
              <Link
                href="/admin/reconciliation"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors group border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      Yêu cầu rút tiền
                    </span>
                    <span className="text-xs text-slate-500">
                      Ví doanh thu Người bán
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-100 text-emerald-800">
                    {summary?.pendingTasks.pendingWithdrawals || 0}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-400 uppercase font-semibold">
              Tự động hóa SLA
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đang bật (≤ 2 giờ)
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Top Stores & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-stretch">
        {/* Top Stores Table Card */}
        <div className="p-6 rounded-2xl bg-white shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Top gian hàng theo doanh thu
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xếp hạng đối tác lớn nhất trong {periodDisplayLabel}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Top Doanh Thu
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <th className="py-2.5 px-3 rounded-l-lg">Gian hàng</th>
                    <th className="py-2.5 px-3 text-right">Doanh thu</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Số đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {!summary || summary.topStores.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 text-xs font-medium">
                        Chưa có đơn hàng phát sinh trong kỳ này
                      </td>
                    </tr>
                  ) : (
                    summary.topStores.map((store, idx) => (
                      <tr key={store.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <Image
                              src={store.avatarUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=120&auto=format&fit=crop&q=80"}
                              alt={store.name}
                              width={36}
                              height={36}
                              unoptimized
                              className="w-9 h-9 rounded-full object-cover shadow-2xs shrink-0 bg-slate-100"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 truncate">
                                {store.name}
                              </span>
                              <span className="text-xs text-slate-400 truncate">
                                {store.legalName || "Chủ gian hàng"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatVND(store.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 font-medium text-xs">
                          {store.orders} đơn
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
            <Link
              href="/admin/stores"
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Xem toàn bộ danh sách gian hàng</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Category Revenue Progress Bar Card */}
        <div className="p-6 rounded-2xl bg-white shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Doanh thu theo danh mục
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tỷ trọng đóng góp GMV của các ngành hàng trong {periodDisplayLabel}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
                Cơ cấu ngành
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {!summary || summary.categoryShares.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-xs font-medium">
                  Chưa có dữ liệu danh mục hàng hóa
                </p>
              ) : (
                summary.categoryShares.map((cat, idx) => {
                  const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div key={cat.categoryId || idx} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">{formatVND(cat.revenue)}</span>
                          <span className="font-bold text-slate-900 w-11 text-right font-mono">
                            {cat.sharePercentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                          style={{ width: `${Math.min(100, Math.max(0, cat.sharePercentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
            <Link
              href="/admin/categories"
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
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
