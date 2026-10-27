/**
 * Product Detail Page - Server Component route.
 *
 * /products/[slug] - Hiển thị chi tiết sản phẩm với Stitch pixel-perfect layout.
 *
 * Data flow (backend API):
 *   1. Get `slug` from async params (Next 16).
 *   2. Nếu slug là numeric id → gọi `GET /api/v1/products/{id}` để resolve slug SEO → redirect.
 *   3. Nếu slug không phải số → gọi `GET /api/v1/products/slug/{slug}` → render.
 *   4. 404 khi API trả NOT_FOUND → render not-found page.
 *   5. Lỗi kết nối mạng / máy chủ không phản hồi → render ServerConnectionError.
 *
 * Xem plan: docs/superpowers/plans/2026-10-12-product-detail-page-stitch.md
 *           docs/superpowers/plans/2026-10-14-product-detail-api.md
 *
 * Note: Header/Footer/MobileBottomNav đã có trong layout cha (storefront/layout.tsx)
 */
import { notFound, redirect } from "next/navigation";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import { ServerConnectionError } from "@/components/common/ServerConnectionError";
import {
  fetchProductDetailById,
  fetchProductDetailBySlug,
  type ProductDetail,
} from "@/features/products";
import { ApiError } from "@/lib/api";
import { setRequestLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailRoute({ params }: PageProps) {
  const { slug } = await params;

  // Locale for static rendering
  setRequestLocale("vi");

  // Tách fetch ra ngoài try/catch để tránh "JSX in try/catch" warning.
  const result = await loadProduct(slug);

  if (result.type === "notFound") {
    notFound();
  }
  if (result.type === "redirect") {
    // loadProduct đã throw NEXT_REDIRECT, code không tới đây.
    return null;
  }
  if (result.type === "networkError") {
    return (
      <main className="py-8 md:py-16">
        <ServerConnectionError
          title="Không thể kết nối đến máy chủ"
          message={
            result.message ||
            "Không thể tải thông tin sản phẩm do mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng kiểm tra lại đường truyền và thử lại."
          }
        />
      </main>
    );
  }

  return (
    <main className="pt-4 md:pt-6">
      <ProductDetailPage product={result.data} />
    </main>
  );
}

type LoadResult =
  | { type: "success"; data: ProductDetail }
  | { type: "redirect" }
  | { type: "notFound" }
  | { type: "networkError"; message?: string };

async function loadProduct(slug: string): Promise<LoadResult> {
  try {
    // Trường hợp 1: slug là numeric id → resolve sang slug SEO và redirect.
    if (/^\d+$/.test(slug)) {
      const id = Number(slug);
      const product = await fetchProductDetailById(id);
      redirect(`/products/${product.slug}`);
      return { type: "redirect" }; // unreachable, redirect() throws
    }

    // Trường hợp 2: slug SEO → fetch chi tiết.
    const product = await fetchProductDetailBySlug(slug);
    return { type: "success", data: product };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        return { type: "notFound" };
      }
      if (err.code === "NETWORK_ERROR" || err.status === 0) {
        return {
          type: "networkError",
          message: "Mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng thử lại sau.",
        };
      }
    }
    if (err instanceof TypeError && err.message.toLowerCase().includes("fetch failed")) {
      return {
        type: "networkError",
        message: "Mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng thử lại sau.",
      };
    }
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  if (/^\d+$/.test(slug)) {
    return { title: "Đang chuyển hướng..." };
  }

  try {
    const product = await fetchProductDetailBySlug(slug);
    return {
      title: product.name,
      description: product.description.slice(0, 160),
    };
  } catch {
    return { title: "Không tìm thấy sản phẩm" };
  }
}
