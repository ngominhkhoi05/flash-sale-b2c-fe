"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import Image from "next/image";
import { AdminVoucher, VoucherKpis } from "@/types/voucher";
import { voucherMockService } from "@/lib/mocks/vouchers.mock";
import {
  getAdminPlatformVouchers,
  createAdminPlatformVoucher,
  getAdminVoucherKpis,
} from "@/lib/api/admin";
import {
  VoucherFormDrawer,
  VoucherDetailDrawer,
} from "@/components/admin/vouchers";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

export default function AdminVouchersPage() {
  const [, startTransition] = useTransition();

  // Filter state
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedVoucherForEdit, setSelectedVoucherForEdit] =
    useState<AdminVoucher | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] =
    useState<AdminVoucher | null>(null);

  const [voucherToDelete, setVoucherToDelete] = useState<AdminVoucher | null>(
    null
  );
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // State for vouchers & KPIs
  const [data, setData] = useState<ReturnType<typeof voucherMockService.getAll>>(() =>
    voucherMockService.getAll({ page: 0, pageSize: 10 })
  );
  const [kpis, setKpis] = useState<VoucherKpis>(() => voucherMockService.getKpis());

  // Load vouchers from BE API with fallback
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAdminPlatformVouchers({
        status: activeTab,
        search: searchQuery,
        discountType: discountTypeFilter || undefined,
        scope: scopeFilter || undefined,
        page,
        pageSize,
      }),
      getAdminVoucherKpis(),
    ])
      .then(([vouchersRes, kpisRes]) => {
        if (!cancelled) {
          setData(vouchersRes);
          setKpis(kpisRes);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(
            voucherMockService.getAll({
              status: activeTab,
              search: searchQuery,
              discountType: discountTypeFilter || undefined,
              scope: scopeFilter || undefined,
              page,
              pageSize,
            })
          );
          setKpis(voucherMockService.getKpis());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, searchQuery, discountTypeFilter, scopeFilter, page, pageSize, refreshKey]);

  const recentHistory = useMemo(() => {
    void refreshKey;
    return voucherMockService.getUsageHistory();
  }, [refreshKey]);

  // Handlers
  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`Đã sao chép mã voucher: ${code}`);
    }
  };

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = voucherMockService.toggleStatus(id);
      startTransition(() => {
        setRefreshKey((k) => k + 1);
      });
      showToast(
        updated.isActive
          ? `Đã kích hoạt lại mã ${updated.code}`
          : `Đã tạm tắt mã ${updated.code}`
      );
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Có lỗi xảy ra");
    }
  };

  const handleCreateVoucher = async (formValues: Parameters<typeof voucherMockService.create>[0]) => {
    try {
      const created = await createAdminPlatformVoucher(formValues);
      startTransition(() => {
        setRefreshKey((k) => k + 1);
      });
      showToast(`Đã tạo thành công voucher: ${created.code}`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Không thể tạo voucher");
    }
  };

  const handleEditVoucher = (formValues: Parameters<typeof voucherMockService.update>[1]) => {
    if (!selectedVoucherForEdit) return;
    try {
      const updated = voucherMockService.update(selectedVoucherForEdit.id, formValues);
      startTransition(() => {
        setRefreshKey((k) => k + 1);
      });
      showToast(`Đã cập nhật voucher: ${updated.code}`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Không thể cập nhật voucher");
    }
  };

  const handleDeleteConfirm = () => {
    if (!voucherToDelete) return;
    try {
      voucherMockService.delete(voucherToDelete.id);
      startTransition(() => {
        setRefreshKey((k) => k + 1);
      });
      showToast(`Đã xóa voucher ${voucherToDelete.code}`);
      setVoucherToDelete(null);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Không thể xóa voucher");
      setVoucherToDelete(null);
    }
  };

  const handleDuplicate = (v: AdminVoucher) => {
    setFormMode("create");
    setSelectedVoucherForEdit({
      ...v,
      code: `${v.code}_COPY`,
    });
    setIsFormOpen(true);
    setOpenActionMenuId(null);
  };

  const totalPages = Math.ceil(data.total / pageSize) || 1;

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-on-surface text-surface-container-lowest shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-[20px] text-primary">
            check_circle
          </span>
          <span className="font-body-sm text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Content Container */}
      <div className="p-margin flex flex-col gap-space-lg">
        {/* 1. Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-high text-primary">
                <span className="material-symbols-outlined text-[18px]">loyalty</span>
              </span>
              <span className="font-label-sm text-xs tracking-wider uppercase text-secondary font-semibold">
                Khuyến mãi &amp; Marketing
              </span>
            </div>
            <h1 className="font-display-sm text-2xl font-bold text-on-surface tracking-tight">
              Voucher sàn
            </h1>
            <p className="font-body-sm text-sm text-secondary">
              Quản lý và thiết lập mã ưu đãi trợ giá bởi sàn Vibe Mart áp dụng toàn hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-space-sm self-start lg:self-center">
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-sm hover:bg-surface-container transition-colors shadow-sm"
              onClick={() => showToast("Đang mở cấu hình ngân sách tài trợ sàn...")}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                tune
              </span>
              <span>Cấu hình ngân sách</span>
            </button>

            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-sm hover:bg-surface-container transition-colors shadow-sm"
              onClick={() => showToast("Đã xuất báo cáo danh sách voucher sàn (CSV).")}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                download
              </span>
              <span>Xuất báo cáo</span>
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-body-md text-sm font-semibold hover:bg-primary-container transition-all shadow-sm active:scale-95"
              onClick={() => {
                setFormMode("create");
                setSelectedVoucherForEdit(null);
                setIsFormOpen(true);
              }}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Tạo voucher sàn</span>
            </button>
          </div>
        </div>

        {/* 2. 3 Thẻ KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          {/* KPI 1: Voucher đang chạy */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-secondary">
                Dữ liệu mẫu
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-xs uppercase tracking-wider text-secondary font-medium">
                  Voucher đang chạy
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display-sm text-2xl font-bold font-data-tabular text-on-surface">
                    {kpis?.activeCount ?? 0} mã
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[14px]">
                      trending_up
                    </span>
                    <span>▲ {kpis?.newThisWeekCount ?? 0} mã tuần này</span>
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">
                  confirmation_number
                </span>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex items-center justify-between text-xs text-secondary border-t border-outline-variant/20">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>{kpis?.shippingVoucherCount ?? 0} mã trợ giá vận chuyển</span>
              </span>
              <span className="text-on-surface font-medium">
                {kpis?.discountVoucherCount ?? 0} mã giảm đơn
              </span>
            </div>
          </div>

          {/* KPI 2: Lượt dùng tháng này */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-secondary">
                Dữ liệu mẫu
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-xs uppercase tracking-wider text-secondary font-medium">
                  Lượt dùng tháng này
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display-sm text-2xl font-bold font-data-tabular text-on-surface">
                    {(kpis?.usedCountThisMonth ?? 0).toLocaleString("vi-VN")}
                  </span>
                  <span className="font-body-sm text-xs text-secondary">lượt</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">
                  query_stats
                </span>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex flex-col gap-1.5 border-t border-outline-variant/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Tỷ lệ sử dụng thực tế</span>
                <span className="text-on-surface font-semibold font-data-tabular">
                  {kpis?.utilizationRate ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${kpis?.utilizationRate ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 3: Tổng sàn đã trợ giá */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-secondary">
                Dữ liệu mẫu
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-xs uppercase tracking-wider text-secondary font-medium">
                  Tổng sàn đã trợ giá
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display-sm text-2xl font-bold font-data-tabular text-primary">
                    {(kpis?.totalPlatformSubsidized ?? 0).toLocaleString("vi-VN")}
                  </span>
                  <span className="font-headline-md text-lg text-primary font-bold">
                    ₫
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">
                  account_balance_wallet
                </span>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex flex-col gap-1.5 border-t border-outline-variant/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">
                  Ngân sách giải ngân (Hạn mức{" "}
                  {(((kpis?.budgetCap ?? 0) / 1000000)).toLocaleString("vi-VN")}M)
                </span>
                <span className="text-on-surface font-semibold font-data-tabular">
                  {kpis?.budgetUtilizationRate ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${kpis?.budgetUtilizationRate ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Data Container: Filter Tabs & Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Status Tabs */}
          <div className="p-space-md flex flex-col gap-space-md border-b border-outline-variant/20">
            <div className="flex items-center justify-between flex-wrap gap-space-sm">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: "ALL", label: "Tất cả", count: data.counts.ALL },
                  { key: "ACTIVE", label: "Đang diễn ra", count: data.counts.ACTIVE },
                  { key: "UPCOMING", label: "Sắp diễn ra", count: data.counts.UPCOMING },
                  {
                    key: "OUT_OF_STOCK",
                    label: "Đã hết lượt",
                    count: data.counts.OUT_OF_STOCK,
                  },
                  { key: "EXPIRED", label: "Đã kết thúc", count: data.counts.EXPIRED },
                  { key: "DISABLED", label: "Đã tắt", count: data.counts.DISABLED },
                ].map((t) => (
                  <button
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === t.key
                        ? "bg-surface-container text-primary font-semibold"
                        : "text-secondary hover:text-on-surface hover:bg-surface-container-low"
                    }`}
                    key={t.key}
                    onClick={() => {
                      setActiveTab(t.key);
                      setPage(0);
                    }}
                    type="button"
                  >
                    {t.label}{" "}
                    <span
                      className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                        activeTab === t.key
                          ? "bg-primary-fixed text-on-primary-fixed-variant"
                          : "bg-surface-container text-secondary"
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-secondary">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Cập nhật số liệu tự động</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-space-md flex-wrap pt-space-xs">
              <div className="flex items-center gap-space-sm flex-1 min-w-[280px] max-w-2xl">
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface font-body-sm text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/30"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Tìm theo mã voucher (VD: VIBEMART50, FREESHIP...)"
                    type="text"
                    value={searchQuery}
                  />
                </div>

                <div className="relative shrink-0">
                  <select
                    className="h-10 px-3 pr-8 rounded-lg bg-surface font-body-sm text-xs text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border border-transparent focus:border-primary/30"
                    onChange={(e) => {
                      setDiscountTypeFilter(e.target.value);
                      setPage(0);
                    }}
                    value={discountTypeFilter}
                  >
                    <option value="">Tất cả loại giảm</option>
                    <option value="PERCENT">Giảm theo %</option>
                    <option value="FIXED">Giảm tiền cố định</option>
                    <option value="SHIPPING">Miễn phí ship</option>
                    <option value="COIN">Hoàn xu Vibe</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>

                <div className="relative shrink-0">
                  <select
                    className="h-10 px-3 pr-8 rounded-lg bg-surface font-body-sm text-xs text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border border-transparent focus:border-primary/30"
                    onChange={(e) => {
                      setScopeFilter(e.target.value);
                      setPage(0);
                    }}
                    value={scopeFilter}
                  >
                    <option value="">Phạm vi áp dụng</option>
                    <option value="ALL">Toàn sàn (Tất cả)</option>
                    <option value="MALL">Chỉ Vibe Mall</option>
                    <option value="NEW_USER">Khách hàng mới</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-xs text-xs text-secondary">
                <span>
                  Hiển thị <strong>{data.items.length}</strong> / {data.total} voucher
                </span>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1080px]">
              <thead>
                <tr className="h-11 bg-surface-container-low text-secondary font-label-sm text-xs uppercase tracking-wider select-none border-b border-outline-variant/30">
                  <th className="px-space-md font-semibold">Mã Voucher</th>
                  <th className="px-space-md font-semibold">Mức giảm</th>
                  <th className="px-space-md font-semibold">Đơn tối thiểu</th>
                  <th className="px-space-md font-semibold w-56">Đã dùng / Tổng lượt</th>
                  <th className="px-space-md font-semibold text-center">Giới hạn / Khách</th>
                  <th className="px-space-md font-semibold">Thời gian hiệu lực</th>
                  <th className="px-space-md font-semibold">Trạng thái</th>
                  <th className="px-space-md font-semibold text-center">Kích hoạt</th>
                  <th className="px-space-md font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-md text-sm">
                {!data?.items || data.items.length === 0 ? (
                  <tr>
                    <td
                      className="px-space-md py-12 text-center text-secondary"
                      colSpan={9}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-outline mb-2">
                          search_off
                        </span>
                        <span className="font-medium text-sm">
                          Không tìm thấy voucher phù hợp với bộ lọc
                        </span>
                        <button
                          className="mt-3 px-3 py-1.5 text-xs text-primary font-semibold hover:underline"
                          onClick={() => {
                            setActiveTab("ALL");
                            setSearchQuery("");
                            setDiscountTypeFilter("");
                            setScopeFilter("");
                          }}
                          type="button"
                        >
                          Xóa bộ lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.items.map((voucher) => {
                    const used = voucher.usedCount || 0;
                    const total = voucher.totalCount || 1;
                    const percent = Math.min(
                      100,
                      Math.round((used / total) * 100)
                    );
                    const isHighUsage = percent >= 90;
                    const isToggleDisabled =
                      voucher.status === "EXPIRED" ||
                      voucher.status === "OUT_OF_STOCK";

                    return (
                      <tr
                        className="h-14 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                        key={voucher.id}
                        onClick={() => {
                          setSelectedVoucherForDetail(voucher);
                          setIsDetailOpen(true);
                        }}
                      >
                        {/* Mã Voucher */}
                        <td className="px-space-md">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                              <span className="material-symbols-outlined text-[18px]">
                                {voucher.discountType === "SHIPPING"
                                  ? "local_shipping"
                                  : voucher.discountType === "COIN"
                                  ? "toll"
                                  : "sell"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold tracking-wide font-data-tabular text-on-surface text-[14px] font-mono">
                                  {voucher.code}
                                </span>
                                <button
                                  className="text-secondary hover:text-primary transition-colors p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(voucher.code);
                                  }}
                                  title="Sao chép mã"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    content_copy
                                  </span>
                                </button>
                              </div>
                              <span className="text-xs text-secondary truncate max-w-[180px]">
                                {voucher.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Mức giảm */}
                        <td className="px-space-md">
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface font-data-tabular">
                              {voucher.discountType === "PERCENT"
                                ? `Giảm ${voucher.discountValue}%`
                                : voucher.discountType === "SHIPPING"
                                ? `Giảm ${(voucher.discountValue ?? 0).toLocaleString("vi-VN")}₫`
                                : voucher.discountType === "COIN"
                                ? `Hoàn ${voucher.discountValue}% xu`
                                : `Giảm ${(voucher.discountValue ?? 0).toLocaleString("vi-VN")}₫`}
                            </span>
                            <span className="text-xs text-secondary">
                              {voucher.discountType === "PERCENT" && voucher.maxDiscountAmount
                                ? `Tối đa ${(voucher.maxDiscountAmount ?? 0).toLocaleString("vi-VN")}₫`
                                : voucher.discountType === "SHIPPING"
                                ? "Phí ship"
                                : voucher.discountType === "COIN"
                                ? "Xu tích lũy"
                                : "Trực tiếp"}
                            </span>
                          </div>
                        </td>

                        {/* Đơn tối thiểu */}
                        <td className="px-space-md">
                          <span className="font-data-tabular font-medium text-on-surface">
                            {(voucher.minOrderAmount ?? 0) === 0
                              ? "0₫"
                              : `${(voucher.minOrderAmount ?? 0).toLocaleString("vi-VN")}₫`}
                          </span>
                        </td>

                        {/* Đã dùng / Tổng lượt */}
                        <td className="px-space-md">
                          <div className="flex flex-col gap-1 w-full max-w-[200px]">
                            <div className="flex items-center justify-between text-xs font-data-tabular">
                              <span className="font-semibold text-on-surface">
                                {(voucher.usedCount ?? 0).toLocaleString("vi-VN")}{" "}
                                <span className="text-secondary font-normal">
                                  / {(voucher.totalCount ?? 0).toLocaleString("vi-VN")}
                                </span>
                              </span>
                              <span
                                className={`font-semibold ${
                                  isHighUsage ? "text-tertiary" : "text-primary"
                                }`}
                              >
                                {percent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHighUsage ? "bg-tertiary" : "bg-primary"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Giới hạn / khách */}
                        <td className="px-space-md text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-surface-container text-xs font-medium text-on-surface font-data-tabular">
                            {voucher.limitPerCustomer} lượt
                          </span>
                        </td>

                        {/* Thời gian hiệu lực */}
                        <td className="px-space-md">
                          <div className="flex flex-col text-xs font-data-tabular">
                            <span className="font-semibold text-on-surface">
                              {new Date(voucher.startDate).toLocaleDateString("vi-VN")} -{" "}
                              {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                            </span>
                            <span className="text-secondary">
                              {voucher.status === "ACTIVE"
                                ? "Đang có hiệu lực"
                                : voucher.status === "UPCOMING"
                                ? "Chưa mở"
                                : "Hết hiệu lực"}
                            </span>
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-space-md">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              voucher.status === "ACTIVE"
                                ? "bg-primary/10 text-primary"
                                : voucher.status === "UPCOMING"
                                ? "bg-secondary-container/60 text-secondary"
                                : voucher.status === "OUT_OF_STOCK"
                                ? "bg-error-container text-error"
                                : voucher.status === "EXPIRED"
                                ? "bg-surface-container text-secondary"
                                : "bg-surface-container text-outline"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                voucher.status === "ACTIVE"
                                  ? "bg-primary animate-pulse"
                                  : voucher.status === "UPCOMING"
                                  ? "bg-secondary"
                                  : voucher.status === "OUT_OF_STOCK"
                                  ? "bg-error"
                                  : "bg-outline"
                              }`}
                            />
                            <span>
                              {voucher.status === "ACTIVE"
                                ? "Đang diễn ra"
                                : voucher.status === "UPCOMING"
                                ? "Sắp diễn ra"
                                : voucher.status === "OUT_OF_STOCK"
                                ? "Đã hết lượt"
                                : voucher.status === "EXPIRED"
                                ? "Đã kết thúc"
                                : "Đã tắt"}
                            </span>
                          </span>
                        </td>

                        {/* Kích hoạt Toggle */}
                        <td className="px-space-md text-center">
                          <label
                            className={`relative inline-flex items-center ${
                              isToggleDisabled
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              checked={voucher.isActive}
                              className="sr-only peer"
                              disabled={isToggleDisabled}
                              onChange={(e) => handleToggleStatus(voucher.id, e as unknown as React.MouseEvent)}
                              type="checkbox"
                            />
                            <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                          </label>
                        </td>

                        {/* Thao tác Menu "⋯" */}
                        <td className="px-space-md text-right relative">
                          <div className="relative inline-block text-left">
                            <button
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(
                                  openActionMenuId === voucher.id ? null : voucher.id
                                );
                              }}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                more_vert
                              </span>
                            </button>

                            {openActionMenuId === voucher.id && (
                              <div
                                className="origin-top-right absolute right-0 mt-1 w-40 rounded-xl shadow-lg bg-surface-container-lowest ring-1 ring-outline-variant/30 z-30 py-1 divide-y divide-outline-variant/20 focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"
                                    onClick={() => {
                                      setSelectedVoucherForDetail(voucher);
                                      setIsDetailOpen(true);
                                      setOpenActionMenuId(null);
                                    }}
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-secondary">
                                      visibility
                                    </span>
                                    <span>Xem chi tiết</span>
                                  </button>

                                  <button
                                    className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"
                                    onClick={() => {
                                      setFormMode("edit");
                                      setSelectedVoucherForEdit(voucher);
                                      setIsFormOpen(true);
                                      setOpenActionMenuId(null);
                                    }}
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-secondary">
                                      edit
                                    </span>
                                    <span>Chỉnh sửa</span>
                                  </button>

                                  <button
                                    className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"
                                    onClick={() => handleDuplicate(voucher)}
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-secondary">
                                      content_copy
                                    </span>
                                    <span>Nhân bản</span>
                                  </button>
                                </div>

                                {voucher.usedCount === 0 && (
                                  <div className="py-1">
                                    <button
                                      className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-error-container/40 flex items-center gap-2 font-medium"
                                      onClick={() => {
                                        setVoucherToDelete(voucher);
                                        setOpenActionMenuId(null);
                                      }}
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        delete
                                      </span>
                                      <span>Xóa voucher</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm bg-surface-container-low text-xs text-secondary border-t border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span>Hiển thị mỗi trang:</span>
              <select
                className="h-8 px-2 rounded bg-surface-container-lowest text-on-surface font-medium border-0 focus:ring-1 focus:ring-primary cursor-pointer text-xs"
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                value={pageSize}
              >
                <option value={10}>10 mã</option>
                <option value={25}>25 mã</option>
                <option value={50}>50 mã</option>
              </select>
              <span className="ml-2 font-data-tabular">
                {data.items.length > 0 ? page * pageSize + 1 : 0}-
                {Math.min((page + 1) * pageSize, data.total)} trong tổng số{" "}
                {data.total} voucher
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface disabled:opacity-40"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-xs transition-colors ${
                    page === idx
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  }`}
                  key={idx}
                  onClick={() => setPage(idx)}
                  type="button"
                >
                  {idx + 1}
                </button>
              ))}

              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface disabled:opacity-40"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Section: Lịch sử sử dụng voucher gần đây (Khớp Stitch Screen 38) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  history
                </span>
                <h2 className="font-headline-md text-base text-on-surface tracking-tight font-bold">
                  Lịch sử sử dụng voucher gần đây
                </h2>
              </div>
              <span className="font-body-sm text-xs text-secondary mt-0.5">
                Nhật ký giải ngân ngân sách trợ giá theo thời gian thực tế từ đơn hàng
              </span>
            </div>
            <button
              className="inline-flex items-center gap-1 text-primary hover:underline font-label-md text-xs font-semibold self-start sm:self-auto"
              onClick={() => showToast("Đang mở danh sách toàn bộ 18.420 giao dịch giải ngân.")}
              type="button"
            >
              <span>Xem tất cả giao dịch áp mã</span>
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="h-10 bg-surface-container-low text-secondary font-label-sm text-xs uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="px-space-md font-semibold">Khách hàng</th>
                  <th className="px-space-md font-semibold">Mã đơn hàng</th>
                  <th className="px-space-md font-semibold">Voucher áp dụng</th>
                  <th className="px-space-md font-semibold">Số tiền giảm</th>
                  <th className="px-space-md font-semibold">Thời gian giao dịch</th>
                  <th className="px-space-md font-semibold">Trạng thái giải ngân</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs">
                {recentHistory.map((item) => (
                  <tr
                    className="h-14 hover:bg-surface-container-low/40 transition-colors"
                    key={item.id}
                  >
                    <td className="px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <Image
                          alt={item.customerName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/30"
                          src={item.customerAvatar}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface leading-tight">
                            {item.customerName}
                          </span>
                          <span className="text-[11px] text-secondary">
                            {item.customerEmail}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md">
                      <span className="font-data-tabular font-mono font-semibold text-primary hover:underline">
                        {item.orderCode}
                      </span>
                    </td>
                    <td className="px-space-md">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-data-tabular font-bold text-xs text-primary bg-surface-container font-mono">
                        {item.voucherCode}
                      </span>
                    </td>
                    <td className="px-space-md font-data-tabular font-bold text-tertiary">
                      {item.status === "REFUNDED" ? "+" : "-"}
                      {(item.discountAmount ?? 0).toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-space-md font-data-tabular text-secondary">
                      {item.usedAt}
                    </td>
                    <td className="px-space-md">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "SUCCESS"
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container text-secondary"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "SUCCESS" ? "bg-primary" : "bg-secondary"
                          }`}
                        />
                        <span>
                          {item.status === "SUCCESS"
                            ? "Thành công"
                            : "Đã hoàn lượt (Khách hủy đơn)"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SlideOver Form Drawer */}
      <VoucherFormDrawer
        initialData={selectedVoucherForEdit}
        isOpen={isFormOpen}
        mode={formMode}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedVoucherForEdit(null);
        }}
        onSubmit={(val) => {
          if (formMode === "create") {
            handleCreateVoucher(val);
          } else {
            handleEditVoucher(val);
          }
        }}
      />

      {/* SlideOver Detail Drawer */}
      <VoucherDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedVoucherForDetail(null);
        }}
        onEdit={(v) => {
          setFormMode("edit");
          setSelectedVoucherForEdit(v);
          setIsFormOpen(true);
        }}
        usageHistory={
          selectedVoucherForDetail
            ? voucherMockService.getUsageHistory(selectedVoucherForDetail.id)
            : []
        }
        voucher={selectedVoucherForDetail}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        confirmButtonText="Xác nhận xóa"
        icon="delete"
        isOpen={!!voucherToDelete}
        onClose={() => setVoucherToDelete(null)}
        onConfirm={handleDeleteConfirm}
        subtitle="Thao tác này sẽ xóa vĩnh viễn voucher chưa sử dụng khỏi hệ thống."
        title="Xóa voucher sàn"
        variant="danger"
        warningMessage={`Bạn có chắc chắn muốn xóa voucher ${voucherToDelete?.code}? Thao tác này không thể hoàn tác.`}
      />
    </div>
  );
}
