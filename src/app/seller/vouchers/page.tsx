"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getSellerVouchers,
  createSellerVoucher,
  updateSellerVoucher,
  deleteSellerVoucher,
  toggleSellerVoucherStatus,
} from "@/lib/api/seller";
import type {
  SellerVoucherItem,
  CreateSellerVoucherPayload,
  UpdateSellerVoucherPayload,
} from "@/types/seller";

type VoucherTabKey = "ALL" | "ACTIVE" | "UPCOMING" | "EXPIRED";

function getInitialVoucherFormData(): CreateSellerVoucherPayload {
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(now.getDate() + 30);

  return {
    code: "",
    name: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscountAmount: 30000,
    minOrderAmount: 100000,
    totalUsageLimit: 100,
    userUsageLimit: 1,
    startDate: now.toISOString().split("T")[0],
    endDate: nextMonth.toISOString().split("T")[0],
  };
}

/**
 * Bắt kỹ ràng buộc nghiệp vụ cho Voucher của Shop
 */
function validateVoucherInput(data: {
  code?: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  totalUsageLimit: number;
  userUsageLimit?: number;
  startDate: string;
  endDate: string;
  currentUsageCount?: number;
  isEdit?: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  // 1. Mã voucher (chỉ kiểm tra khi tạo mới, khi sửa mã là cố định)
  if (!data.isEdit) {
    const trimmedCode = (data.code || "").trim().toUpperCase();
    if (!trimmedCode) {
      errors.code = "Vui lòng nhập mã voucher";
    } else if (trimmedCode.length < 3 || trimmedCode.length > 12) {
      errors.code = "Mã voucher phải có độ dài từ 3 đến 12 ký tự";
    } else if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      errors.code = "Mã voucher chỉ được chứa chữ cái in hoa không dấu và số (A-Z, 0-9)";
    }
  }

  // 2. Tên chương trình
  const trimmedName = (data.name || "").trim();
  if (!trimmedName) {
    errors.name = "Vui lòng nhập tên chương trình khuyến mãi";
  } else if (trimmedName.length < 3 || trimmedName.length > 100) {
    errors.name = "Tên voucher phải từ 3 đến 100 ký tự";
  }

  // 3. Mức giảm giá
  if (data.discountValue <= 0) {
    errors.discountValue = "Mức giảm giá phải lớn hơn 0";
  } else if (data.discountType === "PERCENTAGE") {
    if (data.discountValue < 1 || data.discountValue > 100) {
      errors.discountValue = "Phần trăm giảm giá phải nằm trong khoảng từ 1% đến 100%";
    }
    if (
      data.maxDiscountAmount !== undefined &&
      data.maxDiscountAmount !== null &&
      data.maxDiscountAmount <= 0
    ) {
      errors.maxDiscountAmount = "Mức giảm tối đa phải lớn hơn 0 ₫";
    }
  } else if (data.discountType === "FIXED_AMOUNT") {
    if (data.minOrderAmount > 0 && data.discountValue >= data.minOrderAmount) {
      errors.discountValue = "Số tiền giảm phải nhỏ hơn giá trị đơn hàng tối thiểu";
    }
  }

  // 4. Đơn hàng tối thiểu
  if (data.minOrderAmount < 0) {
    errors.minOrderAmount = "Giá trị đơn hàng tối thiểu không được âm";
  }

  // 5. Tổng số lượng phát hành
  if (data.totalUsageLimit <= 0) {
    errors.totalUsageLimit = "Tổng số lượng phát hành phải từ 1 lượt trở lên";
  } else if (
    data.isEdit &&
    data.currentUsageCount !== undefined &&
    data.totalUsageLimit < data.currentUsageCount
  ) {
    errors.totalUsageLimit = `Không thể giảm số lượng xuống dưới số lượt đã dùng (${data.currentUsageCount} lượt)`;
  }

  // 6. Giới hạn mỗi người
  if (
    data.userUsageLimit !== undefined &&
    (data.userUsageLimit < 1 || data.userUsageLimit > 50)
  ) {
    errors.userUsageLimit = "Giới hạn mỗi khách hàng phải từ 1 đến 50 lượt";
  }

  // 7. Thời gian hiệu lực
  if (!data.startDate) {
    errors.startDate = "Vui lòng chọn ngày bắt đầu";
  }
  if (!data.endDate) {
    errors.endDate = "Vui lòng chọn ngày kết thúc";
  }
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    } else {
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        errors.endDate = "Thời gian áp dụng voucher tối đa là 90 ngày theo quy định sàn";
      }
    }
  }

  return errors;
}

