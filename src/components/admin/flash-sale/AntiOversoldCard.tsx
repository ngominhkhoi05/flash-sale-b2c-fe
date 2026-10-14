"use client";

import React from "react";

interface AntiOversoldCardProps {
  redisStock?: number;
  postgresStock?: number;
  completedOrders?: number;
  holdingLocks?: number;
  syncIntervalMs?: number;
}

export function AntiOversoldCard({
  redisStock = 2500,
  postgresStock = 2500,
  completedOrders = 1903,
  holdingLocks = 412,
  syncIntervalMs = 1000,
}: AntiOversoldCardProps) {
  const totalOccupied = completedOrders + holdingLocks;
  const isConsistent = redisStock === postgresStock;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
      <div>
        {/* Header Status */}
        <div className="flex items-start justify-between gap-space-sm pb-space-md border-b border-outline-variant/20">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                verified_user
              </span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Kiểm soát bán vượt kho
              </h3>
              <span className="font-label-md text-label-md text-[#16A34A] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  check_circle
                </span>
                Không phát hiện bán vượt kho (0 lỗi)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-[#DCFCE7] text-[#16A34A] uppercase tracking-wide">
            ACID OK
          </span>
        </div>

        {/* 3-Tier Reconciliation Matrix */}
        <div className="mt-space-md space-y-space-sm">
          <div className="text-secondary font-label-md text-label-md uppercase tracking-wider text-[11px] font-semibold">
            Đối soát đồng bộ 3 tầng dữ liệu:
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                memory
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                Tồn kho Cache Redis (In-memory)
              </span>
            </div>
            <span className="font-data-tabular font-bold text-on-surface tabular-nums">
              {redisStock.toLocaleString("vi-VN")} SKU
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                database
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                Tồn kho CSDL chính (PostgreSQL)
              </span>
            </div>
            <span className="font-data-tabular font-bold text-on-surface tabular-nums">
              {postgresStock.toLocaleString("vi-VN")} SKU
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#16A34A]">
                shopping_cart_checkout
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                Đã chốt + Đang giữ chỗ
              </span>
            </div>
            <span className="font-data-tabular font-bold text-[#16A34A] tabular-nums">
              {completedOrders.toLocaleString("vi-VN")} +{" "}
              {holdingLocks.toLocaleString("vi-VN")} ={" "}
              {totalOccupied.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>

      {/* Lock health metric footnote */}
      <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[16px] text-primary">
            sync
          </span>
          <span>
            Chu kỳ sync worker:{" "}
            <strong className="text-on-surface tabular-nums">
              {syncIntervalMs.toLocaleString("vi-VN")}ms
            </strong>
          </span>
        </div>
        <span className="font-label-md text-label-md text-on-secondary-fixed-variant bg-secondary-fixed px-2 py-0.5 rounded font-semibold text-[11px]">
          {isConsistent ? "Khớp 100% · Lỗi lệch: 0" : "Cảnh báo lệch dữ liệu!"}
        </span>
      </div>
    </div>
  );
}
