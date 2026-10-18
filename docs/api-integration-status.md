# BẢNG ĐỐI CHIẾU TRẠNG THÁI TÍCH HỢP API (API INTEGRATION STATUS)

> **Ngày lập**: 2026-10-18  
> **Source of Truth**:
> - BE: `flash-sale-b2c-UTC2` (xem chi tiết tại [`docs/be-api-inventory.md`](be-api-inventory.md))
> - FE: `flash-sale-b2c-fe` (Thiết kế Stitch Đợt 5, 7, 8, 9 và `src/lib/api`)
>
> **Quy ước trạng thái BE**:
> - **KHỚP**: BE có endpoint, cấu trúc request/response phù hợp, gắn được ngay.
> - **LỆCH**: BE có endpoint nhưng lệch path, tên trường, kiểu dữ liệu hoặc tham số phân trang/lọc (cần adapter ở FE hoặc request BE chỉnh).
> - **THIẾU**: BE chưa có endpoint này.

---

## I. Phân hệ Kênh Người Bán (Seller Center - Đợt 5)

### 1. Màn hình: Seller Dashboard (`/seller`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Lấy số liệu KPI tổng hợp (Sản phẩm, đơn chờ, doanh thu ngày/tháng, rating, cảnh báo tồn kho thấp) | Mock | `GET /api/v1/stores/sidebar/summary` | **KHỚP** | BE có `GET /api/v1/stores/sidebar/summary` trả về `SidebarSummaryResponse` gồm đầy đủ `totalProducts`, `pendingOrders`, `todayOrders`, `todayRevenue`, `monthRevenue`, `ratingAvg`, `ratingCount`, `lowStockProducts`, `storeStatus`. | Gắn thẳng qua `src/lib/api` |
| Danh sách 5 đơn hàng mới nhất | Mock | `GET /api/v1/seller/orders?page=0&size=5` | **KHỚP** | BE có `GET /api/v1/seller/orders` với phân trang `page`, `size`. | Gắn thẳng |
| Top 4 sản phẩm bán chạy của shop | Mock | `GET /api/v1/seller/products?page=0&size=4&sort=totalSold,desc` | **KHỚP** | BE có `GET /api/v1/seller/products` nhận `@PageableDefault` hỗ trợ sort. | Gắn thẳng |
| Biểu đồ doanh thu 7 ngày / 30 ngày | Mock | `GET /api/v1/seller/analytics/revenue-chart?period=7days` | **THIẾU** | BE chưa có API thống kê doanh thu theo chuỗi ngày (time series). | Giữ mock (khi bật cờ mock), viết request BE (`docs/api-requests/seller-dashboard.md`) |
| Thao tác rút tiền nhanh từ ví khả dụng | Mock | `POST /api/v1/seller/wallet/withdraw` | **THIẾU** | BE chưa có endpoint rút tiền cho ví seller (mới có bảng `wallets` ở mức DB). | Giữ mock (khi bật cờ mock), viết request BE |

---

### 2. Màn hình: Danh sách sản phẩm (`/seller/products`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Xem danh sách sản phẩm SPU của shop | Mock | `GET /api/v1/seller/products?page=0&size=20` | **KHỚP** | BE có `GET /api/v1/seller/products` trả về `PageResponse<ProductSummaryResponse>`. | Gắn thẳng |
| Lọc sản phẩm theo trạng thái (Đang bán, Hết hàng, Đã ẩn) | Mock | `GET /api/v1/seller/products?status=ACTIVE` | **KHỚP** | BE hỗ trợ `@RequestParam(required = false) String status`. | Gắn thẳng |
| Tìm kiếm sản phẩm theo tên / mã SKU | Mock | `GET /api/v1/seller/products?keyword=...` | **LỆCH** | BE `SellerProductController` chưa có param `keyword` (chỉ có `status` và `pageable`). Search hiện phải lọc client-side hoặc BE bổ sung param `keyword`. | Viết adapter lọc tạm ở FE + viết request BE bổ sung param `keyword` |
| Bật / Tắt trạng thái sản phẩm (ACTIVE / INACTIVE) | Mock | `PATCH /api/v1/seller/products/{id}/status?status=...` | **KHỚP** | BE có `PATCH /api/v1/seller/products/{id}/status` nhận param `status`. | Gắn thẳng |
| Xóa sản phẩm (Soft / Hard delete) | Mock | `DELETE /api/v1/seller/products/{id}` | **KHỚP** | BE có `DELETE /api/v1/seller/products/{id}`, tự động soft/hard delete tùy thuộc đã có đơn hàng/flash sale hay chưa. | Gắn thẳng |
| Xem danh sách biến thể SKU chi tiết khi expand row | Mock | `GET /api/v1/seller/products/{id}` | **KHỚP** | BE có `GET /api/v1/seller/products/{id}` trả về `ProductDetailResponse` kèm toàn bộ `variants`. | Gắn thẳng |
| Xuất danh sách sản phẩm ra Excel | Mock | `GET /api/v1/seller/products/export` | **THIẾU** | BE chưa có endpoint export Excel. | Xử lý export file CSV/Excel ở FE từ dữ liệu nạp được |

