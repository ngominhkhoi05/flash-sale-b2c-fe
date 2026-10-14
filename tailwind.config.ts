import type { Config } from "tailwindcss";

/**
 * Design Tokens – Vibe Mart "Ocean Mint Console" & Flash Sale System
 * Nguồn: Google Stitch Project 14832303752856202968 & 10601817506611057935
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // === Primary Action (Ocean Blue) ===
        primary: {
          DEFAULT: "#0284c7",
          hover: "#0369a1",
          active: "#075985",
          container: "#007bb9",
          tint: "#e0f2fe",
          fixed: "#cce5ff",
          "fixed-dim": "#93ccff",
        },
        "on-primary": {
          DEFAULT: "#ffffff",
          container: "#fdfcff",
          fixed: "#001d31",
          "fixed-variant": "#004b73",
        },

        // === Flash Sale & Promotional (Electric Crimson) ===
        sale: {
          DEFAULT: "#e11d48",
          hover: "#be123c",
          container: "#ffe4e6",
          border: "#fecdd3",
          fixed: "#ffdada",
          "fixed-dim": "#ffb3b6",
        },
        tertiary: {
          DEFAULT: "#e11d48",
          hover: "#be123c",
          container: "#e21e49",
          fixed: "#ffdada",
          "fixed-dim": "#ffb3b6",
        },
        "on-tertiary": {
          DEFAULT: "#ffffff",
          container: "#fffbff",
          fixed: "#40000c",
          "fixed-variant": "#920028",
        },

        // === Admin Structural & Navigation ===
        admin: {
          DEFAULT: "#1e293b",
          hover: "#334155",
          border: "#e2e8f0",
          card: "#ffffff",
        },
        secondary: {
          DEFAULT: "#545f73",
          hover: "#3c475a",
          container: "#d5e0f8",
          fixed: "#d8e3fb",
        },
        "on-secondary": {
          DEFAULT: "#ffffff",
          container: "#586377",
          fixed: "#111c2d",
        },

        // === Canvas, Surfaces & Hierarchy ===
        canvas: "#f8fafc",
        surface: {
          DEFAULT: "#f8f9ff",
          dim: "#cbdbf5",
          bright: "#f8f9ff",
          container: "#e5eeff",
          "container-low": "#eff4ff",
          "container-lowest": "#ffffff",
          "container-high": "#dce9ff",
          "container-highest": "#d3e4fe",
          variant: "#d3e4fe",
          tint: "#006398",
        },
        "on-surface": {
          DEFAULT: "#0b1c30",
          variant: "#3f4850",
        },
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        outline: {
          DEFAULT: "#707881",
          variant: "#bfc7d2",
        },

        // === Operational State Feedback ===
        success: {
          DEFAULT: "#16a34a",
          container: "#dcfce7",
          text: "#16a34a",
        },
        warning: {
          DEFAULT: "#f59e0b",
          container: "#fef3c7",
          text: "#d97706",
        },
        error: {
          DEFAULT: "#dc2626",
          container: "#ffdad6",
          text: "#93000a",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-be-vietnam)",
          "Be Vietnam Pro",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "0.25rem", // 4px
        DEFAULT: "0.5rem", // 8px
        md: "0.5rem", // 8px
        lg: "0.75rem", // 12px
        xl: "1rem", // 16px
        full: "9999px",
      },
      boxShadow: {
        "level-1": "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        "level-2":
          "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        "level-3":
          "0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)",
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        gutter: "1.5rem",
        "gutter-sm": "1rem",
        margin: "2rem",
        "margin-sm": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
