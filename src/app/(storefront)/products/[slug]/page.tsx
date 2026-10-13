/**
 * Product Detail Page - Server Component route.
 *
 * /products/[slug] - Hiển thị chi tiết sản phẩm với Stitch pixel-perfect layout.
 *
 * Flow:
 *  1. Get `slug` from async params (Next 16).
 *  2. Match slug → find mock product ID (hoặc lookup từ API).
 *  3. Render <ProductDetailPage> (Client Component) với product ID.
 *
 * Backend integration:
 *  - API nhận `id` (number) không phải slug
 *  - Slug → ID lookup dùng local cache (mockProductsBySlug)
 *  - Khi BE bổ sung slug tracking → update slugIdCache
 */
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import { mockProductDetail, mockProductsBySlug } from "@/features/products";
import { setRequestLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailRoute({ params }: PageProps) {
  const { slug } = await params;

  setRequestLocale("vi");

  // Slug → ID mapping
  // Hiện tại: dùng mockProductsBySlug để match slug → ID
  // Khi BE bổ sung slug tracking → thay bằng API lookup
  const product = mockProductsBySlug[slug];

  if (!product) {
    notFound();
  }

  return (
    <main className="pt-4 md:pt-6">
      <ProductDetailPage product={product} />
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = mockProductsBySlug[slug];

  if (!product) {
    return { title: "Không tìm thấy sản phẩm" };
  }

  return {
    title: `${product.name} | Vibe Mart`,
    description: product.description?.slice(0, 160),
  };
}