---

### 3. Màn hình: Thêm / Sửa sản phẩm (`/seller/products/new`, `/seller/products/[id]/edit`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Lấy danh mục sản phẩm của sàn | Real/Mock | `GET /api/v1/categories` | **KHỚP** | BE có `GET /api/v1/categories` trả về cây danh mục `CategoryResponse`. | Gắn thẳng |
| Upload ảnh chính / gallery sản phẩm SPU | Mock | `POST /api/v1/seller/products/{id}/images` | **KHỚP** | BE có `POST /api/v1/seller/products/{id}/images` nhận `MultipartFile file`, `isPrimary`, `displayOrder`. | Gắn thẳng |
| Upload ảnh cho từng biến thể SKU | Mock | `POST /api/v1/seller/products/{productId}/variants/{variantId}/images` | **KHỚP** | BE có endpoint chuẩn đa hình nhận `MultipartFile`. | Gắn thẳng |
| Đăng bán sản phẩm mới (SPU kèm ma trận SKU) | Mock | `POST /api/v1/seller/products` | **KHỚP** | BE có `POST /api/v1/seller/products` nhận `CreateProductRequest` (gồm tierVariationConfigs và danh sách variants). | Gắn thẳng |
| Lấy chi tiết sản phẩm để load vào form sửa | Mock | `GET /api/v1/seller/products/{id}` | **KHỚP** | BE có `GET /api/v1/seller/products/{id}` trả về chi tiết SPU + SKU. | Gắn thẳng |
| Cập nhật sản phẩm & biến thể | Mock | `PUT /api/v1/seller/products/{id}` | **KHỚP** | BE có `PUT /api/v1/seller/products/{id}` nhận `UpdateProductRequest`. | Gắn thẳng |

---

### 4. Màn hình: Đăng ký Flash Sale (`/seller/flash-sale/register`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Xem danh sách khung giờ Flash Sale mở đăng ký | Real/Mock | `GET /api/v1/flash-sales/slots` | **KHỚP** | BE có `GET /api/v1/flash-sales/slots` trả về danh sách khung giờ (`PublicFlashSaleSlotResponse`). | Gắn thẳng |
| Nộp đơn đăng ký biến thể SKU tham gia Flash Sale | Mock | `POST /api/v1/seller/flash-sales/items` | **KHỚP** | BE có `POST /api/v1/seller/flash-sales/items` nhận `RegisterFlashSaleItemRequest` (`slotId`, `variantId`, `flashSalePrice`, `allocatedStock`, `userPurchaseLimit`). | Gắn thẳng |
| Xem lịch sử SKU đã đăng ký của shop kèm trạng thái duyệt | Mock | `GET /api/v1/seller/flash-sales/items` | **THIẾU** | **BE CHƯA CÓ** endpoint này! Seller sau khi đăng ký không có cách nào xem lại các item mình đã nộp đơn và trạng thái duyệt (`PENDING`, `APPROVED`, `REJECTED`). | Giữ mock (khi bật cờ mock), viết request BE P0 (`docs/api-requests/seller-flash-sale-registration.md`) |
| Hủy đăng ký sản phẩm khi chưa duyệt | Mock | `DELETE /api/v1/seller/flash-sales/items/{itemId}` | **THIẾU** | BE chưa hỗ trợ rút đăng ký Flash Sale. | Giữ mock (khi bật cờ mock), viết request BE |

---

