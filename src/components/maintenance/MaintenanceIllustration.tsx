import { MaterialSymbol } from "@/components/ui/material-symbol";

/**
 * MaintenanceIllustration – SVG spinner centerpiece
 *
 * Pixel-perfect re-implementation of the centerpiece from Stitch design
 * system screen `4dc42fa4da2345148536ed23af2364f1` ("Tính năng đang được
 * nâng cấp - Vibe Mart") in project 15206106541998912100.
 *
 * Layout (Stitch HTML, from outside → inside):
 *   - Glow halo 1 (160×160, primary-fixed 40%, blur-2xl, scale-110)
 *   - Glow halo 2 (128×128, secondary-fixed 30%, blur-lg)
 *   - White circle (112×112, surface-container-lowest, shadow-md)
 *   - SVG spinner (64×64, primary container inner, 20s linear rotation)
 *   - "build" badge (48×48, secondary, rotated 12°, anchored bottom-right)
 *   - "auto_awesome" sparkle (text-headline-sm, secondary-container, pulse, top-left)
 *   - "arrow_back_ios_new" decoration (text-headline-sm, primary-fixed-dim, top-right)
 *
 * The animation uses `animate-spin` (Tailwind default 1s) with an inline
 * `style.animationDuration: "20s"` to match Stitch's `animate-[spin_20s_linear_infinite]`.
 */
export function MaintenanceIllustration() {
  return (
    <div
      data-testid="maintenance-illustration"
      className="relative w-40 h-40 mb-6 flex items-center justify-center"
    >
      {/* Halo 1 — primary-fixed 40%, scaled 110% */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-2xl scale-110"
        style={{
          background:
            "color-mix(in srgb, var(--color-primary-fixed) 40%, transparent)",
        }}
      />
      {/* Halo 2 — secondary-fixed 30%, 128×128 */}
      <div
        aria-hidden="true"
        className="absolute w-32 h-32 rounded-full blur-lg"
        style={{
          background:
            "color-mix(in srgb, var(--color-secondary-fixed) 30%, transparent)",
        }}
      />
      {/* White circle base */}
      <div className="relative w-28 h-28 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center">
        {/* Spinner SVG (12 rays + 4.5r inner circle) */}
        <svg
          className="w-16 h-16 text-primary"
          style={{ animation: "spin 20s linear infinite" }}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
          data-testid="maintenance-spinner"
        >
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          <circle
            className="fill-surface-container text-primary-container"
            cx="12"
            cy="12"
            r="4.5"
          />
        </svg>
        {/* Build badge — rotated 12°, anchors bottom-right */}
        <div className="absolute w-12 h-12 rounded-xl bg-secondary text-on-secondary shadow-sm flex items-center justify-center -bottom-1 -right-1 rotate-12 hover:rotate-0 transition-transform duration-300">
          <MaterialSymbol
            name="build"
            fill
            size="[24px]"
            className="text-on-secondary"
            label="build"
          />
        </div>
        {/* Sparkle — top-left, pulsing */}
        <MaterialSymbol
          name="auto_awesome"
          fill
          size="[18px]"
          className="absolute -top-1 left-2 text-secondary-container animate-pulse"
        />
        {/* Decorative arrow — top-right */}
        <MaterialSymbol
          name="arrow_back_ios_new"
          size="[18px]"
          className="absolute top-4 -right-2 text-primary-fixed-dim"
        />
      </div>
    </div>
  );
}

export default MaintenanceIllustration;
