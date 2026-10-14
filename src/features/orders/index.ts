/**
 * Orders feature – public API.
 */

export {
  getOrders,
  getOrderById,
  cancelOrderById,
  getOrdersByCode,
} from "./api";

export {
  useOrders,
  useOrderById,
  useCancelOrder,
  useOrderSuccessByCode,
  useOrderFailedByCode,
  useOrderExpiredByCode,
  orderKeys,
} from "./hooks";

export type {
  BackendOrderSummary,
  BackendOrderDetail,
  BackendOrderItem,
  BackendOrderAddress,
  BackendOrderPageResponse,
  GetOrdersParams,
  CancelOrderRequest,
} from "./api";

export type {
  OrderSuccessView,
  OrderSuccessRow,
  OrderSuccessAddress,
  OrderFailedView,
  OrderFailedVoucherWarning,
  OrderExpiredView,
} from "./types";

export {
  adaptOrdersToSuccessView,
  adaptOrdersToFailedView,
  adaptOrdersToExpiredView,
} from "./types";

export {
  mockOrderSuccessView,
  mockOrderFailedView,
  mockOrderExpiredView,
} from "./mocks";
