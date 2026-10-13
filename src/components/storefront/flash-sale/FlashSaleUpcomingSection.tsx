/**
 * FlashSaleUpcomingSection – section hiển thị các deal trong slot UPCOMING tiếp theo.
 *
 * Layout: tiêu đề "Sắp diễn ra · 15:00" + "N sản phẩm" + horizontal list card nhỏ
 * mỗi card có ảnh + tên + giá flash + nút "Nhắc tôi".
 *
 * Stitch reference: trang-flash-sale.md L470-L640
 */

"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ArrowRight } from "lucide-react";
import { formatVND, formatVNDCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FlashSaleReminderButton } from "./FlashSaleReminderButton";
import type { PublicFlashSaleItemResponse } from "@/features/flash-sale";

export interface FlashSaleUpcomingSlotMeta {
  id: number;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  label: string;
}

export interface FlashSaleUpcomingSectionProps {
  slot: FlashSaleUpcomingSlotMeta;
  items: PublicFlashSaleItemResponse[];
  className?: string;
}

function formatHHmm(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FlashSaleUpcomingSection({
  slot,
  items,
  className,
}: FlashSaleUpcomingSectionProps) {
  if (items.length === 0) return null;
  const startLabel = formatHHmm(slot.startTime);

  return (
    <section
      data-testid="flash-sale-upcoming"
      aria-labelledby="upcoming-heading"
      className={cn("mt-10", className)}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialSymbol name="schedule" size="[20px]" className="text-tertiary" aria-hidden />
          <h2
            id="upcoming-heading"
            className="text-headline-sm font-bold text-on-surface"
          >
            Sắp diễn ra · {startLabel}
          </h2>
          <span className="rounded-full bg-tertiary-fixed-dim px-2 py-0.5 text-label-sm font-bold text-tertiary">
            {items.length} sản phẩm
          </span>
        </div>
        <Link
          href="#"
          className="flex items-center gap-1 text-label-md font-semibold text-tertiary hover:underline"
        >
          Xem tất cả
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.id}
            data-testid={`upcoming-item-${item.id}`}
            className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-surface-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute right-1.5 top-1.5 rounded-md bg-tertiary px-1.5 py-0.5 text-label-sm font-bold text-on-tertiary shadow-sm">
                -{Math.round(((item.originalPrice - item.flashSalePrice) / item.originalPrice) * 100)}%
              </span>
            </div>
            <h3 className="line-clamp-2 min-h-[2.5rem] text-body-sm font-medium text-on-surface">
              {item.productName}
            </h3>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-headline-sm font-bold text-tertiary">
                {formatVNDCompact(item.flashSalePrice)}
              </span>
              <span className="text-label-sm text-on-surface-variant line-through">
                {formatVND(item.originalPrice)}
              </span>
            </div>
            <div className="mt-2">
              <FlashSaleReminderButton />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
