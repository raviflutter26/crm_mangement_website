import path from "path";
import type { NextConfig } from "next";

/**
 * Two static sites from one codebase (see ROUTES.md).
 *
 * NEXT_PUBLIC_APP_SURFACE=tenant (default) — the company app. Route files use
 * the normal extensions (page.tsx, layout.tsx …); files named *.console.tsx
 * are not route files in this build, so no console page can be reached here.
 * Exported to out/.
 *
 * NEXT_PUBLIC_APP_SURFACE=console — the RIVO platform console. Only files
 * ending in .console.tsx are route files (page.console.tsx,
 * layout.console.tsx …), so the company app's pages are not part of it.
 * Exported to out-console/ (with output: 'export', distDir names the export
 * folder; the build itself still runs in .next/).
 */
const surface = process.env.NEXT_PUBLIC_APP_SURFACE === "console" ? "console" : "tenant";

const nextConfig: NextConfig = {
  output: "export",
  // Always inline the surface, even when the variable is unset (tenant), so
  // each build's minifier can drop the other surface's code paths.
  env: { NEXT_PUBLIC_APP_SURFACE: surface },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
  ...(surface === "console"
    ? { pageExtensions: ["console.tsx", "console.ts"], distDir: "out-console" }
    : {}),
};

export default nextConfig;
