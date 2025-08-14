// // ========================
// // Public API Functions (combined)
// // ========================

// import { Socket } from "socket.io";
// import { io } from "./SocketServer";
// import { logger } from "../../shared/logger";
// import { connectedUsers, lockedEntities, messageQueue, userPresence, userRoles } from "./socket.interface";
// export const generateId = () => Math.random().toString(36).substring(2, 15);

// export const getUserIdBySocket = (socket: Socket): string | null => {
//   return socket.data.userId ?? null;
// };

// export const emitToUser = (targetUserId: string, event: string, data: any) => {
//   if (!io) {
//     logger.warn('Socket.IO server not initialized');
//     return false;
//   }

//   const socket = connectedUsers.get(targetUserId);
//   if (socket) {
//     logger.info(`📤 Emitting ${event} to ${targetUserId}`);
//     socket.emit(event, data);
//     return true;
//   }
  
//   queueMessage(targetUserId, event, data);
//   logger.warn(`📥 User ${targetUserId} offline. Message queued.`);
//   return false;
// };

// export const emitToRoles = (targetRoles: string[], event: string, data: any) => {

//   if (!io) {
//     logger.warn('Socket.IO server not initialized');
//     return 0;
//   }

//   let emittedCount = 0;
//   for (const [userId, socket] of connectedUsers.entries()) {
//     const role = userRoles.get(userId);
//     if (role && targetRoles.includes(role)) {
//       socket.emit(event, data);
//       emittedCount++;
//     }
//   }
  
//   logger.info(`📤 Event "${event}" emitted to ${emittedCount} user(s) with roles: ${targetRoles.join(', ')}`);
//   return emittedCount;
// };

// export const notifyOrderStatusChange = (orderId: string, newStatus: string) => {
//   if (!io) return;
  
//   io.to(`order_${orderId}`).emit('order_status_update', {
//     orderId,
//     newStatus,
//     updatedAt: new Date()
//   });

//   if (['cancelled', 'refunded', 'fraudulent'].includes(newStatus)) {
//     const notification = {
//       id: generateId(),
//       message: `Order ${orderId} status changed to ${newStatus}`,
//       category: 'order',
//       priority: 'high',
//       requiresAction: true,
//       relatedEntity: { type: 'order', id: orderId },
//       createdAt: new Date()
//     };

//     emitToRoles(['admin', 'order_manager'], 'notification', notification);
//   }
// };

// export const notifyLowStock = (productId: string, currentStock: number) => {
//   if (!io) return;

//   const threshold = Math.floor(currentStock / 10) * 10;
//   io.to(`inventory_alerts_${threshold}`).emit('low_stock_alert', {
//     productId,
//     currentStock,
//     timestamp: new Date()
//   });

//   if (currentStock < 5) {
//     const notification = {
//       id: generateId(),
//       message: `Critical low stock for product ${productId}`,
//       category: 'inventory',
//       priority: 'critical',
//       requiresAction: true,
//       relatedEntity: { type: 'product', id: productId },
//       createdAt: new Date()
//     };

//     emitToRoles(['admin', 'inventory_manager'], 'notification', notification);
//   }
// };

// export const notifyFinancialEvent = (event: 'payment_failed' | 'high_value_order', data: any) => {
//   if (!io) return;
  
//   io.to('financial_alerts').emit('financial_alert', {
//     event,
//     data,
//     timestamp: new Date(),
//     priority: 'high'
//   });
// };

// export const notifyCustomerActivity = (event: 'new_registration' | 'support_ticket', data: any) => {
//   if (!io) return;
  
//   io.to('customer_activity').emit('customer_activity_update', {
//     event,
//     data,
//     timestamp: new Date()
//   });
// };

// export const getOnlineAdmins = () => {
//   return Array.from(userPresence.entries())
//     .filter(([userId, presence]) => 
//       userRoles.get(userId) === 'admin' && 
//       presence.status !== 'offline'
//     )
//     .map(([userId, presence]) => ({
//       userId,
//       ...presence
//     }));
// };

// export const getEntityLockStatus = (entityId: string) => {
//   return lockedEntities.get(entityId);
// };


// // ========================
// // Rate Limiter
// // ========================

// export const rateLimiter = {
//   requests: new Map<string, number>(),
//   isBlocked: (ip: string) => (rateLimiter.requests.get(ip) || 0) > 100,
//   addRequest: (ip: string) => {
//     const count = rateLimiter.requests.get(ip) || 0;
//     rateLimiter.requests.set(ip, count + 1);
//     setTimeout(() => {
//       const current = rateLimiter.requests.get(ip) || 0;
//       rateLimiter.requests.set(ip, Math.max(0, current - 1));
//     }, 60000);
//   }
// };

// // ========================
// // Queue Management (from original code with enhancements)
// // ========================
// export const queueMessage = (userId: string, event: string, data: any) => {
//   const queue = messageQueue.get(userId) || [];
//   if (queue.length >= 100) queue.shift(); // Prevent memory leaks
//   queue.push({ event, data, timestamp: Date.now() });
//   messageQueue.set(userId, queue);
// };


// export const flushMessageQueue = (userId: string) => {
//   const socket = connectedUsers.get(userId);
//   if (!socket) return;

//   const queue = messageQueue.get(userId);
//   if (!queue?.length) return;

//   logger.info(`📤 Flushing ${queue.length} queued message(s) to ${userId}`);
//   queue.forEach(({ event, data }) => {
//     try {
//       socket.emit(event, data);
//     } catch (err) {
//       logger.error(`Failed to emit queued message: ${err}`);
//     }
//   });

//   messageQueue.delete(userId);
// };
