"use strict";
// /**
//  * notifications.service.ts
//  * 
//  * Service layer for handling notification logic in the application.
//  * Provides creation, dispatch, marking as read, deletion, and retrieval of notifications.
//  * Integrates with WebSocket for real-time notification delivery.
//  */
// import { Notification, NotificationResult, NotificationType, NotificationSocketPayload, NotificationFilters } from './notifications.interface';
// import { IOrders } from '../orders/orders.interface';
// import { Notifications } from './notifications.model';
// import { emitToRoles } from '../../websocket/socket.service';
// import { calculatePagination, IPaginationOptions } from '../../../helpers/paginationHelpers';
// import { SortOrder } from 'mongoose';
// // =======================
// // 📌 Create a new notification
// // =======================
// const createNotification = async (
//     message: string,
//     targetRoles: string[],
//     relatedTo: Notification['relatedTo'],
//     options?: Partial<Pick<Notification, 'priority' | 'title' | 'expiresAt'>>
// ): Promise<NotificationResult<Notification>> => {
//     try {
//         const created = await Notifications.create({
//             message,
//             targetRoles,
//             relatedTo,
//             readBy: [],
//             ...options,
//         });
//         return { success: true, data: created };
//     } catch (error) {
//         return {
//             success: false,
//             error: (error as Error).message,
//             statusCode: 500,
//             timestamp: new Date(),
//         };
//     }
// };
// /**
//  * ✅ Handler for ORDER_PLACED notification type
//  * Generates and sends a notification when a new order is placed.
//  */
// const handleOrderPlaced = async (order: IOrders): Promise<NotificationResult<Notification>> => {
//     const items = order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ') || 'Unknown';
//     const message = `🛒 New Order #${order.shortCode || order._id}
// Name: ${order.shippingAddress?.name || 'Unknown'}
// Phone: ${order.shippingAddress?.phone || 'Unknown'}
// Total: ৳${order.totalAmount || 'N/A'}
// Address: ${order.shippingAddress?.address || 'N/A'}
// Items: ${items}`;
//     return createNotification(message, ['admin', 'super_admin'], {
//         orderId: order._id?.toString(),
//         type: 'order',
//         metadata: { shortCode: order.shortCode },
//     }, {
//         priority: 'high',
//         title: 'New Order Placed',
//     });
// };
// /**
//  * ✅ Handler for LOW_STOCK notification type
//  * Notifies product managers and super admins about low stock.
//  */
// const handleLowStock = async (product: any): Promise<NotificationResult<Notification>> => {
//     const message = `⚠️ Low stock: ${product.name} has ${product.quantity} left`;
//     return createNotification(message, ['product_manager', 'super_admin'], {
//         productId: product._id,
//         type: 'product',
//         metadata: { quantity: product.quantity },
//     }, {
//         priority: 'medium',
//         title: 'Low Stock Alert',
//     });
// };
// /**
//  * ✅ Handler for NEW_ISSUE notification type
//  * Notifies super admins about a new support issue.
//  */
// const handleNewIssue = async (issue: any): Promise<NotificationResult<Notification>> => {
//     const message = `🧾 New support issue: ${issue.title}`;
//     return createNotification(message, ['super_admin'], {
//         issueId: issue._id,
//         type: 'issue',
//         metadata: { customer: issue.user?.name },
//     }, {
//         priority: 'low',
//         title: 'New Issue Reported',
//     });
// };
// /**
//  * ✅ Dispatcher map for notification handlers
//  * Maps notification types to their respective handler functions.
//  */
// const notificationHandlers: Record<
//     NotificationType,
//     (payload: any) => Promise<NotificationResult<Notification>>
// > = {
//     [NotificationType.ORDER_PLACED]: handleOrderPlaced,
//     [NotificationType.LOW_STOCK]: handleLowStock,
//     [NotificationType.NEW_ISSUE]: handleNewIssue,
//     // Optional: Implement when needed
//     [NotificationType.ORDER_SHIPPED]: async () => ({ success: false, error: 'Not implemented' }),
//     [NotificationType.ORDER_DELIVERED]: async () => ({ success: false, error: 'Not implemented' }),
//     [NotificationType.PAYMENT_RECEIVED]: async () => ({ success: false, error: 'Not implemented' }),
//     [NotificationType.ACCOUNT_UPDATE]: async () => ({ success: false, error: 'Not implemented' }),
// };
// /**
//  * ✅ Public entrypoint to notify
//  * Dispatches a notification based on its type and payload.
//  */
// export const notify = async (
//     type: NotificationType,
//     payload: unknown
// ): Promise<NotificationResult<Notification>> => {
//     const handler = notificationHandlers[type];
//     if (!handler) {
//         return {
//             success: false,
//             error: `Unknown or unsupported notification type: ${type}`,
//             statusCode: 400,
//             timestamp: new Date(),
//         };
//     }
//     const result = await handler(payload);
//     if (result.success && result.data) {
//         emitSocketPayload(type, result.data);
//     }
//     return result;
// };
// /**
//  * ✅ Emit notification payload to roles via WebSocket
//  * If users are online, sends notification in real-time.
//  */
// const emitSocketPayload = (type: NotificationType, data: Notification) => {
//      const payload: NotificationSocketPayload = {
//       notificationId: data._id.toString(),
//       title: data.title || '🔔 Notification',
//       message: data.message,
//       isRead: false,
//       type,
//       createdAt: data.createdAt,
//       relatedTo: data.relatedTo || null,
//       priority: data.priority || 'medium',
//       requiresAction: data.requiresAction || false,
//       status: data.status || 'active',
//       category: data.category || 'system',
//     };
//     emitToRoles(data.targetRoles, type, payload);
// };
// /**
//  * ✅ Mark a single notification as read for a user
//  */
// const markNotificationAsRead = async (
//     notificationId: string,
//     userId: string
// ): Promise<NotificationResult<Notification>> => {
//     try {
//         const updated = await Notifications.findByIdAndUpdate(
//             notificationId,
//             { $addToSet: { readBy: userId } },
//             { new: true }
//         );
//         if (!updated) return { success: false, error: 'Notification not found' };
//         return { success: true, data: updated };
//     } catch (err) {
//         return {
//             success: false,
//             error: (err as Error).message,
//             statusCode: 500,
//         };
//     }
// };
// /**
//  * ✅ Bulk mark notifications as read for a user
//  */
// const markNotificationsAsRead = async (
//     notificationIds: string[],
//     userId: string
// ): Promise<NotificationResult<number>> => {
//     try {
//         const result = await Notifications.updateMany(
//             {
//                 _id: { $in: notificationIds },
//                 readBy: { $ne: userId }, 
//             },
//             {
//                 $addToSet: { readBy: userId },
//             }
//         );
//         return {
//             success: true,
//             data: result.modifiedCount,
//         };
//     } catch (err) {
//         return {
//             success: false,
//             error: (err as Error).message,
//             statusCode: 500,
//         };
//     }
// };
// /**
//  * ✅ Mark all notifications as read for a user
//  */
// const markAsAllRead = async (
//     userId: string
// ): Promise<NotificationResult<number>> => {
//     try {
//         const result = await Notifications.updateMany(
//             {
//                 readBy: { $ne: userId },
//                 $or: [
//                     { userTargets: userId },          
//                     { targetRoles: { $exists: true } } 
//                 ]
//             },
//             {
//                 $addToSet: { readBy: userId }
//             }
//         );
//         return {
//             success: true,
//             data: result.modifiedCount,
//         };
//     } catch (err) {
//         return {
//             success: false,
//             error: (err as Error).message,
//             statusCode: 500,
//         };
//     }
// };
// /**
//  * ✅ Delete a notification for a user (hard delete)
//  */
// const deleteNotification = async (
//     notificationIds: string,
//     userId: string
// ): Promise<NotificationResult<number>> => {
//     try {
//         const result = await Notifications.deleteMany(
//             {
//                 _id: { $in: notificationIds },
//                 readBy: { $ne: userId },
//             }
//         );
//         return {
//             success: true,
//             data: result.deletedCount,
//         };
//     } catch (err) {
//         return {
//             success: false,
//             error: (err as Error).message,
//             statusCode: 500,
//         };
//     }
// };
// /**
//  * ✅ Bulk delete notifications for a user (hard delete)
//  */
// const bulkDeleteNotification = async (
//     notificationIds: string[],
//     userId: string
// ): Promise<NotificationResult<number>> => {
//     try {
//         const result = await Notifications.deleteMany({
//             _id: { $in: notificationIds },
//             userTargets: { $in: [userId] }, // Only those where user is explicitly targeted
//         });
//         return {
//             success: true,
//             data: result.deletedCount ?? 0,
//         };
//     } catch (err) {
//         return {
//             success: false,
//             error: (err as Error).message,
//             statusCode: 500,
//         };
//     }
// };
// /**
//  * ✅ Bulk soft delete notifications for a user
//  * Adds userId to deletedBy array instead of removing the document.
//  */
// const bulkSoftDeleteNotifications = async (
//     notificationIds: string[],
//     userId: string
// ): Promise<NotificationResult<number>> => {
//     try {
//         const result = await Notifications.updateMany(
//             {
//                 _id: { $in: notificationIds },
//                 deletedBy: { $ne: userId }, 
//             },
//             {
//                 $addToSet: { deletedBy: userId },
//             }
//         );
//         return {
//             success: true,
//             data: result.modifiedCount, 
//         };
//     } catch (err) {
//         return {
//             success: false,
//             error: (err as Error).message,
//             statusCode: 500,
//         };
//     }
// };
// /**
//  * ✅ Get all notifications with pagination and filters (admin use)
//  */
// const GetNotifications = async (
//     paginationOptions: IPaginationOptions,
//     filters: NotificationFilters
// ): Promise<{
//     data: any[];
//     meta: {
//         page: number;
//         limit: number;
//         total: number;
//     };
// }> => {
//     const { skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
//     // Sorting logic
//     const sortConditions: { [key: string]: SortOrder } = {};
//     if (sortBy && sortOrder) {
//         sortConditions[sortBy] = sortOrder;
//     } else {
//         sortConditions['createdAt'] = 'desc';
//     }
//     // Filter logic
//     const andConditions: any[] = [];
//     if (filters.searchTerm) {
//         andConditions.push({
//             $or: [
//                 { message: { $regex: filters.searchTerm, $options: 'i' } },
//                 { title: { $regex: filters.searchTerm, $options: 'i' } },
//             ],
//         });
//     }
//     if (filters.userId) {
//         andConditions.push({
//             $or: [
//                 { userTargets: filters.userId },
//                 { targetRoles: filters.userRole },
//             ],
//         });
//     }
//     if (typeof filters.isRead === 'boolean' && filters.userId) {
//         andConditions.push({
//             readBy: filters.isRead ? filters.userId : { $ne: filters.userId }
//         });
//     }
//     if (filters.priority) {
//         andConditions.push({
//             priority: filters.priority
//         });
//     }
//     const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
//     const notifications = await Notifications.find(whereConditions)
//         .sort(sortConditions)
//         .skip(skip)
//         .limit(limit)
//         .lean()
//         .exec();
//     const total = await Notifications.countDocuments(whereConditions);
//     return {
//         data: notifications,
//         meta: {
//             page: paginationOptions.page || 1,
//             limit,
//             total,
//         },
//     };
// };
// /**
//  * ✅ Get notifications for a specific user with filters and pagination
//  */
// export const getUserNotifications = async (
//     paginationOptions: IPaginationOptions,
//     filters: NotificationFilters
// ): Promise<{
//     data: any[];
//     meta: {
//         page: number;
//         limit: number;
//         total: number;
//     };
// }> => {
//     const { skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
//     const sortConditions: { [key: string]: 'asc' | 'desc' } = {};
//     sortConditions[sortBy || 'createdAt'] = (sortOrder as 'asc' | 'desc') || 'desc';
//     const andConditions: any[] = [];
//     const userId = String(filters.userId); // always string
//     const userRole = String(filters.userRole);
//     // 🔍 Search by text (title or message)
//     if (filters.searchTerm) {
//         andConditions.push({
//             $or: [
//                 { message: { $regex: filters.searchTerm, $options: 'i' } },
//                 { title: { $regex: filters.searchTerm, $options: 'i' } },
//             ],
//         });
//     }
//     // 👥 Targeted to user directly or their role
//     if (userId && userRole) {
//         andConditions.push({
//             $or: [
//                 { userTargets: userId },
//                 { targetRoles: userRole },
//             ],
//         });
//     }
//     // 👇 Exclude soft-deleted notifications for this user
//     andConditions.push({
//         deletedBy: { $not: { $elemMatch: { $eq: userId } } },
//     });
//     // 📍 Read / Unread logic
//     if (filters.isRead !== undefined) {
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         //@ts-ignore
//         const isReadBool = filters.isRead === 'true'; // Correct conversion
//         if (isReadBool) {
//             andConditions.push({ readBy: { $elemMatch: { $eq: userId } } });
//         } else {
//             andConditions.push({
//                 $or: [
//                     { readBy: { $exists: false } },
//                     { readBy: { $not: { $elemMatch: { $eq: userId } } } },
//                 ],
//             });
//         }
//     }
//     // ⚠️ Priority filter
//     if (filters.priority) {
//         andConditions.push({ priority: filters.priority });
//     }
//     // 🟢 Status filter
//     if (filters.status) {
//         andConditions.push({ status: filters.status });
//     }
//     // 🔔 Type filter
//     if (filters.type) {
//         andConditions.push({ 'relatedTo.type': filters.type });
//     }
//     // Final query
//     const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
//     const notifications = await Notifications.find(whereConditions)
//         .sort(sortConditions)
//         .skip(skip)
//         .limit(limit)
//         .lean()
//         .exec();
//     const total = await Notifications.countDocuments(whereConditions);
//     return {
//         data: notifications,
//         meta: {
//             page: paginationOptions.page || 1,
//             limit,
//             total,
//         },
//     };
// };
// /**
//  * ✅ NotificationService export
//  * Exposes all notification-related service functions.
//  */
// export const NotificationService = {
//     GetNotifications,
//     notify,
//     markNotificationAsRead,
//     createNotification,
//     markNotificationsAsRead,
//     getUserNotifications,
//     markAsAllRead,
//     deleteNotification,
//     bulkDeleteNotification,
//     bulkSoftDeleteNotifications
// };
