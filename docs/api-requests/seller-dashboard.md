# YÊU CẦU API: SELLER DASHBOARD ANALYTICS (P1)

> **Mức độ ưu tiên**: **P1 (Seller Center Cơ bản)**  
> **Màn hình sử dụng**: Kênh người bán > Tổng quan (`/seller`)  
> **Module BE liên quan**: `com.b2c.flash_sale_b2c_UTC2.store`

---

## 1. Biểu đồ doanh thu chuỗi ngày (`GET /api/v1/seller/analytics/revenue-chart`)

- **Method**: `GET /api/v1/seller/analytics/revenue-chart`
- **Query Parameters**: `period` (String, default="7days"): `today`, `7days`, `30days`.
- **Response mẫu (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Lấy dữ liệu biểu đồ doanh thu thành công",
    "data": {
      "period": "7days",
      "totalRevenue": 48250000,
      "totalOrders": 326,
      "points": [
        { "date": "12/10", "revenue": 5200000, "orders": 34 },
        { "date": "13/10", "revenue": 6800000, "orders": 45 },
        { "date": "14/10", "revenue": 9100000, "orders": 62 },
        { "date": "15/10", "revenue": 7400000, "orders": 51 },
        { "date": "16/10", "revenue": 8200000, "orders": 55 },
        { "date": "17/10", "revenue": 5950000, "orders": 39 },
        { "date": "18/10", "revenue": 5600000, "orders": 40 }
      ]
    },
    "timestamp": "2026-10-18T06:00:00Z"
  }
  ```
