"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  SkuApprovalItem,
  SkuApprovalStatus,
  SkuApprovalCounts,
  StoreBadgeType,
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
import { useFlashSaleWs } from "@/hooks/useFlashSaleWs";
import {
  SkuApproveModal,
  SkuRejectModal,
  SkuBatchActionBar,
} from "@/components/admin/flash-sale";

const formatVnd = (amount: number) => {
  return amount.toLocaleString("vi-VN") + "₫";
};

/** Sắp xếp phiên logic: ACTIVE lên đầu -> UPCOMING theo thời gian gần nhất -> ENDED kết thúc gần nhất */
function sortSessions(slots: AdminFlashSaleSession[]): AdminFlashSaleSession[] {
  return [...slots].sort((a, b) => {
    // 1. ACTIVE lên trước
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;

    // 2. UPCOMING / REGISTRATION_OPEN: sắp xếp theo startTime tăng dần
    const isUpcomingA = a.status === "UPCOMING" || a.status === "REGISTRATION_OPEN";
    const isUpcomingB = b.status === "UPCOMING" || b.status === "REGISTRATION_OPEN";
    if (isUpcomingA && !isUpcomingB) return -1;
    if (isUpcomingB && !isUpcomingA) return 1;
    if (isUpcomingA && isUpcomingB) {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }

    // 3. ENDED: sắp xếp theo endTime giảm dần
    return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
  });
}

