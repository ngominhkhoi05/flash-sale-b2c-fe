"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND } from "@/lib/utils";
import {
  getFlashSaleSlots,
  getRegisteredFlashSaleHistory,
  getSellerProducts,
  getSellerProductDetail,
  registerFlashSaleItems,
} from "@/lib/api/seller";
import type {
  FlashSaleSlotItem,
  RegisteredFlashSaleHistoryItem,
  SellerProductSummaryResponse,
  SellerProductDetailResponse,
  RegisterFlashSaleItemDto,
} from "@/types/seller";

export function FlashSaleRegisterClient() {
  const [activeTab, setActiveTab] = useState<"open-slots" | "my-regs">("open-slots");
  const [slots, setSlots] = useState<FlashSaleSlotItem[]>([]);
  const [history, setHistory] = useState<RegisteredFlashSaleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // When selectedProduct changes, fetch its full details (including SKU variants)
  useEffect(() => {
    if (!selectedProduct) return;
    let isMounted = true;

    getSellerProductDetail(selectedProduct.id)
      .then((detail) => {
        if (!isMounted) return;
        setProductDetail(detail);

        // Populate initial SKU configuration with 30% discount recommendation
        const initialMap: typeof skuConfigs = {};
        detail.variants.forEach((v) => {
          const discountPrice = Math.round((v.originalPrice * 0.7) / 1000) * 1000;
          const maxStock = Math.min(v.stockQuantity, 30);
          initialMap[v.id] = {
            selected: v.stockQuantity > 0,
            flashSalePrice: discountPrice > 0 ? discountPrice : v.originalPrice,
            allocatedStock: maxStock > 0 ? maxStock : 0,
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
    setSelectedSlot(slot);
    setIsDrawerOpen(true);
    setErrorMessage(null);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setIsChangingProduct(false);
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

  // Field change handlers
  const handleSkuPriceChange = (variantId: number, val: number) => {
    setSkuConfigs((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        flashSalePrice: val,
      },
    }));
  };

  const handleSkuStockChange = (variantId: number, val: number) => {
    setSkuConfigs((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        allocatedStock: val,
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
      if (cfg && cfg.selected && cfg.allocatedStock > 0) {
        if (cfg.flashSalePrice <= 0) {
          setErrorMessage(`Giá bán Flash Sale của SKU [${v.skuCode}] phải lớn hơn 0.`);
          return;
        }
        if (cfg.flashSalePrice >= v.originalPrice) {
          setErrorMessage(
            `Giá bán Flash Sale của SKU [${v.skuCode}] phải thấp hơn giá gốc (${formatVND(v.originalPrice)}₫).`
          );
          return;
        }
        if (cfg.allocatedStock > v.stockQuantity) {
          setErrorMessage(
            `Số lượng mở bán của SKU [${v.skuCode}] (${cfg.allocatedStock}) vượt quá tồn kho thực tế (${v.stockQuantity}).`
          );
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
      setErrorMessage("Vui lòng chọn ít nhất 1 biến thể SKU có số lượng mở bán > 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerFlashSaleItems(itemsToRegister);
      setIsDrawerOpen(false);
      setToastMessage("Gửi yêu cầu đăng ký thành công! Admin Vibe Mart sẽ duyệt sản phẩm trong vòng 2 giờ.");
      setTimeout(() => setToastMessage(null), 5000);

      // Refresh registered list
      getRegisteredFlashSaleHistory().then(setHistory);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj?.message || "Có lỗi xảy ra khi nộp đăng ký Flash Sale.");
    } finally {
      setIsSubmitting(false);
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
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary hover:text-on-surface text-body-sm font-medium flex items-center gap-1.5"
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
                        {formatVND(item.flashSalePrice)}₫
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
                        <button
                          type="button"
                          className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-container rounded-lg"
                        >
                          <MaterialSymbol name="more_vert" size="[18px]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 720px SLIDE-OVER DRAWER */}
      {isDrawerOpen && selectedSlot && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs z-50 transition-opacity flex justify-end">
          <div className="w-full max-w-[720px] h-full bg-surface-container-lowest shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="p-space-lg bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-lg bg-tertiary-container/10 text-tertiary-container flex items-center justify-center">
                  <MaterialSymbol name="bolt" size="[20px]" fill />
                </div>
                <div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold leading-tight">
                    Đăng ký sản phẩm Flash Sale
                  </h3>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Khung giờ:{" "}
                    <strong className="text-tertiary-container">
                      {selectedSlot.title}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-9 h-9 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
              >
                <MaterialSymbol name="close" size="[22px]" />
              </button>
            </div>

            {/* Error in Drawer */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-error flex items-center gap-2 text-body-sm">
                <MaterialSymbol name="error" size="[18px]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-space-lg space-y-space-lg">
              {/* Step 1: Chọn sản phẩm */}
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-label-sm text-label-sm font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
                      Sản phẩm tham gia phiên
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingProduct(!isChangingProduct)}
                    className="px-2.5 py-1 text-label-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    {isChangingProduct ? "Đóng danh sách" : "Thay đổi sản phẩm"}
                  </button>
                </div>

                {/* Product Dropdown Selector */}
                {isChangingProduct && (
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-2 max-h-48 overflow-y-auto">
                    <p className="font-label-sm text-secondary uppercase font-semibold">
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
                          className={`flex items-center justify-between p-2 rounded-lg text-left text-body-sm transition-colors ${
                            selectedProduct?.id === p.id
                              ? "bg-emerald-100/80 text-emerald-900 font-semibold"
                              : "hover:bg-surface-container-lowest text-on-surface"
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="font-data-tabular text-secondary text-[12px] flex-shrink-0 ml-2">
                            {formatVND(p.minPrice)}₫
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Product Card */}
                {selectedProduct && (
                  <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="relative w-16 h-16 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 shadow-sm">
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
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold mb-1">
                          {selectedProduct.categoryName || "Thời trang"}
                        </div>
                        <h5 className="font-headline-md text-body-md text-on-surface font-bold truncate">
                          {selectedProduct.name}
                        </h5>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-label-sm text-secondary mt-0.5">
                          <span>
                            Giá gốc:{" "}
                            <strong className="text-on-surface">
                              {formatVND(selectedProduct.minPrice)}₫ – {formatVND(selectedProduct.maxPrice)}₫
                            </strong>
                          </span>
                          <span>
                            Tồn kho:{" "}
                            <strong className="text-emerald-700">
                              {selectedProduct.totalStock} cái
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-label-sm font-semibold">
                        <MaterialSymbol name="check_circle" size="[14px]" /> Đủ điều kiện
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Cấu hình giá và số lượng từng SKU */}
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-label-sm text-label-sm font-bold flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
                      Cấu hình giá &amp; số lượng từng SKU
                    </h4>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    Đã chọn:{" "}
                    <strong className="text-emerald-700">{selectedSkuCount}</strong>/
                    {productDetail?.variants?.length || 0} SKU
                  </span>
                </div>

                <div className="p-space-sm rounded-lg bg-surface-container flex items-center gap-space-sm text-secondary font-body-sm text-body-sm">
                  <MaterialSymbol name="info" size="[18px]" className="text-tertiary-container" />
                  <span>
                    Quy chuẩn phiên: <strong className="text-on-surface">Giảm tối thiểu 10%</strong>{" "}
                    so với giá niêm yết · Số lượng mở bán tối đa không vượt tồn kho thực tế.
                  </span>
                </div>

                {/* SKU Configuration Table */}
                {isLoadingDetail ? (
                  <div className="py-8 text-center text-secondary text-body-sm">
                    Đang tải danh sách biến thể SKU...
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
                    <table className="w-full text-left border-collapse text-body-sm">
                      <thead>
                        <tr className="bg-surface-container-low text-secondary font-label-sm text-[11px] uppercase tracking-wider h-10 border-b border-outline-variant/30">
                          <th className="px-3 py-2 text-center w-10">Chọn</th>
                          <th className="px-3 py-2 font-semibold">Phân loại SKU</th>
                          <th className="px-2 py-2 font-semibold text-right">Giá gốc</th>
                          <th className="px-2 py-2 font-semibold text-center">Tồn</th>
                          <th className="px-2 py-2 font-semibold" style={{ width: "130px" }}>
                            Giá Flash Sale
                          </th>
                          <th className="px-2 py-2 font-semibold text-center">% Giảm</th>
                          <th className="px-2 py-2 font-semibold" style={{ width: "100px" }}>
                            SL mở bán
                          </th>
                          <th className="px-2 py-2 font-semibold text-center" style={{ width: "80px" }}>
                            Hạn mức/khách
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
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
                                  ? "bg-surface-container-low/60 text-outline"
                                  : "hover:bg-surface-container-low/40"
                              }`}
                            >
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={cfg.selected && !isOutOfStock}
                                  disabled={isOutOfStock}
                                  onChange={() => handleToggleSku(v.id)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-outline-variant"
                                />
                              </td>

                              <td className="px-3 py-3 font-medium text-on-surface">
                                <div className="font-semibold text-body-sm">
                                  {Object.values(v.attributes || {}).join(" / ") || v.skuCode}
                                </div>
                                <div className="text-[11px] text-secondary">{v.skuCode}</div>
                              </td>

                              <td className="px-2 py-3 text-right text-secondary">
                                {formatVND(v.originalPrice)}₫
                              </td>

                              <td
                                className={`px-2 py-3 text-center font-bold ${
                                  isOutOfStock ? "text-red-500" : "text-on-surface"
                                }`}
                              >
                                {v.stockQuantity}
                              </td>

                              <td className="px-2 py-3">
                                {isOutOfStock ? (
                                  <span className="text-secondary">--</span>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={cfg.flashSalePrice}
                                      onChange={(e) =>
                                        handleSkuPriceChange(v.id, Number(e.target.value) || 0)
                                      }
                                      className="w-full h-8 pl-2 pr-5 text-right font-headline-md text-body-sm text-tertiary-container font-bold rounded-lg border border-outline-variant/50 focus:border-emerald-500 focus:outline-none"
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-secondary">
                                      ₫
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="px-2 py-3 text-center">
                                {isOutOfStock ? (
                                  <span className="text-[11px] text-outline font-medium">--</span>
                                ) : (
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-label-sm text-[11px] font-bold ${
                                      discountPercent >= 20
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    -{discountPercent}%
                                  </span>
                                )}
                              </td>

                              <td className="px-2 py-3">
                                {isOutOfStock ? (
                                  <span className="inline-block w-full text-center text-label-sm text-red-600 font-semibold bg-red-50 py-1 rounded">
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
                                    className="w-full h-8 px-2 text-center font-semibold text-body-sm rounded-lg border border-outline-variant/50 focus:border-emerald-500 focus:outline-none"
                                  />
                                )}
                              </td>

                              <td className="px-2 py-3 text-center">
                                {isOutOfStock ? (
                                  <span className="text-secondary">--</span>
                                ) : (
                                  <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={cfg.userPurchaseLimit}
                                    onChange={(e) =>
                                      handleSkuLimitChange(v.id, Number(e.target.value) || 1)
                                    }
                                    className="w-12 h-8 mx-auto px-1 text-center font-medium text-body-sm rounded-lg border border-outline-variant/50 focus:border-emerald-500 focus:outline-none"
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
              <div className="p-space-md rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-space-sm shadow-xs">
                <MaterialSymbol name="warning" size="[22px]" className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h6 className="font-headline-md text-body-sm font-bold text-amber-950">
                    Cơ chế khóa tồn kho tự động &amp; Bảo vệ đơn hàng
                  </h6>
                  <p className="font-body-sm text-label-sm leading-relaxed text-amber-800">
                    Khi đơn đăng ký được duyệt, số lượng mở bán (
                    <strong className="font-bold text-amber-950">{totalAllocatedStock} sản phẩm</strong>
                    ) sẽ được tạm khóa khỏi kho gốc để đảm bảo không bị bán trùng lặp trong thời gian diễn ra Flash Sale.
                    Toàn bộ hàng chưa bán hết sẽ tự động hoàn trả về kho gốc ngay khi phiên kết thúc.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="p-space-lg bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between flex-shrink-0">
              <div className="flex flex-col">
                <div className="font-label-sm text-label-sm text-secondary">
                  Tổng sản phẩm đề xuất
                </div>
                <div className="font-headline-md text-headline-md text-on-surface">
                  {selectedSkuCount} SKU ·{" "}
                  <span className="text-tertiary-container font-bold">
                    {totalAllocatedStock} chiếc
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-space-md py-2.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-label-md text-body-md transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || selectedSkuCount === 0}
                  onClick={handleSubmitRegistration}
                  className="px-space-lg py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-body-md font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang nộp...</span>
                    </>
                  ) : (
                    <>
                      <MaterialSymbol name="send" size="[18px]" />
                      <span>Gửi {selectedSkuCount} SKU phê duyệt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
