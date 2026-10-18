# YÊU CẦU API: QUẢN LÝ NHÂN VIÊN & PHÂN QUYỀN GIAN HÀNG (SELLER STAFF & RBAC)

> **Mô-đun**: Seller Staff Management & Shop Role-Based Access Control  
> **Mức độ ưu tiên**: **P2** (Seller Center Advanced Settings)  
> **Màn hình sử dụng**: `/seller/staff` (Màn hình 29: Quản lý nhân viên và phân quyền)

---

## 1. Mục đích Nghiệp vụ

Cho phép chủ gian hàng (`OWNER`) mời các thành viên tham gia vận hành shop và phân quyền theo các nhóm vai trò nghiệp vụ độc lập:
1. **Quản lý kho (`WAREHOUSE_MANAGER`)**: Quyền cập nhật tồn kho, xử lý đơn hàng, đóng gói và bàn giao vận chuyển (`product:update`, `inventory:sync`, `order:pack`, `order:shipping`).
2. **Kế toán đối soát (`ACCOUNTANT`)**: Quyền xem số dư ví, bảng kê đối soát và yêu cầu rút tiền ví (`wallet:view`, `payout:request`, `report:export`).
3. **Vận hành Flash Sale (`FLASH_SALE_OPERATOR`)**: Quyền đăng ký sản phẩm tham gia phiên Flash Sale và điều chỉnh giá (`flashsale:register`, `price:adjust`, `campaign:manage`).

Chủ shop có quyền:
- Mời nhân viên qua email.
- Đổi nhóm quyền của nhân viên.
- Tạm khóa hoặc mở khóa quyền nhân viên.
- Xóa nhân viên khỏi shop hoặc hủy lời mời đang chờ.

---

## 2. Danh sách Endpoints Yêu cầu

### 2.1. Lấy danh sách nhân viên của gian hàng

- **Method & Path**: `GET /api/v1/seller/staff`
- **Quyền**: `ROLE_SELLER` (bắt buộc là chủ shop hoặc có quyền quản lý nhân viên).
- **Header**: `Authorization: Bearer <token>`
- **Response mẫu**:
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách nhân viên thành công",
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn An",
      "email": "an.nguyen@utcfashion.vn",
      "role": "OWNER",
      "roleLabel": "Chủ shop (Toàn quyền)",
      "status": "ACTIVE",
      "addedAt": "15/03/2025",
      "permissions": ["*"]
    },
    {
      "id": 2,
      "name": "Trần Thị Mai Phương",
      "email": "phuong.tran@utcfashion.vn",
      "role": "WAREHOUSE_MANAGER",
      "roleLabel": "Quản lý kho",
      "status": "ACTIVE",
      "addedAt": "20/05/2025",
      "permissions": ["product:update", "inventory:sync", "order:pack", "order:shipping"]
    },
    {
      "id": 5,
      "name": "Vũ Quốc Hưng",
      "email": "hung.vu@gmail.com",
      "role": "WAREHOUSE_MANAGER",
      "roleLabel": "Quản lý kho",
      "status": "PENDING_INVITE",
      "addedAt": "04/10/2026",
      "permissions": ["product:update", "inventory:sync", "order:pack", "order:shipping"]
    }
  ]
}
```

---

### 2.2. Lấy thông tin các nhóm quyền vai trò (Role Summaries)

- **Method & Path**: `GET /api/v1/seller/roles`
- **Quyền**: `ROLE_SELLER`
- **Response mẫu**:
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách vai trò thành công",
  "data": [
    {
      "id": "role-1",
      "role": "WAREHOUSE_MANAGER",
      "roleName": "Quản lý kho",
      "description": "Chuyên trách nhập xuất, đồng bộ kho & đóng hàng",
      "memberCount": 2,
      "icon": "inventory_2",
      "color": "sky",
      "permissions": ["product:update", "inventory:sync", "order:pack", "order:shipping"]
    },
    {
      "id": "role-2",
      "role": "ACCOUNTANT",
      "roleName": "Kế toán đối soát",
      "description": "Theo dõi dòng tiền, phiên đối soát và rút tiền ví",
      "memberCount": 1,
      "icon": "account_balance_wallet",
      "color": "emerald",
      "permissions": ["wallet:view", "payout:request", "report:export"]
    },
    {
      "id": "role-3",
      "role": "FLASH_SALE_OPERATOR",
      "roleName": "Vận hành Flash Sale",
      "description": "Quản trị các chiến dịch giá sốc và deal độc quyền",
      "memberCount": 1,
      "icon": "bolt",
      "color": "rose",
      "permissions": ["flashsale:register", "price:adjust", "campaign:manage"]
    }
  ]
}
```

---

### 2.3. Mời nhân viên mới vào gian hàng

- **Method & Path**: `POST /api/v1/seller/staff/invite`
- **Quyền**: `ROLE_SELLER`
- **Request Body**:
```json
{
  "email": "nhanvien@email.com",
  "role": "WAREHOUSE_MANAGER"
}
```
- **Ràng buộc**:
  - `email`: Bắt buộc, định dạng email hợp lệ. Không được trùng với email nhân viên đã có trong shop.
  - `role`: Một trong `WAREHOUSE_MANAGER`, `ACCOUNTANT`, `FLASH_SALE_OPERATOR`.
- **Response**: Trả về `SellerStaffMember` với trạng thái `PENDING_INVITE`. Hệ thống gửi email chứa token kích hoạt (TTL 7 ngày).

---

### 2.4. Đổi nhóm quyền của nhân viên

- **Method & Path**: `PUT /api/v1/seller/staff/{id}/role`
- **Quyền**: `ROLE_SELLER`
- **Request Body**:
```json
{
  "role": "ACCOUNTANT"
}
```

---

### 2.5. Tạm khóa hoặc Mở khóa quyền nhân viên

- **Method & Path**: `PATCH /api/v1/seller/staff/{id}/status?status=LOCKED` (hoặc `ACTIVE`)
- **Quyền**: `ROLE_SELLER`
- **Ràng buộc**: Không được tự khóa tài khoản của chính mình (`OWNER`).

---

### 2.6. Xóa nhân viên hoặc Hủy lời mời

- **Method & Path**: `DELETE /api/v1/seller/staff/{id}`
- **Quyền**: `ROLE_SELLER`
- **Ràng buộc**: Không được xóa tài khoản chủ sở hữu gian hàng (`OWNER`).