### 5. Màn hình: Quản lý đơn hàng Seller (`/seller/orders`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Lấy danh sách đơn hàng của shop (phân trang) | Mock | `GET /api/v1/seller/orders?page=0&size=10` | **KHỚP** | BE có `GET /api/v1/seller/orders` trả về `PageResponse<OrderResponse>`. | Gắn thẳng |
| Lọc đơn hàng theo trạng thái (Chờ xác nhận, Đang giao, Đã giao...) | Mock | `GET /api/v1/seller/orders?status=PENDING_CONFIRMATION` | **LỆCH** | BE `SellerOrderController.getMyStoreOrders` chỉ nhận `int page, int size`, chưa nhận `@RequestParam(required = false) String status`! | Viết adapter lọc ở FE (nếu size nhỏ) + viết request BE bổ sung param `status` |
| Tìm kiếm đơn theo mã đơn, người nhận, SĐT | Mock | `GET /api/v1/seller/orders?keyword=...` | **THIẾU** | BE chưa có tìm kiếm đơn hàng cho seller. | Viết request BE bổ sung tìm kiếm |
| Cập nhật trạng thái đơn (Xác nhận, Giao hàng, Hoàn thành) | Mock | `PATCH /api/v1/seller/orders/{id}/status` | **KHỚP** | BE có `PATCH /api/v1/seller/orders/{id}/status` nhận `UpdateOrderStatusRequest`. | Gắn thẳng |
| Xem chi tiết 1 đơn hàng của shop | Mock | `GET /api/v1/seller/orders/{id}` | **THIẾU** | BE chỉ có `GET /api/v1/orders/{id}` cho Buyer (check `user_id == current_user`). Thiếu `GET /api/v1/seller/orders/{id}` kiểm tra shop ownership. | Viết request BE P1 (`docs/api-requests/seller-orders.md`) |
| In vận đơn / In phiếu loạt | Mock | Client-side print | **KHỚP** | Thực hiện in qua `window.print()` / popup HTML print ở FE. | Xử lý hoàn toàn tại FE |

---

## II. Phân hệ Quản trị Toàn sàn (Admin Console - Đợt 7, 8, 9 & Tổng quan)

### 1. Màn hình: Admin Overview (`/admin`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Thống kê KPI tổng quan sàn (GMV, người dùng mới, đơn hàng toàn sàn, gian hàng mới) | Mock (EmptyState) | `GET /api/v1/admin/dashboard/kpi` | **THIẾU** | BE chưa có endpoint tổng hợp KPI toàn sàn cho Admin. | Giữ mock (khi bật cờ mock), viết request BE |

---

### 2. Màn hình: Quản lý Người dùng (`/admin/users`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Xem danh sách tài khoản người dùng toàn sàn | Chưa dựng UI (disabled ở sidebar) | `GET /api/v1/admin/users?page=0&size=10` | **THIẾU** | BE **chưa có `AdminUserController`**. Hiện chỉ có `UserController` cho cá nhân (`/users/me`). | Viết request BE P2 (`docs/api-requests/admin-users.md`) |
| Khóa / Mở khóa tài khoản (Ban/Active) | Chưa dựng UI | `PATCH /api/v1/admin/users/{id}/status` | **THIẾU** | BE chưa có API đổi trạng thái người dùng. | Viết request BE P2 |
| Đổi vai trò / phân quyền người dùng | Chưa dựng UI | `PUT /api/v1/admin/users/{id}/roles` | **THIẾU** | BE chưa có API gán role cho user. | Viết request BE P2 |

---

### 3. Màn hình: Quản lý Gian hàng (`/admin/stores`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Xem danh sách gian hàng (Chờ duyệt, Đã duyệt, Bị khóa) | Chưa dựng UI (disabled ở sidebar) | `GET /api/v1/admin/stores?status=...` | **THIẾU** | BE `AdminStoreController` **chưa có endpoint GET danh sách stores**! | Viết request BE P2 (`docs/api-requests/admin-stores.md`) |
| Phê duyệt hoặc khóa gian hàng | Chưa dựng UI | `PATCH /api/v1/admin/stores/{id}/status` | **KHỚP** | BE có sẵn `PATCH /api/v1/admin/stores/{id}/status` nhận `UpdateStoreStatusRequest` (`APPROVED`, `BANNED`, `SUSPENDED`). | Gắn thẳng khi dựng màn |

