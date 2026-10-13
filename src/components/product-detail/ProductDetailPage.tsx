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

      {/* ─── Row 1: Product Info (2 columns) ─── */}
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-7">
          {/* Section 2: Variant Switcher A/B (top of gallery) */}
          {product.flashSale && (
            <div className="mb-4">
              <ProductVariantSwitcher
                value={activeVariant}
                onChange={handleVariantChange}
              />
            </div>
          )}
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Product Info Sidebar */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Section 3: Header info (tags + title + rating) */}
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

          {/* Section 4: Pricing box */}
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

          {/* Section 5: Variant Switcher controls (below pricing) */}
          {product.flashSale && (
            <ProductVariantSwitcher
              value={activeVariant}
              onChange={handleVariantChange}
            />
          )}

          {/* Section 6: Color + Size selectors */}
          <ProductVariantSelectors
            colors={colors}
            sizes={sizes}
            selectedColor={selectedColor}
            selectedSize={effectiveSize}
            onColorChange={handleColorChange}
            onSizeChange={setSelectedSize}
          />

          {/* Section 7: Quantity stepper */}
          <ProductQuantityStepper
            value={safeQuantity}
            max={maxQty}
            stockCount={stockCount}
            onChange={setQuantity}
          />

          {/* Section 8: CTA buttons */}
          <ProductCtaButtons
            mode={activeVariant}
            onAddToCart={() => {
              if (typeof window !== "undefined") {
                window.alert(t("toast.addedToCart"));
              }
            }}
            onBuyNow={() => {
              if (typeof window !== "undefined") {
                window.alert(t("toast.redirectingCheckout"));
              }
            }}
          />

          {/* Section 9: Share bar */}
          <ProductShareBar likedCount={t("wishlist.count")} />
        </div>
      </div>

      {/* ─── Row 2: Store Card (full width) ─── */}
      <div className="mt-6">
        <ProductStoreCard store={product.storeProfile} />
      </div>

      {/* ─── Row 3: Commitments + Vouchers + Shipping (1 column, stacked) ─── */}
      <div className="mt-6 flex flex-col gap-4">
        <ProductCommitments commitments={product.commitments} />
        <ProductVouchers vouchers={product.vouchers} />
        <ProductShipping shipping={product.shipping} />
      </div>

      {/* ─── Row 4: Product Content (2 columns) ─── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Description + Specs */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <ProductDescriptionCard
            descriptionRich={product.descriptionRich}
            features={product.features}
            sizeChart={product.sizeChart}
          />
          <ProductSpecsTable specs={product.specs} />
        </div>

        {/* Right: Related + Best Sellers */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <ProductRelatedStores products={product.relatedSameStore} />
          <ProductBestSellers products={product.relatedBestSellers} />
        </div>
      </div>

      {/* ─── Row 5: Reviews (full width) ─── */}
      <div className="mt-6">
        <ProductReviewsCard
          reviews={product.reviews}
          ratingAvg={product.ratingAvg}
          ratingCount={product.ratingCount}
        />
      </div>
    </div>
  );
}