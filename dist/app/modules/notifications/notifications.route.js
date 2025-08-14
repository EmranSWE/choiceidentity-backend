"use strict";
// // notifications.routes.ts
// import { Router } from 'express';
// import auth from '../../middleware/auth';
// import { ENUM_USER_ROLE } from '../../../enums/user';
// import { NotificationController } from './notifications.controller';
// const router = Router();
// router.get(
//     '/',
//     NotificationController.GetNotifications
//   );
//   router.get(
//     '/user-notification',
//     auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.PRODUCT_MANAGER),
//     NotificationController.getUserNotifications
//   );
//   router.patch(
//     '/:id/mark-read',
//     auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.PRODUCT_MANAGER),
//     NotificationController.markNotificationAsRead
//   );
//   router.patch(
//     '/mark-bulk-read',
//     auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.PRODUCT_MANAGER),
//     NotificationController.markNotificationsAsRead
//   );
//   router.patch(
//     '/mark-all-read',
//     auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.PRODUCT_MANAGER),
//     NotificationController.markAsAllRead
//   );
//     //bulk delete
//   router.delete(
//     '/bulk-delete',
//     auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.PRODUCT_MANAGER),
//     NotificationController.bulkDeleteNotification
//   );
//   router.patch(
//   '/soft-bulk-delete',
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.PRODUCT_MANAGER),
//   NotificationController.bulkSoftDelete
// );
// export const NotificationRoutes = router;
