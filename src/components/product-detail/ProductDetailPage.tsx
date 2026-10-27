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
import {
  ProductVariantSelectors,
  type TierConfigItem,
} from "@/components/product-detail/ProductVariantSelectors";
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
  TierVariationConfig,
} from "@/features/products";

export interface ProductDetailPageProps {
  product: ProductDetail;
}

/** Case-insensitive attribute lookup */
function getAttr(attributes: Record<string, string> | undefined, key: string): string | undefined {
  if (!attributes) return undefined;
  if (attributes[key] !== undefined) return attributes[key];
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(attributes)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

/** Case-insensitive and trimmed attribute value comparison */
function matchesAttrValue(vVal: string | undefined, optVal: string): boolean {
  if (vVal === undefined) return false;
  return vVal.trim().toLowerCase() === optVal.trim().toLowerCase();
}

/**
 * Nguồn chân lý (Source of Truth): Lấy trực tiếp từ product.tierVariationConfigs nếu có.
 * Chỉ fallback quét từ product.variants khi tierVariationConfigs rỗng/undefined.
 */
function deriveTierConfigs(product: ProductDetail): TierVariationConfig[] {
  if (Array.isArray(product.tierVariationConfigs) && product.tierVariationConfigs.length > 0) {
    return product.tierVariationConfigs;
  }

  // Fallback từ variants khi BE không trả tierVariationConfigs
  const keysMap = new Map<string, Set<string>>();
  for (const v of product.variants) {
    if (!v.attributes) continue;
    for (const [key, val] of Object.entries(v.attributes)) {
      if (!val || key === "variant_index") continue;
      if (!keysMap.has(key)) {
        keysMap.set(key, new Set());
      }
      keysMap.get(key)!.add(val);
    }
  }

  const result: TierVariationConfig[] = [];
  for (const [name, set] of keysMap.entries()) {
    result.push({
      name,
      options: Array.from(set),
    });
  }
  return result;
}

/**
 * Lấy danh sách màu sắc — ưu tiên lấy từ tierConfigs (Source of truth),
 * fallback quét từ variants.
 */
function deriveColors(
  tierConfigs: TierVariationConfig[],
  variants: ProductDetail["variants"],
): Array<{ name: string; bgClass: string }> {
  const colorTier = tierConfigs.find((t) => /color|màu/i.test(t.name));
  if (colorTier && colorTier.options.length > 0) {
    return colorTier.options.map((name) => ({ name, bgClass: colorToBg(name) }));
  }

  const seen = new Set<string>();
  const out: Array<{ name: string; bgClass: string }> = [];
  for (const v of variants) {
    const c = getAttr(v.attributes, "Color") ?? getAttr(v.attributes, "Màu sắc");
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push({ name: c, bgClass: colorToBg(c) });
  }
  return out;
}

/**
 * Lấy danh sách kích thước — ưu tiên lấy từ tierConfigs (Source of truth),
 * fallback quét từ variants.
 */
function deriveSizes(
  tierConfigs: TierVariationConfig[],
  variants: ProductDetail["variants"],
): Array<{ label: string; disabled: boolean }> {
  const sizeTier = tierConfigs.find((t) => /size|kích/i.test(t.name));
  if (sizeTier && sizeTier.options.length > 0) {
    return sizeTier.options.map((label) => {
      const isOos = !variants.some((v) => {
        const s = getAttr(v.attributes, "Size") ?? getAttr(v.attributes, "Kích cỡ");
        return matchesAttrValue(s, label) && !v.isDisabled && v.stockQuantity > 0;
      });
      return { label, disabled: isOos };
    });
  }

  const seen = new Set<string>();
  const out: Array<{ label: string; disabled: boolean }> = [];
  for (const v of variants) {
    const s = getAttr(v.attributes, "Size") ?? getAttr(v.attributes, "Kích cỡ");
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push({ label: s, disabled: v.isDisabled });
  }
  return out;
}

/**
 * Best-effort mapping tên màu → Tailwind bg utility.
 */
function colorToBg(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trắng") || n.includes("white")) return "bg-slate-100";
  if (n.includes("đen") || n.includes("black")) return "bg-slate-900";
  if (n.includes("vàng") || n.includes("yellow")) return "bg-amber-200";
  if (n.includes("xanh") || n.includes("blue") || n.includes("green") || n.includes("sky")) return "bg-sky-300";
  if (n.includes("đỏ") || n.includes("red")) return "bg-red-500";
  if (n.includes("xám") || n.includes("gray") || n.includes("grey")) return "bg-gray-400";
  if (n.includes("hồng") || n.includes("pink")) return "bg-pink-300";
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
 * Ưu tiên match với preferredSelection hiện tại.
 */
function pickActiveVariant(
  variants: ProductDetail["variants"],
  preferredSelection?: Record<string, string>,
): ProductDetail["variants"][number] | undefined {
  const active = variants.filter((v) => !v.isDisabled && v.stockQuantity > 0);
  if (active.length === 0) return undefined;

  if (preferredSelection && Object.keys(preferredSelection).length > 0) {
    const exact = active.find((v) =>
      Object.entries(preferredSelection).every(([tName, opt]) => {
        const val = getAttr(v.attributes, tName);
        return matchesAttrValue(val, opt);
      }),
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
  const tErr = useTranslations("error");

  // BE shape: flashSales[] (Active). Pick first ACTIVE, fallback first.
  const activeFlashSale = useMemo(
    () => pickActiveFlashSale(product.flashSales),
    [product.flashSales],
  );
  const isFlashSale = activeFlashSale !== null;
  const variant: "standard" | "flash" = isFlashSale ? "flash" : "standard";

  // Tier variation configs: nguồn chân lý lấy trực tiếp từ BE tierVariationConfigs
  const tierConfigs = useMemo(() => deriveTierConfigs(product), [product]);
  const colors = useMemo(() => deriveColors(tierConfigs, product.variants), [tierConfigs, product.variants]);
  const sizes = useMemo(() => deriveSizes(tierConfigs, product.variants), [tierConfigs, product.variants]);

  // Pick variant ACTIVE đầu tiên để khởi tạo selection khớp nhất
  const initialPick = useMemo(() => pickActiveVariant(product.variants), [product.variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const tier of tierConfigs) {
      const activeAttr = initialPick ? getAttr(initialPick.attributes, tier.name) : undefined;
      const matchedOpt = tier.options.find((opt) => matchesAttrValue(activeAttr, opt));
      initial[tier.name] = matchedOpt ?? tier.options[0] ?? "";
    }
    return initial;
  });

  const [quantity, setQuantity] = useState<number>(1);

  // ── Subplan A (2026-10-18) — wire cart CTA ───────────────────────────
  // 2026-10-19: cần đọc cả `isHydrated` để tránh race condition khi auth store
  // chưa rehydrate từ localStorage. Trước hydrate, `user = null` → `isAuthenticated = false`
  // dù user thật sự đã login. Click sớm lúc đó sẽ bị redirect /login oan.
  // Khi `isHydrated = true` thì `isAuthenticated` mới phản ánh đúng state.
  const { isAuthenticated, isHydrated } = useAuth();
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
  // 2026-10-19 fix: phải đợi `isHydrated` trước khi quyết định auth state.
  // Nếu `!isHydrated` (store chưa load từ localStorage) → return false nhưng
  // KHÔNG redirect, để tránh redirect /login oan khi user thật ra đã login.
  function requireAuthOrRedirect(action: "addToCart" | "buyNow"): boolean {
    if (!isHydrated) return false; // chờ store hydrate, không side-effect
    if (isAuthenticated) return true;
    const currentPath = `/products/${product.slug}`;
    const target = action === "addToCart" ? ROUTES.CART : ROUTES.CHECKOUT;
    router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPath)}&next=${encodeURIComponent(target)}`);
    return false;
  }

  const [pendingAction, setPendingAction] = useState<"addToCart" | "buyNow" | null>(null);

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
    setPendingAction("addToCart");
    try {
      await addToCartMut.mutateAsync({
        variantId: effectiveVariant.id,
        quantity: safeQuantity,
      });
      toast.success(t("toast.addedToCart"));
    } catch {
      // onError handler đã hiển thị toast.
    } finally {
      setPendingAction(null);
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
    setPendingAction("buyNow");
    try {
      await addToCartMut.mutateAsync({
        variantId: effectiveVariant.id,
        quantity: safeQuantity,
      });
      // Add thành công → navigate thẳng /checkout (quyết định user 2026-10-18).
      router.push(ROUTES.CHECKOUT);
    } catch {
      // onError đã hiển thị toast.
      setPendingAction(null);
    }
  }

  const selectedColor =
    Object.entries(selectedOptions).find(([name]) => /color|màu/i.test(name))?.[1] ??
    colors[0]?.name ??
    "";
  const selectedSize =
    Object.entries(selectedOptions).find(([name]) => /size|kích/i.test(name))?.[1] ??
    sizes.find((s) => !s.disabled)?.label ??
    sizes[0]?.label ??
    "";

  // Derived: variant cho selectedOptions hiện tại.
  const variantForCurrent = product.variants.find((v) =>
    Object.entries(selectedOptions).every(([tName, opt]) => {
      const val = getAttr(v.attributes, tName);
      return matchesAttrValue(val, opt);
    }),
  );

  // Subplan B (2026-10-18) — auto-switch khi combo không match variant ACTIVE nào.
  // Trả về variant ACTIVE để CTA dùng thay vì undefined → user vẫn mua được.
  const effectiveVariant =
    variantForCurrent &&
    !variantForCurrent.isDisabled &&
    variantForCurrent.stockQuantity > 0
      ? variantForCurrent
      : pickActiveVariant(product.variants, selectedOptions);

  const currentVariant = variantForCurrent ?? effectiveVariant;

  const effectiveSize =
    Object.entries(selectedOptions).find(([name]) => /size|kích/i.test(name))?.[1] ??
    selectedSize;

  // Tồn kho hiển thị và giới hạn mua theo variant đang chọn (không cộng dồn toàn bộ SPU)
  const currentStock =
    currentVariant && !currentVariant.isDisabled
      ? currentVariant.stockQuantity
      : totalStockCount(product);
  // BE không trả `maxQtyPerUser` cho product detail → tạm default 2.
  const flashMaxQty = activeFlashSale ? 2 : 2;
  const maxQty = isFlashSale ? flashMaxQty : currentStock;

  // Clamp quantity theo effective maxQty — dùng event handler wrapper thay vì effect.
  function clampQuantity(qty: number, cap: number) {
    return Math.max(1, Math.min(cap, qty));
  }
  const safeQuantity = clampQuantity(quantity, Math.max(1, maxQty));

  function handleSelectOption(tierName: string, option: string) {
    setSelectedOptions((prev) => ({ ...prev, [tierName]: option }));
  }

  // Dynamic tiers build trực tiếp từ tierConfigs (Source of Truth)
  const dynamicTiers: TierConfigItem[] = useMemo(() => {
    return tierConfigs.map((tier) => {
      const isColor = /color|màu/i.test(tier.name);
      return {
        name: tier.name,
        options: tier.options.map((opt) => {
          // Một option bị xám màu (disabled) nếu không có bất kỳ biến thể ACTIVE, còn hàng nào
          // khớp với option này VÀ khớp với các tier khác đang được chọn
          const hasMatchingActiveVariant = product.variants.some((v) => {
            if (v.isDisabled || v.stockQuantity <= 0 || v.status === "INACTIVE") return false;
            // Khớp với option đang xét của tier này
            const val = getAttr(v.attributes, tier.name);
            if (!matchesAttrValue(val, opt)) return false;

            // Khớp với giá trị đã chọn ở các tier khác
            for (const [otherTierName, otherOpt] of Object.entries(selectedOptions)) {
              if (otherTierName.toLowerCase() === tier.name.toLowerCase()) continue;
              const otherVal = getAttr(v.attributes, otherTierName);
              if (!matchesAttrValue(otherVal, otherOpt)) return false;
            }
            return true;
          });

          return {
            label: opt,
            disabled: !hasMatchingActiveVariant,
            bgClass: isColor ? colorToBg(opt) : undefined,
          };
        }),
      };
    });
  }, [tierConfigs, product.variants, selectedOptions]);

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

  // Flash sale record tương ứng với variant đang chọn (nếu có)
  const currentVariantFlashSale = useMemo(() => {
    if (!currentVariant) return activeFlashSale;
    return (
      product.flashSales.find(
        (f) =>
          f.variantId === currentVariant.id &&
          (f.slotStatus === "ACTIVE" || f.slotStatus === "ONGOING")
      ) ??
      product.flashSales.find((f) => f.variantId === currentVariant.id) ??
      null
    );
  }, [currentVariant, product.flashSales, activeFlashSale]);

  const activeFlashForCurrent = currentVariantFlashSale ?? activeFlashSale;

  // Pricing for box:
  // - Khi có Flash Sale: hiển thị flashSalePrice + gạch ngang originalPrice + % giảm.
  // - Khi ở chế độ Standard (bình thường):
  //   + minPrice: hiển thị chính xác giá bán của variant đang chọn (currentVariant.originalPrice),
  //     nếu chưa chọn hoặc không có variant thì fallback về product.minPrice.
  //   + originalPrice: null (tránh gạch ngang sai lệch giá giữa các variant khác nhau).
  //   + discountPercent: 0.
  const pricingMinPrice = isFlashSale && activeFlashForCurrent
    ? activeFlashForCurrent.flashSalePrice
    : currentVariant?.originalPrice != null
      ? currentVariant.originalPrice
      : displayMinPrice;

  const pricingOriginalPrice = isFlashSale && activeFlashForCurrent
    ? activeFlashForCurrent.originalPrice
    : null;

  const pricingDiscount = isFlashSale && activeFlashForCurrent
    ? computeDiscountPercent(
        activeFlashForCurrent.originalPrice,
        activeFlashForCurrent.flashSalePrice,
      )
    : 0;

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
              activeFlashForCurrent
                ? {
                    endsAt: activeFlashForCurrent.slotEndTime,
                    soldStock: 0, // BE không trả soldStock ở product detail
                    totalStock: activeFlashForCurrent.stockAvailable,
                    maxQtyPerUser: flashMaxQty,
                  }
                : null
            }
          />

          {/* Section 5: Variant selectors (dynamic từ tierConfigs) */}
          <ProductVariantSelectors
            tiers={dynamicTiers}
            selectedOptions={selectedOptions}
            onSelectOption={handleSelectOption}
            colors={colors}
            sizes={sizes}
            selectedColor={selectedColor}
            selectedSize={effectiveSize}
            onColorChange={(c) => {
              const colorTier = tierConfigs.find((t) => /color|màu/i.test(t.name));
              if (colorTier) handleSelectOption(colorTier.name, c);
            }}
            onSizeChange={(s) => {
              const sizeTier = tierConfigs.find((t) => /size|kích/i.test(t.name));
              if (sizeTier) handleSelectOption(sizeTier.name, s);
            }}
          />

          {/* Section 6: Quantity stepper */}
          <ProductQuantityStepper
            value={safeQuantity}
            max={Math.max(1, maxQty)}
            stockCount={currentStock}
            onChange={setQuantity}
          />

          {/* Section 7: CTA buttons — disable khi không có giá hoặc hết hàng
              (Subplan B 2026-10-18: truyền `disabledReason` để tooltip đúng lý do). */}
          <ProductCtaButtons
            mode={variant}
            disabledReason={ctaDisabledReason}
            isAddingToCart={pendingAction === "addToCart"}
            isBuyingNow={pendingAction === "buyNow"}
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