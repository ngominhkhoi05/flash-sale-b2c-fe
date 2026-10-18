# YÊU CẦU API: ĐỐI SOÁT TÀI CHÍNH TOÀN SÀN (P2)

> **Mức độ ưu tiên**: **P2 (Admin Console Đợt 9)**  
> **Màn hình sử dụng**: Admin Console > Đối soát tài chính (`/admin/reconciliation`)  
> **Module BE liên quan**: Cần tạo module mới `com.b2c.flash_sale_b2c_UTC2.reconciliation`

---

## 1. Tổng quan chu kỳ đối soát (`GET /api/v1/admin/reconciliation/summary`)
- **Query Params**: `period` (String, ví dụ "09/2026", "10/2026").
- **Dữ liệu trả về**: Tổng GMV, Doanh thu ròng sàn (hoa hồng), Phí thanh toán cổng ZaloPay/COD, Tiền đang tạm giữ chờ quyết toán T+3.

## 2. Danh sách đơn hàng đối soát (`GET /api/v1/admin/reconciliation/orders`)
- **Tham số**: `period`, `storeId`, `paymentMethod`, `status`, `page`, `size`.

## 3. Chốt chu kỳ đối soát (`POST /api/v1/admin/reconciliation/lock`)
- **Request Body**: `period`, `notes`.
