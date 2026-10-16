import { Skeleton } from '@/components/ui/skeleton';

export function OrderCardSkeleton() {
  return (
    <div
      className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md"
      aria-label="Loading order"
    >
      <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
        <div className="flex items-center gap-space-sm">
          <Skeleton className="w-[22px] h-[22px] rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-6 w-28 rounded-md" />
      </div>
      <div className="flex items-center gap-space-md">
        <Skeleton className="w-[72px] h-[72px] rounded-lg" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-space-xs border-t border-surface-container-high">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
