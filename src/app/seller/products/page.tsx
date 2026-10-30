"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { formatVND } from "@/lib/utils";
import {
  getSellerProducts,
  getSellerProductDetail,
  updateProductStatus,
  deleteProduct,
  getCategories,
  updateProductVariantStock,
} from "@/lib/api/seller";
import { getAccessToken } from "@/lib/api/client";
import { createFlashSaleStompClient } from "@/lib/stomp";
import { useMyStore } from "@/hooks/useMyStore";
import * as XLSX from "xlsx";
import type { PageResponse } from "@/types/api";
import type {
  SellerProductSummaryResponse,
  SellerProductDetailResponse,
  CategoryItem,
} from "@/types/seller";

type ProductTab = "ALL" | "ACTIVE" | "OUT_OF_STOCK" | "INACTIVE" | "BANNED";

/**
 * Màn hình 21: Danh sách sản phẩm của Shop – Chuẩn thiết kế Google Stitch.
 * Gắn API thật:
 *  - GET /api/v1/seller/products (Danh sách SPU phân trang & lọc)
 *  - GET /api/v1/seller/products/{id} (Chi tiết biến thể SKU khi expand row)
 *  - PATCH /api/v1/seller/products/{id}/status (Bật / Tắt trạng thái)
 *  - DELETE /api/v1/seller/products/{id} (Xóa sản phẩm)
 *  - Realtime: WebSocket STOMP đồng bộ tồn kho ngay lập tức
 */
