"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  updateAdminUserStatus,
  type AdminUser,
} from "@/lib/api/admin";
import {
  useAdminUsersQuery,
  ADMIN_QUERY_KEYS,
} from "@/hooks/useAdminQueries";

type UserTabKey = "ALL" | "ADMIN" | "SELLER" | "BUYER" | "LOCKED";

const USER_TABS: { key: UserTabKey; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ADMIN", label: "Quản trị viên" },
  { key: "SELLER", label: "Người bán" },
  { key: "BUYER", label: "Người mua" },
  { key: "LOCKED", label: "Bị khóa" },
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<UserTabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const pageSize = 10;
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Nạp 100 người dùng một lần và lưu vào React Query Cache để toàn bộ bộ lọc phản hồi TỨC THÌ 0ms!
  const {
    data: pageData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminUsersQuery({
    page: 0,
    size: 100,
  });

  const rawUsers: AdminUser[] = useMemo(() => {
    return pageData?.content ?? pageData?.items ?? [];
  }, [pageData]);

  const [localUsers, setLocalUsers] = useState<AdminUser[] | null>(null);
  const allUsers = localUsers ?? rawUsers;

  // Tính số lượng người dùng cho từng tab ngay lập tức (0ms)
  const tabCounts = useMemo(() => {
    const counts: Record<UserTabKey, number> = {
      ALL: allUsers.length,
      ADMIN: 0,
      SELLER: 0,
      BUYER: 0,
      LOCKED: 0,
    };
    for (const u of allUsers) {
      if (u.status === "LOCKED") counts.LOCKED++;
      const role = u.role || (u.roles && u.roles[0]) || "BUYER";
      if (role === "ADMIN") counts.ADMIN++;
      else if (role === "SELLER") counts.SELLER++;
      else if (role === "BUYER") counts.BUYER++;
    }
    return counts;
  }, [allUsers]);

  // Bộ lọc siêu tốc 0ms: Lọc tức thì theo Tab và Tìm kiếm theo từng ký tự gõ
  const filteredUsers = useMemo(() => {
    let list = allUsers;

    // 1. Lọc theo Tab
    if (activeTab === "ADMIN") {
      list = list.filter((u) => u.role === "ADMIN" || u.roles?.includes("ADMIN"));
    } else if (activeTab === "SELLER") {
      list = list.filter((u) => u.role === "SELLER" || u.roles?.includes("SELLER"));
    } else if (activeTab === "BUYER") {
      list = list.filter((u) => u.role === "BUYER" || (!u.role && !u.roles?.length));
    } else if (activeTab === "LOCKED") {
      list = list.filter((u) => u.status === "LOCKED");
    }

    // 2. Lọc theo Tìm kiếm tức thì
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q)) ||
          String(u.id).includes(q)
      );
    }

    return list;
  }, [allUsers, activeTab, searchQuery]);

  const totalFiltered = filteredUsers.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;

  // Cắt trang an toàn 0ms
  const paginatedUsers = useMemo(() => {
    const safePage = Math.min(pageNumber, Math.max(0, totalPages - 1));
    const start = safePage * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageNumber, pageSize, totalPages]);

  const handleTabChange = (tab: UserTabKey) => {
    setActiveTab(tab);
    setPageNumber(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPageNumber(0);
  };

  async function handleToggleLock(user: AdminUser) {
    const newStatus = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    const actionText =
      newStatus === "LOCKED" ? "khóa tài khoản" : "mở khóa tài khoản";

    // 1. Phản hồi Toast NGAY LẬP TỨC (0ms)
    toast.success(`Đã ${actionText} của "${user.fullName}" thành công!`);
    setActionLoadingId(user.id);

    // 2. Cập nhật lạc quan (Optimistic Update) trong local state và React Query cache để UI đổi ngay 0ms
    const updatedUser: AdminUser = { ...user, status: newStatus };
    setLocalUsers((prev) => {
      const base = prev ?? rawUsers;
      return base.map((u) => (u.id === user.id ? updatedUser : u));
    });

    queryClient.setQueryData(
      ADMIN_QUERY_KEYS.users(0, "", "ALL", "ALL"),
      (old: import("@/types/api").PageResponse<AdminUser> | undefined) => {
        if (!old) return old;
        const currentItems = old.content ?? old.items ?? [];
        const nextItems = currentItems.map((u) =>
          u.id === user.id ? updatedUser : u
        );
        return {
          ...old,
          content: nextItems,
          items: nextItems,
        };
      }
    );

    // 3. Đồng bộ ngầm với máy chủ BE
    try {
      await updateAdminUserStatus(
        user.id,
        newStatus as "ACTIVE" | "LOCKED",
        newStatus === "LOCKED"
          ? "Admin tạm dừng hoạt động tài khoản"
          : "Admin mở khóa tài khoản"
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err) {
      console.error("Lỗi cập nhật người dùng máy chủ:", err);
      toast.error(
        "Lỗi cập nhật máy chủ: " +
          (err instanceof Error ? err.message : String(err))
      );
      void refetch();
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
              Quản lý người dùng
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-xs bg-primary-fixed text-on-primary-fixed-variant font-semibold">
              Bảo mật RBAC
            </span>
            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-full animate-pulse">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Realtime Sync
              </span>
            )}
          </div>
          <p className="font-body-sm text-xs text-secondary mt-0.5">
            Quản trị thông tin tài khoản, phân quyền vai trò và kiểm soát trạng thái truy cập
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              error
            </span>
            <span>
              {error instanceof Error
                ? error.message
                : "Không thể kết nối máy chủ quản trị người dùng"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs & Search Filter – Bộ lọc phản hồi TỨC THÌ 0ms */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto">
          {USER_TABS.map((tab) => {
            const count = tabCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab.key
                        ? "bg-white/20 text-on-primary"
                        : "bg-surface-container text-secondary"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm theo tên, email, SĐT... (0ms)"
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

      {/* Table of Users */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-secondary font-label-sm text-xs uppercase border-b border-outline-variant/20">
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Email & Liên hệ</th>
                <th className="py-3 px-4 text-center">Vai trò</th>
                <th className="py-3 px-4 text-center">Đơn hàng</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {isLoading && allUsers.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container shrink-0" />
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="h-3.5 bg-surface-container rounded w-24" />
                          <div className="h-2.5 bg-surface-container-high rounded w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 w-36">
                        <div className="h-3.5 bg-surface-container rounded w-32" />
                        <div className="h-2.5 bg-surface-container-high rounded w-20" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-5 w-20 bg-surface-container rounded-full mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-4 w-6 bg-surface-container rounded mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-5 w-16 bg-surface-container rounded-full mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-7 w-20 bg-surface-container rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-secondary text-sm"
                  >
                    Không tìm thấy người dùng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const avatarSrc =
                    user.avatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60";
                  const oCount = user.ordersCount ?? 0;
                  const roleStr = user.role || "BUYER";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={avatarSrc}
                            alt={user.fullName || "User"}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-10 h-10 rounded-full object-cover shadow-xs shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-on-surface truncate">
                              {user.fullName}
                            </span>
                            <span className="text-xs text-secondary truncate">
                              ID: USR-{user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">
                            {user.email}
                          </span>
                          <span className="text-xs text-secondary">
                            {user.phone || "Chưa cập nhật SĐT"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {roleStr === "ADMIN" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                            Super Admin
                          </span>
                        )}
                        {roleStr === "SELLER" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Người bán
                          </span>
                        )}
                        {roleStr === "BUYER" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-secondary">
                            Khách hàng
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-data-tabular">
                        <span className="font-semibold text-on-surface">
                          {oCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {user.status === "ACTIVE" ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {roleStr !== "ADMIN" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === user.id}
                            onClick={() => handleToggleLock(user)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                              user.status === "ACTIVE"
                                ? "text-rose-600 hover:bg-rose-50"
                                : "bg-primary text-white hover:bg-primary-container"
                            }`}
                          >
                            {actionLoadingId === user.id
                              ? "Đang xử lý..."
                              : user.status === "ACTIVE"
                              ? "Khóa tài khoản"
                              : "Mở khóa"}
                          </button>
                        )}
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
            <span className="font-semibold text-on-surface">{paginatedUsers.length}</span>{" "}
            trên tổng số{" "}
            <span className="font-semibold text-on-surface">
              {totalFiltered}
            </span>{" "}
            người dùng
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
