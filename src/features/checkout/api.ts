/**
 * Checkout API layer – wrapper qua apiFetch (rule api-data).
 *
 * NOTE: Backend hiện chưa có endpoint checkout (xem
 * docs/superpowers/handoffs/2026-10-13-backend-gap-report.md P0).
 * Khi BE sẵn sàng: thay URL tại đây, DTO types đã sẵn – không cần đổi hook.
 */
import { apiFetch } from "@/lib/api";
import { mockCheckoutData } from "./mocks";
import type {
  Address,
  ApplyVoucherResponse,
  CheckoutData,
  CheckoutShopGroup,
  OrderSubmitResponse,
  SubmitOrderRequest,
  Voucher,
} from "./types";

/**
 * `GET /api/v1/checkout` – lấy snapshot checkout của user hiện tại
 * (selected address, vouchers, grouped items, totals).
 *
 * Tạm thời trả mock cho đến khi BE sẵn sàng.
 */
export async function getCheckout(): Promise<CheckoutData> {
  // Khi BE sẵn: return apiFetch<CheckoutData>("/checkout");
  return Promise.resolve(mockCheckoutData);
}

/** `GET /api/v1/checkout/addresses` – danh sách địa chỉ user. */
export async function getAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>("/checkout/addresses");
}

/**
 * `PUT /api/v1/checkout/address` – chọn địa chỉ nhận hàng.
 * Backend sẽ tính lại phí ship dựa trên ward/city (rule: không tin client).
 */
export async function selectAddress(addressId: number): Promise<CheckoutData> {
  return apiFetch<CheckoutData>("/checkout/address", {
    method: "PUT",
    json: { addressId },
  });
}

/**
 * `POST /api/v1/checkout/apply-voucher` – áp dụng voucher (shop hoặc sàn).
 * Trả về `applied: false` + `reasonCode` nếu không đủ điều kiện.
 */
export async function applyVoucher(input: {
  voucherId: number;
  scope: "SHOP" | "PLATFORM";
  storeId?: number;
}): Promise<ApplyVoucherResponse> {
  return apiFetch<ApplyVoucherResponse>("/checkout/apply-voucher", {
    method: "POST",
    json: input,
  });
}

/** `DELETE /api/v1/checkout/voucher` – gỡ voucher (shop hoặc sàn). */
export async function removeVoucher(input: {
  scope: "SHOP" | "PLATFORM";
  storeId?: number;
}): Promise<CheckoutData> {
  return apiFetch<CheckoutData>("/checkout/voucher", {
    method: "DELETE",
    json: input,
  });
}

/**
 * `PUT /api/v1/checkout/payment-method` – đổi phương thức thanh toán
 * (mặc định ZaloPay QR – rule §8 mục 3).
 */
export async function setPaymentMethod(
  paymentMethod: "ZALOPAY" | "COD",
): Promise<CheckoutData> {
  return apiFetch<CheckoutData>("/checkout/payment-method", {
    method: "PUT",
    json: { paymentMethod },
  });
}

/** `PUT /api/v1/checkout/buyer-note` – cập nhật lời nhắn cho shop. */
export async function updateBuyerNote(input: {
  storeId: number;
  note: string;
}): Promise<CheckoutShopGroup> {
  return apiFetch<CheckoutShopGroup>("/checkout/buyer-note", {
    method: "PUT",
    json: input,
  });
}

/**
 * `POST /api/v1/checkout/submit` – đặt đơn.
 * Backend sẽ:
 *  - reserve stock (rule §8 mục 3)
 *  - tách N đơn theo N shop
 *  - trả thông tin payment URL / QR cho ZaloPay
 *
 * Caller phải truyền `Idempotency-Key` (uuid v4) để chống double-submit.
 */
export async function submitOrder(
  payload: SubmitOrderRequest,
  idempotencyKey: string,
): Promise<OrderSubmitResponse> {
  return apiFetch<OrderSubmitResponse>("/checkout/submit", {
    method: "POST",
    json: payload,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
}

/**
 * Lấy danh sách voucher khả dụng (để hiển thị modal chọn).
 * Lúc này trả mock – filter theo storeId khi scope = 'SHOP'.
 */
export async function getAvailableVouchers(input: {
  scope: "SHOP" | "PLATFORM";
  storeId?: number;
}): Promise<Voucher[]> {
  // Khi BE sẵn:
  // return apiFetch<Voucher[]>("/checkout/available-vouchers", {
  //   method: "GET",
  //   query: { scope: input.scope, storeId: input.storeId },
  // });
  const { mockPlatformVouchers, mockShopVouchers } = await import("./mocks");
  if (input.scope === "PLATFORM") return mockPlatformVouchers;
  return mockShopVouchers;
}
