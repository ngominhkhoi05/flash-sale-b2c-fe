/**
 * Error404Illustration — pixel-perfect SVG of the "404" centerpiece
 * from Stitch screen 211f1b0c78254f89b529c59ba14fd9eb
 * ("Màn hình Lỗi 404 - Vibe Mart") in project 15206106541998912100.
 *
 * Composition (viewBox 460x190, responsive via `className`):
 *   - Two "4" digits (160px BeVietnam 800), fill primary-fixed, stroke primary 5px,
 *     dropShadow #006194/12% blur 16 (softGlow filter).
 *   - Center "0" = magnifying glass disc:
 *     - Outer rim: r=62, fill surface-container, stroke outline-variant 2px
 *     - Lens: r=54, fill surface-container-lowest, stroke primary 5px
 *     - Lens reflection arc + small dot (primary-fixed-dim)
 *     - Sad/lost package inside lens (surface-container-low fill, primary stroke 2.5px,
 *       with a tertiary-color "sad mouth" curve)
 *     - Handle: 12px primary + 4px primary-fixed-dim inner highlight
 *
 * All colors are inlined as hex (matching Stitch source) so the SVG
 * remains a single drop-in asset. Mapping to design tokens lives
 * inline as comments for reference.
 */
export function Error404Illustration({
  className = "w-[340px] h-[150px] sm:w-[460px] sm:h-[190px]",
}: {
  className?: string;
}) {
  return (
    <svg
      data-testid="error-404-illustration"
      className={`overflow-visible ${className}`}
      fill="none"
      viewBox="0 0 460 190"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Backdrop Glow behind 404 — Stitch filter: dy=8, flood-color=primary, opacity=0.12, stdDev=16 */}
      <filter height="140%" id="softGlow" width="140%" x="-20%" y="-20%">
        <feDropShadow
          dx="0"
          dy="8"
          floodColor="#006194" /* primary */
          floodOpacity="0.12"
          stdDeviation="16"
        />
      </filter>

      {/* Left 4 — fill=primary-fixed, stroke=primary 5px */}
      <text
        fill="#cce5ff" /* primary-fixed */
        filter="url(#softGlow)"
        fontFamily="'Be Vietnam Pro', sans-serif"
        fontSize="160"
        fontWeight="800"
        stroke="#006194" /* primary */
        strokeLinejoin="round"
        strokeWidth="5"
        textAnchor="middle"
        x="75"
        y="155"
      >
        4
      </text>

      {/* Center Magnifying Glass Disc as the "0" — @ (230, 85) */}
      <g transform="translate(230, 85)">
        {/* Outer subtle rim — surface-container + outline-variant */}
        <circle
          cx="0"
          cy="0"
          fill="#eaedff" /* surface-container */
          r="62"
          stroke="#bfc7d2" /* outline-variant */
          strokeWidth="2"
        />
        {/* Lens interior — surface-container-lowest + primary */}
        <circle
          cx="0"
          cy="0"
          fill="#ffffff" /* surface-container-lowest */
          r="54"
          stroke="#006194" /* primary */
          strokeWidth="5"
        />
        {/* Lens reflection arc + dot — primary-fixed-dim */}
        <path
          d="M -32 -24 A 42 42 0 0 1 18 -42"
          fill="none"
          stroke="#93ccff" /* primary-fixed-dim */
          strokeLinecap="round"
          strokeWidth="4"
        />
        <circle cx="20" cy="-20" fill="#93ccff" r="4" />
        {/* Sad/Lost Package inside lens — surface-container-low + primary */}
        <path
          d="M -16 -4 L 0 -14 L 16 -4 L 16 16 L 0 24 L -16 16 Z"
          fill="#f2f3ff" /* surface-container-low */
          stroke="#006194" /* primary */
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <path
          d="M 0 -14 L 0 24"
          stroke="#006194" /* primary */
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M -16 -4 L 0 5 L 16 -4"
          stroke="#006194" /* primary */
          strokeLinejoin="round"
          strokeWidth="2"
        />
        {/* Sad mouth — tertiary */}
        <path
          d="M -5 11 Q 0 8 5 11"
          fill="none"
          stroke="#ba0035" /* tertiary */
          strokeLinecap="round"
          strokeWidth="2"
        />
        {/* Handle angled downward right — primary outer + primary-fixed-dim inner */}
        <line
          stroke="#006194" /* primary */
          strokeLinecap="round"
          strokeWidth="12"
          x1="40"
          x2="68"
          y1="40"
          y2="68"
        />
        <line
          stroke="#93ccff" /* primary-fixed-dim */
          strokeLinecap="round"
          strokeWidth="4"
          x1="42"
          x2="66"
          y1="42"
          y2="66"
        />
      </g>

      {/* Right 4 — mirror of left "4" */}
      <text
        fill="#cce5ff" /* primary-fixed */
        filter="url(#softGlow)"
        fontFamily="'Be Vietnam Pro', sans-serif"
        fontSize="160"
        fontWeight="800"
        stroke="#006194" /* primary */
        strokeLinejoin="round"
        strokeWidth="5"
        textAnchor="middle"
        x="385"
        y="155"
      >
        4
      </text>
    </svg>
  );
}

export default Error404Illustration;
