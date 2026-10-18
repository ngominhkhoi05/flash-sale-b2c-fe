# YÊU CẦU API: QUẢN LÝ GIAN HÀNG TOÀN SÀN (P2)

> **Mức độ ưu tiên**: **P2 (Admin Console)**  
> **Màn hình sử dụng**: Admin Console > Quản lý gian hàng (`/admin/stores`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.store` (`AdminStoreController`)

---

## 1. Lấy danh sách gian hàng toàn sàn (`GET /api/v1/admin/stores`)
- **Method & Path**: `GET /api/v1/admin/stores`
- **Quyền**: `@PreAuthorize("hasRole('ADMIN')")`
- **Tham số**:
  - `status` (String, tùy chọn): `PENDING` (chờ duyệt hồ sơ), `APPROVED` (đang hoạt động), `BANNED` (bị khóa).
  - `search` (String, tùy chọn): Tìm theo tên shop, email chủ shop, SĐT.
  - `page`, `size`, `sort`.
- **Response**: Trả về `PageResponse<StoreResponse>`.
