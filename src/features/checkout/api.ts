/**
 * Checkout API layer – maps frontend domain types → real backend API.
 *
 * Backend endpoints discovered from http://180.93.137.28/swagger-ui/:
 *
 * | Frontend need            | Backend endpoint                        |
 * |--------------------------|-----------------------------------------|
 * | Checkout snapshot         | GET  /api/v1/cart                      |
 * | Addresses                | GET  /api/v1/users/addresses           |
 * | Submit multi-order       | POST /api/v1/orders/checkout            |
 * | Apply voucher            | POST /api/v1/vouchers/apply            |
 * | Platform vouchers list   | GET  /api/v1/vouchers/platform         |
 * | Shop vouchers list       | GET  /api/v1/vouchers/store/{storeId}  |
 *
 * NOTE: Backend has NO separate /checkout endpoints. Cart IS the checkout
 * snapshot. Payment method is NOT in submit body — ZaloPay handles it.
 */
import { apiFetch } from "@/lib/api";
import type {
  Address,
  ApplyVoucherResponse,
  CheckoutData,
  CheckoutItem,
  CheckoutShopGroup,
  OrderSubmitResponse,
  SubmitOrderRequest,
  Voucher,
} from "./types";

// ─── Backend DTO types (matching Swagger 2026-10-17) ────────────────────────

interface BackendCartItem {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
  // NOTE: stockQuantity sẽ được thêm ở subplan #4 (M.4)
}

interface BackendCartStoreGroup {
  storeId: number;
  storeName: string;
  storeBadge?: "Mall" | "OfficialMall" | "";
  estimatedDeliveryLabel: string;
  shippingMethodLabel: string;
  shippingFee: number;
  items: BackendCartItem[];
  shopSubtotal: number;
}

interface BackendCartResponse {
  id: number;
  userId: number;
  storeGroups: BackendCartStoreGroup[];
  subtotal: number;
  totalShippingFee: number;
  totalItems: number;
  // NOTE: totalAmount + grandTotal sẽ được thêm ở subplan #4 (M.3)
}

