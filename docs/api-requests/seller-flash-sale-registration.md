# YÊU CẦU API: ĐĂNG KÝ FLASH SALE DÀNH CHO SELLER (P0)

> **Mức độ ưu tiên**: **P0 (Lõi đề tài Flash Sale)**  
> **Màn hình sử dụng**: Kênh người bán > Đăng ký Flash Sale (`/seller/flash-sale/register`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.flashsale` (`SellerFlashSaleController`)

---

## 1. Lấy danh sách SKU shop đã đăng ký Flash Sale (`GET /api/v1/seller/flash-sales/items`)

- **Mục đích**: Hiển thị bảng "Lịch sử đăng ký của shop" trên màn hình `/seller/flash-sale/register` để seller theo dõi trạng thái duyệt (`PENDING`, `APPROVED`, `REJECTED`), tồn kho đã phân bổ và tiến độ bán thực tế.
- **Method & Path**: `GET /api/v1/seller/flash-sales/items`
- **Quyền yêu cầu**: `@PreAuthorize("hasRole('SELLER')")`
- **Query Parameters**:
  - `slotId` (Long, tùy chọn): Lọc theo phiên Flash Sale cụ thể.
  - `status` (String, tùy chọn): Lọc theo trạng thái đăng ký (`PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `ENDED`).
  - `page` (int, default=0): Số trang.
  - `size` (int, default=10): Kích thước trang.
  - `sort` (String, default="createdAt,desc"): Sắp xếp.
- **Request Body**: Không có (None).
- **Quy tắc nghiệp vụ**:
  - BE tự lấy `userId` từ token JWT, tìm `Store` tương ứng (`store.status == 'APPROVED'`).
  - Chỉ trả về các `FlashSaleItem` có `variant.product.store.id == currentStore.id`.
  - Phải trả về thông tin bổ trợ: Tên sản phẩm, hình ảnh SKU, tên thuộc tính biến thể (ví dụ: "Đen / XL"), giá gốc của SKU.
- **Response mẫu (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy danh sách sản phẩm đăng ký Flash Sale thành công",
    "data": {
      "content": [
        {
          "id": 42,
          "slotId": 102,
          "slotName": "12:00 - 14:00 Giờ Vàng Siêu Sale",
          "slotStartTime": "2026-10-18T12:00:00Z",
          "slotEndTime": "2026-10-18T14:00:00Z",
          "slotStatus": "UPCOMING",
          "productId": 88,
          "productName": "Áo Thun Cotton Compact 100%",
          "variantId": 205,
          "skuCode": "AT-COT-BLK-L",
          "variantName": "Đen / L",
          "imageUrl": "https://res.cloudinary.com/vibe-mart/image/upload/v1/sku-black-l.jpg",
          "originalPrice": 250000,
          "flashSalePrice": 129000,
          "discountPercent": 48.4,
          "allocatedStock": 50,
          "availableStock": 50,
          "soldCount": 0,
          "userPurchaseLimit": 1,
          "status": "APPROVED",
          "rejectReason": null,
          "createdAt": "2026-10-18T03:00:00Z"
        }
      ],
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 1,
      "totalPages": 1,
      "isLast": true
    },
    "timestamp": "2026-10-18T06:00:00Z"
  }
  ```
- **Mã lỗi thường gặp**:
  - `401 UNAUTHORIZED`: Chưa đăng nhập hoặc token hết hạn.
  - `403 FORBIDDEN`: Không có quyền SELLER hoặc Store chưa được duyệt.

---

## 2. Hủy đăng ký sản phẩm Flash Sale (`DELETE /api/v1/seller/flash-sales/items/{id}`)

- **Mục đích**: Seller rút đăng ký khi sản phẩm vẫn ở trạng thái chờ duyệt (`PENDING`).
- **Method & Path**: `DELETE /api/v1/seller/flash-sales/items/{id}`
- **Quyền yêu cầu**: `@PreAuthorize("hasRole('SELLER')")`
- **Path Variables**: `id` (Long, bắt buộc) - ID của bản ghi `flash_sale_items`.
- **Quy tắc nghiệp vụ**:
  - Chỉ cho phép xóa khi `item.status == 'PENDING'`.
  - Nếu đã `APPROVED` hoặc phiên đã `ACTIVE`: Ném lỗi `FLASH_SALE_ITEM_CANNOT_CANCEL` (HTTP 400/409).
  - Kiểm tra quyền sở hữu: SKU phải thuộc Store của seller hiện tại.
- **Response mẫu (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Hủy đăng ký sản phẩm Flash Sale thành công",
    "data": null,
    "timestamp": "2026-10-18T06:00:00Z"
  }
  ```
