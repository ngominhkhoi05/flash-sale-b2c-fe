/**
 * Smoke test for /search route via renderToString với NextIntlClientProvider.
 *
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan B)
 */

import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import viMessages from "@/../messages/vi.json";

import SearchPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/search",
}));

vi.mock("@/features/search", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/search")>(
      "@/features/search",
    );
  return {
    ...actual,
    searchProducts: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      facets: { subcategories: [], cities: [], ratings: [], services: [] },
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

async function renderPage(searchParams: Record<string, string> = {}) {
  const element = await SearchPage({
    searchParams: Promise.resolve(searchParams),
  });
  return renderToString(
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {element}
    </NextIntlClientProvider>,
  );
}

describe("SearchPage (Server Component) – smoke", () => {
  it("renders without crashing when searchParams is empty", async () => {
    const html = await renderPage({});
    expect(html).toContain("search-filter-sidebar");
  });

  it("renders the breadcrumb nav", async () => {
    const html = await renderPage({});
    expect(html).toContain("Trang chủ");
  });

  it("renders the search heading and empty state when no q", async () => {
    const html = await renderPage({});
    // Empty state: 'Không tìm thấy sản phẩm phù hợp' (since mock total=0)
    expect(html).toContain("Không tìm thấy sản phẩm phù hợp");
  });

  it("renders error UI when searchProducts throws", async () => {
    const { searchProducts } = await import("@/features/search");
    vi.mocked(searchProducts).mockRejectedValueOnce(new Error("Network down"));
    const html = await renderPage({});
    expect(html).toContain("Không tải được kết quả");
  });
});
