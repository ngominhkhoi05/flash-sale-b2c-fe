import { ProductForm } from "@/components/seller/ProductForm";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Chỉnh sửa sản phẩm - Kênh Người Bán | Vibe Mart",
  description: "Cập nhật thông tin sản phẩm SPU và biến thể phân loại SKU.",
};

export default async function EditProductPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);

  return <ProductForm mode="edit" productId={productId} />;
}
