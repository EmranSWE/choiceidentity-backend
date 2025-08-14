"use strict";
// // =======================
// // 📌 Notification Controller
// // =======================
// import { Request, RequestHandler, Response } from 'express';
// import catchAsync from '../../../shared/catchAsync';
// import sendResponse from '../../../shared/sendResponse';
// import httpStatus from 'http-status';
// import { NotificationService } from './notifications.service';
// import { getPaginationAndFilters } from '../../../helpers/paginationHelpers';
// import { NotificationFilters } from './notifications.interface';
// // =======================
// // 📌 GetAllNotifications Controller
// // =======================
// const GetNotifications: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { paginationOptions, filters } = getPaginationAndFilters<NotificationFilters>(req);
//     const result = await NotificationService.GetNotifications(paginationOptions, filters);
//     // Send response
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'Notifications retrieved successfully',
//       data: {
//         data: result.data,
//         meta: result.meta,
//       }, 
//     });
//   }
// );
// // =======================
// // 📌 getUserNotifications Controller
// // =======================
// const getUserNotifications: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//         const requestingUserId = req.user?.userId; 
//     const requestingUserRole = req.user?.role; 
//     const { paginationOptions, filters } = getPaginationAndFilters<NotificationFilters>(req);
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     filters.userId = requestingUserId!;
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     filters.userRole = requestingUserRole!;
//     const result = await NotificationService.getUserNotifications(paginationOptions, filters);
//     // Send response
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'Notifications retrieved successfully',
//       data: {
//         data: result.data,
//         meta: result.meta,
//       }, 
//     });
//   }
// );
// // =======================
// // 📌 markNotificationAsRead for single user Controller
// // =======================
//  const markNotificationAsRead: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { id: notificationId } = req.params;
//     const userId = req.user?.userId; 
//     const result = await NotificationService.markNotificationAsRead(notificationId, userId);
//     sendResponse(res, {
//       statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
//       success: result.success,
//       message: result.success ? 'Marked as read' : result.error || 'Error',
//       data: result.data,
//     });
//   }
// );
// // =======================
// // 📌 markNotificationsAsRead for multiple users Controller
// // =======================
//  const markNotificationsAsRead: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { notificationIds } = req.body;
//     const userId = req.user?.userId; 
//     const result = await NotificationService.markNotificationsAsRead(notificationIds, userId);
//     sendResponse(res, {
//       statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
//       success: result.success,
//       message: result.success ? 'Marked as read' : result.error || 'Error',
//       data: result.data,
//     });
//   }
// );
// // =======================
// // 📌 markAsAllRead for single user Controller
// // =======================
// const markAsAllRead: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const userId = req.user?.userId; 
//     const result = await NotificationService.markAsAllRead(userId);
//     sendResponse(res, {
//       statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
//       success: result.success,
//       message: result.success ? 'Marked as read' : result.error || 'Error',
//       data: result.data,
//     });
//   }
// );
// // =======================
// // 📌 deleteNotification for single user Controller
// // =======================
//  const deleteNotification: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { id:notificationId } = req.params;
//     const userId = req.user?.userId; 
//     console.log(`Deleting notification with ID: ${notificationId} for user: ${userId}`);
//     const result = await NotificationService.deleteNotification(notificationId, userId);
//     sendResponse(res, {
//       statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
//       success: result.success,
//       message: result.success ? 'Notification deleted' : result.error || 'Error',
//       data: result.data,
//     });
//   }
// );
// // =======================
// // 📌 bulkDeleteNotification for single user Controller
// // =======================
//  const bulkDeleteNotification: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { notificationIds } = req.body;
//     const userId = req.user?.userId;
//     const result = await NotificationService.bulkDeleteNotification(notificationIds, userId);
//     sendResponse(res, {
//       statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
//       success: result.success,
//       message: result.success ? 'Notifications deleted' : result.error || 'Error',
//       data: result.data,
//     });
//   }
// );
// // =======================
// // 📌 bulkSoftDelete for single user Controller
// // =======================
// const bulkSoftDelete: RequestHandler = catchAsync(async (req, res) => {
//   const { notificationIds } = req.body;
//   const userId = req.user?.userId;
//   const result = await NotificationService.bulkSoftDeleteNotifications(notificationIds, userId);
//   sendResponse(res, {
//     statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
//     success: result.success,
//     message: result.success ? 'Notifications soft-deleted' : result.error || 'Failed',
//     data: result.data,
//   });
// });
// export const NotificationController = {
//   markNotificationAsRead,
//   GetNotifications,
//   getUserNotifications,
//   markNotificationsAsRead,
//   markAsAllRead,
//   deleteNotification,
//   bulkDeleteNotification,
//   bulkSoftDelete
// };
