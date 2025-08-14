"use strict";
// import { Socket } from "socket.io";
// import { logger } from "../../shared/logger";
// import { queueMessage } from "./socket.service";
// import { connectedUsers, lockedEntities, SystemMetrics, systemMetricsHistory, userPresence, userRoles, UserSession } from "./socket.interface";
// // import { io } from "./SocketServer";
// // === Utility to get userId by socket instance ===
// export const getUserIdBySocket = (socket: Socket): string | null => {
//   return socket.data.userId ?? null;
// };
// // Emit to a specific user (queued if offline)
// export const emitToUser = (targetUserId: string, event: string, data: any) => {
//   if (!io) {
//     logger.warn('Socket.IO server not initialized');
//     return;
//   }
//   const socket = connectedUsers.get(targetUserId);
//   if (socket) {
//     logger.info(`📤 Emitting event "${event}" to userId: ${targetUserId}`);
//     socket.emit(event, data);
//   } else {
//     // User offline - queue message
//     queueMessage(targetUserId, event, data);
//     logger.warn(`❌ User ${targetUserId} offline, message queued`);
//   }
// };
// // Emit to multiple user roles
// export const emitToRoles = (targetRoles: string[], event: string, data: any) => {
//     console.log("🚨 emitToRoles called with targetRoles:", targetRoles);
//   if (!io) {
//     logger.warn('Socket.IO server not initialized');
//     return;
//   }
//   logger.info(`📤 Emitting event "${event}" to roles: ${targetRoles.join(', ')}`);
//   let emittedCount = 0;
//   for (const [userId, socket] of connectedUsers.entries()) {
//     const role = userRoles.get(userId);
//     if (role && targetRoles.includes(role)) {
//       socket.emit(event, data);
//       emittedCount++;
//     }
//   }
//   logger.info(`📦 Total emitted to recipients: ${emittedCount}`);
// };
// // Broadcast to all connected users (including sender)
// export const emitToAllUsers = (event: string, data: any) => {
//   if (!io) return;
//   logger.info(`📢 Emitting "${event}" to all connected users`);
//   io.emit(event, data);
// };
// // Broadcast to all except the sender
// export const broadcastToAllExceptSender = (senderSocketId: string, event: string, data: any) => {
//   if (!io) return;
//   io.sockets.sockets.forEach((socket) => {
//     if (socket.id !== senderSocketId) {
//       socket.emit(event, data);
//     }
//   });
// };
// // Emit to a room
// export const emitToRoom = (room: string, event: string, data: any) => {
//   if (!io) return;
//   logger.info(`🏷️ Emitting event "${event}" to room: ${room}`);
//   io.to(room).emit(event, data);
// };
// // Disconnect a user forcibly
// export const disconnectUser = (userId: string) => {
//   const socket = connectedUsers.get(userId);
//   if (socket) {
//     logger.info(`⚠️ Forcibly disconnecting userId=${userId}`);
//     socket.disconnect(true);
//   } else {
//     logger.warn(`❌ No active socket found to disconnect userId=${userId}`);
//   }
// };
// // Check if user connected
// export const isUserConnected = (userId: string): boolean => {
//   return connectedUsers.has(userId);
// };
// // Get all connected users with roles
// export const getAllConnectedUsers = (): { userId: string; role: string }[] => {
//   const users: { userId: string; role: string }[] = [];
//   for (const [userId, role] of userRoles.entries()) {
//     users.push({ userId, role });
//   }
//   return users;
// };
// // === System-level broadcast with metadata ===
// export const emitSystemNotification = (event: string, message: string) => {
//   const payload = {
//     type: 'system',
//     timestamp: new Date(),
//     message,
//   };
//   emitToAllUsers(event, payload);
// };
// // === Testing emit (debug) ===
// export const testEmit = () => {
//   emitToAllUsers('test_ping', { message: '🔁 Test ping from server' });
// };
// // ========================
// // Utility Functions
// // ========================
// export const broadcastAdminPresence = () => {
//   if (!io) return;
//   const adminPresence = Array.from(userPresence.entries())
//     .filter(([userId]) => userRoles.get(userId) === 'admin')
//     .map(([userId, presence]) => ({
//       userId,
//       status: presence.status,
//       lastActive: presence.lastActive,
//       activity: presence.currentActivity,
//       activePage: presence.activePage
//     }));
//   io.to('admin_dashboard').emit('admin_presence_update', adminPresence);
// };
// export const startMetricsCollection = () => {
//   setInterval(() => {
//     const metrics = getCurrentSystemMetrics();
//     systemMetricsHistory.push(metrics);
//     if (systemMetricsHistory.length > 60) systemMetricsHistory.shift();
//     if (io) {
//       io.to('admin_dashboard').emit('system_metrics', metrics);
//     }
//   }, 5000);
// };
// export const startLockCleanup = () => {
//   setInterval(() => {
//     const now = new Date();
//     Array.from(lockedEntities.entries())
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       .filter(([_, lock]) => lock.expiresAt < now)
//       .forEach(([entityId]) => {
//         lockedEntities.delete(entityId);
//         io?.to('admin_dashboard').emit('entity_unlocked', { entityId });
//       });
//   }, 5 * 60 * 1000); 
// };
// export const getCurrentSystemMetrics = (): SystemMetrics => {
//   return {
//     cpuLoad: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
//     memoryUsage: Math.random() * 100,
//     responseTimes: Array(10).fill(0).map(() => Math.random() * 100),
//     activeConnections: connectedUsers.size,
//     databaseQueries: Math.floor(Math.random() * 1000)
//   };
// };
// export const saveSessionAnalytics = (userId: string, session: UserSession) => {
//   logger.info(`Session data saved for ${userId} session:`, session);
//   // In production, save to analytics database
// };
// export const startHeartbeat = (socket: Socket) => {
//   const interval = setInterval(() => {
//     socket.emit('ping', Date.now());
//   }, 25000);
//   socket.on('pong', (startTime) => {
//     const latency = Date.now() - startTime;
//     socket.emit('latency', latency);
//   });
//   socket.on('disconnect', () => clearInterval(interval));
// };
