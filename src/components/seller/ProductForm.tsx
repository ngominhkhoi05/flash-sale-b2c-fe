"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND } from "@/lib/utils";
import {
  getCategories,
  createSellerProduct,
  updateSellerProduct,
  getSellerProductDetail,
  uploadSellerProductImage,
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
  id?: number;
  tier1Val: string;
  tier2Val: string;
  sku: string;
  originalPrice: number;
  stockQuantity: number;
  isActive: boolean;
  priceError?: string;
}

function parseInlineToNodes(text: string): React.ReactNode[] {
  const inlineRegex =
    /(\*\*[^*]+\*\*|__[^_]+__|(?:\*|_)[^*_]+(?:\*|_)|<u>.*?<\/u>|~~.*?~~|`.*?`)/g;
  const parts = text.split(inlineRegex);

  return parts.map((part, index) => {
    if (!part) return null;
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      return (
        <strong key={index} className="font-bold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-on-surface">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("<u>") && part.endsWith("</u>") && part.length >= 7) {
      return (
        <u key={index} className="underline decoration-primary">
          {part.slice(3, -4)}
        </u>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return (
        <del key={index} className="line-through text-secondary">
          {part.slice(2, -2)}
        </del>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-surface-container-high font-mono text-xs text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdownPreview(md: string) {
  if (!md.trim()) {
    return (
      <p className="text-secondary italic text-body-sm py-4 text-center">
        Chưa có nội dung mô tả sản phẩm...
      </p>
    );
  }

  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = (key: string | number) => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      nodes.push(
        <ul
          key={`ul-${key}`}
          className="list-disc pl-5 my-2 space-y-1 text-on-surface"
        >
          {currentList.items.map((item, i) => (
            <li key={i}>{parseInlineToNodes(item)}</li>
          ))}
        </ul>
      );
    } else {
      nodes.push(
        <ol
          key={`ol-${key}`}
          className="list-decimal pl-5 my-2 space-y-1 text-on-surface"
        >
          {currentList.items.map((item, i) => (
            <li key={i}>{parseInlineToNodes(item)}</li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();

    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (currentList && currentList.type !== "ul")
        flushList(`ul-flush-${idx}`);
      if (!currentList) currentList = { type: "ul", items: [] };
      currentList.items.push(bulletMatch[1]);
      return;
    }

    const numberMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (currentList && currentList.type !== "ol")
        flushList(`ol-flush-${idx}`);
      if (!currentList) currentList = { type: "ol", items: [] };
      currentList.items.push(numberMatch[1]);
      return;
    }

    if (currentList) flushList(`line-${idx}`);

    if (!trimmed) {
      nodes.push(<div key={`br-${idx}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h4
          key={`h3-${idx}`}
          className="font-headline-sm text-base font-bold text-on-surface mt-3 mb-1"
        >
          {parseInlineToNodes(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h3
          key={`h2-${idx}`}
          className="font-headline-md text-lg font-bold text-on-surface mt-3.5 mb-1.5"
        >
          {parseInlineToNodes(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h2
          key={`h1-${idx}`}
          className="font-headline-lg text-xl font-bold text-on-surface mt-4 mb-2"
        >
          {parseInlineToNodes(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={`quote-${idx}`}
          className="border-l-4 border-emerald-500 pl-3 my-2 text-secondary italic"
        >
          {parseInlineToNodes(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    nodes.push(
      <p key={`p-${idx}`} className="my-1 text-on-surface leading-relaxed">
        {parseInlineToNodes(trimmed)}
      </p>
    );
  });

  if (currentList) flushList("final");

  return <div className="text-body-md leading-relaxed">{nodes}</div>;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
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
    "✔ **Chất liệu cao cấp**: 100% Cotton Compact chải kỹ định lượng 220gsm, sợi dệt mật độ cao hạn chế xù lông tối đa.\n" +
      "✔ **Khả năng thấm hút**: Mồ hôi vượt trội, bề mặt mát mịn, co giãn 4 chiều vận động thoải mái suốt cả ngày.\n" +
      "✔ **Đường may 2 kim**: Gia cố vai và cổ áo chắc chắn, bo cổ dệt Spandex co giãn hồi form chuẩn không bị dão sau nhiều lần giặt.\n" +
      "✔ **Form Regular-fit**: Hiện đại phù hợp mọi dáng người nam giới Việt Nam, dễ phối đồ dạo phố, đi học, đi làm."
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [descTab, setDescTab] = useState<"write" | "preview">("write");

  const applyFormatting = (
    type:
      | "bold"
      | "italic"
      | "underline"
      | "strike"
      | "h3"
      | "bullet"
      | "number"
      | "quote"
  ) => {
    if (descTab === "preview") {
      setDescTab("write");
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.substring(start, end);

    let replacement = "";
    let selectStart = start;
    let selectEnd = end;

    if (type === "bold") {
      if (
        selected.startsWith("**") &&
        selected.endsWith("**") &&
        selected.length >= 4
      ) {
        replacement = selected.slice(2, -2);
        selectStart = start;
        selectEnd = start + replacement.length;
      } else if (selected) {
        replacement = `**${selected}**`;
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "**Văn bản in đậm**";
        selectStart = start + 2;
        selectEnd = start + 2 + "Văn bản in đậm".length;
      }
    } else if (type === "italic") {
      if (
        selected.startsWith("*") &&
        selected.endsWith("*") &&
        selected.length >= 2
      ) {
        replacement = selected.slice(1, -1);
        selectStart = start;
        selectEnd = start + replacement.length;
      } else if (selected) {
        replacement = `*${selected}*`;
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "*Văn bản in nghiêng*";
        selectStart = start + 1;
        selectEnd = start + 1 + "Văn bản in nghiêng".length;
      }
    } else if (type === "underline") {
      if (
        selected.startsWith("<u>") &&
        selected.endsWith("</u>") &&
        selected.length >= 7
      ) {
        replacement = selected.slice(3, -4);
        selectStart = start;
        selectEnd = start + replacement.length;
      } else if (selected) {
        replacement = `<u>${selected}</u>`;
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "<u>Văn bản gạch chân</u>";
        selectStart = start + 3;
        selectEnd = start + 3 + "Văn bản gạch chân".length;
      }
    } else if (type === "strike") {
      if (
        selected.startsWith("~~") &&
        selected.endsWith("~~") &&
        selected.length >= 4
      ) {
        replacement = selected.slice(2, -2);
        selectStart = start;
        selectEnd = start + replacement.length;
      } else if (selected) {
        replacement = `~~${selected}~~`;
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "~~Văn bản gạch ngang~~";
        selectStart = start + 2;
        selectEnd = start + 2 + "Văn bản gạch ngang".length;
      }
    } else if (type === "h3") {
      if (selected) {
        replacement = selected.startsWith("### ")
          ? selected.slice(4)
          : `### ${selected}`;
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "\n### Tiêu đề mục\n";
        selectStart = start + 5;
        selectEnd = start + 5 + "Tiêu đề mục".length;
      }
    } else if (type === "bullet") {
      if (selected) {
        const lines = selected.split("\n");
        const allBulleted = lines.every(
          (l) => l.startsWith("- ") || l.startsWith("• ")
        );
        if (allBulleted) {
          replacement = lines
            .map((l) => l.replace(/^[-•]\s*/, ""))
            .join("\n");
        } else {
          replacement = lines
            .map((l) =>
              l.startsWith("- ") || l.startsWith("• ") ? l : `- ${l}`
            )
            .join("\n");
        }
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "\n- ";
        selectStart = start + replacement.length;
        selectEnd = selectStart;
      }
    } else if (type === "number") {
      if (selected) {
        const lines = selected.split("\n");
        const allNumbered = lines.every((l) => /^\d+\.\s*/.test(l));
        if (allNumbered) {
          replacement = lines.map((l) => l.replace(/^\d+\.\s*/, "")).join("\n");
        } else {
          let count = 1;
          replacement = lines
            .map((l) => (/^\d+\.\s*/.test(l) ? l : `${count++}. ${l}`))
            .join("\n");
        }
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "\n1. ";
        selectStart = start + replacement.length;
        selectEnd = selectStart;
      }
    } else if (type === "quote") {
      if (selected) {
        replacement = selected.startsWith("> ")
          ? selected.slice(2)
          : `> ${selected}`;
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        replacement = "\n> Trích dẫn\n";
        selectStart = start + 3;
        selectEnd = start + 3 + "Trích dẫn".length;
      }
    }

    const nextVal =
      description.substring(0, start) +
      replacement +
      description.substring(end);
    setDescription(nextVal);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectStart, selectEnd);
    });
  };

  const handleDescKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        applyFormatting("bold");
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        applyFormatting("italic");
      } else if (e.key.toLowerCase() === "u") {
        e.preventDefault();
        applyFormatting("underline");
      }
    }
  };

  // Images
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isAddingImage, setIsAddingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // SPU / SKU Variations
  const [skuSeed] = useState(() =>
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
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
        id?: number;
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

          const configs =
            detail.tierVariationConfigs || detail.tierVariations || [];
          if (configs.length > 0) {
            setHasVariations(true);
            const t1 = configs[0];
            if (t1) {
              setTier1Name(t1.name);
              setTier1Options(t1.options || []);
            }
            const t2 = configs[1];
            if (t2) {
              setTier2Name(t2.name);
              setTier2Options(t2.options || []);
            } else {
              setTier2Options([]);
            }
          } else {
            setHasVariations(false);
          }

          // Nạp các variants vào skuOverrides kèm variant ID!
          if (Array.isArray(detail.variants) && detail.variants.length > 0) {
            const initialOverrides: Record<
              string,
              {
                id?: number;
                sku?: string;
                originalPrice?: number;
                stockQuantity?: number;
                isActive?: boolean;
              }
            > = {};

            detail.variants.forEach((v) => {
              const attrs = v.attributes || {};
              const t1Name = configs[0]?.name;
              const t2Name = configs[1]?.name;
              const t1Val = t1Name ? attrs[t1Name] : undefined;
              const t2Val = t2Name ? attrs[t2Name] : undefined;

              const rowKey =
                t1Val && t2Val
                  ? `${t1Val}-${t2Val}`
                  : t1Val
                  ? `${t1Val}-Mặc định`
                  : "default";

              initialOverrides[rowKey] = {
                id: v.id,
                sku: v.sku || v.skuCode,
                originalPrice: Number(v.originalPrice) || 0,
                stockQuantity: Number(v.stockQuantity) || 0,
                isActive: v.status === "ACTIVE",
              };
            });

            setSkuOverrides(initialOverrides);
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
          id: def?.id,
          tier1Val: "Mặc định",
          tier2Val: "-",
          sku: def?.sku || (mode === "edit" ? "SKU-DEFAULT" : `SKU-${skuSeed}`),
          originalPrice: price,
          stockQuantity: def?.stockQuantity ?? (Number(batchStock) || 50),
          isActive: def?.isActive ?? true,
          priceError: price <= 0 ? "Giá phải lớn hơn 0" : undefined,
        },
      ];
    }

    const normalizeSkuPart = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

    const t1List = tier1Options.length > 0 ? tier1Options : ["Mặc định"];
    const t2List = tier2Options.length > 0 ? tier2Options : ["Mặc định"];
    const rows: SkuRowState[] = [];

    for (const t1 of t1List) {
      for (const t2 of t2List) {
        const rowKey = `${t1}-${t2}`;
        const ov = skuOverrides[rowKey];
        const price = ov?.originalPrice ?? (Number(batchPrice) || 149000);
        const stock = ov?.stockQuantity ?? (Number(batchStock) || 50);
        const p1 = normalizeSkuPart(t1).slice(0, 3) || "SKU";
        const p2 = normalizeSkuPart(t2).slice(0, 3) || "DEF";
        const defaultSku =
          mode === "edit"
            ? `AT-${p1}-${p2}`
            : `AT-${skuSeed}-${p1}-${p2}`;

        rows.push({
          key: rowKey,
          id: ov?.id,
          tier1Val: t1,
          tier2Val: t2 === "Mặc định" ? "-" : t2,
          sku: ov?.sku || defaultSku,
          originalPrice: price,
          stockQuantity: stock,
          isActive: ov?.isActive ?? true,
          priceError: price <= 0 ? "Giá phải lớn hơn 0" : undefined,
        });
      }
    }
    return rows;
  }, [hasVariations, tier1Options, tier2Options, skuOverrides, batchPrice, batchStock, mode, skuSeed]);

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

  // Image Upload Handlers (Local computer file picker & Drag/Drop)
  const processFiles = (files: File[]) => {
    const validImages = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`Tệp "${file.name}" không phải là ảnh hợp lệ.`);
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá giới hạn 8MB.`);
        return false;
      }
      return true;
    });

    if (validImages.length === 0) return;

    const remainingSlots = 9 - images.length;
    if (remainingSlots <= 0) {
      toast.error("Đã đạt giới hạn tối đa 9 ảnh cho sản phẩm.");
      return;
    }

    const toLoad = validImages.slice(0, remainingSlots);
    let loadedCount = 0;

    toLoad.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImages((prev) => {
            if (prev.length >= 9) return prev;
            return [...prev, dataUrl];
          });
          loadedCount++;
          if (loadedCount === toLoad.length) {
            toast.success(`Đã thêm thành công ${loadedCount} ảnh từ máy tính!`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    processFiles(Array.from(fileList));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
    toast.success("Đã đặt làm ảnh bìa sản phẩm!");
  };

  // Add image by URL
  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (trimmed && images.length < 9) {
      setImages([...images, trimmed]);
      setNewImageUrl("");
      setIsAddingImage(false);
      toast.success("Đã thêm ảnh từ liên kết!");
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
      const msg = "Vui lòng nhập tên sản phẩm.";
      setErrorMessage(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!categoryId) {
      const msg = "Vui lòng chọn ngành hàng sản phẩm.";
      setErrorMessage(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (skuMatrix.length === 0) {
      const msg = "Sản phẩm phải có ít nhất 1 biến thể SKU.";
      setErrorMessage(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const invalidRow = skuMatrix.find((r) => r.originalPrice <= 0);
    if (invalidRow) {
      const msg = `Biến thể [${invalidRow.tier1Val} - ${invalidRow.tier2Val}] có giá bán không hợp lệ (phải > 0).`;
      setErrorMessage(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        id: r.id,
        sku: r.sku,
        variantName:
          r.tier2Val && r.tier2Val !== "-"
            ? `${r.tier1Val}, Size ${r.tier2Val}`
            : r.tier1Val,
        originalPrice: r.originalPrice,
        stockQuantity: r.stockQuantity,
        status: r.isActive ? "ACTIVE" : "INACTIVE",
        attributes: {
          [tier1Name]: r.tier1Val,
          ...(r.tier2Val && r.tier2Val !== "-" ? { [tier2Name]: r.tier2Val } : {}),
        },
      }));

      let savedId = productId;
      if (mode === "create") {
        const payload: CreateProductPayload = {
          categoryId,
          name: name.trim(),
          description: description.trim(),
          imageUrl: images[0]?.startsWith("http") ? images[0] : undefined,
          tierVariationConfigs,
          variants,
        };
        const created = await createSellerProduct(payload);
        savedId = created?.id;
      } else if (mode === "edit" && productId) {
        const payload: UpdateProductPayload = {
          categoryId,
          name: name.trim(),
          description: description.trim(),
          imageUrl: images[0]?.startsWith("http") ? images[0] : undefined,
          status: targetStatus,
          tierVariationConfigs,
          variants,
        };
        await updateSellerProduct(productId, payload);
      }

      // Upload ảnh chọn từ laptop lên Backend
      if (savedId && images.length > 0) {
        for (let idx = 0; idx < images.length; idx++) {
          const img = images[idx];
          if (img && img.startsWith("data:image/")) {
            const blob = dataUrlToBlob(img);
            if (blob) {
              await uploadSellerProductImage(savedId, blob, idx === 0, idx);
            }
          }
        }
      }

      const successNotice =
        mode === "create"
          ? "Đăng bán sản phẩm thành công!"
          : "Cập nhật sản phẩm thành công!";
      toast.success(successNotice);
      setSuccessMessage(successNotice);
      setTimeout(() => {
        router.push("/seller/products");
      }, 1000);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      const msg =
        errObj?.message ||
        "Có lỗi xảy ra khi lưu sản phẩm. Vui lòng kiểm tra lại.";
      setErrorMessage(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
            <div className="flex flex-col gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="font-headline-md text-body-md text-on-surface font-semibold flex items-center gap-1.5">
                    <span>Hình ảnh sản phẩm</span>
                    <span className="text-tertiary">*</span>
                    <span className="text-xs font-normal text-secondary">
                      ({images.length}/9 ảnh)
                    </span>
                  </label>
                  <p className="font-body-sm text-label-sm text-secondary">
                    Ảnh đầu tiên là ảnh bìa hiển thị trên trang chủ &amp; kết quả tìm kiếm.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-xs font-semibold shadow-xs transition-colors"
                  >
                    <MaterialSymbol name="upload" size="[16px]" />
                    <span>Chọn ảnh từ máy tính</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingImage(!isAddingImage)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low text-secondary hover:text-on-surface font-label-md text-xs font-medium transition-colors"
                  >
                    <MaterialSymbol name="link" size="[16px]" />
                    <span>Dán URL</span>
                  </button>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-error/80 hover:text-error hover:bg-error-container/20 font-label-md text-xs font-medium transition-colors"
                    >
                      <MaterialSymbol name="delete" size="[14px]" />
                      <span>Xóa hết</span>
                    </button>
                  )}
                </div>
              </div>

              {/* URL Input dropdown */}
              {isAddingImage && (
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-50/20 flex flex-col sm:flex-row items-center gap-2 shadow-xs animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Dán đường dẫn ảnh trực tuyến (https://...)..."
                    className="h-9 w-full sm:flex-1 px-3 text-body-sm bg-surface-container-lowest border border-outline-variant/40 rounded-lg focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddingImage(false)}
                      className="px-3 py-1.5 text-xs rounded-lg text-secondary hover:bg-surface-container-low"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-3.5 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                    >
                      Thêm link
                    </button>
                  </div>
                </div>
              )}

              {/* Drag and Drop Container */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`rounded-xl transition-all p-3 border-2 ${
                  isDraggingOver
                    ? "border-emerald-500 bg-emerald-50/40 scale-[1.005]"
                    : "border-outline-variant/30 bg-surface-container-lowest"
                }`}
              >
                {images.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="py-10 flex flex-col items-center justify-center gap-3 cursor-pointer group text-center hover:bg-surface-container-low/40 rounded-lg transition-colors border border-dashed border-outline-variant/60 hover:border-emerald-500"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                      <MaterialSymbol name="upload" size="[28px]" />
                    </div>
                    <div className="flex flex-col gap-1 px-4">
                      <p className="font-headline-md text-body-md font-semibold text-on-surface">
                        Bấm để chọn ảnh từ máy tính (Laptop) hoặc kéo thả vào đây
                      </p>
                      <p className="font-body-sm text-label-sm text-secondary">
                        Hỗ trợ PNG, JPG, JPEG, WEBP. Chọn nhiều ảnh cùng lúc, tối đa 9 ảnh.
                      </p>
                    </div>
                    <span className="mt-1 px-4 py-2 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white font-label-md text-xs font-semibold shadow-sm transition-colors">
                      Tải ảnh từ máy tính
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-low shadow-sm group border ${
                          idx === 0
                            ? "ring-2 ring-emerald-500 border-emerald-500"
                            : "border-outline-variant/40"
                        }`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`Ảnh sản phẩm ${idx + 1}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized
                        />
                        {idx === 0 ? (
                          <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white font-label-sm text-[10px] text-center py-0.5 font-bold shadow-xs">
                            Ảnh bìa
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(idx)}
                            className="absolute bottom-0 inset-x-0 bg-black/70 hover:bg-emerald-600 text-white font-label-sm text-[9px] text-center py-0.5 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Đặt làm ảnh bìa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          title="Xóa ảnh"
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                        >
                          <MaterialSymbol name="close" size="[14px]" />
                        </button>
                      </div>
                    ))}

                    {/* Add Image Slot */}
                    {images.length < 9 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-lg flex-shrink-0 bg-surface-container-low/70 border-2 border-dashed border-outline-variant hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer flex flex-col items-center justify-center text-center p-2 transition-all group"
                      >
                        <MaterialSymbol
                          name="upload"
                          size="[24px]"
                          className="text-outline group-hover:text-emerald-600 transition-colors"
                        />
                        <span className="font-label-sm text-[11px] font-semibold text-secondary group-hover:text-emerald-700 leading-tight mt-1">
                          + Tải thêm
                        </span>
                        <span className="text-[9px] text-secondary/70">
                          {images.length}/9
                        </span>
                      </button>
                    )}

                    {/* Empty placeholders */}
                    {Array.from({ length: Math.max(0, 5 - images.length) }).map(
                      (_, i) => (
                        <div
                          key={`placeholder-${i}`}
                          className="w-24 h-24 rounded-lg flex-shrink-0 bg-surface-container-low/30 border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-outline/40"
                        >
                          <MaterialSymbol name="photo_camera" size="[20px]" />
                          <span className="font-label-sm text-[10px] mt-0.5">
                            {images.length + i + 2}/9
                          </span>
                        </div>
                      )
                    )}
                  </div>
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
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline font-body-sm text-label-sm text-secondary">
                    Hỗ trợ Markdown &amp; Trình soạn thảo
                  </span>
                  <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant/30 text-xs">
                    <button
                      type="button"
                      onClick={() => setDescTab("write")}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        descTab === "write"
                          ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                          : "text-secondary hover:text-on-surface"
                      }`}
                    >
                      Soạn thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab("preview")}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        descTab === "preview"
                          ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                          : "text-secondary hover:text-on-surface"
                      }`}
                    >
                      Xem trước
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
                <div className="flex items-center gap-1 p-1.5 bg-surface-container-low border-b border-outline-variant/20 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyFormatting("bold")}
                    title="In đậm (Ctrl+B)"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center font-bold text-sm transition-colors active:scale-95"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting("italic")}
                    title="In nghiêng (Ctrl+I)"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center italic text-sm transition-colors active:scale-95"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting("underline")}
                    title="Gạch chân (Ctrl+U)"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center underline text-sm transition-colors active:scale-95"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting("strike")}
                    title="Gạch ngang"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center line-through text-sm transition-colors active:scale-95"
                  >
                    S
                  </button>
                  <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => applyFormatting("h3")}
                    title="Tiêu đề mục (###)"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center font-bold text-xs transition-colors active:scale-95"
                  >
                    H
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting("bullet")}
                    title="Danh sách gạch đầu dòng"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center transition-colors active:scale-95"
                  >
                    <MaterialSymbol name="format_list_bulleted" size="[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting("number")}
                    title="Danh sách số thứ tự"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center transition-colors active:scale-95"
                  >
                    <MaterialSymbol name="format_list_numbered" size="[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting("quote")}
                    title="Trích dẫn"
                    className="w-8 h-8 rounded hover:bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center font-serif font-bold text-sm transition-colors active:scale-95"
                  >
                    &rdquo;
                  </button>
                </div>

                {descTab === "write" ? (
                  <textarea
                    ref={textareaRef}
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleDescKeyDown}
                    placeholder="Mô tả chi tiết xuất xứ, chất liệu vải, tính năng, hướng dẫn giặt ủi và bảo quản..."
                    className="w-full p-3.5 bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none resize-y leading-relaxed"
                  />
                ) : (
                  <div className="w-full min-h-[160px] p-3.5 bg-surface-container-lowest font-body-md text-body-md text-on-surface leading-relaxed overflow-y-auto">
                    {renderMarkdownPreview(description)}
                  </div>
                )}
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
