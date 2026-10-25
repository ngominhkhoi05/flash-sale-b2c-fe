"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useImageSearchStore } from "@/stores/image-search.store";
import { searchByImageFile, searchByImageUrl } from "@/features/search";

interface ImageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageSearchModal({ open, onOpenChange }: ImageSearchModalProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const [tab, setTab] = React.useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = React.useState("");
  const [dragActive, setDragActive] = React.useState(false);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);

  const {
    isLoading,
    error,
    setLoading,
    setError,
    setResult,
    setImagePreviewUrl,
  } = useImageSearchStore();

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh hợp lệ (.jpg, .png, .webp)");
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setImagePreviewUrl(preview);
    setLoading(true);

    try {
      const data = await searchByImageFile(file, 24);
      setResult(data);
      onOpenChange(false);
      router.push("/search/image");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể nhận diện hình ảnh");
    }
  };

  const handleProcessUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Vui lòng nhập đường dẫn ảnh hợp lệ");
      return;
    }

    setLocalPreview(trimmed);
    setImagePreviewUrl(trimmed);
    setLoading(true);

    try {
      const data = await searchByImageUrl(trimmed, 24);
      setResult(data);
      onOpenChange(false);
      router.push("/search/image");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải hoặc nhận diện ảnh từ URL");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setLocalPreview(null);
    setUrlInput("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2 text-title-md font-bold text-on-surface">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <MaterialSymbol name="photo_camera" size="lg" />
            </span>
            Tìm kiếm bằng hình ảnh
          </DialogTitle>
          <p className="text-body-sm text-on-surface-variant">
            Tìm kiếm các sản phẩm tương tự trên sàn với công nghệ AI thị giác
          </p>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b border-surface-container-high mb-4">
          <button
            type="button"
            onClick={() => { setTab("upload"); handleReset(); }}
            className={`flex-1 py-2 text-body-sm font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === "upload"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <MaterialSymbol name="file_upload" size="base" />
            Tải ảnh lên
          </button>
          <button
            type="button"
            onClick={() => { setTab("url"); handleReset(); }}
            className={`flex-1 py-2 text-body-sm font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === "url"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <MaterialSymbol name="link" size="base" />
            Dán link ảnh
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-3 p-3 bg-error/10 border border-error/30 text-error rounded-xl text-body-sm flex items-start gap-2">
            <MaterialSymbol name="error" size="base" className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading overlay with radar pulse */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-primary animate-spin border-t-transparent" />
              <MaterialSymbol name="auto_awesome" size="xl" className="text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-title-sm font-bold text-on-surface">Đang phân tích hình ảnh qua AI...</p>
              <p className="text-body-xs text-on-surface-variant mt-1">Đang so khớp kiểu dáng và đặc trưng với sản phẩm</p>
            </div>
            {localPreview && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-outline-variant shadow-sm mt-2">
                <Image src={localPreview} alt="Preview" fill className="object-cover" unoptimized />
              </div>
            )}
          </div>
        ) : (
          <>
            {tab === "upload" && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant bg-surface-container-low/50 hover:bg-surface-container-low"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <MaterialSymbol name="upload" size="xl" />
                </div>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">
                    Kéo thả ảnh vào đây hoặc
                  </p>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    Hỗ trợ định dạng JPG, PNG, WebP (tối đa 5MB)
                  </p>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <MaterialSymbol name="add_photo_alternate" size="base" />
                    Chọn ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-2 bg-surface-container-high text-on-surface rounded-lg text-label-md font-bold hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
                  >
                    <MaterialSymbol name="photo_camera" size="base" />
                    Chụp ảnh
                  </button>
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                  }}
                />
              </div>
            )}

            {tab === "url" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1.5">
                    Đường dẫn hình ảnh (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleProcessUrl}
                      disabled={!urlInput.trim()}
                      className="px-4 h-10 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                      <MaterialSymbol name="search" size="base" />
                      Tìm
                    </button>
                  </div>
                </div>
                <p className="text-body-xs text-on-surface-variant">
                  * Mẹo: Bạn có thể sao chép địa chỉ hình ảnh từ bất kỳ trang web nào (nhấp chuột phải vào ảnh chọn &quot;Sao chép địa chỉ hình ảnh&quot;).
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
