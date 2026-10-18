# YÊU CẦU API: QUẢN LÝ NGƯỜI DÙNG TOÀN SÀN (P2)

> **Mức độ ưu tiên**: **P2 (Admin Console)**  
> **Màn hình sử dụng**: Admin Console > Quản lý người dùng (`/admin/users`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.user` (Cần tạo `AdminUserController`)

---

## 1. Danh sách người dùng toàn sàn (`GET /api/v1/admin/users`)
- **Method & Path**: `GET /api/v1/admin/users`
- **Quyền**: `@PreAuthorize("hasRole('ADMIN')")`
- **Tham số**: `role`, `status` (ACTIVE/LOCKED/BANNED), `keyword`, `page`, `size`.

## 2. Khóa / Mở khóa tài khoản (`PATCH /api/v1/admin/users/{id}/status`)
- **Method & Path**: `PATCH /api/v1/admin/users/{id}/status?status=LOCKED`