export default function SellerVouchersPage() {
  const [vouchers, setVouchers] = useState<SellerVoucherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currentTab, setCurrentTab] = useState<VoucherTabKey>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PERCENTAGE" | "FIXED_AMOUNT">("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateSellerVoucherPayload>(getInitialVoucherFormData());
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});

  // Detail Modal State
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<SellerVoucherItem | null>(null);

  // Edit Modal State
  const [selectedVoucherForEdit, setSelectedVoucherForEdit] = useState<SellerVoucherItem | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateSellerVoucherPayload>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // Delete Confirm Modal State
  const [selectedVoucherForDelete, setSelectedVoucherForDelete] = useState<SellerVoucherItem | null>(null);

  // Action loading & toast
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    if (msg.startsWith("⚠️") || msg.toLowerCase().includes("lỗi") || msg.toLowerCase().includes("không thể") || msg.toLowerCase().includes("thất bại")) {
      toast.error(msg);
    } else {
      toast.success(msg);
    }
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerReload = () => {
    fetchVouchers(false);
  };

  const fetchVouchers = useCallback(async (silent = false) => {
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
  }, [vouchers.length]);

  useEffect(() => {
    void fetchVouchers(false);
  }, [fetchVouchers]);

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
    const errors = validateVoucherInput({
      code: formData.code,
      name: formData.name,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      maxDiscountAmount: formData.maxDiscountAmount,
      minOrderAmount: formData.minOrderAmount,
      totalUsageLimit: formData.totalUsageLimit,
      userUsageLimit: formData.userUsageLimit,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isEdit: false,
    });

    if (Object.keys(errors).length > 0) {
      setCreateFormErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }
    setCreateFormErrors({});

    setFormLoading(true);
    try {
      const created = await createSellerVoucher(formData);
      setVouchers((prev) => [created, ...prev]);
      toast.success(`Đã tạo thành công voucher #${formData.code.toUpperCase()}`);
      setIsCreateOpen(false);
      setFormData(getInitialVoucherFormData());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo voucher";
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (voucher: SellerVoucherItem) => {
    setSelectedVoucherForEdit(voucher);
    setEditFormData({
      name: voucher.name,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount,
      minOrderAmount: voucher.minOrderAmount,
      totalUsageLimit: voucher.totalUsageLimit,
      userUsageLimit: voucher.userUsageLimit,
      startDate: voucher.startDate,
      endDate: voucher.endDate,
      status: voucher.status,
    });
    setEditFormErrors({});
  };

  // Submit Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucherForEdit) return;

    const errors = validateVoucherInput({
      name: editFormData.name || "",
      discountType: editFormData.discountType || "PERCENTAGE",
      discountValue: editFormData.discountValue ?? 0,
      maxDiscountAmount: editFormData.maxDiscountAmount,
      minOrderAmount: editFormData.minOrderAmount ?? 0,
      totalUsageLimit: editFormData.totalUsageLimit ?? 100,
      userUsageLimit: editFormData.userUsageLimit,
      startDate: editFormData.startDate || "",
      endDate: editFormData.endDate || "",
      currentUsageCount: selectedVoucherForEdit.currentUsageCount,
      isEdit: true,
    });

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(`⚠️ ${firstError}`);
      return;
    }
    setEditFormErrors({});

    setActionLoading(true);
    try {
      await updateSellerVoucher(selectedVoucherForEdit.id, editFormData);
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === selectedVoucherForEdit.id
            ? {
                ...v,
                ...editFormData,
                status: editFormData.status || v.status,
                name: editFormData.name || v.name,
                discountValue: editFormData.discountValue ?? v.discountValue,
                minOrderAmount: editFormData.minOrderAmount ?? v.minOrderAmount,
                maxDiscountAmount: editFormData.maxDiscountAmount ?? v.maxDiscountAmount,
                totalUsageLimit: editFormData.totalUsageLimit ?? v.totalUsageLimit,
                startDate: editFormData.startDate || v.startDate,
                endDate: editFormData.endDate || v.endDate,
              }
            : v
        )
      );
      toast.success(`Đã cập nhật thành công voucher #${selectedVoucherForEdit.code}`);
      setSelectedVoucherForEdit(null);
      // Cập nhật lại voucher nếu đang mở trong detail
      if (selectedVoucherForDetail && selectedVoucherForDetail.id === selectedVoucherForEdit.id) {
        setSelectedVoucherForDetail((prev) =>
          prev ? { ...prev, ...editFormData, status: editFormData.status || prev.status } : null
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật voucher thất bại";
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (voucher: SellerVoucherItem) => {
    setSelectedVoucherForDelete(voucher);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedVoucherForDelete) return;

    if (selectedVoucherForDelete.currentUsageCount > 0) {
      toast.error("Không thể xóa voucher đã có lượt đặt hàng!");
      return;
    }

    setActionLoading(true);
    try {
      await deleteSellerVoucher(selectedVoucherForDelete.id);
      setVouchers((prev) => prev.filter((v) => v.id !== selectedVoucherForDelete.id));
      toast.success(`Đã xóa vĩnh viễn voucher #${selectedVoucherForDelete.code}`);
      setSelectedVoucherForDelete(null);
      if (selectedVoucherForDetail && selectedVoucherForDetail.id === selectedVoucherForDelete.id) {
        setSelectedVoucherForDetail(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa voucher thất bại";
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle status (Khóa / Mở khóa voucher)
  const handleToggleStatus = async (voucher: SellerVoucherItem) => {
    const isCurrentlyActive = voucher.status === "ACTIVE" || voucher.status === "UPCOMING";
    const nextStatus = isCurrentlyActive ? "DISABLED" : "ACTIVE";
    try {
      await toggleSellerVoucherStatus(voucher.id, nextStatus);
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, status: nextStatus } : v))
      );
      if (selectedVoucherForDetail && selectedVoucherForDetail.id === voucher.id) {
        setSelectedVoucherForDetail((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      toast.success(
        nextStatus === "ACTIVE"
          ? `Đã mở khóa và kích hoạt voucher #${voucher.code}`
          : `Đã khóa và tạm dừng voucher #${voucher.code}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error(`Lỗi: ${msg}`);
    }
  };

  const formatVnd = (amount?: number) => {
    return (amount || 0).toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification (z-[9999] để luôn nổi trên mọi backdrop modal) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
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
              toast.info(
                "Quy định voucher của Shop: Shop tự tài trợ 100% chi phí giảm giá. Hiệu lực tối đa 90 ngày. Không thể chỉnh sửa mã voucher sau khi đã phát hành.",
                { duration: 6000 }
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
                  <th className="py-3 px-4 text-right min-w-[170px]">Thao tác</th>
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
                        <div className="flex items-center justify-end gap-1">
                          {/* Nút Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => setSelectedVoucherForDetail(v)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Xem chi tiết voucher"
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              visibility
                            </span>
                          </button>

                          {/* Nút Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa voucher"
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              edit
                            </span>
                          </button>

                          {/* Nút Xóa */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(v)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa voucher"
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              delete
                            </span>
                          </button>

                          {/* Nút Khóa / Mở khóa voucher (icon ổ khóa theo yêu cầu) */}
                          {v.status !== "EXPIRED" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(v)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                v.status === "DISABLED"
                                  ? "text-amber-600 hover:text-emerald-600 hover:bg-emerald-50 bg-amber-50"
                                  : "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                              }`}
                              title={
                                v.status === "DISABLED"
                                  ? "Voucher đang khóa (Tạm dừng) - Bấm để mở khóa & kích hoạt"
                                  : "Voucher đang mở - Bấm để khóa & tạm dừng"
                              }
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                {v.status === "DISABLED" ? "lock" : "lock_open"}
                              </span>
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 cursor-not-allowed inline-flex items-center"
                              title="Voucher đã hết hạn"
                            >
                              <span className="material-symbols-outlined text-[17px]">lock</span>
                            </span>
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

      {/* Centered Modal: Tạo voucher mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop mờ */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateOpen(false)}
          />

          {/* Modal Window nổi giữa màn hình */}
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">
                    confirmation_number
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Tạo voucher mới
                  </h2>
                  <p className="text-xs text-slate-500">
                    Thiết lập mã giảm giá riêng thuộc gian hàng của bạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateVoucher} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
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
                    {createFormErrors.code && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.code}</p>
                    )}
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
                    {createFormErrors.name && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.name}</p>
                    )}
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
                      max={formData.discountType === "PERCENTAGE" ? 100 : 5000000}
                      value={formData.discountValue || ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, discountValue: parseInt(e.target.value, 10) || 0 }))
                      }
                      placeholder={formData.discountType === "PERCENTAGE" ? "10" : "50000"}
                      className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {createFormErrors.discountValue && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.discountValue}</p>
                    )}
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
                      {createFormErrors.maxDiscountAmount && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.maxDiscountAmount}</p>
                      )}
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
                    {createFormErrors.minOrderAmount && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.minOrderAmount}</p>
                    )}
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
                    {createFormErrors.totalUsageLimit && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.totalUsageLimit}</p>
                    )}
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
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setFormData((p) => {
                          let nextEnd = p.endDate;
                          if (newStart && p.endDate && new Date(newStart).getTime() >= new Date(p.endDate).getTime()) {
                            const nextEndDate = new Date(newStart);
                            nextEndDate.setDate(nextEndDate.getDate() + 30);
                            nextEnd = nextEndDate.toISOString().split("T")[0];
                          }
                          return { ...p, startDate: newStart, endDate: nextEnd };
                        });
                        setCreateFormErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.startDate;
                          delete copy.endDate;
                          return copy;
                        });
                      }}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {createFormErrors.startDate && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Ngày kết thúc hiệu lực *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      min={formData.startDate || new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        setFormData((p) => ({ ...p, endDate: newEnd }));
                        if (formData.startDate && newEnd && new Date(newEnd).getTime() <= new Date(formData.startDate).getTime()) {
                          setCreateFormErrors((prev) => ({
                            ...prev,
                            endDate: "Ngày kết thúc phải sau ngày bắt đầu",
                          }));
                        } else {
                          setCreateFormErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.endDate;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full p-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        createFormErrors.endDate ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-200"
                      }`}
                    />
                    {createFormErrors.endDate && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{createFormErrors.endDate}</p>
                    )}
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
                    disabled={
                      formLoading ||
                      Boolean(createFormErrors.endDate) ||
                      Boolean(
                        formData.startDate &&
                        formData.endDate &&
                        new Date(formData.endDate).getTime() <= new Date(formData.startDate).getTime()
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    {formLoading ? "Đang xử lý..." : "Tạo voucher"}
                  </button>
                </div>
              </form>
            </div>
        </div>
      )}

      {/* Centered Modal: Xem chi tiết voucher */}
      {selectedVoucherForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedVoucherForDetail(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">
                    visibility
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Voucher #{selectedVoucherForDetail.code}</span>
                    {selectedVoucherForDetail.status === "ACTIVE" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang chạy
                      </span>
                    )}
                    {selectedVoucherForDetail.status === "UPCOMING" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Sắp diễn ra
                      </span>
                    )}
                    {selectedVoucherForDetail.status === "EXPIRED" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        Đã kết thúc
                      </span>
                    )}
                    {selectedVoucherForDetail.status === "DISABLED" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600">
                        Tạm dừng
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedVoucherForDetail.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucherForDetail(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Ticket Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white/20 tracking-wider">
                      Voucher Shop Tự Tài Trợ
                    </span>
                    <h3 className="text-2xl font-extrabold mt-2 tracking-tight">
                      {selectedVoucherForDetail.discountType === "PERCENTAGE"
                        ? `Giảm ${selectedVoucherForDetail.discountValue}%`
                        : `Giảm ${formatVnd(selectedVoucherForDetail.discountValue)}`}
                    </h3>
                    <p className="text-emerald-100 text-[11px] mt-0.5">
                      {selectedVoucherForDetail.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm tracking-widest bg-white/25 px-2.5 py-1 rounded-lg">
                      {selectedVoucherForDetail.code}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-emerald-100">
                  <span>Đơn tối thiểu: {formatVnd(selectedVoucherForDetail.minOrderAmount)}</span>
                  <span>HSD: {selectedVoucherForDetail.endDate}</span>
                </div>
              </div>

              {/* Progress Usage */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Tiến độ sử dụng lượt phát hành</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {selectedVoucherForDetail.currentUsageCount} / {selectedVoucherForDetail.totalUsageLimit} lượt (
                    {Math.round(
                      (selectedVoucherForDetail.currentUsageCount / selectedVoucherForDetail.totalUsageLimit) * 100
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (selectedVoucherForDetail.currentUsageCount / selectedVoucherForDetail.totalUsageLimit) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Còn lại:{" "}
                  <strong className="text-slate-700">
                    {Math.max(
                      0,
                      selectedVoucherForDetail.totalUsageLimit - selectedVoucherForDetail.currentUsageCount
                    )}{" "}
                    lượt
                  </strong>{" "}
                  chưa được áp dụng.
                </p>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block">Hình thức ưu đãi</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {selectedVoucherForDetail.discountType === "PERCENTAGE"
                      ? `Theo phần trăm (${selectedVoucherForDetail.discountValue}%)`
                      : `Số tiền cố định (${formatVnd(selectedVoucherForDetail.discountValue)})`}
                  </span>
                  {selectedVoucherForDetail.discountType === "PERCENTAGE" &&
                    selectedVoucherForDetail.maxDiscountAmount && (
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Giảm tối đa: {formatVnd(selectedVoucherForDetail.maxDiscountAmount)}
                      </span>
                    )}
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block">Điều kiện đơn hàng</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {formatVnd(selectedVoucherForDetail.minOrderAmount)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Áp dụng cho mọi sản phẩm của shop
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block">Thời gian hiệu lực</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {selectedVoucherForDetail.startDate} → {selectedVoucherForDetail.endDate}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block">Giới hạn mỗi khách hàng</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {selectedVoucherForDetail.userUsageLimit || 1} lượt / người
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  handleOpenDelete(selectedVoucherForDetail);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Xóa voucher</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedVoucherForDetail);
                    setSelectedVoucherForDetail(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoucherForDetail(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Modal: Chỉnh sửa voucher */}
      {selectedVoucherForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedVoucherForEdit(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">
                    edit_note
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Chỉnh sửa voucher #{selectedVoucherForEdit.code}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cập nhật chính sách và hạn sử dụng cho mã giảm giá
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucherForEdit(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Constraint Banner */}
              {selectedVoucherForEdit.currentUsageCount > 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">
                    info
                  </span>
                  <div>
                    <p className="font-bold">Voucher đã có {selectedVoucherForEdit.currentUsageCount} lượt sử dụng</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Mã voucher cố định không thể thay đổi. Số lượng phát hành tối thiểu phải từ{" "}
                      <strong>{selectedVoucherForEdit.currentUsageCount} lượt</strong> trở lên.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">lock</span>
                  <span>Mã voucher là mã cố định, không thể thay đổi sau khi tạo.</span>
                </div>
              )}

              {/* Code (Read-only) & Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Mã voucher (Cố định)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={selectedVoucherForEdit.code}
                      className="w-full p-2.5 text-xs font-mono font-bold uppercase bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                      lock
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tên chương trình voucher *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ""}
                    onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="VD: Giảm 10k đơn từ 99k"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {editFormErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.name}</p>
                  )}
                </div>
              </div>

              {/* Discount Value & Max Discount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {editFormData.discountType === "PERCENTAGE"
                      ? "Mức giảm (%) *"
                      : "Số tiền giảm (₫) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={editFormData.discountType === "PERCENTAGE" ? 100 : 5000000}
                    value={editFormData.discountValue ?? ""}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, discountValue: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {editFormErrors.discountValue && (
                    <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.discountValue}</p>
                  )}
                </div>

                {editFormData.discountType === "PERCENTAGE" && (
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Mức giảm tối đa (₫)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={editFormData.maxDiscountAmount ?? ""}
                      onChange={(e) =>
                        setEditFormData((p) => ({ ...p, maxDiscountAmount: parseInt(e.target.value, 10) || 0 }))
                      }
                      placeholder="VD: 30000"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {editFormErrors.maxDiscountAmount && (
                      <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.maxDiscountAmount}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Min Order & Total Usage Limit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Đơn hàng tối thiểu (₫) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={5000}
                    value={editFormData.minOrderAmount ?? ""}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, minOrderAmount: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {editFormErrors.minOrderAmount && (
                    <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.minOrderAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tổng số lượng phát hành *
                  </label>
                  <input
                    type="number"
                    required
                    min={selectedVoucherForEdit.currentUsageCount || 1}
                    value={editFormData.totalUsageLimit ?? ""}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, totalUsageLimit: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {editFormErrors.totalUsageLimit ? (
                    <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.totalUsageLimit}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Đã sử dụng: {selectedVoucherForEdit.currentUsageCount} lượt (Tối thiểu phải bằng mức này)
                    </p>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Ngày bắt đầu hiệu lực *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.startDate || ""}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEditFormData((p) => {
                        let nextEnd = p.endDate;
                        if (newStart && p.endDate && new Date(newStart).getTime() >= new Date(p.endDate).getTime()) {
                          const nextEndDate = new Date(newStart);
                          nextEndDate.setDate(nextEndDate.getDate() + 30);
                          nextEnd = nextEndDate.toISOString().split("T")[0];
                        }
                        return { ...p, startDate: newStart, endDate: nextEnd };
                      });
                      setEditFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.startDate;
                        delete copy.endDate;
                        return copy;
                      });
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {editFormErrors.startDate && (
                    <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Ngày kết thúc hiệu lực *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.endDate || ""}
                    min={editFormData.startDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setEditFormData((p) => ({ ...p, endDate: newEnd }));
                      if (editFormData.startDate && newEnd && new Date(newEnd).getTime() <= new Date(editFormData.startDate).getTime()) {
                        setEditFormErrors((prev) => ({
                          ...prev,
                          endDate: "Ngày kết thúc phải sau ngày bắt đầu",
                        }));
                      } else {
                        setEditFormErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.endDate;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full p-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      editFormErrors.endDate ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-200"
                    }`}
                  />
                  {editFormErrors.endDate && (
                    <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Trạng thái Voucher */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Trạng thái voucher *
                </label>
                <select
                  value={editFormData.status || "ACTIVE"}
                  onChange={(e) => setEditFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ACTIVE">🟢 Đang hoạt động (Kích hoạt cho khách áp dụng)</option>
                  <option value="DISABLED">🔒 Tạm dừng / Khóa (Tạm ngừng áp dụng)</option>
                  <option value="UPCOMING">🔵 Sắp diễn ra (Chờ ngày mở)</option>
                  <option value="EXPIRED">⚪ Đã kết thúc (Hết hiệu lực)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Bạn có thể chọn &quot;Tạm dừng / Khóa&quot; để tạm dừng áp dụng voucher này mà không làm mất thông tin mã.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedVoucherForEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading ||
                    Boolean(editFormErrors.endDate) ||
                    Boolean(
                      editFormData.startDate &&
                      editFormData.endDate &&
                      new Date(editFormData.endDate).getTime() <= new Date(editFormData.startDate).getTime()
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{actionLoading ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centered Modal: Xác nhận xóa voucher */}
      {selectedVoucherForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedVoucherForDelete(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
            {selectedVoucherForDelete.currentUsageCount > 0 ? (
              // Trường hợp 1: Không được xóa vì đã có lượt đặt hàng
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">block</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Không thể xóa voucher này
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Voucher <strong className="text-slate-900">#{selectedVoucherForDelete.code}</strong> đã phát sinh{" "}
                  <strong className="text-emerald-700">{selectedVoucherForDelete.currentUsageCount} lượt sử dụng</strong>{" "}
                  trong các đơn hàng của khách.
                </p>
                <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600">
                  <p className="font-semibold text-slate-800 mb-1">Quy định bảo toàn dữ liệu:</p>
                  <p className="text-[11px] text-slate-500">
                    Để đảm bảo lịch sử đơn hàng và quyết toán tài chính, voucher đã có lượt dùng không thể xóa vĩnh viễn. Bạn có thể chọn <strong>Tạm dừng</strong> voucher này để khách hàng không thể dùng tiếp.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2.5 mt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedVoucherForDelete(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Đóng
                  </button>
                  {selectedVoucherForDelete.status !== "DISABLED" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleStatus(selectedVoucherForDelete);
                        setSelectedVoucherForDelete(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors"
                    >
                      Tạm dừng voucher ngay
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Trường hợp 2: Chưa có lượt dùng -> Cho phép xóa vĩnh viễn
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">delete_forever</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Xác nhận xóa voucher
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn có chắc chắn muốn xóa vĩnh viễn voucher{" "}
                  <strong className="text-slate-900">#{selectedVoucherForDelete.code}</strong> (
                  {selectedVoucherForDelete.name})?
                </p>
                <p className="text-[11px] text-rose-600 font-medium mt-2 bg-rose-50 py-1.5 px-3 rounded-lg border border-rose-200">
                  ⚠️ Thao tác này không thể hoàn tác sau khi xác nhận.
                </p>
                <div className="flex items-center justify-center gap-2.5 mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedVoucherForDelete(null)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>{actionLoading ? "Đang xóa..." : "Xác nhận xóa"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
