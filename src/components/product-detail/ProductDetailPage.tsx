/**
 * ProductDetailPage – Client Component orchestrator cho Product Detail.
 *
 * Quản lý state cục bộ:
 *   - `selectedColor`: màu hiện tại (mặc định = màu đầu tiên của variants)
 *   - `selectedSize`: size hiện tại (mặc định = size đầu tiên KHÔNG disabled)
 *   - `quantity`: số lượng (mặc định = 1)
 *
 * Auto-select variant: nếu product có flashSale active → dùng variant "flash",
 * ngược lại dùng variant "standard". KHÔNG có switcher UI.
 *
 * Layout: 2-col desktop (1/3 gallery + 2/3 sidebar),
 * stack 1-col trên mobile.
 *
 * Updated 2026-10-18 — align với BE `ProductDetailResponse`:
 *   - `flashSale` (singular) → `flashSales: ActiveFlashSaleDto[]`. Pick `flashSales[0]`.
 *   - `specs.sku` (FE-only) → KHÔNG truyền sku xuống ProductHeaderInfo (BE không trả).
 *   - `minPrice`/`maxPrice` (nullable) → defensive khi null.
 */
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductBreadcrumb } from "@/components/product-detail/ProductBreadcrumb";
import { ProductGallery } from "@/components/product-detail/ProductGallery";
import { useAddToCart } from "@/features/cart";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { ApiError } from "@/lib/api/client";
import { ProductCommitments } from "@/components/product-detail/ProductCommitments";
import { ProductShareBar } from "@/components/product-detail/ProductShareBar";
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
import type {
  ActiveFlashSaleDto,
  ProductDetail,
} from "@/features/products";

export interface ProductDetailPageProps {
  product: ProductDetail;
}

/**
 * Lấy màu đầu tiên từ variants (key BE: "Color"), fallback dựa trên tier configs.
 *
 * Quyết định 2026-10-18: dùng key BE runtime (English: "Color"). BE trả
 * `variant.attributes: {Color: "Yellow"}` + `tier.name: "Color"`.
 */
function deriveColors(
  product: ProductDetail,
): Array<{ name: string; bgClass: string }> {
  const seen = new Set<string>();
  const out: Array<{ name: string; bgClass: string }> = [];
  for (const v of product.variants) {
    const c = v.attributes["Color"];
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push({ name: c, bgClass: colorToBg(c) });
  }
  if (out.length > 0) return out;

  const tier = product.tierVariationConfigs.find(
    (t) => t.name === "Color",
  );
  if (!tier) return [];
  return tier.options.map((name) => ({ name, bgClass: colorToBg(name) }));
}

/**
 * Lấy size đầu tiên từ variants (key BE: "Size"), fallback tier configs.
 *
 * Quyết định 2026-10-18: dùng key BE runtime (English: "Size"). BE trả
 * `variant.attributes: {Size: "L"}` + `tier.name: "Size"`.
 */
function deriveSizes(
  product: ProductDetail,
): Array<{ label: string; disabled: boolean }> {
  const seen = new Set<string>();
  const out: Array<{ label: string; disabled: boolean }> = [];
  for (const v of product.variants) {
    const s = v.attributes["Size"];
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push({ label: s, disabled: v.isDisabled });
  }
  if (out.length > 0) return out;

  const tier = product.tierVariationConfigs.find(
    (t) => t.name === "Size",
  );
  if (!tier) return [];
  return tier.options.map((label) => ({ label, disabled: false }));
}

/**
 * Best-effort mapping tên màu → Tailwind bg utility.
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

/**
 * Pick flash sale ACTIVE đầu tiên, hoặc fallback slot gần nhất.
 * BE `slotStatus` là string — chấp nhận "ACTIVE" / "ONGOING" / fallback first.
 */
function pickActiveFlashSale(
  flashSales: ActiveFlashSaleDto[],
): ActiveFlashSaleDto | null {
  if (flashSales.length === 0) return null;
  const active = flashSales.find((f) => f.slotStatus === "ACTIVE");
  return active ?? flashSales[0] ?? null;
}

