# YÊU CẦU API: QUẢN LÝ SẢN PHẨM SELLER (P1)

> **Mức độ ưu tiên**: **P1 (Seller Center Cơ bản)**  
> **Màn hình sử dụng**: Kênh người bán > Danh sách sản phẩm (`/seller/products`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.product` (`SellerProductController`)

---

## 1. Bổ sung tham số tìm kiếm `keyword` cho `GET /api/v1/seller/products`

- **Hiện trạng BE**: `getSellerProducts` chỉ nhận `@RequestParam(required = false) String status` và `Pageable`.
- **Yêu cầu**: Thêm `@RequestParam(required = false) String keyword`:
  - Tìm kiếm tương đối (`ILIKE %keyword%`) theo tên sản phẩm (`name`) hoặc mã sản phẩm (`sku_code` của các variant trực thuộc).

---

## 2. API Xuất danh sách sản phẩm ra Excel (`GET /api/v1/seller/products/export`)

- **Method**: `GET /api/v1/seller/products/export`
- **Response**: Trả về binary stream file Excel `.xlsx` hoặc JSON danh sách để FE tự xuất client-side.
