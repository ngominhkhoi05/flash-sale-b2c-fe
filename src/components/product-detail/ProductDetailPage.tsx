/**
 * ProductDetailPage – Client Component orchestrator cho Product Detail.
 *
 * Quản lý state cục bộ:
 *   - `selectedColor`: màu hiện tại (mặc định = màu đầu tiên của variants)
 *   - `selectedSize`: size hiện tại (mặc định = size đầu tiên KHÔNG disabled)
 *   - `quantity`: số lượng (mặc định = 1)
 *   - `activeVariant`: "standard" | "flash" (mặc định = "flash" nếu có FlashSale)
 *
 * Effect khi chuyển từ flash → standard: clamp quantity về stockCount.
 *
 * Layout: 2-col desktop (lg:col-span-7 gallery + lg:col-span-5 sidebar),
 * stack 1-col trên mobile. Sidebar sticky trên desktop.
 */
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductBreadcrumb } from "@/components/product-detail/ProductBreadcrumb";
import { ProductVariantSwitcher } from "@/components/product-detail/ProductVariantSwitcher";
import { ProductGallery } from "@/components/product-detail/ProductGallery";
import { ProductShareBar } from "@/components/product-detail/ProductShareBar";
import { ProductCommitments } from "@/components/product-detail/ProductCommitments";
import { ProductHeaderInfo } from "@/components/product-detail/ProductHeaderInfo";
import { ProductPricingBox } from "@/components/product-detail/ProductPricingBox";
import { ProductVouchers } from "@/components/product-detail/ProductVouchers";
import { ProductShipping } from "@/components/product-detail/ProductShipping";
import { ProductVariantSelectors } from "@/components/product-detail/ProductVariantSelectors";
import { ProductQuantityStepper } from "@/components/product-detail/ProductQuantityStepper";
import { ProductCtaButtons } from "@/components/product-detail/ProductCtaButtons";
import { ProductStoreCard } from "@/components/product-detail/ProductStoreCard";
import { ProductSpecsTable } from "@/components/product-detail/ProductSpecsTable";
import { ProductDescriptionCard } from "@/components/product-detail/ProductDescriptionCard";
import { ProductReviewsCard } from "@/components/product-detail/ProductReviewsCard";
import { ProductRelatedStores } from "@/components/product-detail/ProductRelatedStores";
import { ProductBestSellers } from "@/components/product-detail/ProductBestSellers";
import type { ProductDetail } from "@/features/products";

export interface ProductDetailPageProps {
  product: ProductDetail;
}

/**
 * Lấy màu đầu tiên từ variants (slug = "Màu Sắc"), fallback dựa trên tier configs.
 */
function deriveColors(
  product: ProductDetail,
): Array<{ name: string; bgClass: string }> {
  // Nếu variants đã có attributes "Màu Sắc", dedupe theo tên + giữ thứ tự.
  const seen = new Set<string>();
  const out: Array<{ name: string; bgClass: string }> = [];
  for (const v of product.variants) {
    const c = v.attributes["Màu Sắc"];
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push({ name: c, bgClass: colorToBg(c) });
  }
  if (out.length > 0) return out;

  // Fallback: đọc từ tier configs
  const tier = product.tierVariationConfigs.find(
    (t) => t.name === "Màu Sắc",
  );
  if (!tier) return [];
  return tier.options.map((name) => ({ name, bgClass: colorToBg(name) }));
}

function deriveSizes(
  product: ProductDetail,
): Array<{ label: string; disabled: boolean }> {
  const seen = new Set<string>();
  const out: Array<{ label: string; disabled: boolean }> = [];
  for (const v of product.variants) {
    const s = v.attributes["Kích Thước"];
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push({ label: s, disabled: v.isDisabled });
  }
  if (out.length > 0) return out;

  const tier = product.tierVariationConfigs.find(
    (t) => t.name === "Kích Thước",
  );
  if (!tier) return [];
  return tier.options.map((label) => ({ label, disabled: false }));
}

/**
 * Best-effort mapping tên màu → Tailwind bg utility. Trả về bg hợp lý
 * dựa trên keyword để chip hiển thị đúng màu trên UI.
 */
function colorToBg(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trắng")) return "bg-slate-100";
  if (n.includes("đen")) return "bg-slate-900";
  if (n.includes("vàng")) return "bg-amber-200";
  if (n.includes("xanh")) return "bg-sky-300";
  if (n.includes("đỏ")) return "bg-red-500";
  return "bg-slate-300";
}

/**
 * Tổng stock có sẵn cho mặt hàng hiện tại (sum variants không disabled).
 */
