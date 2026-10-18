"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getSellerVouchers,
  createSellerVoucher,
  toggleSellerVoucherStatus,
} from "@/lib/api/seller";
import type {
  SellerVoucherItem,
  CreateSellerVoucherPayload,
} from "@/types/seller";

type VoucherTabKey = "ALL" | "ACTIVE" | "UPCOMING" | "EXPIRED";

const DEFAULT_FORM_DATA: CreateSellerVoucherPayload = {
  code: "",
  name: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  maxDiscountAmount: 30000,
  minOrderAmount: 150000,
  totalUsageLimit: 100,
  userUsageLimit: 1,
  startDate: "2026-10-18",
  endDate: "2026-11-01",
};

export default function SellerVouchersPage() {
  const [vouchers, setVouchers] = useState<SellerVoucherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currentTab, setCurrentTab] = useState<VoucherTabKey>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PERCENTAGE" | "FIXED_AMOUNT">("ALL");
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Drawer Create Form State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateSellerVoucherPayload>(DEFAULT_FORM_DATA);

  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerReload = () => {
    fetchVouchers(false);
  };

  const fetchVouchers = async (silent = false) => {
    if (!silent && vouchers.length === 0) setLoading(true);
    try {
      const res = await getSellerVouchers(0, 100);
      const list = res.content || [];
      setVouchers(list);
      setError(null);
    } catch (err: unknown) {
      if (!silent && vouchers.length === 0) {
        const msg = err instanceof Error ? err.message : "Không thể tải danh sách voucher";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers(false);
  }, []);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<VoucherTabKey, number> = {
      ALL: vouchers.length,
      ACTIVE: 0,
      UPCOMING: 0,
      EXPIRED: 0,
    };
    vouchers.forEach((v) => {
      const st = (v.status || "").toUpperCase() as VoucherTabKey;
      if (st in counts) counts[st]++;
    });
    return counts;
  }, [vouchers]);

  // Filtered list
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (currentTab !== "ALL" && v.status !== currentTab) return false;
      if (typeFilter !== "ALL" && v.discountType !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const code = (v.code || "").toLowerCase();
        const name = (v.name || "").toLowerCase();
        if (!code.includes(q) && !name.includes(q)) return false;
      }
      return true;
    });
  }, [vouchers, currentTab, typeFilter, searchTerm]);

  // Submit create voucher
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert("Vui lòng nhập mã voucher");
      return;
    }
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên chương trình voucher");
      return;
    }
    if (formData.discountValue <= 0) {
      alert("Giá trị giảm giá phải lớn hơn 0");
      return;
    }

    setFormLoading(true);
    try {
      const created = await createSellerVoucher(formData);
      setVouchers((prev) => [created, ...prev]);
      showToast(`Đã tạo thành công voucher #${formData.code.toUpperCase()}`);
      setIsCreateOpen(false);
      // Reset form
      setFormData(DEFAULT_FORM_DATA);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo voucher";
      showToast(`Lỗi: ${msg}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (voucher: SellerVoucherItem) => {
    const nextStatus = voucher.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await toggleSellerVoucherStatus(voucher.id, nextStatus);
      showToast(`Đã chuyển voucher ${voucher.code} sang ${nextStatus}`);
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      alert(msg);
    }
  };

  const formatVnd = (amount?: number) => {
    return (amount || 0).toLocaleString("vi-VN") + " ₫";
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
        <span className="text-slate-800 font-semibold">Voucher của shop</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Voucher của shop
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo và quản lý các mã giảm giá do Shop tự tài trợ để kích cầu đơn hàng và tăng tỷ lệ chuyển đổi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              alert(
                "Quy định voucher của Shop:\n- Shop tự chi trả 100% ngân sách giảm giá.\n- Thời gian tối đa cho 1 voucher là 60 ngày.\n- Mã không phân biệt hoa thường khi người mua nhập."
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 text-[18px]">
              help
            </span>
            Quy định voucher
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tạo voucher mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-max px-4">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "ACTIVE", label: "Đang diễn ra" },
            { key: "UPCOMING", label: "Sắp diễn ra" },
            { key: "EXPIRED", label: "Đã kết thúc" },
          ].map((tab) => {
            const isActive = currentTab === tab.key;
            const count = tabCounts[tab.key as VoucherTabKey] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key as VoucherTabKey)}
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

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã voucher, tên chương trình..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "ALL" | "PERCENTAGE" | "FIXED_AMOUNT")}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Tất cả hình thức</option>
            <option value="PERCENTAGE">Theo phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
          </select>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
            >
              Xóa tìm
            </button>
          )}
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && vouchers.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 w-full bg-slate-50/70 animate-pulse rounded-xl border border-slate-100 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200/60 rounded-xl"></div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-slate-200/60 rounded"></div>
                    <div className="h-2.5 w-20 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-32 bg-slate-200/60 rounded hidden md:block"></div>
                <div className="h-4 w-24 bg-slate-200/60 rounded"></div>
                <div className="h-6 w-20 bg-slate-200/60 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : error && vouchers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
            <button
              onClick={triggerReload}
              className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Thử lại
            </button>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined mb-2 text-[32px]">
              confirmation_number
            </span>
            <p className="text-base font-semibold text-slate-800">
              Không tìm thấy voucher nào
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Nhấn &quot;Tạo voucher mới&quot; để thiết lập mã giảm giá đầu tiên cho khách hàng của gian hàng.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[170px]">Mã Voucher & Tên</th>
                  <th className="py-3 px-4 min-w-[160px]">Loại & Mức giảm</th>
                  <th className="py-3 px-4 min-w-[120px]">Đơn tối thiểu</th>
                  <th className="py-3 px-4 min-w-[150px]">Đã dùng / Phát hành</th>
                  <th className="py-3 px-4 min-w-[150px]">Thời gian hiệu lực</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">Trạng thái</th>
                  <th className="py-3 px-4 text-right min-w-[110px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => {
                  const usedPercent = Math.min(
                    100,
                    Math.round((v.currentUsageCount / v.totalUsageLimit) * 100)
                  );
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {v.code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.code);
                              showToast(`Đã sao chép mã ${v.code}`);
                            }}
                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Sao chép mã"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              content_copy
                            </span>
                          </button>
                        </div>
                        <p className="text-slate-700 font-semibold mt-1 truncate max-w-[200px]">
                          {v.name}
                        </p>
                      </td>

                      {/* Discount Type & Value */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {v.discountType === "PERCENTAGE"
                            ? `Giảm ${v.discountValue}%`
                            : `Giảm ${formatVnd(v.discountValue)}`}
                        </p>
                        {v.discountType === "PERCENTAGE" && v.maxDiscountAmount && (
                          <p className="text-[10px] text-slate-400">
                            Tối đa {formatVnd(v.maxDiscountAmount)}
                          </p>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatVnd(v.minOrderAmount)}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="w-full max-w-[120px] space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                            <span>{v.currentUsageCount}</span>
                            <span>{v.totalUsageLimit} lượt</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${usedPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <p>{v.startDate}</p>
                        <p className="text-[10px] text-slate-400">đến {v.endDate}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {v.status === "ACTIVE" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đang chạy
                          </span>
                        )}
                        {v.status === "UPCOMING" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Sắp diễn ra
                          </span>
                        )}
                        {v.status === "EXPIRED" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Đã kết thúc
                          </span>
                        )}
                        {v.status === "DISABLED" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600">
                            Tạm dừng
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.status === "ACTIVE" && (
                            <button
                              onClick={() => handleToggleStatus(v)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Tạm dừng voucher"
                            >
                              Tạm dừng
                            </button>
                          )}
                          {v.status === "DISABLED" && (
                            <button
                              onClick={() => handleToggleStatus(v)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Kích hoạt lại"
                            >
                              Kích hoạt
                            </button>
                          )}
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

      {/* 560px Create Voucher Slide-Over Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-[560px] bg-white shadow-2xl flex flex-col border-l border-slate-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">
                      confirmation_number
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Tạo voucher mới
                    </h2>
                    <p className="text-xs text-slate-500">
                      Thiết lập mã giảm giá riêng cho gian hàng
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleCreateVoucher} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Live Ticket Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-8 flex flex-col justify-around items-center opacity-30 pointer-events-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white/20 tracking-wider">
                        Voucher Gian Hàng
                      </span>
                      <h3 className="text-xl font-extrabold mt-2 tracking-tight">
                        {formData.discountType === "PERCENTAGE"
                          ? `Giảm ${formData.discountValue || 0}%`
                          : `Giảm ${formatVnd(formData.discountValue)}`}
                      </h3>
                      <p className="text-emerald-100 text-[11px] mt-0.5">
                        {formData.name || "Tên chương trình khuyến mãi"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm tracking-widest bg-white/25 px-2.5 py-1 rounded-lg">
                        {formData.code.toUpperCase() || "CODE10K"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-emerald-100">
                    <span>Đơn tối thiểu: {formatVnd(formData.minOrderAmount)}</span>
                    <span>HSD: {formData.endDate || "--/--/----"}</span>
                  </div>
                </div>

                {/* Form fields */}
                {/* Discount type toggle */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2">
                    Loại hình giảm giá *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, discountType: "PERCENTAGE" }))}
                      className={`p-3 rounded-xl border text-center font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.discountType === "PERCENTAGE"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">percent</span>
                      <span>Theo phần trăm (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, discountType: "FIXED_AMOUNT" }))}
                      className={`p-3 rounded-xl border text-center font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.discountType === "FIXED_AMOUNT"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">attach_money</span>
                      <span>Số tiền cố định (₫)</span>
                    </button>
                  </div>
                </div>

                {/* Code & Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Mã voucher *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, "") }))
                      }
                      placeholder="VD: UTC10K"
                      className="w-full p-2.5 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Tên chương trình voucher *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="VD: Giảm 10k đơn từ 99k"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Discount Value & Max Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      {formData.discountType === "PERCENTAGE"
                        ? "Mức giảm (%) *"
                        : "Số tiền giảm (₫) *"}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formData.discountType === "PERCENTAGE" ? 99 : 5000000}
                      value={formData.discountValue || ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, discountValue: parseInt(e.target.value, 10) || 0 }))
                      }
                      placeholder={formData.discountType === "PERCENTAGE" ? "10" : "50000"}
                      className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {formData.discountType === "PERCENTAGE" && (
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Mức giảm tối đa (₫)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={formData.maxDiscountAmount || ""}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, maxDiscountAmount: parseInt(e.target.value, 10) || 0 }))
                        }
                        placeholder="VD: 30000"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* Min Order Amount & Total Limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Giá trị đơn hàng tối thiểu (₫) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={5000}
                      value={formData.minOrderAmount || ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, minOrderAmount: parseInt(e.target.value, 10) || 0 }))
                      }
                      placeholder="VD: 150000"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Tổng số lượng phát hành *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.totalUsageLimit || ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, totalUsageLimit: parseInt(e.target.value, 10) || 0 }))
                      }
                      placeholder="VD: 100"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Ngày bắt đầu hiệu lực *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Ngày kết thúc hiệu lực *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Drawer Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    {formLoading ? "Đang xử lý..." : "Tạo voucher"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
