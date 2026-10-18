import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SellerCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  noPadding?: boolean;
}

export function SellerCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  headerClassName,
  noPadding = false,
}: SellerCardProps) {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <div
      className={cn(
        "bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-shadow overflow-hidden",
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            "px-space-md py-space-sm border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2",
            headerClassName
          )}
        >
          <div>
            {title && (
              <div className="font-headline-md text-body-lg font-bold text-on-surface">
                {title}
              </div>
            )}
            {subtitle && (
              <p className="font-body-md text-label-sm text-secondary mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={cn(!noPadding && "p-space-md", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
