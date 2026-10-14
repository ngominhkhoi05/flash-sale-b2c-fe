"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
}

export interface DataTablePagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (item: T) => string | number;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyTitle?: string;
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onSelectRow?: (key: string | number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  pagination?: DataTablePagination;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = "Không tìm thấy bản ghi nào phù hợp với bộ lọc.",
  emptyTitle = "Chưa có dữ liệu",
  selectable = false,
  selectedKeys = [],
  onSelectRow,
  onSelectAll,
  pagination,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const isAllSelected =
    data.length > 0 &&
    data.every((item) => selectedKeys.includes(rowKey(item)));
  const isSomeSelected =
    data.length > 0 &&
    data.some((item) => selectedKeys.includes(rowKey(item))) &&
    !isAllSelected;

  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/30",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          {/* Header 44px */}
          <thead>
            <tr className="h-11 bg-surface-bright text-secondary font-label-sm text-xs uppercase tracking-wider border-b border-surface-container">
              {selectable && (
                <th className="w-12 px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                    aria-label="Chọn tất cả"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2 font-semibold text-xs",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-surface-container font-body-md text-sm">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="h-14 animate-pulse">
                  {selectable && (
                    <td className="w-12 px-4 text-center">
                      <div className="w-4 h-4 bg-surface-container rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-col-${cIdx}`} className="px-4 py-3">
                      <div className="h-4 bg-surface-container rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              // Error State
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 px-4 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                    <span className="material-symbols-outlined text-[36px] text-danger">
                      error
                    </span>
                    <span className="font-headline-md text-sm font-bold text-on-surface">
                      Đã xảy ra lỗi khi tải dữ liệu
                    </span>
                    <p className="text-xs text-secondary">
                      {typeof error === "string" ? error : error.message}
                    </p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
                      >
                        Thử lại
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 px-4 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-secondary">
                    <span className="material-symbols-outlined text-[40px] text-outline-variant">
                      inbox
                    </span>
                    <span className="font-headline-md text-sm font-semibold text-on-surface">
                      {emptyTitle}
                    </span>
                    <p className="text-xs text-secondary">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((item, index) => {
                const key = rowKey(item);
                const isSelected = selectedKeys.includes(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "h-14 transition-colors group",
                      onRowClick && "cursor-pointer",
                      isSelected
                        ? "bg-surface-container-low/70 hover:bg-surface-container-low"
                        : "hover:bg-surface-bright"
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-12 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onSelectRow?.(key, e.target.checked)
                          }
                          className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(item, index)
                          : (item as Record<string, unknown>)[col.key] !==
                              undefined
                            ? String(
                                (item as Record<string, unknown>)[col.key]
                              )
                            : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="h-12 px-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between border-t border-surface-container text-secondary font-body-sm text-xs gap-space-sm select-none">
          <div className="flex items-center gap-space-sm">
            <span>
              Hiển thị{" "}
              <strong className="text-on-surface font-data-tabular">
                {pagination.totalItems > 0
                  ? (pagination.currentPage - 1) * pagination.pageSize + 1
                  : 0}
              </strong>{" "}
              -{" "}
              <strong className="text-on-surface font-data-tabular">
                {Math.min(
                  pagination.currentPage * pagination.pageSize,
                  pagination.totalItems
                )}
              </strong>{" "}
              của{" "}
              <strong className="text-on-surface font-data-tabular">
                {pagination.totalItems.toLocaleString("vi-VN")}
              </strong>{" "}
              mục
            </span>

            {pagination.onPageSizeChange && (
              <>
                <div className="h-4 w-px bg-surface-container hidden sm:block" />
                <div className="hidden sm:flex items-center gap-1.5">
                  <span>Hàng mỗi trang:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) =>
                      pagination.onPageSizeChange?.(Number(e.target.value))
                    }
                    className="h-7 px-2 rounded bg-surface-bright text-on-surface font-label-md text-xs focus:outline-none cursor-pointer border border-outline-variant/40"
                  >
                    {(pagination.pageSizeOptions || [10, 20, 50]).map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() =>
                pagination.onPageChange(pagination.currentPage - 1)
              }
              className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Trang trước"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>

            {/* Page numbers with ellipsis */}
            {generatePageNumbers(
              pagination.currentPage,
              pagination.totalPages
            ).map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="px-1 text-secondary">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => pagination.onPageChange(Number(p))}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-label-md text-xs font-semibold transition-colors cursor-pointer",
                    pagination.currentPage === p
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-secondary hover:bg-surface-container"
                  )}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                pagination.onPageChange(pagination.currentPage + 1)
              }
              className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Trang sau"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }
  return [1, "...", current, "...", total];
}
