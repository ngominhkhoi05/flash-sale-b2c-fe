import { FlashSaleRegisterClient } from "./register/FlashSaleRegisterClient";

export const metadata = {
  title: "Chương trình Flash Sale - Kênh Người Bán | Vibe Mart",
  description: "Đăng ký sản phẩm tham gia các khung giờ Flash Sale toàn sàn.",
};

export default function SellerFlashSaleMainPage() {
  return <FlashSaleRegisterClient />;
}
