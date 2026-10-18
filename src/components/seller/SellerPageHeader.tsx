import React, { ReactNode } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SellerPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function SellerPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: SellerPageHeaderProps) {
  return (
    <div className="flex flex-col gap-space-xs mb-space-md">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-body-sm text-secondary mb-1">
          <Link href="/seller" className="hover:text-on-surface transition-colors">
            Kênh Người Bán
          </Link>
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              <MaterialSymbol name="chevron_right" size="[14px]" className="text-outline" />
              {bc.href ? (
                <Link href={bc.href} className="hover:text-on-surface transition-colors">
                  {bc.label}
                </Link>
              ) : (
                <span className="text-on-surface font-medium">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="font-body-md text-body-sm text-secondary mt-0.5">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-space-sm flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
