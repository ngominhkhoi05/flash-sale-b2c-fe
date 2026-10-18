# YÊU CẦU API: DUYỆT SẢN PHẨM FLASH SALE (P0)

> **Mức độ ưu tiên**: **P0 (Lõi đề tài Flash Sale)**  
> **Màn hình sử dụng**: Admin Console > Duyệt sản phẩm Flash Sale (`/admin/flash-sale/approvals`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.flashsale` (`AdminFlashSaleController`)

---

## 1. Lấy danh sách SKU đăng ký theo slot (`GET /api/v1/admin/flash-sales/slots/{slotId}/items`)

- **Mục đích**: Admin xem danh sách các SKU được các gian hàng nộp đơn đăng ký tham gia vào khung giờ `slotId`, hỗ trợ lọc trạng thái, phân trang và tìm kiếm.
- **Method & Path**: `GET /api/v1/admin/flash-sales/slots/{slotId}/items`
- **Quyền yêu cầu**: `@PreAuthorize("hasRole('ADMIN')")`
- **Path Variables**: `slotId` (Long, bắt buộc) - ID khung giờ.
- **Query Parameters**:
  - `status` (String, tùy chọn): `PENDING` (chờ duyệt), `APPROVED` (đã duyệt), `REJECTED` (từ chối).
  - `search` (String, tùy chọn): Tìm theo tên sản phẩm, tên shop hoặc mã SKU.
  - `page` (int, default=0): Trang hiện tại.
  - `size` (int, default=15): Số lượng item / trang.
- **Response mẫu (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy danh sách sản phẩm đăng ký thành công",
    "data": {
      "content": [
        {
          "id": 42,
          "slotId": 102,
          "storeId": 8,
          "storeName": "UTC Fashion",
          "productId": 88,
          "productName": "Áo Thun Cotton Compact 100%",
          "variantId": 205,
          "skuCode": "AT-COT-BLK-L",
          "tierAttributes": { "Màu sắc": "Đen", "Kích thước": "L" },
          "imageUrl": "https://res.cloudinary.com/vibe-mart/image/upload/v1/sku-black-l.jpg",
          "originalPrice": 250000,
          "flashSalePrice": 129000,
          "discountPercent": 48.4,
          "stockQuantity": 120,
          "allocatedStock": 50,
          "userPurchaseLimit": 1,
          "status": "PENDING",
          "createdAt": "2026-10-18T03:00:00Z"
        }
      ],
      "pageNumber": 0,
      "pageSize": 15,
      "totalElements": 14,
      "totalPages": 1,
      "isLast": true
    },
    "timestamp": "2026-10-18T06:00:00Z"
  }
  ```

---

## 2. Từ chối duyệt SKU Flash Sale (`PATCH /api/v1/admin/flash-sales/items/{id}/reject`)

- **Mục đích**: Admin từ chối biến thể SKU kèm lý do gửi lại cho người bán.
- **Method & Path**: `PATCH /api/v1/admin/flash-sales/items/{id}/reject`
- **Quyền yêu cầu**: `@PreAuthorize("hasRole('ADMIN')")`
- **Request Body (`RejectFlashSaleItemRequest`)**:
  ```json
  {
    "reason": "Mức giảm giá chưa đạt yêu cầu tối thiểu (tối thiểu 10%) hoặc tồn kho không đủ cam kết."
  }
  ```
- **Ràng buộc**: `reason` là chuỗi bắt buộc, từ 5 đến 255 ký tự.
- **Quy tắc nghiệp vụ**:
  - Chuyển `flash_sale_items.status = 'REJECTED'`.
  - Không tác động trừ kho gốc của `product_variants`.

---

## 3. Duyệt hàng loạt SKU (`POST /api/v1/admin/flash-sales/items/batch-approve`)

- **Mục đích**: Hỗ trợ Admin bấm 1 nút duyệt nhiều SKU đã chọn trong bảng.
- **Method & Path**: `POST /api/v1/admin/flash-sales/items/batch-approve`
- **Request Body**:
  ```json
  {
    "itemIds": [42, 43, 44]
  }
  ```
- **Quy tắc nghiệp vụ**:
  - Chạy trong 1 Transaction hoặc xử lý từng item; với mỗi item trừ tồn kho gốc nguyên tử (`stock_quantity - allocatedStock`).
  - Trả về danh sách ID thành công và danh sách lỗi (nếu có).
