/**
 * FeaturedStoresSection – Stitch "SHOP NỔI BẬT (VIBE MALL)" (Section #6).
 *
 * 4 store cards với avatar (chữ cái đầu) + tên + verified + rating + 3 thumbnail.
 *
 * Pixel-match reference:
 * Stitch HTML lines 557-719
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { FEATURED_STORES } from "./home-mocks";

export function FeaturedStoresSection() {
  const t = useTranslations("storefront.home");
  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-label-sm font-bold">
            {t("stores.mallBadge")}
          </span>
          <h2 className="text-headline-md text-on-surface font-bold">
            {t("stores.title")}
          </h2>
        </div>
        <Link
          href="/danh-muc/shop-chinh-hang"
          className="text-label-md text-primary hover:underline flex items-center gap-1"
        >
          {t("stores.seeAll")}
          <MaterialSymbol name="chevron_right" size="sm" />
        </Link>
      </div>

      {/* Grid stores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
        {FEATURED_STORES.map((store) => (
          <div
            key={store.id}
            className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              {/* Header: avatar + name + verified */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center font-bold shadow-sm text-lg",
                    store.initialColor
                  )}
                >
                  {store.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h4 className="text-label-lg text-on-surface font-bold truncate">
                      {store.name}
                    </h4>
                    {store.verified && (
                      <MaterialSymbol
                        name="verified"
                        size="[16px]"
                        fill
                        className="text-primary shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                    <span className="text-amber-600 font-semibold">
                      {t("stores.ratingPrefix")} {store.rating}
                    </span>
                    <span>·</span>
                    <span>
                      {store.followers} {t("stores.followersSuffix")}
                    </span>
                  </div>
                </div>
              </div>
              {/* 3 thumbnails */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {store.thumbnails.map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg bg-surface-container-lowest overflow-hidden"
                  >
                    <img
                      alt={`${store.name} thumbnail ${idx + 1}`}
                      src={url}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4">
              <Link
                href={`/shop/${store.id}`}
                className="block w-full py-1.5 rounded-lg bg-surface-container-lowest text-primary text-label-md hover:bg-primary hover:text-on-primary transition-colors text-center shadow-sm"
              >
                {t("stores.viewShop")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
