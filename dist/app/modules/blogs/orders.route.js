"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const globalRateLimiter_1 = require("../../middleware/globalRateLimiter");
const orders_validation_1 = require("./orders.validation");
const orders_controller_1 = require("./orders.controller");
const router = express_1.default.Router();
// Create Order
router.post('/create-orders', (0, auth_1.default)(user_1.ENUM_USER_ROLE.CUSTOMER), globalRateLimiter_1.globalRateLimiter, (0, validateRequest_1.default)(orders_validation_1.OrderValidation.orderSchema), orders_controller_1.OrderController.CreateOrders);
// Get Order by ID
router.get('/get-order/:id', (0, auth_1.default)(user_1.ENUM_USER_ROLE.CUSTOMER, user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), orders_controller_1.OrderController.GetOrderById);
// Get All Orders (Admin)
router.get('/admin/orders', (0, auth_1.default)(user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), orders_controller_1.OrderController.GetAllOrders);
// Get Orders for a User
router.get('/users/:userId/orders', (0, auth_1.default)(user_1.ENUM_USER_ROLE.CUSTOMER, user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), // Authenticated users
orders_controller_1.OrderController.GetOrdersForUser);
// Update Order Status
router.patch('/orders/:id/status', (0, auth_1.default)(user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), (0, validateRequest_1.default)(orders_validation_1.OrderValidation.orderUpdateSchema), orders_controller_1.OrderController.UpdateOrderStatus);
// Cancel Order
router.delete('/orders/:id', (0, auth_1.default)(user_1.ENUM_USER_ROLE.CUSTOMER, user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), // Authenticated users
orders_controller_1.OrderController.CancelOrder // Controller to handle the request
);
// Get Order Analytics (Admin)
router.get('/admin/orders/analytics', (0, auth_1.default)(user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), // Only admins can access
orders_controller_1.OrderController.GetOrderAnalytics // Controller to handle the request
);
// Get Order History for a User
router.get('/users/:userId/order-history', (0, auth_1.default)(user_1.ENUM_USER_ROLE.CUSTOMER, user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), // Authenticated users
orders_controller_1.OrderController.GetOrderHistoryForUser);
router.patch('/admin/orders/bulk-update', (0, auth_1.default)(user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN), // Only admins can access
(0, validateRequest_1.default)(orders_validation_1.OrderValidation.bulkOrderUpdateSchema), // Validate request body
orders_controller_1.OrderController.BulkUpdateOrderStatus);
router.get('/admin/orders/export', 
// auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), // Only admins can access
orders_controller_1.OrderController.ExportOrders);
router.post('/webhook/payment', orders_controller_1.OrderController.HandlePaymentWebhook);
exports.OrderRoutes = router;
