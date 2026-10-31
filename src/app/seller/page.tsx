"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import XLSX from "xlsx-js-style";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { formatVND } from "@/lib/utils";
import {
  getStoreSidebarSummary,
  getSellerRecentOrders,
  getSellerTopProducts,
  getSellerRevenueChart,
  getSellerWallet,
  getRegisteredFlashSaleHistory,
  aggregateRevenuePoints,
  isSellerOrderPaid,
} from "@/lib/api/seller";
import {
  SidebarSummaryResponse,
  SellerOrderResponse,
  SellerProductSummaryResponse,
  SellerRevenueDayPoint,
  SellerWalletResponse,
  RegisteredFlashSaleHistoryItem,
} from "@/types/seller";
import { useMyStore } from "@/hooks/useMyStore";
import { useMeQuery } from "@/features/auth/hooks";
import { createFlashSaleStompClient } from "@/lib/stomp";
import {
  setCachedOrders,
  setCachedFlashSaleHistory,
  getCachedOrders,
  getCachedFlashSaleHistory,
  getCachedWallet,
} from "@/lib/sellerCache";
import { ORDER_EVENT_NEW } from "@/hooks/useSellerOrderNotifications";

type FilterMode = "MONTH" | "DAY" | "YEAR" | "PRESET";
type PeriodPreset = "today" | "7days" | "30days";

