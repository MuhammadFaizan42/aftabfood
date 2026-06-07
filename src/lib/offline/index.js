export {
  bootstrapMasterData,
  getCachedProducts,
  getCachedCustomers,
  getCachedCustomerDashboard,
  loadCustomerDashboard,
  cacheCustomerDashboard,
  cacheCustomers,
  cacheExistingOrders,
  getCachedExistingOrders,
  cacheOrderDetail,
  getCachedOrderDetail,
} from "./bootstrapLoader";
export { enqueueOrder, getPendingOrders, getAllOrders, getOrder, removeOrder, generateUUID } from "./orderQueue";
export { syncPendingOrders, onSyncComplete } from "./syncManager";
export { useOnlineStatus } from "./useOnlineStatus";
export {
  getOfflineCart,
  getOfflineCartForCustomer,
  getOfflineCartSyncForCustomer,
  setOfflineCart,
  addToOfflineCart,
  updateOfflineCartItem,
  removeFromOfflineCart,
  clearOfflineCart,
  clearOfflineCartIfCustomerMismatch,
  offlineCartCustomerMatches,
  normalizeOfflineCartCustomerId,
} from "./offlineCart";
