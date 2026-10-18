import { ProductForm } from "@/components/seller/ProductForm";

export const metadata = {
  title: "Thêm sản phẩm mới - Kênh Người Bán | Vibe Mart",
  description: "Đăng bán sản phẩm mới SPU và cấu hình ma trận biến thể SKU.",
};

export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
