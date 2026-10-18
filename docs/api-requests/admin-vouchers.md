# YÊU CẦU API: QUẢN TRỊ VOUCHER SÀN (P2)

> **Mức độ ưu tiên**: **P2 (Admin Console Đợt 8)**  
> **Màn hình sử dụng**: Admin Console > Voucher sàn (`/admin/vouchers`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.voucher` (`AdminVoucherController`)

---

## 1. Danh sách toàn bộ Voucher sàn (`GET /api/v1/admin/vouchers`)
- **Method & Path**: `GET /api/v1/admin/vouchers`
- **Quyền**: `@PreAuthorize("hasRole('ADMIN')")`
- **Tham số lọc**: `status` (ALL/ACTIVE/EXPIRED/INACTIVE), `discountType` (PERCENTAGE/FIXED_AMOUNT), `search` (theo mã code hoặc tên), `page`, `size`.
- **Yêu cầu**: Trả về cả các voucher đã hết hạn hoặc tạm ẩn để Admin quản lý.

## 2. Cập nhật & Bật/tắt trạng thái Voucher (`PUT /api/v1/admin/vouchers/{id}` & `PATCH .../status`)
- **Method & Path**: `PUT /api/v1/admin/vouchers/{id}`, `PATCH /api/v1/admin/vouchers/{id}/status?status=...`
- **Quy tắc**: Không cho phép sửa `voucher_code` nếu đã có lượt sử dụng (`usage_count > 0`).
