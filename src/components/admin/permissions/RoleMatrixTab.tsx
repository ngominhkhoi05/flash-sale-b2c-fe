"use client";

import React, { useState } from "react";
import { InternalRoleGroup, AclPermission } from "@/types/permissions";

interface RoleMatrixTabProps {
  groups: InternalRoleGroup[];
  permissions: AclPermission[];
  onSaveGroupPermissions: (groupId: string, newPermissions: string[]) => void;
  showToast: (msg: string) => void;
}

export function RoleMatrixTab({
  groups,
  permissions,
  onSaveGroupPermissions,
  showToast,
}: RoleMatrixTabProps) {
  // Selected Group
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups[1]?.id || groups[0]?.id || ""
  );

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  // Local permissions set for the current group
  const [assignedPerms, setAssignedPerms] = useState<string[]>(() => {
    return selectedGroup ? selectedGroup.permissions : [];
  });

  // Group permissions by module
  const permsByModule = {
    PRODUCT: permissions.filter((p) => p.module === "PRODUCT"),
    FLASH_SALE: permissions.filter((p) => p.module === "FLASH_SALE"),
    ORDER_VOUCHER: permissions.filter((p) => p.module === "ORDER_VOUCHER"),
    SYSTEM: permissions.filter((p) => p.module === "SYSTEM"),
  };

  // Toggle single permission
  const handleTogglePerm = (permCode: string) => {
    setAssignedPerms((prev) =>
      prev.includes(permCode)
        ? prev.filter((c) => c !== permCode)
        : [...prev, permCode]
    );
  };

  // Toggle module permissions
  const handleToggleModule = (modulePerms: AclPermission[]) => {
    const moduleCodes = modulePerms.map((p) => p.code);
    const allChecked = moduleCodes.every((c) => assignedPerms.includes(c));

    if (allChecked) {
      // Uncheck all
      setAssignedPerms((prev) => prev.filter((c) => !moduleCodes.includes(c)));
    } else {
      // Check all
      setAssignedPerms((prev) => Array.from(new Set([...prev, ...moduleCodes])));
    }
  };

  // Reset to original
  const handleReset = () => {
    if (selectedGroup) {
      setAssignedPerms(selectedGroup.permissions);
      showToast("Đã hoàn tác các thay đổi chưa lưu");
    }
  };

  // Save changes
  const handleSave = () => {
    if (!selectedGroup) return;
    onSaveGroupPermissions(selectedGroup.id, assignedPerms);
    showToast(
      `Đã cập nhật ${assignedPerms.length} quyền cho nhóm "${selectedGroup.name}"`
    );
  };

  return (
    <section className="flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[18px]">
              table_chart
            </span>
          </span>
          <h2 className="font-headline-md text-base font-bold text-on-surface">
            Nhóm quyền nội bộ & Ma trận phân quyền (ACL Matrix)
          </h2>
        </div>
        <span className="font-body-sm text-xs text-secondary">
          Đang chọn nhóm:{" "}
          <strong className="text-primary font-semibold">
            {selectedGroup?.name}
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: 30% (lg:col-span-4) Role Groups List */}
        <div className="lg:col-span-4 flex flex-col gap-space-sm">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                Danh sách nhóm quản trị
              </span>
              <span className="font-label-sm text-xs text-on-surface-variant font-medium">
                {groups.length} nhóm hoạt động
              </span>
            </div>

            {/* List of Internal Roles */}
            <div className="flex flex-col gap-1.5">
              {groups.map((group) => {
                const isSelected = group.id === selectedGroupId;

                return (
                  <div
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setAssignedPerms(group.permissions);
                    }}
                    className={`cursor-pointer p-3.5 rounded-xl transition-all flex items-center justify-between relative border ${
                      isSelected
                        ? "bg-surface-container-low border-primary/30 shadow-sm"
                        : "bg-surface-container-lowest border-transparent hover:bg-surface-container-low/60 hover:border-outline-variant/30"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r" />
                    )}
                    <div className="flex items-center gap-3 pl-1">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-secondary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {group.icon}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`font-body-md text-sm font-semibold ${
                            isSelected ? "text-primary" : "text-on-surface"
                          }`}
                        >
                          {group.name}
                        </span>
                        <span className="font-label-sm text-xs text-secondary">
                          {group.code} • {group.memberCount} thành viên
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary-fixed text-primary">
                        Đang chọn
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-outline-variant text-[18px]">
                        chevron_right
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Button: Create New Role */}
            <button
              type="button"
              onClick={() => showToast("Chức năng tạo nhóm quyền mới đang chuẩn bị ra mắt")}
              className="mt-2 w-full py-2.5 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_circle
              </span>
              <span>Tạo nhóm quyền mới</span>
            </button>
          </div>

          {/* Group Member Quick Peek */}
          {selectedGroup && (
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs font-semibold text-on-surface">
                  Thành viên nhóm này
                </span>
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      `Mở danh sách ${selectedGroup.memberCount} thành viên nhóm ${selectedGroup.name}`
                    )
                  }
                  className="font-label-sm text-xs text-primary hover:underline font-medium"
                >
                  Quản lý ({selectedGroup.memberCount})
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-flex h-8 w-8 rounded-full bg-primary-container text-on-primary-container items-center justify-center font-label-sm text-xs font-bold ring-2 ring-surface-container-lowest">
                    TQ
                  </div>
                  <div className="inline-flex h-8 w-8 rounded-full bg-secondary-container text-on-secondary-fixed items-center justify-center font-label-sm text-xs font-bold ring-2 ring-surface-container-lowest">
                    TL
                  </div>
                  <div className="inline-flex h-8 w-8 rounded-full bg-surface-container text-secondary items-center justify-center font-label-sm text-xs font-bold ring-2 ring-surface-container-lowest">
                    +{selectedGroup.memberCount - 2}
                  </div>
                </div>
                {selectedGroup.hasMfa && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">
                      security
                    </span>
                    Bắt buộc MFA
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 70% (lg:col-span-8) ACL Permission Matrix */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-lg">
          {/* Header Right Column */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md bg-surface-container-low/30 -mx-space-lg -mt-space-lg p-space-lg rounded-t-xl gap-space-md border-b border-outline-variant/15">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  tune
                </span>
                <h3 className="font-headline-lg text-lg text-on-surface font-bold">
                  {selectedGroup?.name}
                </h3>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-surface-container text-secondary">
                  {selectedGroup?.code}
                </span>
              </div>
              <p className="font-body-sm text-xs text-secondary mt-1 max-w-xl">
                {selectedGroup?.description}
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-lg bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container font-label-md text-xs font-semibold transition-colors"
              >
                Hoàn tác
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-label-md text-xs font-semibold flex items-center gap-1.5 shadow transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">
                  save
                </span>
                <span>Lưu thay đổi ma trận quyền</span>
              </button>
            </div>
          </div>

          {/* Module: PRODUCT */}
          <div className="flex flex-col gap-space-sm bg-surface-container-low/40 rounded-xl p-space-md border border-outline-variant/15">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permsByModule.PRODUCT.every((p) =>
                    assignedPerms.includes(p.code)
                  )}
                  onChange={() => handleToggleModule(permsByModule.PRODUCT)}
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-sm font-bold text-on-surface">
                    Phân hệ: Sản phẩm (PRODUCT)
                  </span>
                  <span className="px-2 py-0.2 rounded font-mono text-[11px] bg-surface-container text-secondary">
                    product:*
                  </span>
                </div>
              </label>
              <span className="font-label-sm text-xs text-secondary">
                {
                  permsByModule.PRODUCT.filter((p) =>
                    assignedPerms.includes(p.code)
                  ).length
                }
                /{permsByModule.PRODUCT.length} quyền kích hoạt
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-1">
              {permsByModule.PRODUCT.map((perm) => (
                <label
                  key={perm.code}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer border ${
                    assignedPerms.includes(perm.code)
                      ? "bg-surface-container-lowest border-primary/20 shadow-xs"
                      : "bg-surface-container-lowest/60 border-transparent hover:bg-surface-container-lowest"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assignedPerms.includes(perm.code)}
                    onChange={() => handleTogglePerm(perm.code)}
                    className="mt-0.5 h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-body-md text-xs font-semibold text-on-surface">
                      {perm.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="font-mono text-[11px] text-secondary bg-surface-container px-1 py-0.2 rounded">
                        {perm.code}
                      </code>
                      {perm.isSensitive && (
                        <span className="font-label-sm text-[10px] text-tertiary font-semibold">
                          Quyền nhạy cảm
                        </span>
                      )}
                      {perm.isReadOnly && (
                        <span className="font-label-sm text-[10px] text-outline">
                          Chỉ đọc
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Module: FLASH_SALE (Focus Module) */}
          <div className="flex flex-col gap-space-sm bg-primary/5 rounded-xl p-space-md border border-primary/20">
            <div className="flex items-center justify-between pb-2 border-b border-primary/15">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permsByModule.FLASH_SALE.every((p) =>
                    assignedPerms.includes(p.code)
                  )}
                  onChange={() => handleToggleModule(permsByModule.FLASH_SALE)}
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-sm font-bold text-primary">
                    Phân hệ: Vận hành Flash Sale (FLASH_SALE)
                  </span>
                  <span className="px-2 py-0.2 rounded font-mono text-[11px] bg-primary-fixed text-primary font-semibold">
                    flashsale:*
                  </span>
                </div>
              </label>
              <span className="font-label-sm text-xs font-bold text-primary">
                {
                  permsByModule.FLASH_SALE.filter((p) =>
                    assignedPerms.includes(p.code)
                  ).length
                }
                /{permsByModule.FLASH_SALE.length} quyền kích hoạt
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-1">
              {permsByModule.FLASH_SALE.map((perm) => (
                <label
                  key={perm.code}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer border ${
                    assignedPerms.includes(perm.code)
                      ? "bg-surface-container-lowest border-primary/30 shadow-xs"
                      : "bg-surface-container-lowest/60 border-transparent hover:bg-surface-container-lowest"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assignedPerms.includes(perm.code)}
                    onChange={() => handleTogglePerm(perm.code)}
                    className="mt-0.5 h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-body-md text-xs font-semibold text-on-surface">
                      {perm.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="font-mono text-[11px] text-secondary bg-surface-container px-1 py-0.2 rounded">
                        {perm.code}
                      </code>
                      {perm.isSensitive && (
                        <span className="font-label-sm text-[10px] text-tertiary font-semibold">
                          Khẩn cấp / Chốt giá
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Module: ORDER & VOUCHER */}
          <div className="flex flex-col gap-space-sm bg-surface-container-low/40 rounded-xl p-space-md border border-outline-variant/15">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permsByModule.ORDER_VOUCHER.every((p) =>
                    assignedPerms.includes(p.code)
                  )}
                  onChange={() =>
                    handleToggleModule(permsByModule.ORDER_VOUCHER)
                  }
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-sm font-bold text-on-surface">
                    Phân hệ: Đơn hàng & Voucher (ORDER & VOUCHER)
                  </span>
                  <span className="px-2 py-0.2 rounded font-mono text-[11px] bg-surface-container text-secondary">
                    order:* | voucher:*
                  </span>
                </div>
              </label>
              <span className="font-label-sm text-xs text-secondary">
                {
                  permsByModule.ORDER_VOUCHER.filter((p) =>
                    assignedPerms.includes(p.code)
                  ).length
                }
                /{permsByModule.ORDER_VOUCHER.length} quyền kích hoạt
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-1">
              {permsByModule.ORDER_VOUCHER.map((perm) => (
                <label
                  key={perm.code}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer border ${
                    assignedPerms.includes(perm.code)
                      ? "bg-surface-container-lowest border-primary/20 shadow-xs"
                      : "bg-surface-container-lowest/60 border-transparent hover:bg-surface-container-lowest"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assignedPerms.includes(perm.code)}
                    onChange={() => handleTogglePerm(perm.code)}
                    className="mt-0.5 h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-body-md text-xs font-semibold text-on-surface">
                      {perm.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="font-mono text-[11px] text-secondary bg-surface-container px-1 py-0.2 rounded">
                        {perm.code}
                      </code>
                      {perm.isSensitive && (
                        <span className="font-label-sm text-[10px] text-tertiary font-semibold">
                          Ngân sách lớn
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Module: SYSTEM */}
          <div className="flex flex-col gap-space-sm bg-surface-container-low/40 rounded-xl p-space-md border border-outline-variant/15">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permsByModule.SYSTEM.every((p) =>
                    assignedPerms.includes(p.code)
                  )}
                  onChange={() => handleToggleModule(permsByModule.SYSTEM)}
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-sm font-bold text-on-surface">
                    Phân hệ: Quản trị hệ thống (SYSTEM)
                  </span>
                  <span className="px-2 py-0.2 rounded font-mono text-[11px] bg-surface-container text-secondary">
                    system:*
                  </span>
                </div>
              </label>
              <span className="font-label-sm text-xs text-secondary">
                {
                  permsByModule.SYSTEM.filter((p) =>
                    assignedPerms.includes(p.code)
                  ).length
                }
                /{permsByModule.SYSTEM.length} quyền kích hoạt
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-1">
              {permsByModule.SYSTEM.map((perm) => (
                <label
                  key={perm.code}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer border ${
                    assignedPerms.includes(perm.code)
                      ? "bg-surface-container-lowest border-primary/20 shadow-xs"
                      : "bg-surface-container-lowest/60 border-transparent hover:bg-surface-container-lowest"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assignedPerms.includes(perm.code)}
                    onChange={() => handleTogglePerm(perm.code)}
                    className="mt-0.5 h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-body-md text-xs font-semibold text-on-surface">
                      {perm.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="font-mono text-[11px] text-secondary bg-surface-container px-1 py-0.2 rounded">
                        {perm.code}
                      </code>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
