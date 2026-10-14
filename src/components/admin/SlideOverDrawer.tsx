"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  width?: "440px" | "460px" | "520px";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  width = "440px",
  children,
  footer,
  className,
}: SlideOverDrawerProps) {
  // Listen for Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass =
    width === "460px"
      ? "sm:w-[460px]"
      : width === "520px"
        ? "sm:w-[520px]"
        : "sm:w-[440px]";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-screen w-full bg-surface-container-lowest shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-outline-variant/30 animate-in slide-in-from-right",
          widthClass,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="h-16 px-space-md flex items-center justify-between bg-surface-bright shrink-0 border-b border-surface-container">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="material-symbols-outlined text-primary text-[22px] shrink-0">
                {icon}
              </span>
            )}
            <div className="flex flex-col min-w-0">
              <h2 className="font-headline-md text-sm font-bold text-on-surface truncate">
                {title}
              </h2>
              {subtitle && (
                <span className="font-label-sm text-[11px] text-secondary truncate">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Đóng panel"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-lg">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="p-space-md bg-surface-bright flex items-center justify-between gap-space-sm shrink-0 border-t border-surface-container">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
