"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
} from "@/lib/api/admin";

type UserTabKey = "ALL" | "ADMIN" | "SELLER" | "BUYER" | "LOCKED";

const USER_TABS: { key: UserTabKey; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ADMIN", label: "Quản trị viên" },
  { key: "SELLER", label: "Người bán" },
  { key: "BUYER", label: "Người mua" },
  { key: "LOCKED", label: "Bị khóa" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<UserTabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadUsers = useCallback(
    async (tab: UserTabKey, page: number, search: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params: {
          role?: string;
          status?: string;
          search?: string;
          page: number;
          size: number;
        } = {
          page,
          size: pageSize,
        };

        if (tab === "ADMIN" || tab === "SELLER" || tab === "BUYER") {
          params.role = tab;
        } else if (tab === "LOCKED") {
          params.status = "LOCKED";
        }

        if (search.trim()) {
          params.search = search.trim();
        }

        const res = await getAdminUsers(params);
        const items = res.content ?? res.items ?? [];
        setUsers(items);
        setPageNumber(res.pageNumber ?? page);
        setTotalPages(res.totalPages ?? 1);
        setTotalElements(res.totalElements ?? items.length);
      } catch (err) {
        console.error("Lỗi tải người dùng:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách người dùng từ máy chủ"
        );
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      loadUsers(activeTab, pageNumber, searchQuery);
    }, 250);

    return () => clearTimeout(handler);
  }, [activeTab, pageNumber, searchQuery, loadUsers]);

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

    if (
      !confirm(`Bạn có chắc muốn ${actionText} của "${user.fullName}" không?`)
    ) {
      return;
    }

    try {
      setActionLoadingId(user.id);
      await updateAdminUserStatus(
        user.id,
        newStatus,
        newStatus === "LOCKED"
          ? "Admin tạm dừng hoạt động tài khoản"
          : "Admin mở khóa tài khoản"
      );
      alert(`Đã ${actionText} thành công!`);
      await loadUsers(activeTab, pageNumber, searchQuery);
    } catch (err) {
      alert(
        "Lỗi cập nhật người dùng: " +
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
              Quản lý người dùng
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-xs bg-primary-fixed text-on-primary-fixed-variant font-semibold">
              Bảo mật RBAC
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary mt-0.5">
            Quản trị thông tin tài khoản, phân quyền vai trò và kiểm soát trạng
            thái truy cập
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
            onClick={() => loadUsers(activeTab, pageNumber, searchQuery)}
            className="px-3 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto">
          {USER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
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
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-secondary text-sm"
                  >
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-secondary text-sm"
                  >
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
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
                          <img
                            src={avatarSrc}
                            alt={user.fullName}
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
            <span className="font-semibold text-on-surface">{users.length}</span>{" "}
            trên tổng số{" "}
            <span className="font-semibold text-on-surface">
              {totalElements}
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
