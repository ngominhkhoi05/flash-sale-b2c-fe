"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAdminProducts,
  updateAdminProductStatus,
  type AdminProduct,
} from "@/lib/api/admin";

type ProductTabKey = "ALL" | "ACTIVE" | "INACTIVE" | "BANNED";

const PRODUCT_TABS: { key: ProductTabKey; label: string }[] = [
  { key: "ALL", label: "Tất cả sản phẩm" },
  { key: "ACTIVE", label: "Đang mở bán" },
  { key: "INACTIVE", label: "Đã tạm ẩn" },
  { key: "BANNED", label: "Bị khóa / Vi phạm" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [activeTab, setActiveTab] = useState<ProductTabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [submittedSearch, setSubmittedSearch] = useState("");

  const refreshProducts = useCallback(async (tab: ProductTabKey, search: string, pageNum: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await getAdminProducts({
        status: tab === "ALL" ? undefined : tab,
        search: search.trim() ? search.trim() : undefined,
        page: pageNum,
        size: 10,
      });
      const items = res.content ?? res.items ?? [];
      setProducts(items);
      setPage(res.pageNumber ?? pageNum);
      setTotalPages(res.totalPages ?? 1);
      setTotalElements(res.totalElements ?? items.length);
    } catch (err) {
      console.error("Lỗi tải danh sách sản phẩm:", err);
      setErrorMessage(err instanceof Error ? err.message : "Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAdminProducts({
      status: activeTab === "ALL" ? undefined : activeTab,
      search: submittedSearch.trim() ? submittedSearch.trim() : undefined,
      page,
      size: 10,
    })
      .then((res) => {
        if (!isMounted) return;
        const items = res.content ?? res.items ?? [];
        setProducts(items);
        setPage(res.pageNumber ?? page);
        setTotalPages(res.totalPages ?? 1);
        setTotalElements(res.totalElements ?? items.length);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Lỗi tải danh sách sản phẩm:", err);
        setErrorMessage(err instanceof Error ? err.message : "Không thể tải danh sách sản phẩm");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, page, submittedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSubmittedSearch(searchQuery);
  };

  const handleTabChange = (newTab: ProductTabKey) => {
    setActiveTab(newTab);
    setPage(0);
  };

  const handleToggleStatus = async (product: AdminProduct) => {
    const isCurrentlyActive = product.status === "ACTIVE";
    const targetStatus = isCurrentlyActive ? "BANNED" : "ACTIVE";
    const actionText = isCurrentlyActive ? "khóa sản phẩm (BANNED)" : "mở bán lại sản phẩm (ACTIVE)";

    let reason: string | undefined;
    if (isCurrentlyActive) {
      const inputReason = prompt(`Nhập lý do khóa sản phẩm "${product.name}":`, "Vi phạm tiêu chuẩn cộng đồng");
      if (inputReason === null) return;
      reason = inputReason.trim() || "Vi phạm tiêu chuẩn sàn";
    } else {
      if (!confirm(`Bạn có chắc muốn ${actionText} "${product.name}" không?`)) {
        return;
      }
    }

    try {
      setActionLoadingId(product.id);
      await updateAdminProductStatus(product.id, targetStatus, reason);
      alert(`Đã ${actionText} thành công!`);
      await refreshProducts(activeTab, submittedSearch, page);
    } catch (err) {
      alert("Lỗi cập nhật sản phẩm: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setActionLoadingId(null);
    }
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
            Giám sát kho hàng, giá niêm yết và kiểm duyệt sản phẩm của tất cả đối tác gian hàng
          </p>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-base">error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => refreshProducts(activeTab, submittedSearch, page)}
            className="px-2 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto">
          {PRODUCT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, gian hàng..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </form>
      </div>

      {/* Table of Products */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
                    Đang tải danh sách sản phẩm toàn sàn...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary text-sm">
                    Không có sản phẩm nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-surface transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {prod.primaryImageUrl || prod.imageUrl ? (
                          <img
                            src={prod.primaryImageUrl || prod.imageUrl}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover shadow-xs shrink-0 bg-surface-container"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-outline">
                            <span className="material-symbols-outlined text-[20px]">image</span>
                          </div>
                        )}
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
                          {prod.storeName || "Gian hàng #" + (prod.storeId ?? "-")}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-secondary">
                        {prod.categoryName || "Chưa phân loại"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-data-tabular">
                      <span className="font-bold text-primary">
                        {(prod.minPrice ?? 0).toLocaleString("vi-VN")}₫
                      </span>
                      {prod.maxPrice != null && prod.minPrice != null && prod.maxPrice > prod.minPrice && (
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Đang bán
                        </span>
                      )}
                      {prod.status === "INACTIVE" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          Đã ẩn
                        </span>
                      )}
                      {prod.status === "BANNED" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          Đã khóa
                        </span>
                      )}
                      {prod.status !== "ACTIVE" && prod.status !== "INACTIVE" && prod.status !== "BANNED" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {prod.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {prod.slug && (
                          <Link
                            href={`/products/${prod.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container text-xs font-medium transition-colors"
                            title="Xem trang sản phẩm"
                          >
                            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                          </Link>
                        )}
                        <button
                          onClick={() => handleToggleStatus(prod)}
                          disabled={actionLoadingId === prod.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            prod.status === "ACTIVE"
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          } ${actionLoadingId === prod.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {actionLoadingId === prod.id ? (
                            "Đang xử lý..."
                          ) : prod.status === "ACTIVE" ? (
                            <>
                              <span className="material-symbols-outlined text-[14px]">lock</span>
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              <span>Mở bán</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-container-low border-t border-outline-variant/20 text-xs text-secondary">
          <div>
            Hiển thị <span className="font-semibold text-on-surface">{products.length}</span> /{" "}
            <span className="font-semibold text-on-surface">{totalElements}</span> sản phẩm
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed font-medium text-on-surface transition-colors"
            >
              Trang trước
            </button>
            <span className="px-2 font-medium">
              Trang {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed font-medium text-on-surface transition-colors"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
