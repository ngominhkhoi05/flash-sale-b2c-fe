"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import {
  getSellerStaff,
  getSellerRoleSummaries,
  inviteSellerStaff,
  updateSellerStaffRole,
  toggleLockSellerStaff,
  deleteSellerStaff,
} from "@/lib/api/seller";
import type {
  SellerStaffMember,
  SellerRoleSummary,
  SellerStaffRole,
} from "@/types/seller";
import { toast } from "sonner";

export default function SellerStaffPage() {
  const [staffList, setStaffList] = useState<SellerStaffMember[]>([]);
  const [roleSummaries, setRoleSummaries] = useState<SellerRoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Active dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<SellerStaffRole>("WAREHOUSE_MANAGER");

  // Edit Role Modal
  const [editingStaff, setEditingStaff] = useState<SellerStaffMember | null>(null);
  const [editRole, setEditRole] = useState<SellerStaffRole>("WAREHOUSE_MANAGER");

  // Delete / Remove Modal
  const [deletingStaff, setDeletingStaff] = useState<SellerStaffMember | null>(null);

  const [isPending, startTransition] = useTransition();

  // Load staff & roles
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [staffData, rolesData] = await Promise.all([
          getSellerStaff(),
          getSellerRoleSummaries(),
        ]);
        if (!cancelled) {
          setStaffList(staffData);
          setRoleSummaries(rolesData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách nhân viên. Vui lòng thử lại sau."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [reloadTrigger]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(".action-menu-trigger") &&
        !(e.target as HTMLElement).closest(".action-dropdown-menu")
      ) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  // Filter staff by search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  // Handler: Invite Staff
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Vui lòng nhập email nhân viên");
      return;
    }

    startTransition(async () => {
      try {
        const newStaff = await inviteSellerStaff({
          email: inviteEmail.trim(),
          role: inviteRole,
        });
        toast.success(`Đã gửi email lời mời đến ${inviteEmail}`);
        setStaffList((prev) => [...prev, newStaff]);
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteRole("WAREHOUSE_MANAGER");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gửi lời mời thất bại"
        );
      }
    });
  };

  // Handler: Update Role
  const handleUpdateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    startTransition(async () => {
      try {
        await updateSellerStaffRole(editingStaff.id, { role: editRole });
        toast.success(`Đã cập nhật nhóm quyền cho ${editingStaff.name}`);
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === editingStaff.id
              ? {
                  ...s,
                  role: editRole,
                  roleLabel:
                    editRole === "WAREHOUSE_MANAGER"
                      ? "Quản lý kho"
                      : editRole === "ACCOUNTANT"
                      ? "Kế toán đối soát"
                      : "Vận hành Flash Sale",
                }
              : s
          )
        );
        setEditingStaff(null);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Cập nhật quyền thất bại"
        );
      }
    });
  };

  // Handler: Toggle Lock / Unlock
  const handleToggleLock = (staff: SellerStaffMember) => {
    setOpenDropdownId(null);
    const newStatus = staff.status === "LOCKED" ? "ACTIVE" : "LOCKED";
    startTransition(async () => {
      try {
        await toggleLockSellerStaff(staff.id, newStatus);
        toast.success(
          newStatus === "LOCKED"
            ? `Đã tạm khóa tài khoản ${staff.name}`
            : `Đã mở khóa tài khoản ${staff.name}`
        );
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, status: newStatus } : s))
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Thay đổi trạng thái thất bại"
        );
      }
    });
  };

  // Handler: Delete / Cancel Invite
  const handleDeleteSubmit = () => {
    if (!deletingStaff) return;

    startTransition(async () => {
      try {
        await deleteSellerStaff(deletingStaff.id);
        toast.success(
          deletingStaff.status === "PENDING_INVITE"
            ? `Đã hủy lời mời cho ${deletingStaff.email}`
            : `Đã xóa nhân viên ${deletingStaff.name} khỏi shop`
        );
        setStaffList((prev) => prev.filter((s) => s.id !== deletingStaff.id));
        setDeletingStaff(null);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Thao tác xóa thất bại"
        );
      }
    });
  };

  // Handler: Resend Invite
  const handleResendInvite = (staff: SellerStaffMember) => {
    setOpenDropdownId(null);
    toast.success(`Đã gửi lại email lời mời kích hoạt đến ${staff.email}`);
  };

  // Helper: Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper: Avatar color by role
  const getAvatarBg = (role: SellerStaffRole) => {
    switch (role) {
      case "OWNER":
        return "bg-indigo-100 text-indigo-700";
      case "WAREHOUSE_MANAGER":
        return "bg-sky-100 text-sky-700";
      case "ACCOUNTANT":
        return "bg-emerald-100 text-emerald-700";
      case "FLASH_SALE_OPERATOR":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Helper: Role badge styling
  const getRoleBadge = (role: SellerStaffRole, roleLabel: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-semibold text-xs">
            <span className="material-symbols-outlined text-[14px]">shield_person</span>
            {roleLabel}
          </span>
        );
      case "WAREHOUSE_MANAGER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-semibold text-xs">
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
            {roleLabel}
          </span>
        );
      case "ACCOUNTANT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-xs">
            <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
            {roleLabel}
          </span>
        );
      case "FLASH_SALE_OPERATOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-semibold text-xs">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            {roleLabel}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Cài đặt phân quyền
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-emerald-700 font-medium">
                Bảo mật đa tầng
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Nhân viên &amp; phân quyền
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Chủ shop mời nhân viên tham gia vận hành gian hàng và phân quyền
              truy cập theo từng nghiệp vụ chuyên biệt
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>+ Mời nhân viên mới</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={() => setReloadTrigger((prev) => prev + 1)}
              className="px-3 py-1 bg-white border border-red-300 rounded-md text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 2. Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleSummaries.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role.color === "sky"
                        ? "bg-sky-50 text-sky-700"
                        : role.color === "emerald"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">
                      {role.icon}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                    {role.memberCount} thành viên
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {role.roleName}
                  </h3>
                  <p className="text-xs text-slate-500">{role.description}</p>
                </div>
                <div className="mt-4 pt-2 flex flex-wrap gap-1.5">
                  {role.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-slate-100 text-slate-700"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-2 flex items-center justify-between text-slate-500 border-t border-slate-50">
                <span className="text-xs text-slate-400">
                  {role.permissions.length} quyền cấp phép
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                  Chi tiết nhóm{" "}
                  <span className="material-symbols-outlined text-[14px]">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Table of Shop Members */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Toolbar Filter / Search */}
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email nhân viên..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500">
                Tổng số:{" "}
                <strong className="text-slate-900 font-semibold">
                  {filteredStaff.length}
                </strong>{" "}
                tài khoản
              </span>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[840px]">
              <thead>
                <tr className="h-11 bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 font-semibold">Nhân viên</th>
                  <th className="px-4 font-semibold">Nhóm quyền / Vai trò</th>
                  <th className="px-4 font-semibold">Trạng thái</th>
                  <th className="px-4 font-semibold">Ngày thêm</th>
                  <th className="px-6 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-3xl text-emerald-600">
                          progress_activity
                        </span>
                        <span>Đang tải danh sách nhân viên...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-slate-300">
                          group_off
                        </span>
                        <p className="font-medium text-slate-600">
                          Không tìm thấy nhân viên nào phù hợp
                        </p>
                        <p className="text-xs text-slate-400">
                          Thử tìm kiếm với từ khóa khác hoặc mời nhân viên mới
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className="h-14 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Cột 1: Nhân viên */}
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarBg(
                              staff.role
                            )}`}
                          >
                            {getInitials(staff.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 truncate">
                                {staff.name}
                              </span>
                              {staff.role === "OWNER" && (
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                  Chủ gian hàng
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 truncate">
                              {staff.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Nhóm quyền / Vai trò */}
                      <td className="px-4 py-2">
                        {getRoleBadge(staff.role, staff.roleLabel)}
                      </td>

                      {/* Cột 3: Trạng thái */}
                      <td className="px-4 py-2">
                        {staff.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Đang hoạt động
                          </span>
                        ) : staff.status === "PENDING_INVITE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Chờ chấp nhận lời mời
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Tạm khóa quyền
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Ngày thêm */}
                      <td className="px-4 py-2 text-xs font-mono text-slate-500">
                        {staff.addedAt}
                      </td>

                      {/* Cột 5: Hành động */}
                      <td className="px-6 py-2 text-right relative">
                        {staff.role === "OWNER" ? (
                          <span className="text-xs text-slate-400 italic">
                            Chủ sở hữu
                          </span>
                        ) : (
                          <div className="inline-block relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(
                                  openDropdownId === staff.id ? null : staff.id
                                );
                              }}
                              className="action-menu-trigger w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                more_horiz
                              </span>
                            </button>

                            {openDropdownId === staff.id && (
                              <div className="action-dropdown-menu absolute right-0 top-9 w-44 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-30 text-left">
                                {staff.status === "PENDING_INVITE" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleResendInvite(staff)}
                                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                                        send
                                      </span>
                                      Gửi lại lời mời
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setEditingStaff(staff);
                                        setEditRole(staff.role);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                                        edit
                                      </span>
                                      Đổi nhóm quyền
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setDeletingStaff(staff);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        cancel
                                      </span>
                                      Hủy lời mời
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setEditingStaff(staff);
                                        setEditRole(staff.role);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                                        edit
                                      </span>
                                      Đổi nhóm quyền
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleLock(staff)}
                                      className="w-full px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        {staff.status === "LOCKED"
                                          ? "lock_open"
                                          : "lock_clock"}
                                      </span>
                                      {staff.status === "LOCKED"
                                        ? "Mở khóa quyền"
                                        : "Tạm khóa quyền"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setDeletingStaff(staff);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        person_remove
                                      </span>
                                      Xóa khỏi shop
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination / Footer Table Note */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
            <span>
              Hiển thị 1 - {filteredStaff.length} của {filteredStaff.length} nhân viên
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-8 h-8 rounded flex items-center justify-center text-slate-300 cursor-not-allowed"
                disabled
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>
              <span className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 font-semibold flex items-center justify-center">
                1
              </span>
              <button
                type="button"
                className="w-8 h-8 rounded flex items-center justify-center text-slate-300 cursor-not-allowed"
                disabled
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

      {/* 4. Modal Popup: Mời nhân viên mới */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    person_add
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Mời nhân viên tham gia quản lý
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleInviteSubmit}>
              <div className="p-6 space-y-5">
                {/* Field 1: Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-900">
                    Địa chỉ Email nhân viên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-slate-400">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="nhanvien@email.com"
                      className="w-full h-10 pl-10 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">
                      info
                    </span>
                    Lời mời sẽ được gửi qua email để nhân viên kích hoạt tài khoản
                  </p>
                </div>

                {/* Field 2: Radio Role Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Chọn nhóm quyền phân bổ <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2.5">
                    {/* Role 1: Quản lý kho */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        inviteRole === "WAREHOUSE_MANAGER"
                          ? "bg-sky-50/60 border-sky-300 ring-1 ring-sky-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <input
                        type="radio"
                        name="seller_role"
                        value="WAREHOUSE_MANAGER"
                        checked={inviteRole === "WAREHOUSE_MANAGER"}
                        onChange={() => setInviteRole("WAREHOUSE_MANAGER")}
                        className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            Quản lý kho
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
                            4 quyền
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Cập nhật tồn kho, xử lý đóng gói và bàn giao vận chuyển
                          đơn hàng.
                        </p>
                      </div>
                    </label>

                    {/* Role 2: Kế toán đối soát */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        inviteRole === "ACCOUNTANT"
                          ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <input
                        type="radio"
                        name="seller_role"
                        value="ACCOUNTANT"
                        checked={inviteRole === "ACCOUNTANT"}
                        onChange={() => setInviteRole("ACCOUNTANT")}
                        className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            Kế toán đối soát
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            3 quyền
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Xem doanh thu, bảng kê đối soát và yêu cầu rút tiền ví.
                        </p>
                      </div>
                    </label>

                    {/* Role 3: Vận hành Flash Sale */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        inviteRole === "FLASH_SALE_OPERATOR"
                          ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <input
                        type="radio"
                        name="seller_role"
                        value="FLASH_SALE_OPERATOR"
                        checked={inviteRole === "FLASH_SALE_OPERATOR"}
                        onChange={() => setInviteRole("FLASH_SALE_OPERATOR")}
                        className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            Vận hành Flash Sale
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                            3 quyền
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Đăng ký sản phẩm tham gia phiên Flash Sale và điều
                          chỉnh giá khuyến mãi.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
                >
                  {isPending ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">
                      send
                    </span>
                  )}
                  <span>Gửi lời mời</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Đổi nhóm quyền */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    admin_panel_settings
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Đổi nhóm quyền cho {editingStaff.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateRoleSubmit}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500">
                  Chọn vai trò mới cho nhân viên. Quyền truy cập các tính năng
                  sẽ được cập nhật ngay lập tức.
                </p>

                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      editRole === "WAREHOUSE_MANAGER"
                        ? "bg-sky-50/60 border-sky-300 ring-1 ring-sky-300"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit_role"
                      value="WAREHOUSE_MANAGER"
                      checked={editRole === "WAREHOUSE_MANAGER"}
                      onChange={() => setEditRole("WAREHOUSE_MANAGER")}
                      className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-sm text-slate-900">
                        Quản lý kho
                      </span>
                      <p className="text-xs text-slate-500">
                        Cập nhật tồn kho, xử lý đóng gói và bàn giao vận chuyển.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      editRole === "ACCOUNTANT"
                        ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit_role"
                      value="ACCOUNTANT"
                      checked={editRole === "ACCOUNTANT"}
                      onChange={() => setEditRole("ACCOUNTANT")}
                      className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-sm text-slate-900">
                        Kế toán đối soát
                      </span>
                      <p className="text-xs text-slate-500">
                        Xem doanh thu, bảng kê đối soát và yêu cầu rút tiền ví.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      editRole === "FLASH_SALE_OPERATOR"
                        ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-300"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit_role"
                      value="FLASH_SALE_OPERATOR"
                      checked={editRole === "FLASH_SALE_OPERATOR"}
                      onChange={() => setEditRole("FLASH_SALE_OPERATOR")}
                      className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-sm text-slate-900">
                        Vận hành Flash Sale
                      </span>
                      <p className="text-xs text-slate-500">
                        Đăng ký sản phẩm tham gia phiên Flash Sale và điều
                        chỉnh giá.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all"
                >
                  {isPending && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Xác nhận xóa / hủy lời mời */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">
                  warning
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {deletingStaff.status === "PENDING_INVITE"
                  ? "Xác nhận hủy lời mời?"
                  : "Xác nhận xóa nhân viên?"}
              </h3>
              <p className="text-xs text-slate-500">
                {deletingStaff.status === "PENDING_INVITE"
                  ? `Bạn có chắc muốn hủy lời mời gửi đến ${deletingStaff.email}? Đường link kích hoạt tài khoản sẽ bị vô hiệu.`
                  : `Bạn có chắc muốn xóa nhân viên ${deletingStaff.name} (${deletingStaff.email}) khỏi gian hàng? Nhân viên sẽ mất toàn bộ quyền truy cập.`}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all"
              >
                {isPending && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                )}
                <span>
                  {deletingStaff.status === "PENDING_INVITE"
                    ? "Hủy lời mời"
                    : "Xóa nhân viên"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