function SellerProductsContent() {
  const { isBanned, store } = useMyStore();
  const searchParams = useSearchParams();
  const initialStock = searchParams?.get("stock") || "";
  const initialStatus = searchParams?.get("status") || "";

  const [activeTab, setActiveTab] = useState<ProductTab>(() => {
    if (initialStatus && ["ACTIVE", "OUT_OF_STOCK", "INACTIVE", "BANNED"].includes(initialStatus)) {
      return initialStatus as ProductTab;
    }
    return "ALL";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [stockSort, setStockSort] = useState<string>(() => {
    if (initialStock) return initialStock;
    if (initialStatus === "LOW_STOCK") return "low-stock";
    return "";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [pageData, setPageData] = useState<PageResponse<SellerProductSummaryResponse> | null>(null);
  const [tabDataCache, setTabDataCache] = useState<Record<string, PageResponse<SellerProductSummaryResponse>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Stock Edit state (Map variantId -> newStock, variantId -> boolean)
  const [editingStock, setEditingStock] = useState<Record<number, number>>({});
  const [isSavingStock, setIsSavingStock] = useState<Record<number, boolean>>({});

  // Expanded rows state (Map productId -> ProductDetailResponse)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());
  const [detailsCache, setDetailsCache] = useState<Record<number, SellerProductDetailResponse>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

  // Modal Xóa
  const [deleteModalProduct, setDeleteModalProduct] = useState<SellerProductSummaryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tải danh sách sản phẩm (hỗ trợ cả tải ban đầu và nạp ngầm tự động)
  const loadProducts = useCallback(
    (isInitial = false) => {
      if (isInitial && !pageData) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const cacheKey = `${activeTab}_${page}_${pageSize}`;
      return getSellerProducts(page, pageSize, activeTab === "ALL" ? undefined : activeTab)
        .then((res) => {
          setPageData(res);
          setTabDataCache((prev) => ({ ...prev, [cacheKey]: res }));
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Không thể nạp danh sách sản phẩm.");
        })
        .finally(() => {
          setIsLoading(false);
          setIsRefreshing(false);
        });
    },
    [page, pageSize, activeTab, pageData]
  );

  // Handle reload kích hoạt thủ công hoặc từ các action
  const handleReload = useCallback(() => {
    return loadProducts(false);
  }, [loadProducts]);

  // Nạp lần đầu hoặc khi đổi tab/trang/phân trang (Áp dụng Stale-While-Revalidate + Cache 0ms)
  useEffect(() => {
    let ignore = false;
    const cacheKey = `${activeTab}_${page}_${pageSize}`;

    // Nếu đã có dữ liệu trong cache của tab này, hiển thị ngay lập tức (0ms latency)!
    if (tabDataCache[cacheKey]) {
      setPageData(tabDataCache[cacheKey]);
      setIsRefreshing(true);
    } else if (!pageData) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    getSellerProducts(page, pageSize, activeTab === "ALL" ? undefined : activeTab)
      .then((res) => {
        if (!ignore) {
          setPageData(res);
          setTabDataCache((prev) => ({ ...prev, [cacheKey]: res }));
        }
      })
      .catch((err) => {
        if (!ignore && !pageData) {
          setError(err instanceof Error ? err.message : "Không thể nạp danh sách sản phẩm.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, activeTab]);

  // Tự động load lại khi thêm/sửa sản phẩm quay về, chuyển tab, hoặc focus lại trang
  useEffect(() => {
    // 1. Kiểm tra cờ cần reload trong sessionStorage
    let timer: NodeJS.Timeout | null = null;
    try {
      if (typeof window !== "undefined" && window.sessionStorage.getItem("seller_products_need_reload")) {
        window.sessionStorage.removeItem("seller_products_need_reload");
        timer = setTimeout(() => {
          void loadProducts(false);
        }, 0);
      }
    } catch {
      // ignore
    }

    // 2. Lắng nghe CustomEvent seller_products_updated phát từ ProductForm
    const handleProductsUpdated = () => {
      loadProducts(false);
    };

    // 3. Lắng nghe khi tab trình duyệt được active lại (focus)
    const handleWindowFocus = () => {
      try {
        if (window.sessionStorage.getItem("seller_products_need_reload")) {
          window.sessionStorage.removeItem("seller_products_need_reload");
          loadProducts(false);
        }
      } catch {
        // ignore
      }
    };

    // 4. Lắng nghe storage event (trường hợp mở form thêm/sửa ở tab trình duyệt khác)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "seller_products_need_reload") {
        loadProducts(false);
      }
    };

    window.addEventListener("seller_products_updated", handleProductsUpdated);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("seller_products_updated", handleProductsUpdated);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadProducts]);

  // Nạp danh sách ngành hàng (Categories) thật từ Backend để lọc
  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((cats) => {
        if (isMounted) {
          setCategories(cats || []);
        }
      })
      .catch((err) => {
        console.warn("Lỗi khi tải danh mục sản phẩm:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Danh sách danh mục đầy đủ: Gộp từ API getCategories() và danh mục thực tế của sản phẩm
  const allDisplayCategories = useMemo(() => {
    const map = new Map<string, { id: number | string; name: string }>();
    categories.forEach((c) => {
      if (c.name) map.set(c.name.trim().toLowerCase(), { id: c.id, name: c.name.trim() });
    });
    const currentList =
      Array.isArray(pageData?.items) && pageData.items.length > 0
        ? pageData.items
        : Array.isArray(pageData?.content)
        ? pageData.content
        : [];
    currentList.forEach((p) => {
      if (p.categoryName && !map.has(p.categoryName.trim().toLowerCase())) {
        map.set(p.categoryName.trim().toLowerCase(), {
          id: p.categoryId || p.categoryName,
          name: p.categoryName.trim(),
        });
      }
    });
    return Array.from(map.values());
  }, [categories, pageData]);

  // Xử lý Realtime bằng WebSocket STOMP: Lắng nghe đơn hàng và biến động tồn kho
  useEffect(() => {
    let stomp: { disconnect: () => void } | null = null;
    let isSubscribed = true;

    try {
      const token = getAccessToken();
      const client = createFlashSaleStompClient(token);
      stomp = client;

      const prevOnConnect = client.client.onConnect;
      client.client.onConnect = (frame) => {
        if (!isSubscribed) return;
        setIsWsConnected(true);
        if (typeof prevOnConnect === "function") {
          prevOnConnect(frame);
        }
      };

      const prevOnDisconnect = client.client.onDisconnect;
      client.client.onDisconnect = (frame) => {
        if (!isSubscribed) return;
        setIsWsConnected(false);
        if (typeof prevOnDisconnect === "function") {
          prevOnDisconnect(frame);
        }
      };

      const handleIncomingOrder = (data: {
        orderCode?: string;
        code?: string;
      }) => {
        if (!data) return;
        const code = data.orderCode || data.code;
        toast.info(
          `🔔 Có đơn hàng mới ${code ? `#${code}` : ""}`,
          {
            description: "Số lượng tồn kho sản phẩm vừa được cập nhật theo thời gian thực.",
          }
        );
        // Tự động giải phóng cache chi tiết và reload danh sách ngầm
        setDetailsCache({});
        loadProducts(false);
      };

      // 1. Kênh đơn hàng seller
      client.subscribe("/topic/seller/orders", (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          handleIncomingOrder(payload.data || payload);
        } catch (e) {
          console.warn("Parse WS /topic/seller/orders warning:", e);
        }
      });

      // 2. Kênh đơn hàng riêng của gian hàng
      if (store?.id) {
        client.subscribe(`/topic/stores/${store.id}/orders`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            handleIncomingOrder(payload.data || payload);
          } catch (e) {
            console.warn("Parse WS /topic/stores orders warning:", e);
          }
        });
      }

      // 3. Kênh biến động tồn kho Flash Sale
      client.subscribe("/topic/flash-sale/stock-updates", () => {
        setDetailsCache({});
        loadProducts(false);
      });
    } catch (err) {
      console.warn("Lỗi thiết lập WebSocket cho màn hình sản phẩm:", err);
    }

    return () => {
      isSubscribed = false;
      if (stomp) {
        try {
          stomp.disconnect();
        } catch {
          // ignore
        }
      }
    };
  }, [store?.id, loadProducts]);

  // Định kỳ đồng bộ tồn kho ngầm mỗi 30 giây (chỉ chạy dự phòng khi WebSocket chưa kết nối)
  useEffect(() => {
    if (isWsConnected) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadProducts(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadProducts, isWsConnected]);

  // Sửa nhanh số lượng tồn kho của biến thể SKU (Quick Stock Edit)
  const handleSaveStock = async (
    productId: number,
    variantId: number,
    newStock: number,
    skuCode?: string
  ) => {
    if (isBanned) {
      toast.error("Gian hàng đang bị khóa, không thể cập nhật tồn kho!");
      return;
    }
    if (newStock < 0 || isNaN(newStock)) {
      toast.error("Số lượng tồn kho phải là số nguyên không âm (>= 0)!");
      return;
    }

    setIsSavingStock((prev) => ({ ...prev, [variantId]: true }));
    try {
      await updateProductVariantStock(productId, variantId, newStock);

      // 1. Cập nhật chi tiết SKU trong detailsCache ngay lập tức
      setDetailsCache((prev) => {
        const oldDetail = prev[productId];
        if (!oldDetail) return prev;
        return {
          ...oldDetail,
          variants: oldDetail.variants.map((v) =>
            v.id === variantId ? { ...v, stockQuantity: newStock } : v
          ),
        };
      });

      // 2. Cập nhật tổng tồn kho của SPU trong pageData
      setPageData((prev) => {
        if (!prev) return prev;
        const updateList = (list: SellerProductSummaryResponse[]) =>
          list.map((p) => {
            if (p.id !== productId) return p;
            const currentDetail = detailsCache[productId];
            const updatedTotal = currentDetail
              ? currentDetail.variants.reduce(
                  (acc, v) => acc + (v.id === variantId ? newStock : v.stockQuantity || 0),
                  0
                )
              : (p.totalStock ?? 0);
            return { ...p, totalStock: updatedTotal };
          });

        if (Array.isArray(prev.content)) {
          return { ...prev, content: updateList(prev.content) };
        }
        if (Array.isArray(prev.items)) {
          return { ...prev, items: updateList(prev.items) };
        }
        return prev;
      });

      // 3. Xóa trạng thái nháp
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });

      toast.success(
        `Đã cập nhật tồn kho SKU ${skuCode || `#${variantId}`} thành công: ${newStock} sản phẩm!`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật số lượng tồn kho thất bại.");
    } finally {
      setIsSavingStock((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  // Toggle expand row xem biến thể SKU
  const toggleExpandRow = async (productId: number) => {
    const next = new Set(expandedRowIds);
    if (next.has(productId)) {
      next.delete(productId);
      setExpandedRowIds(next);
      return;
    }

    next.add(productId);
    setExpandedRowIds(next);

    // Nếu chưa có cache detail, gọi API lấy chi tiết biến thể
    if (!detailsCache[productId]) {
      setLoadingDetails((prev) => ({ ...prev, [productId]: true }));
      try {
        const detail = await getSellerProductDetail(productId);
        setDetailsCache((prev) => ({ ...prev, [productId]: detail }));
      } catch (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- catch chỉ để suppress, không dùng error
        _err
      ) {
        toast.error("Không thể lấy danh sách biến thể SKU.");
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [productId]: false }));
      }
    }
  };

  // Toggle bật/tắt trạng thái SPU (Ẩn / Mở bán) - Tự động reload cập nhật ngay lập tức
  const handleToggleStatus = async (product: SellerProductSummaryResponse) => {
    if (isBanned) {
      toast.error("Gian hàng đang bị khóa, không thể thay đổi trạng thái sản phẩm!");
      return;
    }
    const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      // Cập nhật trạng thái lạc quan trên UI ngay lập tức
      if (pageData && Array.isArray(pageData.content)) {
        setPageData({
          ...pageData,
          content: pageData.content.map((p: SellerProductSummaryResponse) =>
            p.id === product.id ? { ...p, status: newStatus } : p
          ),
        });
      }

      await updateProductStatus(product.id, newStatus);
      toast.success(
        newStatus === "ACTIVE"
          ? `Đã mở bán lại sản phẩm: ${product.name}`
          : `Đã tạm ẩn sản phẩm: ${product.name}`
      );

      // Xóa cache chi tiết để nếu mở lại sẽ nạp dữ liệu mới
      setDetailsCache((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });

      // Tự động load lại danh sách sản phẩm từ backend để cập nhật chuẩn phân trang và tab
      handleReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại.");
      handleReload();
    }
  };

  // Xác nhận xóa sản phẩm - Tự động reload cập nhật ngay lập tức
  const handleConfirmDelete = async () => {
    if (isBanned) {
      toast.error("Gian hàng đang bị khóa, không thể xóa sản phẩm!");
      return;
    }
    if (!deleteModalProduct) return;
    const deletedId = deleteModalProduct.id;
    setIsDeleting(true);
    try {
      await deleteProduct(deletedId);
      toast.success(`Đã xóa sản phẩm: ${deleteModalProduct.name}`);
      setDeleteModalProduct(null);

      // Dọn cache chi tiết và hàng đang expand
      setExpandedRowIds((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
      setDetailsCache((prev) => {
        const next = { ...prev };
        delete next[deletedId];
        return next;
      });

      // Nếu xóa sản phẩm duy nhất còn lại trên trang hiện tại (page > 0), lùi về trang trước
      const currentListLength = Array.isArray(pageData?.content) ? pageData.content.length : 0;
      if (currentListLength <= 1 && page > 0) {
        setPage((prev) => prev - 1);
      } else {
        handleReload();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa sản phẩm thất bại.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Xuất file Excel danh sách sản phẩm
  const handleExportCSV = () => {
    const listToExport =
      filteredProducts.length > 0
        ? filteredProducts
        : Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData?.items)
        ? pageData.items
        : [];

    if (listToExport.length === 0) {
      toast.error("Không có sản phẩm để xuất file Excel.");
      return;
    }

    const exportRows = listToExport.map((p, index) => {
      let statusLabel = p.status;
      if (p.status === "ACTIVE") statusLabel = "Đang bán";
      else if (p.status === "INACTIVE") statusLabel = "Tạm ẩn";
      else if (p.status === "OUT_OF_STOCK") statusLabel = "Hết hàng";
      else if (p.status === "BANNED") statusLabel = "Vi phạm";
      else if (p.status === "DELETED") statusLabel = "Đã xóa";

      const priceFormatted =
        p.minPrice === p.maxPrice
          ? `${(p.minPrice || 0).toLocaleString("vi-VN")} ₫`
          : `${(p.minPrice || 0).toLocaleString("vi-VN")} ₫ - ${(p.maxPrice || 0).toLocaleString("vi-VN")} ₫`;

      let createdDate = "-";
      if (p.createdAt) {
        try {
          const d = new Date(p.createdAt);
          createdDate = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${d.getFullYear()}`;
        } catch {
          createdDate = p.createdAt;
        }
      }

      return {
        "STT": index + 1,
        "Mã sản phẩm": `#SP-${p.id}`,
        "Tên sản phẩm": p.name || "-",
        "Danh mục": p.categoryName || "-",
        "Giá bán (VNĐ)": priceFormatted,
        "Tồn kho": p.totalStock ?? 0,
        "Đã bán": p.totalSold ?? 0,
        "Trạng thái": statusLabel,
        "Ngày tạo": createdDate,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    worksheet["!cols"] = [
      { wch: 6 },  // STT
      { wch: 14 }, // Mã sản phẩm
      { wch: 42 }, // Tên sản phẩm
      { wch: 22 }, // Danh mục
      { wch: 26 }, // Giá bán (VNĐ)
      { wch: 12 }, // Tồn kho
      { wch: 12 }, // Đã bán
      { wch: 16 }, // Trạng thái
      { wch: 16 }, // Ngày tạo
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách sản phẩm");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `danh_sach_san_pham_${dateStr}.xlsx`);
    toast.success("Đã xuất danh sách sản phẩm sang file Excel thành công");
  };

  // Lọc sản phẩm theo tìm kiếm và sort tồn kho phía client
  const filteredProducts = useMemo(() => {
    if (!pageData) return [];
    const sourceList =
      Array.isArray(pageData.items) && pageData.items.length > 0
        ? pageData.items
        : Array.isArray(pageData.content)
        ? pageData.content
        : Array.isArray(pageData)
        ? (pageData as unknown as SellerProductSummaryResponse[])
        : [];
    let list = [...sourceList];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.slug && p.slug.toLowerCase().includes(q)) ||
          String(p.id).includes(q)
      );
    }

    if (selectedCategory) {
      list = list.filter(
        (p) =>
          (p.categoryName &&
            p.categoryName.toLowerCase() === selectedCategory.toLowerCase()) ||
          String(p.categoryId) === selectedCategory
      );
    }

    if (stockSort === "low-stock") {
      list = list.filter((p) => p.totalStock < 10);
    } else if (stockSort === "out-of-stock") {
      list = list.filter((p) => p.totalStock <= 0);
    } else if (stockSort === "high-stock") {
      list = list.filter((p) => p.totalStock > 100);
    } else if (stockSort === "price-asc") {
      list.sort((a, b) => a.minPrice - b.minPrice);
    } else if (stockSort === "price-desc") {
      list.sort((a, b) => b.minPrice - a.minPrice);
    }

    return list;
  }, [pageData, searchTerm, stockSort, selectedCategory]);

  const rawList = useMemo(() => {
    if (!pageData) return [];
    return Array.isArray(pageData.items) && pageData.items.length > 0
      ? pageData.items
      : Array.isArray(pageData.content)
      ? pageData.content
      : Array.isArray(pageData)
      ? (pageData as unknown as SellerProductSummaryResponse[])
      : [];
  }, [pageData]);

  const totalCount = pageData?.totalElements ?? filteredProducts.length;

  const tabCounts = useMemo(() => {
    return {
      ALL: totalCount,
      ACTIVE: rawList.filter((p) => p.status === "ACTIVE").length,
      OUT_OF_STOCK: rawList.filter(
        (p) => p.status === "OUT_OF_STOCK" || p.totalStock <= 0
      ).length,
      INACTIVE: rawList.filter((p) => p.status === "INACTIVE").length,
      BANNED: rawList.filter((p) => p.status === "BANNED").length,
    };
  }, [rawList, totalCount]);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex items-baseline gap-space-sm">
          <h1 className="font-display-sm text-display-sm text-on-surface font-semibold tracking-tight">
            Quản lý sản phẩm
          </h1>
          <span className="font-body-md text-body-md text-secondary">
            {totalCount} sản phẩm
          </span>
        </div>

        <div className="flex items-center gap-space-sm">
          {isWsConnected && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200 shadow-xs"
              title="Kết nối Realtime STOMP thành công: Tồn kho và đơn hàng tự động cập nhật trực tiếp"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Trực tiếp</span>
            </span>
          )}
          <button
            type="button"
            disabled={isRefreshing || isLoading}
            onClick={() => handleReload()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container-low transition-all font-body-md text-body-md shadow-sm border border-outline-variant/30 font-medium disabled:opacity-50"
            title="Đồng bộ & làm mới danh sách sản phẩm"
          >
            <MaterialSymbol
              name="sync"
              size="[18px]"
              className={isRefreshing ? "animate-spin text-emerald-600" : ""}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-body-md text-body-md shadow-xs border border-emerald-200 font-semibold cursor-pointer"
          >
            <MaterialSymbol name="file_download" size="[18px]" className="text-emerald-700" />
            <span>Xuất Excel</span>
          </button>
          {isBanned ? (
            <button
              type="button"
              onClick={() => toast.error("Gian hàng đang bị khóa, không thể thêm sản phẩm mới!")}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-slate-200 text-slate-500 font-headline-md text-body-md font-medium cursor-not-allowed opacity-80"
              title="Gian hàng đang bị khóa, không thể thêm sản phẩm mới"
            >
              <MaterialSymbol name="lock" size="[20px]" />
              <span>Thêm sản phẩm mới</span>
            </button>
          ) : (
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline-md text-body-md font-medium shadow-sm transition-all transform active:scale-[0.99]"
            >
              <MaterialSymbol name="add" size="[20px]" />
              <span>Thêm sản phẩm mới</span>
            </Link>
          )}
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm px-space-md pt-2 flex items-center justify-between overflow-x-auto border border-outline-variant/30">
        <div className="flex items-center gap-space-md">
          {[
            { key: "ALL", label: "Tất cả", count: tabCounts.ALL },
            { key: "ACTIVE", label: "Đang bán", count: tabCounts.ACTIVE },
            {
              key: "OUT_OF_STOCK",
              label: "Hết hàng",
              count: tabCounts.OUT_OF_STOCK,
            },
            { key: "INACTIVE", label: "Đã ẩn", count: tabCounts.INACTIVE },
            { key: "BANNED", label: "Vi phạm", count: tabCounts.BANNED },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  const newTab = tab.key as ProductTab;
                  setActiveTab(newTab);
                  setPage(0);
                  const cacheKey = `${newTab}_0_${pageSize}`;
                  if (tabDataCache[cacheKey]) {
                    setPageData(tabDataCache[cacheKey]);
                  }
                }}
                className={`relative flex items-center gap-1.5 py-3 px-1 font-body-md text-body-md transition-colors ${
                  isActive
                    ? "text-emerald-700 font-semibold border-b-2 border-emerald-500"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-label-md text-label-sm px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "bg-surface-container-low text-secondary"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick stats indicator */}
        <div className="hidden xl:flex items-center gap-space-md py-2 font-body-sm text-body-sm text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{rawList.length} sản phẩm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span>{rawList.filter((p) => (p.totalStock ?? 0) < 10).length} cảnh báo tồn kho</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-wrap items-center justify-between gap-space-md border border-outline-variant/30">
        <div className="flex flex-1 flex-wrap items-center gap-space-sm min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <MaterialSymbol
              name="search"
              size="[20px]"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
              className="w-full h-10 pl-10 pr-4 bg-surface-container-low/60 hover:bg-surface-container-low focus:bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline rounded-lg outline-none transition-all shadow-inner focus:shadow-sm ring-1 ring-transparent focus:ring-emerald-500/40"
            />
          </div>

          {/* Category Filter Dropdown - Bộ lọc danh mục sản phẩm */}
          <div className="relative min-w-[210px]">
            <MaterialSymbol
              name="category"
              size="[18px]"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none w-full h-10 pl-9 pr-8 bg-surface-container-low/60 hover:bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg outline-none cursor-pointer border border-outline-variant/20 focus:border-emerald-500"
            >
              <option value="">Tất cả danh mục sản phẩm</option>
              {allDisplayCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <MaterialSymbol
              name="expand_more"
              size="[18px]"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
          </div>

          {/* Stock / Price Sort Dropdown */}
          <div className="relative min-w-[190px]">
            <select
              value={stockSort}
              onChange={(e) => setStockSort(e.target.value)}
              className="appearance-none w-full h-10 px-3 pr-8 bg-surface-container-low/60 hover:bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg outline-none cursor-pointer border border-outline-variant/20 focus:border-emerald-500"
            >
              <option value="">Lọc theo: Mặc định</option>
              <option value="low-stock">Tồn kho &lt; 10 (Cảnh báo)</option>
              <option value="out-of-stock">Tồn kho = 0 (Hết hàng)</option>
              <option value="high-stock">Tồn dồi dào (&gt; 100)</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
            <MaterialSymbol
              name="expand_more"
              size="[18px]"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
          </div>

          {/* Xóa bộ lọc (icon close - chỉ giữ duy nhất 1 nút Làm mới trên header) */}
          {(searchTerm || stockSort || selectedCategory) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStockSort("");
                setSelectedCategory("");
              }}
              className="inline-flex items-center gap-1 h-10 px-3 rounded-lg text-secondary hover:text-red-600 hover:bg-red-50 transition-colors font-body-md text-body-sm cursor-pointer"
              title="Xóa tất cả bộ lọc đang chọn"
            >
              <MaterialSymbol name="close" size="[16px]" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-secondary font-label-md text-label-md">
          <span className="px-2.5 py-1 rounded-lg bg-surface-container-low">
            Hiển thị {filteredProducts.length} sản phẩm
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center justify-between border border-error/20">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleReload}
            className="px-3 py-1 rounded bg-error text-white font-semibold text-sm hover:bg-error/90"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Products Table Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden relative">
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-100/50 overflow-hidden z-20">
            <div className="h-full bg-emerald-600 animate-pulse w-full"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-11 bg-surface-container-low/70 font-label-sm text-label-sm text-secondary uppercase tracking-wider select-none border-b border-outline-variant/30">
                <th className="px-space-md min-w-[340px]">Sản phẩm & SPU</th>
                <th className="px-space-md min-w-[130px]">Biến thể</th>
                <th className="px-space-md min-w-[160px]">Giá niêm yết</th>
                <th className="px-space-md min-w-[110px]">Tồn kho</th>
                <th className="px-space-md min-w-[100px]">Đã bán</th>
                <th className="px-space-md min-w-[130px]">Trạng thái</th>
                <th className="px-space-md w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Đang nạp danh sách sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <MaterialSymbol name="inventory_2" size="[40px]" className="text-outline" />
                      <p className="font-headline-md text-body-lg font-semibold text-on-surface">
                        Không tìm thấy sản phẩm nào
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary max-w-sm">
                        Chưa có sản phẩm nào phù hợp với bộ lọc hiện tại. Hãy tạo sản phẩm mới hoặc đặt lại bộ lọc.
                      </p>
                      <Link
                        href="/seller/products/new"
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
                      >
                        <MaterialSymbol name="add" size="[18px]" />
                        <span>Thêm sản phẩm mới</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isExpanded = expandedRowIds.has(product.id);
                  const isDetailLoading = loadingDetails[product.id];
                  const detail = detailsCache[product.id];

                  return (
                    <React.Fragment key={product.id}>
                      {/* SPU Row */}
                      <tr
                        className={`h-16 transition-colors ${
                          isExpanded ? "bg-emerald-50/20" : "hover:bg-surface-container-low/40"
                        }`}
                      >
                        {/* Sản phẩm & SPU */}
                        <td className="px-space-md py-2">
                          <div className="flex items-center gap-space-sm">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 shadow-sm border border-outline-variant/30">
                              {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-secondary bg-surface-container-low">
                                  <MaterialSymbol name="inventory_2" size="[20px]" />
                                </div>
                              )}
                              <span className="absolute bottom-0 right-0 bg-emerald-600 text-[9px] text-white font-bold px-1 rounded-tl">
                                SPU
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-headline-md text-body-md text-on-surface font-semibold truncate hover:text-emerald-700 cursor-pointer">
                                {product.name}
                              </span>
                              <div className="flex items-center gap-2 font-body-sm text-body-sm text-secondary">
                                <span>Mã: #{product.id}</span>
                                <span>•</span>
                                <span className="text-secondary/80">
                                  {product.categoryName || "Chung"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phân loại / Biến thể expand button */}
                        <td className="px-space-md">
                          <button
                            type="button"
                            onClick={() => toggleExpandRow(product.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors border border-outline-variant/20"
                          >
                            <span>Xem SKU</span>
                            <MaterialSymbol
                              name="expand_circle_down"
                              size="[16px]"
                              className={`text-emerald-600 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>

                        {/* Giá niêm yết */}
                        <td className="px-space-md font-data-tabular text-body-md text-on-surface font-semibold tracking-tight">
                          {product.minPrice === product.maxPrice
                            ? formatVND(product.minPrice)
                            : `${formatVND(product.minPrice)} – ${formatVND(product.maxPrice)}`}
                        </td>

                        {/* Tồn kho */}
                        <td className="px-space-md">
                          <div className="flex items-center gap-1.5 font-data-tabular text-body-md text-on-surface font-semibold">
                            <span>{product.totalStock}</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                product.totalStock <= 0
                                  ? "bg-rose-500"
                                  : product.totalStock < 10
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                          </div>
                        </td>

                        {/* Đã bán */}
                        <td className="px-space-md font-data-tabular text-body-md text-secondary">
                          {(product.totalSold ?? 0).toLocaleString("vi-VN")}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-space-md">
                          <SellerStatusBadge status={product.status} />
                        </td>

                        {/* Thao tác */}
                        <td className="px-space-md text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Nút sửa */}
                            {isBanned ? (
                              <button
                                type="button"
                                onClick={() => toast.error("Gian hàng đang bị khóa, không thể chỉnh sửa sản phẩm!")}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-500 cursor-not-allowed flex items-center justify-center transition-colors"
                                title="Gian hàng bị khóa - Không thể sửa"
                              >
                                <MaterialSymbol name="lock" size="[18px]" />
                              </button>
                            ) : (
                              <Link
                                href={`/seller/products/${product.id}/edit`}
                                className="w-8 h-8 rounded-lg hover:bg-surface-container text-secondary hover:text-emerald-700 flex items-center justify-center transition-colors"
                                title="Chỉnh sửa sản phẩm"
                              >
                                <MaterialSymbol name="edit" size="[18px]" />
                              </Link>
                            )}

                            {/* Nút bật/tắt active */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(product)}
                              disabled={isBanned}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isBanned
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "hover:bg-surface-container text-secondary hover:text-on-surface"
                              }`}
                              title={
                                isBanned
                                  ? "Gian hàng bị khóa - Không thể đổi trạng thái"
                                  : product.status === "ACTIVE"
                                  ? "Tạm ẩn sản phẩm"
                                  : "Mở bán lại"
                              }
                            >
                              <MaterialSymbol
                                name={product.status === "ACTIVE" ? "visibility_off" : "visibility"}
                                size="[18px]"
                              />
                            </button>

                            {/* Nút xóa */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isBanned) {
                                  toast.error("Gian hàng đang bị khóa, không thể xóa sản phẩm!");
                                  return;
                                }
                                setDeleteModalProduct(product);
                              }}
                              disabled={isBanned}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isBanned
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "hover:bg-rose-50 text-secondary hover:text-rose-600"
                              }`}
                              title={isBanned ? "Gian hàng bị khóa - Không thể xóa" : "Xóa sản phẩm"}
                            >
                              <MaterialSymbol name="delete" size="[18px]" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-table: SKU Matrix */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-outline-variant/30">
                            <div className="bg-surface-container-low/40 p-space-md pl-12">
                              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md space-y-space-sm border border-outline-variant/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MaterialSymbol
                                      name="subdirectory_arrow_right"
                                      size="[18px]"
                                      className="text-emerald-600"
                                    />
                                    <span className="font-headline-md text-body-sm text-on-surface font-semibold">
                                      Danh sách biến thể phân loại (SKU Matrix)
                                    </span>
                                  </div>
                                  <span className="text-xs text-secondary">
                                    {detail?.variants.length || 0} biến thể được cấu hình
                                  </span>
                                </div>

                                {isDetailLoading ? (
                                  <div className="py-6 text-center text-sm text-secondary">
                                    Đang nạp chi tiết biến thể SKU...
                                  </div>
                                ) : detail && detail.variants.length > 0 ? (
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="h-9 bg-surface-container-low font-label-sm text-label-sm text-secondary uppercase border-b border-outline-variant/20">
                                        <th className="px-3 py-1">Mã SKU</th>
                                        <th className="px-3 py-1">Thuộc tính</th>
                                        <th className="px-3 py-1">Giá bán</th>
                                        <th className="px-3 py-1">Tồn kho (Sửa nhanh)</th>
                                        <th className="px-3 py-1 text-right">Trạng thái</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container">
                                      {detail.variants.map((v) => (
                                        <tr key={v.id} className="h-10 hover:bg-surface-container-low/30">
                                          <td className="px-3 font-mono text-body-sm font-semibold text-on-surface">
                                            {v.sku || v.skuCode || `#${v.id}`}
                                          </td>
                                          <td className="px-3 text-body-sm text-secondary">
                                            {v.attributes
                                              ? Object.entries(v.attributes)
                                                  .map(([k, val]) => `${k}: ${val}`)
                                                  .join(" · ")
                                              : "Mặc định"}
                                          </td>
                                          <td className="px-3 font-data-tabular text-body-sm font-semibold text-on-surface">
                                            {formatVND(v.salePrice || v.originalPrice)}
                                          </td>
                                          <td className="px-3 font-data-tabular text-body-sm text-on-surface">
                                            <div className="flex items-center gap-1.5">
                                              <input
                                                type="number"
                                                min={0}
                                                value={
                                                  editingStock[v.id] !== undefined
                                                    ? editingStock[v.id]
                                                    : v.stockQuantity
                                                }
                                                onChange={(e) => {
                                                  const val = parseInt(e.target.value, 10);
                                                  setEditingStock((prev) => ({
                                                    ...prev,
                                                    [v.id]: isNaN(val) ? 0 : Math.max(0, val),
                                                  }));
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const targetStock =
                                                      editingStock[v.id] !== undefined
                                                        ? editingStock[v.id]
                                                        : v.stockQuantity;
                                                    void handleSaveStock(
                                                      product.id,
                                                      v.id,
                                                      targetStock,
                                                      v.skuCode
                                                    );
                                                  }
                                                }}
                                                disabled={isBanned || isSavingStock[v.id]}
                                                className={`w-20 h-8 px-2 py-1 text-center font-data-tabular text-body-sm font-semibold rounded-md border transition-all outline-none ${
                                                  editingStock[v.id] !== undefined &&
                                                  editingStock[v.id] !== v.stockQuantity
                                                    ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-900"
                                                    : "border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:border-outline"
                                                }`}
                                                title="Nhập số lượng tồn kho mới và bấm Lưu hoặc nhấn Enter"
                                              />
                                              {editingStock[v.id] !== undefined &&
                                              editingStock[v.id] !== v.stockQuantity ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleSaveStock(
                                                      product.id,
                                                      v.id,
                                                      editingStock[v.id],
                                                      v.skuCode
                                                    )
                                                  }
                                                  disabled={isSavingStock[v.id]}
                                                  className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
                                                  title="Lưu số lượng tồn kho (Enter)"
                                                >
                                                  {isSavingStock[v.id] ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                  ) : (
                                                    <MaterialSymbol name="check" size="[18px]" />
                                                  )}
                                                </button>
                                              ) : null}
                                            </div>
                                          </td>
                                          <td className="px-3 text-right">
                                            <SellerStatusBadge status={v.status} />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="py-4 text-center text-sm text-secondary">
                                    Sản phẩm này chưa có biến thể SKU riêng biệt.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pageData && pageData.totalPages > 1 && (
          <div className="p-space-md border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-secondary font-body-sm">
                Trang {page + 1} / {pageData.totalPages} ({pageData.totalElements} sản phẩm)
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="px-2 py-1 rounded bg-surface-container-low text-xs border border-outline-variant/30 text-secondary"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
              >
                Trước
              </button>

              {Array.from({ length: Math.min(5, pageData.totalPages) }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-body-sm font-semibold transition-colors ${
                    page === i
                      ? "bg-emerald-600 text-white"
                      : "hover:bg-surface-container-low text-secondary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= pageData.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <MaterialSymbol name="warning" size="[24px]" />
              </div>
              <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">
                Xác nhận xóa sản phẩm?
              </h3>
            </div>

            <p className="font-body-md text-body-sm text-secondary">
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <span className="font-semibold text-on-surface">
                &ldquo;{deleteModalProduct.name}&rdquo;
              </span>
              ? Thao tác này sẽ gỡ bỏ sản phẩm khỏi sàn và chuyển trạng thái lưu trữ.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant/30 text-secondary hover:bg-surface-container-low font-label-md text-body-sm font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-label-md text-body-sm font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isDeleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-secondary">Đang tải danh sách sản phẩm...</div>}>
      <SellerProductsContent />
    </Suspense>
  );
}
