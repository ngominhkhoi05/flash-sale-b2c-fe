"use client";

import React from "react";
import type { LiveLogEvent } from "@/types/flash-monitor";
import { cn } from "@/lib/utils";

interface LiveEventFeedProps {
  events: LiveLogEvent[];
  onClear: () => void;
  isPaused?: boolean;
}

export function LiveEventFeed({
  events,
  onClear,
  isPaused = false,
}: LiveEventFeedProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden mb-space-lg">
      {/* Header */}
      <div className="px-space-lg py-space-md border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-[20px]">
            dynamic_feed
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Nhật ký sự kiện thời gian thực (Live Event Stream)
          </h2>
          <span className="font-label-sm text-label-sm text-secondary hidden sm:inline">
            Mili-giây chính xác
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-label-sm text-label-sm",
              isPaused ? "text-amber-600" : "text-[#16A34A]"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isPaused
                  ? "bg-amber-500"
                  : "bg-[#16A34A] animate-pulse"
              )}
            />
            {isPaused ? "Streaming Paused" : "Streaming Active"}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-secondary hover:text-on-surface text-[12px] font-label-md underline transition-colors cursor-pointer"
          >
            Xóa nhật ký
          </button>
        </div>
      </div>

      {/* Log stream rows */}
      <div
        className="p-space-md max-h-64 overflow-y-auto font-data-tabular text-body-sm space-y-2 bg-[#F8FAFC]"
        id="live-stream-box"
      >
        {events.length === 0 ? (
          <div className="text-center py-8 text-secondary text-body-sm">
            Nhật ký đã được làm mới. Đang chờ luồng sự kiện tiếp theo...
          </div>
        ) : (
          events.map((evt) => {
            return (
              <div
                key={evt.id}
                className="flex items-center gap-3 p-2 rounded bg-white border border-outline-variant/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all animate-in fade-in"
              >
                {/* Timestamp */}
                <span className="font-label-sm text-[11px] text-secondary font-mono shrink-0">
                  {evt.timestamp}
                </span>

                {/* Event Icon */}
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0",
                    evt.type === "LOCK" && "bg-primary-fixed text-primary",
                    evt.type === "PAYMENT" && "bg-[#DCFCE7] text-[#16A34A]",
                    evt.type === "RATE_LIMIT" && "bg-amber-100 text-amber-700",
                    evt.type === "EXPIRED_RELEASE" && "bg-orange-100 text-orange-600",
                    evt.type === "SYNC_DB" && "bg-primary-fixed text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {evt.type === "LOCK" && "lock"}
                    {evt.type === "PAYMENT" && "payments"}
                    {evt.type === "RATE_LIMIT" && "block"}
                    {evt.type === "EXPIRED_RELEASE" && "published_with_changes"}
                    {evt.type === "SYNC_DB" && "sync_alt"}
                  </span>
                </span>

                {/* Message */}
                <div className="flex-1 truncate">
                  {evt.orderCode && (
                    <span
                      className={cn(
                        "font-semibold mr-1 font-mono text-[12px]",
                        evt.type === "LOCK" && "text-primary",
                        evt.type === "PAYMENT" && "text-[#16A34A]",
                        evt.type === "EXPIRED_RELEASE" && "text-secondary"
                      )}
                    >
                      {evt.orderCode}:
                    </span>
                  )}
                  <span>{evt.message}</span>
                </div>

                {/* Tag pill */}
                <span
                  className={cn(
                    "font-label-sm text-[11px] font-medium shrink-0",
                    evt.tagColor === "primary" && "text-primary",
                    evt.tagColor === "success" && "text-[#16A34A] font-semibold",
                    evt.tagColor === "warning" && "text-amber-700",
                    evt.tagColor === "error" && "text-rose-700 font-semibold"
                  )}
                >
                  {evt.tag}
                </span>

                {/* User/Worker */}
                {evt.userOrInfo && (
                  <span className="font-label-sm text-[11px] text-secondary font-mono shrink-0 hidden sm:inline">
                    {evt.userOrInfo}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
