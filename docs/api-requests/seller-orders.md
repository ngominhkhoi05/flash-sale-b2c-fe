# YÊU CẦU API: QUẢN LÝ ĐƠN HÀNG SELLER (P1)

> **Mức độ ưu tiên**: **P1 (Seller Center Cơ bản)**  
> **Màn hình sử dụng**: Kênh người bán > Quản lý đơn hàng (`/seller/orders`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.order` (`SellerOrderController`)

---

## 1. Nâng cấp `GET /api/v1/seller/orders` (Thêm bộ lọc `status` và `keyword`)

- **Hiện trạng BE**: Endpoint `GET /api/v1/seller/orders` hiện chỉ có `@RequestParam(defaultValue = "0") int page, int size`.
- **Yêu cầu bổ sung**:
  - `@RequestParam(required = false) String status`: Lọc theo trạng thái đơn (`PENDING_PAYMENT`, `PAID` / `PENDING_CONFIRMATION`, `SHIPPED`, `COMPLETED`, `CANCELLED`).
  - `@RequestParam(required = false) String keyword`: Tìm kiếm theo mã đơn (`orderCode`), tên khách hàng hoặc SĐT nhận hàng.
- **Response mẫu (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy danh sách đơn hàng thành công",
    "data": {
      "content": [
        {
          "id": 1001,
          "orderCode": "FS-261005-M9B2",
          "isFlashSale": true,
          "status": "PAID",
          "paymentMethod": "ZALOPAY",
          "totalAmount": 288000,
          "shippingFee": 30000,
          "discountAmount": 20000,
          "recipientName": "Nguyễn Văn A",
          "recipientPhone": "0912345678",
          "shippingAddress": "Số 1 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP.HCM",
          "items": [
            {
              "id": 501,
              "variantId": 205,
              "skuCode": "AT-COT-BLK-L",
              "productName": "Áo Thun Cotton Compact 100%",
              "variantName": "Đen / L",
              "imageUrl": "https://res.cloudinary.com/vibe-mart/image/upload/v1/sku-black-l.jpg",
              "unitPrice": 129000,
              "quantity": 2,
              "totalPrice": 258000
            }
          ],
          "createdAt": "2026-10-18T05:30:00Z"
        }
      ],
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 326,
      "totalPages": 33,
      "isLast": false
    },
    "timestamp": "2026-10-18T06:00:00Z"
  }
  ```

---

## 2. Lấy chi tiết đơn hàng cho Seller (`GET /api/v1/seller/orders/{id}`)

- **Mục đích**: Mở Drawer xem chi tiết đơn hàng trên màn hình `/seller/orders`.
- **Method & Path**: `GET /api/v1/seller/orders/{id}`
- **Quyền yêu cầu**: `@PreAuthorize("hasRole('SELLER')")`
- **Quy tắc nghiệp vụ**: Bắt buộc kiểm tra `order.store.id == sellerStore.id`. Nếu không khớp ném `ORDER_ACCESS_DENIED` (HTTP 403).

---

## 3. Seller hủy đơn hàng (`PATCH /api/v1/seller/orders/{id}/cancel`)

- **Mục đích**: Seller hủy đơn khi có sự cố phát sinh kèm ghi nhận lý do gửi cho khách.
- **Method & Path**: `PATCH /api/v1/seller/orders/{id}/cancel`
- **Request Body (`SellerCancelOrderRequest`)**:
  ```json
  {
    "cancelReason": "OUT_OF_STOCK | CANNOT_CONTACT_BUYER | WRONG_PRICE",
    "message": "Shop rất xin lỗi vì sản phẩm đã hết hàng tại kho do kiểm kê đột xuất."
  }
  ```
- **Quy tắc nghiệp vụ**:
  - Chỉ cho phép hủy khi đơn ở trạng thái `PAID` hoặc `PENDING_CONFIRMATION` (chưa giao sang ĐVVC).
  - Tự động hoàn lại tồn kho gốc cho các SKU trong đơn.
