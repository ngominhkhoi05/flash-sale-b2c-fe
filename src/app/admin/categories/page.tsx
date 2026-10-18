"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type AdminCategoryItem,
} from "@/lib/api/admin";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<AdminCategoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCommission, setFormCommission] = useState(5.0);
  const [formDescription, setFormDescription] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const selectCategory = useCallback((cat: AdminCategoryItem) => {
    setIsCreatingNew(false);
    setSelectedCat(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormCommission(cat.commissionRate ? Number((cat.commissionRate * 100).toFixed(1)) : 5.0);
    setFormDescription(cat.description || "");
    setFeedbackMsg(null);
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await getAdminCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCat((prev) => {
          if (prev) return prev;
          selectCategory(data[0]);
          return data[0];
        });
      }
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectCategory]);

  useEffect(() => {
    let isMounted = true;
    getAdminCategories()
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          if (data.length > 0) {
            setSelectedCat((prev) => {
              if (prev) return prev;
              selectCategory(data[0]);
              return data[0];
            });
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh mục:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectCategory]);


  function handleAddNew() {
    setIsCreatingNew(true);
    setSelectedCat(null);
    setFormName("");
    setFormSlug("");
    setFormCommission(5.0);
    setFormDescription("");
    setFeedbackMsg(null);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      alert("Vui lòng điền đầy đủ tên danh mục và slug!");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim(),
        commissionRate: formCommission / 100,
        description: formDescription.trim(),
      };

      if (isCreatingNew) {
        const created = await createAdminCategory(payload);
        setFeedbackMsg("Tạo mới danh mục thành công!");
        await refreshCategories();
        selectCategory(created);
      } else if (selectedCat) {
        await updateAdminCategory(selectedCat.id, payload);
        setFeedbackMsg("Cập nhật danh mục thành công!");
        await refreshCategories();
      }
    } catch (err) {
      alert("Lỗi lưu danh mục: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedCat) return;
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${selectedCat.name}" không?`)) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteAdminCategory(selectedCat.id);
      alert("Xóa danh mục thành công!");
      setSelectedCat(null);
      await refreshCategories();
    } catch (err) {
      alert("Lỗi xóa danh mục: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
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
              <div className="p-8 text-center text-secondary text-sm">Đang tải danh mục...</div>
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

          {feedbackMsg && (
            <div className="p-3 rounded-lg bg-primary-fixed text-on-primary-fixed-variant text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{feedbackMsg}</span>
            </div>
          )}

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
              <label className="font-label-md text-xs font-semibold text-on-surface flex items-center gap-1">
                <span>Đường dẫn chuẩn hóa (Slug URL)</span>
                <span className="text-tertiary">*</span>
              </label>
              <div className="flex items-center rounded-lg bg-surface-container-low shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                <span className="px-3 py-2 bg-surface-container text-xs text-secondary select-none">
                  https://vibemart.vn/category/
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
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-space-md py-2.5 rounded-lg text-tertiary hover:bg-error-container/40 text-xs font-semibold transition-colors disabled:opacity-50"
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
    </div>
  );
}
