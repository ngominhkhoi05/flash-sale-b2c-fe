/**
 * FlashSalePageContent – composition chính của trang /flash-sale.
 *
 * 6 section theo Stitch:
 *  1. FlashSaleHeroBanner
 *  2. FlashSaleSlotNav
 *  3. FlashSaleCountdownBar + FlashSaleCategoryFilter
 *  4. FlashSaleDealsGrid (slot ACTIVE)
 *  5. FlashSaleUpcomingSection (slot UPCOMING)
 *  6. FlashSaleLiveIndicator (fixed bottom-right)
 *
 * Branch mock:
 *  - NEXT_PUBLIC_USE_MOCK=true → render trực tiếp từ `mockFlashSaleSlots` (xem UI ngay)
 *  - ngược lại → dùng `useFlashSaleSlots` hook (TanStack Query → API thật)
 *
 * Stitch reference: trang-flash-sale.md
 * Plan: docs/superpowers/plans/2026-10-13-flash-sale-page-ui-stitch.md (Subplan C)
 */

"use client";

import { useMemo, useState } from "react";

import { useFlashSaleSlots } from "@/features/flash-sale";
import {
  mockFlashSaleSlots,
  type PublicFlashSaleItemResponse,
  type PublicFlashSaleSlotResponse,
} from "@/features/flash-sale";

import { FlashSaleHeroBanner } from "./FlashSaleHeroBanner";
import { FlashSaleSlotNav } from "./FlashSaleSlotNav";
import { FlashSaleCountdownBar } from "./FlashSaleCountdownBar";
import { FlashSaleCategoryFilter } from "./FlashSaleCategoryFilter";
import { FlashSaleDealCard } from "./FlashSaleDealCard";
import { FlashSaleDealsGrid } from "./FlashSaleDealsGrid";
import { FlashSaleUpcomingSection } from "./FlashSaleUpcomingSection";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

export interface FlashSalePageContentProps {
  className?: string;
}

const ALL_CATEGORIES_KEY = "all";

/** Lấy key và tên danh mục thực tế của sản phẩm Flash Sale */
export function getItemCategoryKey(item: PublicFlashSaleItemResponse): { key: string; label: string } {
  if (item.categoryName && item.categoryName.trim().length > 0) {
    const label = item.categoryName.trim();
    const key = item.categorySlug?.trim() || label;
    return { key, label };
  }
  return { key: "other", label: "Khác" };
}

/** Nhóm sản phẩm theo Danh mục thực tế (Category) cho filter chip. */
function buildCategories(items: PublicFlashSaleItemResponse[]) {
  const map = new Map<string, { label: string; count: number }>();
  for (const it of items) {
    const { key, label } = getItemCategoryKey(it);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { label, count: 1 });
    }
  }
  return [
    { key: ALL_CATEGORIES_KEY, label: "Tất cả", count: items.length },
    ...[...map.entries()].map(([key, val]) => ({ key, label: val.label, count: val.count })),
  ];
}

export function FlashSalePageContent({ className }: FlashSalePageContentProps) {
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  // Branch mock: dùng data tĩnh, không gọi API, không loading/error.
  if (isMock) {
    return <FlashSalePageContentMock className={className} slots={mockFlashSaleSlots} />;
  }

  // Branch thật: gọi hook + 4 trạng thái (loading/error/empty/data).
  return <FlashSalePageContentLive className={className} />;
}

function FlashSalePageContentLive({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useFlashSaleSlots();

  if (isLoading) {
    return <FlashSalePageContentSkeleton className={className} />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Không tải được phiên Flash Sale"
        message="Vui lòng kiểm tra kết nối rồi thử lại."
        onRetry={() => {
          refetch();
        }}
        className={className}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className={className}>
        <FlashSaleHeroBanner />
        <ErrorState
          title="Chưa có phiên Flash Sale nào"
          message="Khi admin mở khung giờ mới, danh sách sẽ hiển thị tại đây."
        />
      </div>
    );
  }

  return <FlashSalePageContentBody className={className} slots={data} />;
}

interface FlashSalePageContentBodyProps {
  slots: PublicFlashSaleSlotResponse[];
  className?: string;
}

function FlashSalePageContentBody({ slots, className }: FlashSalePageContentBodyProps) {
  const [activeSlotId, setActiveSlotId] = useState<number>(() => {
    const active = slots.find((s) => s.status === "ACTIVE");
    return active?.id ?? slots[0]?.id ?? 0;
  });
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES_KEY);

  const activeSlot = useMemo(
    () => slots.find((s) => s.id === activeSlotId) ?? slots[0],
    [slots, activeSlotId],
  );
  const upcomingSlot = useMemo(
    () => slots.find((s) => s.status === "UPCOMING" && s.id !== activeSlotId),
    [slots, activeSlotId],
  );

  const categories = useMemo(
    () => buildCategories(activeSlot?.items ?? []),
    [activeSlot],
  );

  const filteredItems = useMemo(() => {
    if (!activeSlot) return [];
    if (activeCategory === ALL_CATEGORIES_KEY) return activeSlot.items;
    return activeSlot.items.filter((it) => getItemCategoryKey(it).key === activeCategory);
  }, [activeSlot, activeCategory]);

  if (!activeSlot) return null;

  return (
    <div className={className}>
      <FlashSaleHeroBanner />

      <FlashSaleSlotNav
        slots={slots.map((s) => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status as "UPCOMING" | "ACTIVE" | "ENDED",
        }))}
        activeSlotId={activeSlotId}
        onSelect={(slotId) => {
          setActiveSlotId(slotId);
          setActiveCategory(ALL_CATEGORIES_KEY);
        }}
      />

      <FlashSaleCountdownBar
        endsAt={activeSlot.endTime}
        startsAt={activeSlot.startTime}
        status={activeSlot.status as "UPCOMING" | "ACTIVE" | "ENDED"}
        liveViewers={1240}
      />

      <FlashSaleCategoryFilter
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      <FlashSaleDealsGrid
        items={filteredItems}
        renderItem={(item) => <FlashSaleDealCard key={item.id} item={item} />}
      />

      {upcomingSlot && (
        <FlashSaleUpcomingSection
          slot={{
            id: upcomingSlot.id,
            startTime: upcomingSlot.startTime,
            endTime: upcomingSlot.endTime,
            status: upcomingSlot.status as "UPCOMING" | "ACTIVE" | "ENDED",
            label: upcomingSlot.title,
          }}
          items={upcomingSlot.items}
        />
      )}
    </div>
  );
}

function FlashSalePageContentMock({
  slots,
  className,
}: {
  slots: PublicFlashSaleSlotResponse[];
  className?: string;
}) {
  return <FlashSalePageContentBody slots={slots} className={className} />;
}

function FlashSalePageContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="mb-6 h-24 w-full rounded-xl" />
      <Skeleton className="mb-4 h-12 w-full rounded-lg" />
      <Skeleton className="mb-4 h-16 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