/**
 * Pick variant ACTIVE (không isDisabled) đầu tiên, hoặc undefined.
 * Ưu tiên match với combo (selectedColor, selectedSize) hiện tại.
 * Subplan B (2026-10-18): dùng cho auto-switch UX khi user selection không
 * khớp variant ACTIVE nào.
 */
function pickActiveVariant(
  variants: ProductDetail["variants"],
  preferredColor?: string,
  preferredSize?: string,
): ProductDetail["variants"][number] | undefined {
  const active = variants.filter((v) => !v.isDisabled);
  if (active.length === 0) return undefined;
  // Ưu tiên variant ACTIVE match preferredColor + preferredSize.
  if (preferredColor && preferredSize) {
    const exact = active.find(
      (v) =>
        v.attributes.Color === preferredColor && v.attributes.Size === preferredSize,
    );
    if (exact) return exact;
  }
  return active[0];
}

/** Discount % = round((1 - flashPrice/originalPrice) * 100), 0 nếu invalid. */
function computeDiscountPercent(
  originalPrice: number,
  flashPrice: number,
): number {
  if (originalPrice <= 0 || flashPrice <= 0) return 0;
  return Math.round((1 - flashPrice / originalPrice) * 100);
}

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const t = useTranslations("productDetail");
  // Subplan C (2026-10-18): dùng namespace `error` chung theo convention
  // i18n.mdc mục 5. ApiError.code có thể là HTTP_401, HTTP_500, UNAUTHORIZED,
  // CART_400_1, ... — tất cả đều map qua error.<CODE> (đã có trong messages).
  const tErr = useTranslations("error");

  // BE shape: flashSales[] (Active). Pick first ACTIVE, fallback first.
  const activeFlashSale = useMemo(
    () => pickActiveFlashSale(product.flashSales),
    [product.flashSales],
  );
  const isFlashSale = activeFlashSale !== null;
  const variant: "standard" | "flash" = isFlashSale ? "flash" : "standard";

  const colors = useMemo(() => deriveColors(product), [product]);
  const sizes = useMemo(() => deriveSizes(product), [product]);

  // Subplan B (2026-10-18) — auto-switch: nếu default colors[0] / sizes[0] không
  // trỏ tới variant ACTIVE nào, tự pick variant ACTIVE đầu tiên để sync state.
  // Tính trực tiếp ở useState initial (cheap, chỉ chạy 1 lần mount).
  const initialPick = pickActiveVariant(
    product.variants,
    colors[0]?.name,
    sizes.find((s) => !s.disabled)?.label,
  );

  const [selectedColor, setSelectedColor] = useState<string>(
    () => initialPick?.attributes.Color ?? colors[0]?.name ?? "",
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    () =>
      initialPick?.attributes.Size ??
      sizes.find((s) => !s.disabled)?.label ??
      sizes[0]?.label ??
      "",
  );
  const [quantity, setQuantity] = useState<number>(1);

  // ── Subplan A (2026-10-18) — wire cart CTA ───────────────────────────
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const addToCartMut = useAddToCart({
    onError: (err) => {
      // Map ApiError code → user message. Fallback cho non-ApiError.
      // Subplan C (2026-10-18): ưu tiên namespace `error` chung (theo i18n.mdc
      // mục 5), fallback về productDetail.toast.cartError.GENERIC cho UX nhất
      // quán trên product detail. Tránh MISSING_MESSAGE khi code = HTTP_401.
      if (err instanceof ApiError) {
        const code = err.code;
        const fallback = t("toast.cartError.GENERIC");
        // next-intl: dùng tErr.has() thay vì defaultValue để fallback chắc chắn
        // (defaultValue ở 1 số version không hoạt động khi namespace con không tồn tại).
        const translated = tErr.has(code) ? tErr(code) : fallback;
        toast.error(translated);
      } else {
        toast.error(t("toast.cartError.GENERIC"));
      }
    },
  });

  // helper: require login trước khi call cart API. Trả true nếu OK.
  function requireAuthOrRedirect(action: "addToCart" | "buyNow"): boolean {
    if (isAuthenticated) return true;
    const currentPath = `/products/${product.slug}`;
    const target = action === "addToCart" ? ROUTES.CART : ROUTES.CHECKOUT;
    router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPath)}&next=${encodeURIComponent(target)}`);
    return false;
  }

  async function handleAddToCart() {
    if (!requireAuthOrRedirect("addToCart")) return;
    if (!effectiveVariant) {
      toast.error(t("toast.variantNotAvailable"));
      return;
    }
    if (effectiveVariant !== variantForCurrent) {
      // Auto-switch: thông báo user biết variant đã đổi.
      toast.info(t("toast.variantAutoSwitched"));
    }
    try {
      await addToCartMut.mutateAsync({
        variantId: effectiveVariant.id,
        quantity: safeQuantity,
      });
      toast.success(t("toast.addedToCart"));
    } catch {
      // onError handler đã hiển thị toast.
    }
  }

  async function handleBuyNow() {
    if (!requireAuthOrRedirect("buyNow")) return;
    if (!effectiveVariant) {
      toast.error(t("toast.variantNotAvailable"));
      return;
    }
    if (effectiveVariant !== variantForCurrent) {
      toast.info(t("toast.variantAutoSwitched"));
    }
    try {
      await addToCartMut.mutateAsync({
        variantId: effectiveVariant.id,
        quantity: safeQuantity,
      });
      // Add thành công → navigate thẳng /checkout (quyết định user 2026-10-18).
      router.push(ROUTES.CHECKOUT);
    } catch {
      // onError đã hiển thị toast.
    }
  }

  const stockCount = totalStockCount(product);
  // BE không trả `maxQtyPerUser` cho product detail → tạm default 2.
  const flashMaxQty = activeFlashSale ? 2 : 2;
  const maxQty = isFlashSale ? flashMaxQty : stockCount;

  // Derived: variant cho (selectedColor, selectedSize) hiện tại.
  const variantForCurrent = product.variants.find(
    (v) =>
      v.attributes["Color"] === selectedColor &&
      v.attributes["Size"] === selectedSize,
  );
  // Subplan B (2026-10-18) — auto-switch khi combo không match variant ACTIVE nào.
  // Trả về variant ACTIVE để CTA dùng thay vì undefined → user vẫn mua được.
  // Tính trực tiếp (cheap): chỉ filter + find trên ~12 variants. React Compiler
  // không thể memo hóa vì `variantForCurrent` không phải state/prop.
  const effectiveVariant =
    variantForCurrent &&
    !variantForCurrent.isDisabled &&
    variantForCurrent.stockQuantity > 0
      ? variantForCurrent
      : pickActiveVariant(product.variants, selectedColor, selectedSize);

  const effectiveSize =
    effectiveVariant && !effectiveVariant.isDisabled
      ? effectiveVariant.attributes.Size
      : (sizes.find((s) => !s.disabled)?.label ?? selectedSize);

  // Clamp quantity theo effective maxQty — dùng event handler wrapper thay vì effect.
  function clampQuantity(qty: number, cap: number) {
    return Math.max(1, Math.min(cap, qty));
  }
  const safeQuantity = clampQuantity(quantity, Math.max(1, maxQty));

  // Khi user đổi color mà size hiện tại không available, tự động đổi size.
  function handleColorChange(color: string) {
    setSelectedColor(color);
    const stillValid = product.variants.some(
      (v) =>
        v.attributes["Color"] === color &&
        v.attributes["Size"] === selectedSize &&
        !v.isDisabled,
    );
    if (!stillValid) {
      const firstAvailable = sizes.find(
        (s) => !s.disabled && s.label !== selectedSize,
      );
      if (firstAvailable) setSelectedSize(firstAvailable.label);
    }
  }

  // Defensive: minPrice/maxPrice có thể null (BE runtime trả null khi product
  // chưa set giá ngoài variant level). Truyền null cho PricingBox để render
  // "Liên hệ" thay vì 0₫.
  const displayMinPrice = product.minPrice;
  const displayMaxPrice = product.maxPrice;

  // Quyết định user 2026-10-18 (hide-cta): CTA bị disable khi:
  //   - Không có giá (BE trả null) → reason="contact"
  //   - Hết hàng (0 variant ACTIVE) → reason="outOfStock"
  //   - Ngược lại: reason="canPurchase"
  const hasAnyPrice =
    product.minPrice !== null ||
    product.variants.some((v) => v.originalPrice > 0);
  const hasAnyActiveVariant = product.variants.some(
    (v) => !v.isDisabled && v.stockQuantity > 0,
  );
  const ctaDisabledReason: "canPurchase" | "contact" | "outOfStock" = !hasAnyPrice
    ? "contact"
    : !hasAnyActiveVariant
      ? "outOfStock"
      : "canPurchase";

  // Pricing for box
  const pricingMinPrice = activeFlashSale
    ? activeFlashSale.flashSalePrice
    : displayMinPrice;
  const pricingOriginalPrice = activeFlashSale
    ? activeFlashSale.originalPrice
    : displayMaxPrice;
  const pricingDiscount = activeFlashSale
    ? computeDiscountPercent(
        activeFlashSale.originalPrice,
        activeFlashSale.flashSalePrice,
      )
    : (product.discountPercent ?? 0);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4">
      {/* Breadcrumb full-width */}
      <ProductBreadcrumb
        categoryName={product.categoryName}
        productName={product.name}
      />

      {/* ─── Row 1: Product Info (2 columns) ─── */}
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Gallery (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <ProductGallery images={product.images} productName={product.name} />
          <ProductCommitments commitments={product.commitments} />
        </div>

        {/* Right: Product Info Sidebar (2/3) */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Section 3: Header info (tags + title + rating) */}
          <ProductHeaderInfo
            tags={{
              favorite: true,
              official: product.storeProfile.isOfficial,
              // BE không trả sku ở ProductSpecsDto → bỏ luôn.
            }}
            title={product.name}
            ratingAvg={product.ratingAvg}
            ratingCount={product.ratingCount}
            soldCount={product.soldCount}
            questionCount={product.questionCount}
          />

          {/* Section 4: Pricing box (auto-select flash/standard) */}
          <ProductPricingBox
            variant={variant}
            minPrice={pricingMinPrice}
            originalPrice={pricingOriginalPrice}
            discountPercent={pricingDiscount}
            flashSale={
              activeFlashSale
                ? {
                    endsAt: activeFlashSale.slotEndTime,
                    soldStock: 0, // BE không trả soldStock ở product detail
                    totalStock: activeFlashSale.stockAvailable,
                    maxQtyPerUser: flashMaxQty,
                  }
                : null
            }
          />

          {/* Section 5: Color + Size selectors */}
          <ProductVariantSelectors
            colors={colors}
            sizes={sizes}
            selectedColor={selectedColor}
            selectedSize={effectiveSize}
            onColorChange={handleColorChange}
            onSizeChange={setSelectedSize}
          />

          {/* Section 6: Quantity stepper */}
          <ProductQuantityStepper
            value={safeQuantity}
            max={Math.max(1, maxQty)}
            stockCount={stockCount}
            onChange={setQuantity}
          />

          {/* Section 7: CTA buttons — disable khi không có giá hoặc hết hàng
              (Subplan B 2026-10-18: truyền `disabledReason` để tooltip đúng lý do). */}
          <ProductCtaButtons
            mode={variant}
            disabledReason={ctaDisabledReason}
            isLoading={addToCartMut.isPending}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />

          {/* Section 8: Share bar */}
          <ProductShareBar likedCount={t("wishlist.count")} />
        </div>
      </div>

      {/* ─── Row 2: Store Card (full width) ─── */}
      <div className="mt-6">
        <ProductStoreCard store={product.storeProfile} />
      </div>

      {/* ─── Row 3: Vouchers + Shipping (1 column, stacked) ─── */}
      <div className="mt-6 flex flex-col gap-4">
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