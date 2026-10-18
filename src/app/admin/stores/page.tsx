"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  getAdminStores,
  updateAdminStoreStatus,
  type AdminStore,
} from "@/lib/api/admin";

type StoreTabKey = "ALL" | "PENDING" | "APPROVED" | "BANNED";

const STORE_TABS: { key: StoreTabKey; label: string }[] = [
  { key: "ALL", label: "Tất cả gian hàng" },
  { key: "PENDING", label: "Chờ xét duyệt" },
  { key: "APPROVED", label: "Đang hoạt động" },
  { key: "BANNED", label: "Đã tạm dừng / Cấm" },
];

export default function AdminStoresPage() {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [activeTab, setActiveTab] = useState<StoreTabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadStores = useCallback(
    async (tab: StoreTabKey, page: number, search: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await getAdminStores({
          status: tab === "ALL" ? undefined : tab,
          search: search.trim() || undefined,
          page,
          size: pageSize,
        });
        const items = res.content ?? res.items ?? [];
        setStores(items);
        setPageNumber(res.pageNumber ?? page);
        setTotalPages(res.totalPages ?? 1);
        setTotalElements(res.totalElements ?? items.length);
      } catch (err) {
        console.error("Lỗi tải gian hàng:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách gian hàng từ máy chủ"
        );
        setStores([]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      loadStores(activeTab, pageNumber, searchQuery);
    }, 250);

    return () => clearTimeout(handler);
  }, [activeTab, pageNumber, searchQuery, loadStores]);

  const handleTabChange = (tab: StoreTabKey) => {
    setActiveTab(tab);
    setPageNumber(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPageNumber(0);
  };

  async function handleUpdateStatus(
    storeId: number,
    newStatus: "APPROVED" | "BANNED"
  ) {
    const actionText = newStatus === "APPROVED" ? "phê duyệt" : "khóa";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} gian hàng này không?`)) {
      return;
    }

    try {
      setActionLoadingId(storeId);
      await updateAdminStoreStatus(storeId, newStatus);
      alert(`Đã ${actionText} gian hàng thành công!`);
      await loadStores(activeTab, pageNumber, searchQuery);
    } catch (err) {
      alert(
        "Lỗi cập nhật gian hàng: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col w-full gap-space-lg select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Quản lý gian hàng
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-xs bg-primary-fixed text-on-primary-fixed-variant font-semibold">
              B2C Marketplace
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary mt-0.5">
            Xét duyệt hồ sơ mở shop, quản lý tình trạng kinh doanh và xếp hạng
            đối tác bán hàng
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => loadStores(activeTab, pageNumber, searchQuery)}
            className="px-3 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STORE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.key && totalElements > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface text-[10px] font-bold">
                  {totalElements}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm theo tên shop, chủ shop, SĐT..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Table of Stores */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-secondary font-label-sm text-xs uppercase border-b border-outline-variant/20">
                <th className="py-3 px-4">Gian hàng</th>
                <th className="py-3 px-4">Chủ sở hữu & Liên hệ</th>
                <th className="py-3 px-4 text-center">Sản phẩm</th>
                <th className="py-3 px-4 text-center">Đơn hàng</th>
                <th className="py-3 px-4 text-center">Đánh giá</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-secondary text-sm"
                  >
                    Đang tải danh sách gian hàng...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-secondary text-sm"
                  >
                    Không có gian hàng nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                stores.map((store) => {
                  const avatarSrc =
                    store.avatarUrl ||
                    store.logoUrl ||
                    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=60";
                  const storeTitle = store.name || store.storeName;
                  const owner = store.ownerName || store.ownerFullName || "Chưa cập nhật";
                  const phone = store.phone || store.ownerPhone || "—";
                  const pCount = store.productsCount ?? store.totalProducts ?? 0;
                  const oCount = store.ordersCount ?? store.totalOrders ?? 0;
                  const rating = store.ratingAvg ?? 0;
                filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-surface transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={store.avatarUrl}
                          alt={store.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover shadow-xs shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-on-surface truncate">
                            {store.name}
                          </span>
                          <span className="text-xs text-secondary truncate">
                            {store.legalName || "Cá nhân kinh doanh"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface">{store.ownerName}</span>
                        <span className="text-xs text-secondary">{store.phone}</span>
                        <span className="text-xs text-outline">{store.ownerEmail}</span>
                      </div>
                    </td>

                  return (
                    <tr
                      key={store.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarSrc}
                            alt={storeTitle}
                            className="w-10 h-10 rounded-full object-cover shadow-xs shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-on-surface truncate">
                              {storeTitle}
                            </span>
                            <span className="text-xs text-secondary truncate">
                              {store.legalName || "Cá nhân kinh doanh"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">
                            {owner}
                          </span>
                          <span className="text-xs text-secondary">
                            {phone}
                          </span>
                          <span className="text-xs text-outline">
                            {store.ownerEmail}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-data-tabular">
                        <span className="font-semibold text-on-surface">
                          {pCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-data-tabular">
                        <span className="font-semibold text-on-surface">
                          {oCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {rating > 0 ? (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-[14px]">
                              star
                            </span>
                            <span>{rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-secondary">
                            Chưa có
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {store.status === "APPROVED" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Đang bán
                          </span>
                        )}
                        {store.status === "PENDING" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Chờ duyệt
                          </span>
                        )}
                        {(store.status === "BANNED" ||
                          store.status === "SUSPENDED") && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {store.status === "PENDING" && (
                            <button
                              type="button"
                              disabled={actionLoadingId === store.id}
                              onClick={() =>
                                handleUpdateStatus(store.id, "APPROVED")
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                            >
                              {actionLoadingId === store.id
                                ? "Đang xử lý..."
                                : "Duyệt shop"}
                            </button>
                          )}

                          {store.status === "APPROVED" && (
                            <button
                              type="button"
                              disabled={actionLoadingId === store.id}
                              onClick={() =>
                                handleUpdateStatus(store.id, "BANNED")
                              }
                              className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              Khóa shop
                            </button>
                          )}

                          {(store.status === "BANNED" ||
                            store.status === "SUSPENDED") && (
                            <button
                              type="button"
                              disabled={actionLoadingId === store.id}
                              onClick={() =>
                                handleUpdateStatus(store.id, "APPROVED")
                              }
                              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                            >
                              Mở khóa
                            </button>
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
        <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low/50 border-t border-outline-variant/20 text-xs text-secondary">
          <div>
            Hiển thị{" "}
            <span className="font-semibold text-on-surface">
              {stores.length}
            </span>{" "}
            trên tổng số{" "}
            <span className="font-semibold text-on-surface">
              {totalElements}
            </span>{" "}
            gian hàng
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageNumber === 0 || isLoading}
              onClick={() => setPageNumber((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Trang trước
            </button>
            <span className="px-2">
              Trang {totalPages > 0 ? pageNumber + 1 : 1} / {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={pageNumber >= totalPages - 1 || isLoading}
              onClick={() =>
                setPageNumber((prev) => Math.min(totalPages - 1, prev + 1))
              }
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
