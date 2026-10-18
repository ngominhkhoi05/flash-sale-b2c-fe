"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { formatVND } from "@/lib/utils";
import {
  getSellerProducts,
  getSellerProductDetail,
  updateProductStatus,
  deleteProduct,
} from "@/lib/api/seller";
import type { PageResponse } from "@/types/api";
import type {
  SellerProductSummaryResponse,
  SellerProductDetailResponse,
} from "@/types/seller";

type ProductTab = "ALL" | "ACTIVE" | "OUT_OF_STOCK" | "INACTIVE" | "BANNED";

/**
 * Màn hình 21: Danh sách sản phẩm của Shop – Chuẩn thiết kế Google Stitch.
 * Gắn API thật:
 *  - GET /api/v1/seller/products (Danh sách SPU phân trang & lọc)
 *  - GET /api/v1/seller/products/{id} (Chi tiết biến thể SKU khi expand row)
 *  - PATCH /api/v1/seller/products/{id}/status (Bật / Tắt trạng thái)
 *  - DELETE /api/v1/seller/products/{id} (Xóa sản phẩm)
 */
export default function SellerProductsPage() {
  const [activeTab, setActiveTab] = useState<ProductTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockSort, setStockSort] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [pageData, setPageData] = useState<PageResponse<SellerProductSummaryResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded rows state (Map productId -> ProductDetailResponse)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());
  const [detailsCache, setDetailsCache] = useState<Record<number, SellerProductDetailResponse>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

  // Modal Xóa
  const [deleteModalProduct, setDeleteModalProduct] = useState<SellerProductSummaryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load lại danh sách sản phẩm khi người dùng tương tác (xóa, thử lại)
  const handleReload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getSellerProducts(page, pageSize, activeTab === "ALL" ? undefined : activeTab)
      .then((res) => {
        setPageData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể nạp danh sách sản phẩm.");
        setIsLoading(false);
      });
  }, [page, pageSize, activeTab]);

  useEffect(() => {
    let ignore = false;

    getSellerProducts(page, pageSize, activeTab === "ALL" ? undefined : activeTab)
      .then((res) => {
        if (!ignore) {
          setPageData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể nạp danh sách sản phẩm.");
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, pageSize, activeTab]);

  // Toggle expand row xem biến thể SKU
  const toggleExpandRow = async (productId: number) => {
    const next = new Set(expandedRowIds);
    if (next.has(productId)) {
      next.delete(productId);
      setExpandedRowIds(next);
      return;
    }

    next.add(productId);
    setExpandedRowIds(next);

    // Nếu chưa có cache detail, gọi API lấy chi tiết biến thể
    if (!detailsCache[productId]) {
      setLoadingDetails((prev) => ({ ...prev, [productId]: true }));
      try {
        const detail = await getSellerProductDetail(productId);
        setDetailsCache((prev) => ({ ...prev, [productId]: detail }));
      } catch (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- catch chỉ để suppress, không dùng error
        _err
      ) {
        toast.error("Không thể lấy danh sách biến thể SKU.");
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [productId]: false }));
      }
    }
  };

  // Toggle bật/tắt trạng thái SPU
  const handleToggleStatus = async (product: SellerProductSummaryResponse) => {
    const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateProductStatus(product.id, newStatus);
      toast.success(
        newStatus === "ACTIVE"
          ? `Đã mở bán lại sản phẩm: ${product.name}`
          : `Đã tạm ẩn sản phẩm: ${product.name}`
      );
      // Cập nhật lại UI state tại chỗ
      if (pageData && Array.isArray(pageData.content)) {
        setPageData({
          ...pageData,
          content: pageData.content.map((p: SellerProductSummaryResponse) =>
            p.id === product.id ? { ...p, status: newStatus } : p
          ),
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại.");
    }
  };

  // Xác nhận xóa sản phẩm
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteModalProduct.id);
      toast.success(`Đã xóa sản phẩm: ${deleteModalProduct.name}`);
      setDeleteModalProduct(null);
      handleReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa sản phẩm thất bại.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Xuất file CSV danh sách sản phẩm
  const handleExportCSV = () => {
    const contentList = Array.isArray(pageData?.content) ? pageData.content : [];
    if (contentList.length === 0) {
      toast.error("Không có sản phẩm để xuất file.");
      return;
    }

    const headers = ["ID", "Tên sản phẩm", "Mã Slug", "Giá thấp nhất", "Giá cao nhất", "Tồn kho", "Đã bán", "Trạng thái"];
    const rows = contentList.map((p: SellerProductSummaryResponse) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.slug,
      p.minPrice,
      p.maxPrice,
      p.totalStock,
      p.totalSold,
      p.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seller_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách sản phẩm ra tệp CSV.");
  };

  // Lọc sản phẩm theo tìm kiếm và sort tồn kho phía client
  const filteredProducts = useMemo(() => {
    if (!pageData) return [];
    const sourceList =
      Array.isArray(pageData.items) && pageData.items.length > 0
        ? pageData.items
        : Array.isArray(pageData.content)
        ? pageData.content
        : Array.isArray(pageData)
        ? (pageData as unknown as SellerProductSummaryResponse[])
        : [];
    let list = [...sourceList];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.slug && p.slug.toLowerCase().includes(q)) ||
          String(p.id).includes(q)
      );
    }

    if (stockSort === "low-stock") {
      list = list.filter((p) => p.totalStock < 10);
    } else if (stockSort === "out-of-stock") {
      list = list.filter((p) => p.totalStock <= 0);
    } else if (stockSort === "high-stock") {
      list = list.filter((p) => p.totalStock > 100);
    } else if (stockSort === "price-asc") {
      list.sort((a, b) => a.minPrice - b.minPrice);
    } else if (stockSort === "price-desc") {
      list.sort((a, b) => b.minPrice - a.minPrice);
    }

    return list;
  }, [pageData, searchTerm, stockSort]);

  const rawList = useMemo(() => {
    if (!pageData) return [];
    return Array.isArray(pageData.items) && pageData.items.length > 0
      ? pageData.items
      : Array.isArray(pageData.content)
      ? pageData.content
      : Array.isArray(pageData)
      ? (pageData as unknown as SellerProductSummaryResponse[])
      : [];
  }, [pageData]);

  const totalCount = pageData?.totalElements ?? filteredProducts.length;

  const tabCounts = useMemo(() => {
    return {
      ALL: totalCount,
      ACTIVE: rawList.filter((p) => p.status === "ACTIVE").length,
      OUT_OF_STOCK: rawList.filter(
        (p) => p.status === "OUT_OF_STOCK" || p.totalStock <= 0
      ).length,
      INACTIVE: rawList.filter((p) => p.status === "INACTIVE").length,
      BANNED: rawList.filter((p) => p.status === "BANNED").length,
    };
  }, [rawList, totalCount]);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex items-baseline gap-space-sm">
          <h1 className="font-display-sm text-display-sm text-on-surface font-semibold tracking-tight">
            Quản lý sản phẩm
          </h1>
          <span className="font-body-md text-body-md text-secondary">
            {totalCount} sản phẩm
          </span>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container-low transition-all font-body-md text-body-md shadow-sm border border-outline-variant/30 font-medium"
          >
            <MaterialSymbol name="file_download" size="[18px]" />
            <span>Xuất Excel</span>
          </button>
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline-md text-body-md font-medium shadow-sm transition-all transform active:scale-[0.99]"
          >
            <MaterialSymbol name="add" size="[20px]" />
            <span>Thêm sản phẩm mới</span>
          </Link>
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm px-space-md pt-2 flex items-center justify-between overflow-x-auto border border-outline-variant/30">
        <div className="flex items-center gap-space-md">
          {[
            { key: "ALL", label: "Tất cả", count: tabCounts.ALL },
            { key: "ACTIVE", label: "Đang bán", count: tabCounts.ACTIVE },
            {
              key: "OUT_OF_STOCK",
              label: "Hết hàng",
              count: tabCounts.OUT_OF_STOCK,
            },
            { key: "INACTIVE", label: "Đã ẩn", count: tabCounts.INACTIVE },
            { key: "BANNED", label: "Vi phạm", count: tabCounts.BANNED },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key as ProductTab);
                  setPage(0);
                }}
                className={`relative flex items-center gap-1.5 py-3 px-1 font-body-md text-body-md transition-colors ${
                  isActive
                    ? "text-emerald-700 font-semibold border-b-2 border-emerald-500"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-label-md text-label-sm px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "bg-surface-container-low text-secondary"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick stats indicator */}
        <div className="hidden xl:flex items-center gap-space-md py-2 font-body-sm text-body-sm text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>98.4% Tỷ lệ phản hồi kho</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span>3 cảnh báo tồn kho</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-wrap items-center justify-between gap-space-md border border-outline-variant/30">
        <div className="flex flex-1 flex-wrap items-center gap-space-sm min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <MaterialSymbol
              name="search"
              size="[20px]"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
              className="w-full h-10 pl-10 pr-4 bg-surface-container-low/60 hover:bg-surface-container-low focus:bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline rounded-lg outline-none transition-all shadow-inner focus:shadow-sm ring-1 ring-transparent focus:ring-emerald-500/40"
            />
          </div>

          {/* Stock / Price Sort Dropdown */}
          <div className="relative min-w-[190px]">
            <select
              value={stockSort}
              onChange={(e) => setStockSort(e.target.value)}
              className="appearance-none w-full h-10 px-3 pr-8 bg-surface-container-low/60 hover:bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg outline-none cursor-pointer border border-outline-variant/20"
            >
              <option value="">Lọc theo: Mặc định</option>
              <option value="low-stock">Tồn kho &lt; 10 (Cảnh báo)</option>
              <option value="out-of-stock">Tồn kho = 0 (Hết hàng)</option>
              <option value="high-stock">Tồn dồi dào (&gt; 100)</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
            <MaterialSymbol
              name="expand_more"
              size="[18px]"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
          </div>

          {/* Reset Filters */}
          {(searchTerm || stockSort) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStockSort("");
              }}
              className="inline-flex items-center gap-1 h-10 px-3 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-md text-body-sm"
            >
              <MaterialSymbol name="restart_alt" size="[18px]" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-secondary font-label-md text-label-md">
          <span className="px-2.5 py-1 rounded-lg bg-surface-container-low">
            Hiển thị {filteredProducts.length} sản phẩm
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center justify-between border border-error/20">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleReload}
            className="px-3 py-1 rounded bg-error text-white font-semibold text-sm hover:bg-error/90"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Products Table Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-11 bg-surface-container-low/70 font-label-sm text-label-sm text-secondary uppercase tracking-wider select-none border-b border-outline-variant/30">
                <th className="px-space-md min-w-[340px]">Sản phẩm & SPU</th>
                <th className="px-space-md min-w-[130px]">Biến thể</th>
                <th className="px-space-md min-w-[160px]">Giá niêm yết</th>
                <th className="px-space-md min-w-[110px]">Tồn kho</th>
                <th className="px-space-md min-w-[100px]">Đã bán</th>
                <th className="px-space-md min-w-[130px]">Trạng thái</th>
                <th className="px-space-md w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Đang nạp danh sách sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <MaterialSymbol name="inventory_2" size="[40px]" className="text-outline" />
                      <p className="font-headline-md text-body-lg font-semibold text-on-surface">
                        Không tìm thấy sản phẩm nào
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary max-w-sm">
                        Chưa có sản phẩm nào phù hợp với bộ lọc hiện tại. Hãy tạo sản phẩm mới hoặc đặt lại bộ lọc.
                      </p>
                      <Link
                        href="/seller/products/new"
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
                      >
                        <MaterialSymbol name="add" size="[18px]" />
                        <span>Thêm sản phẩm mới</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isExpanded = expandedRowIds.has(product.id);
                  const isDetailLoading = loadingDetails[product.id];
                  const detail = detailsCache[product.id];

                  return (
                    <React.Fragment key={product.id}>
                      {/* SPU Row */}
                      <tr
                        className={`h-16 transition-colors ${
                          isExpanded ? "bg-emerald-50/20" : "hover:bg-surface-container-low/40"
                        }`}
                      >
                        {/* Sản phẩm & SPU */}
                        <td className="px-space-md py-2">
                          <div className="flex items-center gap-space-sm">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 shadow-sm border border-outline-variant/30">
                              {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-secondary bg-surface-container-low">
                                  <MaterialSymbol name="inventory_2" size="[20px]" />
                                </div>
                              )}
                              <span className="absolute bottom-0 right-0 bg-emerald-600 text-[9px] text-white font-bold px-1 rounded-tl">
                                SPU
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-headline-md text-body-md text-on-surface font-semibold truncate hover:text-emerald-700 cursor-pointer">
                                {product.name}
                              </span>
                              <div className="flex items-center gap-2 font-body-sm text-body-sm text-secondary">
                                <span>Mã: #{product.id}</span>
                                <span>•</span>
                                <span className="text-secondary/80">
                                  {product.categoryName || "Chung"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phân loại / Biến thể expand button */}
                        <td className="px-space-md">
                          <button
                            type="button"
                            onClick={() => toggleExpandRow(product.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors border border-outline-variant/20"
                          >
                            <span>Xem SKU</span>
                            <MaterialSymbol
                              name="expand_circle_down"
                              size="[16px]"
                              className={`text-emerald-600 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>

                        {/* Giá niêm yết */}
                        <td className="px-space-md font-data-tabular text-body-md text-on-surface font-semibold tracking-tight">
                          {product.minPrice === product.maxPrice
                            ? formatVND(product.minPrice)
                            : `${formatVND(product.minPrice)} – ${formatVND(product.maxPrice)}`}
                        </td>

                        {/* Tồn kho */}
                        <td className="px-space-md">
                          <div className="flex items-center gap-1.5 font-data-tabular text-body-md text-on-surface font-semibold">
                            <span>{product.totalStock}</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                product.totalStock <= 0
                                  ? "bg-rose-500"
                                  : product.totalStock < 10
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                          </div>
                        </td>

                        {/* Đã bán */}
                        <td className="px-space-md font-data-tabular text-body-md text-secondary">
                          {(product.totalSold ?? 0).toLocaleString("vi-VN")}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-space-md">
                          <SellerStatusBadge status={product.status} />
                        </td>

                        {/* Thao tác */}
                        <td className="px-space-md text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Nút sửa */}
                            <Link
                              href={`/seller/products/${product.id}/edit`}
                              className="w-8 h-8 rounded-lg hover:bg-surface-container text-secondary hover:text-emerald-700 flex items-center justify-center transition-colors"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <MaterialSymbol name="edit" size="[18px]" />
                            </Link>

                            {/* Nút bật/tắt active */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(product)}
                              className="w-8 h-8 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface flex items-center justify-center transition-colors"
                              title={product.status === "ACTIVE" ? "Tạm ẩn sản phẩm" : "Mở bán lại"}
                            >
                              <MaterialSymbol
                                name={product.status === "ACTIVE" ? "visibility_off" : "visibility"}
                                size="[18px]"
                              />
                            </button>

                            {/* Nút xóa */}
                            <button
                              type="button"
                              onClick={() => setDeleteModalProduct(product)}
                              className="w-8 h-8 rounded-lg hover:bg-rose-50 text-secondary hover:text-rose-600 flex items-center justify-center transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <MaterialSymbol name="delete" size="[18px]" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-table: SKU Matrix */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-outline-variant/30">
                            <div className="bg-surface-container-low/40 p-space-md pl-12">
                              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md space-y-space-sm border border-outline-variant/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MaterialSymbol
                                      name="subdirectory_arrow_right"
                                      size="[18px]"
                                      className="text-emerald-600"
                                    />
                                    <span className="font-headline-md text-body-sm text-on-surface font-semibold">
                                      Danh sách biến thể phân loại (SKU Matrix)
                                    </span>
                                  </div>
                                  <span className="text-xs text-secondary">
                                    {detail?.variants.length || 0} biến thể được cấu hình
                                  </span>
                                </div>

                                {isDetailLoading ? (
                                  <div className="py-6 text-center text-sm text-secondary">
                                    Đang nạp chi tiết biến thể SKU...
                                  </div>
                                ) : detail && detail.variants.length > 0 ? (
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="h-9 bg-surface-container-low font-label-sm text-label-sm text-secondary uppercase border-b border-outline-variant/20">
                                        <th className="px-3 py-1">Mã SKU</th>
                                        <th className="px-3 py-1">Thuộc tính</th>
                                        <th className="px-3 py-1">Giá bán</th>
                                        <th className="px-3 py-1">Tồn kho</th>
                                        <th className="px-3 py-1 text-right">Trạng thái</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container">
                                      {detail.variants.map((v) => (
                                        <tr key={v.id} className="h-10 hover:bg-surface-container-low/30">
                                          <td className="px-3 font-mono text-body-sm font-semibold text-on-surface">
                                            {v.skuCode}
                                          </td>
                                          <td className="px-3 text-body-sm text-secondary">
                                            {v.attributes
                                              ? Object.entries(v.attributes)
                                                  .map(([k, val]) => `${k}: ${val}`)
                                                  .join(" · ")
                                              : "Mặc định"}
                                          </td>
                                          <td className="px-3 font-data-tabular text-body-sm font-semibold text-on-surface">
                                            {formatVND(v.salePrice || v.originalPrice)}
                                          </td>
                                          <td className="px-3 font-data-tabular text-body-sm text-on-surface">
                                            {v.stockQuantity}
                                          </td>
                                          <td className="px-3 text-right">
                                            <SellerStatusBadge status={v.status} />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="py-4 text-center text-sm text-secondary">
                                    Sản phẩm này chưa có biến thể SKU riêng biệt.
                                  </div>
                                )}
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

        {/* Pagination Bar */}
        {pageData && pageData.totalPages > 1 && (
          <div className="p-space-md border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-secondary font-body-sm">
                Trang {page + 1} / {pageData.totalPages} ({pageData.totalElements} sản phẩm)
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="px-2 py-1 rounded bg-surface-container-low text-xs border border-outline-variant/30 text-secondary"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
              >
                Trước
              </button>

              {Array.from({ length: Math.min(5, pageData.totalPages) }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-body-sm font-semibold transition-colors ${
                    page === i
                      ? "bg-emerald-600 text-white"
                      : "hover:bg-surface-container-low text-secondary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= pageData.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <MaterialSymbol name="warning" size="[24px]" />
              </div>
              <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">
                Xác nhận xóa sản phẩm?
              </h3>
            </div>

            <p className="font-body-md text-body-sm text-secondary">
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <span className="font-semibold text-on-surface">
                &ldquo;{deleteModalProduct.name}&rdquo;
              </span>
              ? Thao tác này sẽ gỡ bỏ sản phẩm khỏi sàn và chuyển trạng thái lưu trữ.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant/30 text-secondary hover:bg-surface-container-low font-label-md text-body-sm font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-label-md text-body-sm font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isDeleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
