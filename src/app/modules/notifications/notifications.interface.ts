// // =======================
// // 📌 Related Entity Info
// // =======================
// export type NotificationRelatedTo = {
//   orderId?: string;
//   productId?: string;
//   issueId?: string;
//   type?: string;
//   metadata?: Record<string, unknown>;
// };

// // =======================
// // 📌 Notification Types
// // =======================
// export enum NotificationType {
//   ORDER_PLACED = 'ORDER_PLACED',
//   ORDER_SHIPPED = 'ORDER_SHIPPED',
//   ORDER_DELIVERED = 'ORDER_DELIVERED',
//   LOW_STOCK = 'LOW_STOCK',
//   NEW_ISSUE = 'NEW_ISSUE',
//   PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
//   ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
// }

// // =======================
// // 📌 Read Status
// // =======================
// export type NotificationStatus = 'active' | 'archived' | 'deleted' | 'read' | 'unread';

// // =======================
// // 📌 Main Notification
// // =======================
// export type Notification = {
//   _id: string;
//   message: string;
//   title?: string;
//   targetRoles: string[];
//   userTargets?: string[];
//   relatedTo: NotificationRelatedTo;
//   readBy: string[];
//   deletedBy?: string[];
//   status?: NotificationStatus;
//   priority?: 'low' | 'medium' | 'high';
//   createdAt: Date;
//   updatedAt: Date;
//   expiresAt?: Date;
//   requiresAction?: boolean;
//   type: NotificationType;
//   category?: string;
// };

// // =======================
// // 📌 Socket Payload Format
// // =======================
// export type NotificationSocketPayload = {
//   notificationId: string;
//   message: string;
//   title?: string;
//   isRead: boolean;
//   type: NotificationType;
//   createdAt: Date;
//   relatedTo?: NotificationRelatedTo;
//   priority?: 'low' | 'medium' | 'high';
//   requiresAction?: boolean;
//   status?: NotificationStatus;
//   category?: string; // e.g., 'order', 'issue', 'system'
// };

// // =======================
// // 📌 Notification Filters
// // =======================
// export type NotificationFilters = {
//   isRead?: boolean;
//   type?: NotificationType;
//   status?: NotificationStatus;
//   createdAfter?: Date;
//   createdBefore?: Date;
//   limit?: number;
//   skip?: number;
//   priority?: 'low' | 'medium' | 'high';
//   searchTerm?:any
//     userId?: string;      
//   userRole?: string;    
 
// };

// // =======================
// // 📌 Result Wrapper
// // =======================
// export type NotificationResult<T> = {
//   success: boolean;
//   data?: T;
//   error?: string;
//   statusCode?: number;
//   timestamp?: Date;
//   total?: number;
// };

// export type UserNotificationFilters = {
//   userId: string;
//   userRole: string;
//   isRead?: boolean | string;
//   priority?: 'low' | 'medium' | 'high';
//   searchTerm?: string;
//    status?: NotificationStatus;
// }