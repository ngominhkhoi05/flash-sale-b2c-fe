"use client";

import React from "react";
import { SystemRole } from "@/types/permissions";

interface SystemRolesTabProps {
  roles: SystemRole[];
  onSelectRole?: (role: SystemRole) => void;
}

export function SystemRolesTab({ roles, onSelectRole }: SystemRolesTabProps) {
  return (
    <section className="flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[18px]">
              admin_panel_settings
            </span>
          </span>
          <h2 className="font-headline-md text-base font-bold text-on-surface">
            Vai trò cơ bản hệ thống (System Base Roles)
          </h2>
        </div>
        <span className="font-body-sm text-xs text-secondary">
          Quy định danh tính đăng nhập & phạm vi dữ liệu cấp cao nhất
        </span>
      </div>

      {/* 3 Horizontal Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {roles.map((role) => {
          const isRoleAdmin = role.code === "ROLE_ADMIN";
          const isRoleSeller = role.code === "ROLE_SELLER";

          return (
            <div
              key={role.id}
              className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110 ${
                  isRoleAdmin
                    ? "bg-primary/5"
                    : isRoleSeller
                    ? "bg-secondary/5"
                    : "bg-tertiary-container/5"
                }`}
              />

              <div>
                <div className="flex items-center justify-between mb-space-sm">
                  <span
                    className={`px-2 py-0.5 rounded font-label-sm text-xs font-semibold tracking-wider uppercase ${
                      isRoleAdmin
                        ? "bg-surface-container text-primary"
                        : isRoleSeller
                        ? "bg-secondary-container/50 text-on-secondary-fixed-variant"
                        : "bg-surface-container-high text-on-surface"
                    }`}
                  >
                    {role.code}
                  </span>
                  <span
                    className={`flex items-center gap-1 font-mono text-xs font-bold ${
                      isRoleAdmin
                        ? "text-primary"
                        : isRoleSeller
                        ? "text-secondary"
                        : "text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {role.icon}
                    </span>
                    {role.userCount.toLocaleString()} tài khoản
                  </span>
                </div>

                <h3 className="font-headline-md text-base text-on-surface font-semibold mb-1">
                  {role.name}
                </h3>
                <p className="font-body-sm text-xs text-secondary line-clamp-2">
                  {role.description}
                </p>
              </div>

              <div className="pt-space-md mt-space-md flex items-center justify-between bg-surface-container-low/40 -mx-space-lg -mb-space-lg p-space-md border-t border-outline-variant/10">
                <span className="font-label-sm text-xs text-secondary">
                  Cấp độ:{" "}
                  <strong className="text-on-surface">{role.level}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectRole?.(role)}
                  className="flex items-center gap-1 font-label-md text-xs text-primary hover:text-primary-container font-semibold transition-colors"
                >
                  <span>Xem chi tiết</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Notice Box */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
          security
        </span>
        <div className="text-xs text-secondary leading-relaxed">
          <strong className="text-on-surface font-semibold">
            Nguyên tắc bảo mật cơ sở dữ liệu RBAC:
          </strong>{" "}
          3 vai trò cơ bản (ROLE_ADMIN, ROLE_SELLER, ROLE_BUYER) được gán cố định
          trong bảng <code>roles</code> của database. Quyền hạn chi tiết được ủy
          quyền động thông qua các <strong>Nhóm quyền (Permission Groups)</strong>{" "}
          ở Tab tiếp theo.
        </div>
      </div>
    </section>
  );
}
