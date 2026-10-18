"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND } from "@/lib/utils";
import {
  getCategories,
  createSellerProduct,
  updateSellerProduct,
  getSellerProductDetail,
} from "@/lib/api/seller";
import type {
  CategoryItem,
  CreateProductPayload,
  UpdateProductPayload,
  CreateProductVariantDto,
} from "@/types/seller";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: number;
}

interface SkuRowState {
  key: string;
  tier1Val: string;
  tier2Val: string;
  sku: string;
  originalPrice: number;
  stockQuantity: number;
  isActive: boolean;
  priceError?: string;
}

export function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();

  // Basic Information (SPU)
  const [name, setName] = useState(
    mode === "create"
      ? "Áo thun nam Cotton Compact Vibe UTC cao cấp form rộng thoáng khí"
      : ""
  );
  const [categoryId, setCategoryId] = useState<number>(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [description, setDescription] = useState(
    "✔ Chất liệu cao cấp: 100% Cotton Compact chải kỹ định lượng 220gsm, sợi dệt mật độ cao hạn chế xù lông tối đa.\n" +
      "✔ Khả năng thấm hút mồ hôi vượt trội, bề mặt mát mịn, co giãn 4 chiều vận động thoải mái suốt cả ngày.\n" +
      "✔ Đường may 2 kim gia cố vai và cổ áo chắc chắn, bo cổ dệt Spandex co giãn hồi form chuẩn không bị dão sau nhiều lần giặt.\n" +
      "✔ Form Regular-fit hiện đại phù hợp mọi dáng người nam giới Việt Nam, dễ phối đồ dạo phố, đi học, đi làm."
  );

  // Images
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isAddingImage, setIsAddingImage] = useState(false);

  // SPU / SKU Variations
  const [hasVariations, setHasVariations] = useState(true);
  const [tier1Name, setTier1Name] = useState("Màu sắc");
  const [tier1Options, setTier1Options] = useState<string[]>([
    "Đen",
    "Trắng",
    "Vàng mù tạt",
  ]);
  const [newTier1Input, setNewTier1Input] = useState("");

  const [tier2Name, setTier2Name] = useState("Kích thước");
  const [tier2Options, setTier2Options] = useState<string[]>(["S", "M", "L", "XL"]);
  const [newTier2Input, setNewTier2Input] = useState("");

  // SKU Matrix & Overrides
  const [skuOverrides, setSkuOverrides] = useState<
    Record<
      string,
      {
        sku?: string;
        originalPrice?: number;
        stockQuantity?: number;
        isActive?: boolean;
      }
    >
  >({});
  const [batchPrice, setBatchPrice] = useState("149000");
  const [batchStock, setBatchStock] = useState("60");
  const [isMatrixExpanded, setIsMatrixExpanded] = useState(false);

  // Shipping & Dimensions
  const [weight, setWeight] = useState(250);
  const [lengthCm, setLengthCm] = useState(25);
  const [widthCm, setWidthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(3);
  const [carriers, setCarriers] = useState({
    ghn: true,
    ghtk: true,
    spx: true,
  });

  // UI status
  const [isPageLoading, setIsPageLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load categories and initial product details
  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((catList) => {
        if (!isMounted) return;
        setCategories(catList);
        if (catList.length > 0 && mode === "create") {
          setCategoryId(catList[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
      });

    if (mode === "edit" && productId) {
      getSellerProductDetail(productId)
        .then((detail) => {
          if (!isMounted) return;
          setName(detail.name || "");
          setCategoryId(detail.categoryId || 1);
          setDescription(detail.description || "");
          if (detail.imageUrl) {
            setImages([detail.imageUrl]);
          }

          if (detail.tierVariations && detail.tierVariations.length > 0) {
            setHasVariations(true);
            const t1 = detail.tierVariations[0];
            if (t1) {
              setTier1Name(t1.name);
              setTier1Options(t1.options);
            }
            const t2 = detail.tierVariations[1];
            if (t2) {
              setTier2Name(t2.name);
              setTier2Options(t2.options);
            } else {
              setTier2Options([]);
            }
          }
          setIsPageLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Failed to load product detail:", err);
          setErrorMessage("Không thể tải thông tin sản phẩm cần sửa.");
          setIsPageLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [mode, productId]);

  // Compute SKU Matrix dynamically without cascading renders
  const skuMatrix: SkuRowState[] = useMemo(() => {
    if (!hasVariations) {
      const def = skuOverrides["default"];
      const price = def?.originalPrice ?? (Number(batchPrice) || 149000);
      return [
        {
          key: "default",
          tier1Val: "Mặc định",
          tier2Val: "-",
          sku: def?.sku || "SKU-DEFAULT",
          originalPrice: price,
          stockQuantity: def?.stockQuantity ?? (Number(batchStock) || 50),
          isActive: def?.isActive ?? true,
          priceError: price <= 0 ? "Giá phải lớn hơn 0" : undefined,
        },
      ];
    }

    const t1List = tier1Options.length > 0 ? tier1Options : ["Mặc định"];
    const t2List = tier2Options.length > 0 ? tier2Options : ["Mặc định"];
    const rows: SkuRowState[] = [];

    for (const t1 of t1List) {
      for (const t2 of t2List) {
        const rowKey = `${t1}-${t2}`;
        const ov = skuOverrides[rowKey];
        const price = ov?.originalPrice ?? (Number(batchPrice) || 149000);
        const stock = ov?.stockQuantity ?? (Number(batchStock) || 50);
        rows.push({
          key: rowKey,
          tier1Val: t1,
          tier2Val: t2 === "Mặc định" ? "-" : t2,
          sku:
            ov?.sku ||
            `AT-${t1.toUpperCase().slice(0, 3)}-${t2.toUpperCase().slice(0, 2)}`,
          originalPrice: price,
          stockQuantity: stock,
          isActive: ov?.isActive ?? true,
          priceError: price <= 0 ? "Giá phải lớn hơn 0" : undefined,
        });
      }
    }
    return rows;
  }, [hasVariations, tier1Options, tier2Options, skuOverrides, batchPrice, batchStock]);

  // Batch apply handler
  const handleBatchApply = () => {
    const numPrice = Number(batchPrice) || 0;
    const numStock = Number(batchStock) || 0;
    setSkuOverrides((prev) => {
      const next = { ...prev };
      skuMatrix.forEach((row) => {
        next[row.key] = {
          ...next[row.key],
          originalPrice: numPrice,
          stockQuantity: numStock,
        };
      });
      return next;
    });
  };

  // Add tier 1 option
  const handleAddTier1 = () => {
    const val = newTier1Input.trim();
    if (!val || tier1Options.includes(val)) return;
    setTier1Options([...tier1Options, val]);
    setNewTier1Input("");
  };

  const handleRemoveTier1 = (opt: string) => {
    setTier1Options(tier1Options.filter((o) => o !== opt));
  };

  // Add tier 2 option
  const handleAddTier2 = () => {
    const val = newTier2Input.trim();
    if (!val || tier2Options.includes(val)) return;
    setTier2Options([...tier2Options, val]);
    setNewTier2Input("");
  };

  const handleRemoveTier2 = (opt: string) => {
    setTier2Options(tier2Options.filter((o) => o !== opt));
  };

  // Add image
  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (trimmed && images.length < 9) {
      setImages([...images, trimmed]);
      setNewImageUrl("");
      setIsAddingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  // Row update handlers
  const handleRowPriceChange = (key: string, valStr: string) => {
    const val = Number(valStr) || 0;
    setSkuOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        originalPrice: val,
      },
    }));
  };

  const handleRowStockChange = (key: string, valStr: string) => {
    const val = Number(valStr) || 0;
    setSkuOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        stockQuantity: val,
      },
    }));
  };

  const handleRowSkuChange = (key: string, skuVal: string) => {
    setSkuOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        sku: skuVal,
      },
    }));
  };

  const handleRowToggleActive = (key: string, currentVal: boolean) => {
    setSkuOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isActive: !currentVal,
      },
    }));
  };

  // Volumetric weight
  const estimatedVolumetricWeight = useMemo(() => {
    return Math.round((lengthCm * widthCm * heightCm) / 6);
  }, [lengthCm, widthCm, heightCm]);

  // Selected category display
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId) || {
      id: 1,
      name: "Thời trang nam",
      slug: "thoi-trang-nam",
    };
  }, [categories, categoryId]);

  // Minimum and Maximum prices for preview
  const previewPriceDisplay = useMemo(() => {
    if (skuMatrix.length === 0) return "149.000₫";
    const validPrices = skuMatrix
      .map((r) => r.originalPrice)
      .filter((p) => p > 0);
    if (validPrices.length === 0) return "149.000₫";
    const min = Math.min(...validPrices);
    return `${formatVND(min)}₫`;
  }, [skuMatrix]);

  // Form submission
  const handleSubmit = async (targetStatus: "ACTIVE" | "INACTIVE") => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập tên sản phẩm.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!categoryId) {
      setErrorMessage("Vui lòng chọn ngành hàng sản phẩm.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (skuMatrix.length === 0) {
      setErrorMessage("Sản phẩm phải có ít nhất 1 biến thể SKU.");
      return;
    }

    const invalidRow = skuMatrix.find((r) => r.originalPrice <= 0);
    if (invalidRow) {
      setErrorMessage(
        `Biến thể [${invalidRow.tier1Val} - ${invalidRow.tier2Val}] có giá bán không hợp lệ (phải > 0).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const tierVariationConfigs = hasVariations
        ? [
            { name: tier1Name, options: tier1Options },
            ...(tier2Options.length > 0
              ? [{ name: tier2Name, options: tier2Options }]
              : []),
          ]
        : [];

      const variants: CreateProductVariantDto[] = skuMatrix.map((r) => ({
        sku: r.sku,
        variantName:
          r.tier2Val && r.tier2Val !== "-"
            ? `${r.tier1Val}, Size ${r.tier2Val}`
            : r.tier1Val,
        originalPrice: r.originalPrice,
        stockQuantity: r.stockQuantity,
        attributes: {
          [tier1Name]: r.tier1Val,
          ...(r.tier2Val && r.tier2Val !== "-" ? { [tier2Name]: r.tier2Val } : {}),
        },
      }));

      if (mode === "create") {
        const payload: CreateProductPayload = {
          categoryId,
          name: name.trim(),
          description: description.trim(),
          imageUrl: images[0] || undefined,
          tierVariationConfigs,
          variants,
        };
        await createSellerProduct(payload);
        setSuccessMessage("Đăng bán sản phẩm thành công!");
        setTimeout(() => {
          router.push("/seller/products");
        }, 1200);
      } else if (mode === "edit" && productId) {
        const payload: UpdateProductPayload = {
          categoryId,
          name: name.trim(),
          description: description.trim(),
          imageUrl: images[0] || undefined,
          status: targetStatus,
          tierVariationConfigs,
          variants,
        };
        await updateSellerProduct(productId, payload);
        setSuccessMessage("Cập nhật sản phẩm thành công!");
        setTimeout(() => {
          router.push("/seller/products");
        }, 1200);
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(
        errObj?.message || "Có lỗi xảy ra khi lưu sản phẩm. Vui lòng kiểm tra lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-body-sm text-secondary font-medium">
          Đang tải dữ liệu sản phẩm...
        </p>
      </div>
    );
  }

  const visibleMatrixRows = isMatrixExpanded ? skuMatrix : skuMatrix.slice(0, 6);

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Alert Banners */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-error flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <MaterialSymbol name="error" size="[18px]" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-secondary hover:text-error"
          >
            <MaterialSymbol name="close" size="[16px]" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-body-sm">
          <MaterialSymbol name="check_circle" size="[18px]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-md text-label-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SPU / SKU 2 Tầng Chuẩn
            </span>
            <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase">
              Phiên bản danh mục v3.4
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface tracking-tight">
            {mode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Thiết lập thông tin sản phẩm cha (SPU) và ma trận biến thể thuộc tính
            (SKU) cho hệ thống phân phối đa kênh.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-secondary shadow-sm hover:text-on-surface hover:bg-surface-container-low transition-all font-body-md text-body-sm"
          >
            <MaterialSymbol name="file_upload" size="[18px]" />
            <span>Nhập Excel (Hàng loạt)</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-secondary shadow-sm hover:text-on-surface hover:bg-surface-container-low transition-all font-body-md text-body-sm"
          >
            <MaterialSymbol name="help_outline" size="[18px]" />
            <span>Hướng dẫn chuẩn SEO</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Input Sections (col-span-9) */}
        <div className="xl:col-span-9 flex flex-col gap-space-lg min-w-0">
          {/* CARD 1: Basic Information */}
          <section
            id="section-thong-tin-co-ban"
            className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-label-md text-label-md font-bold">
                  1
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Thông tin cơ bản (SPU)
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-tertiary font-semibold uppercase tracking-wider">
                * Bắt buộc nhập
              </span>
            </div>

            {/* Image Gallery */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-headline-md text-body-md text-on-surface font-semibold">
                  Hình ảnh sản phẩm
                </label>
                <span className="font-body-sm text-body-sm text-secondary">
                  Tối đa 9 ảnh, tỷ lệ vuông 1:1, dung lượng &lt; 3MB/ảnh
                </span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto py-2">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-low shadow-sm group ${
                      idx === 0 ? "ring-2 ring-emerald-500" : ""
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Ảnh sản phẩm ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                    {idx === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white font-label-sm text-[10px] text-center py-0.5 font-bold">
                        Ảnh bìa
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MaterialSymbol name="close" size="[14px]" />
                    </button>
                  </div>
                ))}

                {/* Add Image Slot */}
                {images.length < 9 && (
                  <div className="relative">
                    {isAddingImage ? (
                      <div className="w-64 p-2 rounded-lg border border-emerald-500 bg-surface-container-lowest shadow-md flex flex-col gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="Dán URL ảnh vào đây..."
                          className="h-8 px-2 text-body-sm border border-outline-variant/40 rounded focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingImage(false)}
                            className="px-2 py-1 text-[11px] rounded text-secondary hover:bg-surface-container-low"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleAddImage}
                            className="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white font-semibold"
                          >
                            Thêm ảnh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingImage(true)}
                        className="w-20 h-20 rounded-lg flex-shrink-0 bg-surface-container-low/70 border border-dashed border-outline-variant hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer flex flex-col items-center justify-center text-center p-1 transition-all group"
                      >
                        <MaterialSymbol
                          name="add_photo_alternate"
                          size="[22px]"
                          className="text-outline group-hover:text-emerald-600"
                        />
                        <span className="font-label-sm text-[10px] text-secondary group-hover:text-emerald-700 leading-tight mt-0.5">
                          + Thêm
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Empty placeholders up to 6 */}
                {Array.from({ length: Math.max(0, 6 - images.length - 1) }).map(
                  (_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="w-20 h-20 rounded-lg flex-shrink-0 bg-surface-container-low/40 border border-dashed border-outline-variant/60 flex flex-col items-center justify-center text-outline/50"
                    >
                      <MaterialSymbol name="photo_camera" size="[20px]" />
                      <span className="font-label-sm text-[10px]">
                        {images.length + i + 1}/9
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Product Name */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="product-name"
                  className="font-headline-md text-body-md text-on-surface font-semibold"
                >
                  Tên sản phẩm <span className="text-tertiary">*</span>
                </label>
                <span className="font-data-tabular text-body-sm text-secondary">
                  {name.length}/255
                </span>
              </div>
              <input
                id="product-name"
                type="text"
                maxLength={255}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên sản phẩm chuẩn SEO (Thương hiệu + Loại sản phẩm + Điểm nổi bật)"
                className="w-full h-11 px-3.5 bg-surface-container-lowest rounded-lg border border-outline-variant/50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-body-md text-on-surface text-body-md transition-all shadow-sm"
              />
              <p className="font-body-sm text-label-sm text-secondary">
                Tên sản phẩm tối ưu nên có từ khóa chính để khách hàng dễ tìm
                kiếm trên Vibe Mart.
              </p>
            </div>

            {/* Category Cascader */}
            <div className="flex flex-col gap-1.5">
              <label className="font-headline-md text-body-md text-on-surface font-semibold">
                Ngành hàng sản phẩm <span className="text-tertiary">*</span>
              </label>
              <div className="relative">
                <div
                  onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-surface-container-low/80 rounded-lg border border-outline-variant/40 flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap font-body-md text-body-sm text-on-surface">
                    <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {selectedCategory.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary pl-2">
                    <span className="font-body-sm text-label-sm">
                      {isCategoryPickerOpen ? "Đóng" : "Chỉnh sửa"}
                    </span>
                    <MaterialSymbol name="edit" size="[18px]" />
                  </div>
                </div>

                {isCategoryPickerOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 shadow-lg z-30 max-h-56 overflow-y-auto">
                    <p className="px-2 py-1 text-label-sm uppercase font-bold text-secondary">
                      Chọn ngành hàng:
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(cat.id);
                            setIsCategoryPickerOpen(false);
                          }}
                          className={`text-left px-3 py-2 rounded text-body-sm transition-colors ${
                            cat.id === categoryId
                              ? "bg-emerald-50 text-emerald-700 font-semibold"
                              : "hover:bg-surface-container-low text-on-surface"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-headline-md text-body-md text-on-surface font-semibold">
                  Mô tả sản phẩm chi tiết <span className="text-tertiary">*</span>
                </label>
                <span className="font-body-sm text-label-sm text-secondary">
                  Hỗ trợ Markdown &amp; Trình soạn thảo
                </span>
              </div>
              <div className="rounded-lg overflow-hidden border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
                <div className="flex items-center gap-1 p-1.5 bg-surface-container-low border-b border-outline-variant/20 flex-wrap">
                  <button
                    type="button"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center font-bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center underline"
                  >
                    U
                  </button>
                  <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center"
                  >
                    <MaterialSymbol name="format_list_bulleted" size="[18px]" />
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center"
                  >
                    <MaterialSymbol name="format_list_numbered" size="[18px]" />
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết xuất xứ, chất liệu vải, tính năng, hướng dẫn giặt ủi và bảo quản..."
                  className="w-full p-3.5 bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none resize-y leading-relaxed"
                />
              </div>
            </div>
          </section>

          {/* CARD 2: SPU - SKU Attribute Configuration */}
          <section
            id="section-phan-loai-hang"
            className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-label-md text-label-md font-bold">
                  2
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Phân loại hàng (Mô hình SPU - SKU)
                  </h2>
                  <p className="font-body-sm text-label-sm text-secondary">
                    Tạo ma trận biến thể thuộc tính cấp 1 (màu sắc) và cấp 2
                    (size/kích thước).
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-3 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="font-label-md text-label-md text-emerald-900 font-semibold">
                  Sản phẩm có nhiều phân loại
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasVariations}
                  onClick={() => setHasVariations(!hasVariations)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ease-in-out duration-200 focus:outline-none ${
                    hasVariations ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ease-in-out duration-200 ${
                      hasVariations ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {hasVariations && (
              <>
                {/* TIER 1 */}
                <div className="rounded-xl bg-surface-container-low/50 p-space-md border border-outline-variant/30 flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-0.5 rounded bg-emerald-600 text-white font-label-sm text-label-sm font-semibold uppercase">
                        Tầng 1
                      </span>
                      <span className="font-headline-md text-body-md text-on-surface font-semibold">
                        Nhóm phân loại:
                      </span>
                      <input
                        type="text"
                        value={tier1Name}
                        onChange={(e) => setTier1Name(e.target.value)}
                        className="h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 font-body-md text-body-sm text-on-surface focus:border-emerald-500 focus:outline-none font-semibold w-40"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                      Danh sách {tier1Name}:
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {tier1Options.map((opt) => (
                        <div
                          key={opt}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 shadow-xs"
                        >
                          <span className="font-body-md text-body-sm font-medium text-on-surface">
                            {opt}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTier1(opt)}
                            className="text-secondary hover:text-error ml-1"
                          >
                            <MaterialSymbol name="close" size="[16px]" />
                          </button>
                        </div>
                      ))}

                      {/* Add Tier 1 Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newTier1Input}
                          onChange={(e) => setNewTier1Input(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTier1();
                            }
                          }}
                          placeholder={`+ Nhập thêm ${tier1Name}...`}
                          className="h-9 px-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest/80 text-body-sm font-body-md text-on-surface focus:border-emerald-500 focus:outline-none w-48 transition-all"
                        />
                        {newTier1Input.trim() && (
                          <button
                            type="button"
                            onClick={handleAddTier1}
                            className="h-9 px-2.5 bg-emerald-600 text-white rounded-lg text-body-sm font-semibold"
                          >
                            Thêm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TIER 2 */}
                <div className="rounded-xl bg-surface-container-low/50 p-space-md border border-outline-variant/30 flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-0.5 rounded bg-emerald-600 text-white font-label-sm text-label-sm font-semibold uppercase">
                        Tầng 2
                      </span>
                      <span className="font-headline-md text-body-md text-on-surface font-semibold">
                        Nhóm phân loại:
                      </span>
                      <input
                        type="text"
                        value={tier2Name}
                        onChange={(e) => setTier2Name(e.target.value)}
                        className="h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 font-body-md text-body-sm text-on-surface focus:border-emerald-500 focus:outline-none font-semibold w-40"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                      Danh sách {tier2Name}:
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {tier2Options.map((opt) => (
                        <div
                          key={opt}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 shadow-xs font-data-tabular text-body-sm font-semibold text-on-surface"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTier2(opt)}
                            className="text-secondary hover:text-error"
                          >
                            <MaterialSymbol name="close" size="[16px]" />
                          </button>
                        </div>
                      ))}

                      {/* Add Tier 2 Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newTier2Input}
                          onChange={(e) => setNewTier2Input(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTier2();
                            }
                          }}
                          placeholder={`+ Nhập thêm ${tier2Name}...`}
                          className="h-9 px-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest/80 text-body-sm font-body-md text-on-surface focus:border-emerald-500 focus:outline-none w-40 transition-all"
                        />
                        {newTier2Input.trim() && (
                          <button
                            type="button"
                            onClick={handleAddTier2}
                            className="h-9 px-2.5 bg-emerald-600 text-white rounded-lg text-body-sm font-semibold"
                          >
                            Thêm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="font-body-sm text-label-sm text-secondary">
                    Tối đa 2 tầng thuộc tính SPU • Tối đa 50 biến thể SKU tổng cộng
                  </span>
                </div>
              </>
            )}
          </section>

          {/* CARD 3: Detailed SKU Matrix */}
          <section
            id="section-danh-sach-sku"
            className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-label-md text-label-md font-bold">
                  3
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                      Danh sách phân loại chi tiết
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-md text-label-md font-bold">
                      {skuMatrix.length} SKU
                    </span>
                  </div>
                  <p className="font-body-sm text-label-sm text-secondary">
                    {hasVariations
                      ? `Ma trận sinh tự động từ ${tier1Options.length} ${tier1Name} × ${tier2Options.length} ${tier2Name}. Nhập giá bán và kho riêng biệt.`
                      : "Sản phẩm không có phân loại thuộc tính."}
                  </p>
                </div>
              </div>
            </div>

            {/* Batch Apply Toolbar */}
            <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-on-surface font-label-md text-body-sm font-semibold">
                <MaterialSymbol
                  name="bolt"
                  size="[20px]"
                  className="text-emerald-600"
                />
                <span>Áp dụng nhanh cho tất cả SKU:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
                <div className="relative w-36">
                  <input
                    type="number"
                    value={batchPrice}
                    onChange={(e) => setBatchPrice(e.target.value)}
                    placeholder="Giá chung"
                    className="w-full h-9 pl-2.5 pr-6 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2 top-2 text-[11px] font-semibold text-secondary">
                    ₫
                  </span>
                </div>
                <div className="relative w-28">
                  <input
                    type="number"
                    value={batchStock}
                    onChange={(e) => setBatchStock(e.target.value)}
                    placeholder="Tồn kho"
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBatchApply}
                  className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-body-sm font-semibold shadow-sm transition-all flex items-center gap-1"
                >
                  <MaterialSymbol name="done_all" size="[16px]" />
                  <span>Áp dụng tất cả</span>
                </button>
              </div>
            </div>

            {/* SKU Matrix Table */}
            <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant/30">
                    <th className="py-3 px-4 w-32">{tier1Name}</th>
                    <th className="py-3 px-3 w-24">{tier2Name}</th>
                    <th className="py-3 px-4 w-44">Mã SKU người bán</th>
                    <th className="py-3 px-4 w-44">
                      Giá bán (₫) <span className="text-tertiary">*</span>
                    </th>
                    <th className="py-3 px-4 w-32">
                      Tồn kho <span className="text-tertiary">*</span>
                    </th>
                    <th className="py-3 px-3 w-24 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body-md text-body-sm text-on-surface">
                  {visibleMatrixRows.map((row) => (
                    <tr
                      key={row.key}
                      className={`hover:bg-surface-container-low/40 transition-colors ${
                        row.priceError ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-on-surface">
                        {row.tier1Val}
                      </td>
                      <td className="py-2.5 px-3 font-data-tabular font-bold text-on-surface">
                        <span className="px-2 py-0.5 rounded bg-surface-container-low font-semibold">
                          {row.tier2Val}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) => handleRowSkuChange(row.key, e.target.value)}
                          className="h-9 w-full px-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="relative">
                            <input
                              type="number"
                              value={row.originalPrice}
                              onChange={(e) =>
                                handleRowPriceChange(row.key, e.target.value)
                              }
                              className={`h-9 w-full pl-2.5 pr-6 rounded bg-surface-container-lowest border font-data-tabular text-body-sm focus:outline-none text-right font-semibold ${
                                row.priceError
                                  ? "border-2 border-error text-error"
                                  : "border-outline-variant/40 focus:border-emerald-500"
                              }`}
                            />
                            <span className="absolute right-2 top-2 text-[11px] text-secondary font-medium">
                              ₫
                            </span>
                          </div>
                          {row.priceError && (
                            <span className="font-label-sm text-[11px] text-error flex items-center gap-0.5">
                              <MaterialSymbol name="error" size="[14px]" />
                              <span>{row.priceError}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          value={row.stockQuantity}
                          onChange={(e) =>
                            handleRowStockChange(row.key, e.target.value)
                          }
                          className="h-9 w-full px-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-sm focus:border-emerald-500 focus:outline-none text-right"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.isActive}
                          onClick={() => handleRowToggleActive(row.key, row.isActive)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            row.isActive ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${
                              row.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {skuMatrix.length > 6 && (
              <div className="flex items-center justify-between text-secondary pt-1">
                <span className="font-body-sm text-label-sm">
                  Hiển thị {visibleMatrixRows.length} / {skuMatrix.length} SKU
                </span>
                <button
                  type="button"
                  onClick={() => setIsMatrixExpanded(!isMatrixExpanded)}
                  className="text-emerald-700 hover:text-emerald-800 font-label-md text-label-md font-semibold flex items-center gap-1"
                >
                  <span>
                    {isMatrixExpanded
                      ? "Thu gọn danh sách"
                      : `Xem toàn bộ ${skuMatrix.length} biến thể (Mở rộng)`}
                  </span>
                  <MaterialSymbol
                    name={isMatrixExpanded ? "arrow_upward" : "expand_more"}
                    size="[16px]"
                  />
                </button>
              </div>
            )}
          </section>

          {/* CARD 4: Shipping, Dimensions & Weight */}
          <section
            id="section-van-chuyen"
            className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-label-md text-label-md font-bold">
                  4
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Vận chuyển &amp; Kích thước đóng gói
                  </h2>
                  <p className="font-body-sm text-label-sm text-secondary">
                    Cân nặng và thể tích quy đổi là cơ sở tính cước phí của các
                    đơn vị đối tác.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              {/* Weight */}
              <div className="flex flex-col gap-1.5">
                <label className="font-headline-md text-body-md text-on-surface font-semibold">
                  Cân nặng sau đóng gói <span className="text-tertiary">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value) || 0)}
                    className="w-full h-11 pl-3.5 pr-14 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-md text-on-surface focus:border-emerald-500 focus:outline-none shadow-sm"
                  />
                  <span className="absolute right-3.5 top-3 font-label-md text-body-sm text-secondary font-semibold">
                    gram
                  </span>
                </div>
                <p className="font-body-sm text-label-sm text-secondary">
                  Trọng lượng áo thun kèm bao bì đóng gói tiêu chuẩn thường từ
                  200g - 300g.
                </p>
              </div>

              {/* Dimensions */}
              <div className="flex flex-col gap-1.5">
                <label className="font-headline-md text-body-md text-on-surface font-semibold">
                  Kích thước bưu kiện (Dài × Rộng × Cao){" "}
                  <span className="text-tertiary">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Dài"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(Number(e.target.value) || 0)}
                      className="w-full h-11 pl-2.5 pr-8 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-sm text-on-surface focus:border-emerald-500 focus:outline-none shadow-sm text-center font-medium"
                    />
                    <span className="absolute right-2 top-3 text-[11px] text-secondary">
                      cm
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Rộng"
                      value={widthCm}
                      onChange={(e) => setWidthCm(Number(e.target.value) || 0)}
                      className="w-full h-11 pl-2.5 pr-8 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-sm text-on-surface focus:border-emerald-500 focus:outline-none shadow-sm text-center font-medium"
                    />
                    <span className="absolute right-2 top-3 text-[11px] text-secondary">
                      cm
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Cao"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                      className="w-full h-11 pl-2.5 pr-8 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-data-tabular text-body-sm text-on-surface focus:border-emerald-500 focus:outline-none shadow-sm text-center font-medium"
                    />
                    <span className="absolute right-2 top-3 text-[11px] text-secondary">
                      cm
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-label-sm text-secondary">
                  Khối lượng quy đổi thể tích ước tính:{" "}
                  <span className="font-bold text-on-surface font-data-tabular">
                    ~{estimatedVolumetricWeight} gram
                  </span>
                </p>
              </div>
            </div>

            {/* Logistics partners */}
            <div className="flex flex-col gap-2.5 pt-2">
              <label className="font-headline-md text-body-md text-on-surface font-semibold">
                Kênh vận chuyển kích hoạt
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 hover:border-emerald-500 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={carriers.ghn}
                    onChange={(e) =>
                      setCarriers({ ...carriers, ghn: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex flex-col">
                    <span className="font-headline-md text-body-sm font-semibold text-on-surface leading-tight">
                      Giao Hàng Nhanh (GHN)
                    </span>
                    <span className="font-body-sm text-label-sm text-emerald-700 font-medium">
                      Bật mặc định
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 hover:border-emerald-500 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={carriers.ghtk}
                    onChange={(e) =>
                      setCarriers({ ...carriers, ghtk: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex flex-col">
                    <span className="font-headline-md text-body-sm font-semibold text-on-surface leading-tight">
                      GHTK Tiết Kiệm
                    </span>
                    <span className="font-body-sm text-label-sm text-emerald-700 font-medium">
                      Đồng kiểm 100%
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 hover:border-emerald-500 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={carriers.spx}
                    onChange={(e) =>
                      setCarriers({ ...carriers, spx: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex flex-col">
                    <span className="font-headline-md text-body-sm font-semibold text-on-surface leading-tight">
                      SPX Express
                    </span>
                    <span className="font-body-sm text-label-sm text-emerald-700 font-medium">
                      Hỏa tốc nội thành
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Sticky Sidebar 25% (col-span-3) */}
        <aside className="xl:col-span-3 flex flex-col gap-space-lg sticky top-20 z-20">
          {/* Navigation Directory */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <h3 className="font-headline-md text-body-sm uppercase tracking-wider text-secondary font-bold">
                Mục lục điều hướng
              </h3>
              <span className="font-label-sm text-[11px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full">
                4/4 Hoàn tất
              </span>
            </div>
            <nav className="flex flex-col gap-1.5 pt-1">
              <a
                href="#section-thong-tin-co-ban"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MaterialSymbol
                      name="check"
                      size="[14px]"
                      className="font-bold"
                    />
                  </span>
                  <span className="font-body-md text-body-sm text-on-surface group-hover:text-emerald-700 font-medium">
                    1. Thông tin cơ bản
                  </span>
                </div>
                <MaterialSymbol
                  name="arrow_forward"
                  size="[16px]"
                  className="text-outline opacity-0 group-hover:opacity-100"
                />
              </a>

              <a
                href="#section-phan-loai-hang"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MaterialSymbol
                      name="check"
                      size="[14px]"
                      className="font-bold"
                    />
                  </span>
                  <span className="font-body-md text-body-sm text-on-surface group-hover:text-emerald-700 font-medium">
                    2. Phân loại hàng
                  </span>
                </div>
                <MaterialSymbol
                  name="arrow_forward"
                  size="[16px]"
                  className="text-outline opacity-0 group-hover:opacity-100"
                />
              </a>

              <a
                href="#section-danh-sach-sku"
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/80 text-emerald-800 font-semibold border-l-[3px] border-emerald-500"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                    3
                  </span>
                  <span className="font-headline-md text-body-sm">
                    3. Danh sách SKU ({skuMatrix.length})
                  </span>
                </div>
              </a>

              <a
                href="#section-van-chuyen"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-outline-variant text-outline flex items-center justify-center text-[11px]">
                    4
                  </span>
                  <span className="font-body-md text-body-sm text-secondary group-hover:text-on-surface">
                    4. Vận chuyển
                  </span>
                </div>
                <MaterialSymbol
                  name="arrow_forward"
                  size="[16px]"
                  className="text-outline opacity-0 group-hover:opacity-100"
                />
              </a>
            </nav>
          </div>

          {/* Live Storefront Card Preview */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <div className="flex items-center gap-1.5">
                <MaterialSymbol
                  name="visibility"
                  size="[18px]"
                  className="text-emerald-600"
                />
                <h3 className="font-headline-md text-body-sm uppercase tracking-wider text-secondary font-bold">
                  Xem trước sản phẩm
                </h3>
              </div>
              <span className="font-label-sm text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded">
                Khách thấy
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-surface shadow-xs flex flex-col">
              <div className="relative w-full aspect-square bg-surface-container-low overflow-hidden">
                <Image
                  src={
                    images[0] ||
                    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60"
                  }
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover transition-transform hover:scale-105 duration-300"
                  unoptimized
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded bg-tertiary text-white font-label-sm text-[10px] font-bold tracking-wider uppercase shadow-xs">
                    Vibe Mall
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-label-sm text-[9px] font-bold uppercase shadow-xs">
                    Chính hãng
                  </span>
                </div>
              </div>

              <div className="p-3 flex flex-col gap-2">
                <p className="font-body-md text-body-sm text-on-surface line-clamp-2 font-medium leading-snug">
                  {name.trim() || "Tên sản phẩm mẫu..."}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-data-tabular text-headline-md font-bold text-tertiary">
                    {previewPriceDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between text-secondary pt-1 border-t border-outline-variant/20">
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-amber-500 text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-data-tabular text-[11px] font-bold text-on-surface">
                      5.0
                    </span>
                    <span className="font-data-tabular text-[11px] text-secondary">
                      (0)
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-secondary">
                    Đã bán 0
                  </span>
                </div>
              </div>
            </div>

            <p className="font-body-sm text-[11px] text-secondary text-center leading-normal">
              Thẻ hiển thị theo thuật toán chuẩn của Vibe Mart trên trang tìm kiếm
              và gợi ý hôm nay.
            </p>
          </div>
        </aside>
      </div>

      {/* FIXED STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-60 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-space-lg z-40 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-secondary font-body-md text-body-sm">
          <MaterialSymbol
            name="cloud_done"
            size="[18px]"
            className="text-emerald-600"
          />
          <span className="hidden sm:inline">Trạng thái biểu mẫu:</span>
          <span className="font-data-tabular font-medium text-on-surface">
            {mode === "create" ? "Tạo mới" : "Chỉnh sửa"}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/seller/products"
            className="px-4 py-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low font-body-md text-body-md font-medium transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("INACTIVE")}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low font-body-md text-body-md font-semibold border border-outline-variant/40 shadow-xs transition-all disabled:opacity-50"
          >
            <MaterialSymbol
              name="visibility_off"
              size="[18px]"
              className="text-secondary"
            />
            <span>Lưu &amp; Ẩn tạm thời</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("ACTIVE")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-headline-md text-body-md font-semibold shadow-md transition-all shadow-emerald-600/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <MaterialSymbol name="publish" size="[18px]" />
                <span>Lưu &amp; Hiển thị sản phẩm</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
