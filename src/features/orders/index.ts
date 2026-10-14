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
} from "./types";

export { adaptOrdersToSuccessView } from "./types";

export { mockOrderSuccessView } from "./mocks";
