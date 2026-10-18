# YÊU CẦU API: PHÂN QUYỀN VÀ TÍNH NĂNG (P2)

> **Mức độ ưu tiên**: **P2 (Admin Console Đợt 9)**  
> **Màn hình sử dụng**: Admin Console > Phân quyền & tính năng (`/admin/permissions` gồm 4 tab)  
> **Module BE liên quan**: `auth` / `permissions` / `review`

---

## 1. Tab 1 & 2: Quản lý Vai trò và Ma trận quyền
- `GET /api/v1/admin/roles`: Danh sách vai trò hệ thống (`ADMIN`, `SELLER`, `BUYER`, `MODERATOR`).
- `GET /api/v1/admin/permissions/matrix`: Ma trận quyền chi tiết theo từng module.
- `PUT /api/v1/admin/permissions/matrix`: Cập nhật bật/tắt quyền cho vai trò.

## 2. Tab 3: Cờ tính năng (Feature Flags)
- `GET /api/v1/admin/feature-flags`: Danh sách cờ tính năng động (vd: `flash_sale_rush_hour`, `zalopay_sandbox_mode`, `ai_smart_search`).
- `PATCH /api/v1/admin/feature-flags/{key}`: Bật / tắt tính năng.

## 3. Tab 4: Kiểm duyệt đánh giá (Review Moderation)
- `GET /api/v1/admin/reviews/moderation`: Danh sách đánh giá sản phẩm bị khiếu nại/báo cáo.
- `PATCH /api/v1/admin/reviews/{id}/visibility`: Ẩn hoặc khôi phục hiển thị đánh giá vi phạm.
