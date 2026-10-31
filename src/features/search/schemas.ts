/**
 * Search feature – Zod schema cho URL params.
 *
 * Next 16: `searchParams` là async (Promise<...>). Page nhận `searchParams` rồi
 * dùng schema này để parse/validate trước khi pass xuống client component.
 *
 * Stitch reference: docs/superpowers/handoffs/tim-kiem-san-pham.md
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 */

import { z } from "zod";

import {
  DEFAULT_SEARCH_PAGE,
  DEFAULT_SEARCH_SORT,
  type SearchCityKey,
  type SearchFilters,
  type SearchServiceKey,
  type SearchSortKey,
  type SearchSubcategoryKey,
} from "./types";

/** Subcategory keys cho phép (chấp nhận dynamic category slug từ DB). */
const subcategoryEnum = z.string().trim().min(1);

const cityEnum = z.enum(["HCM", "HN", "DN", "BD"]) satisfies z.ZodType<SearchCityKey>;

const serviceEnum = z.enum([
  "flash-sale",
  "voucher",
  "freeship",
  "official",
]) satisfies z.ZodType<SearchServiceKey>;

const sortEnum = z.enum([
  "relevance",
  "newest",
  "best_selling",
  "price_asc",
  "price_desc",
]) satisfies z.ZodType<SearchSortKey>;

/** Coerce string → number, chỉ chấp nhận số nguyên dương. */
const optionalPositiveInt = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v) : undefined))
  .pipe(z.number().int().positive().optional());

/**
 * searchParamsSchema – parse `await searchParams` từ Next 16 page.
 *
 * Input: object dạng `{ q?: string; category?: string; city?: string; ... }`
 *   (searchParams có thể là string | string[] | undefined → mình chuẩn hoá trước.)
 * Output: `{ q, filters, sort, page }` đã validate.
 */
export const searchParamsSchema = z.object({
  q: z.string().trim().default(""),
  category: z
    .union([subcategoryEnum, z.array(subcategoryEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : [])),
  city: z
    .union([cityEnum, z.array(cityEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : [])),
  service: z
    .union([serviceEnum, z.array(serviceEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : [])),
  priceMin: optionalPositiveInt,
  priceMax: optionalPositiveInt,
  rating: z
    .union([z.coerce.number().int().min(3).max(5), z.array(z.coerce.number().int().min(3).max(5))])
    .optional()
    .transform((v): 3 | 4 | 5 | undefined => {
      if (!v) return undefined;
      const arr = Array.isArray(v) ? v : [v];
      if (arr.length === 0) return undefined;
      const max = Math.max(...arr);
      if (max === 3 || max === 4 || max === 5) return max;
      return undefined;
    }),
  sort: sortEnum.optional().default(DEFAULT_SEARCH_SORT),
  page: optionalPositiveInt.transform((v) => v ?? DEFAULT_SEARCH_PAGE),
});

export type ParsedSearchParams = z.infer<typeof searchParamsSchema>;

/**
 * Map parsed raw fields → `SearchFilters` cho hook/component.
 *  - Bỏ qua field rỗng
 *  - Giữ priceMin/priceMax/minRating nếu có
 */
export function toSearchFilters(parsed: ParsedSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  if (parsed.category.length > 0) filters.categories = parsed.category;
  if (parsed.priceMin !== undefined) filters.priceMin = parsed.priceMin;
  if (parsed.priceMax !== undefined) filters.priceMax = parsed.priceMax;
  if (parsed.rating !== undefined) filters.minRating = parsed.rating;
  return filters;
}

/**
 * Chuẩn hoá raw searchParams (Next 16) trước khi parse.
 *  - Bỏ undefined
 *  - Giữ nguyên mảng cho category (hỗ trợ lọc nhiều danh mục)
 *  - Lấy phần tử đầu nếu là array cho các params đơn lẻ khác
 *  - Trim string
 */
export function normalizeRawSearchParams(
  raw: Record<string, string | string[] | undefined> | undefined,
): Record<string, string | string[] | undefined> {
  if (!raw) return {};
  const out: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    if (k === "category" && Array.isArray(v)) {
      out[k] = v;
    } else {
      out[k] = Array.isArray(v) ? v[0] : v;
    }
  }
  return out;
}