---

### 4. Màn hình: Sản phẩm toàn sàn (`/admin/products`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Xem danh sách tất cả sản phẩm trên toàn sàn | Chưa dựng UI (disabled ở sidebar) | `GET /api/v1/admin/products` | **LỆCH** | BE chưa có endpoint admin riêng, nhưng có `GET /api/v1/products` (public listing có search & filter). | Tạm dùng `GET /api/v1/products` + request BE thêm bộ lọc quản trị |
| Gỡ bỏ / Khóa sản phẩm vi phạm tiêu chuẩn cộng đồng | Chưa dựng UI | `PATCH /api/v1/admin/products/{id}/ban` | **THIẾU** | BE chưa có API gỡ sản phẩm quyền Admin. | Viết request BE P2 |

---

### 5. Màn hình: Danh mục & Hoa hồng (`/admin/categories`)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Xem danh sách danh mục toàn sàn | Chưa dựng UI (disabled ở sidebar) | `GET /api/v1/categories` | **KHỚP** | BE có sẵn `GET /api/v1/categories` trả về toàn bộ cây danh mục. | Gắn thẳng |
| Tạo mới danh mục sàn | Chưa dựng UI | `POST /api/v1/admin/categories` | **KHỚP** | BE có `POST /api/v1/admin/categories` nhận `CreateCategoryRequest`. | Gắn thẳng |
| Cập nhật thông tin danh mục | Chưa dựng UI | `PUT /api/v1/admin/categories/{id}` | **KHỚP** | BE có `PUT /api/v1/admin/categories/{id}` nhận `UpdateCategoryRequest`. | Gắn thẳng |
| Xóa danh mục | Chưa dựng UI | `DELETE /api/v1/admin/categories/{id}` | **KHỚP** | BE có `DELETE /api/v1/admin/categories/{id}`. | Gắn thẳng |

---

### 6. Màn hình: Khung giờ Flash Sale (`/admin/flash-sale` - Đợt 7)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Xem toàn bộ danh sách phiên Flash Sale (Calendar & List view) | Mock | `GET /api/v1/admin/flash-sales/slots` | **KHỚP** | BE có `GET /api/v1/admin/flash-sales/slots` trả về `List<FlashSaleSlotResponse>`. | Gắn thẳng qua `src/lib/api` |
| Tạo phiên Flash Sale mới | Mock | `POST /api/v1/admin/flash-sales/slots` | **KHỚP** | BE có `POST /api/v1/admin/flash-sales/slots` nhận `CreateFlashSaleSlotRequest` (`name`, `startTime`, `endTime`). | Gắn thẳng |
| Chỉnh sửa phiên Flash Sale | Mock | `PUT /api/v1/admin/flash-sales/slots/{id}` | **KHỚP** | BE có `PUT /api/v1/admin/flash-sales/slots/{id}` nhận `UpdateFlashSaleSlotRequest`. | Gắn thẳng |
| Pre-warm nạp kho Redis trước phiên | Mock | `POST /api/v1/admin/flash-sales/slots/{id}/pre-warm` | **KHỚP** | BE có sẵn endpoint `preWarmSlot`. | Gắn thẳng |

---

### 7. Màn hình: Duyệt sản phẩm Flash Sale (`/admin/flash-sale/approvals` - Đợt 7)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Lấy danh sách SKU đăng ký tham gia Flash Sale theo slot | Mock | `GET /api/v1/admin/flash-sales/slots/{slotId}/items` | **THIẾU** | **BE CHƯA CÓ** endpoint lấy danh sách SKU chờ duyệt cho Admin! | Giữ mock (khi bật cờ mock), viết request BE P0 (`docs/api-requests/admin-flash-sale-approvals.md`) |
| Phê duyệt biến thể Flash Sale (trừ kho gốc nguyên tử) | Mock | `PATCH /api/v1/admin/flash-sales/items/{id}/approve` | **KHỚP** | BE có sẵn `PATCH /api/v1/admin/flash-sales/items/{id}/approve` trả về `FlashSaleItemResponse`. | Gắn thẳng |
| Từ chối duyệt biến thể Flash Sale | Mock | `PATCH /api/v1/admin/flash-sales/items/{id}/reject` | **THIẾU** | BE chưa có endpoint từ chối duyệt (kèm lý do từ chối). | Giữ mock (khi bật cờ mock), viết request BE P0 |
| Phê duyệt hàng loạt SKU | Mock | `POST /api/v1/admin/flash-sales/items/batch-approve` | **THIẾU** | BE chưa có batch approve (FE có thể gọi vòng lặp từng item hoặc BE cung cấp batch). | Viết adapter gọi tuần tự / hoặc request BE batch |

