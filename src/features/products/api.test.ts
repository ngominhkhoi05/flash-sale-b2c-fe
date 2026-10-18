/**
* Test normalize variant attributes tu BE runtime.
*
* BE runtime that (audit 2026-10-18) tra `variant.attributes` voi keys LOWERCASE:
*   { size: "L", color: "Yellow", variant_index: "1" }
*
* Trong khi `tierVariationConfigs[].name` UPPERCASE: "Color", "Size".
*
* FE code (`ProductDetailPage.tsx`) doc `v.attributes["Color"]` / `["Size"]`
* uppercase -> undefined -> variant selector rong -> toast variantNotAvailable.
*
* Fix: normalize lowercase keys -> uppercase ngay tai API layer (defensive).
* Idempotent: neu BE doi sang uppercase (mock cu) thi giu nguyen.
*/
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api";
import {
fetchProductDetailBySlug,
fetchProductDetailById,
} from "./api";

vi.mock("@/lib/api", () => ({
apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
mockApiFetch.mockReset();
});

describe("fetchProductDetailBySlug - normalize variant.attributes keys", () => {
it("normalizes lowercase keys (size, color) -> uppercase (Size, Color)", async () => {
const beResponse = {
id: 3,
slug: "tui-xach-mini-3",
tierVariationConfigs: [
{ name: "Size", options: ["S", "M", "L"] },
{ name: "Color", options: ["Black", "White"] },
],
variants: [
{
id: 6,
productId: 3,
attributes: { size: "L", color: "Yellow", variant_index: "1" },
status: "ACTIVE",
isDisabled: false,
},
{
id: 7,
productId: 3,
attributes: { size: "S", color: "White", variant_index: "2" },
status: "ACTIVE",
isDisabled: false,
},
],
};
mockApiFetch.mockResolvedValueOnce(beResponse as never);

const result = await fetchProductDetailBySlug("tui-xach-mini-3");

expect(result.variants[0].attributes).toEqual({
Size: "L",
Color: "Yellow",
variant_index: "1",
});
expect(result.variants[1].attributes).toEqual({
Size: "S",
Color: "White",
variant_index: "2",
});
});

it("is idempotent: uppercase keys (mock shape) khong bi double-transform", async () => {
const mockResponse = {
id: 1,
slug: "ao-thun",
tierVariationConfigs: [
{ name: "Color", options: ["Trang"] },
{ name: "Size", options: ["M"] },
],
variants: [
{
id: 1,
productId: 1,
attributes: { Color: "Trang", Size: "M" },
status: "ACTIVE",
isDisabled: false,
},
],
};
mockApiFetch.mockResolvedValueOnce(mockResponse as never);

const result = await fetchProductDetailBySlug("ao-thun");

expect(result.variants[0].attributes).toEqual({
Color: "Trang",
Size: "M",
});
expect(result.variants[0].attributes).not.toHaveProperty("color");
expect(result.variants[0].attributes).not.toHaveProperty("size");
});

it("preserves unknown keys (variant_index) khong bi xoa", async () => {
const beResponse = {
id: 3,
slug: "test",
tierVariationConfigs: [],
variants: [
{
id: 1,
productId: 3,
attributes: {
size: "L",
color: "Black",
variant_index: "1",
custom_field: "keep_me",
},
status: "ACTIVE",
isDisabled: false,
},
],
};
mockApiFetch.mockResolvedValueOnce(beResponse as never);

const result = await fetchProductDetailBySlug("test");

expect(result.variants[0].attributes).toEqual({
Size: "L",
Color: "Black",
variant_index: "1",
custom_field: "keep_me",
});
});

it("handles product khong co variants (gracefully)", async () => {
const beResponse = {
id: 99,
slug: "no-variants",
tierVariationConfigs: [],
variants: [],
};
mockApiFetch.mockResolvedValueOnce(beResponse as never);

const result = await fetchProductDetailBySlug("no-variants");

expect(result.variants).toEqual([]);
});
});

describe("fetchProductDetailById - normalize variant.attributes keys", () => {
it("cung normalize uppercase/lowercase (idempotent cung helper)", async () => {
const beResponse = {
id: 6,
slug: "sac-du-phong-pro-6",
tierVariationConfigs: [],
variants: [
{
id: 14,
productId: 6,
attributes: { size: "M", color: "Green" },
status: "ACTIVE",
isDisabled: false,
},
],
};
mockApiFetch.mockResolvedValueOnce(beResponse as never);

const result = await fetchProductDetailById(6);

expect(result.variants[0].attributes).toEqual({
Size: "M",
Color: "Green",
});
});
});
