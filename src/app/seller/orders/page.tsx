"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  getSellerOrders,
  updateSellerOrderStatus,
} from "@/lib/api/seller";
import type {
  SellerOrderResponse,
  SellerOrderItemResponse,
} from "@/types/seller";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { useSellerOrderNotifications } from "@/hooks/useSellerOrderNotifications";
import { useMyStore } from "@/hooks/useMyStore";
import { createFlashSaleStompClient } from "@/lib/stomp";

type TabKey =
  | "ALL"
  | "PENDING_PAYMENT"
  | "PENDING"
  | "PROCESSING"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

interface TabItem {
  key: TabKey;
  label: string;
}

const TABS: TabItem[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "PROCESSING", label: "Chờ lấy hàng" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
];

function SellerOrdersContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const initialStatus = searchParams.get("status") || "";

  const [orders, setOrders] = useState<SellerOrderResponse[]>([]);
  const [allOrders, setAllOrders] = useState<SellerOrderResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { markAllAsSeen } = useSellerOrderNotifications();

  // Filters
  const [currentTab, setCurrentTab] = useState<TabKey>(() => {
    if (initialStatus && TABS.some((t) => t.key === initialStatus)) {
      return initialStatus as TabKey;
    }
    return "ALL";
  });
  const [searchTerm, setSearchTerm] = useState<string>(initialCode);
  const [orderTypeFilter, setOrderTypeFilter] = useState<"ALL" | "FLASH_SALE" | "STANDARD">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "ZALOPAY" | "COD">("ALL");

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Drawer & Modals
  const [selectedOrder, setSelectedOrder] = useState<SellerOrderResponse | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<SellerOrderResponse | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("out_of_stock");
  const [cancelNote, setCancelNote] = useState<string>("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const triggerReload = () => {
    setLoading(true);
    setReloadTrigger((prev) => prev + 1);
  };

  // Reset notification badges khi người bán trực tiếp truy cập vào trang quản lý đơn hàng
  useEffect(() => {
    markAllAsSeen();
  }, [markAllAsSeen]);

  // Kiểm tra dữ liệu có thay đổi hay không để tránh re-render DOM không cần thiết
  const hasOrdersChanged = (prev: SellerOrderResponse[], next: SellerOrderResponse[]) => {
    if (prev.length !== next.length) return true;
    for (let i = 0; i < prev.length; i++) {
      if (prev[i].id !== next[i]?.id || prev[i].status !== next[i]?.status) {
        return true;
      }
    }
    return false;
  };

  // Fetch dữ liệu đơn hàng (chế độ silent chạy ngầm 100% êm đềm, không xoay, không giật lag)
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent && allOrders.length === 0) {
        setLoading(true);
      }

      try {
        const res = await getSellerOrders(0, 100);
        const list = res.items || res.content || [];

        // Cập nhật mượt mà khi có dữ liệu mới
        setAllOrders((prev) => (!silent || hasOrdersChanged(prev, list) ? list : prev));
        setOrders((prev) => (!silent || hasOrdersChanged(prev, list) ? list : prev));
        setError(null);

        // Tự động mở đơn nếu có initialCode từ URL
        if (initialCode && !selectedOrder) {
          const matched = list.find(
            (o) => o.orderCode?.toLowerCase() === initialCode.toLowerCase()
          );
          if (matched) {
            setSelectedOrder(matched);
          }
        }

        markAllAsSeen();
      } catch (err: unknown) {
        if (!silent && allOrders.length === 0) {
          const msg = err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng";
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markAllAsSeen, allOrders.length, initialCode, selectedOrder]
  );

  // Load ban đầu 1 lần duy nhất khi mount hoặc khi bấm reload
  useEffect(() => {
    void fetchOrders(false);
  }, [reloadTrigger, fetchOrders]);

  const { store } = useMyStore();

  // Tự động kết nối WebSocket STOMP để đón nhận đơn hàng mới tức thì (Event-Driven Realtime)
  useEffect(() => {
    let stomp: { disconnect: () => void } | null = null;
    try {
      const client = createFlashSaleStompClient(null);
      stomp = client;

      const handleIncomingOrder = (newOrder: SellerOrderResponse) => {
        if (!newOrder || (!newOrder.id && !newOrder.orderCode)) return;
        setAllOrders((prev) => {
          const exists = prev.some(
            (o) => o.id === newOrder.id || (newOrder.orderCode && o.orderCode === newOrder.orderCode)
          );
          if (exists) {
            return prev.map((o) => (o.id === newOrder.id ? { ...o, ...newOrder } : o));
          }
          return [newOrder, ...prev];
        });
        setOrders((prev) => {
          const exists = prev.some(
            (o) => o.id === newOrder.id || (newOrder.orderCode && o.orderCode === newOrder.orderCode)
          );
          if (exists) {
            return prev.map((o) => (o.id === newOrder.id ? { ...o, ...newOrder } : o));
          }
          return [newOrder, ...prev];
        });
        toast.info(`🔔 Đơn hàng mới #${newOrder.orderCode}!`);
      };

      // Subscribe topic chung của seller
      client.subscribe("/topic/seller/orders", (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          handleIncomingOrder(payload.data || payload);
        } catch (e) {
          console.warn("Parse WS /topic/seller/orders error:", e);
        }
      });

      // Subscribe topic riêng của gian hàng này (nếu có storeId)
      if (store?.id) {
        client.subscribe(`/topic/stores/${store.id}/orders`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            handleIncomingOrder(payload.data || payload);
          } catch (e) {
            console.warn("Parse WS store orders error:", e);
          }
        });
      }
    } catch (err) {
      console.warn("Init seller STOMP warning:", err);
    }

    return () => {
      stomp?.disconnect();
    };
  }, [store?.id]);

  // Tự động cập nhật ngầm theo thời gian thực (100% êm dịu, không xoay màn hình)
  useEffect(() => {
    const timer = setInterval(() => {
      void fetchOrders(true);
    }, 6000);

    return () => clearInterval(timer);
  }, [fetchOrders]);

  // Nút bấm Làm mới thủ công (chỉ xoay khi người dùng chủ động click)
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await fetchOrders(false);
    setIsManualRefreshing(false);
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    const list = allOrders.length > 0 ? allOrders : orders;
    const counts: Record<TabKey, number> = {
      ALL: list.length,
      PENDING_PAYMENT: 0,
      PENDING: 0,
      PROCESSING: 0,
      SHIPPING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    list.forEach((o) => {
      const st = (o.status || "").toUpperCase() as TabKey;
      if (st in counts) {
        counts[st]++;
      }
    });
    return counts;
  }, [allOrders, orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (currentTab !== "ALL" && o.status !== currentTab) {
        return false;
      }
      // Search filter (code, name, phone)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const code = (o.orderCode || "").toLowerCase();
        const name = (o.recipientName || "").toLowerCase();
        const phone = (o.recipientPhone || "").toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !phone.includes(q)) {
          return false;
        }
      }
      // Order type filter
      const isFlashSale =
        (o.slotId != null && o.slotId > 0) ||
        (o.items && o.items.some((it) => it.flashSaleItemId != null));
      if (orderTypeFilter === "FLASH_SALE" && !isFlashSale) return false;
      if (orderTypeFilter === "STANDARD" && isFlashSale) return false;

      // Payment method
      if (paymentFilter !== "ALL" && (o.paymentMethod || "").toUpperCase() !== paymentFilter) {
        return false;
      }

      return true;
    });
  }, [orders, currentTab, searchTerm, orderTypeFilter, paymentFilter]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status transition handler
  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setActionLoading(true);
    try {
      await updateSellerOrderStatus(orderId, newStatus);
      toast.success(`Cập nhật đơn hàng sang trạng thái: ${newStatus}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác cập nhật trạng thái thất bại";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm cancel
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setActionLoading(true);
    try {
      await updateSellerOrderStatus(cancelModalOrder.id, "CANCELLED");
      toast.success(`Đã hủy đơn hàng #${cancelModalOrder.orderCode}`);
      setCancelModalOrder(null);
      if (selectedOrder?.id === cancelModalOrder.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      }
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể hủy đơn hàng";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Mã đơn",
      "Khách hàng",
      "Số điện thoại",
      "Địa chỉ",
      "Tổng thanh toán",
      "Phương thức",
      "Trạng thái",
      "Thời gian tạo",
    ];
    const rows = filteredOrders.map((o) => [
      o.orderCode,
      `"${o.recipientName}"`,
      `"${o.recipientPhone}"`,
      `"${o.recipientAddress || o.shippingAddressText || ""}"`,
      o.totalAmount || o.finalAmount || 0,
      o.paymentMethod,
      o.status,
      o.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seller_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách đơn hàng sang file CSV thành công");
  };

  const formatVnd = (amount?: number) => {
    return (amount || 0).toLocaleString("vi-VN") + " ₫";
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "--:--";
    try {
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")} · ${d.getDate().toString().padStart(2, "0")}/${(
        d.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // In phiếu đóng hàng
  const handlePrintOrders = () => {
    setIsPrintModalOpen(true);
  };

  const selectedOrdersForPrint = useMemo(() => {
    return orders.filter((o) => selectedIds.includes(o.id));
  }, [orders, selectedIds]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-secondary font-medium">
        <Link href="/seller" className="hover:text-emerald-600 transition-colors">
          Kênh người bán
        </Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">Quản lý đơn hàng</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Quản lý đơn hàng
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Thời gian thực</span>
            </span>
          </div>
          <p className="text-sm text-secondary mt-1">
            Xử lý xác nhận, đóng gói và theo dõi trạng thái đối soát tức thời.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            title="Tải lại danh sách đơn hàng"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[16px] text-slate-500 ${
                isManualRefreshing ? "animate-spin" : ""
              }`}
            >
              sync
            </span>
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <MaterialSymbol name="file_download" size="[18px]" className="text-secondary" />
            <span>Xuất Excel (CSV)</span>
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handlePrintOrders}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
          >
            <MaterialSymbol name="print" size="[18px]" />
            <span>In phiếu loạt {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-x-auto">
        <div className="flex items-center min-w-max px-4">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.key;
            const count = tabCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setCurrentTab(tab.key);
                  setSelectedIds([]);
                }}
                className={`flex items-center gap-2 py-4 px-4 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-secondary hover:text-on-surface"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-surface-container text-secondary"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none flex items-center">
            <MaterialSymbol name="search" size="[18px]" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, người nhận, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-on-surface"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Order Type */}
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value as "ALL" | "FLASH_SALE" | "STANDARD")}
            className="px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Tất cả loại đơn</option>
            <option value="FLASH_SALE">⚡ Đơn Flash Sale</option>
            <option value="STANDARD">📦 Đơn tiêu chuẩn</option>
          </select>

          {/* Payment Method */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as "ALL" | "ZALOPAY" | "COD")}
            className="px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Tất cả thanh toán</option>
            <option value="ZALOPAY">ZaloPay QR</option>
            <option value="COD">Thanh toán COD</option>
          </select>

          {/* Reset button */}
          {(searchTerm || orderTypeFilter !== "ALL" || paymentFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setOrderTypeFilter("ALL");
                setPaymentFilter("ALL");
              }}
              className="px-3 py-2 text-xs font-semibold text-secondary hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading && allOrders.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 w-full bg-slate-50/70 animate-pulse rounded-xl border border-slate-100 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-slate-200/60 rounded"></div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-slate-200/60 rounded"></div>
                    <div className="h-2.5 w-16 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-36 bg-slate-200/60 rounded hidden md:block"></div>
                <div className="h-4 w-24 bg-slate-200/60 rounded"></div>
                <div className="h-6 w-20 bg-slate-200/60 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : error && allOrders.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
              <MaterialSymbol name="error" size="[24px]" />
            </div>
            <p className="text-sm font-semibold text-on-surface">{error}</p>
            <button
              type="button"
              onClick={triggerReload}
              className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low text-secondary flex items-center justify-center mb-3">
              <MaterialSymbol name="inbox" size="[28px]" />
            </div>
            <p className="text-sm font-bold text-on-surface">
              Không có đơn hàng nào
            </p>
            <p className="text-xs text-secondary mt-1 max-w-sm">
              Không tìm thấy đơn hàng phù hợp với điều kiện tìm kiếm hoặc phân loại trạng thái hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low/60 text-[11px] font-bold text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filteredOrders.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-emerald-600 rounded border-outline focus:ring-emerald-500 accent-emerald-600"
                    />
                  </th>
                  <th className="py-3 px-4">Mã đơn hàng</th>
                  <th className="py-3 px-4">Khách hàng / Nhận hàng</th>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Thanh toán</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs">
                {filteredOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  const isFlashSale =
                    (order.slotId != null && order.slotId > 0) ||
                    (order.items && order.items.some((it) => it.flashSaleItemId != null));

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-surface-container-low/40 cursor-pointer transition-colors ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-outline focus:ring-emerald-500 accent-emerald-600"
                        />
                      </td>

                      {/* Mã đơn */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-on-surface">
                              #{order.orderCode}
                            </span>
                            {isFlashSale && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                ⚡ FS
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-secondary">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">
                            {order.recipientName}
                          </span>
                          <span className="text-[11px] text-secondary">
                            {order.recipientPhone}
                          </span>
                          <span className="text-[11px] text-secondary/80 line-clamp-1 max-w-xs mt-0.5">
                            {order.recipientAddress || order.shippingAddressText || order.recipientCity}
                          </span>
                        </div>
                      </td>

                      {/* Sản phẩm */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden shrink-0 border border-outline-variant/30">
                            {order.items && order.items[0]?.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={order.items[0].imageUrl}
                                alt="Product"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-secondary">
                                <MaterialSymbol name="inventory_2" size="[16px]" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 max-w-[200px]">
                            <span className="font-medium text-on-surface truncate">
                              {order.items?.[0]?.productName || "Đơn hàng sản phẩm"}
                            </span>
                            <span className="text-[11px] text-secondary">
                              {order.items && order.items.length > 1
                                ? `+${order.items.length - 1} sản phẩm khác`
                                : `SL: ${order.items?.[0]?.quantity || 1}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        {formatVnd(order.finalAmount || order.totalAmount || 0)}
                      </td>

                      {/* Thanh toán */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-on-surface">
                            {order.paymentMethod === "ZALOPAY" ? "ZaloPay QR" : "COD"}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              order.paymentStatus === "PAID"
                                ? "text-emerald-700"
                                : "text-amber-600"
                            }`}
                          >
                            {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        <SellerStatusBadge status={order.status} />
                      </td>

                      {/* Thao tác */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "PENDING" && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(order.id, "PROCESSING")}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                            >
                              Xác nhận
                            </button>
                          )}
                          {order.status === "PROCESSING" && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(order.id, "SHIPPING")}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                            >
                              Giao hàng
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <MaterialSymbol name="visibility" size="[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Centered Modal Chi tiết đơn hàng (Cửa sổ nổi nằm giữa màn hình) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Chi tiết đơn hàng
                  </span>
                  <SellerStatusBadge status={selectedOrder.status} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  #{selectedOrder.orderCode}
                </h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Tạo lúc: {formatDateTime(selectedOrder.createdAt)}</span>
                  {selectedOrder.status === "PENDING" && (
                    <span className="text-emerald-700 font-semibold">
                      • Cần xác nhận chuẩn bị hàng
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <MaterialSymbol name="close" size="[20px]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Block 1: Shipping Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <MaterialSymbol name="local_shipping" size="[20px]" className="text-emerald-600" />
                    <span>Thông tin nhận hàng</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                    {selectedOrder.carrierName || "SPX Express"}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-100 space-y-1.5 text-secondary">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedOrder.recipientName}
                    </span>
                    <span className="font-medium text-slate-900">
                      {selectedOrder.recipientPhone}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedOrder.shippingAddressText ||
                      selectedOrder.recipientAddress ||
                      "Chưa có địa chỉ chi tiết"}
                  </p>
                  {selectedOrder.trackingNumber && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-slate-500">Mã vận đơn:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                        <span>{selectedOrder.trackingNumber}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrder.trackingNumber || "");
                            toast.success("Đã sao chép mã vận đơn");
                          }}
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <MaterialSymbol name="content_copy" size="[16px]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Block 2: Order Items */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between">
                  <span>Danh sách sản phẩm ({selectedOrder.items?.length || 0})</span>
                  {selectedOrder.slotId && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⚡ Thuộc khung Flash Sale
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: SellerOrderItemResponse) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-100">
                        {item.imageUrl || item.productImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl || item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <MaterialSymbol name="inventory_2" size="[18px]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          SKU: {item.variantSku || "N/A"} • {item.variantName || ""}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-slate-500">
                            {formatVnd(item.priceAtPurchase || item.unitPrice)} × {item.quantity}
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatVnd(item.itemSubtotal || item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 3: Financial Settlement */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Đối soát & Quyết toán
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền hàng (Subtotal)</span>
                    <span>{formatVnd(selectedOrder.subtotalAmount || selectedOrder.totalItemAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span>+{formatVnd(selectedOrder.shippingFee || 25000)}</span>
                  </div>
                  {selectedOrder.voucherDiscountAmount ? (
                    <div className="flex justify-between text-rose-600">
                      <span>Voucher giảm giá</span>
                      <span>-{formatVnd(selectedOrder.voucherDiscountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200">
                    <span>Khách thanh toán</span>
                    <span>{formatVnd(selectedOrder.totalAmount || selectedOrder.finalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Phí sàn dịch vụ (5%)</span>
                    <span>-{formatVnd(selectedOrder.platformFee || 16700)}</span>
                  </div>
                  {/* Highlight Box */}
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        Thực nhận của Shop
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        Cộng vào ví sau khi giao thành công
                      </p>
                    </div>
                    <span className="text-base font-extrabold text-emerald-700">
                      {formatVnd(selectedOrder.sellerAmount || 300200)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Block 4: Timeline */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Lịch sử đơn hàng
                </h3>
                <div className="pl-3 border-l-2 border-emerald-500 space-y-4 text-xs">
                  {(selectedOrder.timeline && selectedOrder.timeline.length > 0
                    ? selectedOrder.timeline
                    : [
                        {
                          status: "PENDING_PAYMENT",
                          label: "Đặt hàng thành công",
                          at: selectedOrder.createdAt,
                        },
                        {
                          status: "PAID",
                          label: `Thanh toán thành công qua ${selectedOrder.paymentMethod}`,
                          at: selectedOrder.createdAt,
                        },
                      ]
                  ).map((tl, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      <p className="font-bold text-slate-900">{tl.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateTime(tl.at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(selectedOrder)}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                >
                  Hủy đơn hàng
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Đóng
                </button>
                {selectedOrder.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "PROCESSING")}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                  >
                    Xác nhận chuẩn bị hàng
                  </button>
                )}
                {selectedOrder.status === "PROCESSING" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "SHIPPING")}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                  >
                    Bàn giao vận chuyển
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setCancelModalOrder(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MaterialSymbol name="warning" size="[18px]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Hủy đơn hàng #{cancelModalOrder.orderCode}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Vui lòng chọn lý do chính xác để hoàn tiền khách
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <MaterialSymbol name="close" size="[18px]" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-2">
                  Chọn lý do hủy đơn *
                </label>
                <div className="space-y-2">
                  {[
                    { value: "out_of_stock", label: "Hết hàng trong kho phân phối" },
                    { value: "price_error", label: "Lỗi cài đặt giá Flash Sale" },
                    { value: "customer_request", label: "Khách hàng yêu cầu hủy qua tin nhắn" },
                    { value: "other", label: "Lý do khác" },
                  ].map((r) => (
                    <label
                      key={r.value}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="cancel_reason"
                        value={r.value}
                        checked={cancelReason === r.value}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                      />
                      <span className="text-slate-800 font-medium">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Ghi chú cho khách & sàn (tùy chọn)
                </label>
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  rows={2}
                  placeholder="Nhập ghi chú chi tiết..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                <span className="text-amber-600 shrink-0 mt-0.5">
                  <MaterialSymbol name="info" size="[18px]" />
                </span>
                <p className="text-[11px] leading-relaxed">
                  Hệ thống sẽ hoàn 100% tiền về tài khoản ZaloPay của người mua trong 5-15 phút. Tồn kho Flash Sale sẽ tự động được hoàn trả vào kho của shop.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Packing Slips Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MaterialSymbol name="print" size="[22px]" className="text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  In phiếu đóng gói ({selectedOrdersForPrint.length} đơn hàng)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <MaterialSymbol name="close" size="[20px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedOrdersForPrint.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 border-2 border-dashed border-slate-200 rounded-xl bg-white space-y-4"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <p className="font-bold text-sm text-slate-900">VIBE MART - PHIẾU ĐÓNG GÓI</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Mã đơn: #{ord.orderCode}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 rounded border border-slate-200">
                        {ord.carrierName || "SPX EXPRESS"}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">MVD: {ord.trackingNumber || "Chưa cấp"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-500">Người nhận:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{ord.recipientName} - {ord.recipientPhone}</p>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{ord.recipientAddress || ord.shippingAddressText}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">Thanh toán:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{ord.paymentMethod} ({ord.paymentStatus})</p>
                      <p className="font-bold text-emerald-700 text-sm mt-1">{formatVnd(ord.finalAmount || ord.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-500 text-xs">Danh sách sản phẩm:</span>
                    <ul className="mt-1 space-y-1 text-xs">
                      {ord.items?.map((it) => (
                        <li key={it.id} className="flex justify-between text-slate-800">
                          <span>{it.productName} ({it.variantSku || "SKU"})</span>
                          <span className="font-bold">x{it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setIsPrintModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <MaterialSymbol name="print" size="[18px]" />
                <span>Xác nhận In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Đang chuẩn bị danh sách đơn hàng...</p>
        </div>
      }
    >
      <SellerOrdersContent />
    </Suspense>
  );
}
