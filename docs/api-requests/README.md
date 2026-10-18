# TẬP HỢP YÊU CẦU API BACKEND (FE REQUEST TO BE)

> **Dành cho**: Đội ngũ Backend (`flash-sale-b2c-UTC2`)  
> **Người lập**: Frontend Team (`flash-sale-b2c-fe`)  
> **Ngày lập**: 2026-10-18  
> **Trạng thái**: Đã đối soát với mã nguồn BE hiện tại tại [`docs/be-api-inventory.md`](../be-api-inventory.md) và bảng [`docs/api-integration-status.md`](../api-integration-status.md).

---

## 1. Phân loại Mức độ Ưu tiên (Priority Matrix)

| Mức độ | Ý nghĩa & Phạm vi | Danh sách Module & File yêu cầu |
|:---:|---|---|
| **P0** | **Cốt lõi cho Demo Đề tài Flash Sale**<br>• Luồng đăng ký SKU của Seller & Phê duyệt của Admin<br>• Hệ thống giám sát Realtime & Chống bán vượt kho | 1. [`seller-flash-sale-registration.md`](seller-flash-sale-registration.md)<br>2. [`admin-flash-sale-approvals.md`](admin-flash-sale-approvals.md)<br>3. [`admin-flash-sale-monitor.md`](admin-flash-sale-monitor.md) |
| **P1** | **Seller Center Cơ bản (Hoàn thiện Đợt 5)**<br>• Quản lý sản phẩm shop & tìm kiếm SKU<br>• Quản lý đơn hàng shop, lọc trạng thái, chi tiết đơn | 4. [`seller-orders.md`](seller-orders.md)<br>5. [`seller-products.md`](seller-products.md)<br>6. [`seller-dashboard.md`](seller-dashboard.md) |
| **P2** | **Quản trị Mở rộng (Admin Console Đợt 7, 8, 9 & Seller RBAC)**<br>• Quản trị voucher sàn nâng cao<br>• Quản lý người dùng & gian hàng<br>• Phân hệ đối soát tài chính<br>• Phân quyền RBAC & Feature Flags<br>• Phân quyền nhân viên gian hàng | 7. [`admin-vouchers.md`](admin-vouchers.md)<br>8. [`admin-stores.md`](admin-stores.md)<br>9. [`admin-users.md`](admin-users.md)<br>10. [`admin-reconciliation.md`](admin-reconciliation.md)<br>11. [`admin-permissions.md`](admin-permissions.md)<br>12. [`seller-staff.md`](seller-staff.md) |

---

## 2. Quy chuẩn Chung khi Implement API Phía BE

1. **Envelope Response**: Mọi endpoint bắt buộc trả về bọc trong `ApiResponse<T>`:
   ```json
   {
     "success": true,
     "code": 200,
     "message": "Thành công",
     "data": { ... },
     "timestamp": "2026-10-18T06:00:00Z"
   }
   ```
2. **Xác thực & Danh tính**:
   - Dùng `@AuthenticationPrincipal CustomUserDetails userDetails` từ JWT Bearer token.
   - **Seller Shop**: Luôn resolve qua `storeRepository.findByUserId(userId)` và validate `store.status == 'APPROVED'`. Tuyệt đối không cho client tự truyền `storeId`.
   - **Address & Order Ownership**: Luôn kiểm tra quyền sở hữu tương ứng (`user_id` cho Buyer, `store_id` cho Seller).
3. **Phân trang**: Sử dụng chuẩn `PageResponse<T>` gồm `content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `isLast`.
4. **Mã lỗi**: Khai báo enum theo từng module kế thừa `ErrorCode` (ví dụ: `FLASH_SALE_ITEM_NOT_FOUND`, `ORDER_NOT_FOUND`, `STORE_ACCESS_DENIED`).
