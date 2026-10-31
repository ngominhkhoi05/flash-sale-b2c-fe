"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND, cn } from "@/lib/utils";
import { useWs } from "@/providers/WsConnectionProvider";
import {
  getFlashSaleSlots,
  getRegisteredFlashSaleHistory,
  getSellerProducts,
  getSellerProductDetail,
  registerFlashSaleItems,
  cancelFlashSaleRegistration,
} from "@/lib/api/seller";
import { useMyStore } from "@/hooks/useMyStore";
import type {
  FlashSaleSlotItem,
  RegisteredFlashSaleHistoryItem,
  SellerProductSummaryResponse,
  SellerProductDetailResponse,
  RegisterFlashSaleItemDto,
} from "@/types/seller";
import {
  getCachedFlashSaleSlots,
  setCachedFlashSaleSlots,
  getCachedFlashSaleHistory,
  setCachedFlashSaleHistory,
} from "@/lib/sellerCache";

export function FlashSaleRegisterClient() {
  const { isBanned } = useMyStore();
  const [activeTab, setActiveTab] = useState<"open-slots" | "my-regs">("open-slots");
  const cachedSlots = getCachedFlashSaleSlots();
  const cachedHistory = getCachedFlashSaleHistory();
  const [slots, setSlots] = useState<FlashSaleSlotItem[]>(() => cachedSlots || []);
  const [history, setHistory] = useState<RegisteredFlashSaleHistoryItem[]>(() => cachedHistory || []);
  const [isLoading, setIsLoading] = useState(() => !cachedSlots || !cachedHistory);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelTargetItem, setCancelTargetItem] = useState<RegisteredFlashSaleHistoryItem | null>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FlashSaleSlotItem | null>(null);

  // Bộ lọc cho tab "Đăng ký của tôi"
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("ALL");
  const [historySlotFilter, setHistorySlotFilter] = useState<string>("ALL");
  const [expandedProductKeys, setExpandedProductKeys] = useState<Set<string>>(new Set());
  const [cancelTargetGroup, setCancelTargetGroup] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const { ensureClient } = useWs();

  // Nạp & đồng bộ dữ liệu thời gian thực (hỗ trợ Stale-While-Revalidate)
  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [slotsRes, histRes] = await Promise.allSettled([
        getFlashSaleSlots(),
        getRegisteredFlashSaleHistory(),
      ]);
      if (slotsRes.status === "fulfilled" && slotsRes.value) {
        setSlots(slotsRes.value);
        setCachedFlashSaleSlots(slotsRes.value);
      }
      if (histRes.status === "fulfilled" && histRes.value) {
        setHistory(histRes.value);
        setCachedFlashSaleHistory(histRes.value);
      }
    } catch (e) {
      console.warn("Refresh Flash Sale data warning:", e);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Realtime WebSocket: tự động cập nhật danh sách đăng ký khi Admin duyệt, từ chối hoặc có phiên mới
  useEffect(() => {
    let client: ReturnType<typeof ensureClient> | null = null;
    const unsubs: Array<() => void> = [];

    try {
      client = ensureClient();
      setIsWsConnected(true);

      const offApprovals = client.subscribe("/topic/admin/flash-sale/approvals", () => {
        void refreshData(true);
      });
      unsubs.push(offApprovals);

      const offCounts = client.subscribe("/topic/admin/flash-sale/counts", () => {
        void refreshData(true);
      });
      unsubs.push(offCounts);

      const offSlots = client.subscribe("/topic/flash-sale/slots", () => {
        void refreshData(true);
      });
      unsubs.push(offSlots);

      const offStock = client.subscribe("/topic/flash-sale/stock-updates", () => {
        void refreshData(true);
      });
      unsubs.push(offStock);
    } catch {
      // ignore
    }

    const handleFocus = () => {
      void refreshData(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubs.forEach((u) => {
        try { u(); } catch {}
      });
      window.removeEventListener("focus", handleFocus);
    };
  }, [ensureClient, refreshData]);

  const toggleExpandProduct = useCallback((key: string) => {
    setExpandedProductKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Products for registration
  const [sellerProducts, setSellerProducts] = useState<SellerProductSummaryResponse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SellerProductSummaryResponse | null>(null);
  const [productDetail, setProductDetail] = useState<SellerProductDetailResponse | null>(null);
  const [isChangingProduct, setIsChangingProduct] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // SKU configuration map: variantId -> { selected, flashSalePrice, allocatedStock, userPurchaseLimit }
  const [skuConfigs, setSkuConfigs] = useState<
    Record<
      number,
      {
        selected: boolean;
        flashSalePrice: number;
        allocatedStock: number;
        userPurchaseLimit: number;
      }
    >
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      getFlashSaleSlots(),
      getRegisteredFlashSaleHistory(),
      getSellerProducts(0, 50, "ACTIVE"),
    ]).then(([slotsRes, histRes, prodsRes]) => {
      if (!isMounted) return;
      if (slotsRes.status === "fulfilled" && slotsRes.value) {
        setSlots(slotsRes.value);
        setCachedFlashSaleSlots(slotsRes.value);
      }
      if (histRes.status === "fulfilled" && histRes.value) {
        setHistory(histRes.value);
        setCachedFlashSaleHistory(histRes.value);
      }
      if (prodsRes.status === "fulfilled" && prodsRes.value.content) {
        setSellerProducts(prodsRes.value.content);
        if (prodsRes.value.content.length > 0) {
          setSelectedProduct(prodsRes.value.content[0]);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Batch setup states
  const [batchDiscountPercent, setBatchDiscountPercent] = useState<number>(10);
  const [batchAllocatedStock, setBatchAllocatedStock] = useState<number>(10);
  const [batchPurchaseLimit] = useState<number>(1);

  // When selectedProduct changes, fetch its full details (including SKU variants)
  useEffect(() => {
    if (!selectedProduct) return;
    let isMounted = true;

    getSellerProductDetail(selectedProduct.id)
      .then((detail) => {
        if (!isMounted) return;
        setProductDetail(detail);

        // Populate initial SKU configuration with 10% default discount (tiêu chuẩn sàn)
        const initialMap: typeof skuConfigs = {};
        detail.variants.forEach((v) => {
          // Tính giá giảm 10% theo quy chuẩn phiên, làm tròn đến nghìn đồng
          const discountPrice = Math.round((v.originalPrice * 0.9) / 1000) * 1000;
          const safeFlashPrice =
            discountPrice > 0 && discountPrice < v.originalPrice
              ? discountPrice
              : Math.max(1, v.originalPrice - 1000);

          const hasStock = v.stockQuantity > 0;
          const maxStock = Math.min(v.stockQuantity, 10);
          initialMap[v.id] = {
            selected: hasStock,
            flashSalePrice: safeFlashPrice,
            allocatedStock: hasStock ? (maxStock > 0 ? maxStock : 1) : 0,
            userPurchaseLimit: 1,
          };
        });
        setSkuConfigs(initialMap);
        setIsLoadingDetail(false);
      })
      .catch((err) => {
        console.error("Failed to load product detail:", err);
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProduct]);

  // Open drawer for a slot
  const handleOpenDrawer = (slot: FlashSaleSlotItem) => {
    if (isBanned) {
      toast.error("Gian hàng đang bị khóa, không đủ điều kiện tham gia Flash Sale!");
      return;
    }
    setSelectedSlot(slot);
    setIsDrawerOpen(true);
    setErrorMessage(null);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setIsChangingProduct(false);
    setErrorMessage(null);
  };

  // Checkbox toggle
  const handleToggleSku = (variantId: number) => {
    setSkuConfigs((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        selected: !prev[variantId]?.selected,
      },
    }));
  };

  // Select all or deselect all SKUs
  const handleSelectAllSkus = (select: boolean) => {
    if (!productDetail) return;
    setSkuConfigs((prev) => {
      const next = { ...prev };
      productDetail.variants.forEach((v) => {
        if (v.stockQuantity > 0) {
          next[v.id] = {
            ...next[v.id],
            selected: select,
            allocatedStock:
              select && (!next[v.id]?.allocatedStock || next[v.id]?.allocatedStock <= 0)
                ? Math.min(v.stockQuantity, 10)
                : next[v.id]?.allocatedStock || 0,
          };
        }
      });
      return next;
    });
  };

  // Field change handlers - Tự động tick chọn khi sửa giá hoặc số lượng
  const handleSkuPriceChange = (variantId: number, val: number) => {
    setSkuConfigs((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        flashSalePrice: val,
        selected: true,
      },
    }));
  };

  const handleSkuStockChange = (variantId: number, val: number) => {
    const variant = productDetail?.variants.find((v) => v.id === variantId);
    const maxStock = variant?.stockQuantity ?? 0;
    const safeStock = Math.max(0, Math.min(val, maxStock));
    if (val > maxStock) {
      toast.warning(`Số lượng mở bán tối đa của SKU này là ${maxStock} (bằng tồn kho hiện có)!`);
    }
    setSkuConfigs((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] || {
          flashSalePrice: variant ? Math.round((variant.originalPrice * 0.9) / 1000) * 1000 : 0,
          userPurchaseLimit: 1,
        }),
        allocatedStock: safeStock,
        selected: safeStock > 0,
      },
    }));
  };

  const handleSkuLimitChange = (variantId: number, val: number) => {
    setSkuConfigs((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        userPurchaseLimit: val,
      },
    }));
  };

  // Áp dụng hàng loạt cho tất cả SKU đã chọn
  const handleApplyBatchSetup = () => {
    if (!productDetail) return;
    const discount = Math.max(1, Math.min(99, Number(batchDiscountPercent) || 10));
    const targetStock = Math.max(1, Number(batchAllocatedStock) || 10);
    const targetLimit = Math.max(1, Math.min(10, Number(batchPurchaseLimit) || 1));

    // Tìm các biến thể còn hàng và được chọn
    const selectedVariants = productDetail.variants.filter((v) => {
      const cfg = skuConfigs[v.id];
      return (cfg ? cfg.selected : true) && v.stockQuantity > 0;
    });

    if (selectedVariants.length === 0) {
      toast.error("Vui lòng tích chọn ít nhất 1 SKU còn hàng để áp dụng!");
      return;
    }

    setSkuConfigs((prev) => {
      const next = { ...prev };
      selectedVariants.forEach((v) => {
        const discountRate = (100 - discount) / 100;
        const calculatedPrice = Math.round((v.originalPrice * discountRate) / 1000) * 1000;
        const safePrice =
          calculatedPrice > 0 && calculatedPrice < v.originalPrice
            ? calculatedPrice
            : Math.max(1, v.originalPrice - 1000);

        const safeStock = Math.min(v.stockQuantity, targetStock);

        next[v.id] = {
          selected: true,
          flashSalePrice: safePrice,
          allocatedStock: safeStock,
          userPurchaseLimit: targetLimit,
        };
      });
      return next;
    });

    toast.success(`Đã áp dụng giảm ${discount}% và SL ${targetStock} cho ${selectedVariants.length} SKU đã chọn!`);
  };

  // Computed summary for drawer
  const selectedSkuCount = useMemo(() => {
    return Object.values(skuConfigs).filter((c) => c.selected && c.allocatedStock > 0).length;
  }, [skuConfigs]);

  const totalAllocatedStock = useMemo(() => {
    return Object.values(skuConfigs)
      .filter((c) => c.selected)
      .reduce((sum, c) => sum + (c.allocatedStock || 0), 0);
  }, [skuConfigs]);

  // Submit registration
  const handleSubmitRegistration = async () => {
    if (!selectedSlot || !productDetail) return;
    setErrorMessage(null);

    const itemsToRegister: RegisterFlashSaleItemDto[] = [];
    for (const v of productDetail.variants) {
      const cfg = skuConfigs[v.id];
      const skuLabel = v.sku || v.skuCode || `SKU-${v.id}`;

      if (cfg && cfg.selected && cfg.allocatedStock > 0) {
        if (cfg.flashSalePrice <= 0) {
          const msg = `Giá bán Flash Sale của SKU [${skuLabel}] phải lớn hơn 0.`;
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
        if (cfg.flashSalePrice >= v.originalPrice) {
          const msg = `Giá bán Flash Sale của SKU [${skuLabel}] (${formatVND(cfg.flashSalePrice)}₫) phải thấp hơn giá gốc (${formatVND(v.originalPrice)}₫).`;
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
        if (cfg.allocatedStock > v.stockQuantity) {
          const msg = `Số lượng mở bán của SKU [${skuLabel}] (${cfg.allocatedStock}) vượt quá tồn kho thực tế (${v.stockQuantity}).`;
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }

        itemsToRegister.push({
          slotId: selectedSlot.id,
          variantId: v.id,
          flashSalePrice: cfg.flashSalePrice,
          allocatedStock: cfg.allocatedStock,
          userPurchaseLimit: cfg.userPurchaseLimit || 1,
        });
      }
    }

    if (itemsToRegister.length === 0) {
      const msg = "Vui lòng chọn ít nhất 1 biến thể SKU còn tồn kho và có số lượng mở bán > 0.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerFlashSaleItems(itemsToRegister);
      void refreshData(true);
      
      // Tải lại dữ liệu thật ngay từ server
      const freshHistory = await getRegisteredFlashSaleHistory();
      if (freshHistory) {
        setHistory(freshHistory);
      }

      setIsDrawerOpen(false);
      setActiveTab("my-regs");
      const successNotice = `Đã gửi thành công ${itemsToRegister.length} SKU tham gia "${selectedSlot.title}"!`;
      setToastMessage(successNotice);
      toast.success(successNotice);
      setTimeout(() => setToastMessage(null), 5000);

      // Đồng bộ ngầm từ server và gộp an toàn
      getRegisteredFlashSaleHistory().then((data) => {
        if (data && data.length > 0) {
          setHistory((prev) => {
            const serverIds = new Set(data.map((d) => d.id));
            const pendingOptimistic = prev.filter(
              (p) => !serverIds.has(p.id) && typeof p.id === "number" && p.id > 1000000000
            );
            return [...pendingOptimistic, ...data];
          });
        }
      });
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      const msg = errObj?.message || "Có lỗi xảy ra khi nộp đăng ký Flash Sale.";
      setErrorMessage(msg);
      toast.error(msg, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal xác nhận hủy đăng ký Flash Sale
  const handleRequestCancel = (item: RegisteredFlashSaleHistoryItem) => {
    setCancelTargetItem(item);
  };

  // Xác nhận hủy đăng ký sản phẩm Flash Sale
  const handleConfirmCancel = async () => {
    if (!cancelTargetItem) return;
    setCancellingId(cancelTargetItem.id);
    try {
      await cancelFlashSaleRegistration(cancelTargetItem.id);
      setHistory((prev) => prev.filter((item) => item.id !== cancelTargetItem.id));

      // Xóa khỏi sessionStorage nếu có
      try {
        if (typeof window !== "undefined") {
          const currentSaved: RegisteredFlashSaleHistoryItem[] = JSON.parse(
            window.sessionStorage.getItem("fs_local_registered_items") || "[]"
          );
          window.sessionStorage.setItem(
            "fs_local_registered_items",
            JSON.stringify(currentSaved.filter((item) => item.id !== cancelTargetItem.id))
          );
        }
      } catch {
        // ignore
      }

      toast.success("Đã hủy đơn đăng ký Flash Sale thành công.");
      setCancelTargetItem(null);
      void refreshData(true);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj?.message || "Không thể hủy đăng ký lúc này. Vui lòng thử lại sau.");
    } finally {
      setCancellingId(null);
    }
  };

  // Tự động lọc bỏ các đơn đăng ký chưa duyệt thuộc các phiên đã qua giờ
  const validHistory = useMemo(() => {
    const now = Date.now();
    return history.filter((item) => {
      if (item.status === "PENDING" || item.status === "PENDING_APPROVAL") {
        if (item.slotStartTime && new Date(item.slotStartTime).getTime() <= now) {
          return false;
        }
      }
      return true;
    });
  }, [history]);

  // Danh sách các phiên duy nhất để đưa vào dropdown lọc
  const uniqueHistorySlots = useMemo(() => {
    const map = new Map<string, string>();
    validHistory.forEach((item) => {
      if (item.slotTitle) {
        map.set(item.slotTitle, item.slotTitle);
      }
    });
    return Array.from(map.values());
  }, [validHistory]);

  // Bộ lọc lịch sử đăng ký
  const filteredHistory = useMemo(() => {
    return validHistory.filter((item) => {
      if (historyStatusFilter !== "ALL") {
        const itemStatus = item.status === "PENDING_APPROVAL" ? "PENDING" : item.status;
        if (itemStatus !== historyStatusFilter) return false;
      }
      if (historySlotFilter !== "ALL") {
        if (item.slotTitle !== historySlotFilter) return false;
      }
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const matchName = (item.productName || "").toLowerCase().includes(q);
        const matchSku = (item.sku || "").toLowerCase().includes(q);
        const matchSlot = (item.slotTitle || "").toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchSlot) return false;
      }
      return true;
    });
  }, [validHistory, historyStatusFilter, historySlotFilter, historySearchQuery]);

  // Gom nhóm SKU theo từng Sản phẩm (SPU Matrix)
  const groupedHistory = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of filteredHistory) {
      const key = `${item.productId || item.productName}_${item.slotTitle}_${item.slotDate}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          groupKey: key,
          productId: item.productId,
          productName: item.productName,
          imageUrl: item.imageUrl,
          slotId: item.slotId,
          slotTitle: item.slotTitle,
          slotDate: item.slotDate,
          slotTime: item.slotTime,
          minFlashSalePrice: item.flashSalePrice,
          maxFlashSalePrice: item.flashSalePrice,
          minOriginalPrice: item.originalPrice ?? item.flashSalePrice,
          maxOriginalPrice: item.originalPrice ?? item.flashSalePrice,
          totalAllocatedStock: item.allocatedStock,
          totalSoldStock: item.soldStock,
          allPending: item.status === "PENDING" || item.status === "PENDING_APPROVAL",
          allApproved: item.status === "APPROVED",
          anyRejected: item.status === "REJECTED",
          skus: [item],
        });
      } else {
        existing.skus.push(item);
        existing.minFlashSalePrice = Math.min(existing.minFlashSalePrice, item.flashSalePrice);
        existing.maxFlashSalePrice = Math.max(existing.maxFlashSalePrice, item.flashSalePrice);
        if (item.originalPrice) {
          existing.minOriginalPrice = Math.min(existing.minOriginalPrice, item.originalPrice);
          existing.maxOriginalPrice = Math.max(existing.maxOriginalPrice, item.originalPrice);
        }
        existing.totalAllocatedStock += item.allocatedStock;
        existing.totalSoldStock += item.soldStock;
        if (item.status !== "PENDING" && item.status !== "PENDING_APPROVAL") {
          existing.allPending = false;
        }
        if (item.status !== "APPROVED") {
          existing.allApproved = false;
        }
        if (item.status === "REJECTED") {
          existing.anyRejected = true;
        }
      }
    }
    return Array.from(map.values());
  }, [filteredHistory]);

  // Kiểm tra xem toàn bảng có sản phẩm/SKU nào đang có thể hủy không (chỉ hiển thị cột Thao tác khi có hành động hủy)
  const hasAnyCancelAction = useMemo(() => {
    return groupedHistory.some((g) =>
      g.skus.some((s: any) => s.status === "PENDING" || s.status === "PENDING_APPROVAL")
    );
  }, [groupedHistory]);

  // Hủy toàn bộ các biến thể chờ duyệt của sản phẩm trong phiên
  const handleCancelAllPendingInProduct = async (group: any) => {
    const pendingSkus = group.skus.filter(
      (s: any) => s.status === "PENDING" || s.status === "PENDING_APPROVAL"
    );
    if (pendingSkus.length === 0) return;
    setIsLoading(true);
    let successCount = 0;
    for (const sku of pendingSkus) {
      try {
        await cancelFlashSaleRegistration(sku.id);
        successCount++;
      } catch {
        // ignore
      }
    }
    toast.success(`Đã hủy ${successCount} SKU chờ duyệt của sản phẩm "${group.productName}"!`);
    void refreshData(true);
    setIsLoading(false);
  };

  // Xuất báo cáo lịch sử đăng ký Flash Sale ra file Excel (.xlsx) chuẩn từng cột, có hàng tiêu đề
  const handleExportHistoryExcel = () => {
    try {
      const exportData = filteredHistory && filteredHistory.length > 0 ? filteredHistory : history;
      if (!exportData || exportData.length === 0) {
        toast.error("Chưa có dữ liệu đăng ký để xuất báo cáo Excel.");
        return;
      }

      const rows = exportData.map((item: RegisteredFlashSaleHistoryItem, idx: number) => {
        const percent =
          item.allocatedStock > 0
            ? Math.round((item.soldStock / item.allocatedStock) * 100)
            : 0;

        const origPrice = item.originalPrice ?? item.flashSalePrice;
        const discountPct =
          origPrice > 0 && origPrice > item.flashSalePrice
            ? Math.round(((origPrice - item.flashSalePrice) / origPrice) * 100)
            : 0;

        let statusText = item.status;
        if (item.status === "PENDING" || item.status === "PENDING_APPROVAL") {
          statusText = "Chờ duyệt";
        } else if (item.status === "APPROVED") {
          statusText = "Đã duyệt";
        } else if (item.status === "REJECTED") {
          statusText = "Từ chối";
        }

        return [
          idx + 1,
          item.id,
          item.productName || "",
          item.sku || "",
          item.variantName || item.sku || "",
          item.slotTitle || "",
          item.slotTime || "",
          item.slotDate || "",
          origPrice,
          item.flashSalePrice,
          discountPct > 0 ? `${discountPct}%` : "0%",
          item.allocatedStock,
          item.soldStock,
          `${percent}%`,
          statusText,
        ];
      });

      const headerTitles = [
        "STT",
        "Mã đăng ký",
        "Tên sản phẩm",
        "Mã SKU",
        "Phân loại / Biến thể",
        "Phiên Flash Sale",
        "Khung giờ",
        "Ngày diễn ra",
        "Giá gốc (₫)",
        "Giá Flash Sale (₫)",
        "% Giảm",
        "SL mở bán",
        "Đã bán",
        "Tỷ lệ bán",
        "Trạng thái",
      ];

      const nowStr = new Date().toLocaleString("vi-VN");
      const aoa = [
        ["BÁO CÁO DANH SÁCH ĐĂNG KÝ FLASH SALE - GIAN HÀNG"],
        [`Thời gian xuất: ${nowStr} | Tổng số SKU: ${exportData.length}`],
        [], // Dòng trống phân cách
        headerTitles, // Hàng 4: Tiêu đề từng cột
        ...rows,
      ];

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Cấu hình độ rộng từng cột (wch) để mở trong Excel không bị che khuất
      ws["!cols"] = [
        { wch: 6 },  // STT
        { wch: 14 }, // Mã đăng ký
        { wch: 42 }, // Tên sản phẩm
        { wch: 22 }, // Mã SKU
        { wch: 28 }, // Phân loại / Biến thể
        { wch: 22 }, // Phiên Flash Sale
        { wch: 16 }, // Khung giờ
        { wch: 14 }, // Ngày diễn ra
        { wch: 16 }, // Giá gốc
        { wch: 18 }, // Giá Flash Sale
        { wch: 10 }, // % Giảm
        { wch: 12 }, // SL mở bán
        { wch: 10 }, // Đã bán
        { wch: 12 }, // Tỷ lệ bán
        { wch: 16 }, // Trạng thái
      ];

      // Gộp ô tiêu đề dòng 1 và dòng 2
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headerTitles.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headerTitles.length - 1 } },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách đăng ký");

      const dateFile = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `dang-ky-flash-sale-${dateFile}.xlsx`);

      toast.success(`Đã xuất báo cáo ${exportData.length} SKU Flash Sale ra file Excel thành công!`);
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      toast.error("Có lỗi xảy ra khi tạo file Excel.");
    }
  };

  const totalRegistrations = history.length;
  const approvedRegistrations = history.filter(
    (item) => item.status === "APPROVED"
  ).length;
  const approvalRate =
    totalRegistrations > 0
      ? ((approvedRegistrations / totalRegistrations) * 100).toFixed(1) + "%"
      : "100%";

  return (
    <div className="flex flex-col w-full relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-on-primary px-space-md py-3 rounded-xl shadow-xl flex items-center gap-space-sm border border-outline-variant/30 animate-bounce">
          <MaterialSymbol name="check_circle" size="[22px]" className="text-emerald-400" />
          <div>
            <div className="font-headline-md text-body-sm font-semibold">
              {toastMessage}
            </div>
            <div className="font-body-sm text-label-sm text-surface-variant">
              Theo dõi trạng thái tại tab &quot;Đăng ký của tôi&quot;.
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Banner Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-space-sm mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-tertiary-container/10 text-tertiary-container">
              <MaterialSymbol name="bolt" size="[18px]" fill />
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Chương trình Flash Sale
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-emerald-500/10 text-emerald-700 font-semibold border-0">
              Seller Portal UTC
            </span>
          </div>
          <p className="font-body-md text-body-md text-secondary">
            Đăng ký sản phẩm tham gia các khung giờ vàng Flash Sale toàn sàn để
            bùng nổ chuyển đổi và nhận hỗ trợ lưu lượng độc quyền từ Vibe Mart.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-sm rounded-xl shadow-sm self-start md:self-auto border border-outline-variant/30">
          <div className="flex items-center gap-space-sm px-space-sm py-1 border-r border-outline-variant/30">
            <MaterialSymbol name="verified" size="[20px]" className="text-emerald-600" />
            <div>
              <div className="font-label-sm text-label-sm text-secondary">
                Tỷ lệ duyệt
              </div>
              <div className="font-headline-md text-headline-md text-on-surface">
                {totalRegistrations > 0 ? approvalRate : "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm px-space-sm py-1">
            <MaterialSymbol
              name="inventory_2"
              size="[20px]"
              className="text-emerald-600"
            />
            <div>
              <div className="font-label-sm text-label-sm text-secondary">
                SKU đã nộp
              </div>
              <div className="font-headline-md text-headline-md text-on-surface">
                {totalRegistrations}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-space-sm border-b border-outline-variant/30 mb-space-lg">
        <button
          type="button"
          onClick={() => setActiveTab("open-slots")}
          className={`flex items-center gap-2 py-space-sm px-space-md font-label-md text-body-md transition-all ${
            activeTab === "open-slots"
              ? "text-emerald-700 border-b-2 border-emerald-500 font-semibold"
              : "text-secondary hover:text-on-surface border-b-2 border-transparent font-medium"
          }`}
        >
          <MaterialSymbol name="event_available" size="[18px]" />
          <span>Khung giờ đang mở đăng ký</span>
          <span className="px-2 py-0.5 rounded-full text-label-sm bg-emerald-50 text-emerald-700 font-bold">
            {slots.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("my-regs")}
          className={`flex items-center gap-2 py-space-sm px-space-md font-label-md text-body-md transition-all ${
            activeTab === "my-regs"
              ? "text-emerald-700 border-b-2 border-emerald-500 font-semibold"
              : "text-secondary hover:text-on-surface border-b-2 border-transparent font-medium"
          }`}
        >
          <MaterialSymbol name="history" size="[18px]" />
          <span>Đăng ký của tôi</span>
          <span className="px-2 py-0.5 rounded-full text-label-sm bg-surface-container-high text-secondary font-bold">
            {history.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Khung giờ đang mở đăng ký */}
      {activeTab === "open-slots" && (
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-headline-md text-body-lg text-on-surface font-semibold">
                Khung giờ mở bán mới nhất do Admin tạo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isRefreshing || isLoading}
                onClick={() => refreshData(false)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container-low transition-all font-body-md text-xs sm:text-body-sm shadow-sm border border-outline-variant/30 font-medium disabled:opacity-50 cursor-pointer"
                title="Đồng bộ & làm mới danh sách khung giờ"
              >
                <MaterialSymbol
                  name="sync"
                  size="[18px]"
                  className={isRefreshing ? "animate-spin text-emerald-600" : ""}
                />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((sk) => (
                <div
                  key={sk}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse flex flex-col xl:flex-row xl:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-5 bg-slate-100 rounded-lg w-1/3" />
                      <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                    </div>
                  </div>
                  <div className="w-36 h-11 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <p className="text-secondary text-body-md">
                Hiện chưa có khung giờ Flash Sale nào đang mở đăng ký.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-space-md">
              {slots.map((slot) => {
                const isHot = slot.badgeLabel === "HOT" || slot.title.includes("HOT");
                const isMyStoreJoined = history.some(
                  (h) => h.slotId === slot.id || h.slotTitle === slot.title
                );
                const displayStoresCount = Math.max(
                  slot.participatingStoresCount ?? 0,
                  isMyStoreJoined ? 1 : 0
                );
                const startDate = new Date(slot.startTime);
                const endDate = slot.endTime ? new Date(slot.endTime) : null;
                const startTimeStr = startDate.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endTimeStr = endDate
                  ? endDate.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;
                const dateStr = startDate.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                return (
                  <div
                    key={slot.id}
                    className="relative bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg border border-outline-variant/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-space-md flex-1">
                      <div
                        className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                          isHot
                            ? "bg-tertiary-container/10 text-tertiary-container"
                            : "bg-surface-container-low text-secondary"
                        }`}
                      >
                        <MaterialSymbol
                          name={isHot ? "bolt" : "nights_stay"}
                          size="[28px]"
                          fill={isHot}
                        />
                        <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">
                          {isHot ? "HOT" : "PHIÊN"}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                            {slot.title}
                          </span>
                          {isMyStoreJoined && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-300 shadow-2xs">
                              <MaterialSymbol name="check_circle" size="[14px]" className="text-emerald-600" />
                              Shop bạn đã tham gia
                            </span>
                          )}
                          {isHot && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold animate-pulse">
                              <MaterialSymbol name="schedule" size="[14px]" /> Hạn chót: Hôm nay
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-secondary font-body-sm text-body-sm mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <MaterialSymbol name="schedule" size="[18px]" className="text-emerald-600 shrink-0" />
                            <span>
                              Khung giờ:{" "}
                              <strong className="text-on-surface font-semibold">
                                {startTimeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MaterialSymbol name="calendar_today" size="[18px]" className="text-outline shrink-0" />
                            <span>
                              Ngày:{" "}
                              <strong className="text-on-surface font-semibold">
                                {dateStr}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MaterialSymbol
                              name="store"
                              size="[18px]"
                              className={cn(isMyStoreJoined ? "text-emerald-600" : "text-outline", "shrink-0")}
                            />
                            <span>
                              <strong className="text-on-surface font-semibold">
                                {displayStoresCount} shop
                              </strong>{" "}
                              đã tham gia
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-tertiary-container font-semibold">
                            <MaterialSymbol name="inventory_2" size="[18px]" className="shrink-0" />
                            <span>
                              {slot.availableProductSlots !== undefined && slot.availableProductSlots > 0
                                ? `Còn lại: ${slot.availableProductSlots} slot`
                                : "Đang mở nhận đăng ký"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-md justify-between xl:justify-end pt-space-sm xl:pt-0 border-t xl:border-0 border-outline-variant/20">
                      {/* Tiêu chuẩn đề xuất dạng Card Box chuyên nghiệp */}
                      <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-low/80 border border-outline-variant/30 text-left">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <MaterialSymbol name="verified" size="[18px]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[10px] text-secondary font-bold uppercase tracking-wider">
                            Tiêu chuẩn đề xuất
                          </span>
                          <div className="font-body-sm text-xs text-on-surface font-medium flex items-center gap-1.5">
                            <span className="text-emerald-700 font-bold">Giảm ≥ 20%</span>
                            <span className="text-outline/40">·</span>
                            <span className="text-secondary">Đề xuất trang chủ</span>
                          </div>
                        </div>
                      </div>

                      {isBanned ? (
                        <button
                          type="button"
                          onClick={() => toast.error("Gian hàng đang bị khóa, không đủ điều kiện đăng ký Flash Sale!")}
                          className="px-space-lg py-2.5 rounded-lg font-label-md text-body-md font-semibold flex items-center gap-2 bg-slate-200 text-slate-500 cursor-not-allowed opacity-80"
                          title="Gian hàng đang bị khóa"
                        >
                          <MaterialSymbol name="lock" size="[18px]" />
                          <span>Gian hàng bị khóa</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(slot)}
                          className={`px-space-lg py-2.5 rounded-lg font-label-md text-body-md font-semibold flex items-center gap-2 shadow-sm transition-all transform active:scale-95 ${
                            isHot
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                          }`}
                        >
                          <span>Đăng ký sản phẩm ngay</span>
                          <MaterialSymbol name="arrow_forward" size="[18px]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Đăng ký của tôi (Gom nhóm theo Sản phẩm SPU Matrix) */}
      {activeTab === "my-regs" && (
        <div className="flex flex-col gap-space-md bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden">
          {isRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-100/50 overflow-hidden z-20">
              <div className="h-full bg-emerald-600 animate-pulse w-full"></div>
            </div>
          )}
          {/* Header & Bộ lọc */}
          <div className="flex flex-col gap-4 pb-4 border-b border-outline-variant/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                    Lịch sử đăng ký Flash Sale của shop
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    {groupedHistory.length} sản phẩm ({filteredHistory.length} SKU)
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                  Theo dõi tiến độ duyệt, kiểm tra SKU và hủy đăng ký nhanh chóng trước giờ bắt đầu.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isRefreshing || isLoading}
                  onClick={() => refreshData(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container-low transition-all font-body-md text-xs sm:text-body-sm shadow-sm border border-outline-variant/30 font-medium disabled:opacity-50 cursor-pointer"
                  title="Đồng bộ & làm mới danh sách đăng ký Flash Sale"
                >
                  <MaterialSymbol
                    name="sync"
                    size="[18px]"
                    className={isRefreshing ? "animate-spin text-emerald-600" : ""}
                  />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportHistoryExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-body-md text-xs sm:text-body-sm shadow-xs border border-emerald-200 font-semibold cursor-pointer"
                  title="Xuất danh sách đăng ký Flash Sale ra file Excel (.xlsx) chuẩn từng cột"
                >
                  <MaterialSymbol name="file_download" size="[18px]" className="text-emerald-700" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* Thanh công cụ tìm kiếm và lọc */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 min-w-[240px]">
                <MaterialSymbol
                  name="search"
                  size="[18px]"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-outline shrink-0 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm, mã SKU, tên phiên..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface-container-low border border-outline-variant/30 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
                  >
                    <MaterialSymbol name="close" size="[16px]" />
                  </button>
                )}
              </div>

              {/* Lọc theo Trạng thái */}
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs font-medium">
                {[
                  { key: "ALL", label: "Tất cả" },
                  { key: "PENDING", label: "Chờ duyệt" },
                  { key: "APPROVED", label: "Đã duyệt" },
                  { key: "REJECTED", label: "Từ chối" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setHistoryStatusFilter(st.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-all font-semibold",
                      historyStatusFilter === st.key
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-secondary hover:text-on-surface"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Lọc theo Phiên Flash Sale */}
              {uniqueHistorySlots.length > 0 && (
                <div className="min-w-[160px]">
                  <select
                    value={historySlotFilter}
                    onChange={(e) => setHistorySlotFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="ALL">Tất cả phiên</option>
                    {uniqueHistorySlots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Bảng sản phẩm SPU & Biến thể */}
          {groupedHistory.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-low/40 rounded-2xl border border-outline-variant/30">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-3 text-secondary">
                <MaterialSymbol name="inventory_2" size="[28px]" />
              </div>
              <p className="text-on-surface font-semibold text-body-md">
                Không tìm thấy sản phẩm đăng ký nào
              </p>
              <p className="text-secondary text-body-sm mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider h-11 border-b border-outline-variant/30">
                    <th className="px-3 py-2 font-bold w-[340px]">Sản phẩm &amp; SPU</th>
                    <th className="px-3 py-2 font-bold">Khung giờ Flash Sale</th>
                    <th className="px-3 py-2 font-bold text-right">Giá Flash Sale</th>
                    <th className="px-3 py-2 font-bold text-center">SL Mở bán</th>
                    <th className="px-3 py-2 font-bold" style={{ minWidth: "160px" }}>
                      Tiến độ đã bán
                    </th>
                    <th className="px-3 py-2 font-bold text-center">Trạng thái</th>
                    {hasAnyCancelAction && (
                      <th className="px-3 py-2 font-bold text-right">Thao tác</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                  {groupedHistory.map((group) => {
                    const isExpanded = expandedProductKeys.has(group.groupKey);
                    const soldPercent =
                      group.totalAllocatedStock > 0
                        ? Math.round((group.totalSoldStock / group.totalAllocatedStock) * 100)
                        : 0;

                    const pendingSkus = group.skus.filter(
                      (s: any) => s.status === "PENDING" || s.status === "PENDING_APPROVAL"
                    );

                    return (
                      <React.Fragment key={group.groupKey}>
                        {/* Dòng chính đại diện cho Sản phẩm (SPU) */}
                        <tr className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl bg-surface-container-high flex-shrink-0 overflow-hidden border border-outline-variant/30">
                                <Image
                                  src={
                                    group.imageUrl ||
                                    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60"
                                  }
                                  alt={group.productName}
                                  fill
                                  unoptimized
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-headline-md text-body-md text-on-surface font-bold truncate max-w-[240px]">
                                  {group.productName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-bold">
                                    SPU #{group.productId || 11}
                                  </span>
                                  {/* Nút Xem SKU */}
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandProduct(group.groupKey)}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all border",
                                      isExpanded
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                                        : "bg-surface-container-low text-secondary hover:text-emerald-700 hover:bg-emerald-50/50 border-outline-variant/40"
                                    )}
                                  >
                                    <span>{isExpanded ? "Ẩn SKU" : "Xem SKU"}</span>
                                    <MaterialSymbol
                                      name={isExpanded ? "expand_less" : "expand_more"}
                                      size="[16px]"
                                    />
                                    <span className="ml-0.5 px-1 rounded-full bg-white text-[10px] font-bold text-slate-700 shadow-xs">
                                      {group.skus.length}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="font-headline-md text-body-sm text-on-surface font-bold">
                              {group.slotTitle}
                            </div>
                            <div className="text-label-sm text-secondary mt-0.5">
                              {group.slotTime} · {group.slotDate}
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-right font-headline-md font-bold text-tertiary">
                            {group.minFlashSalePrice === group.maxFlashSalePrice
                              ? `${formatVND(group.minFlashSalePrice)}₫`
                              : `${formatVND(group.minFlashSalePrice)}₫ – ${formatVND(group.maxFlashSalePrice)}₫`}
                          </td>

                          <td className="px-3 py-3.5 text-center font-bold text-on-surface">
                            {group.totalAllocatedStock} cái
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between font-label-sm text-[11px]">
                                <span className="text-tertiary font-bold">
                                  {group.totalSoldStock} / {group.totalAllocatedStock} đã bán
                                </span>
                                <span className="text-secondary font-bold">{soldPercent}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(soldPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-center">
                            {group.allPending ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-xs bg-amber-50 text-amber-700 font-bold border border-amber-200/60">
                                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                                Chờ duyệt
                              </span>
                            ) : group.allApproved ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-xs bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                                <MaterialSymbol name="check_circle" size="[14px]" className="mr-1" />
                                Đã duyệt
                              </span>
                            ) : group.anyRejected ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-xs bg-rose-50 text-rose-700 font-bold border border-rose-200/60">
                                <MaterialSymbol name="cancel" size="[14px]" className="mr-1" />
                                Bị từ chối
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-xs bg-surface-container text-secondary font-semibold">
                                Đang mở bán
                              </span>
                            )}
                          </td>

                          {hasAnyCancelAction && (
                            <td className="px-3 py-3.5 text-right">
                              {pendingSkus.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelAllPendingInProduct(group)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs active:scale-95"
                                  title="Hủy tất cả các biến thể đang chờ duyệt của sản phẩm này"
                                >
                                  <MaterialSymbol name="close" size="[14px]" />
                                  <span>Hủy</span>
                                </button>
                              )}
                            </td>
                          )}
                        </tr>

                        {/* Bảng con mở rộng (SKU Matrix) */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-outline-variant/30">
                            <td colSpan={hasAnyCancelAction ? 7 : 6} className="px-4 py-3">
                              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <MaterialSymbol name="subdirectory_arrow_right" size="[16px]" className="text-emerald-600" />
                                    <span className="font-bold text-slate-800">
                                      Danh sách biến thể phân loại (SKU Matrix)
                                    </span>
                                  </div>
                                  <span className="text-slate-500 font-medium">
                                    {group.skus.length} biến thể được cấu hình
                                  </span>
                                </div>

                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] h-8 border-b border-slate-200/60">
                                      <th className="px-2 py-1 font-bold">Mã SKU</th>
                                      <th className="px-2 py-1 font-bold">Phân loại / Biến thể</th>
                                      <th className="px-2 py-1 font-bold text-right">Giá gốc</th>
                                      <th className="px-2 py-1 font-bold text-right text-orange-600">Giá Flash Sale</th>
                                      <th className="px-2 py-1 font-bold text-center">% Giảm</th>
                                      <th className="px-2 py-1 font-bold text-center">SL Mở bán</th>
                                      <th className="px-2 py-1 font-bold text-center">Đã bán</th>
                                      <th className="px-2 py-1 font-bold text-center">Trạng thái</th>
                                      {pendingSkus.length > 0 && (
                                        <th className="px-2 py-1 font-bold text-right">Thao tác</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {group.skus.map((sku: any) => {
                                      const isPending = sku.status === "PENDING" || sku.status === "PENDING_APPROVAL";
                                      const discountPct = sku.originalPrice && sku.originalPrice > 0
                                        ? Math.round(((sku.originalPrice - sku.flashSalePrice) / sku.originalPrice) * 100)
                                        : 0;

                                      return (
                                        <tr key={sku.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-2 py-2 font-mono text-[11px] font-bold text-slate-700">
                                            {sku.sku}
                                          </td>
                                          <td className="px-2 py-2 text-slate-800 font-medium">
                                            {sku.variantName || sku.sku}
                                          </td>
                                          <td className="px-2 py-2 text-right text-slate-500 line-through">
                                            {formatVND(sku.originalPrice || sku.flashSalePrice)}₫
                                          </td>
                                          <td className="px-2 py-2 text-right font-bold text-orange-600">
                                            {formatVND(sku.flashSalePrice)}₫
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                              -{discountPct}%
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-center font-bold text-slate-800">
                                            {sku.allocatedStock}
                                          </td>
                                          <td className="px-2 py-2 text-center text-secondary font-medium">
                                            {sku.soldStock}
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            {sku.status === "APPROVED" && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold">
                                                Đã duyệt
                                              </span>
                                            )}
                                            {isPending && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 font-bold">
                                                Chờ duyệt
                                              </span>
                                            )}
                                            {sku.status === "REJECTED" && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-bold">
                                                Từ chối
                                              </span>
                                            )}
                                          </td>
                                          {pendingSkus.length > 0 && (
                                            <td className="px-2 py-2 text-right">
                                              {isPending && (
                                                <button
                                                  type="button"
                                                  disabled={cancellingId === sku.id}
                                                  onClick={() => handleRequestCancel(sku)}
                                                  className="inline-flex items-center gap-0.5 text-rose-600 hover:text-rose-800 font-bold text-xs hover:underline disabled:opacity-50"
                                                  title="Hủy SKU này"
                                                >
                                                  <MaterialSymbol name="close" size="[12px]" />
                                                  <span>Hủy</span>
                                                </button>
                                              )}
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 900px CENTERED MODAL DIALOG */}
      {isDrawerOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop mờ phủ toàn màn hình */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={handleCloseDrawer}
          />

          {/* Cửa sổ nổi chính giữa màn hình */}
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <MaterialSymbol name="bolt" size="[22px]" fill />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">
                    Đăng ký sản phẩm Flash Sale
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">Khung giờ:</span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                      {selectedSlot.title}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <MaterialSymbol name="close" size="[22px]" />
              </button>
            </div>

            {/* Error in Modal */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-150">
                <MaterialSymbol name="error" size="[20px]" className="text-rose-500 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Chọn sản phẩm */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Sản phẩm tham gia phiên
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingProduct(!isChangingProduct)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200/60"
                  >
                    {isChangingProduct ? "Đóng danh sách" : "Thay đổi sản phẩm"}
                  </button>
                </div>

                {/* Product Dropdown Selector */}
                {isChangingProduct && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2 max-h-52 overflow-y-auto shadow-inner">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider px-1">
                      Chọn sản phẩm từ kho hàng của bạn:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {sellerProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setIsLoadingDetail(true);
                            setSelectedProduct(p);
                            setIsChangingProduct(false);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                            selectedProduct?.id === p.id
                              ? "bg-emerald-100/90 text-emerald-950 font-bold border border-emerald-300"
                              : "hover:bg-white text-slate-700 bg-white/50 border border-transparent"
                          }`}
                        >
                          <span className="truncate pr-2">{p.name}</span>
                          <span className="text-slate-500 font-semibold flex-shrink-0">
                            {formatVND(p.minPrice)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Product Card */}
                {selectedProduct && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex-shrink-0 shadow-sm">
                        <Image
                          src={
                            selectedProduct.imageUrl ||
                            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60"
                          }
                          alt={selectedProduct.name}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-emerald-100 text-emerald-800 font-bold mb-1">
                          {selectedProduct.categoryName || "Thời trang"}
                        </div>
                        <h5 className="text-sm text-slate-900 font-bold truncate">
                          {selectedProduct.name}
                        </h5>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
                          <span>
                            Giá gốc:{" "}
                            <strong className="text-slate-800">
                              {formatVND(selectedProduct.minPrice)} – {formatVND(selectedProduct.maxPrice)}
                            </strong>
                          </span>
                          <span>
                            Tồn kho:{" "}
                            <strong className="text-emerald-700 font-bold">
                              {selectedProduct.totalStock} cái
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold">
                        <MaterialSymbol name="check_circle" size="[14px]" /> Đủ điều kiện
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Cấu hình giá và số lượng từng SKU */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Cấu hình giá &amp; số lượng từng biến thể SKU
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllSkus(true)}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllSkus(false)}
                      className="text-xs font-medium text-slate-500 hover:underline"
                    >
                      Bỏ chọn
                    </button>
                    <span className="text-xs text-slate-500 font-medium ml-2">
                      Đã chọn:{" "}
                      <strong className="text-emerald-700 font-bold">{selectedSkuCount}</strong>/
                      {productDetail?.variants?.length || 0} SKU
                    </span>
                  </div>
                </div>


                {/* Batch Setup Bar (Áp dụng hàng loạt cho SKU) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
                      <MaterialSymbol name="tune" size="[18px]" />
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">Thiết lập hàng loạt</div>
                      <div className="text-[11px] text-slate-500">Áp dụng cùng lúc cho các SKU đang chọn</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-slate-500 font-medium">Giảm:</span>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={batchDiscountPercent}
                        onChange={(e) => setBatchDiscountPercent(Number(e.target.value) || 0)}
                        className="w-10 text-center font-bold text-orange-600 focus:outline-none"
                      />
                      <span className="font-bold text-orange-600">%</span>
                    </div>

                    {/* Quick discount pills */}
                    <div className="hidden sm:flex items-center gap-1">
                      {[10, 15, 20, 30, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setBatchDiscountPercent(pct)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            batchDiscountPercent === pct
                              ? "bg-orange-500 text-white shadow-xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-slate-500 font-medium">SL:</span>
                      <input
                        type="number"
                        min={1}
                        value={batchAllocatedStock}
                        onChange={(e) => setBatchAllocatedStock(Number(e.target.value) || 0)}
                        className="w-12 text-center font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyBatchSetup}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-xs"
                      title="Áp dụng mức giảm và số lượng cho toàn bộ SKU đã tích chọn"
                    >
                      <MaterialSymbol name="done_all" size="[16px]" />
                      <span>Áp dụng tất cả</span>
                    </button>
                  </div>
                </div>

                {/* SKU Configuration Table */}
                {isLoadingDetail ? (
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse">
                    <div className="h-9 bg-slate-200/70 rounded-xl w-full" />
                    <div className="h-12 bg-slate-200/50 rounded-xl w-full" />
                    <div className="h-12 bg-slate-200/50 rounded-xl w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider h-10 border-b border-slate-200/80">
                          <th className="px-3 py-2 text-center w-10">Chọn</th>
                          <th className="px-3 py-2 font-bold">Phân loại SKU</th>
                          <th className="px-2 py-2 font-bold text-right">Giá gốc</th>
                          <th className="px-2 py-2 font-bold text-center">Tồn kho</th>
                          <th className="px-2 py-2 font-bold" style={{ width: "140px" }}>
                            Giá Flash Sale
                          </th>
                          <th className="px-2 py-2 font-bold text-center">% Giảm</th>
                          <th className="px-2 py-2 font-bold" style={{ width: "110px" }}>
                            SL mở bán
                          </th>
                          <th className="px-2 py-2 font-bold text-center" style={{ width: "90px" }}>
                            Hạn mức/khách
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productDetail?.variants?.map((v) => {
                          const cfg = skuConfigs[v.id] || {
                            selected: false,
                            flashSalePrice: v.originalPrice,
                            allocatedStock: 0,
                            userPurchaseLimit: 1,
                          };

                          const discountPercent =
                            v.originalPrice > 0
                              ? Math.round(
                                  ((v.originalPrice - cfg.flashSalePrice) / v.originalPrice) * 100
                                )
                              : 0;

                          const isOutOfStock = v.stockQuantity <= 0;

                          return (
                            <tr
                              key={v.id}
                              className={`transition-colors ${
                                isOutOfStock
                                  ? "bg-slate-50/70 text-slate-400"
                                  : "hover:bg-slate-50/60"
                              }`}
                            >
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={cfg.selected && !isOutOfStock}
                                  disabled={isOutOfStock}
                                  onChange={() => handleToggleSku(v.id)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                />
                              </td>

                              <td className="px-3 py-3 font-medium text-slate-900">
                                <div className="font-bold text-slate-800">
                                  {Object.values(v.attributes || {}).join(" / ") || v.sku || v.skuCode || `SKU #${v.id}`}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{v.sku || v.skuCode || `SKU #${v.id}`}</div>
                              </td>

                              <td className="px-2 py-3 text-right text-slate-500 font-medium">
                                {formatVND(v.originalPrice)}
                              </td>

                              <td className="px-2 py-3 text-center">
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`font-bold ${
                                      isOutOfStock ? "text-rose-500" : "text-slate-800"
                                    }`}
                                  >
                                    {v.stockQuantity}
                                  </span>
                                  {!isOutOfStock && (
                                    <span
                                      className="text-[10px] font-medium text-emerald-700"
                                      title="Tồn kho thực tế giữ nguyên, chỉ trừ khi khách đặt mua thành công"
                                    >
                                      Thực tế: {v.stockQuantity}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-2 py-3">
                                {isOutOfStock ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={cfg.flashSalePrice}
                                      onChange={(e) =>
                                        handleSkuPriceChange(v.id, Number(e.target.value) || 0)
                                      }
                                      className="w-full h-8 pl-2 pr-5 text-right font-bold text-orange-600 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">
                                      ₫
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="px-2 py-3 text-center">
                                {isOutOfStock ? (
                                  <span className="text-slate-300 font-medium">--</span>
                                ) : (
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                                      discountPercent >= 20
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    -{discountPercent}%
                                  </span>
                                )}
                              </td>

                              <td className="px-2 py-3">
                                {isOutOfStock ? (
                                  <span className="inline-block w-full text-center text-xs text-rose-600 font-semibold bg-rose-50 py-1 rounded-lg">
                                    Hết hàng
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={v.stockQuantity}
                                      value={cfg.allocatedStock}
                                      onChange={(e) =>
                                        handleSkuStockChange(v.id, Number(e.target.value) || 0)
                                      }
                                      className={`w-full h-8 px-2 text-center font-bold rounded-lg border transition-colors focus:outline-none ${
                                        cfg.allocatedStock > v.stockQuantity
                                          ? "border-rose-500 text-rose-600 bg-rose-50/50"
                                          : "border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      title="Chọn toàn bộ số lượng tồn kho còn lại"
                                      onClick={() => handleSkuStockChange(v.id, v.stockQuantity)}
                                      className="px-1.5 py-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                                    >
                                      Max
                                    </button>
                                  </div>
                                )}
                              </td>

                              <td className="px-2 py-3 text-center">
                                {isOutOfStock ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={cfg.userPurchaseLimit}
                                    onChange={(e) =>
                                      handleSkuLimitChange(v.id, Number(e.target.value) || 1)
                                    }
                                    className="w-12 h-8 mx-auto px-1 text-center font-bold text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Technical Note */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 flex items-start gap-3 shadow-xs">
                <MaterialSymbol name="verified_user" size="[22px]" className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h6 className="font-bold text-amber-950">
                    Cơ chế khóa tồn kho tự động &amp; Bảo vệ đơn hàng
                  </h6>
                  <p className="leading-relaxed text-amber-800">
                    Khi đơn đăng ký được duyệt, số lượng mở bán (
                    <strong className="font-bold text-amber-950">{totalAllocatedStock} sản phẩm</strong>
                    ) sẽ được tạm khóa khỏi kho gốc để đảm bảo không bị bán trùng lặp trong thời gian diễn ra Flash Sale.
                    Toàn bộ hàng chưa bán hết sẽ tự động hoàn trả về kho gốc ngay khi phiên kết thúc.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="bg-slate-50 border-t border-slate-100 flex flex-col flex-shrink-0">
              {errorMessage && (
                <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200/80 text-rose-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                  <MaterialSymbol name="error" size="[18px]" className="text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-xs text-slate-500 font-medium">
                    Tổng sản phẩm đề xuất
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {selectedSkuCount} SKU ·{" "}
                    <span className="text-emerald-700 font-extrabold">
                      {totalAllocatedStock} chiếc
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || selectedSkuCount === 0 || isBanned}
                    onClick={handleSubmitRegistration}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      isBanned
                        ? "Gian hàng đang bị khóa, không thể nộp đăng ký Flash Sale"
                        : selectedSkuCount === 0
                        ? "Vui lòng chọn ít nhất 1 SKU có số lượng mở bán > 0"
                        : undefined
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang nộp...</span>
                      </>
                    ) : isBanned ? (
                      <>
                        <MaterialSymbol name="lock" size="[16px]" />
                        <span>Gian hàng bị khóa</span>
                      </>
                    ) : (
                      <>
                        <MaterialSymbol name="send" size="[16px]" />
                        <span>Gửi {selectedSkuCount} SKU phê duyệt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY ĐĂNG KÝ FLASH SALE (Đồng nhất UI không dùng alert/confirm) */}
      {cancelTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!cancellingId) setCancelTargetItem(null);
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <MaterialSymbol name="warning" size="[28px]" />
            </div>

            <h3 className="font-title-lg font-bold text-slate-900 mb-2">
              Hủy đơn đăng ký Flash Sale?
            </h3>

            <p className="font-body-md text-slate-600 mb-4">
              Bạn có chắc chắn muốn hủy đơn đăng ký cho sản phẩm{" "}
              <strong className="text-slate-900">{cancelTargetItem.productName}</strong> ({cancelTargetItem.sku}) thuộc phiên{" "}
              <strong className="text-slate-900">{cancelTargetItem.slotTitle}</strong> không?
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-6 flex items-start gap-2">
              <MaterialSymbol name="info" size="[18px]" className="shrink-0 mt-0.5" />
              <span>
                Thao tác này sẽ hủy yêu cầu đăng ký tham gia Flash Sale của bạn. Bạn vẫn có thể đăng ký lại nếu khung giờ này còn mở.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={() => setCancelTargetItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Giữ lại
              </button>
              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
              >
                {cancellingId ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang hủy...</span>
                  </>
                ) : (
                  <>
                    <MaterialSymbol name="delete" size="[16px]" />
                    <span>Xác nhận hủy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
