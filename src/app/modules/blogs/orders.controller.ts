import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';

import httpStatus from 'http-status';
import sendResponse from '../../../shared/sendResponse';
import { getPaginationAndFilters } from '../../../helpers/paginationHelpers';
import { OrderService } from './orders.service';
import ApiError from '../../../errors/apiErrors';
import { Types } from 'mongoose';
import { IOrderFilters } from './orders.interface';
import { ENUM_USER_ROLE } from '../../../enums/user';

/**
 * AddOrders Controller
 * Handles the creation of a new product.
 */
const CreateOrders: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User ID is missing');
    }

      // Add userId to the order data
      const orderData = { ...req.body, userId };
   // Call the service to create the order
   const result = await OrderService.CreateOrders(orderData);
  

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order placing successfully',
    data: result,
  });
  }
);



/**
 * GetProductById Controller
 * Handles retrieving a single product by ID.
 */
const GetOrderById: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User ID is missing');
    }

    // Validate if the id is a valid ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid order ID');
    }
    const userRole = req.user?.userRole;
      // Add userId to the order data
      const getOrderData = { id, userId ,userRole};
    const result = await OrderService.GetProductById(getOrderData);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Order not found',
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Product retrieved successfully',
      data: result,
    });
  }
);
/**
 * GetOrders Controller
 * Handles retrieving all Orders.
 */
const GetAllOrders: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    // Extract query parameters for pagination and filtering
    const { paginationOptions, filters } = getPaginationAndFilters<IOrderFilters>(req);

    // Call the service to get Orders with pagination and filters
    const result = await OrderService.GetAllOrders(paginationOptions, filters);

    // Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        data: result.data,
        meta: result.meta,
      }, 
    });
  }
);


const GetOrdersForUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params; // Extract userId from route parameters
    const requestingUserId = req.user?.userId; // Extract userId of the requesting user
    const requestingUserRole = req.user?.role; // Extract role of the requesting user

    // Ensure that a customer can only access their own orders
    if (requestingUserRole === ENUM_USER_ROLE.CUSTOMER && requestingUserId !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to access these orders');
    }

    // Call the service to fetch orders for the user
    const result = await OrderService.GetOrdersForUser(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Orders retrieved successfully',
      data: result,
    });
  }
);

/**
 * UpdateOrders Controller
 * Handles updating an existing product by ID.
 */
const UpdateOrderStatus: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: orderId } = req.params; 
    const { status } = req.body; 

    // Call the service to update the order status
    const updatedOrder = await OrderService.UpdateOrderStatus(orderId, status);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    });
  }
);

const CancelOrder: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: orderId } = req.params; // Extract orderId from route parameters
    const requestingUserId = req.user?.userId; // Extract userId of the requesting user
    const requestingUserRole = req.user?.role; // Extract role of the requesting user

    // Call the service to cancel the order
    const result = await OrderService.CancelOrder(orderId, requestingUserId, requestingUserRole);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Order cancelled successfully',
      data: result,
    });
  }
);



const GetOrderAnalytics: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    // Call the service to fetch order analytics
    const analytics = await OrderService.GetOrderAnalytics();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Order analytics retrieved successfully',
      data: analytics,
    });
  }
);

const GetOrderHistoryForUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params; // Extract userId from route parameters
    const requestingUserId = req.user?.userId; // Extract userId of the requesting user
    const requestingUserRole = req.user?.role; // Extract role of the requesting user

    // Ensure that a customer can only access their own order history
    if (requestingUserRole === ENUM_USER_ROLE.CUSTOMER && requestingUserId !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to access this order history');
    }

    // Call the service to fetch order history
    const result = await OrderService.GetOrderHistoryForUser(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Order history retrieved successfully',
      data: result,
    });
  }
);


const BulkUpdateOrderStatus: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { orderIds, status } = req.body; // Extract order IDs and status from request body

    // Call the service to bulk update order status
    const result = await OrderService.BulkUpdateOrderStatus(orderIds, status);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Order status updated successfully',
      data: result,
    });
  }
);


const ExportOrders: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    // Call the service to export orders
    const filePath = await OrderService.ExportOrders();

    // Send the file as a response
    res.download(filePath, 'orders_export.csv', (err) => {
      if (err) {
        console.error('Failed to download file:', err);
        res.status(500).send('Failed to download file');
      }
    });
  }
);


const HandlePaymentWebhook: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body; // Extract payload from payment gateway

    // Call the service to handle the payment webhook
    await OrderService.HandlePaymentWebhook(payload);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Webhook processed successfully',
    });
  }
);
export const OrderController = {
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
