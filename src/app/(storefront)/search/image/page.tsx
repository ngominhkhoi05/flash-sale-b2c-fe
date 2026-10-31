"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ProductCard } from "@/components/storefront/ProductCard";
import { mapToProductCardProps } from "@/features/products/map-to-product-card";
import { ImageSearchModal } from "@/components/storefront/search/ImageSearchModal";
import { useImageSearchStore } from "@/stores/image-search.store";
import { ROUTES } from "@/lib/constants";

export default function ImageSearchPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const { imagePreviewUrl, result, isLoading, error } = useImageSearchStore();

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const duration = result?.searchDurationMs ?? 0;

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-16">
      {/* ── Breadcrumb & Top bar ────────────────────────────────────────── */}
      <div className="border-b border-surface-container-low bg-surface-container-lowest">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-5 py-3">
          <nav className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
            <Link href={ROUTES.HOME} className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <MaterialSymbol name="chevron_right" size="sm" />
            <Link href={ROUTES.SEARCH} className="hover:text-primary transition-colors">
              Tìm kiếm
            </Link>
            <MaterialSymbol name="chevron_right" size="sm" />
            <span className="font-semibold text-on-surface">Tìm kiếm bằng hình ảnh</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 lg:px-5 pt-6 space-y-6">
        {/* ── Visual Search Banner Header ─────────────────────────────── */}
        <div className="rounded-2xl border border-outline-variant bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-low p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {imagePreviewUrl ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-primary/30 shadow-md shrink-0 bg-surface-container">
                  <Image
                    src={imagePreviewUrl}
                    alt="Ảnh đang tìm kiếm"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MaterialSymbol name="photo_camera" size="2xl" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-title-lg sm:text-headline-sm font-bold text-on-surface">
                    Kết quả tìm kiếm bằng hình ảnh
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-bold flex items-center gap-1">
                    <MaterialSymbol name="auto_awesome" size="xs" />
                    AI Vision
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {imagePreviewUrl ? (
                    <>
                      Tìm thấy <strong className="text-on-surface font-bold">{total}</strong> sản phẩm tương tự
                      {duration > 0 && <span className="text-outline"> ({duration}ms)</span>}
                    </>
                  ) : (
                    "Tải lên hoặc chụp ảnh sản phẩm để tìm kiếm các mặt hàng tương tự trên Vibe Mart"
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm shrink-0"
            >
              <MaterialSymbol name="photo_camera" size="base" />
              {imagePreviewUrl ? "Tìm ảnh khác" : "Chọn ảnh tìm kiếm"}
            </button>
          </div>
        </div>

        {/* ── Error State ─────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/30 text-error rounded-xl text-body-sm flex items-center gap-3">
            <MaterialSymbol name="error" size="lg" className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Loading Skeleton ────────────────────────────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex h-full flex-col gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3.5 shadow-sm"
              >
                <div className="aspect-square w-full rounded-lg bg-surface-container-high animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-surface-container-high animate-pulse mt-2" />
                <div className="h-4 w-1/2 rounded bg-surface-container-high animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-surface-container-high animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ─────────────────────────────────────────────── */}
        {!isLoading && items.length === 0 && (
          <div className="text-center py-16 px-4 bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center">
              <MaterialSymbol name="search_off" size="2xl" />
            </div>
            <div className="max-w-md">
              <h2 className="text-title-md font-bold text-on-surface">
                {imagePreviewUrl
                  ? "Không tìm thấy sản phẩm có độ khớp cao"
                  : "Chưa có ảnh nào được chọn"}
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1.5">
                {imagePreviewUrl
                  ? "Hãy thử tìm kiếm với góc chụp rõ nét hơn hoặc cắt bớt chi tiết thừa xung quanh vật thể."
                  : "Hãy tải lên hoặc dán đường dẫn ảnh sản phẩm bạn muốn tìm kiếm."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <MaterialSymbol name="file_upload" size="base" />
              {imagePreviewUrl ? "Thử ảnh khác" : "Tải ảnh ngay"}
            </button>
          </div>
        )}

        {/* ── Results Grid ────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
              <span>Sắp xếp theo độ tương đồng cao nhất</span>
              <span className="text-body-xs bg-surface-container-high px-2.5 py-1 rounded-md">
                Chỉ hiển thị các sản phẩm có độ khớp &ge; 62%
              </span>
            </div>

            <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
              {items.map((item) => {
                const cardProps = mapToProductCardProps(item.product);
                const percentMatch = Math.round(item.similarityScore * 100);

                return (
                  <div key={item.product.id} className="relative group">
                    {/* Badge % Khớp */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                      <MaterialSymbol name="auto_awesome" size="[12px]" className="text-amber-400" />
                      <span>Khớp {percentMatch}%</span>
                    </div>

                    <Link
                      href={ROUTES.PRODUCT_DETAIL(String(item.product.id))}
                      className="block h-full transition-transform duration-200 group-hover:-translate-y-1"
                    >
                      <ProductCard variant="default" {...cardProps} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ImageSearchModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
