import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local-only paths (already in .gitignore but eslint still scans them by default):
    // - tmp/: Chrome DevTools userdata dumps (extension bundled JS), see .gitignore
    // - agent-tools/: agent scratch downloads (Stitch/Figma reference assets)
    // - .superpowers/, .scratch/, .worktrees/: internal agent scratch
    // - scripts/*.cjs, scripts/*.js: one-off CommonJS debug helpers (gitignored,
    //   hard-coded absolute paths). Whitelisted .mjs files (audit-workflow etc.) are still linted.
    "tmp/**",
    "agent-tools/**",
    ".superpowers/**",
    ".scratch/**",
    ".worktrees/**",
    "scripts/**/*.cjs",
    "scripts/**/*.js",
  ]),
]);

export default eslintConfig;
