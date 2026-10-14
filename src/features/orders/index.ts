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
} from "./types";

export { adaptOrdersToSuccessView, adaptOrdersToFailedView } from "./types";

export { mockOrderSuccessView, mockOrderFailedView } from "./mocks";
