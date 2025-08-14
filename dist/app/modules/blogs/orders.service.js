"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.OrderService = void 0;
const json2csv_1 = require("json2csv");
const orders_interface_1 = require("./orders.interface");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const http_status_1 = __importDefault(require("http-status"));
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const mongoose_1 = __importStar(require("mongoose"));
const path_1 = __importDefault(require("path"));
const orders_model_1 = require("./orders.model");
const products_model_1 = require("../products/products.model");
const user_1 = require("../../../enums/user");
const fs_1 = __importDefault(require("fs"));
const generateCustomId = (orderId) => {
    return `COD-${orderId}`; // Example: COD-65f2a7c9e4b0a12345678901
};
/**
 * AddOrders Services
 * Handles the creation of a new Order.
 */
const CreateOrders = (orderData) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Validate required fields
        if (!orderData.userId || !orderData.products || !orderData.payment || !orderData.shippingAddress) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Required fields are missing in Order data');
        }
        // For non-COD orders, ensure transactionId is provided and status is "complete"
        if (orderData.payment.method !== orders_interface_1.PaymentMethod.CASH_ON_DELIVERY) {
            if (!orderData.payment.transactionId) {
                throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Transaction ID is required for non-Cash on Delivery orders');
            }
            if (orderData.payment.status !== orders_interface_1.PaymentStatus.COMPLETED) {
                throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Payment status must be "complete" for non-Cash on Delivery orders');
            }
            // Check if transactionId is duplicate
            const isDuplicateTransaction = yield orders_model_1.Orders.findOne({
                'payment.transactionId': orderData.payment.transactionId,
            }).session(session);
            if (isDuplicateTransaction) {
                throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Transaction ID already exists');
            }
        }
        // Fetch all products in a single query
        const productIds = orderData.products.map(p => new mongoose_1.Types.ObjectId(p.productId));
        const products = yield products_model_1.Products.find({ _id: { $in: productIds } }).session(session);
        // Validate stock and prepare updates
        const stockUpdates = [];
        for (const product of orderData.products) {
            const productId = typeof product.productId === 'string' ? new mongoose_1.Types.ObjectId(product.productId) : product.productId; // Handle both string and ObjectId
            const dbProduct = products.find(p => p._id.equals(productId));
            if (!dbProduct || dbProduct.inventory.curStock < product.quantity) {
                throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for product ${product.name}`);
            }
            stockUpdates.push({
                updateOne: {
                    filter: { _id: productId },
                    update: { $inc: { "inventory.curStock": -product.quantity } },
                },
            });
        }
        // Update stock levels in bulk
        yield products_model_1.Products.bulkWrite(stockUpdates, { session });
        // Create the order
        const createdOrder = yield orders_model_1.Orders.create([orderData], { session });
        if (!createdOrder) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Order could not be created');
        }
        // For COD, generate a custom transactionId after order creation
        if (orderData.payment.method === 'cash_on_delivery') {
            createdOrder[0].payment.transactionId = generateCustomId(createdOrder[0]._id);
            yield createdOrder[0].save({ session });
        }
        yield session.commitTransaction();
        session.endSession();
        return createdOrder[0];
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const GetProductById = (getOrderData) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, userId, userRole } = getOrderData;
    // Define the query based on user role
    const query = userRole === user_1.ENUM_USER_ROLE.CUSTOMER ? { _id: id, userId } : { _id: id };
    const Order = yield orders_model_1.Orders.findOne(query).select('-__v'); // Exclude unnecessary fields
    if (!Order) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    return Order;
});
/**
 * GetOrders Services
 * Handles retrieving all Orders.
 */
const GetAllOrders = (paginationOptions, filters) => __awaiter(void 0, void 0, void 0, function* () {
    // Calculate pagination options
    const { skip, limit, sortBy, sortOrder } = (0, paginationHelpers_1.calculatePagination)(paginationOptions);
    // Define sorting conditions
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder;
    }
    // Define filtering conditions
    const andConditions = [];
    // Search by multiple fields
    if (filters.searchTerm) {
        andConditions.push({
            $or: [
                { 'user.name': { $regex: filters.searchTerm, $options: 'i' } },
                { 'payment.transactionId': { $regex: filters.searchTerm, $options: 'i' } },
            ],
        });
    }
    // Filter by price range (applied to pricing.defaultPrice, pricing.cost, and pricing.salePrice)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceCondition = {};
        if (filters.minPrice !== undefined)
            priceCondition.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined)
            priceCondition.$lte = filters.maxPrice;
        // Apply the price condition to defaultPrice, cost, and salePrice
        andConditions.push({
            totalAmount: priceCondition,
        });
    }
    if (filters.orderStatus) {
        andConditions.push({ orderStatus: filters.orderStatus });
    }
    // Filter by payment status
    if (filters.paymentStatus) {
        andConditions.push({ 'payment.status': filters.paymentStatus });
    }
    // Filter by date range
    if (filters.startDate && filters.endDate) {
        andConditions.push({
            createdAt: {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate),
            },
        });
    }
    // Combine filtering conditions
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    // Fetch Orders with pagination, sorting, and filtering
    const Order = yield orders_model_1.Orders.find(whereConditions)
        .sort(sortConditions)
        .skip(skip)
        .limit(limit)
        .exec();
    // Get the total count of Orders (for pagination metadata)
    const total = yield orders_model_1.Orders.countDocuments(whereConditions);
    // Throw an error if no Orders are found
    if (orders_model_1.Orders.length === 0) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'No Orders found');
    }
    return {
        data: Order,
        meta: {
            page: paginationOptions.page || 1,
            limit,
            total,
        },
    };
});
const GetOrdersForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch orders for the user
    const orders = yield orders_model_1.Orders.find({ userId }).exec();
    // Throw an error if no orders are found
    if (orders.length === 0) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'No orders found for this user');
    }
    return orders;
});
/**
 * UpdateOrders Service
 * Update a single Order by ID.
 */
const UpdateOrderStatus = (orderId, status) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the order by ID
    const order = yield orders_model_1.Orders.findById(orderId);
    // Throw an error if the order is not found
    if (!order) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    // Update the order status
    order.orderStatus = status;
    yield order.save();
    return order;
});
/**
 * DeleteOrders Service
 * Update a single Order by ID.
 */
const CancelOrder = (orderId, requestingUserId, requestingUserRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the order by ID
    const order = yield orders_model_1.Orders.findById(orderId);
    // Throw an error if the order is not found
    if (!order) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    // Ensure that a customer can only cancel their own orders
    if (requestingUserRole === user_1.ENUM_USER_ROLE.CUSTOMER && order.userId.toString() !== requestingUserId) {
        throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to cancel this order');
    }
    // Check if the order is already cancelled
    if (order.orderStatus === 'cancelled') {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Order is already cancelled');
    }
    // Update the order status to "cancelled"
    order.orderStatus = 'cancelled';
    yield order.save();
    return order;
});
const GetOrderAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Total number of orders
    const totalOrders = yield orders_model_1.Orders.countDocuments();
    // Number of orders by status
    const ordersByStatus = yield orders_model_1.Orders.aggregate([
        {
            $group: {
                _id: '$orderStatus',
                count: { $sum: 1 },
            },
        },
    ]);
    // Total revenue
    const totalRevenueResult = yield orders_model_1.Orders.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
            },
        },
    ]);
    const totalRevenue = ((_a = totalRevenueResult[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    // Orders over time (e.g., daily, weekly, monthly)
    const ordersOverTime = yield orders_model_1.Orders.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
        },
    ]);
    return {
        totalOrders,
        ordersByStatus,
        totalRevenue,
        averageOrderValue,
        ordersOverTime,
    };
});
const GetOrderHistoryForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch orders for the user
    const orders = yield orders_model_1.Orders.find({ userId })
        .sort({ createdAt: -1 }) // Sort by most recent orders first
        .exec();
    // Throw an error if no orders are found
    if (orders.length === 0) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'No order history found for this user');
    }
    return orders;
});
const BulkUpdateOrderStatus = (orderIds, status) => __awaiter(void 0, void 0, void 0, function* () {
    // Update the status of multiple orders
    const result = yield orders_model_1.Orders.updateMany({ _id: { $in: orderIds } }, // Filter by order IDs
    { $set: { orderStatus: status } } // Update status
    ).exec();
    if (result.modifiedCount === 0) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'No orders found or updated');
    }
    // Fetch the updated orders
    const updatedOrders = yield orders_model_1.Orders.find({ _id: { $in: orderIds } }).exec();
    return updatedOrders;
});
const ExportOrders = () => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch all orders
    const orders = yield orders_model_1.Orders.find().exec();
    // Convert orders to CSV format
    const fields = ['_id', 'userId', 'totalAmount', 'orderStatus', 'createdAt'];
    const parser = new json2csv_1.Parser({ fields }); // Create a new Parser instance
    const csv = parser.parse(orders); // Convert orders to CSV
    // Define the file path
    const exportsDir = path_1.default.join(__dirname, '../../exports');
    const filePath = path_1.default.join(exportsDir, 'orders_export.csv');
    // Create the exports directory if it doesn't exist
    if (!fs_1.default.existsSync(exportsDir)) {
        fs_1.default.mkdirSync(exportsDir, { recursive: true });
    }
    // Save the CSV file
    fs_1.default.writeFileSync(filePath, csv); // Write CSV to file
    return filePath; // Return the file path
});
const HandlePaymentWebhook = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, status } = payload;
    // Find the order by ID
    const order = yield orders_model_1.Orders.findById(orderId);
    if (!order) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    // Update the payment status
    order.payment.status = status;
    yield order.save();
});
exports.OrderService = {
    CreateOrders,
    GetProductById,
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
