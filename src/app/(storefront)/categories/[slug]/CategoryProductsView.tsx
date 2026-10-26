"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Search, 
  ArrowUpDown, 
  ShoppingBag, 
  Shirt, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Armchair, 
  HeartHandshake, 
  Baby, 
  Sparkles,
  ArrowLeft
} from "lucide-react";
import type { CategoryResponse, RecommendedProductResponse } from "@/features/homepage/api";
import { SearchProductGrid } from "@/components/storefront/search/SearchProductGrid";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "thoi-trang-nam": Shirt,
  "thoi-trang-nu": Shirt,
  "dien-thoai": Smartphone,
  "laptop": Laptop,
  "tai-nghe": Headphones,
  "noi-that": Armchair,
  "lam-dep": HeartHandshake,
  "me-va-be": Baby,
};

interface CategoryProductsViewProps {
  category: CategoryResponse;
  initialProducts: RecommendedProductResponse[];
}

export function CategoryProductsView({
  category,
  initialProducts,
}: CategoryProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const IconComponent = CATEGORY_ICONS[category.slug] || ShoppingBag;

  const processedProducts = useMemo(() => {
    let list = [...initialProducts];

    // Filter by keyword
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.storeName.toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.minPrice - a.minPrice);
    }

    return list;
  }, [initialProducts, searchTerm, sortBy]);

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16">
      {/* Category Hero Banner */}
      <section className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white py-10 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-sky-200 mb-4 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/categories" className="hover:text-white transition-colors">Tất cả ngành hàng</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-semibold">{category.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-md">
                <IconComponent className="w-8 h-8 text-sky-200" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-sky-200 mb-1 border border-white/10">
                  <Sparkles className="w-3 h-3" /> Ngành hàng chính hãng
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {category.name}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
                  {category.description || "Khám phá danh sách sản phẩm tuyển chọn với giá ưu đãi hàng đầu."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition border border-white/15"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Xem ngành khác
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* Controls Bar: Search & Sort */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm trong ${category.name}...`}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "price_asc" | "price_desc")}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700">
            Danh sách sản phẩm ({processedProducts.length})
          </h2>
        </div>

        {/* Products Grid or Empty State */}
        {processedProducts.length > 0 ? (
          <SearchProductGrid items={processedProducts} isLoading={false} />
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {searchTerm
                ? "Không tìm thấy sản phẩm nào khớp từ khoá"
                : "Chưa có sản phẩm nào thuộc ngành hàng này"}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm
                ? "Hãy thử tìm với từ khoá khác hoặc xoá bộ lọc tìm kiếm."
                : "Các nhà bán hàng đang cập nhật sản phẩm mới cho danh mục này. Vui lòng quay lại sau."}
            </p>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
              >
                Xoá tìm kiếm
              </button>
            ) : (
              <Link
                href="/categories"
                className="inline-block mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
              >
                Khám phá ngành hàng khác
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
