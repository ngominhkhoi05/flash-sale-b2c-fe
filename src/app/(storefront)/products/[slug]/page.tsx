/**
 * Trang Product Detail – dynamic route `/products/[slug]` (Stitch `31bc6af5`).
 *
 * Server Component:
 *   - Await `params` (Next 16 — params là Promise).
 *   - Tra cứu mock data theo slug.
 *   - Nếu không tồn tại → gọi `notFound()` để Next render `not-found.tsx`.
 *   - Nếu có → render `<ProductDetailPage />` (Client Component orchestrator).
 *
 * Khi BE ready Phase 1, sẽ thay `mockProductsBySlug[slug]` bằng
 * `useProductDetail(slug)` ở client wrapper — hiện vẫn đang mock.
 */
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import { mockProductsBySlug } from "@/features/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailRoute({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = mockProductsBySlug[slug];

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} />;
}