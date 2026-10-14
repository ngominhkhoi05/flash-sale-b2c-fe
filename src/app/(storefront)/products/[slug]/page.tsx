/**
 * Product Detail Page - Server Component route.
 *
 * /products/[slug] - Hiển thị chi tiết sản phẩm với Stitch pixel-perfect layout.
 *
 * Data flow (mock phase):
 *   1. Get `slug` from async params (Next 16).
 *   2. Fetch product detail via mock (sẽ replace bằng BE API khi ready).
 *   3. Render <ProductDetailPage> (Client Component) với mock data.
 *
 * Xem plan: docs/superpowers/plans/2026-10-12-product-detail-page-stitch.md
 *
 * Note: Header/Footer/MobileBottomNav đã có trong layout cha (storefront/layout.tsx)
 */
import { notFound, redirect } from "next/navigation";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import {
  mockProductDetail,
  mockProductIdToSlug,
  mockProductsBySlug,
} from "@/features/products";
import { setRequestLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailRoute({ params }: PageProps) {
  const { slug } = await params;

  // Locale for static rendering
  setRequestLocale("vi");

  // Nếu người dùng truy cập /products/<id> (numeric), redirect sang slug SEO
  if (/^\d+$/.test(slug)) {
    const id = Number(slug);
    const realSlug = mockProductIdToSlug[id];
    if (realSlug) {
      redirect(`/products/${realSlug}`);
    }
    notFound();
  }

  // Mock data lookup - in production sẽ gọi API
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
  if (/^\d+$/.test(slug)) {
    return { title: "Đang chuyển hướng..." };
  }
  const product = mockProductsBySlug[slug];
  if (!product) {
    return { title: "Không tìm thấy sản phẩm" };
  }
  return {
    title: `${product.name} | Vibe Mart`,
    description: product.description.slice(0, 160),
  };
}