interface BackendAddress {
  id: number;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

interface BackendVoucher {
  id: number;
  code: string;
  label: string;
  description: string;
  discountAmount?: number;
  discountPercent?: number;
  maxDiscount?: number;
  minOrderValue?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Request body cho POST /vouchers/apply theo Swagger 2026-10-17.
 * Required: code, subtotalAmount. Optional: storeId.
 * (Trước đây FE gửi { orderAmount, voucherCode, storeId? } — đã refactor.)
 */
interface BackendApplyVoucherRequest {
  code: string;
  subtotalAmount: number;
  storeId?: number;
}

/**
 * Response từ POST /vouchers/apply theo Swagger 2026-10-17.
 * BE trả ApiResponse<VoucherCalculationResponse>, apiFetch unwrap 1 lần
 * → FE nhận trực tiếp VoucherCalculationResponse.
 * KHÔNG còn full voucher object — chỉ có id + code + 2 số tiền.
 */
interface BackendVoucherCalculation {
  voucherId: number;
  code: string;
  discountAmount: number;
  finalAmount: number;
}

interface BackendOrderItem {
  id: number;
  variantId: number;
  productName: string;
  variantName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface BackendOrder {
  id: number;
  orderCode: string;
  storeId: number;
  storeName: string;
  status: string;
  paymentStatus: string;
  items: BackendOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentUrl?: string;
  qrCodeUrl?: string;
  paymentExpiry?: string;
}

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptAddress(a: BackendAddress): Address {
  return {
    id: a.id,
    recipientName: a.recipientName,
    phone: a.phone,
    street: a.street,
    ward: a.ward,
    district: a.district,
    city: a.province,
    isDefault: a.isDefault,
  };
}

function adaptCartItem(i: BackendCartItem): CheckoutItem {
  return {
    id: i.id,
    variantId: i.variantId,
    productName: i.productName,
    variantName: i.variantName,
    imageUrl: i.imageUrl,
    price: i.price,
    quantity: i.quantity,
    itemSubtotal: i.subtotal,
  };
}

function adaptShopGroup(g: BackendCartStoreGroup): CheckoutShopGroup {
  return {
    storeId: g.storeId,
    storeName: g.storeName,
    storeBadge: g.storeBadge,
    estimatedDeliveryLabel: g.estimatedDeliveryLabel,
    shippingMethodLabel: g.shippingMethodLabel,
    shippingFee: g.shippingFee,
    items: g.items.map(adaptCartItem),
    shopSubtotal: g.shopSubtotal,
  };
}

function adaptVoucher(
  v: BackendVoucher,
  scope: "SHOP" | "PLATFORM" = "PLATFORM",
): Voucher {
  const endDate = v.endDate ? new Date(v.endDate) : null;
  const hasExpired = endDate ? endDate < new Date() : false;

  let discountLabel = "";
  if (v.discountAmount) {
    discountLabel = `${v.discountAmount.toLocaleString("vi-VN")}₫`;
  } else if (v.discountPercent) {
    discountLabel = `${(v.discountPercent * 100).toFixed(0)}%`;
    if (v.maxDiscount) {
      discountLabel += ` (tối đa ${v.maxDiscount.toLocaleString("vi-VN")}₫)`;
    }
  }

  return {
    id: v.id,
    code: v.code,
    label: v.label,
    shortDescription: v.description,
    scope,
    discountAmount: v.discountAmount,
    discountPercent: v.discountPercent,
    maxDiscount: v.maxDiscount,
    minOrderValue: v.minOrderValue,
    expiresAt: v.endDate,
    expiresAtLabel: endDate
      ? endDate.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : undefined,
    status: hasExpired ? "EXPIRED" : "ACTIVE",
    discountLabel,
    isDisabled: hasExpired,
    disabledReason: hasExpired ? "Mã đã hết hạn" : undefined,
  };
}

function adaptOrderResponse(
  orders: BackendOrder[],
  paymentMethod: "ZALOPAY" | "COD",
): OrderSubmitResponse {
  // Primary order = the one with the highest amount (first in list)
  const primary = orders[0] ?? orders[0];
  return {
    orderCode: orders.map((o) => o.orderCode).join(", "),
    paymentUrl: primary?.paymentUrl,
    qrCodeUrl: primary?.qrCodeUrl,
    expiresAt: primary?.paymentExpiry,
    status:
      paymentMethod === "COD"
        ? ("PENDING_PAYMENT" as const)
        : primary?.paymentStatus === "SUCCESS"
          ? ("PAID" as const)
          : ("PENDING_PAYMENT" as const),
    orderIds: orders.map((o) => o.id),
  };
}

/** Cart → CheckoutData adapter. Assumes default address will be set by caller. */
function adaptCartToCheckout(
  cart: BackendCartResponse,
  addresses: Address[],
  paymentMethod: "ZALOPAY" | "COD" = "ZALOPAY",
): CheckoutData {
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const shopGroups = cart.storeGroups.map(adaptShopGroup);
  const goodsSubtotal = cart.subtotal;
  const shippingFee = cart.totalShippingFee;
  const totalDiscount = 0; // No vouchers applied yet
  const grandTotal = goodsSubtotal + shippingFee - totalDiscount;

  return {
    id: String(cart.id),
    userId: cart.userId,
    selectedAddress: defaultAddr,
    addresses,
    shopGroups,
    goodsSubtotal,
    shippingFee,
    totalDiscount,
    grandTotal,
    appliedPlatformVoucher: null,
    paymentMethod,
    totalItems: cart.totalItems,
    totalOrders: shopGroups.length,
  };
}

// ─── API functions ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/cart – cart snapshot used as checkout data.
 * Backend does NOT have a separate /checkout endpoint.
 */
export async function getCart(): Promise<BackendCartResponse> {
  return apiFetch<BackendCartResponse>("/api/v1/cart");
}

/** GET /api/v1/users/addresses */
export async function getAddresses(): Promise<Address[]> {
  const res = await apiFetch<
    { data: BackendAddress[] } | BackendAddress[]
  >("/api/v1/users/addresses");
  const list = Array.isArray(res) ? res : res.data;
  return list.map(adaptAddress);
}

/**
 * GET /api/v1/vouchers/platform – platform vouchers available to user.
 */
export async function getPlatformVouchers(): Promise<Voucher[]> {
  const res = await apiFetch<{ data: BackendVoucher[] } | BackendVoucher[]>(
    "/api/v1/vouchers/platform",
  );
  const list = Array.isArray(res) ? res : res.data;
  return list.map((v) =>
    adaptVoucher({ ...v, label: v.label || v.description }, "PLATFORM"),
  );
}

/**
 * GET /api/v1/vouchers/store/{storeId} – shop vouchers for a specific store.
 */
export async function getShopVouchers(storeId: number): Promise<Voucher[]> {
  const res = await apiFetch<{ data: BackendVoucher[] } | BackendVoucher[]>(
    `/api/v1/vouchers/store/${storeId}`,
  );
  const list = Array.isArray(res) ? res : res.data;
  return list.map((v) =>
    adaptVoucher({ ...v, label: v.label || v.description }, "SHOP"),
  );
}

/**
 * getAvailableVouchers – alias for selecting between platform & shop voucher lists.
 * Used by useAvailableVouchers hook.
 */
export async function getAvailableVouchers(input: {
  scope: "SHOP" | "PLATFORM";
  storeId?: number;
}): Promise<Voucher[]> {
  if (input.scope === "PLATFORM") return getPlatformVouchers();
  if (input.storeId) return getShopVouchers(input.storeId);
  return [];
}

/**
 * POST /api/v1/vouchers/apply – validate and preview voucher application.
 *
 * Swagger 2026-10-17:
 * - Request:  { code, subtotalAmount, storeId? } (required: code, subtotalAmount)
 * - Response: { voucherId, code, discountAmount, finalAmount }
 *
 * FE tự build `applied` = (discountAmount > 0).
 * Caller cần match voucher trong cache theo `code` để có full Voucher object
 * cho UI (vì BE response KHÔNG trả full voucher).
 */
export async function applyVoucher(input: {
  voucherCode: string;
  orderAmount: number;
  storeId?: number;
}): Promise<ApplyVoucherResponse> {
  const body: BackendApplyVoucherRequest = {
    code: input.voucherCode,
    subtotalAmount: input.orderAmount,
  };
  if (input.storeId !== undefined) {
    body.storeId = input.storeId;
  }

  const calc = await apiFetch<BackendVoucherCalculation>(
    "/api/v1/vouchers/apply",
    {
      method: "POST",
      json: body,
    },
  );

  const applied = calc.discountAmount > 0;
  return {
    applied,
    voucherId: calc.voucherId,
    code: calc.code,
    discountAmount: calc.discountAmount,
    finalAmount: calc.finalAmount,
    // Backward-compat aliases:
    grandTotal: calc.finalAmount,
    totalDiscount: calc.discountAmount,
    // Stub Voucher tối thiểu để tránh null/undefined ở caller cũ.
    // Caller NÊN match voucher trong cache theo `code` để có full info.
    voucher: adaptVoucher(
      {
        id: calc.voucherId,
        code: calc.code,
        label: calc.code,
        description: calc.code,
      },
      input.storeId ? "SHOP" : "PLATFORM",
    ),
  };
}

/**
 * POST /api/v1/orders/checkout – submit multi-shop cart as separate orders.
 *
 * Backend request (from Swagger):
 * {
 *   shippingAddressId: number,
 *   storeOrders: [{
 *     storeId: number,
 *     items: [{ variantId: number, quantity: number }],
 *     voucherCode?: string
 *   }]
 * }
 *
 * Idempotency-Key sent via header (rule §8 mục 3).
 */
export async function submitOrder(
  payload: SubmitOrderRequest,
  idempotencyKey: string,
): Promise<OrderSubmitResponse> {
  // Build storeOrders from shopSelections
  const storeOrders = payload.shopSelections.map((s) => ({
    storeId: s.storeId,
    voucherCode: s.shopVoucherCode,
  }));

  const body = {
    shippingAddressId: payload.addressId,
    platformVoucherCode: payload.platformVoucherCode,
    storeOrders,
  };

  const res = await apiFetch<{ data: BackendOrder[] }>(
    "/api/v1/orders/checkout",
    {
      method: "POST",
      json: body,
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );

  return adaptOrderResponse(res.data, payload.paymentMethod);
}

/**
 * getCheckout – builds CheckoutData from cart + addresses.
 * This replaces the non-existent /checkout endpoint.
 */
export async function getCheckout(): Promise<CheckoutData> {
  const [cart, addresses] = await Promise.all([
    getCart(),
    getAddresses(),
  ]);
  return adaptCartToCheckout(cart, addresses, "ZALOPAY");
}

// ─── QR payment page data layer ───────────────────────────────────────────

import type { QrOrderDetail } from "./types";

export type { QrOrderDetail } from "./types";

/**
 * GET /api/v1/orders/{orderCode}/qr – fetch the held order detail used
 * to render the QR payment page. Falls back to a mock if the backend
 * route is not yet available (rule §7 — wire to real API when ready).
 */
export async function getOrderForQr(orderCode: string): Promise<QrOrderDetail> {
  return apiFetch<QrOrderDetail>(
    `/api/v1/orders/${encodeURIComponent(orderCode)}/qr`,
  );
}

// ─── Re-export types for external use ──────────────────────────────────────
export type { BackendCartResponse, BackendAddress, BackendVoucher };
