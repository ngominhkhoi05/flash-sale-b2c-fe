"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  SkuApprovalItem,
  SkuApprovalStatus,
  SkuApprovalCounts,
} from "@/types/sku-approval";
import type { AdminFlashSaleSession } from "@/types/flash-sale";
import { useEffect, useCallback } from "react";
import {
  getAdminFlashSaleSlots,
  getAdminSkuApprovals,
  getAdminApprovalCounts,
  approveFlashSaleSku,
  rejectFlashSaleSku,
  batchApproveFlashSaleSkus,
  batchRejectFlashSaleSkus,
  undoFlashSaleSku,
} from "@/lib/api/admin";
import {
  getMockSkuApprovals,
  getApprovalCounts,
} from "@/lib/mocks/sku-approvals.mock";
import { getMockFlashSaleSessions } from "@/lib/mocks/flash-sessions.mock";
import {
  SkuApproveModal,
  SkuRejectModal,
  SkuBatchActionBar,
} from "@/components/admin/flash-sale";

const formatVnd = (amount: number) => {
  return amount.toLocaleString("vi-VN") + "₫";
};

export default function AdminSkuApprovalsPage() {
  // 1. Sessions List & Selected Session
  const [sessions, setSessions] = useState<AdminFlashSaleSession[]>(() =>
    getMockFlashSaleSessions()
  );
  const [selectedSessionId, setSelectedSessionId] = useState<number>(3);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

  // Load sessions from BE API
  useEffect(() => {
    let cancelled = false;
    async function loadSessions() {
      try {
        const slots = await getAdminFlashSaleSlots();
        if (!cancelled && slots.length > 0) {
          setSessions(slots);
          const active = slots.find((s) => s.status === "ACTIVE");
          if (active) setSelectedSessionId(active.id);
          else setSelectedSessionId(slots[0].id);
        }
      } catch {
        // fallback to default sessions
      }
    }
    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  // 2. SKU items & counts
  const [items, setItems] = useState<SkuApprovalItem[]>(() =>
    getMockSkuApprovals()
  );
  const [counts, setCounts] = useState<SkuApprovalCounts>(() =>
    getApprovalCounts()
  );

  const [reloadTrigger, setReloadTrigger] = useState(0);

  const refreshData = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAdminSkuApprovals(selectedSessionId),
      getAdminApprovalCounts(selectedSessionId),
    ])
      .then(([itemsData, countsData]) => {
        if (!cancelled) {
          setItems(itemsData);
          setCounts(countsData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems(getMockSkuApprovals(selectedSessionId));
          setCounts(getApprovalCounts(selectedSessionId));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, reloadTrigger]);

  // 3. Tab State
  const [activeTab, setActiveTab] = useState<SkuApprovalStatus>("PENDING");

  // 4. Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [shopTypeFilter, setShopTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [discountFilter, setDiscountFilter] = useState("");

  // 5. Selection State for Batch Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 6. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleTabChange = (tab: SkuApprovalStatus) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleShopTypeChange = (val: string) => {
    setShopTypeFilter(val);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleDiscountChange = (val: string) => {
    setDiscountFilter(val);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab matching
      if (item.status !== activeTab) return false;

      // Search matching (product name, sku code)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.productName.toLowerCase().includes(query);
        const matchSku = item.skuCode.toLowerCase().includes(query);
        const matchStore = item.storeName.toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchStore) return false;
      }

      // Shop type filter
      if (shopTypeFilter) {
        if (shopTypeFilter === "mall" && item.storeBadge !== "MALL") return false;
        if (shopTypeFilter === "favorite" && item.storeBadge !== "FAVORITE")
          return false;
        if (shopTypeFilter === "normal" && item.storeBadge !== "NORMAL")
          return false;
      }

      // Category filter
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }

      // Discount filter
      if (discountFilter) {
        if (discountFilter === "50" && item.discountPercent < 50) return false;
        if (
          discountFilter === "30" &&
          (item.discountPercent < 30 || item.discountPercent >= 50)
        )
          return false;
        if (discountFilter === "under30" && item.discountPercent >= 30)
          return false;
      }

      return true;
    });
  }, [
    items,
    activeTab,
    searchQuery,
    shopTypeFilter,
    categoryFilter,
    discountFilter,
  ]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // 7. Modals State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [targetApproveItem, setTargetApproveItem] =
    useState<SkuApprovalItem | null>(null);
  const [isBatchApprove, setIsBatchApprove] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetRejectItem, setTargetRejectItem] =
    useState<SkuApprovalItem | null>(null);
  const [isBatchReject, setIsBatchReject] = useState(false);

  // Handlers for single action
  const handleOpenApproveSingle = (item: SkuApprovalItem) => {
    setTargetApproveItem(item);
    setIsBatchApprove(false);
    setApproveModalOpen(true);
  };

  const handleOpenRejectSingle = (item: SkuApprovalItem) => {
    setTargetRejectItem(item);
    setIsBatchReject(false);
    setRejectModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    try {
      if (isBatchApprove) {
        const result = await batchApproveFlashSaleSkus(selectedIds);
        if (result && result.failedReasons && result.failedReasons.length > 0) {
          const approvedCount = result.approvedItemIds?.length || 0;
          const failedDetails = result.failedReasons
            .map((f) => `#${f.itemId}: ${f.reason}`)
            .join("; ");
          toast.warning(
            `Đã duyệt ${approvedCount}/${selectedIds.length} SKU. Thất bại ${result.failedReasons.length} SKU (${failedDetails})`
          );
        } else {
          toast.success(
            `Đã duyệt thành công toàn bộ ${selectedIds.length} SKU và tự động khóa kho!`
          );
        }
        setSelectedIds([]);
      } else if (targetApproveItem) {
        await approveFlashSaleSku(targetApproveItem.id);
        toast.success(
          `Đã duyệt "${targetApproveItem.productName}" vào Flash Sale!`
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Duyệt sản phẩm thất bại"
      );
    }
    setApproveModalOpen(false);
    void refreshData();
  };

  const handleConfirmReject = async (reason: string, _note?: string) => {
    try {
      if (isBatchReject) {
        await batchRejectFlashSaleSkus(selectedIds, reason);
        toast.error(
          `Đã từ chối ${selectedIds.length} SKU và gửi phản hồi cho Seller!`
        );
        setSelectedIds([]);
      } else if (targetRejectItem) {
        await rejectFlashSaleSku(targetRejectItem.id, reason);
        toast.error(
          `Đã từ chối "${targetRejectItem.productName}" và gửi thông báo!`
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Từ chối sản phẩm thất bại"
      );
    }
    setRejectModalOpen(false);
    void refreshData();
  };

  const handleUndo = async (item: SkuApprovalItem) => {
    try {
      await undoFlashSaleSku(item.id);
      toast.info(`Đã hoàn tác "${item.productName}" về trạng thái Chờ duyệt!`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Hoàn tác trạng thái thất bại"
      );
    }
    void refreshData();
  };

  // Handlers for batch actions
  const handleOpenBatchApprove = () => {
    setIsBatchApprove(true);
    setTargetApproveItem(null);
    setApproveModalOpen(true);
  };

  const handleOpenBatchReject = () => {
    setIsBatchReject(true);
    setTargetRejectItem(null);
    setRejectModalOpen(true);
  };

  const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedItems.map((i) => i.id);
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(combined);
    } else {
      const pageIds = new Set(paginatedItems.map((i) => i.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isAllPageSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.includes(item.id));
  const isSomePageSelected =
    paginatedItems.some((item) => selectedIds.includes(item.id)) &&
    !isAllPageSelected;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Top Bar: Navigation, Session Selector & Summary Metrics */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-secondary">
            <span>Flash Sale</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Duyệt sản phẩm</span>
          </div>

          <div className="flex flex-wrap items-center gap-space-md mt-1">
            <h1 className="font-display-sm text-display-sm text-on-surface font-bold tracking-tight">
              Duyệt sản phẩm Flash Sale
            </h1>

            {/* Session Switcher Popover Selector */}
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                className="flex items-center gap-space-sm h-10 px-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="text-tertiary-container font-bold text-base leading-none">
                  ⚡
                </span>
                <div className="flex flex-col">
                  <span className="font-headline-md text-[13px] font-semibold text-on-surface leading-tight">
                    {currentSession?.name || "Giờ Vàng 12:00"} –{" "}
                    {currentSession?.timeRangeDisplay || "12:00 - 14:00"}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-bold leading-none ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-tertiary-container animate-pulse" />
                  {currentSession?.status === "ACTIVE"
                    ? "Đang diễn ra"
                    : "Sắp diễn ra"}
                </span>
                <span className="material-symbols-outlined text-[18px] text-secondary ml-1">
                  unfold_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {isSessionDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSessionDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-12 z-50 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-2 flex flex-col gap-1">
                    <span className="px-3 py-1.5 font-label-sm text-[11px] font-semibold text-secondary uppercase tracking-wider">
                      Chọn phiên Flash Sale
                    </span>
                    {sessions.slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(s.id);
                          setIsSessionDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-body-sm transition-colors",
                          s.id === selectedSessionId
                            ? "bg-primary-fixed text-primary font-semibold"
                            : "hover:bg-surface-container-low text-on-surface"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-secondary text-[11px]">
                            {s.timeRangeDisplay} · {s.date}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                            s.status === "ACTIVE"
                              ? "bg-rose-100 text-rose-700"
                              : s.status === "ENDED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-sky-100 text-sky-700"
                          )}
                        >
                          {s.status === "ACTIVE"
                            ? "Live"
                            : s.status === "ENDED"
                            ? "Kết thúc"
                            : "Sắp tới"}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Session KPIs */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 shadow-sm border border-amber-100">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-body-sm text-body-sm font-medium">
                Chờ duyệt:
              </span>
              <span className="font-data-tabular text-[16px] font-bold text-amber-900 tabular-nums">
                {counts.pending}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-body-sm text-body-sm font-medium">
                Đã duyệt:
              </span>
              <span className="font-data-tabular text-[16px] font-bold text-emerald-900 tabular-nums">
                {counts.approved}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 shadow-sm border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-body-sm text-body-sm font-medium">
                Từ chối:
              </span>
              <span className="font-data-tabular text-[16px] font-bold text-slate-900 tabular-nums">
                {counts.rejected}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Dynamic Filters Toolbar */}
      <div className="flex flex-col gap-space-md">
        {/* Tabs & Registration Deadline */}
        <div className="flex items-center justify-between overflow-x-auto pb-1 gap-4">
          <div className="flex items-center gap-space-xs p-1 bg-surface-container-low rounded-xl">
            <button
              type="button"
              onClick={() => handleTabChange("PENDING")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-headline-md text-[13px] transition-all",
                activeTab === "PENDING"
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                  : "text-secondary hover:text-on-surface font-medium"
              )}
            >
              <span>Chờ duyệt</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold leading-none tabular-nums",
                  activeTab === "PENDING"
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-surface-container text-secondary"
                )}
              >
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("APPROVED")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-headline-md text-[13px] transition-all",
                activeTab === "APPROVED"
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                  : "text-secondary hover:text-on-surface font-medium"
              )}
            >
              <span>Đã duyệt</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold leading-none tabular-nums",
                  activeTab === "APPROVED"
                    ? "bg-primary text-white"
                    : "bg-surface-container text-secondary"
                )}
              >
                {counts.approved}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("REJECTED")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-headline-md text-[13px] transition-all",
                activeTab === "REJECTED"
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                  : "text-secondary hover:text-on-surface font-medium"
              )}
            >
              <span>Từ chối</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold leading-none tabular-nums",
                  activeTab === "REJECTED"
                    ? "bg-slate-700 text-white"
                    : "bg-surface-container text-secondary"
                )}
              >
                {counts.rejected}
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-secondary font-body-sm text-body-sm shrink-0">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>
              Khóa đăng ký lúc:{" "}
              <strong className="text-on-surface font-medium">
                11:30 (còn 45 phút)
              </strong>
            </span>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-space-sm p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20">
          {/* Search Field */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30"
            />
          </div>

          {/* Shop Type Filter */}
          <div className="lg:col-span-3 relative">
            <select
              value={shopTypeFilter}
              onChange={(e) => handleShopTypeChange(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border border-outline-variant/30"
            >
              <option value="">Tất cả gian hàng (Mall &amp; Thường)</option>
              <option value="mall">Chỉ Vibe Mall</option>
              <option value="favorite">Shop Yêu thích</option>
              <option value="normal">Shop Thường</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3 relative">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border border-outline-variant/30"
            >
              <option value="">Tất cả danh mục ngành hàng</option>
              <option value="fashion">Thời trang &amp; Phụ kiện</option>
              <option value="tech">Thiết bị điện tử &amp; Công nghệ</option>
              <option value="beauty">Sức khỏe &amp; Sắc đẹp</option>
              <option value="home">Nhà cửa &amp; Đời sống</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>

          {/* Discount Filter */}
          <div className="lg:col-span-2 relative">
            <select
              value={discountFilter}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border border-outline-variant/30"
            >
              <option value="">Mức giảm giá</option>
              <option value="50">&gt;= 50% (Khuyến nghị)</option>
              <option value="30">30% - 49%</option>
              <option value="under30">&lt; 30%</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Batch Action Floating Bar (hiển thị khi có dòng được chọn) */}
      {selectedIds.length > 0 && activeTab === "PENDING" && (
        <SkuBatchActionBar
          selectedCount={selectedIds.length}
          onApproveAll={handleOpenBatchApprove}
          onRejectAll={handleOpenBatchReject}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* Main SKU Approval Data Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-11 bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-secondary border-b border-surface-container">
                <th className="w-12 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomePageSelected;
                    }}
                    onChange={handleSelectAllOnPage}
                    className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-4 min-w-[280px]">Sản phẩm &amp; Phân loại SKU</th>
                <th className="px-4 min-w-[170px]">Gian hàng</th>
                <th className="px-4 min-w-[110px] text-right">Giá gốc</th>
                <th className="px-4 min-w-[180px] text-right">Giá Flash Sale</th>
                <th className="px-4 min-w-[130px] text-center">Mở bán / Kho</th>
                <th className="px-4 min-w-[110px] text-center">Giới hạn</th>
                <th className="px-4 min-w-[110px]">Thời gian gửi</th>
                <th className="px-4 min-w-[150px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-outline">
                        inventory_2
                      </span>
                      <p className="font-medium text-body-md">
                        Không tìm thấy SKU nào phù hợp với bộ lọc hiện tại.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const progressPercent = Math.min(
                    100,
                    Math.round((item.allocatedStock / item.originalStock) * 100)
                  );

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-surface-container-low/70 transition-colors",
                        isSelected && "bg-sky-50/50"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="w-12 px-4 py-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(item.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Product & Variant */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0 shadow-sm border border-outline-variant/20">
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-headline-md text-headline-md font-semibold text-on-surface truncate max-w-xs hover:text-primary cursor-pointer transition-colors"
                              title={item.productName}
                            >
                              {item.productName}
                            </span>
                            <span className="font-data-tabular text-body-sm text-secondary truncate">
                              {item.variantName} ·{" "}
                              <span className="text-on-surface-variant font-mono font-medium">
                                {item.skuCode}
                              </span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md font-medium text-on-surface truncate">
                            {item.storeName}
                          </span>
                          {item.storeBadge === "MALL" && (
                            <span className="inline-flex items-center gap-1 w-fit mt-0.5 px-1.5 py-0.2 rounded font-label-sm text-[10px] font-bold bg-primary text-on-primary uppercase leading-tight">
                              Vibe Mall
                            </span>
                          )}
                          {item.storeBadge === "FAVORITE" && (
                            <span className="inline-flex items-center gap-1 w-fit mt-0.5 px-1.5 py-0.2 rounded font-label-sm text-[10px] font-semibold bg-secondary-container text-on-secondary-container uppercase leading-tight">
                              Shop Yêu Thích+
                            </span>
                          )}
                          {item.storeBadge === "NORMAL" && (
                            <span className="font-label-sm text-[11px] text-secondary mt-0.5">
                              Shop Thường
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Original Price */}
                      <td className="px-4 py-3 text-right align-middle font-data-tabular text-body-md text-secondary line-through tabular-nums">
                        {formatVnd(item.originalPrice)}
                      </td>

                      {/* Flash Sale Price */}
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-data-tabular text-headline-md font-bold text-tertiary-container tabular-nums">
                              {formatVnd(item.flashSalePrice)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded font-label-sm text-label-sm font-bold bg-rose-100 text-rose-700">
                              -{item.discountPercent}%
                            </span>
                          </div>

                          {/* Warning / Advantage Pill */}
                          {item.priceAdvantage?.type === "WARNING_30_DAYS" && (
                            <div
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-label-sm text-[11px] font-medium cursor-help"
                              title={item.priceAdvantage.tooltip}
                            >
                              <span className="material-symbols-outlined text-[13px] text-amber-600">
                                warning
                              </span>
                              <span>{item.priceAdvantage.message}</span>
                            </div>
                          )}

                          {item.priceAdvantage?.type === "BEST_60_DAYS" && (
                            <span
                              className="text-emerald-700 font-label-sm text-[11px] font-medium flex items-center gap-0.5 cursor-help"
                              title={item.priceAdvantage.tooltip}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                verified
                              </span>
                              <span>{item.priceAdvantage.message}</span>
                            </span>
                          )}

                          {item.priceAdvantage?.type === "DEEP_DISCOUNT" && (
                            <span className="text-secondary font-label-sm text-[11px]">
                              {item.priceAdvantage.message}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Allocated / Original */}
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex flex-col items-center">
                          <span className="font-data-tabular text-body-md font-bold text-on-surface tabular-nums">
                            <span className="text-primary font-extrabold">
                              {item.allocatedStock}
                            </span>{" "}
                            / {item.originalStock}
                          </span>
                          <div className="w-16 bg-surface-container rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Limit Per Customer */}
                      <td className="px-4 py-3 text-center align-middle font-data-tabular text-body-md text-secondary">
                        {item.customerLimit} sản phẩm
                      </td>

                      {/* Submitted Time */}
                      <td className="px-4 py-3 align-middle font-data-tabular text-body-sm text-secondary">
                        {item.submittedAt}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right align-middle">
                        {item.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenRejectSingle(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-rose-50 text-rose-700 font-headline-md text-body-sm font-semibold transition-colors"
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenApproveSingle(item)}
                              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-headline-md text-body-sm font-semibold transition-colors shadow-sm"
                            >
                              Duyệt
                            </button>
                          </div>
                        )}

                        {item.status === "APPROVED" && (
                          <div className="flex items-center justify-end gap-2">
                            {item.commissionOverride !== undefined && (
                              <span className="font-label-sm text-[11px] text-primary font-semibold">
                                {item.commissionOverride}%
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUndo(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface font-headline-md text-body-sm font-medium transition-colors"
                            >
                              Hoàn tác
                            </button>
                          </div>
                        )}

                        {item.status === "REJECTED" && (
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 truncate max-w-[100px] cursor-help"
                              title={item.rejectionNote || item.rejectionReason}
                            >
                              {item.rejectionReason}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUndo(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface font-headline-md text-body-sm font-medium transition-colors"
                            >
                              Hoàn tác
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-space-md py-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-container">
          <div className="font-body-sm text-body-sm text-secondary">
            Hiển thị{" "}
            <span className="font-bold text-on-surface">
              {paginatedItems.length}
            </span>{" "}
            trên{" "}
            <span className="font-bold text-on-surface">
              {filteredItems.length}
            </span>{" "}
            sản phẩm {activeTab === "PENDING" ? "chờ kiểm duyệt" : ""}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-secondary disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg font-headline-md text-body-sm transition-colors",
                  page === currentPage
                    ? "bg-primary text-white font-bold"
                    : "hover:bg-surface-container-high text-secondary font-medium"
                )}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-secondary disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Policy Tips Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Card 1: Quy chế Flash Sale */}
        <div className="lg:col-span-2 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                Quy chế Flash Sale
              </span>
              <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  verified
                </span>{" "}
                Chuẩn thuật toán phân phối v3.2
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Hệ thống tự động ưu tiên hiển thị trên trang chủ đối với các SKU có
              mức giảm thực tế{" "}
              <strong className="text-on-surface font-semibold">≥ 40%</strong>{" "}
              so với giá thấp nhất trong 30 ngày. Số lượng hàng duyệt sẽ được khóa
              trong kho người bán để đảm bảo không hủy đơn quá hạn.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-surface-container">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase block">
                Tỷ lệ duyệt đạt
              </span>
              <span className="font-data-tabular text-headline-lg font-bold text-on-surface tabular-nums">
                88.4%
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase block">
                Thời gian duyệt TB
              </span>
              <span className="font-data-tabular text-headline-lg font-bold text-on-surface tabular-nums">
                4.2 phút
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase block">
                Cảnh báo giá bất thường
              </span>
              <span className="font-data-tabular text-headline-lg font-bold text-amber-600 tabular-nums">
                1 SKU
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Quick Session Indicator */}
        <div className="p-space-lg rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm font-bold tracking-wider uppercase text-slate-400">
                Tình trạng slot phiên 12:00
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="mt-4">
              <span className="font-display-sm text-display-sm font-bold tabular-nums">
                {counts.approved} / 50
              </span>
              <span className="text-slate-400 font-body-sm text-body-sm block mt-0.5">
                SKU đã sẵn sàng lên kệ
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-primary-container h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (counts.approved / 50) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>
              Còn trống:{" "}
              <strong className="text-white">
                {Math.max(0, 50 - counts.approved)} slots
              </strong>
            </span>
            <span className="text-tertiary-fixed-dim font-medium">
              Đóng cổng sau 45m
            </span>
          </div>
        </div>
      </div>

      {/* SkuApproveModal */}
      <SkuApproveModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={handleConfirmApprove}
        skuName={
          targetApproveItem
            ? `${targetApproveItem.productName} - ${targetApproveItem.variantName}`
            : ""
        }
        allocatedStock={targetApproveItem?.allocatedStock || 50}
        originalStock={targetApproveItem?.originalStock || 248}
        isBatch={isBatchApprove}
        batchCount={selectedIds.length}
      />

      {/* SkuRejectModal */}
      <SkuRejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        skuName={
          targetRejectItem
            ? `${targetRejectItem.productName} - ${targetRejectItem.variantName}`
            : ""
        }
        isBatch={isBatchReject}
        batchCount={selectedIds.length}
      />
    </div>
  );
}
