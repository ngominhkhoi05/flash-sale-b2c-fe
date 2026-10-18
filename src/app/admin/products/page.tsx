"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdminProducts,
  type AdminProduct,
} from "@/lib/api/admin";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  async function loadProducts() {
    try {
      setIsLoading(true);
      const params = activeTab === "ALL" ? undefined : { status: activeTab };
      const data = await getAdminProducts(params);
      setProducts(data);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.storeName.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
    );
  });

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
            Giám sát kho hàng, giá niêm yết và tình trạng phân phối sản phẩm của tất cả đối tác
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: "ALL", label: "Tất cả sản phẩm" },
            { key: "ACTIVE", label: "Đang mở bán" },
            { key: "INACTIVE", label: "Đã tạm ẩn" },
            { key: "OUT_OF_STOCK", label: "Hết hàng" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
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

        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, gian hàng, ngành..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
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
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary text-sm">
                    Không có sản phẩm nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-surface transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.primaryImageUrl}
                          alt={prod.name}
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Đang bán
                        </span>
                      )}
                      {prod.status === "INACTIVE" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          Đã ẩn
                        </span>
                      )}
                      {prod.status === "OUT_OF_STOCK" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          Hết hàng
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/products/${prod.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-xs font-semibold transition-colors"
                      >
                        <span>Xem trang</span>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
