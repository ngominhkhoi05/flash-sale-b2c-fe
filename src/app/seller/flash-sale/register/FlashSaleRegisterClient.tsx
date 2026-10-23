"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND } from "@/lib/utils";
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

export function FlashSaleRegisterClient() {
  const { isBanned } = useMyStore();
  const [activeTab, setActiveTab] = useState<"open-slots" | "my-regs">("open-slots");
  const [slots, setSlots] = useState<FlashSaleSlotItem[]>([]);
  const [history, setHistory] = useState<RegisteredFlashSaleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelTargetItem, setCancelTargetItem] = useState<RegisteredFlashSaleHistoryItem | null>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FlashSaleSlotItem | null>(null);

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
      if (slotsRes.status === "fulfilled") setSlots(slotsRes.value);
      if (histRes.status === "fulfilled") setHistory(histRes.value);
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
    setSkuConfigs((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        allocatedStock: val,
        selected: val > 0,
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

    let updatedCount = 0;
    setSkuConfigs((prev) => {
      const next = { ...prev };
      productDetail.variants.forEach((v) => {
        if (next[v.id]?.selected && v.stockQuantity > 0) {
          updatedCount++;
          const discountRate = (100 - discount) / 100;
          const calculatedPrice = Math.round((v.originalPrice * discountRate) / 1000) * 1000;
          const safePrice =
            calculatedPrice > 0 && calculatedPrice < v.originalPrice
              ? calculatedPrice
              : Math.max(1, v.originalPrice - 1000);

          const safeStock = Math.min(v.stockQuantity, targetStock);

          next[v.id] = {
            ...next[v.id],
            flashSalePrice: safePrice,
            allocatedStock: safeStock,
            userPurchaseLimit: targetLimit,
          };
        }
      });
      return next;
    });

    if (updatedCount > 0) {
      toast.success(`Đã áp dụng giảm ${discount}% và SL ${targetStock} cho ${updatedCount} SKU đã chọn!`);
    } else {
      toast.error("Vui lòng tích chọn ít nhất 1 SKU còn hàng để áp dụng!");
    }
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
      
      // Tạo optimistic items để thêm ngay vào đầu danh sách
      const newItems: RegisteredFlashSaleHistoryItem[] = itemsToRegister.map((it, idx) => {
        const v = productDetail.variants.find((variant) => variant.id === it.variantId);
        return {
          id: Date.now() + idx,
          productName: productDetail.name,
          sku: v?.sku || v?.skuCode || `SKU-${it.variantId}`,
          imageUrl:
            (typeof productDetail.images?.[0] === "string"
              ? productDetail.images[0]
              : productDetail.images?.[0]?.url) ||
            selectedProduct?.imageUrl ||
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
          slotTitle: selectedSlot.title,
          slotDate: new Date(selectedSlot.startTime).toLocaleDateString("vi-VN"),
          slotTime: `${new Date(selectedSlot.startTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })} – ${new Date(selectedSlot.endTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          flashSalePrice: it.flashSalePrice,
          allocatedStock: it.allocatedStock,
          soldStock: 0,
          status: "PENDING",
        };
      });

      // Lưu các đơn vừa đăng ký vào sessionStorage để luôn tồn tại trên UI
      try {
        if (typeof window !== "undefined") {
          const currentSaved: RegisteredFlashSaleHistoryItem[] = JSON.parse(
            window.sessionStorage.getItem("fs_local_registered_items") || "[]"
          );
          window.sessionStorage.setItem(
            "fs_local_registered_items",
            JSON.stringify([...newItems, ...currentSaved])
          );
        }
      } catch {
        // ignore
      }

      setHistory((prev) => {
        const existingIds = new Set(prev.map((it) => it.id));
        const uniqueNew = newItems.filter((it) => !existingIds.has(it.id));
        return [...uniqueNew, ...prev];
      });

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
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj?.message || "Không thể hủy đăng ký lúc này. Vui lòng thử lại sau.");
    } finally {
      setCancellingId(null);
    }
  };

  // Xuất báo cáo lịch sử đăng ký Flash Sale ra file CSV
  const handleExportHistoryCsv = () => {
    try {
      if (!history || history.length === 0) {
        setErrorMessage("Chưa có dữ liệu đăng ký để xuất báo cáo.");
        return;
      }
      const bom = "\uFEFF";
      const headers = [
        "Mã đăng ký",
        "Tên sản phẩm",
        "Mã SKU",
        "Phiên Flash Sale",
        "Khung giờ",
        "Giá sale",
        "Số lượng mở bán",
        "Đã bán",
        "Tỷ lệ bán (%)",
        "Trạng thái",
      ];
      const rows = history.map((item: RegisteredFlashSaleHistoryItem) => {
        const percent =
          item.allocatedStock > 0
            ? Math.round((item.soldStock / item.allocatedStock) * 100)
            : 0;
        return [
          `"${item.id}"`,
          `"${(item.productName || "").replace(/"/g, '""')}"`,
          `"${(item.sku || "").replace(/"/g, '""')}"`,
          `"${(item.slotTitle || "").replace(/"/g, '""')}"`,
          `"${item.slotTime || ""}"`,
          `"${item.flashSalePrice}"`,
          `"${item.allocatedStock}"`,
          `"${item.soldStock}"`,
          `"${percent}%"`,
          `"${item.status}"`,
        ];
      });

      const csvContent = `${bom}${headers.join(",")}\n${rows
        .map((r: string[]) => r.join(","))
        .join("\n")}`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", url);
      link.setAttribute("download", `lich-su-flash-sale-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage(
        `Đã xuất báo cáo ${history.length} sản phẩm Flash Sale thành công!`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setErrorMessage("Có lỗi xảy ra khi xuất báo cáo.");
    }
  };

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
                94.2%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm px-space-sm py-1">
            <MaterialSymbol
              name="local_fire_department"
              size="[20px]"
              className="text-tertiary-container"
            />
            <div>
              <div className="font-label-sm text-label-sm text-secondary">
                Lượt xem kỳ này
              </div>
              <div className="font-headline-md text-headline-md text-tertiary-container">
                320.5K
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-headline-md text-body-lg text-on-surface font-semibold">
                Khung giờ mở bán mới nhất do Admin tạo
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary">
              Thời gian cập nhật gần nhất: Vừa xong
            </span>
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
                          {isHot && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold animate-pulse">
                              <MaterialSymbol name="schedule" size="[14px]" /> Hạn chót: Hôm nay
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-secondary font-body-sm text-body-sm mt-1">
                          <div className="flex items-center gap-1.5">
                            <MaterialSymbol name="calendar_today" size="[18px]" className="text-outline" />
                            <span>
                              Bắt đầu:{" "}
                              <strong className="text-on-surface">
                                {new Date(slot.startTime).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MaterialSymbol name="store" size="[18px]" className="text-outline" />
                            <span>
                              <strong className="text-on-surface font-semibold">
                                {slot.participatingStoresCount || 32} shop
                              </strong>{" "}
                              đã tham gia
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-tertiary-container font-semibold">
                            <MaterialSymbol name="inventory_2" size="[18px]" />
                            <span>
                              Còn lại: {slot.availableProductSlots || 50} slot sản phẩm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-md justify-between xl:justify-end pt-space-sm xl:pt-0 border-t xl:border-0 border-outline-variant/20">
                      <div className="text-left xl:text-right hidden sm:block">
                        <div className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                          Tiêu chuẩn đề xuất
                        </div>
                        <div className="font-body-sm text-label-sm text-emerald-700 font-medium">
                          Giảm ≥ 20% · Miễn phí đề xuất trang chủ
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

      {/* Tab 2: Đăng ký của tôi */}
      {activeTab === "my-regs" && (
        <div className="flex flex-col gap-space-md bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/30">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Lịch sử đăng ký của shop
              </h2>
              <p className="font-body-sm text-body-sm text-secondary">
                Theo dõi tiến độ duyệt, hiệu suất bán và tự động khóa/mở kho hàng Flash Sale.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary hover:text-on-surface text-body-sm font-medium flex items-center gap-1.5"
              >
                <MaterialSymbol name="filter_list" size="[16px]" />
                <span>Lọc theo phiên</span>
              </button>
              <button
                type="button"
                onClick={handleExportHistoryCsv}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary hover:text-on-surface text-body-sm font-medium flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <MaterialSymbol name="file_download" size="[16px]" />
                <span>Xuất báo cáo</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider h-11 border-b border-outline-variant/30">
                  <th className="px-space-md font-semibold">Sản phẩm &amp; SKU</th>
                  <th className="px-space-md font-semibold">Khung giờ Flash Sale</th>
                  <th className="px-space-md font-semibold text-right">Giá sale</th>
                  <th className="px-space-md font-semibold text-center">Mở bán</th>
                  <th className="px-space-md font-semibold" style={{ minWidth: "200px" }}>
                    Tiến độ đã bán
                  </th>
                  <th className="px-space-md font-semibold text-center">Trạng thái</th>
                  <th className="px-space-md font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                {history.map((item) => {
                  const percent =
                    item.allocatedStock > 0
                      ? Math.round((item.soldStock / item.allocatedStock) * 100)
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-space-md py-3.5">
                        <div className="flex items-center gap-space-sm">
                          <div className="relative w-10 h-10 rounded-lg bg-surface-container-high flex-shrink-0 overflow-hidden">
                            <Image
                              src={item.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60"}
                              alt={item.productName}
                              fill
                              unoptimized
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-headline-md text-body-md text-on-surface font-semibold truncate max-w-[220px]">
                              {item.productName}
                            </div>
                            <div className="font-body-sm text-label-sm text-secondary">
                              SKU: {item.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-space-md py-3.5">
                        <div className="font-headline-md text-body-sm text-on-surface">
                          {item.slotTitle}
                        </div>
                        <div className="text-label-sm text-secondary">{item.slotDate}</div>
                      </td>

                      <td className="px-space-md py-3.5 text-right font-headline-md font-bold text-tertiary">
                        {formatVND(item.flashSalePrice)}
                      </td>

                      <td className="px-space-md py-3.5 text-center font-semibold text-on-surface">
                        {item.allocatedStock}
                      </td>

                      <td className="px-space-md py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between font-label-sm text-label-sm">
                            <span className="text-tertiary font-semibold">
                              {item.soldStock} / {item.allocatedStock} đã bán
                            </span>
                            <span className="text-secondary font-bold">{percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-space-md py-3.5 text-center">
                        {item.status === "APPROVED" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-emerald-50 text-emerald-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            Đã duyệt
                          </span>
                        )}
                        {item.status === "PENDING" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-amber-50 text-amber-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                            Chờ duyệt
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <div className="relative group inline-block">
                            <span className="cursor-help inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-red-50 text-red-600 font-semibold">
                              <MaterialSymbol name="cancel" size="[14px]" />
                              Từ chối
                            </span>
                            {item.rejectReason && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 p-2 bg-on-surface text-on-primary font-body-sm text-label-sm rounded-lg shadow-lg z-20 text-center">
                                {item.rejectReason}
                              </div>
                            )}
                          </div>
                        )}
                        {item.status === "ENDED" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-secondary font-medium">
                            Đã kết thúc
                          </span>
                        )}
                      </td>

                      <td className="px-space-md py-3.5 text-right">
                        {item.status === "PENDING" ? (
                          <button
                            type="button"
                            disabled={cancellingId === item.id}
                            onClick={() => handleRequestCancel(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Hủy đơn đăng ký đang chờ duyệt"
                          >
                            <MaterialSymbol name="close" size="[14px]" />
                            <span>Hủy</span>
                          </button>
                        ) : (
                          <span className="text-secondary text-xs">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 flex items-center gap-2.5 text-amber-900 text-xs">
                  <MaterialSymbol name="info" size="[18px]" className="text-amber-600 flex-shrink-0" />
                  <span>
                    Quy chuẩn phiên: <strong className="font-bold">Giảm tối thiểu 10%</strong>{" "}
                    so với giá niêm yết · Số lượng mở bán tối đa không vượt tồn kho thực tế.
                  </span>
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

                              <td
                                className={`px-2 py-3 text-center font-bold ${
                                  isOutOfStock ? "text-rose-500" : "text-slate-800"
                                }`}
                              >
                                {v.stockQuantity}
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
                                  <input
                                    type="number"
                                    value={cfg.allocatedStock}
                                    max={v.stockQuantity}
                                    onChange={(e) =>
                                      handleSkuStockChange(v.id, Number(e.target.value) || 0)
                                    }
                                    className="w-full h-8 px-2 text-center font-bold text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                  />
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
