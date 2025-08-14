import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { globalRateLimiter } from '../../middleware/globalRateLimiter';
import { OrderValidation } from './orders.validation';
import { OrderController } from './orders.controller';

const router = express.Router();
// Create Order
router.post(
    '/create-orders',
    auth(ENUM_USER_ROLE.CUSTOMER),
    globalRateLimiter, 
    validateRequest(OrderValidation.orderSchema), 
    OrderController.CreateOrders 
  );
  
  // Get Order by ID
  router.get(
    '/get-order/:id',
    auth(ENUM_USER_ROLE.CUSTOMER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), 
    OrderController.GetOrderById 
  );
  
  // Get All Orders (Admin)
  router.get(
    '/admin/orders',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), 
    OrderController.GetAllOrders 
  );
  
  // Get Orders for a User
  router.get(
    '/users/:userId/orders',
    auth(ENUM_USER_ROLE.CUSTOMER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), // Authenticated users
    OrderController.GetOrdersForUser 
  );
  
  // Update Order Status
  router.patch(
    '/orders/:id/status',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), 
    validateRequest(OrderValidation.orderUpdateSchema), 
    OrderController.UpdateOrderStatus 
  );
  
  // Cancel Order
  router.delete(
    '/orders/:id',
    auth(ENUM_USER_ROLE.CUSTOMER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), // Authenticated users
    OrderController.CancelOrder // Controller to handle the request
  );
  
  // Get Order Analytics (Admin)
  router.get(
    '/admin/orders/analytics',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), // Only admins can access
    OrderController.GetOrderAnalytics // Controller to handle the request
  );
  

  // Get Order History for a User
router.get(
  '/users/:userId/order-history',
  auth(ENUM_USER_ROLE.CUSTOMER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), // Authenticated users
  OrderController.GetOrderHistoryForUser 
);

router.patch(
  '/admin/orders/bulk-update',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), // Only admins can access
  validateRequest(OrderValidation.bulkOrderUpdateSchema), // Validate request body
  OrderController.BulkUpdateOrderStatus 
);


router.get(
  '/admin/orders/export',
  // auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), // Only admins can access
  OrderController.ExportOrders 
);


router.post(
  '/webhook/payment',
  OrderController.HandlePaymentWebhook 
);
export const OrderRoutes = router;
