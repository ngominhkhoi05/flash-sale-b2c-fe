"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CategoryTreeNode {
  id: string | number;
  name: string;
  icon?: string;
  commissionPercent?: number;
  isCustomCommission?: boolean;
  children?: CategoryTreeNode[];
}

export interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  selectedId?: string | number;
  onSelectNode: (node: CategoryTreeNode) => void;
  onAddNew?: () => void;
  className?: string;
}

export function CategoryTree({
  nodes,
  selectedId,
  onSelectNode,
  onAddNew,
  className,
}: CategoryTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string | number, boolean>>(() => {
    // Default: expand first parent
    return nodes[0] ? { [nodes[0].id]: true } : {};
  });

  function toggleExpand(id: string | number, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function collapseAll() {
    setExpandedIds({});
  }

  // Filter nodes recursively
  const filteredNodes = nodes.filter((node) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesSelf = node.name.toLowerCase().includes(query);
    const matchesChild = node.children?.some((c) =>
      c.name.toLowerCase().includes(query)
    );
    return matchesSelf || matchesChild;
  });

  return (
    <section
      className={cn(
        "bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md border border-outline-variant/30 select-none",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-space-sm pb-space-sm border-b border-outline-variant/20">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-sm font-bold text-on-surface">
            Cây danh mục
          </h2>
          <span className="px-2 py-0.5 rounded-full font-label-sm text-[11px] bg-surface-container text-secondary font-semibold">
            {nodes.length} nhóm cha
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh danh mục..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm border border-transparent focus:border-primary"
            />
          </div>
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-primary hover:bg-primary-hover text-on-primary font-label-md text-xs font-semibold transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Thêm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tree items */}
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[700px] pr-1">
        {filteredNodes.map((parent) => {
          const isExpanded = !!expandedIds[parent.id];
          const hasChildren = parent.children && parent.children.length > 0;
          const isParentSelected = selectedId === parent.id;

          return (
            <div key={parent.id} className="flex flex-col">
              {/* Parent Row */}
              <div
                onClick={() => onSelectNode(parent)}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors group",
                  isParentSelected
                    ? "bg-primary-fixed text-primary font-bold shadow-xs"
                    : "hover:bg-surface-container-low"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(parent.id, e)}
                      className="p-0.5 hover:bg-black/5 rounded transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-secondary text-[20px] block">
                        {isExpanded ? "expand_more" : "chevron_right"}
                      </span>
                    </button>
                  ) : (
                    <span className="w-5" />
                  )}
                  <span
                    className={cn(
                      "material-symbols-outlined text-[20px]",
                      isParentSelected ? "text-primary" : "text-secondary"
                    )}
                  >
                    {parent.icon || (isExpanded ? "folder_open" : "folder")}
                  </span>
                  <span className="font-headline-md text-xs font-bold text-on-surface truncate">
                    {parent.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {hasChildren && (
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-label-sm font-semibold bg-surface-container-high text-secondary">
                      {parent.children?.length} mục con
                    </span>
                  )}
                  {parent.commissionPercent !== undefined && !hasChildren && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold",
                        parent.isCustomCommission
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : "bg-surface-container text-secondary"
                      )}
                    >
                      {parent.commissionPercent}%{parent.isCustomCommission ? " · riêng" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Children Sub-rows */}
              {hasChildren && isExpanded && (
                <div className="flex flex-col pl-7 mt-0.5 gap-0.5 border-l-2 border-surface-container ml-5">
                  {parent.children?.map((child) => {
                    const isChildSelected = selectedId === child.id;

                    return (
                      <div
                        key={child.id}
                        onClick={() => onSelectNode(child)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                          isChildSelected
                            ? "bg-primary-fixed text-primary font-semibold shadow-xs"
                            : "hover:bg-surface-container-low text-on-surface"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[18px] text-outline">
                            {isChildSelected
                              ? "check_circle"
                              : "subdirectory_arrow_right"}
                          </span>
                          <span
                            className={cn(
                              "truncate",
                              isChildSelected ? "font-bold text-primary" : "text-secondary hover:text-on-surface"
                            )}
                          >
                            {child.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {child.commissionPercent !== undefined && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold",
                                isChildSelected
                                  ? "bg-primary text-on-primary"
                                  : child.isCustomCommission
                                    ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                    : "bg-surface-container text-secondary"
                              )}
                            >
                              {child.commissionPercent}%{child.isCustomCommission ? " · riêng" : ""}
                            </span>
                          )}
                          <span className="material-symbols-outlined text-[16px] text-outline">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info & Action */}
      <div className="mt-space-sm p-3 rounded-lg bg-surface-container-low flex items-center justify-between text-secondary font-body-sm text-xs">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">
            account_tree
          </span>
          Phân cấp đa tầng SEO
        </span>
        <button
          type="button"
          onClick={collapseAll}
          className="text-primary hover:underline font-label-md text-xs font-semibold cursor-pointer"
        >
          Thu gọn tất cả
        </button>
      </div>
    </section>
  );
}