function totalStockCount(product: ProductDetail): number {
  let total = 0;
  for (const v of product.variants) {
    if (!v.isDisabled) total += v.stockQuantity;
  }
  return total;
}

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const t = useTranslations("productDetail");

  const colors = useMemo(() => deriveColors(product), [product]);
  const sizes = useMemo(() => deriveSizes(product), [product]);

  const [selectedColor, setSelectedColor] = useState<string>(
    () => colors[0]?.name ?? "",
  );
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const firstAvailable = sizes.find((s) => !s.disabled);
    return firstAvailable?.label ?? sizes[0]?.label ?? "";
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [activeVariant, setActiveVariant] = useState<"standard" | "flash">(
    product.flashSale ? "flash" : "standard",
  );

  const stockCount = totalStockCount(product);
  const flashMaxQty = product.flashSale?.maxQtyPerUser ?? 2;
  const maxQty = activeVariant === "flash" ? flashMaxQty : stockCount;

  // Derived: khi color/size không khớp variant nào active, tự động chọn size available.
  const variantForCurrent = product.variants.find(
    (v) =>
      v.attributes["Màu Sắc"] === selectedColor &&
      v.attributes["Kích Thước"] === selectedSize,
  );
  const effectiveSize =
    variantForCurrent && !variantForCurrent.isDisabled
      ? selectedSize
      : (sizes.find((s) => !s.disabled)?.label ?? selectedSize);

  // Clamp quantity theo effective maxQty — dùng event handler wrapper thay vì effect.
  function clampQuantity(qty: number, cap: number) {
    return Math.max(1, Math.min(cap, qty));
  }
  const safeQuantity = clampQuantity(quantity, maxQty);

  // Khi user đổi color mà size hiện tại không available, tự động đổi size.
  function handleColorChange(color: string) {
    setSelectedColor(color);
    const stillValid = product.variants.some(
      (v) =>
        v.attributes["Màu Sắc"] === color &&
        v.attributes["Kích Thước"] === selectedSize &&
        !v.isDisabled,
    );
    if (!stillValid) {
      const firstAvailable = sizes.find(
        (s) => !s.disabled && s.label !== selectedSize,
      );
      if (firstAvailable) setSelectedSize(firstAvailable.label);
    }
  }

  function handleVariantChange(v: "standard" | "flash") {
    setActiveVariant(v);
    // Khi chuyển từ flash → standard, clamp quantity về stockCount.
    if (v === "standard" && quantity > stockCount) {
      setQuantity(Math.max(1, stockCount));
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4">
      {/* Breadcrumb full-width */}
      <ProductBreadcrumb
        categoryName={product.categoryName}
        productName={product.name}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ─── Left column: store card (sticky) ─── */}
        <div className="flex flex-col gap-4 lg:col-span-5 lg:order-1">
          <div className="sticky top-4 flex flex-col gap-6">
            <ProductStoreCard store={product.storeProfile} />

            {/* Section 19: Related same-store products */}
            <ProductRelatedStores products={product.relatedSameStore} />

            {/* Section 20: Best sellers */}
            <ProductBestSellers products={product.relatedBestSellers} />
          </div>
        </div>

        {/* ─── Right column: all product info sections ─── */}
        <div className="flex flex-col gap-4 lg:col-span-7 lg:order-2">
          {/* Section 2: Variant Switcher A/B */}
          {product.flashSale && (
            <ProductVariantSwitcher
              value={activeVariant}
              onChange={handleVariantChange}
            />
          )}

          {/* Section 3: Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Section 4: Share bar */}
          <ProductShareBar
            likedCount={t("wishlist.count")}
          />

          {/* Section 5: Commitments */}
          <ProductCommitments commitments={product.commitments} />

          {/* Section 6: Vouchers */}
          <ProductVouchers vouchers={product.vouchers} />

          {/* Section 7: Shipping */}
          <ProductShipping shipping={product.shipping} />

          {/* Section 8: Header info (tags + title + rating) */}
          <ProductHeaderInfo
            tags={{
              favorite: true,
              official: product.storeProfile.isOfficial,
              sku: product.specs.sku,
            }}
            title={product.name}
            ratingAvg={product.ratingAvg}
            ratingCount={product.ratingCount}
            soldCount={product.soldCount}
            questionCount={product.questionCount}
          />

          {/* Section 9: Pricing box (A or B) */}
          <ProductPricingBox
            variant={activeVariant}
            minPrice={
              activeVariant === "flash" && product.flashSale
                ? product.flashSale.price
                : product.minPrice
            }
            originalPrice={product.maxPrice}
            discountPercent={product.discountPercent ?? 0}
            flashSale={
              product.flashSale
                ? {
                    endsAt: product.flashSale.endsAt,
                    soldStock: product.flashSale.soldStock,
                    totalStock: product.flashSale.totalStock,
                    maxQtyPerUser: product.flashSale.maxQtyPerUser,
                  }
                : null
            }
          />

          {/* Section 10: Variant Switcher controls (visible below pricing) */}
          {product.flashSale && (
            <ProductVariantSwitcher
              value={activeVariant}
              onChange={handleVariantChange}
            />
          )}

          {/* Section 11: Color + Size selectors */}
          <ProductVariantSelectors
            colors={colors}
            sizes={sizes}
            selectedColor={selectedColor}
            selectedSize={effectiveSize}
            onColorChange={handleColorChange}
            onSizeChange={setSelectedSize}
          />

          {/* Section 12: Quantity stepper */}
          <ProductQuantityStepper
            value={safeQuantity}
            max={maxQty}
            stockCount={stockCount}
            onChange={setQuantity}
          />

          {/* Section 13: CTA buttons */}
          <ProductCtaButtons
            mode={activeVariant}
            onAddToCart={() => {
              // Mock: thêm vào giỏ — sẽ wire với useCart khi có BE.
              if (typeof window !== "undefined") {
                window.alert(t("toast.addedToCart"));
              }
            }}
            onBuyNow={() => {
              // Mock: redirect checkout — sẽ wire với router khi có BE.
              if (typeof window !== "undefined") {
                window.alert(t("toast.redirectingCheckout"));
              }
            }}
          />

          {/* Section 14: Description card */}
          <ProductDescriptionCard
            descriptionRich={product.descriptionRich}
            features={product.features}
            sizeChart={product.sizeChart}
          />

          {/* Section 15: Specs table */}
          <ProductSpecsTable specs={product.specs} />

          {/* Section 18: Reviews card */}
          <ProductReviewsCard
            reviews={product.reviews}
            ratingAvg={product.ratingAvg}
            ratingCount={product.ratingCount}
          />
        </div>
      </div>
    </div>
  );
}