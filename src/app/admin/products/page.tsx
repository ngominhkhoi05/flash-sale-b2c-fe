"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  updateAdminProductStatus,
  type AdminProduct,
} from "@/lib/api/admin";
import { useAdminProductsQuery } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";

type ProductTabKey = "ALL" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "BANNED";

const PRODUCT_TABS: { key: ProductTabKey; label: string }[] = [
  { key: "ALL", label: "Tất cả sản phẩm" },
  { key: "ACTIVE", label: "Đang mở bán" },
  { key: "INACTIVE", label: "Đã tạm ẩn" },
  { key: "OUT_OF_STOCK", label: "Hết hàng" },
  { key: "BANNED", label: "Vi phạm / Bị khóa" },
];

const PRICE_RANGES = [
  { key: "ALL", label: "Tất cả mức giá" },
  { key: "UNDER_100K", label: "Dưới 100.000₫" },
  { key: "100K_500K", label: "100.000₫ - 500.000₫" },
  { key: "500K_2M", label: "500.000₫ - 2.000.000₫" },
  { key: "ABOVE_2M", label: "Trên 2.000.000₫" },
];

const SORT_OPTIONS = [
  { key: "DEFAULT", label: "Mới nhất (Mặc định)" },
  { key: "PRICE_ASC", label: "Giá: Thấp đến cao" },
  { key: "PRICE_DESC", label: "Giá: Cao đến thấp" },
  { key: "STOCK_DESC", label: "Tồn kho: Nhiều nhất" },
  { key: "STOCK_ASC", label: "Tồn kho: Ít nhất" },
  { key: "NAME_ASC", label: "Tên: A - Z" },
];

