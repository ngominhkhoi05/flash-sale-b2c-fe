"use client";

import React from "react";
import { FeatureFlag } from "@/types/permissions";

interface FeatureFlagsTabProps {
  flags: FeatureFlag[];
  onToggleFlag: (flag: FeatureFlag, nextState: boolean) => void;
}

export function FeatureFlagsTab({
  flags,
  onToggleFlag,
}: FeatureFlagsTabProps) {
  const disabledCount = flags.filter((f) => !f.isEnabled).length;

  return (
    <section className="flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[18px]">
              toggle_on
            </span>
          </span>
          <h2 className="font-headline-md text-base font-bold text-on-surface">
            Kiểm soát quyền & Bật tắt tính năng (Feature Flags)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body-sm text-xs text-secondary">
            Áp dụng thời gian thực (Zero Downtime)
          </span>
          {disabledCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              {disabledCount} tính năng đang tắt
            </span>
          )}
        </div>
      </div>

      {/* Info Callout Banner */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3 shadow-xs">
        <span className="material-symbols-outlined text-sky-600 text-[22px] mt-0.5">
          info
        </span>
        <div className="flex flex-col">
          <span className="font-body-md text-xs font-bold text-sky-900">
            Lưu ý an toàn vận hành sàn:
          </span>
          <p className="font-body-sm text-xs text-sky-800 mt-0.5 leading-relaxed">
            Tắt một quyền sẽ ngay lập tức khóa tính năng đó với{" "}
            <strong>mọi người dùng trên toàn sàn</strong> và tự động điều hướng
            sang trang <em>&quot;Tính năng đang bảo trì định kỳ&quot;</em>. Vui
            lòng cân nhắc kỹ lưỡng và chỉ kích hoạt cờ khẩn cấp khi cần thiết.
          </p>
        </div>
      </div>

      {/* Table of Feature Flags */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-surface-container-low h-11 text-secondary font-label-sm text-xs uppercase tracking-wider border-b border-outline-variant/30 select-none">
                <th className="py-2.5 px-space-md font-semibold">
                  Mã quyền kỹ thuật
                </th>
                <th className="py-2.5 px-space-md font-semibold">Tên tính năng</th>
                <th className="py-2.5 px-space-md font-semibold">Phân hệ</th>
                <th className="py-2.5 px-space-md font-semibold text-center">
                  Phạm vi áp dụng
                </th>
                <th className="py-2.5 px-space-md font-semibold">
                  Trạng thái công tắc
                </th>
                <th className="py-2.5 px-space-md font-semibold text-right">
                  Người sửa gần nhất
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm font-body-md text-on-surface">
              {flags.map((flag) => {
                const isGlobalMaintenance =
                  flag.code === "system:maintenance_global";

                return (
                  <tr
                    key={flag.code}
                    className={`h-16 transition-colors hover:bg-surface-container-low/40 ${
                      !flag.isEnabled
                        ? "bg-surface-container-low/20"
                        : isGlobalMaintenance
                        ? "bg-amber-500/5"
                        : ""
                    }`}
                  >
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-2">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            isGlobalMaintenance
                              ? "text-tertiary"
                              : flag.isEnabled
                              ? "text-primary"
                              : "text-secondary"
                          }`}
                        >
                          {isGlobalMaintenance
                            ? "warning"
                            : flag.code.includes("flashsale")
                            ? "bolt"
                            : flag.code.includes("review")
                            ? "rate_review"
                            : flag.code.includes("zalopay")
                            ? "qr_code_2"
                            : flag.code.includes("store")
                            ? "storefront"
                            : "toggle_on"}
                        </span>
                        <code className="font-mono text-xs text-on-surface bg-surface-container-low px-2 py-1 rounded font-medium">
                          {flag.code}
                        </code>
                      </div>
                    </td>

                    <td className="py-3 px-space-md">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">
                          {flag.name}
                        </span>
                        <span className="font-body-sm text-xs text-secondary line-clamp-1">
                          {flag.description}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-space-md">
                      <span className="px-2 py-0.5 rounded font-label-sm text-xs bg-surface-container text-secondary font-medium">
                        {flag.module}
                      </span>
                    </td>

                    <td className="py-3 px-space-md text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-secondary font-medium">
                        <span className="material-symbols-outlined text-[15px]">
                          badge
                        </span>
                        {flag.groupCount} nhóm
                      </span>
                    </td>

                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-3">
                        {/* Custom Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={flag.isEnabled}
                            onChange={(e) =>
                              onToggleFlag(flag, e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:bg-emerald-600 peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                        </label>

                        {flag.isEnabled ? (
                          <span className="font-label-md text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                            Đang bật
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <span className="material-symbols-outlined text-[13px]">
                              build
                            </span>
                            Đang bảo trì
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-space-md text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-on-surface">
                          {flag.lastModifiedBy}
                        </span>
                        <span className="text-[11px] text-secondary">
                          {flag.lastModifiedAt}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