import {
  useAdminSlotsQuery,
  useAdminApprovalsQuery,
  useAdminApprovalCountsQuery,
  ADMIN_QUERY_KEYS,
} from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSkuApprovalsPage() {
  const queryClient = useQueryClient();

  // 1. Nạp Slots từ React Query Cache (có sẵn 0ms do Sidebar prefetch)
  const { data: rawSlots = [], isLoading: isLoadingSessions } = useAdminSlotsQuery();

  // CHỈ LẤY CÁC PHIÊN CHƯA BẮT ĐẦU / SẮP DIỄN RA (UPCOMING / REGISTRATION_OPEN)
  // Tuyệt đối không lấy phiên đang diễn ra (ACTIVE) hay đã kết thúc (ENDED)
  const sessions = useMemo(() => {
    return rawSlots
      .filter((s) => s.status === "UPCOMING" || s.status === "REGISTRATION_OPEN")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [rawSlots]);

  const upcomingSessions = sessions;

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Tự động chọn phiên chưa bắt đầu (ưu tiên phiên có sản phẩm chờ duyệt)
  const activeSessionId = useMemo(() => {
    if (selectedSessionId && sessions.some((s) => s.id === selectedSessionId)) {
      return selectedSessionId;
    }
    const withPending = sessions.find((s) => (s.pendingSkusCount || 0) > 0);
    if (withPending) return withPending.id;
    return sessions[0]?.id ?? null;
  }, [sessions, selectedSessionId]);

  const effectiveSlotId = activeSessionId ?? undefined;

  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [sessionFilterTab, setSessionFilterTab] = useState<"ALL" | "PENDING_ONLY">("ALL");

  const totalPendingAcrossAllSlots = useMemo(() => {
    return upcomingSessions.reduce((sum, s) => sum + (s.pendingSkusCount || 0), 0);
  }, [upcomingSessions]);

  const slotsWithPendingCount = useMemo(() => {
    return upcomingSessions.filter((s) => (s.pendingSkusCount || 0) > 0).length;
  }, [upcomingSessions]);

  const currentSession = useMemo(() => {
    if (!activeSessionId) return sessions[0] || null;
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  // Danh sách phiên lọc theo ô search và tab "Cần duyệt" trong dropdown (0ms)
  const dropdownFilteredSessions = useMemo(() => {
    let list = sessions;
    if (sessionFilterTab === "PENDING_ONLY") {
      list = list.filter((s) => (s.pendingSkusCount || 0) > 0);
    }
    if (sessionSearchQuery.trim()) {
      const q = sessionSearchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.timeRangeDisplay.toLowerCase().includes(q) ||
          s.date.includes(q) ||
          s.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sessions, sessionSearchQuery, sessionFilterTab]);

  // 2. Nạp SKU items & counts từ React Query Cache (có sẵn 0ms do Sidebar prefetch)
  const {
    data: rawItems = [],
    isLoading: isLoadingItems,
    refetch: refetchItems,
  } = useAdminApprovalsQuery(effectiveSlotId);

  const { data: rawCounts, refetch: refetchCounts } = useAdminApprovalCountsQuery(effectiveSlotId);

  const [localItems, setLocalItems] = useState<SkuApprovalItem[] | null>(null);
  const items = localItems ?? rawItems;

  useEffect(() => {
    setLocalItems(null);
  }, [rawItems]);

  // Đếm theo số SẢN PHẨM (SPU) duy nhất, không đếm số lượng SKU hay tồn kho
  const counts: SkuApprovalCounts = useMemo(() => {
    if (rawCounts && typeof rawCounts.pending === "number") {
      return rawCounts;
    }
    const pendingProducts = new Set(
      items
        .filter((i) => i.status === "PENDING" || (i.status as string) === "PENDING_APPROVAL")
        .map((i) => i.productId || i.id)
    );
    const approvedProducts = new Set(
      items.filter((i) => i.status === "APPROVED").map((i) => i.productId || i.id)
    );
    const rejectedProducts = new Set(
      items.filter((i) => i.status === "REJECTED").map((i) => i.productId || i.id)
    );
    return {
      pending: pendingProducts.size,
      approved: approvedProducts.size,
      rejected: rejectedProducts.size,
    };
  }, [rawCounts, items]);

  const refreshData = useCallback(() => {
    setLocalItems(null);
    void refetchItems();
    void refetchCounts();
    void queryClient.invalidateQueries({ queryKey: ["admin", "flash-sale"] });
  }, [refetchItems, refetchCounts, queryClient]);

  // Lắng nghe sự kiện realtime khi có sản phẩm được đăng ký / duyệt / từ chối
  useEffect(() => {
    const handleApprovalsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ slotId?: number; eventType?: string }>;
      const data = customEvent.detail;
      // Cập nhật ngay khi event thuộc phiên đang xem hoặc toàn sàn
      if (!data?.slotId || !effectiveSlotId || data.slotId === effectiveSlotId) {
        setLocalItems(null);
        void refetchItems();
        void refetchCounts();
      }
    };

    window.addEventListener("admin:sku-approvals-updated", handleApprovalsUpdated);
    return () => {
      window.removeEventListener("admin:sku-approvals-updated", handleApprovalsUpdated);
    };
  }, [effectiveSlotId, refetchItems, refetchCounts]);


  // Realtime WebSocket: tự động cập nhật tồn kho biến thể và trạng thái slot
  useFlashSaleWs({
    enabled: typeof effectiveSlotId === "number" && effectiveSlotId > 0,
    subscribeSlotIds: effectiveSlotId ? [effectiveSlotId] : [],
    onMessage: (event) => {
      if ("slotId" in event && event.slotId === effectiveSlotId) {
        if (
          event.eventType === "STOCK_DECREMENTED" ||
          event.eventType === "STOCK_RESTORED"
        ) {
          const { flashSaleItemId, availableStock } = event;
          setLocalItems((prev) => {
            const base = prev ?? rawItems;
            return base.map((item) =>
              item.id === flashSaleItemId
                ? { ...item, originalStock: availableStock }
                : item
            );
          });
        } else if (event.eventType === "SLOT_CLOSED" || event.eventType === "SLOT_ACTIVATED") {
          refreshData();
        }
      }
    },
  });

  // 3. Tab State
  const [activeTab, setActiveTab] = useState<SkuApprovalStatus>("PENDING");

  // 4. Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [storeNameFilter, setStoreNameFilter] = useState("");
  const [shopTypeFilter, setShopTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [discountFilter, setDiscountFilter] = useState("");

  // Unique store names from fetched items for store name filter
  const uniqueStores = useMemo(() => {
    const names = items.map((i) => i.storeName).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [items]);

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

  const handleStoreNameChange = (val: string) => {
    setStoreNameFilter(val);
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

      // Store name filter
      if (storeNameFilter && item.storeName !== storeNameFilter) {
        return false;
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
    storeNameFilter,
    shopTypeFilter,
    categoryFilter,
    discountFilter,
  ]);

  interface ProductApprovalGroup {
    productId: number;
    productName: string;
    imageUrl: string;
    storeId: number;
    storeName: string;
    storeBadge: StoreBadgeType;
    category: string;
    submittedAt: string;
    minOriginalPrice: number;
    maxOriginalPrice: number;
    minFlashSalePrice: number;
    maxFlashSalePrice: number;
    totalAllocatedStock: number;
    totalOriginalStock: number;
    skus: SkuApprovalItem[];
  }

  // Nhóm các SKU theo từng Sản phẩm (Product/SPU)
  const groupedProducts = useMemo(() => {
    const map = new Map<number, ProductApprovalGroup>();
    for (const item of filteredItems) {
      const key = item.productId || item.id;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          productId: item.productId || item.id,
          productName: item.productName,
          imageUrl: item.imageUrl,
          storeId: item.storeId,
          storeName: item.storeName,
          storeBadge: item.storeBadge,
          category: item.category,
          submittedAt: item.submittedAt,
          minOriginalPrice: item.originalPrice,
          maxOriginalPrice: item.originalPrice,
          minFlashSalePrice: item.flashSalePrice,
          maxFlashSalePrice: item.flashSalePrice,
          totalAllocatedStock: item.allocatedStock,
          totalOriginalStock: item.originalStock,
          skus: [item],
        });
      } else {
        existing.skus.push(item);
        existing.minOriginalPrice = Math.min(existing.minOriginalPrice, item.originalPrice);
        existing.maxOriginalPrice = Math.max(existing.maxOriginalPrice, item.originalPrice);
        existing.minFlashSalePrice = Math.min(existing.minFlashSalePrice, item.flashSalePrice);
        existing.maxFlashSalePrice = Math.max(existing.maxFlashSalePrice, item.flashSalePrice);
        existing.totalAllocatedStock += item.allocatedStock;
        existing.totalOriginalStock += item.originalStock;
      }
    }
    return Array.from(map.values());
  }, [filteredItems]);

  // Phân trang theo Sản phẩm (Product)
  const totalPages = Math.max(1, Math.ceil(groupedProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return groupedProducts.slice(start, start + pageSize);
  }, [groupedProducts, currentPage, pageSize]);

  // State mở rộng/thu gọn xem SKU của từng sản phẩm
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());

  const toggleExpandProduct = (productId: number) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

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

  const handleConfirmApprove = async (commission?: number) => {
    try {
      if (isBatchApprove) {
        const result = await batchApproveFlashSaleSkus(selectedIds, commission);
        if (result && result.failedReasons && result.failedReasons.length > 0) {
          const approvedCount = result.approvedItemIds?.length || 0;
          const failedDetails = result.failedReasons
            .map((f) => `#${f.itemId}: ${f.reason}`)
            .join("; ");
          toast.warning(
            `Đã duyệt ${approvedCount}/${selectedIds.length} SKU (Hoa hồng: ${commission}%). Thất bại ${result.failedReasons.length} SKU (${failedDetails})`
          );
        } else {
          toast.success(
            `Đã duyệt thành công toàn bộ ${selectedIds.length} SKU với hoa hồng ${commission}% và tự động khóa kho!`
          );
        }
        setSelectedIds([]);
      } else if (targetApproveItem) {
        await approveFlashSaleSku(targetApproveItem.id, commission);
        toast.success(
          `Đã duyệt "${targetApproveItem.productName}" (Hoa hồng: ${commission}%) vào Flash Sale!`
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Duyệt sản phẩm thất bại"
      );
    }
    setApproveModalOpen(false);
    refreshData();
    try {
      const totalCounts = await getAdminApprovalCounts();
      if (typeof window !== "undefined" && typeof totalCounts?.pending === "number") {
        window.dispatchEvent(
          new CustomEvent("admin:sku-pending-count", { detail: totalCounts.pending })
        );
      }
    } catch {
      // ignore
    }
  };

  const handleConfirmReject = async (reason: string, note?: string) => {
    try {
      const rejectReason = (note && note.trim()) ? note.trim() : (reason && reason.trim()) ? reason.trim() : "Từ chối theo quy chế sàn";
      if (isBatchReject) {
        await batchRejectFlashSaleSkus(selectedIds, rejectReason);
        toast.error(
          `Đã từ chối ${selectedIds.length} SKU và gửi phản hồi cho Seller!`
        );
        setSelectedIds([]);
      } else if (targetRejectItem) {
        await rejectFlashSaleSku(targetRejectItem.id, rejectReason);
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
    refreshData();
    try {
      const totalCounts = await getAdminApprovalCounts();
      if (typeof window !== "undefined" && typeof totalCounts?.pending === "number") {
        window.dispatchEvent(
          new CustomEvent("admin:sku-pending-count", { detail: totalCounts.pending })
        );
      }
    } catch {
      // ignore
    }
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
    refreshData();
    try {
      const totalCounts = await getAdminApprovalCounts();
      if (typeof window !== "undefined" && typeof totalCounts?.pending === "number") {
        window.dispatchEvent(
          new CustomEvent("admin:sku-pending-count", { detail: totalCounts.pending })
        );
      }
    } catch {
      // ignore
    }
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

  const allPageSkuIds = useMemo(() => {
    return paginatedProducts.flatMap((p) => p.skus.map((s) => s.id));
  }, [paginatedProducts]);

  const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const combined = Array.from(new Set([...selectedIds, ...allPageSkuIds]));
      setSelectedIds(combined);
    } else {
      const pageIdsSet = new Set(allPageSkuIds);
      setSelectedIds(selectedIds.filter((id) => !pageIdsSet.has(id)));
    }
  };

  const handleToggleRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleProduct = (product: ProductApprovalGroup) => {
    const skuIds = product.skus.map((s) => s.id);
    const isAllSelected = skuIds.length > 0 && skuIds.every((id) => selectedIds.includes(id));
    if (isAllSelected) {
      const skuSet = new Set(skuIds);
      setSelectedIds(selectedIds.filter((id) => !skuSet.has(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...skuIds])));
    }
  };

  const handleApproveProduct = (product: ProductApprovalGroup) => {
    const skuIds = product.skus.map((s) => s.id);
    setSelectedIds(skuIds);
    setIsBatchApprove(true);
    setTargetApproveItem(null);
    setApproveModalOpen(true);
  };

  const handleRejectProduct = (product: ProductApprovalGroup) => {
    const skuIds = product.skus.map((s) => s.id);
    setSelectedIds(skuIds);
    setIsBatchReject(true);
    setTargetRejectItem(null);
    setRejectModalOpen(true);
  };

  const handleUndoProduct = async (product: ProductApprovalGroup) => {
    try {
      for (const sku of product.skus) {
        await undoFlashSaleSku(sku.id);
      }
      toast.info(`Đã hoàn tác toàn bộ SKU của "${product.productName}" về trạng thái Chờ duyệt!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hoàn tác thất bại");
    }
    refreshData();
  };

  const isAllPageSelected =
    allPageSkuIds.length > 0 &&
    allPageSkuIds.every((id) => selectedIds.includes(id));
  const isSomePageSelected =
    allPageSkuIds.some((id) => selectedIds.includes(id)) &&
    !isAllPageSelected;

  const registrationDeadlineInfo = useMemo(() => {
    if (!currentSession) return null;
    const deadlineStr =
      currentSession.registrationDeadline || currentSession.startTime;
    if (!deadlineStr) return null;
    try {
      const deadline = new Date(deadlineStr);
      if (isNaN(deadline.getTime())) return null;
      const now = new Date();
      const isPast = deadline.getTime() <= now.getTime();
      const diffMs = deadline.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;

      const timeDisplay = `${String(deadline.getHours()).padStart(2, "0")}:${String(
        deadline.getMinutes()
      ).padStart(2, "0")} (${String(deadline.getDate()).padStart(2, "0")}/${String(
        deadline.getMonth() + 1
      ).padStart(2, "0")})`;

      let countdownText = "";
      if (isPast) {
        countdownText = "Đã khóa đăng ký";
      } else if (diffHours > 24) {
        const days = Math.floor(diffHours / 24);
        countdownText = `còn ${days} ngày`;
      } else if (diffHours > 0) {
        countdownText = `còn ${diffHours}h ${remainingMins}p`;
      } else {
        countdownText = `còn ${diffMins} phút`;
      }

      return { timeDisplay, countdownText, isPast };
    } catch {
      return null;
    }
  }, [currentSession]);

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
                disabled={isLoadingSessions || sessions.length === 0}
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                className="flex items-center gap-space-sm h-10 px-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm hover:bg-surface-container-low transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="text-tertiary-container font-bold text-base leading-none">
                  ⚡
                </span>
                <div className="flex flex-col">
                  <span className="font-headline-md text-[13px] font-semibold text-on-surface leading-tight">
                    {isLoadingSessions
                      ? "Đang tải phiên..."
                      : currentSession
                      ? `${currentSession.name} – ${currentSession.timeRangeDisplay}`
                      : "Chưa có phiên Flash Sale"}
                  </span>
                </div>

                {/* Badge thông báo số lượng SKU cần duyệt của phiên đang chọn */}
                {currentSession && typeof currentSession.pendingSkusCount === "number" && currentSession.pendingSkusCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white font-label-sm text-[11px] font-bold shadow-xs animate-pulse ml-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    <span>{currentSession.pendingSkusCount} cần duyệt</span>
                  </span>
                )}

                {currentSession && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold leading-none ml-1",
                      currentSession.status === "ACTIVE"
                        ? "bg-rose-100 text-rose-700"
                        : currentSession.status === "PAUSED"
                        ? "bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                        : currentSession.status === "ENDED"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-sky-100 text-sky-700"
                    )}
                  >
                    {currentSession.status === "ACTIVE" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                    )}
                    {currentSession.status === "ACTIVE"
                      ? "Đang diễn ra"
                      : currentSession.status === "PAUSED"
                      ? "Tạm dừng"
                      : currentSession.status === "ENDED"
                      ? "Đã kết thúc"
                      : "Sắp diễn ra"}
                  </span>
                )}
                <span className="material-symbols-outlined text-[18px] text-secondary ml-1">
                  unfold_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {isSessionDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      setSessionSearchQuery("");
                    }}
                  />
                  <div className="absolute left-0 top-12 z-50 w-[420px] max-w-[95vw] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 p-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1 pt-0.5">
                      <span className="font-label-sm text-[11px] font-bold text-on-surface uppercase tracking-wider">
                        Phiên chưa bắt đầu ({upcomingSessions.length})
                      </span>
                      {totalPendingAcrossAllSlots > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-label-sm text-[11px] font-bold">
                          {totalPendingAcrossAllSlots} SKU chờ duyệt
                        </span>
                      )}
                    </div>

                    {/* Filter Tabs trong Dropdown: CHỈ LỌC CÁC PHIÊN CHƯA BẮT ĐẦU */}
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                      <button
                        type="button"
                        onClick={() => setSessionFilterTab("ALL")}
                        className={cn(
                          "py-1 px-2 rounded-md font-label-sm text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          sessionFilterTab === "ALL"
                            ? "bg-primary text-on-primary shadow-xs font-bold"
                            : "text-secondary hover:text-on-surface"
                        )}
                      >
                        <span>Chưa bắt đầu ({upcomingSessions.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionFilterTab("PENDING_ONLY")}
                        className={cn(
                          "py-1 px-2 rounded-md font-label-sm text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          sessionFilterTab === "PENDING_ONLY"
                            ? "bg-amber-600 text-white shadow-xs font-bold"
                            : "text-amber-800 hover:text-on-surface"
                        )}
                      >
                        {slotsWithPendingCount > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                        )}
                        <span>Chờ duyệt ({slotsWithPendingCount})</span>
                      </button>
                    </div>

                    {/* Search inside dropdown */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={sessionSearchQuery}
                        onChange={(e) => setSessionSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên phiên, giờ, ngày..."
                        className="w-full h-8 pl-8 pr-2.5 rounded-md bg-surface-bright text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-[12px]"
                        autoFocus
                      />
                    </div>

                    {/* Danh sách phiên với số lượng SKU cần duyệt */}
                    <div className="max-h-80 overflow-y-auto flex flex-col gap-1 pr-1 divide-y divide-outline-variant/20">
                      {dropdownFilteredSessions.map((s) => {
                        const hasPending = (s.pendingSkusCount || 0) > 0;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedSessionId(s.id);
                              setIsSessionDropdownOpen(false);
                              setSessionSearchQuery("");
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-body-sm transition-colors cursor-pointer mt-1",
                              s.id === selectedSessionId
                                ? "bg-primary-fixed text-primary font-semibold border border-primary/30"
                                : "hover:bg-surface-container-low text-on-surface"
                            )}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-semibold truncate">{s.name}</span>
                              <span className="text-secondary text-[11px]">
                                {s.timeRangeDisplay} · {s.date}
                              </span>
                            </div>

                            {/* Cột thông báo số lượng sản phẩm cần duyệt & trạng thái phiên */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasPending ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                  <span>{s.pendingSkusCount} cần duyệt</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-secondary bg-surface-container">
                                  0 cần duyệt
                                </span>
                              )}

                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                                  s.status === "ACTIVE"
                                    ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-300"
                                    : s.status === "PAUSED"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                                    : s.status === "ENDED"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-sky-100 text-sky-700"
                                )}
                              >
                                {s.status === "ACTIVE"
                                  ? "Live"
                                  : s.status === "PAUSED"
                                  ? "Tạm dừng"
                                  : s.status === "ENDED"
                                  ? "Kết thúc"
                                  : "Sắp tới"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {dropdownFilteredSessions.length === 0 && (
                        <div className="py-6 text-center text-secondary text-[12px] flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-[24px] text-secondary">
                            event_busy
                          </span>
                          <span>Không có phiên Flash Sale nào chưa bắt đầu</span>
                        </div>
                      )}
                    </div>
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

          {registrationDeadlineInfo && (
            <div className="hidden lg:flex items-center gap-2 text-secondary font-body-sm text-body-sm shrink-0">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>
                Khóa đăng ký:{" "}
                <strong className="text-on-surface font-medium">
                  {registrationDeadlineInfo.timeDisplay}{" "}
                  <span
                    className={cn(
                      "font-semibold ml-1",
                      registrationDeadlineInfo.isPast
                        ? "text-rose-600"
                        : "text-amber-700"
                    )}
                  >
                    ({registrationDeadlineInfo.countdownText})
                  </span>
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-space-sm p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20">
          {/* Search Field */}
          <div className="sm:col-span-2 lg:col-span-3 relative">
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

          {/* Store Name Filter */}
          <div className="sm:col-span-1 lg:col-span-3 relative">
            <select
              value={storeNameFilter}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border border-outline-variant/30"
            >
              <option value="">
                Tất cả tên gian hàng {uniqueStores.length > 0 ? `(${uniqueStores.length})` : ""}
              </option>
              {uniqueStores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
              storefront
            </span>
          </div>

          {/* Shop Type Filter */}
          <div className="sm:col-span-1 lg:col-span-2 relative">
            <select
              value={shopTypeFilter}
              onChange={(e) => handleShopTypeChange(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border border-outline-variant/30"
            >
              <option value="">Loại gian hàng</option>
              <option value="mall">Chỉ Vibe Mall</option>
              <option value="favorite">Shop Yêu thích</option>
              <option value="normal">Shop Thường</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-1 lg:col-span-2 relative">
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
          <div className="sm:col-span-1 lg:col-span-2 relative">
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
          <table className="w-full min-w-[1250px] text-left border-collapse">
            <thead>
              <tr className="h-11 bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-secondary border-b border-surface-container">
                <th className="w-12 px-4 text-center shrink-0">
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
                <th className="px-4 min-w-[280px] whitespace-nowrap">Sản phẩm &amp; SPU</th>
                <th className="px-4 min-w-[130px] text-center whitespace-nowrap">Biến thể</th>
                <th className="px-4 min-w-[160px] whitespace-nowrap">Gian hàng</th>
                <th className="px-4 min-w-[130px] text-right whitespace-nowrap">Giá gốc</th>
                <th className="px-4 min-w-[150px] text-right whitespace-nowrap">Giá Flash Sale</th>
                <th className="px-4 min-w-[130px] text-center whitespace-nowrap">Mở bán / Tồn kho</th>
                <th className="px-4 min-w-[120px] whitespace-nowrap">Thời gian gửi</th>
                <th className="px-4 w-[160px] min-w-[160px] text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {isLoadingItems ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`loading-${idx}`} className="animate-pulse">
                    <td className="px-4 py-4 text-center">
                      <div className="w-4 h-4 bg-surface-container rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface-container shrink-0" />
                        <div className="flex flex-col gap-1.5 flex-1">
                          <div className="w-3/4 h-3.5 bg-surface-container rounded" />
                          <div className="w-1/2 h-3 bg-surface-container-low rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="w-20 h-7 bg-surface-container rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-24 h-3.5 bg-surface-container rounded mb-1" />
                      <div className="w-16 h-3 bg-surface-container-low rounded" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-16 h-3.5 bg-surface-container rounded ml-auto" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-20 h-4 bg-surface-container rounded ml-auto" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="w-16 h-3.5 bg-surface-container rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-20 h-3 bg-surface-container rounded" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-24 h-7 bg-surface-container rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-secondary">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                        <span className="material-symbols-outlined text-[44px] text-primary/40">
                          inventory_2
                        </span>
                        <p className="font-bold text-body-lg text-on-surface">
                          Chưa có sản phẩm nào đăng ký
                        </p>
                        <p className="font-normal text-body-sm text-secondary">
                          Phiên Flash Sale này chưa có SKU nào được gửi từ các Nhà bán hàng (Seller). Khi có lượt đăng ký mới, danh sách kiểm duyệt sẽ hiển thị tại đây.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-outline">
                          filter_alt_off
                        </span>
                        <p className="font-medium text-body-md text-on-surface">
                          Không tìm thấy SKU nào phù hợp với bộ lọc hiện tại.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const productSkuIds = prod.skus.map((s) => s.id);
                  const isAllSkusSelected = productSkuIds.length > 0 && productSkuIds.every((id) => selectedIds.includes(id));
                  const isSomeSkusSelected = productSkuIds.some((id) => selectedIds.includes(id)) && !isAllSkusSelected;
                  const isExpanded = expandedProductIds.has(prod.productId);

                  const progressPercent = prod.totalOriginalStock > 0
                    ? Math.min(100, Math.round((prod.totalAllocatedStock / prod.totalOriginalStock) * 100))
                    : 0;

                  return (
                    <React.Fragment key={prod.productId}>
                      {/* Parent Product Row */}
                      <tr
                        className={cn(
                          "hover:bg-surface-container-low/70 transition-colors border-b border-surface-container",
                          isAllSkusSelected && "bg-sky-50/50"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="w-12 px-4 py-3 text-center align-middle shrink-0">
                          <input
                            type="checkbox"
                            checked={isAllSkusSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = isSomeSkusSelected;
                            }}
                            onChange={() => handleToggleProduct(prod)}
                            className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                          />
                        </td>

                        {/* Sản phẩm & SPU */}
                        <td className="px-4 py-3 align-middle min-w-[280px] max-w-[340px]">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0 shadow-sm border border-outline-variant/20">
                              <Image
                                src={prod.imageUrl}
                                alt={prod.productName}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span
                                className="font-headline-md text-body-md font-semibold text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                                title={prod.productName}
                                onClick={() => toggleExpandProduct(prod.productId)}
                              >
                                {prod.productName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded font-label-sm text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                  SPU
                                </span>
                                <span className="font-label-sm text-label-sm text-secondary truncate">
                                  Mã: #{prod.productId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Biến thể: Nút "Xem SKU" giống bên Seller */}
                        <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleExpandProduct(prod.productId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors border border-outline-variant/20 cursor-pointer"
                          >
                            <span>Xem SKU</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-50 text-emerald-700 font-bold">
                              {prod.skus.length}
                            </span>
                            <span
                              className={`material-symbols-outlined text-[16px] text-emerald-600 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            >
                              expand_circle_down
                            </span>
                          </button>
                        </td>

                        {/* Gian hàng */}
                        <td className="px-4 py-3 align-middle min-w-[160px] whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-headline-md text-body-md text-on-surface font-medium truncate max-w-[180px]">
                              {prod.storeName}
                            </span>
                            <span className="font-label-sm text-label-sm mt-0.5 text-secondary">
                              {prod.storeBadge === "MALL" ? (
                                <span className="text-rose-600 font-bold uppercase text-[10px]">
                                  MALL OFFICIAL
                                </span>
                              ) : prod.storeBadge === "FAVORITE" ? (
                                <span className="text-amber-600 font-semibold text-[11px]">
                                  Shop Yêu thích
                                </span>
                              ) : (
                                "Shop Thường"
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Giá niêm yết / gốc */}
                        <td className="px-4 py-3 text-right align-middle font-data-tabular text-body-md text-secondary whitespace-nowrap font-medium">
                          {prod.minOriginalPrice === prod.maxOriginalPrice
                            ? formatVnd(prod.minOriginalPrice)
                            : `${formatVnd(prod.minOriginalPrice)} - ${formatVnd(prod.maxOriginalPrice)}`}
                        </td>

                        {/* Giá Flash Sale */}
                        <td className="px-4 py-3 text-right align-middle whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-data-tabular text-headline-sm font-bold text-tertiary">
                              {prod.minFlashSalePrice === prod.maxFlashSalePrice
                                ? formatVnd(prod.minFlashSalePrice)
                                : `${formatVnd(prod.minFlashSalePrice)} - ${formatVnd(prod.maxFlashSalePrice)}`}
                            </span>
                          </div>
                        </td>

                        {/* Mở bán / Tồn kho */}
                        <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="font-data-tabular text-body-sm text-on-surface">
                              <span className="text-primary font-extrabold">
                                {prod.totalAllocatedStock}
                              </span>{" "}
                              / {prod.totalOriginalStock}
                            </span>
                            <div className="w-16 bg-surface-container rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Thời gian gửi */}
                        <td className="px-4 py-3 align-middle font-data-tabular text-body-sm text-secondary whitespace-nowrap">
                          {prod.submittedAt}
                        </td>

                        {/* Thao tác nhóm */}
                        <td className="px-4 py-3 text-right align-middle whitespace-nowrap w-[160px] min-w-[160px]">
                          {activeTab === "PENDING" && (
                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRejectProduct(prod)}
                                className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-rose-50 text-rose-700 font-headline-md text-body-sm font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                                title="Từ chối toàn bộ biến thể của sản phẩm này"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveProduct(prod)}
                                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-headline-md text-body-sm font-semibold transition-colors shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
                                title="Duyệt toàn bộ biến thể của sản phẩm này"
                              >
                                Duyệt tất cả
                              </button>
                            </div>
                          )}

                          {activeTab === "APPROVED" && (
                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUndoProduct(prod)}
                                className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface font-headline-md text-body-sm font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                                title="Hoàn tác toàn bộ SKU về chờ duyệt"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          )}

                          {activeTab === "REJECTED" && (
                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUndoProduct(prod)}
                                className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface font-headline-md text-body-sm font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                                title="Hoàn tác về chờ duyệt"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Sub-table: SKU Matrix khi click "Xem SKU" */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 border-b border-outline-variant/30 bg-surface-container-low/20">
                            <div className="p-4 pl-12">
                              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-3 border border-outline-variant/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                                      subdirectory_arrow_right
                                    </span>
                                    <span className="font-semibold text-sm text-on-surface">
                                      Danh sách biến thể phân loại (SKU Matrix)
                                    </span>
                                  </div>
                                  <span className="text-xs text-secondary font-medium">
                                    {prod.skus.length} biến thể được nộp duyệt Flash Sale
                                  </span>
                                </div>

                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="h-9 bg-surface-container-low font-label-sm text-label-sm text-secondary uppercase border-b border-outline-variant/20">
                                      <th className="w-10 px-3 text-center"></th>
                                      <th className="px-3 py-1">Mã SKU</th>
                                      <th className="px-3 py-1">Thuộc tính</th>
                                      <th className="px-3 py-1 text-right">Giá gốc</th>
                                      <th className="px-3 py-1 text-right">Giá Flash Sale</th>
                                      <th className="px-3 py-1 text-center">Mở bán / Kho</th>
                                      <th className="px-3 py-1 text-center">Giới hạn</th>
                                      <th className="px-3 py-1 text-center">Trạng thái</th>
                                      <th className="px-3 py-1 text-right">Thao tác SKU</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                                    {prod.skus.map((sku) => {
                                      const isSkuSelected = selectedIds.includes(sku.id);
                                      return (
                                        <tr
                                          key={sku.id}
                                          className={cn(
                                            "h-11 hover:bg-surface-container-low/40 transition-colors",
                                            isSkuSelected && "bg-sky-50/60"
                                          )}
                                        >
                                          {/* SKU Checkbox */}
                                          <td className="px-3 text-center align-middle">
                                            <input
                                              type="checkbox"
                                              checked={isSkuSelected}
                                              onChange={() => handleToggleRow(sku.id)}
                                              className="w-3.5 h-3.5 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                                            />
                                          </td>

                                          {/* Mã SKU */}
                                          <td className="px-3 font-mono font-semibold text-on-surface">
                                            {sku.skuCode}
                                          </td>

                                          {/* Thuộc tính */}
                                          <td className="px-3 text-secondary">
                                            {sku.variantName || "Mặc định"}
                                          </td>

                                          {/* Giá gốc */}
                                          <td className="px-3 text-right font-data-tabular text-secondary font-medium">
                                            {formatVnd(sku.originalPrice)}
                                          </td>

                                          {/* Giá Flash Sale */}
                                          <td className="px-3 text-right font-data-tabular font-bold text-tertiary">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <span>{formatVnd(sku.flashSalePrice)}</span>
                                              {sku.discountPercent > 0 && (
                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                                  -{sku.discountPercent}%
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Mở bán / Kho */}
                                          <td className="px-3 text-center font-data-tabular text-on-surface">
                                            <span className="font-bold text-primary">{sku.allocatedStock}</span> / {sku.originalStock}
                                          </td>

                                          {/* Giới hạn */}
                                          <td className="px-3 text-center text-secondary">
                                            {sku.customerLimit} sp/khách
                                          </td>

                                          {/* Trạng thái */}
                                          <td className="px-3 text-center">
                                            <span
                                              className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                                sku.status === "PENDING" && "bg-amber-50 text-amber-700 border border-amber-200",
                                                sku.status === "APPROVED" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                                                sku.status === "REJECTED" && "bg-rose-50 text-rose-700 border border-rose-200"
                                              )}
                                            >
                                              {sku.status === "PENDING" ? "• Chờ duyệt" : sku.status === "APPROVED" ? "• Đã duyệt" : "• Từ chối"}
                                            </span>
                                          </td>

                                          {/* Thao tác từng SKU */}
                                          <td className="px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              {sku.status === "PENDING" && (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenRejectSingle(sku)}
                                                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                                                    title="Từ chối SKU này"
                                                  >
                                                    Từ chối
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenApproveSingle(sku)}
                                                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                                                    title="Duyệt SKU này"
                                                  >
                                                    Duyệt
                                                  </button>
                                                </>
                                              )}

                                              {sku.status === "APPROVED" && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleUndo(sku)}
                                                  className="px-2 py-1 rounded-md text-xs font-medium text-secondary hover:bg-surface-container transition-colors cursor-pointer"
                                                  title="Hoàn tác SKU về chờ duyệt"
                                                >
                                                  Hoàn tác
                                                </button>
                                              )}

                                              {sku.status === "REJECTED" && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleUndo(sku)}
                                                  className="px-2 py-1 rounded-md text-xs font-medium text-secondary hover:bg-surface-container transition-colors cursor-pointer"
                                                  title="Hoàn tác SKU về chờ duyệt"
                                                >
                                                  Hoàn tác
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              {paginatedProducts.length}
            </span>{" "}
            trên{" "}
            <span className="font-bold text-on-surface">
              {groupedProducts.length}
            </span>{" "}
            sản phẩm ({filteredItems.length} SKU) {activeTab === "PENDING" ? "chờ kiểm duyệt" : ""}
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
              <span className="font-label-sm text-label-sm font-bold tracking-wider uppercase text-slate-400 truncate max-w-[220px]">
                {currentSession ? currentSession.name : "Phiên Flash Sale"}
              </span>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  currentSession?.status === "ACTIVE"
                    ? "bg-rose-400 animate-ping"
                    : currentSession?.status === "ENDED"
                    ? "bg-slate-400"
                    : "bg-emerald-400"
                )}
              />
            </div>
            <div className="mt-4">
              <span className="font-display-sm text-display-sm font-bold tabular-nums">
                {counts.approved} / {Math.max(50, counts.approved + counts.pending)}
              </span>
              <span className="text-slate-400 font-body-sm text-body-sm block mt-0.5">
                SKU đã duyệt lên kệ ({counts.pending} SKU chờ duyệt)
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-primary-container h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (counts.approved /
                      Math.max(1, Math.max(50, counts.approved + counts.pending))) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>
              Tổng đã duyệt:{" "}
              <strong className="text-white">
                {counts.approved} SKU
              </strong>
            </span>
            <span className="text-tertiary-fixed-dim font-medium">
              {currentSession?.status === "ACTIVE"
                ? "Đang mở bán"
                : currentSession?.status === "ENDED"
                ? "Đã kết thúc"
                : registrationDeadlineInfo
                ? registrationDeadlineInfo.countdownText
                : "Sắp diễn ra"}
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
