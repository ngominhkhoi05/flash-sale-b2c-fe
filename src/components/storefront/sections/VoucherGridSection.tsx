"use client";

/**
 * VoucherGridSection – Stitch "MÃ GIẢM GIÁ CHO BẠN" (Section #5).
 *
 * Gồm 4 voucher ticket dạng "vé xé" (left badge + right content + dashed border).
 * Mỗi voucher có button "Lưu" toggle sang "Đã lưu" khi click.
 *
 * Logic state dùng `useState<Set<string>>` để track các voucher đã lưu.
 *
 * Pixel-match reference:
 * Stitch HTML lines 459-552
 */
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { VOUCHER_TICKETS, type VoucherTicket } from "./home-mocks";

export function VoucherGridSection() {
  const t = useTranslations("storefront.home");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getBadgeStyle = (ticket: VoucherTicket) => {
    if (ticket.type === "freeship") {
      return "bg-primary-container text-on-primary-container";
    }
    if (ticket.amount.endsWith("K")) {
      return "bg-primary text-on-primary";
    }
    if (ticket.amount.endsWith("%")) {
      return "bg-tertiary text-on-tertiary";
    }
    return "bg-secondary text-on-secondary";
  };

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <MaterialSymbol name="confirmation_number" size="2xl" className="text-primary" />
          <h2 className="text-headline-md text-on-surface font-bold">
            {t("voucher.title")}
          </h2>
        </div>
        <Link
          href="/kho-voucher"
          className="text-label-md text-primary hover:underline flex items-center gap-1"
        >
          {t("voucher.voucherCount")}
          <MaterialSymbol name="chevron_right" size="sm" />
        </Link>
      </div>

      {/* Grid tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
        {VOUCHER_TICKETS.map((ticket) => {
          const isSaved = savedIds.has(ticket.id);
          const ticketLabelKey =
            ticket.amount === "50K"
              ? "voucher.tickets.discount50k"
              : ticket.amount === "100K"
                ? "voucher.tickets.discount100k"
                : ticket.type === "freeship"
                  ? "voucher.tickets.freeship"
                  : "voucher.tickets.techCode";

          return (
            <div
              key={ticket.id}
              className="relative flex bg-surface-container-low rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Left badge */}
              <div
                className={cn(
                  "w-24 flex flex-col items-center justify-center p-2 text-center relative border-r-2 border-dashed border-surface-container-lowest",
                  getBadgeStyle(ticket)
                )}
              >
                {ticket.type === "freeship" ? (
                  <>
                    <MaterialSymbol name="local_shipping" size="2xl" />
                    <span className="text-[10px] mt-1 font-bold">{ticket.amount}</span>
                  </>
                ) : (
                  <>
                    <span className="text-headline-sm font-bold leading-none">
                      {ticket.amount}
                    </span>
                    <span className="text-[10px] mt-1 font-medium">{t(ticketLabelKey)}</span>
                  </>
                )}
                {/* Notches */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-surface-container-lowest rounded-full" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-surface-container-lowest rounded-full" />
              </div>
              {/* Right content */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-label-lg text-on-surface font-bold">
                    {ticket.label}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant">
                    {ticket.subtitle}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container">
                  <span className="text-[11px] text-outline">
                    {t("voucher.expiresAt")}: {ticket.expiresAt}
                  </span>
                  <button
                    onClick={() => toggleSaved(ticket.id)}
                    className={cn(
                      "px-3 py-1 rounded text-label-sm transition-colors",
                      isSaved
                        ? "bg-surface-container-high text-outline"
                        : cn(
                            "text-on-primary hover:opacity-90",
                            ticket.amount === "100K"
                              ? "bg-secondary hover:bg-on-secondary-container"
                              : ticket.amount.endsWith("%")
                                ? "bg-tertiary hover:bg-tertiary-container"
                                : "bg-primary hover:bg-primary-container"
                          )
                    )}
                    aria-pressed={isSaved}
                    data-testid={`save-${ticket.id}`}
                  >
                    {isSaved ? t("voucher.savedAction") : t("voucher.saveAction")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
