// Checkout feature public API (rule features-migration)
export type {
  Address,
  PaymentMethod,
  CheckoutItem,
  CheckoutShopGroup,
  Voucher,
  CheckoutData,
  ApplyVoucherResponse,
  SubmitOrderRequest,
  OrderSubmitResponse,
  QrOrderDetail,
} from "./types";
export type {
  PaymentResponse,
  PaymentStatus,
  PaymentStatusEvent,
  ApiResponse as PaymentApiResponse,
} from "./payment.types";
export {
  getCheckout,
  getAddresses,
  applyVoucher,
  submitOrder,
  getAvailableVouchers,
  getPlatformVouchers,
  getShopVouchers,
  getOrderForQr,
} from "./api";
export {
  paymentEndpoints,
  createZaloPayPayment,
  getOrderPayment as getOrderPaymentApi,
  queryZaloPayPayment as queryZaloPayPaymentApi,
  queryZaloPayPaymentByCode as queryZaloPayPaymentByCodeApi,
  confirmCodPaymentByCode as confirmCodPaymentByCodeApi,
  confirmCodPaymentByCode,
} from "./payment.api";
export {
  checkoutKeys,
  useCheckout,
  useAddresses,
  useAvailableVouchers,
  useApplyVoucherMutation,
  useSubmitOrderMutation,
  useOrderForQr,
} from "./hooks";
export {
  paymentKeys,
  useCreateZaloPayPayment,
  useOrderPayment,
  useQueryZaloPayPayment,
  useQueryZaloPayPaymentByCode,
  useOrderPaymentByCode,
} from "./usePayment";
export {
  isPendingPaymentStatus,
  isSucceededPaymentStatus,
  isFailedPaymentStatus,
} from "./payment.types";
export {
  mockCheckoutData,
  mockAddresses,
  mockShopVouchers,
  mockPlatformVouchers,
  mockQrOrderDetail,
} from "./mocks";
