import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { fetchCategoryBySlug, fetchProductsByCategory } from "@/features/homepage/api";
import { CategoryProductsView } from "./CategoryProductsView";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Ngành hàng không tìm thấy | Vibe Mart",
    };
  }

  return {
    title: `${category.name} | Vibe Mart`,
    description: category.description || `Mua sắm sản phẩm ${category.name} chính hãng với giá tốt nhất tại Vibe Mart.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  setRequestLocale("vi");

  const category = await fetchCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const productsPage = await fetchProductsByCategory({
    categoryId: category.id,
    size: 24,
  });

  return (
    <CategoryProductsView
      category={category}
      initialProducts={productsPage.items || []}
    />
  );
}
