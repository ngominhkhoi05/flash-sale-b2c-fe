"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  updateAdminStoreStatus,
  type AdminStore,
} from "@/lib/api/admin";
import { useAdminStoresQuery } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";

type StoreTabKey = "ALL" | "PENDING" | "APPROVED" | "BANNED" | "REJECTED";

const STORE_TABS: { key: StoreTabKey; label: string }[] = [
  { key: "ALL", label: "Tất cả gian hàng" },
  { key: "PENDING", label: "Chờ xét duyệt" },
  { key: "APPROVED", label: "Đang hoạt động" },
  { key: "BANNED", label: "Đã tạm dừng" },
  { key: "REJECTED", label: "Đã từ chối" },
];

interface ActionModalState {
  isOpen: boolean;
  store: AdminStore | null;
  targetStatus: "APPROVED" | "BANNED" | "REJECTED";
  reason: string;
}

export default function AdminStoresPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StoreTabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal xác nhận thao tác giữa màn hình
  const [actionModal, setActionModal] = useState<ActionModalState>({
    isOpen: false,
    store: null,
    targetStatus: "APPROVED",
    reason: "",
  });

  const { data: rawStores = [], isLoading, isFetching, refetch } = useAdminStoresQuery(undefined);

  const [localStores, setLocalStores] = useState<AdminStore[] | null>(null);
  const stores = localStores ?? rawStores;

  useEffect(() => {
    setLocalStores(null);
  }, [rawStores]);

  const handleTabClick = (tabKey: StoreTabKey) => {
    setActiveTab(tabKey);
  };

  // Mở hộp thoại xác nhận giữa màn hình
  const openConfirmModal = (
    store: AdminStore,
    targetStatus: "APPROVED" | "BANNED" | "REJECTED"
  ) => {
    setActionModal({
      isOpen: true,
      store,
      targetStatus,
      reason: "",
    });
  };

  const closeConfirmModal = () => {
    setActionModal({
      isOpen: false,
      store: null,
      targetStatus: "APPROVED",
      reason: "",
    });
  };

  // Xác nhận thực hiện thao tác (Phản hồi tức thì 0ms)
  function handleConfirmAction() {
    if (!actionModal.store) return;
    const { store, targetStatus, reason } = actionModal;

    let actionLabel = "phê duyệt";
    if (targetStatus === "REJECTED") actionLabel = "từ chối";
    else if (targetStatus === "BANNED") actionLabel = "khóa";
    else if (targetStatus === "APPROVED") {
      actionLabel = store.status === "BANNED" ? "mở khóa" : "phê duyệt";
    }

    // 1. Đóng modal ngay lập tức
    closeConfirmModal();

    // 2. BẬT THÔNG BÁO THÀNH CÔNG NGAY LẬP TỨC (0ms)
    toast.success(`Đã ${actionLabel} gian hàng "${store.name}" thành công!`);

    // 3. Cập nhật state ngay lập tức (Optimistic update)
    const updatedStore: AdminStore = { ...store, status: targetStatus };
    setLocalStores((prev) => {
      const base = prev ?? rawStores;
      return base.map((s) => (s.id === store.id ? updatedStore : s));
    });

    // 4. Đồng bộ ngầm với máy chủ và invalidate React Query Cache
    updateAdminStoreStatus(store.id, targetStatus, reason.trim() || undefined)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
      })
      .catch((err) => {
        console.error("Lỗi cập nhật gian hàng:", err);
        toast.error(
          "Lỗi đồng bộ máy chủ: " + (err instanceof Error ? err.message : String(err))
        );
        void refetch();
      });
  }

  const storeList = Array.isArray(stores) ? stores : [];

  // Tính số lượng gian hàng cho từng tab ngay lập tức (0ms)
  const tabCounts = useMemo(() => {
    const counts: Record<StoreTabKey, number> = {
      ALL: storeList.length,
      PENDING: 0,
      APPROVED: 0,
      BANNED: 0,
      REJECTED: 0,
    };
    for (const s of storeList) {
      if (s.status === "PENDING") counts.PENDING++;
      else if (s.status === "APPROVED") counts.APPROVED++;
      else if (s.status === "BANNED") counts.BANNED++;
      else if (s.status === "REJECTED") counts.REJECTED++;
    }
    return counts;
  }, [storeList]);

  // Bộ lọc siêu tốc 0ms: Lọc tức thì theo Tab và Tìm kiếm
  const filteredStores = useMemo(() => {
    return storeList.filter((s) => {
      if (activeTab !== "ALL" && s.status !== activeTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.legalName && s.legalName.toLowerCase().includes(q))
      );
    });
  }, [storeList, activeTab, searchQuery]);

  const pendingCount = tabCounts.PENDING;

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
            Xét duyệt hồ sơ mở shop, quản lý tình trạng kinh doanh và kiểm soát chất lượng đối tác
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STORE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${activeTab === tab.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
            >
              <span>{tab.label}</span>
              {tab.key === "PENDING" && pendingCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              ) : tabCounts[tab.key] > 0 ? (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key
                      ? "bg-white/20 text-on-primary"
                      : "bg-surface-container text-secondary"
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              ) : null}
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
            placeholder="Tìm theo tên shop, chủ shop, SĐT... (0ms)"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
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
                filteredStores.map((store: AdminStore) => (
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Đang bán
                        </span>
                      )}
                      {store.status === "PENDING" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Chờ duyệt
                        </span>
                      )}
                      {store.status === "BANNED" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          Đã cấm
                        </span>
                      )}
                      {store.status === "REJECTED" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                          Đã từ chối
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {store.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoadingId === store.id}
                              onClick={() => openConfirmModal(store, "APPROVED")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                            >
                              Duyệt shop
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === store.id}
                              onClick={() => openConfirmModal(store, "REJECTED")}
                              className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </>
                        )}

                        {store.status === "APPROVED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === store.id}
                            onClick={() => openConfirmModal(store, "BANNED")}
                            className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Khóa shop
                          </button>
                        )}

                        {store.status === "BANNED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === store.id}
                            onClick={() => openConfirmModal(store, "APPROVED")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                          >
                            Mở khóa
                          </button>
                        )}

                        {store.status === "REJECTED" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === store.id}
                            onClick={() => openConfirmModal(store, "APPROVED")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                          >
                            Xét duyệt lại
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

      {/* ============================================================ */}
      {/* MODAL XÁC NHẬN THAO TÁC NẰM GIỮA MÀN HÌNH (CENTERED DIALOG) */}
      {/* ============================================================ */}
      {actionModal.isOpen && actionModal.store && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 flex flex-col gap-4">
            {/* Header Icon + Tiêu đề */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${actionModal.targetStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : actionModal.targetStatus === "REJECTED"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {actionModal.targetStatus === "APPROVED"
                    ? "check_circle"
                    : actionModal.targetStatus === "REJECTED"
                      ? "cancel"
                      : "block"}
                </span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">
                  {actionModal.targetStatus === "APPROVED"
                    ? actionModal.store.status === "BANNED"
                      ? "Xác nhận mở khóa gian hàng"
                      : "Phê duyệt hồ sơ gian hàng"
                    : actionModal.targetStatus === "REJECTED"
                      ? "Từ chối hồ sơ gian hàng"
                      : "Xác nhận khóa gian hàng"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng kiểm tra kỹ thông tin trước khi thực hiện
                </p>
              </div>
            </div>

            {/* Thông tin tóm tắt gian hàng */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tên gian hàng:</span>
                <span className="font-bold text-slate-900">{actionModal.store.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chủ gian hàng:</span>
                <span className="font-semibold text-slate-800">{actionModal.store.ownerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono text-slate-700">{actionModal.store.phone}</span>
              </div>
              {actionModal.store.ownerEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-700">{actionModal.store.ownerEmail}</span>
                </div>
              )}
            </div>

            {/* Cảnh báo hậu quả thao tác */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {actionModal.targetStatus === "APPROVED" && (
                <>
                  Gian hàng sẽ được chuyển sang trạng thái <strong>Đang bán</strong>, chủ shop sẽ được kích hoạt quyền <strong>Người bán (Seller)</strong> để bắt đầu đăng sản phẩm.
                </>
              )}
              {actionModal.targetStatus === "REJECTED" && (
                <>
                  Hồ sơ mở gian hàng sẽ bị <strong>từ chối</strong>. Người bán sẽ nhận được thông báo phản hồi lý do để chỉnh sửa lại thông tin đăng ký.
                </>
              )}
              {actionModal.targetStatus === "BANNED" && (
                <>
                  Gian hàng sẽ bị <strong>tạm ngừng kinh doanh</strong> ngay lập tức. Toàn bộ sản phẩm của gian hàng sẽ bị ẩn khỏi sàn thương mại điện tử.
                </>
              )}
            </p>

            {/* Nhập lý do nếu là thao tác TỪ CHỐI */}
            {actionModal.targetStatus === "REJECTED" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Lý do từ chối</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tùy chọn</span>
                </label>
                <textarea
                  rows={3}
                  value={actionModal.reason}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Nhập lý do từ chối gửi cho người bán (VD: Thông tin CMND/CCCD chưa khớp, giấy phép kinh doanh mờ...)"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {[
                    "Hồ sơ pháp lý chưa đầy đủ",
                    "Thông tin liên hệ không chính xác",
                    "Vi phạm điều khoản đăng ký",
                  ].map((sug) => (
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
            )}

            {/* Nút hành động Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoadingId !== null}
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm disabled:opacity-60 active:scale-95 ${actionModal.targetStatus === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                  }`}
              >
                {actionLoadingId !== null
                  ? "Đang xử lý..."
                  : actionModal.targetStatus === "APPROVED"
                    ? "Xác nhận duyệt"
                    : actionModal.targetStatus === "REJECTED"
                      ? "Xác nhận từ chối"
                      : "Xác nhận khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
