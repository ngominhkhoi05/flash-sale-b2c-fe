"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type AdminCategoryItem,
} from "@/lib/api/admin";
import { useAdminCategoriesQuery, ADMIN_QUERY_KEYS } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";

interface DeleteCategoryModalState {
  isOpen: boolean;
  category: AdminCategoryItem | null;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: rawCategories = [], isLoading, refetch } = useAdminCategoriesQuery();

  const [localCategories, setLocalCategories] = useState<AdminCategoryItem[] | null>(null);
  const categories = localCategories ?? rawCategories;

  const [selectedCat, setSelectedCat] = useState<AdminCategoryItem | null>(() => {
    return rawCategories.length > 0 ? rawCategories[0] : null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const isSaving = false;
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCommission, setFormCommission] = useState(5.0);
  const [formDescription, setFormDescription] = useState("");

  // Modal xác nhận xóa
  const [deleteModal, setDeleteModal] = useState<DeleteCategoryModalState>({
    isOpen: false,
    category: null,
  });

  const selectCategory = useCallback((cat: AdminCategoryItem) => {
    setIsCreatingNew(false);
    setSelectedCat(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormCommission(cat.commissionRate ? Number((cat.commissionRate * 100).toFixed(1)) : 5.0);
    setFormDescription(cat.description || "");
  }, []);

  // Tự động chọn danh mục đầu tiên khi categories nạp xong
  useEffect(() => {
    if (categories.length > 0 && !selectedCat && !isCreatingNew) {
      selectCategory(categories[0]);
    }
  }, [categories, selectedCat, isCreatingNew, selectCategory]);

  useEffect(() => {
    setLocalCategories(null);
  }, [rawCategories]);


  function handleAddNew() {
    setIsCreatingNew(true);
    setSelectedCat(null);
    setFormName("");
    setFormSlug("");
    setFormCommission(5.0);
    setFormDescription("");
  }

  function handleNameChange(val: string) {
    setFormName(val);
    if (isCreatingNew) {
      // Auto-generate slug
      const generatedSlug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setFormSlug(generatedSlug);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      toast.error("Vui lòng điền đầy đủ tên danh mục và slug!");
      return;
    }

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim(),
      commissionRate: formCommission / 100,
      description: formDescription.trim(),
    };

    if (isCreatingNew) {
      // 1. Phản hồi Toast NGAY LẬP TỨC (0ms)
      toast.success(`Đã tạo mới ngành hàng "${payload.name}" thành công!`);

      // 2. Cập nhật Optimistic UI ngay lập tức (0ms)
      const tempId = Date.now();
      const optimisticCat: AdminCategoryItem = {
        id: tempId,
        name: payload.name,
        slug: payload.slug,
        commissionRate: payload.commissionRate,
        description: payload.description,
        productCount: 0,
      };

      setLocalCategories((prev) => {
        const base = prev ?? rawCategories;
        return [optimisticCat, ...base];
      });
      selectCategory(optimisticCat);

      // 3. Đồng bộ ngầm với máy chủ BE
      createAdminCategory(payload)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories });
        })
        .catch((err) => {
          console.error("Lỗi lưu danh mục máy chủ:", err);
          toast.error("Lỗi đồng bộ máy chủ: " + (err instanceof Error ? err.message : String(err)));
          void refetch();
        });
    } else if (selectedCat) {
      const targetId = selectedCat.id;

      // 1. Phản hồi Toast NGAY LẬP TỨC (0ms)
      toast.success(`Đã cập nhật ngành hàng "${payload.name}" thành công!`);

      // 2. Cập nhật Optimistic UI ngay lập tức (0ms)
      const updatedCat: AdminCategoryItem = {
        ...selectedCat,
        name: payload.name,
        slug: payload.slug,
        commissionRate: payload.commissionRate,
        description: payload.description,
      };

      setLocalCategories((prev) => {
        const base = prev ?? rawCategories;
        return base.map((c) => (c.id === targetId ? updatedCat : c));
      });
      setSelectedCat(updatedCat);

      // 3. Đồng bộ ngầm với máy chủ BE
      updateAdminCategory(targetId, payload)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories });
        })
        .catch((err) => {
          console.error("Lỗi cập nhật máy chủ:", err);
          toast.error("Lỗi đồng bộ máy chủ: " + (err instanceof Error ? err.message : String(err)));
          void refetch();
        });
    }
  }

  function openDeleteModal() {
    if (!selectedCat) return;
    setDeleteModal({
      isOpen: true,
      category: selectedCat,
    });
  }

  function confirmDeleteCategory() {
    if (!deleteModal.category) return;
    const target = deleteModal.category;

    // 1. Đóng Modal ngay lập tức (0ms)
    setDeleteModal({ isOpen: false, category: null });

    // 2. Phản hồi Toast NGAY LẬP TỨC (0ms)
    toast.success(`Đã xóa ngành hàng "${target.name}" thành công!`);

    // 3. Cập nhật Optimistic UI ngay lập tức (0ms)
    setLocalCategories((prev) => {
      const base = prev ?? rawCategories;
      const next = base.filter((c) => c.id !== target.id);
      if (next.length > 0) {
        selectCategory(next[0]);
      } else {
        setSelectedCat(null);
        setIsCreatingNew(true);
      }
      return next;
    });

    // 4. Đồng bộ ngầm với máy chủ BE
    deleteAdminCategory(target.id)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories });
      })
      .catch((err) => {
        console.error("Lỗi xóa danh mục máy chủ:", err);
        toast.error("Lỗi xóa danh mục: " + (err instanceof Error ? err.message : String(err)));
        void refetch();
      });
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full gap-space-lg select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Danh mục & Hoa hồng
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-xs bg-primary-fixed text-on-primary-fixed-variant font-semibold">
              Mặc định sàn 5%
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary mt-0.5">
            Quản trị phân cấp ngành hàng và mức trích hoa hồng sàn cho từng loại sản phẩm
          </p>
        </div>
      </div>

      {/* Priority rule banner */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-headline-md text-sm font-bold text-on-surface">
            Thứ tự ưu tiên hoa hồng sàn:
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">
              1. Phiên Flash Sale (Override)
            </span>
            <span className="text-secondary">→</span>
            <span className="px-2 py-1 rounded bg-primary-fixed text-on-primary-fixed-variant font-bold">
              2. Danh mục con (Riêng)
            </span>
            <span className="text-secondary">→</span>
            <span className="px-2 py-1 rounded bg-surface-container text-secondary font-bold">
              3. Mặc định sàn (5%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary bg-surface-container-low px-3 py-1.5 rounded-lg">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          <span>
            Hệ thống tự động áp dụng mức hoa hồng ưu tiên cao nhất tại thời điểm đơn hàng phát sinh.
          </span>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (5 cols / 40%): Category Tree / List */}
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md border border-outline-variant/30">
          <div className="flex flex-col gap-space-sm pb-space-sm border-b border-outline-variant/20">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-base font-bold text-on-surface">
                Cây danh mục
              </h2>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-xs bg-surface-container text-secondary font-semibold">
                {categories.length} ngành hàng
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh danh mục..."
                  className="w-full h-9 pl-8 pr-3 rounded-lg bg-surface-container-low font-body-sm text-sm text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNew}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold transition-colors shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm mới</span>
              </button>
            </div>
          </div>

          {/* List of categories */}
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[600px] pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-secondary text-sm">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <div>Đang tải danh mục...</div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-secondary text-sm">Không tìm thấy danh mục nào</div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = selectedCat?.id === cat.id && !isCreatingNew;
                const ratePercent = cat.commissionRate
                  ? `${(cat.commissionRate * 100).toFixed(0)}%`
                  : "5%";
                const isCustom = cat.commissionRate && cat.commissionRate !== 0.05;

                return (
                  <div
                    key={cat.id}
                    onClick={() => selectCategory(cat)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary-fixed text-primary font-bold shadow-sm"
                        : "hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
                        {isSelected ? "check_circle" : "folder"}
                      </span>
                      <span className="text-sm truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-sm text-xs font-bold ${
                          isCustom
                            ? "bg-tertiary-fixed text-on-tertiary-fixed"
                            : isSelected
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-secondary"
                        }`}
                      >
                        {ratePercent} {isCustom ? "· riêng" : ""}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-outline">
                        chevron_right
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column (7 cols / 60%): Category Detail & Commission Form */}
        <main className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-lg border border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md border-b border-outline-variant/20">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">app_registration</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-lg text-lg font-bold text-on-surface">
                    {isCreatingNew
                      ? "Thêm danh mục mới"
                      : `Chi tiết danh mục: ${selectedCat?.name || ""}`}
                  </h2>
                  {!isCreatingNew && (
                    <span className="px-2 py-0.5 rounded font-label-sm text-xs font-semibold bg-surface-container-high text-primary">
                      Cấp 1
                    </span>
                  )}
                </div>
                {!isCreatingNew && selectedCat && (
                  <span className="font-body-sm text-xs text-secondary">
                    ID: CAT-{selectedCat.id} · Slug: {selectedCat.slug}
                  </span>
                )}
              </div>
            </div>

            {!isCreatingNew && selectedCat && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  inventory_2
                </span>
                <span className="font-bold text-on-surface">
                  {selectedCat.productCount ?? 120}
                </span>{" "}
                sản phẩm
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-space-lg">
            {/* Field 1: Category Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs font-semibold text-on-surface flex items-center gap-1">
                <span>Tên danh mục</span>
                <span className="text-tertiary">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: Thời trang nam, Thiết bị điện tử..."
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
              <span className="font-label-sm text-xs text-secondary">
                Tên hiển thị công khai trên ứng dụng mua sắm
              </span>
            </div>

            {/* Field 2: Slug URL */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-xs font-semibold text-on-surface flex items-center gap-1">
                  <span>Đường dẫn chuẩn hóa (Slug URL)</span>
                  <span className="text-tertiary">*</span>
                </label>
                {formSlug && !isCreatingNew && (
                  <a
                    href={`/categories/${formSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    <span>Xem ngoài sàn</span>
                  </a>
                )}
              </div>
              <div className="flex items-center rounded-lg bg-surface-container-low shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                <span className="px-3 py-2 bg-surface-container text-xs text-secondary select-none">
                  /categories/
                </span>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="thoi-trang-nam"
                  className="flex-1 h-10 px-3 bg-transparent text-sm text-on-surface focus:outline-none font-mono"
                />
              </div>
              <span className="font-label-sm text-xs text-secondary">
                Được lập chỉ mục SEO và liên kết điều hướng sản phẩm
              </span>
            </div>

            {/* Field 3: Description */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs font-semibold text-on-surface">
                Mô tả danh mục
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mô tả ngành hàng cho SEO và hiển thị..."
                className="w-full p-3 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none"
              />
            </div>

            {/* Field 4: Commission Rate */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div className="flex flex-col">
                  <label className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      monetization_on
                    </span>
                    <span>Tỷ lệ hoa hồng chiết khấu (%)</span>
                  </label>
                  <span className="font-body-sm text-xs text-secondary mt-0.5">
                    Thiết lập mức trích phí sàn đối với tất cả đơn hàng thuộc ngành này.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center w-32">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formCommission}
                      onChange={(e) => setFormCommission(parseFloat(e.target.value) || 0)}
                      className="w-full h-11 pl-4 pr-9 rounded-lg bg-surface-container-lowest text-lg font-bold text-primary text-right focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-mono"
                    />
                    <span className="absolute right-3 font-bold text-secondary pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-start gap-2 shadow-sm text-xs text-secondary">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                  help
                </span>
                <span>
                  Nếu là <strong>5.0%</strong>, hệ thống áp dụng mức mặc định sàn. Nếu khác 5%, hệ thống đánh dấu là tỷ lệ riêng ưu tiên cho ngành hàng này.
                </span>
              </div>
            </div>

            {/* Form Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-space-md pt-space-md border-t border-outline-variant/20">
              {!isCreatingNew && selectedCat ? (
                <button
                  type="button"
                  onClick={openDeleteModal}
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-space-md py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/80 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>Xóa danh mục này</span>
                </button>
              ) : (
                <div />
              )}

              <div className="w-full sm:w-auto flex items-center gap-space-sm justify-end">
                {isCreatingNew && (
                  <button
                    type="button"
                    onClick={() => {
                      if (categories.length > 0) selectCategory(categories[0]);
                      else setIsCreatingNew(false);
                    }}
                    className="px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors shadow-sm"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-1.5 px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSaving ? "sync" : "save"}
                  </span>
                  <span>{isSaving ? "Đang lưu..." : isCreatingNew ? "Tạo danh mục" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODAL XÁC NHẬN XÓA DANH MỤC NẰM GIỮA MÀN HÌNH (CENTERED DIALOG) */}
      {/* ============================================================ */}
      {deleteModal.isOpen && deleteModal.category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 flex flex-col gap-4">
            {/* Header Icon + Tiêu đề */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa ngành hàng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thao tác này sẽ gỡ bỏ ngành hàng vĩnh viễn khỏi hệ thống sàn
                </p>
              </div>
            </div>

            {/* Thông tin tóm tắt danh mục */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tên ngành hàng:</span>
                <span className="font-bold text-slate-900">{deleteModal.category.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Đường dẫn slug:</span>
                <span className="font-mono text-slate-700">/categories/{deleteModal.category.slug}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hoa hồng sàn:</span>
                <span className="font-bold text-primary">
                  {deleteModal.category.commissionRate
                    ? `${(deleteModal.category.commissionRate * 100).toFixed(1)}%`
                    : "5.0%"}
                </span>
              </div>
            </div>

            {/* Cảnh báo hậu quả */}
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 flex items-start gap-2 leading-relaxed">
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">
                warning
              </span>
              <span>
                <strong>Lưu ý an toàn:</strong> Nếu danh mục này đang có sản phẩm của người bán liên kết, hệ thống sẽ từ chối xóa để bảo toàn dữ liệu.
              </span>
            </div>

            {/* Nút hành động Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, category: null })}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm disabled:opacity-60 active:scale-95 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
