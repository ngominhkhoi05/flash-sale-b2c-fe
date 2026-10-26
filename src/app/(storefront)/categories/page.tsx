"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Grid3X3, 
  Search, 
  ChevronRight, 
  Sparkles, 
  Shirt, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Armchair, 
  HeartHandshake, 
  Baby, 
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import { fetchCategories, type CategoryResponse } from "@/features/homepage/api";

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

const CATEGORY_GRADIENTS: Record<string, string> = {
  "thoi-trang-nam": "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200",
  "thoi-trang-nu": "from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-200",
  "dien-thoai": "from-sky-500/10 to-cyan-500/10 text-sky-600 border-sky-200",
  "laptop": "from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200",
  "tai-nghe": "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200",
  "noi-that": "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200",
  "lam-dep": "from-pink-500/10 to-fuchsia-500/10 text-pink-600 border-pink-200",
  "me-va-be": "from-yellow-500/10 to-amber-500/10 text-amber-600 border-yellow-200",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchCategories()
      .then((data) => {
        if (mounted) {
          setCategories(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh mục:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }, [categories, searchTerm]);

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16">
      {/* Hero Banner Header */}
      <section className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white py-12 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-sky-200 mb-4 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">Tất cả ngành hàng</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold uppercase tracking-wider text-sky-200 mb-3 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" /> Khám phá mua sắm Vibe Mart
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Tất Cả Danh Mục Ngành Hàng
              </h1>
              <p className="mt-2 text-sm sm:text-base text-sky-100 max-w-2xl leading-relaxed">
                Khám phá hàng ngàn sản phẩm chính hãng với mức giá flash sale ưu đãi nhất, được phân loại rõ ràng theo từng nhu cầu của bạn.
              </p>
            </div>

            {/* Quick search input */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm ngành hàng..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
              <Grid3X3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {searchTerm ? `Kết quả tìm kiếm (${filteredCategories.length})` : `Danh sách ngành hàng (${categories.length})`}
            </h2>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-44 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredCategories.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy danh mục phù hợp</h3>
            <p className="text-sm text-slate-500 mt-1">
              Thử từ khoá khác hoặc xoá bộ lọc tìm kiếm để xem tất cả ngành hàng.
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
              >
                Xoá tìm kiếm
              </button>
            )}
          </div>
        )}

        {/* Categories Grid */}
        {!isLoading && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredCategories.map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.slug] || ShoppingBag;
              const colorClass = CATEGORY_GRADIENTS[cat.slug] || "from-sky-500/10 to-indigo-500/10 text-sky-600 border-sky-200";

              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-sky-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center border group-hover:scale-105 transition-transform duration-200`}>
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        Phí sàn {cat.commissionRate}%
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description || "Khám phá các sản phẩm nổi bật thuộc danh mục này trên sàn Vibe Mart."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                    <span>Xem sản phẩm</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
