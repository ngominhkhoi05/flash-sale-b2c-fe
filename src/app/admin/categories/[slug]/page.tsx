import { redirect } from "next/navigation";

interface AdminCategorySlugPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Route fallback /admin/categories/[slug]
 * Tự động chuyển hướng sang trang ngành hàng storefront (/categories/[slug])
 * để tránh lỗi 404 khi người dùng nhập slug vào sau đường dẫn admin.
 */
export default async function AdminCategorySlugPage({ params }: AdminCategorySlugPageProps) {
  const { slug } = await params;
  redirect(`/categories/${slug}`);
}