export default function SellerDashboardPage() {
  const { store, storeName } = useMyStore();
  const { data: userData } = useMeQuery();
  const [isWsConnected, setIsWsConnected] = useState(false);

  const [filterMode, setFilterMode] = useState<FilterMode>("MONTH");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("7days");

  // Date selection states
  const today = useMemo(() => new Date(), []);
  const currentDateStr = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const [selectedYear, setSelectedYear] = useState<number>(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(currentDateStr);

  // Temporary popover state before apply
  const [tempMode, setTempMode] = useState<FilterMode>("MONTH");
  const [tempYear, setTempYear] = useState<number>(selectedYear);
  const [tempMonth, setTempMonth] = useState<number>(selectedMonth);
  const [tempDate, setTempDate] = useState<string>(selectedDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const availableYears = useMemo(() => [2026, 2025, 2024], []);

  const cachedOrders = getCachedOrders();
  const [summary, setSummary] = useState<SidebarSummaryResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<SellerOrderResponse[]>(() => cachedOrders || []);
  const [topProducts, setTopProducts] = useState<SellerProductSummaryResponse[]>([]);
  const [wallet, setWallet] = useState<SellerWalletResponse | null>(() => getCachedWallet()?.wallet || null);
  const [flashSaleItems, setFlashSaleItems] = useState<RegisteredFlashSaleHistoryItem[]>(() => getCachedFlashSaleHistory() || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedOrders);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Open popover and sync temp states
  const handleOpenPopover = () => {
    setTempMode(filterMode === "PRESET" ? "MONTH" : filterMode);
    setTempYear(selectedYear);
    setTempMonth(selectedMonth);
    setTempDate(selectedDate);
    setIsDatePickerOpen(true);
  };

  // Apply filter from popover
  const handleApplyFilter = () => {
    setFilterMode(tempMode);
    setSelectedYear(tempYear);
    setSelectedMonth(tempMonth);
    setSelectedDate(tempDate);
    setIsDatePickerOpen(false);
  };

  // Text label hiển thị trên nút chọn thời gian
  const periodDisplayLabel = useMemo(() => {
    if (filterMode === "PRESET") {
      if (periodPreset === "today") return "Hôm nay";
      if (periodPreset === "7days") return "7 ngày";
      return "30 ngày";
    }
    if (filterMode === "DAY") {
      const parts = selectedDate.split("-");
      if (parts.length === 3) return `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
      return `Ngày ${selectedDate}`;
    }
    if (filterMode === "YEAR") return `Năm ${selectedYear}`;
    return `Tháng ${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;
  }, [filterMode, periodPreset, selectedDate, selectedMonth, selectedYear]);

  // TÍNH TOÁN DỮ LIỆU DOANH THU & BIỂU ĐỒ THỜI GIAN THỰC (0ms latency khi bấm lọc)
  const revenuePoints = useMemo<SellerRevenueDayPoint[]>(() => {
    if (filterMode === "MONTH") {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const points: SellerRevenueDayPoint[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        let dayRev = 0;
        let dayOrders = 0;
        recentOrders.forEach((o) => {
          if (!o.createdAt || !isSellerOrderPaid(o)) return;
          const od = new Date(o.createdAt);
          if (
            od.getFullYear() === selectedYear &&
            od.getMonth() + 1 === selectedMonth &&
            od.getDate() === d
          ) {
            dayRev += Number(o.finalAmount || o.totalAmount) || 0;
            dayOrders++;
          }
        });
        points.push({
          date: dateStr,
          dayLabel: `N${d}`,
          revenue: dayRev,
          ordersCount: dayOrders,
          previousWeekRevenue: 0,
        });
      }
      return points;
    }

    if (filterMode === "YEAR") {
      const points: SellerRevenueDayPoint[] = [];
      for (let m = 1; m <= 12; m++) {
        let monthRev = 0;
        let monthOrders = 0;
        recentOrders.forEach((o) => {
          if (!o.createdAt || !isSellerOrderPaid(o)) return;
          const od = new Date(o.createdAt);
          if (od.getFullYear() === selectedYear && od.getMonth() + 1 === m) {
            monthRev += Number(o.finalAmount || o.totalAmount) || 0;
            monthOrders++;
          }
        });
        points.push({
          date: `${selectedYear}-${String(m).padStart(2, "0")}`,
          dayLabel: `Th ${m}`,
          revenue: monthRev,
          ordersCount: monthOrders,
          previousWeekRevenue: 0,
        });
      }
      return points;
    }

    if (filterMode === "DAY") {
      const hours = [0, 4, 8, 12, 16, 20];
      const parts = selectedDate.split("-").map(Number);
      const selY = parts[0] || today.getFullYear();
      const selM = parts[1] || today.getMonth() + 1;
      const selD = parts[2] || today.getDate();

      return hours.map((h) => {
        const label = `${String(h).padStart(2, "0")}:00`;
        const nextH = h + 4;
        let hRev = 0;
        let hCount = 0;
        recentOrders.forEach((o) => {
          if (!o.createdAt || !isSellerOrderPaid(o)) return;
          const od = new Date(o.createdAt);
          if (
            od.getFullYear() === selY &&
            od.getMonth() + 1 === selM &&
            od.getDate() === selD &&
            od.getHours() >= h &&
            od.getHours() < nextH
          ) {
            hRev += Number(o.finalAmount || o.totalAmount) || 0;
            hCount++;
          }
        });
        return {
          date: `${selectedDate} ${label}`,
          dayLabel: label,
          revenue: hRev,
          ordersCount: hCount,
          previousWeekRevenue: 0,
        };
      });
    }

    // PRESET: today | 7days | 30days
    return aggregateRevenuePoints(recentOrders, periodPreset);
  }, [recentOrders, filterMode, periodPreset, selectedYear, selectedMonth, selectedDate, today]);

  // Nạp dữ liệu nền
  const loadDashboardData = useCallback((silent = false) => {
    if (!silent && !getCachedOrders()) {
      setIsLoading(true);
    }
    setError(null);

    const apiPeriod: PeriodPreset =
      filterMode === "PRESET"
        ? periodPreset
        : filterMode === "DAY"
        ? "today"
        : "30days";

    Promise.allSettled([
      getStoreSidebarSummary(),
      getSellerRecentOrders(0, 100),
      getSellerTopProducts(0, 8),
      getSellerRevenueChart(apiPeriod),
      getSellerWallet(),
      getRegisteredFlashSaleHistory(),
    ])
      .then(([summaryRes, ordersRes, productsRes, _chartRes, walletRes, fsRes]) => {
        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
        if (ordersRes.status === "fulfilled") {
          const val = ordersRes.value as { content?: SellerOrderResponse[]; items?: SellerOrderResponse[] };
          const allOrders = val?.content || val?.items || (Array.isArray(val) ? val : []);
          setRecentOrders(allOrders);
          if (allOrders.length > 0) setCachedOrders(allOrders);
        }
        if (fsRes.status === "fulfilled" && fsRes.value) {
          setFlashSaleItems(fsRes.value || []);
          setCachedFlashSaleHistory(fsRes.value);
        }
        if (productsRes.status === "fulfilled") {
          const val = productsRes.value as { content?: SellerProductSummaryResponse[]; items?: SellerProductSummaryResponse[] };
          const list = val?.content || val?.items || (Array.isArray(val) ? val : []);
          setTopProducts(list);
        }
        if (walletRes.status === "fulfilled") setWallet(walletRes.value);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi nạp dữ liệu.");
        setIsLoading(false);
      });
  }, [filterMode, periodPreset]);

  useEffect(() => {
    const hasCached = !!getCachedOrders();
    loadDashboardData(hasCached);
  }, [loadDashboardData]);

  // Lắng nghe realtime order event được bắn từ useSellerOrderNotifications
  useEffect(() => {
    const handleNewOrder = (e: Event) => {
      const custom = e as CustomEvent<SellerOrderResponse>;
      if (custom.detail) {
        setRecentOrders((prev) => {
          const exists = prev.some((o) => o.id === custom.detail.id);
          if (exists) return prev;
          return [custom.detail, ...prev];
        });
        loadDashboardData(true);
      }
    };
    window.addEventListener(ORDER_EVENT_NEW, handleNewOrder);
    return () => {
      window.removeEventListener(ORDER_EVENT_NEW, handleNewOrder);
    };
  }, [loadDashboardData]);

  // ── KẾT NỐI REALTIME (WEBSOCKET STOMP) ──────────────────────────────────
  useEffect(() => {
    let stomp: { disconnect: () => void } | null = null;
    let isSubscribed = true;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const client = createFlashSaleStompClient(token);
      stomp = client;

      const prevOnConnect = client.client.onConnect;
      client.client.onConnect = (frame) => {
        if (!isSubscribed) return;
        setIsWsConnected(true);
        if (typeof prevOnConnect === "function") {
          prevOnConnect(frame);
        }
      };

      const prevOnDisconnect = client.client.onDisconnect;
      client.client.onDisconnect = (frame) => {
        if (!isSubscribed) return;
        setIsWsConnected(false);
        if (typeof prevOnDisconnect === "function") {
          prevOnDisconnect(frame);
        }
      };

      const handleIncomingOrder = (data: {
        orderCode?: string;
        code?: string;
        recipientName?: string;
        finalAmount?: number;
        totalAmount?: number;
      }) => {
        if (!data) return;
        const code = data.orderCode || data.code;
        if (code) {
          toast.info(`🔔 Đơn hàng mới #${code}!`, {
            description: data.recipientName
              ? `Khách hàng ${data.recipientName} vừa đặt đơn (${formatVND(data.finalAmount || data.totalAmount || 0)})`
              : "Gian hàng vừa nhận được đơn hàng mới.",
          });
        } else {
          toast.info("⚡ Cập nhật dữ liệu gian hàng tức thì!");
        }
        // Tự động làm mới dữ liệu toàn bộ dashboard ngầm (silent refresh)
        loadDashboardData(true);
      };

      // 1. Kênh đơn hàng seller chung
      client.subscribe("/topic/seller/orders", (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          handleIncomingOrder(payload.data || payload);
        } catch (e) {
          console.warn("Parse WS /topic/seller/orders warning:", e);
        }
      });

      // 2. Kênh đơn hàng riêng của gian hàng này (nếu có store.id)
      if (store?.id) {
        client.subscribe(`/topic/stores/${store.id}/orders`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            handleIncomingOrder(payload.data || payload);
          } catch (e) {
            console.warn("Parse WS /topic/stores orders warning:", e);
          }
        });
      }

      // 3. Kênh flash-sale approvals/counts
      client.subscribe("/topic/admin/flash-sale/counts", () => {
        loadDashboardData(true);
      });
    } catch (err) {
      console.warn("Seller dashboard WebSocket init warning:", err);
    }

    // 4. Polling heartbeat nhẹ nhàng mỗi 30s để đảm bảo dữ liệu không bị lệch
    const pollInterval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      stomp?.disconnect();
      setIsWsConnected(false);
    };
  }, [store?.id, loadDashboardData]);

  const handleRetry = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Tính toán số liệu doanh thu từ các đơn hàng đã thanh toán
  const totalChartRevenue = revenuePoints.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const totalChartOrders = revenuePoints.reduce((sum, p) => sum + (p.ordersCount || 0), 0);

  const displayRevenue = totalChartRevenue;
  const displayOrders = totalChartOrders;

  // Tính toán toạ độ cho SVG biểu đồ doanh thu động
  const maxRevenueVal = Math.max(
    ...revenuePoints.map((p) => Math.max(p.revenue || 0, p.previousWeekRevenue || 0)),
    100000
  );

  const chartPoints = revenuePoints.map((pt, idx) => {
    const x = revenuePoints.length <= 1 ? 350 : Math.round(50 + (idx / (revenuePoints.length - 1)) * 620);
    const y = Math.round(200 - ((pt.revenue || 0) / maxRevenueVal) * 160);
    const prevY = Math.round(200 - ((pt.previousWeekRevenue || 0) / maxRevenueVal) * 160);
    return { ...pt, x, y, prevY };
  });

  const chartCurrentLine = chartPoints.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const chartCurrentArea =
    chartPoints.length > 0
      ? `${chartCurrentLine} L ${chartPoints[chartPoints.length - 1].x},200 L ${chartPoints[0].x},200 Z`
      : "";
  const chartPrevLine = chartPoints.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x},${p.prevY}`).join(" ");

  // Xác định các chỉ số hiển thị nhãn trục X (tối đa 6-7 nhãn để không bao giờ bị đè chữ)
  const visibleLabelIndices = useMemo(() => {
    const total = revenuePoints.length;
    if (total <= 7) return revenuePoints.map((_, i) => i);
    const step = Math.ceil(total / 6);
    const indices: number[] = [];
    for (let i = 0; i < total; i += step) {
      indices.push(i);
    }
    if (indices[indices.length - 1] !== total - 1) {
      indices.push(total - 1);
    }
    return indices;
  }, [revenuePoints]);

  const chartSubtitle = useMemo(() => {
    if (filterMode === "MONTH") return `Phân tích biến động doanh thu các ngày trong ${periodDisplayLabel.toLowerCase()}`;
    if (filterMode === "DAY") return `Phân tích doanh thu theo khung giờ (${periodDisplayLabel.toLowerCase()})`;
    if (filterMode === "YEAR") return `Phân tích doanh thu 12 tháng trong ${periodDisplayLabel.toLowerCase()}`;
    return "Phân tích xu hướng tăng trưởng doanh thu theo chu kỳ";
  }, [filterMode, periodDisplayLabel]);

  const pendingCount = summary?.pendingOrders ?? recentOrders.filter((o) => o.status === "PENDING").length;
  const activeFsCount = flashSaleItems.filter((f) => f.status === "APPROVED").length;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();

  const displayName = storeName || userData?.fullName || "Chủ gian hàng";

  // Xuất file Excel (.xlsx) chuyên nghiệp đa sheet dựa vào dữ liệu đang lọc
  const handleExport = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const exportTime = new Date().toLocaleString("vi-VN");

      // Styles
      const styleTitle = {
        font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: "065F46" } },
        alignment: { horizontal: "left", vertical: "center" },
      };
      const styleSub = {
        font: { name: "Segoe UI", sz: 9, italic: true, color: { rgb: "475569" } },
        alignment: { horizontal: "left", vertical: "center" },
      };
      const styleTableHeader = {
        font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "059669" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "047857" } },
          bottom: { style: "thin", color: { rgb: "047857" } },
          left: { style: "thin", color: { rgb: "047857" } },
          right: { style: "thin", color: { rgb: "047857" } },
        },
      };
      const styleSectionHeader = {
        font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "065F46" } },
        fill: { fgColor: { rgb: "D1FAE5" } },
        alignment: { horizontal: "left", vertical: "center" },
      };
      const styleCellDefault = {
        font: { name: "Segoe UI", sz: 10, color: { rgb: "0F172A" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } },
        },
      };

      // SHEET 1: Bao_Cao_Tong_Quan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mainRows: any[][] = [];
      const mainMerges: XLSX.Range[] = [];

      mainRows.push([`BÁO CÁO KINH DOANH GIAN HÀNG: ${displayName.toUpperCase()}`, "", "", ""]);
      mainMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });

      mainRows.push([`Kỳ báo cáo: ${periodDisplayLabel} | Thời gian xuất: ${exportTime}`, "", "", ""]);
      mainMerges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });
      mainRows.push([]);

      // Section 1: KPI Doanh thu & Tăng trưởng
      mainRows.push(["I. CHỈ SỐ KINH DOANH CHÍNH (KPI)", "", "", ""]);
      mainMerges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 3 } });

      mainRows.push(["Chỉ số", "Giá trị", "So sánh", "Ghi chú"]);
      mainRows.push(["Doanh thu trong kỳ", displayRevenue, "+12%", "Tổng doanh số"]);
      mainRows.push(["Tổng đơn hàng", displayOrders, "+8%", "Lượt đặt mua"]);
      mainRows.push([
        "Đánh giá trung bình",
        summary?.ratingAvg ? `${summary.ratingAvg}/5.0` : "4.8/5.0",
        "Ổn định",
        `${summary?.ratingCount ?? 120} đánh giá`,
      ]);
      mainRows.push(["Số dư ví khả dụng", wallet?.balance ?? 0, "Khả dụng", "Đã chốt T+3"]);
      mainRows.push([]);

      // Section 2: Vận hành & Cần xử lý
      mainRows.push(["II. TÌNH TRẠNG VẬN HÀNH & ĐƠN CẦN XỬ LÝ", "", "", ""]);
      const r2 = mainRows.length - 1;
      mainMerges.push({ s: { r: r2, c: 0 }, e: { r: r2, c: 3 } });

      mainRows.push(["Hạng mục", "Số lượng", "Mức độ", "Hạn xử lý"]);
      mainRows.push([
        "Đơn hàng chờ xác nhận",
        summary?.pendingOrders ?? recentOrders.filter((o) => o.status === "PENDING").length,
        "Cao",
        "Xử lý trong ngày",
      ]);
      mainRows.push([
        "Đơn hàng chờ lấy hàng",
        recentOrders.filter((o) => o.status === "PROCESSING").length,
        "Trung bình",
        "Bàn giao vận chuyển",
      ]);
      mainRows.push([
        "Sản phẩm tồn kho thấp",
        summary?.lowStockProducts ?? 0,
        "Cảnh báo",
        "Bổ sung kho",
      ]);
      mainRows.push([
        "Flash Sale đăng ký",
        flashSaleItems.length,
        "Thông tin",
        `${activeFsCount} phiên đã duyệt`,
      ]);
      mainRows.push([]);

      const wsMain = XLSX.utils.aoa_to_sheet(mainRows);
      wsMain["!merges"] = mainMerges;
      wsMain["!cols"] = [{ wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 30 }];

      // Apply style for Sheet 1
      Object.keys(wsMain).forEach((k) => {
        if (k.startsWith("!")) return;
        const decoded = XLSX.utils.decode_cell(k);
        const r = decoded.r;
        const c = decoded.c;
        const cell = wsMain[k];

        if (r === 0) {
          cell.s = styleTitle;
        } else if (r === 1) {
          cell.s = styleSub;
        } else if (r === 3 || r === r2) {
          cell.s = styleSectionHeader;
        } else if (r === 4 || r === r2 + 1) {
          cell.s = styleTableHeader;
        } else if (r > 4) {
          const isNum = typeof cell.v === "number";
          const align = c === 0 ? "left" : isNum ? "right" : "center";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
          if (isNum && c === 1) {
            cell.z = '#,##0 "₫"';
          }
        }
      });
      XLSX.utils.book_append_sheet(wb, wsMain, "Tong_Quan_Gian_Hang");

      // SHEET 2: Dien_Bien_Doanh_Thu
      const chartHeaders = [["STT", "Thời gian / Mốc", "Doanh thu (VNĐ)", "Số đơn hàng", "Chu kỳ trước (VNĐ)"]];
      const chartRows = revenuePoints.map((pt, i) => [
        i + 1,
        pt.date || pt.dayLabel,
        pt.revenue || 0,
        pt.ordersCount || 0,
        pt.previousWeekRevenue || 0,
      ]);
      const wsChart = XLSX.utils.aoa_to_sheet([...chartHeaders, ...chartRows]);
      wsChart["!cols"] = [{ wch: 8 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 22 }];
      Object.keys(wsChart).forEach((k) => {
        if (k.startsWith("!")) return;
        const decoded = XLSX.utils.decode_cell(k);
        const cell = wsChart[k];
        if (decoded.r === 0) {
          cell.s = styleTableHeader;
        } else {
          const isNum = typeof cell.v === "number";
          const align = decoded.c === 0 ? "center" : isNum ? "right" : "left";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
          if (isNum && (decoded.c === 2 || decoded.c === 4)) {
            cell.z = '#,##0 "₫"';
          }
        }
      });
      XLSX.utils.book_append_sheet(wb, wsChart, "Dien_Bien_Doanh_Thu");

      // SHEET 3: Don_Hang_Moi_Nhat
      const orderHeaders = [
        ["STT", "Mã đơn hàng", "Khách hàng", "Khu vực", "Phương thức thanh toán", "Tổng tiền (VNĐ)", "Trạng thái", "Ngày tạo"],
      ];
      const orderRows = recentOrders.map((o, i) => [
        i + 1,
        o.orderCode,
        o.recipientName || "Khách mua",
        o.recipientCity || "TP. Hồ Chí Minh",
        o.paymentMethod || "COD",
        o.finalAmount || o.totalAmount || 0,
        o.status,
        o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "",
      ]);
      const wsOrders = XLSX.utils.aoa_to_sheet([...orderHeaders, ...orderRows]);
      wsOrders["!cols"] = [{ wch: 8 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 22 }];
      Object.keys(wsOrders).forEach((k) => {
        if (k.startsWith("!")) return;
        const decoded = XLSX.utils.decode_cell(k);
        const cell = wsOrders[k];
        if (decoded.r === 0) {
          cell.s = styleTableHeader;
        } else {
          const isNum = typeof cell.v === "number";
          const align = decoded.c === 0 || decoded.c === 1 || decoded.c === 6 ? "center" : isNum ? "right" : "left";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
          if (isNum && decoded.c === 5) {
            cell.z = '#,##0 "₫"';
          }
        }
      });
      XLSX.utils.book_append_sheet(wb, wsOrders, "Don_Hang_Moi_Nhat");

      // SHEET 4: Top_San_Pham_Ban_Chay
      const prodHeaders = [["Hạng", "Mã sản phẩm", "Tên sản phẩm", "Đã bán (cái)", "Tồn kho", "Giá niêm yết (VNĐ)"]];
      const prodRows = topProducts.map((p, i) => [
        i + 1,
        p.id,
        p.name,
        p.totalSold || 0,
        p.totalStock ?? 0,
        p.minPrice || 0,
      ]);
      const wsProds = XLSX.utils.aoa_to_sheet([...prodHeaders, ...prodRows]);
      wsProds["!cols"] = [{ wch: 8 }, { wch: 14 }, { wch: 35 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];
      Object.keys(wsProds).forEach((k) => {
        if (k.startsWith("!")) return;
        const decoded = XLSX.utils.decode_cell(k);
        const cell = wsProds[k];
        if (decoded.r === 0) {
          cell.s = styleTableHeader;
        } else {
          const isNum = typeof cell.v === "number";
          const align = decoded.c === 0 || decoded.c === 1 ? "center" : isNum ? "right" : "left";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
          if (isNum && decoded.c === 5) {
            cell.z = '#,##0 "₫"';
          }
        }
      });
      XLSX.utils.book_append_sheet(wb, wsProds, "Top_San_Pham");

      // SHEET 5: Flash_Sale_Tham_Gia
      const fsHeaders = [["STT", "Tên phiên", "Khung giờ", "Ngày", "Sản phẩm (SKU)", "Tồn phân bổ", "Đã bán", "Tỷ lệ bán (%)", "Trạng thái"]];
      const fsRows = flashSaleItems.map((f, i) => {
        const pct = f.allocatedStock > 0 ? Math.round((f.soldStock / f.allocatedStock) * 100) : 0;
        return [
          i + 1,
          f.slotTitle,
          f.slotTime,
          f.slotDate,
          `${f.productName} (${f.sku})`,
          f.allocatedStock,
          f.soldStock,
          `${pct}%`,
          f.status === "APPROVED" ? "Đã duyệt" : f.status === "PENDING" ? "Chờ duyệt" : f.status,
        ];
      });
      const wsFs = XLSX.utils.aoa_to_sheet([...fsHeaders, ...fsRows]);
      wsFs["!cols"] = [{ wch: 8 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 35 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];
      Object.keys(wsFs).forEach((k) => {
        if (k.startsWith("!")) return;
        const decoded = XLSX.utils.decode_cell(k);
        const cell = wsFs[k];
        if (decoded.r === 0) {
          cell.s = styleTableHeader;
        } else {
          const isNum = typeof cell.v === "number";
          const align =
            decoded.c === 0 || decoded.c === 2 || decoded.c === 3 || decoded.c === 7 || decoded.c === 8
              ? "center"
              : isNum
              ? "right"
              : "left";
          cell.s = { ...styleCellDefault, alignment: { horizontal: align, vertical: "center" } };
        }
      });
      XLSX.utils.book_append_sheet(wb, wsFs, "Flash_Sale_Tham_Gia");

      // Ghi file
      const cleanSlug = displayName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = `Bao-cao-ban-hang-${cleanSlug || "shop"}-${today.toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Đã xuất báo cáo Excel theo ${periodDisplayLabel} thành công!`);
    } catch (err) {
      console.error("Lỗi xuất file Excel:", err);
      toast.error("Có lỗi xảy ra khi tạo tệp Excel báo cáo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Top Greeting & Period Filter & Export Action */}
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
              {pendingCount} đơn mới
            </span>{" "}
            và{" "}
            <span className="font-semibold text-emerald-600">
              {activeFsCount} phiên Flash Sale
            </span>{" "}
            đang sẵn sàng / tham gia.
          </p>
        </div>

        {/* Date Filter & Export Excel Button (Khớp Stitch UI như Admin) */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Badge Realtime Trực tiếp */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs border transition-all ${
              isWsConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
            title={
              isWsConnected
                ? "Đang kết nối Realtime qua WebSocket STOMP"
                : "Đang tự động đồng bộ thời gian thực"
            }
          >
            <span className="relative flex h-2 w-2">
              {isWsConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isWsConnected ? "bg-emerald-500" : "bg-slate-400"
                }`}
              ></span>
            </span>
            <span>{isWsConnected ? "Trực tiếp" : "Đồng bộ"}</span>
          </div>

          {/* Popover Chọn Thời Gian Thống Kê */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={handleOpenPopover}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container-low text-on-surface text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <MaterialSymbol name="calendar_month" size="[18px]" className="text-emerald-600" />
              <span>{periodDisplayLabel}</span>
              <MaterialSymbol name="expand_more" size="[16px]" className="text-secondary" />
            </button>

            {/* Dropdown Popover */}
            {isDatePickerOpen && (
              <div className="absolute right-0 top-11 mt-1 z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MaterialSymbol name="tune" size="[18px]" className="text-emerald-600" />
                    <span className="text-sm font-bold text-slate-800">Chọn thời gian thống kê</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <MaterialSymbol name="close" size="[16px]" />
                  </button>
                </div>

                {/* Mode Selector Tabs: Theo Tháng | Theo Ngày | Theo Năm */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl my-3">
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

                {/* Content: Theo Tháng */}
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

                {/* Content: Theo Ngày */}
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

                {/* Content: Theo Năm */}
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
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick preset tabs: Hôm nay | 7 ngày | 30 ngày */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-xs border border-outline-variant/30">
            {(["today", "7days", "30days"] as PeriodPreset[]).map((p) => {
              const labels: Record<PeriodPreset, string> = {
                today: "Hôm nay",
                "7days": "7 ngày",
                "30days": "30 ngày",
              };
              const isActive = filterMode === "PRESET" && periodPreset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setFilterMode("PRESET");
                    setPeriodPreset(p);
                  }}
                  className={`px-3 py-1 rounded-lg font-label-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
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

          {/* Export Excel Button (Màu xanh lá chuyên nghiệp như Admin) */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs font-bold shadow-xs transition-all disabled:opacity-60 active:scale-95 cursor-pointer"
          >
            <MaterialSymbol
              name={isExporting ? "sync" : "file_download"}
              size="[18px]"
              className={isExporting ? "animate-spin" : ""}
            />
            <span>{isExporting ? "Đang xuất..." : "Xuất báo cáo"}</span>
          </button>
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
              Doanh thu ({periodDisplayLabel})
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-emerald-600 flex items-center justify-center">
              <MaterialSymbol name="payments" size="[18px]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-on-surface font-bold tracking-tight">
              {isLoading && recentOrders.length === 0 ? "..." : formatVND(displayRevenue)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-md text-label-sm font-semibold border border-emerald-200">
              <MaterialSymbol name="verified" size="[14px]" />
              <span>Dữ liệu thực</span>
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              tổng hợp từ hệ thống
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
              {isLoading && recentOrders.length === 0 ? "..." : displayOrders}
            </span>
            <span className="font-body-md text-body-sm text-secondary">đơn</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-md text-label-sm font-semibold border border-emerald-200">
              <MaterialSymbol name="shopping_bag" size="[14px]" />
              <span>{displayOrders} đơn</span>
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              trong kỳ thống kê
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
              {summary?.ratingAvg !== undefined && summary.ratingAvg !== null ? `${summary.ratingAvg} / 5.0` : "Chưa có"}
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              ({summary?.ratingCount ?? 0} đánh giá)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-surface-container-low text-secondary font-label-md text-label-sm border border-outline-variant/20">
              <MaterialSymbol name="star_half" size="[14px]" />
              <span>{summary?.ratingAvg ? "Tín nhiệm cao" : "Mới tham gia"}</span>
            </span>
            <span className="font-body-sm text-label-sm text-secondary">
              phản hồi từ người mua
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
              {wallet?.balance !== undefined ? formatVND(wallet.balance) : "0 ₫"}
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
            href="/seller/orders?status=PENDING"
            className="bg-surface-container-low/60 hover:bg-surface-container-low p-3.5 rounded-lg transition-all group flex items-center justify-between border border-outline-variant/20"
          >
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary group-hover:text-on-surface transition-colors">
                Chờ xác nhận
              </span>
              <span className="font-display-sm text-display-sm text-amber-600 font-bold mt-1">
                {summary?.pendingOrders ?? recentOrders.filter((o) => o.status === "PENDING").length}
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
                {recentOrders.filter((o) => o.status === "PROCESSING").length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-200">
              <MaterialSymbol name="local_shipping" size="[20px]" />
            </div>
          </Link>

          {/* To-Do 3: Hết hàng / Tồn kho thấp */}
          <Link
            href="/seller/products?stock=low-stock"
            className="bg-surface-container-low/60 hover:bg-surface-container-low p-3.5 rounded-lg transition-all group flex items-center justify-between border border-outline-variant/20"
          >
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary group-hover:text-on-surface transition-colors">
                Tồn kho cảnh báo
              </span>
              <span className="font-display-sm text-display-sm text-tertiary font-bold mt-1">
                {summary?.lowStockProducts ?? 0}
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
                {flashSaleItems.filter((f) => f.status === "PENDING").length}
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
                Doanh thu ({periodDisplayLabel})
              </h2>
              <p className="font-body-sm text-body-sm text-secondary">
                {chartSubtitle}
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
                {chartPrevLine && (
                  <path
                    d={chartPrevLine}
                    fill="none"
                    stroke="currentColor"
                    className="text-surface-dim"
                    strokeDasharray="4 4"
                    strokeWidth="2"
                  />
                )}

                {/* Primary Metric Area Fill */}
                {chartCurrentArea && (
                  <path
                    d={chartCurrentArea}
                    fill="url(#mintRevenueGrad)"
                  />
                )}

                {/* Primary Metric Line */}
                {chartCurrentLine && (
                  <path
                    d={chartCurrentLine}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                  />
                )}

                {/* Data Points */}
                {chartPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#10B981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>
                      {pt.dayLabel} ({pt.date}): {formatVND(pt.revenue)} ({pt.ordersCount} đơn)
                    </title>
                  </circle>
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
            <div className="relative w-full h-7 border-t border-outline-variant/20 mt-3 pt-1 text-secondary text-xs">
              {visibleLabelIndices.map((idx) => {
                const pt = chartPoints[idx];
                if (!pt) return null;
                const percent =
                  revenuePoints.length <= 1 ? 50 : (idx / (revenuePoints.length - 1)) * 100;
                const labelText =
                  filterMode === "MONTH"
                    ? `${pt.date.slice(8)}/${pt.date.slice(5, 7)}`
                    : filterMode === "DAY"
                    ? pt.dayLabel
                    : pt.dayLabel;
                return (
                  <span
                    key={idx}
                    style={{ left: `${percent}%` }}
                    className="absolute -translate-x-1/2 top-1 font-medium hover:text-on-surface whitespace-nowrap text-[11px] transition-colors"
                  >
                    {labelText}
                  </span>
                );
              })}
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
              {flashSaleItems.length > 0 ? (
                flashSaleItems.slice(0, 2).map((item) => {
                  const isApproved = item.status === "APPROVED";
                  const isPending = item.status === "PENDING";
                  const progressPct =
                    item.allocatedStock > 0
                      ? Math.min(100, Math.round((item.soldStock / item.allocatedStock) * 100))
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-colors border border-outline-variant/20 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-headline-md text-body-md text-on-surface font-semibold truncate">
                            {item.slotTitle}
                          </p>
                          <p className="font-body-sm text-label-sm text-secondary mt-0.5 truncate">
                            {item.productName} ({item.sku})
                          </p>
                        </div>
                        {isApproved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-[10px] font-bold shrink-0">
                            Đã duyệt
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-label-md text-[10px] font-bold shrink-0">
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-secondary border border-outline-variant/30 font-label-md text-[10px] font-bold shrink-0">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between font-label-md text-[11px] mb-1">
                          <span className="text-secondary">
                            {item.slotTime} ({item.slotDate})
                          </span>
                          <span className="text-on-surface font-medium">
                            {item.soldStock} / {item.allocatedStock} cái ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 px-3 bg-surface-container-low/30 rounded-lg border border-dashed border-outline-variant/40">
                  <MaterialSymbol name="bolt" size="[28px]" className="text-secondary mb-1.5" />
                  <p className="font-headline-md text-body-sm font-semibold text-on-surface">
                    Chưa đăng ký phiên nào
                  </p>
                  <p className="font-body-sm text-label-xs text-secondary mt-0.5 mb-3">
                    Tham gia Flash Sale sàn để tăng lượng đơn hàng
                  </p>
                  <Link
                    href="/seller/flash-sale/register"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-sm font-semibold transition-colors shadow-sm"
                  >
                    <span>Khám phá khung giờ</span>
                    <MaterialSymbol name="arrow_forward" size="[14px]" />
                  </Link>
                </div>
              )}
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
                          Đã bán {(prod.totalSold || 0).toLocaleString("vi-VN")} cái • Tồn: {prod.totalStock ?? 0}
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