---

### 8. Màn hình: Giám sát Flash Sale Realtime (`/admin/flash-sale/monitor` - Đợt 7)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Kết nối STOMP nhận biến động tồn kho realtime | Real/Mock | Topic `/topic/flash-sale/slot/{slotId}/stock-update` | **KHỚP** | BE có `FlashSaleWsBroadcaster.broadcastStockUpdate` gửi payload `FlashSaleWsEvent`. | Gắn thẳng qua STOMP client |
| Lấy dữ liệu KPI tổng hợp realtime (QPS, Anti-oversold status, tổng doanh thu realtime) | Mock | `GET /api/v1/admin/flash-sales/monitoring?slotId=...` | **THIẾU** | BE chưa có REST endpoint tính toán tổng hợp telemetry. | Giữ mock (khi bật cờ mock), viết request BE P0 (`docs/api-requests/admin-flash-sale-monitor.md`) |
| Dừng khẩn cấp phiên Flash Sale (Emergency Pause) | Mock | `POST /api/v1/admin/flash-sales/slots/{id}/pause` | **THIẾU** | BE chưa có tính năng tạm dừng khẩn cấp slot. | Giữ mock (khi bật cờ mock), viết request BE P0 |

---

### 9. Màn hình: Voucher sàn (`/admin/vouchers` - Đợt 8)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Lấy danh sách toàn bộ voucher sàn quản trị (Tất cả, Đang chạy, Hết hạn, Đã ẩn) | Mock | `GET /api/v1/admin/vouchers?page=0&size=10` | **THIẾU** | BE chỉ có `GET /api/v1/vouchers/platform` (xem voucher đang mở của sàn), **chưa có endpoint quản trị toàn bộ voucher**. | Giữ mock (khi bật cờ mock), viết request BE P2 (`docs/api-requests/admin-vouchers.md`) |
| Tạo mới voucher sàn | Mock | `POST /api/v1/admin/vouchers` | **KHỚP** | BE có sẵn `POST /api/v1/admin/vouchers` nhận `CreatePlatformVoucherRequest`. | Gắn thẳng |
| Chỉnh sửa / Đổi trạng thái voucher sàn | Mock | `PUT /api/v1/admin/vouchers/{id}` | **THIẾU** | BE chưa có update/toggle voucher cho Admin. | Giữ mock (khi bật cờ mock), viết request BE P2 |
| Xóa voucher sàn | Mock | `DELETE /api/v1/admin/vouchers/{id}` | **THIẾU** | BE chưa có delete voucher. | Giữ mock (khi bật cờ mock), viết request BE P2 |

---

### 10. Màn hình: Đối soát tài chính (`/admin/reconciliation` - Đợt 9)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| Thống kê tổng quan chu kỳ đối soát (GMV, doanh thu ròng sàn, phí thanh toán, tiền giữ lại) | Mock | `GET /api/v1/admin/reconciliation/summary?period=...` | **THIẾU** | **BE HOÀN TOÀN CHƯA CÓ** phân hệ đối soát tài chính (`Reconciliation`). | Giữ mock (khi bật cờ mock), viết request BE P2 (`docs/api-requests/admin-reconciliation.md`) |
| Danh sách đơn hàng đối soát (Tab Orders) | Mock | `GET /api/v1/admin/reconciliation/orders?period=...` | **THIẾU** | BE chưa có API đối soát đơn hàng. | Giữ mock, viết request BE P2 |
| Danh sách hoàn tiền & khiếu nại (Tab Refunds) | Mock | `GET /api/v1/admin/reconciliation/refunds?period=...` | **THIẾU** | BE chưa có API đối soát hoàn tiền. | Giữ mock, viết request BE P2 |
| Biến động số dư ví sàn & shop (Tab Wallet) | Mock | `GET /api/v1/admin/reconciliation/wallet-ledger` | **THIẾU** | BE có bảng `wallets` và `wallet_transactions` nhưng chưa có API truy vấn cho admin. | Giữ mock, viết request BE P2 |
| Chốt kỳ đối soát (Lock Period) | Mock | `POST /api/v1/admin/reconciliation/lock` | **THIẾU** | BE chưa có chức năng chốt kỳ. | Giữ mock, viết request BE P2 |