interface ProductActionModalState {
  isOpen: boolean;
  product: AdminProduct | null;
  targetStatus: "ACTIVE" | "BANNED";
  reason: string;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProductTabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStore, setSelectedStore] = useState<string>("ALL");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("ALL");
  const [selectedSort, setSelectedSort] = useState<string>("DEFAULT");

  // Phân trang
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal xác nhận thao tác khóa / mở khóa sản phẩm
  const [actionModal, setActionModal] = useState<ProductActionModalState>({
    isOpen: false,
    product: null,
    targetStatus: "BANNED",
    reason: "",
  });
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const { data: rawProducts = [], isLoading, isFetching, refetch } = useAdminProductsQuery(undefined);

  const [localProducts, setLocalProducts] = useState<AdminProduct[] | null>(null);
  const products = localProducts ?? rawProducts;

  useEffect(() => {
    setLocalProducts(null);
  }, [rawProducts]);

  // Tính số lượng sản phẩm cho từng tab ngay lập tức (0ms)
  const tabCounts = useMemo(() => {
    const counts: Record<ProductTabKey, number> = {
      ALL: products.length,
      ACTIVE: 0,
      INACTIVE: 0,
      OUT_OF_STOCK: 0,
      BANNED: 0,
    };
    for (const p of products) {
      if (p.status === "ACTIVE") counts.ACTIVE++;
      else if (p.status === "INACTIVE") counts.INACTIVE++;
      else if (p.status === "OUT_OF_STOCK") counts.OUT_OF_STOCK++;
      else if (p.status === "BANNED") counts.BANNED++;
    }
    return counts;
  }, [products]);

  // Trích xuất danh sách ngành hàng duy nhất từ dữ liệu sản phẩm
  const uniqueCategories = useMemo(() => {
    const cats = Array.from(
      new Set(products.map((p) => p.categoryName).filter(Boolean))
    );
    return cats.sort((a, b) => a.localeCompare(b, "vi"));
  }, [products]);

  // Trích xuất danh sách gian hàng duy nhất từ dữ liệu sản phẩm
  const uniqueStores = useMemo(() => {
    const stores = Array.from(
      new Set(products.map((p) => p.storeName).filter(Boolean))
    );
    return stores.sort((a, b) => a.localeCompare(b, "vi"));
  }, [products]);

  // Bộ lọc sản phẩm đa tiêu chí siêu tốc 0ms
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];

    // 0. Lọc theo Tab trạng thái tức thì 0ms
    if (activeTab !== "ALL") {
      list = list.filter((p) => p.status === activeTab);
    }

    // 1. Lọc theo ô tìm kiếm tức thì
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.storeName && p.storeName.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
          `prd-${p.id}`.includes(q) ||
          String(p.id).includes(q)
        );
      });
    }

    // 2. Lọc theo Ngành hàng tức thì
    if (selectedCategory !== "ALL") {
      list = list.filter((p) => p.categoryName === selectedCategory);
    }

    // 3. Lọc theo Gian hàng tức thì
    if (selectedStore !== "ALL") {
      list = list.filter((p) => p.storeName === selectedStore);
    }

    // 4. Lọc theo Khoảng giá tức thì
    if (selectedPriceRange === "UNDER_100K") {
      list = list.filter((p) => p.minPrice < 100000);
    } else if (selectedPriceRange === "100K_500K") {
      list = list.filter((p) => p.minPrice >= 100000 && p.minPrice <= 500000);
    } else if (selectedPriceRange === "500K_2M") {
      list = list.filter((p) => p.minPrice >= 500000 && p.minPrice <= 2000000);
    } else if (selectedPriceRange === "ABOVE_2M") {
      list = list.filter((p) => p.minPrice > 2000000);
    }

    // 5. Sắp xếp tức thì
    if (selectedSort === "PRICE_ASC") {
      list.sort((a, b) => a.minPrice - b.minPrice);
    } else if (selectedSort === "PRICE_DESC") {
      list.sort((a, b) => b.minPrice - a.minPrice);
    } else if (selectedSort === "STOCK_DESC") {
      list.sort((a, b) => b.totalStock - a.totalStock);
    } else if (selectedSort === "STOCK_ASC") {
      list.sort((a, b) => a.totalStock - b.totalStock);
    } else if (selectedSort === "NAME_ASC") {
      list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    return list;
  }, [
    products,
    activeTab,
    searchQuery,
    selectedCategory,
    selectedStore,
    selectedPriceRange,
    selectedSort,
  ]);

  const totalElements = filteredProducts.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  // Cắt sản phẩm theo phân trang hiện tại (tự động kẹp trang an toàn)
  const paginatedProducts = useMemo(() => {
    const safePage = Math.min(pageNumber, Math.max(0, totalPages - 1));
    const start = safePage * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, pageNumber, pageSize, totalPages]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedStore !== "ALL" ||
    selectedPriceRange !== "ALL" ||
    selectedSort !== "DEFAULT";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedStore("ALL");
    setSelectedPriceRange("ALL");
    setSelectedSort("DEFAULT");
    setPageNumber(0);
  };

  // Mở modal khóa sản phẩm vi phạm
  const openBanModal = (product: AdminProduct) => {
    setActionModal({
      isOpen: true,
      product,
      targetStatus: "BANNED",
      reason: "",
    });
  };

  // Mở modal gỡ khóa / mở bán lại
  const openUnbanModal = (product: AdminProduct) => {
    setActionModal({
      isOpen: true,
      product,
      targetStatus: "ACTIVE",
      reason: "",
    });
  };

  // Đóng modal
  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      product: null,
      targetStatus: "BANNED",
      reason: "",
    });
  };

  // Xác nhận thực hiện thay đổi trạng thái sản phẩm (Phản hồi tức thì 0ms)
  const handleConfirmAction = () => {
    if (!actionModal.product) return;
    const { product, targetStatus, reason } = actionModal;
    const isBan = targetStatus === "BANNED";

    // 1. Đóng modal ngay lập tức (0ms)
    closeActionModal();

    // 2. BẬT THÔNG BÁO THÀNH CÔNG NGAY LẬP TỨC (0ms)
    toast.success(
      isBan
        ? `Đã khóa sản phẩm "${product.name}" do vi phạm thành công!`
        : `Đã mở khóa sản phẩm "${product.name}" thành công!`
    );

    // 3. Cập nhật trạng thái trực tiếp trong state và cache ngay lập tức (Optimistic update)
    const updatedProduct = { ...product, status: targetStatus };
    setLocalProducts((prev) => {
      const base = prev ?? rawProducts;
      return base.map((p) => (p.id === product.id ? updatedProduct : p));
    });

    // 4. Đồng bộ ngầm với máy chủ BE và invalidate React Query Cache
    updateAdminProductStatus(product.id, targetStatus, reason.trim() || undefined)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      })
      .catch((err) => {
        console.error("Lỗi cập nhật sản phẩm:", err);
        toast.error(
          "Lỗi đồng bộ máy chủ: " + (err instanceof Error ? err.message : String(err))
        );
        void refetch();
      });
  };

  return (
    <div className="flex flex-col w-full gap-space-lg select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Sản phẩm toàn sàn
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-xs bg-primary-fixed text-on-primary-fixed-variant font-semibold">
              Catalog SPU & SKU
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary mt-0.5">
            Giám sát kho hàng, giá niêm yết, kiểm duyệt vi phạm và tình trạng phân phối sản phẩm
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter Block */}
      <div className="flex flex-col gap-3 bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        {/* Row 1: Tabs trạng thái */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            {PRODUCT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPageNumber(0);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? tab.key === "BANNED"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-primary text-on-primary shadow-sm"
                    : tab.key === "BANNED"
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                {tab.key === "BANNED" && (
                  <span className="material-symbols-outlined text-[14px]">block</span>
                )}
                <span>{tab.label}</span>
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab.key
                        ? "bg-white/20 text-on-primary"
                        : tab.key === "BANNED"
                        ? "bg-rose-200 text-rose-800"
                        : "bg-surface-container text-secondary"
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="text-xs text-secondary font-medium shrink-0">
            Tổng số: <strong className="text-on-surface">{products.length}</strong> sản phẩm
          </div>
        </div>

        {/* Row 2: Bộ lọc nhanh đa tiêu chí (Ngành hàng, Gian hàng, Giá, Sắp xếp, Tìm kiếm) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
          {/* Ô tìm kiếm đa năng */}
          <div className="lg:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPageNumber(0);
              }}
              placeholder="Tìm theo tên SP, gian hàng, ngành, ID... (0ms)"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPageNumber(0);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Dropdown lọc theo Ngành hàng */}
          <div className="lg:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPageNumber(0);
              }}
              className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary border-none shadow-sm cursor-pointer"
            >
              <option value="ALL">Tất cả ngành hàng</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown lọc theo Gian hàng */}
          <div className="lg:col-span-2">
            <select
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value);
                setPageNumber(0);
              }}
              className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary border-none shadow-sm cursor-pointer truncate"
            >
              <option value="ALL">Tất cả gian hàng</option>
              {uniqueStores.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown lọc theo Khoảng giá */}
          <div className="lg:col-span-2">
            <select
              value={selectedPriceRange}
              onChange={(e) => {
                setSelectedPriceRange(e.target.value);
                setPageNumber(0);
              }}
              className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary border-none shadow-sm cursor-pointer"
            >
              {PRICE_RANGES.map((pr) => (
                <option key={pr.key} value={pr.key}>
                  {pr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Sắp xếp */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setPageNumber(0);
              }}
              className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary border-none shadow-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((so) => (
                <option key={so.key} value={so.key}>
                  {so.label}
                </option>
              ))}
            </select>

            {/* Nút Reset bộ lọc nhanh */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Xóa bộ lọc"
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
            )}
          </div>
        </div>

        {/* Thông tin số lượng sau khi lọc */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-secondary bg-surface-container-low px-3 py-1.5 rounded-lg">
            <span>
              Tìm thấy <strong className="text-primary font-bold">{filteredProducts.length}</strong> sản phẩm phù hợp bộ lọc
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-primary hover:underline font-semibold"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table of Products */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="bg-surface-container-low text-secondary font-label-sm text-xs uppercase border-b border-outline-variant/20">
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Gian hàng</th>
                <th className="py-3 px-4">Ngành hàng</th>
                <th className="py-3 px-4 text-right">Khoảng giá</th>
                <th className="py-3 px-4 text-center">Tồn kho</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải danh sách sản phẩm toàn sàn...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary text-sm">
                    Không có sản phẩm nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-surface transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={
                            prod.primaryImageUrl ||
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80"
                          }
                          alt={prod.name || "Product"}
                          width={48}
                          height={48}
                          unoptimized
                          className="w-12 h-12 rounded-lg object-cover shadow-xs shrink-0 bg-surface-container"
                        />
                        <div className="flex flex-col min-w-0 max-w-xs sm:max-w-sm">
                          <span className="font-semibold text-on-surface line-clamp-1">
                            {prod.name}
                          </span>
                          <span className="text-xs text-secondary truncate font-mono">
                            ID: PRD-{prod.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          storefront
                        </span>
                        <span className="font-medium text-on-surface text-xs truncate">
                          {prod.storeName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-secondary">
                        {prod.categoryName}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-data-tabular">
                      <span className="font-bold text-primary">
                        {prod.minPrice.toLocaleString("vi-VN")}₫
                      </span>
                      {prod.maxPrice > prod.minPrice && (
                        <span className="text-xs text-secondary block">
                          - {prod.maxPrice.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-data-tabular">
                      <span
                        className={`font-semibold ${
                          prod.totalStock === 0 ? "text-rose-600 font-bold" : "text-on-surface"
                        }`}
                      >
                        {prod.totalStock}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {prod.status === "ACTIVE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Đang bán
                        </span>
                      )}
                      {prod.status === "INACTIVE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Đã ẩn
                        </span>
                      )}
                      {prod.status === "OUT_OF_STOCK" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          Hết hàng
                        </span>
                      )}
                      {prod.status === "BANNED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          Bị khóa vi phạm
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/products/${prod.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container text-xs font-semibold transition-colors"
                          title="Xem trang chi tiết sản phẩm"
                        >
                          <span>Xem</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </Link>

                        {prod.status === "BANNED" ? (
                          <button
                            type="button"
                            onClick={() => openUnbanModal(prod)}
                            disabled={actionLoadingId === prod.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            title="Mở khóa sản phẩm"
                          >
                            <span className="material-symbols-outlined text-[15px]">lock_open</span>
                            <span>Mở khóa</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBanModal(prod)}
                            disabled={actionLoadingId === prod.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                            title="Khóa / gỡ sản phẩm vi phạm"
                          >
                            <span className="material-symbols-outlined text-[15px]">block</span>
                            <span>Khóa vi phạm</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-container-low/50 border-t border-outline-variant/20 text-xs text-secondary">
          <div className="flex items-center gap-3">
            <div>
              Hiển thị{" "}
              <span className="font-semibold text-on-surface">
                {paginatedProducts.length}
              </span>{" "}
              trên tổng số{" "}
              <span className="font-semibold text-on-surface">
                {totalElements}
              </span>{" "}
              sản phẩm
            </div>

            <div className="flex items-center gap-1.5 ml-2 border-l border-outline-variant/20 pl-3">
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(0);
                }}
                className="px-2 py-0.5 rounded bg-surface-container text-on-surface border-none text-xs focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageNumber === 0 || isLoading}
              onClick={() => setPageNumber((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              <span>Trang trước</span>
            </button>
            <span className="px-2 font-medium">
              Trang {totalPages > 0 ? pageNumber + 1 : 1} / {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={pageNumber >= totalPages - 1 || isLoading}
              onClick={() =>
                setPageNumber((prev) => Math.min(totalPages - 1, prev + 1))
              }
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
            >
              <span>Trang sau</span>
              <span className="material-symbols-outlined text-[15px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL XÁC NHẬN KHÓA / GỠ VI PHẠM (CENTERED DIALOG)           */}
      {/* ============================================================ */}
      {actionModal.isOpen && actionModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 p-6 flex flex-col gap-4">
            {/* Header Icon + Tiêu đề */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  actionModal.targetStatus === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {actionModal.targetStatus === "ACTIVE" ? "lock_open" : "block"}
                </span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">
                  {actionModal.targetStatus === "ACTIVE"
                    ? "Xác nhận mở khóa sản phẩm"
                    : "Xác nhận khóa sản phẩm vi phạm"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {actionModal.targetStatus === "ACTIVE"
                    ? "Sản phẩm sẽ được khôi phục trạng thái hoạt động trên sàn"
                    : "Sản phẩm vi phạm sẽ bị khóa và gỡ khỏi danh sách mua sắm ngay lập tức"}
                </p>
              </div>
            </div>

            {/* Thông tin tóm tắt sản phẩm */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3 text-xs">
              <Image
                src={
                  actionModal.product.primaryImageUrl ||
                  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80"
                }
                alt={actionModal.product.name}
                width={56}
                height={56}
                unoptimized
                className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-200 border border-slate-200"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-slate-900 line-clamp-2 leading-snug">
                  {actionModal.product.name}
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                  <span className="font-mono text-slate-600">ID: PRD-{actionModal.product.id}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{actionModal.product.storeName}</span>
                  <span>•</span>
                  <span className="font-bold text-primary">
                    {actionModal.product.minPrice.toLocaleString("vi-VN")}₫
                  </span>
                  <span>•</span>
                  <span>Kho: <strong>{actionModal.product.totalStock}</strong></span>
                </div>
              </div>
            </div>

            {/* Cảnh báo hệ quả */}
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed ${
                actionModal.targetStatus === "BANNED"
                  ? "bg-rose-50/70 border border-rose-100 text-rose-800"
                  : "bg-emerald-50/70 border border-emerald-100 text-emerald-800"
              }`}
            >
              {actionModal.targetStatus === "BANNED" ? (
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">
                    warning
                  </span>
                  <span>
                    Khi bị khóa vi phạm, sản phẩm sẽ lập tức <strong>ẩn khỏi toàn bộ trang tìm kiếm, danh mục và Flash Sale</strong>. Người mua sẽ không thể thêm vào giỏ hay thanh toán.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">
                    verified
                  </span>
                  <span>
                    Sản phẩm sẽ được khôi phục sang trạng thái <strong>Đang mở bán (ACTIVE)</strong>, người mua có thể tìm kiếm và đặt hàng bình thường.
                  </span>
                </div>
              )}
            </div>

            {/* Nhập lý do */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>
                  {actionModal.targetStatus === "BANNED"
                    ? "Lý do khóa sản phẩm vi phạm"
                    : "Ghi chú mở khóa"}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {actionModal.targetStatus === "BANNED" ? "Nên ghi rõ lý do" : "Tùy chọn"}
                </span>
              </label>
              <textarea
                rows={3}
                value={actionModal.reason}
                onChange={(e) =>
                  setActionModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder={
                  actionModal.targetStatus === "BANNED"
                    ? "Nhập lý do khóa sản phẩm (VD: Hàng giả/nhái thương hiệu, hình ảnh phản cảm, cấm lưu hành...)"
                    : "Nhập ghi chú mở khóa (VD: Người bán đã cung cấp đủ chứng từ xuất xứ, gỡ khóa sau phúc khảo...)"
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />

              {/* Preset chips */}
              <div className="flex flex-wrap gap-1 mt-1">
                {(actionModal.targetStatus === "BANNED"
                  ? [
                      "Hàng giả, nhái nhãn hiệu",
                      "Thông tin mô tả sai lệch",
                      "Hàng cấm kinh doanh",
                      "Hình ảnh vi phạm chính sách",
                      "Giá bất thường / Thổi giá",
                    ]
                  : [
                      "Đã xác minh chứng từ hợp lệ",
                      "Đã khắc phục lỗi thông tin",
                      "Mở khóa theo yêu cầu kiểm duyệt",
                    ]
                ).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() =>
                      setActionModal((prev) => ({ ...prev, reason: sug }))
                    }
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Nút hành động Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoadingId !== null}
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm disabled:opacity-60 active:scale-95 flex items-center gap-1.5 ${
                  actionModal.targetStatus === "ACTIVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionLoadingId !== null ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Đang xử lý...</span>
                  </>
                ) : actionModal.targetStatus === "ACTIVE" ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    <span>Xác nhận mở khóa</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    <span>Xác nhận khóa vi phạm</span>
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
