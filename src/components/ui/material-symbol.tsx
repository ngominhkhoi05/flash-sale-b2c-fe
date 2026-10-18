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
  | "content_copy"
  | "warning"
  | "alarm_off"
  | "task_alt"
  | "layers"
  // Quick actions / categories
  | "bolt"
  | "confirmation_number"
  | "local_shipping"
  | "local_offer"
  | "qr_code_2"
  | "sell"
  | "payments"
  | "security"
  | "credit_card"
  | "receipt_long"
  | "check_circle"
  | "error"
  | "health_and_safety"
  | "verified"
  | "verified_user"
  | "call"
  | "store"
  | "devices"
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
  | "storefront"
  | "signal_cellular_alt"
  | "wifi"
  | "battery_full"
  | "help"
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
  // Seller Center symbols (Stitch)
  | "grid_view"
  | "account_balance_wallet"
  | "group"
  | "open_in_new"
  | "local_mall"
  | "query_stats"
  | "pending_actions"
  | "drag_handle"
  | "arrow_upward"
  | "file_download"
  | "expand_circle_down"
  | "subdirectory_arrow_right"
  | "more_horiz"
  | "delete"
  | "edit"
  | "visibility_off"
  | "file_upload"
  | "help_outline"
  | "add_photo_alternate"
  | "photo_camera"
  | "format_list_bulleted"
  | "format_list_numbered"
  | "format_align_left"
  | "format_align_center"
  | "image"
  | "table_chart"
  | "delete_outline"
  | "done_all"
  | "sync"
  | "cloud_done"
  | "publish"
  | "print"
  | "filter_list"
  | "event_available"
  | "history"
  | "nights_stay"
  | "weekend"
  | "send"
  | "more_vert"
  | "cancel"
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
  | "add"
  | "check"
  // Maintenance page
  | "terminal"
  | "build"
  | "auto_awesome"
  | "arrow_back_ios_new"
  | "update"
  | "package_2"
  // Flash Sale page (added 2026-10-13)
  | "remove_red_eye"
  | "schedule"
  | "notifications_active"
  | "visibility"
  // Search page (added 2026-10-13)
  | "tune"
  | "restart_alt"
  | "search_off"
  | "filter_alt_off"
  | "chevron_left"
  | "trending_up"
  // Failed payment page (added 2026-10-14)
  | "hourglass_top"
  | "refresh"
  | "inventory_2"
  | "timer"
  // Expired order page (added 2026-10-14)
  | "hourglass_disabled"
  | "verified"
  | "check_circle"
  | "bolt"
  | "shopping_cart"
  | "calendar_today"
  | "arrow_drop_down"
  | "near_me"
  | "chat"
  | "map"
  | "rate_review"
  | "arrow_back_ios_new"
  // Added for Account & Orders & Seller onboarding (Stitch specs #16-#19)
  | "expand_less"
  | "hourglass_empty"
  | "replay"
  | "my_location"
  | "save"
  | "lock_reset"
  | "badge"
  | "link"
  | "pin_drop"
  | "percent"
  | "qr_code"
  | "upload";

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
    | "[14px]"
    | "[16px]"
    | "[18px]"
    | "[20px]"
    | "[22px]"
    | "[24px]"
    | "[28px]"
    | "[32px]"
    | "[36px]"
    | "[40px]"
    | "[48px]"
    | "[56px]"
    | "[64px]"
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
