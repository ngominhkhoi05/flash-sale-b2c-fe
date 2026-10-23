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
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const refreshStores = useCallback(async (tab: StoreTabKey) => {
    try {
      setIsLoading(true);
      const data = await getAdminStores(tab === "ALL" ? undefined : tab);
      setStores(data);
    } catch (err) {
      console.error("Lỗi tải gian hàng:", err);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      setIsLoading(true);
    }, 0);
    getAdminStores(activeTab === "ALL" ? undefined : activeTab)
      .then((data) => {
        if (isMounted) {
          setStores(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải gian hàng:", err);
        if (isMounted) {
          setStores([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeTab]);


  async function handleUpdateStatus(storeId: number, newStatus: "APPROVED" | "BANNED") {
    const actionText = newStatus === "APPROVED" ? "phê duyệt" : "khóa";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} gian hàng này không?`)) {
      return;
    }

    try {
      setActionLoadingId(storeId);
      await updateAdminStoreStatus(storeId, newStatus);
      alert(`Đã ${actionText} gian hàng thành công!`);
      await refreshStores(activeTab);
    } catch (err) {
      alert("Lỗi cập nhật gian hàng: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setActionLoadingId(null);
    }
  }

  const storeList = Array.isArray(stores) ? stores : [];
  const filteredStores = storeList.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.legalName && s.legalName.toLowerCase().includes(q))
    );
  });

  const pendingCount = storeList.filter((s) => s.status === "PENDING").length;

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
            Xét duyệt hồ sơ mở shop, quản lý tình trạng kinh doanh và xếp hạng đối tác bán hàng
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STORE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span>{tab.label}</span>
              {tab.key === "PENDING" && pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold">
                  {pendingCount}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên shop, chủ shop, SĐT..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Table of Stores */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
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
                  <td colSpan={7} className="py-12 text-center text-secondary text-sm">
                    Đang tải danh sách gian hàng...
                  </td>
                </tr>
              ) : filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary text-sm">
                    Không có gian hàng nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-surface transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={
                            store.avatarUrl ||
                            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=60"
                          }
                          alt={store.name || "Store"}
                          width={40}
                          height={40}
                          unoptimized
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

                    <td className="py-3 px-4 text-center font-data-tabular">
                      <span className="font-semibold text-on-surface">{store.productsCount}</span>
                    </td>

                    <td className="py-3 px-4 text-center font-data-tabular">
                      <span className="font-semibold text-on-surface">{store.ordersCount}</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {store.ratingAvg > 0 ? (
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>{store.ratingAvg.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-secondary">Chưa có</span>
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
                      {store.status === "BANNED" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          Đã cấm
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {store.status === "PENDING" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === store.id}
                            onClick={() => handleUpdateStatus(store.id, "APPROVED")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                          >
                            {actionLoadingId === store.id ? "Đang xử lý..." : "Duyệt shop"}
                          </button>
                        )}

                        {store.status === "APPROVED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === store.id}
                            onClick={() => handleUpdateStatus(store.id, "BANNED")}
                            className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Khóa shop
                          </button>
                        )}

                        {store.status === "BANNED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === store.id}
                            onClick={() => handleUpdateStatus(store.id, "APPROVED")}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                          >
                            Mở khóa
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
      </div>
    </div>
  );
}
