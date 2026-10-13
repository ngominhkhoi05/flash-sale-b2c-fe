/**
 * MaterialSymbol – thin wrapper around `<span class="material-symbols-outlined">`
 * from Google's Material Symbols Outlined font.
 *
 * Why a wrapper (instead of using `<span>` everywhere):
 * - Centralizes the `material-symbols-outlined` class name
 * - Type-checks icon names against an allow-list derived from the
 *   Material Symbols v1 icon set used by Stitch "Trang chủ Storefront".
 * - Exposes a `fill` boolean (FILL=0/1) and `size` for ergonomic API.
 *
 * Mapping rules (Stitch homepage reference, project 15206106541998912100):
 * - Default style: outlined (FILL=0, wght=400)
 * - `fill` prop toggles FILL=1 for selected icons (verified, bolt, etc.)
 * - `size` is a Tailwind text-size class suffix (e.g. "lg" → text-lg).
 *
 * The actual font is loaded via a `<link>` in src/app/layout.tsx
 * (Google Fonts CDN: Material Symbols Outlined).
 */
import { cn } from "@/lib/utils";

export type MaterialSymbolName =
  // Navigation / chrome
  | "search"
  | "shopping_cart"
  | "notifications"
  | "menu"
  | "close"
  | "expand_more"
  | "chevron_right"
  | "arrow_forward"
  | "download"
  | "language"
  | "headset_mic"
  | "verified"
  | "verified_user"
  | "mail"
  | "phone_iphone"
  | "android"
  // Quick actions / categories
  | "bolt"
  | "confirmation_number"
  | "local_shipping"
  | "store"
  | "devices"
  // Cart page
  | "workspace_premium"
  | "arrow_drop_down"
  | "delete"
  | "remove_shopping_cart"
  | "chat"
  | "loyalty"
  | "check_circle"
  | "sell"
  | "error"
  // Categories
  | "man"
  | "woman"
  | "smartphone"
  | "laptop_mac"
  | "headphones"
  | "chair"
  | "spa"
  | "child_friendly"
  | "fitness_center"
  | "menu_book"
  | "local_grocery_store"
  | "toys"
  | "steps"
  | "shopping_bag"
  | "watch"
  | "two_wheeler"
  // Flash Sale / vouchers
  | "local_fire_department"
  | "savings"
  // Stores / featured
  | "recommend"
  | "trending_up"
  | "price_check"
  | "star"
  | "location_on"
  // Misc
  | "redeem"
  | "card_giftcard"
  | "favorite"
  | "favorite_border"
  | "share"
  | "person"
  | "lock"
  // Security / auth (added for Forbidden 403 page)
  | "shield_lock"
  | "home"
  | "switch_account"
  | "support_agent"
  | "account_circle"
  | "logout"
  // 404 page
  | "arrow_back"
  | "info"
  | "manage_search"
  // Maintenance page
  | "terminal"
  | "build"
  | "auto_awesome"
  | "arrow_back_ios_new"
  | "update"
  | "package_2";

export interface MaterialSymbolProps {
  name: MaterialSymbolName;
  /** true → `FILL=1` (filled), false (default) → outlined */
  fill?: boolean;
  /** Tailwind text-size class suffix (e.g. "sm", "lg", "2xl", "[14px]") */
  size?:
    | "xs"
    | "sm"
    | "base"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "[10px]"
    | "[12px]"
    | "[13px]"
    | "[14px]"
    | "[15px]"
    | "[16px]"
    | "[18px]"
    | "[19px]"
    | "[20px]"
    | "[24px]"
    | "[28px]"
    | "[40px]"
    | "[56px]"
    | "[80px]"
    | "[100px]"
    | "[120px]";
  className?: string;
  /** Optional accessible label; renders as aria-label. If absent, icon is decorative. */
  label?: string;
}

export function MaterialSymbol({
  name,
  fill = false,
  size = "base",
  className,
  label,
}: MaterialSymbolProps) {
  const sizeClass = size.startsWith("[") ? `text-${size}` : `text-${size}`;
  // Parse numeric size from "size" prop to apply as inline style.
  // This ensures the size wins over the Material Symbols base CSS
  // (which sets `font-size: 24px` with the same specificity as a Tailwind
  // utility class, so the load order would otherwise be ambiguous).
  const numericMatch = size.match(/^\[(\d+)px\]$/);
  const legacyMap: Record<string, number> = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  };
  const resolvedPx = numericMatch ? Number(numericMatch[1]) : legacyMap[size];
  const sizeStyle = resolvedPx ? { fontSize: `${resolvedPx}px` } : undefined;
  const style = fill
    ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24", ...sizeStyle }
    : sizeStyle;

  return (
    <span
      className={cn("material-symbols-outlined", sizeClass, className)}
      style={style}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-testid={`material-symbol-${name}`}
    >
      {name}
    </span>
  );
}
