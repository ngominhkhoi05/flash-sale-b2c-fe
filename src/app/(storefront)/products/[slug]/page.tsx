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
 */
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { MobileBottomNav } from "@/components/storefront/MobileBottomNav";
import { mockProductDetail } from "@/features/products";
import { setRequestLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailRoute({ params }: PageProps) {
  const { slug } = await params;

  // Locale for static rendering
  setRequestLocale("vi");

  // Mock data lookup - in production sẽ gọi API
  // For now: chỉ trả mock khi slug khớp
  if (slug !== mockProductDetail.slug) {
    notFound();
  }

  return (
    <>
      <StorefrontHeader />
      <main className="pt-4 pb-20 md:pt-6">
        <ProductDetailPage product={mockProductDetail} />
      </main>
      <StorefrontFooter />
      <MobileBottomNav />
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (slug !== mockProductDetail.slug) {
    return { title: "Không tìm thấy sản phẩm" };
  }
  return {
    title: `${mockProductDetail.name} | Vibe Mart`,
    description: mockProductDetail.description.slice(0, 160),
  };
}
