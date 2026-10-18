"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getSellerOrders,
  updateSellerOrderStatus,
} from "@/lib/api/seller";
import type {
  SellerOrderResponse,
  SellerOrderItemResponse,
} from "@/types/seller";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";

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

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrderResponse[]>([]);
  const [allOrders, setAllOrders] = useState<SellerOrderResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currentTab, setCurrentTab] = useState<TabKey>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<"ALL" | "FLASH_SALE" | "STANDARD">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "ZALOPAY" | "COD">("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "MONTH">("ALL");

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Drawer & Modal
  const [selectedOrder, setSelectedOrder] = useState<SellerOrderResponse | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<SellerOrderResponse | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("out_of_stock");
  const [cancelNote, setCancelNote] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const triggerReload = () => {
    setLoading(true);
    setReloadTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let active = true;
    getSellerOrders(0, 50, currentTab === "ALL" ? undefined : currentTab)
      .then((res) => {
        if (active) {
          const list = res.items || res.content || [];
          setOrders(list);
          if (currentTab === "ALL") {
            setAllOrders(list);
          }
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng";
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentTab, reloadTrigger]);

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
      const isFlashSale = (o.slotId != null && o.slotId > 0) || (o.items && o.items.some((it) => it.flashSaleItemId != null));
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
      showToast(`Đã cập nhật đơn hàng sang trạng thái: ${newStatus}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      alert(msg);
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
      showToast(`Đã hủy đơn hàng #${cancelModalOrder.orderCode}`);
      setCancelModalOrder(null);
      if (selectedOrder?.id === cancelModalOrder.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      }
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể hủy đơn hàng";
      alert(msg);
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
    showToast("Đã xuất danh sách đơn hàng sang file CSV");
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl transition-all animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/seller" className="hover:text-emerald-600 transition-colors">
          Kênh người bán
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Quản lý đơn hàng</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý đơn hàng
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Thời gian thực
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Xử lý xác nhận, đóng gói và theo dõi trạng thái đối soát tức thời.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              file_download
            </span>
            Xuất Excel (CSV)
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={() => showToast(`Chuẩn bị in phiếu cho ${selectedIds.length} đơn hàng...`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            In phiếu loạt {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-max px-4">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.key;
            const count = tabCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setCurrentTab(tab.key);
                  setSelectedIds([]);
                }}
                className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
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
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, người nhận, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Order Type */}
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value as "ALL" | "FLASH_SALE" | "STANDARD")}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Tất cả loại đơn</option>
            <option value="FLASH_SALE">⚡ Đơn Flash Sale</option>
            <option value="STANDARD">📦 Đơn thường</option>
          </select>

          {/* Payment Method */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as "ALL" | "ZALOPAY" | "COD")}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Tất cả thanh toán</option>
            <option value="ZALOPAY">ZaloPay QR</option>
            <option value="COD">Thanh toán COD</option>
          </select>

          {/* Reset button */}
          {(searchTerm || orderTypeFilter !== "ALL" || paymentFilter !== "ALL" || dateFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setOrderTypeFilter("ALL");
                setPaymentFilter("ALL");
                setDateFilter("ALL");
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <span className="material-symbols-outlined animate-spin text-[32px] text-emerald-600">
              progress_activity
            </span>
            <p className="text-sm font-medium">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">error</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              onClick={triggerReload}
              className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">inbox</span>
            </div>
            <p className="text-base font-semibold text-slate-800">
              Không có đơn hàng nào
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Không tìm thấy đơn hàng phù hợp với điều kiện tìm kiếm hoặc phân loại trạng thái hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filteredOrders.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[150px]">Mã đơn & Loại</th>
                  <th className="py-3 px-4 min-w-[220px]">Sản phẩm tóm tắt</th>
                  <th className="py-3 px-4 min-w-[160px]">Khách hàng</th>
                  <th className="py-3 px-4 min-w-[130px]">Tổng thanh toán</th>
                  <th className="py-3 px-4 min-w-[110px]">Phương thức</th>
                  <th className="py-3 px-4 min-w-[120px]">Trạng thái</th>
                  <th className="py-3 px-4 min-w-[130px]">Thời gian đặt</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order) => {
                  const isFlash =
                    (order.slotId != null && order.slotId > 0) ||
                    (order.items && order.items.some((it) => it.flashSaleItemId != null));
                  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                  const otherCount = order.items && order.items.length > 1 ? order.items.length - 1 : 0;
                  const isChecked = selectedIds.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(order.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>

                      {/* Code & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            #{order.orderCode}
                          </span>
                          {isFlash ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ⚡ Flash Sale
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Tiêu chuẩn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Product summary */}
                      <td className="py-3.5 px-4">
                        {firstItem ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                              {firstItem.imageUrl || firstItem.productImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={firstItem.imageUrl || firstItem.productImage}
                                  alt={firstItem.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-slate-400 text-sm flex items-center justify-center h-full">
                                  image
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                                {firstItem.productName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {firstItem.variantName || firstItem.variantSku} × {firstItem.quantity}
                              </p>
                              {otherCount > 0 && (
                                <span className="text-[10px] text-emerald-600 font-medium">
                                  +{otherCount} món khác
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Không có sản phẩm</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {order.recipientName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {order.recipientPhone}
                          </p>
                          {order.recipientCity && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {order.recipientCity}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900">
                            {formatVnd(order.totalAmount || order.finalAmount)}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {order.status === "PENDING_PAYMENT"
                              ? "Chờ thanh toán"
                              : "Đã thanh toán"}
                          </p>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            order.paymentMethod === "ZALOPAY"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {order.paymentMethod === "ZALOPAY" ? "ZaloPay QR" : "COD"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <SellerStatusBadge status={order.status} />
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>

                      {/* Action */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "PENDING" && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(order.id, "PROCESSING")}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                            >
                              Xác nhận
                            </button>
                          )}
                          {order.status === "PROCESSING" && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(order.id, "SHIPPING")}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                            >
                              Giao hàng
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
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
                        • Hạn xác nhận: Còn 03:57:44
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                {/* Block 1: Shipping Info */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                        local_shipping
                      </span>
                      <span>Thông tin nhận hàng</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                      {selectedOrder.carrierName || "SPX Express"}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedOrder.recipientName}
                      </span>
                      <span className="font-medium text-slate-700">
                        {selectedOrder.recipientPhone}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {selectedOrder.shippingAddressText ||
                        selectedOrder.recipientAddress ||
                        "Chưa có địa chỉ chi tiết"}
                    </p>
                    {selectedOrder.trackingNumber && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-slate-400">Mã vận đơn:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                          <span>{selectedOrder.trackingNumber}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.trackingNumber || "");
                              showToast("Đã sao chép mã vận đơn");
                            }}
                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              content_copy
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Block 2: Order Items */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Sản phẩm ({selectedOrder.items?.length || 0})</span>
                    {selectedOrder.slotId && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0">
                          {item.imageUrl || item.productImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.imageUrl || item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400 flex items-center justify-center h-full">
                              image
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            SKU: {item.variantSku || "N/A"} • {item.variantName || ""}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-slate-600">
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
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
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
                    <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
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
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
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
                        <p className="font-bold text-slate-800">{tl.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(tl.at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                  <button
                    onClick={() => setCancelModalOrder(selectedOrder)}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                  >
                    Hủy đơn hàng
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Đóng
                  </button>
                  {selectedOrder.status === "PENDING" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "PROCESSING")}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                    >
                      Xác nhận chuẩn bị hàng
                    </button>
                  )}
                  {selectedOrder.status === "PROCESSING" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "SHIPPING")}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setCancelModalOrder(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
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
                onClick={() => setCancelModalOrder(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
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
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-[11px] leading-relaxed">
                  Hệ thống sẽ hoàn 100% tiền về tài khoản ZaloPay của người mua trong 5-15 phút. Tồn kho Flash Sale sẽ tự động được hoàn trả vào kho của shop.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Bỏ qua
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
