import { Parser } from 'json2csv';

import { IOrderFilters, IOrders, PaymentMethod, PaymentStatus, OrderStatus, IOrderAnalytics } from './orders.interface';
import ApiError from '../../../errors/apiErrors';
import httpStatus from 'http-status';
import { calculatePagination, IPaginationOptions } from '../../../helpers/paginationHelpers';
import mongoose, { SortOrder, Types } from 'mongoose';
import path from 'path';
import { Orders } from './orders.model';
import { Products } from '../products/products.model';
import { ENUM_USER_ROLE } from '../../../enums/user';
import fs from 'fs';


const generateCustomId = (orderId: string): string => {
  return `COD-${orderId}`; // Example: COD-65f2a7c9e4b0a12345678901
};
/**
 * AddOrders Services
 * Handles the creation of a new Order.
 */
const CreateOrders = async (orderData: IOrders): Promise<IOrders | null> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate required fields
    if (!orderData.userId || !orderData.products || !orderData.payment || !orderData.shippingAddress) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Required fields are missing in Order data');
    }

    // For non-COD orders, ensure transactionId is provided and status is "complete"
    if (orderData.payment.method !== PaymentMethod.CASH_ON_DELIVERY) {
      if (!orderData.payment.transactionId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Transaction ID is required for non-Cash on Delivery orders');
      }
      if (orderData.payment.status !== PaymentStatus.COMPLETED) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment status must be "complete" for non-Cash on Delivery orders');
      }

      // Check if transactionId is duplicate
      const isDuplicateTransaction = await Orders.findOne({
        'payment.transactionId': orderData.payment.transactionId,
      }).session(session);

      if (isDuplicateTransaction) {
        throw new ApiError(httpStatus.CONFLICT, 'Transaction ID already exists');
      }
    }

    // Fetch all products in a single query
    const productIds = orderData.products.map(p => new Types.ObjectId(p.productId)); 
    const products = await Products.find({ _id: { $in: productIds } }).session(session);

    // Validate stock and prepare updates
    const stockUpdates = [];
    for (const product of orderData.products) {
      const productId = typeof product.productId === 'string' ? new Types.ObjectId(product.productId) : product.productId; // Handle both string and ObjectId
      const dbProduct = products.find(p => p._id.equals(productId));
      if (!dbProduct || dbProduct.inventory.curStock < product.quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock for product ${product.name}`);
      }
      stockUpdates.push({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { "inventory.curStock": -product.quantity } },
        },
      });
    }

    // Update stock levels in bulk
    await Products.bulkWrite(stockUpdates, { session });

    // Create the order
    const createdOrder = await Orders.create([orderData], { session });
    if (!createdOrder) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Order could not be created');
    }

    // For COD, generate a custom transactionId after order creation
    if (orderData.payment.method === 'cash_on_delivery') {
      createdOrder[0].payment.transactionId = generateCustomId(createdOrder[0]._id);
      await createdOrder[0].save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return createdOrder[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


const GetProductById = async (getOrderData: { id: string; userId: string; userRole: string }): Promise<IOrders | null> => {
  const { id, userId, userRole } = getOrderData;

  // Define the query based on user role
  const query = userRole === ENUM_USER_ROLE.CUSTOMER ? { _id: id, userId } : { _id: id };

  const Order = await Orders.findOne(query).select('-__v'); // Exclude unnecessary fields
  if (!Order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return Order;
};
/**
 * GetOrders Services
 * Handles retrieving all Orders.
 */
const GetAllOrders = async (
  paginationOptions: IPaginationOptions,
  filters: IOrderFilters
): Promise<{
  data: IOrders[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}> => {
  // Calculate pagination options
  const { skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);


   // Define sorting conditions
   const sortConditions: { [key: string]: SortOrder } = {};
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
    const priceCondition: { $gte?: number; $lte?: number } = {};
    if (filters.minPrice !== undefined) priceCondition.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceCondition.$lte = filters.maxPrice;

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
   const Order = await Orders.find(whereConditions)
     .sort(sortConditions)
     .skip(skip)
     .limit(limit)
     .exec()
 
   // Get the total count of Orders (for pagination metadata)
   const total = await Orders.countDocuments(whereConditions);
 
   // Throw an error if no Orders are found
   if (Orders.length === 0) {
     throw new ApiError(httpStatus.NOT_FOUND, 'No Orders found');
   }
 
   return {
     data: Order,
     meta: {
       page: paginationOptions.page || 1,
       limit,
       total,
     },
   };
};


const GetOrdersForUser = async (userId: string): Promise<IOrders[]> => {
  // Fetch orders for the user
  const orders = await Orders.find({ userId }).exec();

  // Throw an error if no orders are found
  if (orders.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No orders found for this user');
  }

  return orders;
};
/**
 * UpdateOrders Service
 * Update a single Order by ID.
 */
const UpdateOrderStatus = async (
  orderId: string,
  status: string
): Promise<IOrders | null> => {
  // Find the order by ID
  const order = await Orders.findById(orderId);

  // Throw an error if the order is not found
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Update the order status
  order.orderStatus = status as OrderStatus;
  await order.save();

  return order;
};

/**
 * DeleteOrders Service
 * Update a single Order by ID.
 */
const CancelOrder = async (
  orderId: string,
  requestingUserId: string,
  requestingUserRole: string
): Promise<IOrders | null> => {
  // Find the order by ID
  const order = await Orders.findById(orderId);

  // Throw an error if the order is not found
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Ensure that a customer can only cancel their own orders
  if (requestingUserRole === ENUM_USER_ROLE.CUSTOMER && order.userId.toString() !== requestingUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to cancel this order');
  }

  // Check if the order is already cancelled
  if (order.orderStatus === 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Order is already cancelled');
  }

  // Update the order status to "cancelled"
  order.orderStatus = 'cancelled' as OrderStatus;
  await order.save();

  return order;
};


const GetOrderAnalytics = async (): Promise<IOrderAnalytics> => {
  // Total number of orders
  const totalOrders = await Orders.countDocuments();

  // Number of orders by status
  const ordersByStatus = await Orders.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  // Total revenue
  const totalRevenueResult = await Orders.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
  ]);
  const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

  // Average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Orders over time (e.g., daily, weekly, monthly)
  const ordersOverTime = await Orders.aggregate([
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
};


const GetOrderHistoryForUser = async (userId: string): Promise<IOrders[]> => {
  // Fetch orders for the user
  const orders = await Orders.find({ userId })
    .sort({ createdAt: -1 }) // Sort by most recent orders first
    .exec();

  // Throw an error if no orders are found
  if (orders.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No order history found for this user');
  }

  return orders;
};


const BulkUpdateOrderStatus = async (
  orderIds: string[],
  status: string
): Promise<IOrders[]> => {
  // Update the status of multiple orders
  const result = await Orders.updateMany(
    { _id: { $in: orderIds } }, // Filter by order IDs
    { $set: { orderStatus: status } } // Update status
  ).exec();

  if (result.modifiedCount === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No orders found or updated');
  }

  // Fetch the updated orders
  const updatedOrders = await Orders.find({ _id: { $in: orderIds } }).exec();

  return updatedOrders;
};


const ExportOrders = async (): Promise<string> => {
  // Fetch all orders
  const orders = await Orders.find().exec();

  // Convert orders to CSV format
  const fields = ['_id', 'userId', 'totalAmount', 'orderStatus', 'createdAt'];
  const parser = new Parser({ fields }); // Create a new Parser instance
  const csv = parser.parse(orders); // Convert orders to CSV

  // Define the file path
  const exportsDir = path.join(__dirname, '../../exports');
  const filePath = path.join(exportsDir, 'orders_export.csv');

  // Create the exports directory if it doesn't exist
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // Save the CSV file
  fs.writeFileSync(filePath, csv); // Write CSV to file

  return filePath; // Return the file path
};



const HandlePaymentWebhook = async (payload: any): Promise<void> => {
  const { orderId, status } = payload;

  // Find the order by ID
  const order = await Orders.findById(orderId);

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Update the payment status
  order.payment.status = status;
  await order.save();
};

export const OrderService = {
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