---

### 11. Màn hình: Phân quyền & Tính năng (`/admin/permissions` - Đợt 9)
| Chức năng | Trạng thái FE hiện tại | Endpoint FE mong đợi | Trạng thái BE | Chi tiết đối chiếu & Lệch (nếu có) | Hành động đề xuất |
|---|---|---|---|---|---|
| **Tab 1: Vai trò hệ thống** (System Roles: Xem danh sách vai trò, số user, tạo/sửa vai trò) | Mock | `GET /api/v1/admin/roles` | **THIẾU** | BE có bảng `roles` và `permissions` ở DB, nhưng chưa có bất kỳ REST Controller nào cho RBAC động. | Giữ mock (khi bật cờ mock), viết request BE P2 (`docs/api-requests/admin-permissions.md`) |
| **Tab 2: Ma trận quyền** (Role Matrix: Bật/tắt từng permission cho từng role) | Mock | `GET /api/v1/admin/permissions/matrix`<br>`PUT /api/v1/admin/permissions/matrix` | **THIẾU** | BE chưa có API ma trận quyền. | Giữ mock, viết request BE P2 |
| **Tab 3: Cờ tính năng** (Feature Flags: Bật/tắt tính năng theo môi trường) | Mock | `GET /api/v1/admin/feature-flags`<br>`PATCH /api/v1/admin/feature-flags/{key}` | **THIẾU** | BE chưa có hệ thống lưu trữ Feature Flags động. | Giữ mock, viết request BE P2 |
| **Tab 4: Kiểm duyệt đánh giá** (Review Moderation: Danh sách đánh giá bị báo cáo, Ẩn/Hiện đánh giá) | Mock | `GET /api/v1/admin/reviews/moderation`<br>`PATCH /api/v1/admin/reviews/{id}/visibility` | **THIẾU** | BE mới có `ProductReviewPublicController` (lấy review công khai theo product). Chưa có API kiểm duyệt cho Admin. | Giữ mock, viết request BE P2 |

---

## III. Bảng Tổng kết Số lượng Trạng thái Tích hợp

| Phân hệ / Màn hình | Tổng chức năng | KHỚP (Gắn được ngay) | LỆCH (Cần Adapter) | THIẾU (Cần viết Request BE) |
|---|:---:|:---:|:---:|:---:|
| **1. Seller Dashboard** | 5 | 3 | 0 | 2 |
| **2. Seller Products** | 7 | 5 | 1 | 1 |
| **3. Seller Product Form (SPU/SKU)** | 6 | 6 | 0 | 0 |
| **4. Seller Flash Sale Register** | 4 | 2 | 0 | 2 |
| **5. Seller Orders** | 6 | 3 | 1 | 2 |
| **6. Admin Overview** | 1 | 0 | 0 | 1 |
| **7. Admin Users** | 3 | 0 | 0 | 3 |
| **8. Admin Stores** | 2 | 1 | 0 | 1 |
| **9. Admin Products toàn sàn** | 2 | 0 | 1 | 1 |
| **10. Admin Categories** | 4 | 4 | 0 | 0 |
| **11. Admin Flash Sale Slots (Đợt 7)** | 4 | 4 | 0 | 0 |
| **12. Admin Flash Sale Approvals (Đợt 7)** | 4 | 1 | 1 | 2 |
| **13. Admin Flash Sale Monitor (Đợt 7)** | 3 | 1 | 0 | 2 |
| **14. Admin Vouchers (Đợt 8)** | 4 | 1 | 0 | 3 |
| **15. Admin Reconciliation (Đợt 9)** | 5 | 0 | 0 | 5 |
| **16. Admin Permissions (Đợt 9 - 4 tab)** | 5 | 0 | 0 | 5 |
| **TỔNG CỘNG** | **65** | **31 (47.7%)** | **4 (6.2%)** | **30 (46.1%)** |
