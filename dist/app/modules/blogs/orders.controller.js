"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const orders_service_1 = require("./orders.service");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enums/user");
/**
 * AddOrders Controller
 * Handles the creation of a new product.
 */
const CreateOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        throw new apiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'User ID is missing');
    }
    // Add userId to the order data
    const orderData = Object.assign(Object.assign({}, req.body), { userId });
    // Call the service to create the order
    const result = yield orders_service_1.OrderService.CreateOrders(orderData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order placing successfully',
        data: result,
    });
}));
/**
 * GetProductById Controller
 * Handles retrieving a single product by ID.
 */
const GetOrderById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { id } = req.params;
    if (!userId) {
        throw new apiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'User ID is missing');
    }
    // Validate if the id is a valid ObjectId
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid order ID');
    }
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userRole;
    // Add userId to the order data
    const getOrderData = { id, userId, userRole };
    const result = yield orders_service_1.OrderService.GetProductById(getOrderData);
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Order not found',
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product retrieved successfully',
        data: result,
    });
}));
/**
 * GetOrders Controller
 * Handles retrieving all Orders.
 */
const GetAllOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract query parameters for pagination and filtering
    const { paginationOptions, filters } = (0, paginationHelpers_1.getPaginationAndFilters)(req);
    // Call the service to get Orders with pagination and filters
    const result = yield orders_service_1.OrderService.GetAllOrders(paginationOptions, filters);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: {
            data: result.data,
            meta: result.meta,
        },
    });
}));
const GetOrdersForUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { userId } = req.params; // Extract userId from route parameters
    const requestingUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Extract userId of the requesting user
    const requestingUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role; // Extract role of the requesting user
    // Ensure that a customer can only access their own orders
    if (requestingUserRole === user_1.ENUM_USER_ROLE.CUSTOMER && requestingUserId !== userId) {
        throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to access these orders');
    }
    // Call the service to fetch orders for the user
    const result = yield orders_service_1.OrderService.GetOrdersForUser(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
}));
/**
 * UpdateOrders Controller
 * Handles updating an existing product by ID.
 */
const UpdateOrderStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: orderId } = req.params;
    const { status } = req.body;
    // Call the service to update the order status
    const updatedOrder = yield orders_service_1.OrderService.UpdateOrderStatus(orderId, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder,
    });
}));
const CancelOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id: orderId } = req.params; // Extract orderId from route parameters
    const requestingUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Extract userId of the requesting user
    const requestingUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role; // Extract role of the requesting user
    // Call the service to cancel the order
    const result = yield orders_service_1.OrderService.CancelOrder(orderId, requestingUserId, requestingUserRole);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order cancelled successfully',
        data: result,
    });
}));
const GetOrderAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Call the service to fetch order analytics
    const analytics = yield orders_service_1.OrderService.GetOrderAnalytics();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order analytics retrieved successfully',
        data: analytics,
    });
}));
const GetOrderHistoryForUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { userId } = req.params; // Extract userId from route parameters
    const requestingUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Extract userId of the requesting user
    const requestingUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role; // Extract role of the requesting user
    // Ensure that a customer can only access their own order history
    if (requestingUserRole === user_1.ENUM_USER_ROLE.CUSTOMER && requestingUserId !== userId) {
        throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to access this order history');
    }
    // Call the service to fetch order history
    const result = yield orders_service_1.OrderService.GetOrderHistoryForUser(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order history retrieved successfully',
        data: result,
    });
}));
const BulkUpdateOrderStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderIds, status } = req.body; // Extract order IDs and status from request body
    // Call the service to bulk update order status
    const result = yield orders_service_1.OrderService.BulkUpdateOrderStatus(orderIds, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order status updated successfully',
        data: result,
    });
}));
const ExportOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Call the service to export orders
    const filePath = yield orders_service_1.OrderService.ExportOrders();
    // Send the file as a response
    res.download(filePath, 'orders_export.csv', (err) => {
        if (err) {
            console.error('Failed to download file:', err);
            res.status(500).send('Failed to download file');
        }
    });
}));
const HandlePaymentWebhook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body; // Extract payload from payment gateway
    // Call the service to handle the payment webhook
    yield orders_service_1.OrderService.HandlePaymentWebhook(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Webhook processed successfully',
    });
}));
exports.OrderController = {
    CreateOrders,
    GetOrderById,
    GetAllOrders,
    GetOrdersForUser,
    UpdateOrderStatus,
    CancelOrder,
    GetOrderAnalytics,
    GetOrderHistoryForUser,
    BulkUpdateOrderStatus,
    ExportOrders,
    HandlePaymentWebhook
};
