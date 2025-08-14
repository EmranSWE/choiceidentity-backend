// import { Server as HTTPServer } from 'http';
// import { Server as SocketIOServer, Socket } from 'socket.io';
// import config from '../../config';
// import { logger } from '../../shared/logger';
// import { socketAuth } from '../middleware/auth';

// import { activeChats, AdminActivity, ChatMessage, connectedUsers, EntityLock, lockedEntities, pendingActionNotifications, supportTickets, userPresence, userRoles, userSessions, UserStatus } from './socket.interface';
// import { flushMessageQueue, generateId, rateLimiter } from './socket.service';
// import { broadcastAdminPresence, getCurrentSystemMetrics, saveSessionAnalytics, startHeartbeat, startLockCleanup, startMetricsCollection } from './socket.utils';

// // ========================
// // Server Initialization
// // ========================

// export let io: SocketIOServer | null = null;

// export const initializeSocket = (server: HTTPServer): SocketIOServer => {
//   if (io) return io;

//   io = new SocketIOServer(server, {
//     cors: {
//       origin: config.cors_origin,
//       methods: ['GET', 'POST'],
//       credentials: true,
//     },
//     transports: ['websocket', 'polling'],
//     pingTimeout: 30000,
//     pingInterval: 25000,
//     maxHttpBufferSize: 1e8,
//     connectionStateRecovery: {
//       maxDisconnectionDuration: 2 * 60 * 1000,
//       skipMiddlewares: true,
//     }
//   });

//   // Security middleware
//   io.use(socketAuth());
//   io.use((socket, next) => {
//     const ip = socket.handshake.address;
//     if (rateLimiter.isBlocked(ip)) {
//       logger.warn(`Rate limit exceeded for IP: ${ip}`);
//       return next(new Error('Too many requests'));
//     }
//     rateLimiter.addRequest(ip);
//     next();
//   });

//   // ========================
//   // Connection Handler
//   // ========================

//   io.on('connection', async (socket: Socket) => {
//     const userId = socket.data.user?.userId;
//     const role = socket.data.user?.role;

//     if (!userId || !role) {
//       logger.warn(`❌ Unauthenticated connection attempt from socket ${socket.id}`);
//       socket.disconnect(true);
//       return;
//     }

//     logger.info(`✅ Socket connected: ${socket.id}, userId: ${userId}, role: ${role}`);

//     // Track connected user and role (from original code)
//     connectedUsers.set(userId, socket);
//     userRoles.set(userId, role);
//     socket.data.userId = userId;
//     socket.data.role = role;

//     // Initialize presence tracking (new feature)
//     userPresence.set(userId, {
//       status: 'online',
//       lastActive: new Date()
//     });

//     // Initialize session tracking (new feature)
//     userSessions.set(userId, {
//       pagesVisited: [],
//       actionsTaken: [],
//       sessionDuration: 0,
//       lastInteraction: new Date()
//     });

//     // Join role-specific rooms
//     socket.join(role);
//     if (role === 'admin') {
//       socket.join('admin_dashboard');
//       broadcastAdminPresence();
//     }

//     // Send authentication success (from original code)
//     socket.emit('authentication_status', { 
//       success: true, 
//       message: 'Authenticated Successful',
//       user: { userId, role }
//     });

//     // ✅ 1. Send unread notifications (backlog) from DB (from original code with enhancements)
//     try {
//       const unreadNotifications = await Notifications.find({
//         $or: [
//           { userTargets: userId },
//           { targetRoles: role },
//         ],
//         readBy: { $ne: userId },
//       })
//         .sort({ createdAt: -1 })
//         .limit(30);
//       if (unreadNotifications.length > 0) {
//         socket.emit('initial_unread_notifications', {
//           count: unreadNotifications.length,
//           notifications: unreadNotifications.map((n) => ({
//             notificationId: n._id.toString(),
//             message: n.message,
//             title: n.title || 'Notification',
//             readBy: n.readBy || [],
//             isRead: false,
//             createdAt: n.createdAt,
//             relatedTo: n.relatedTo,
//             status: n.status || 'unread',
//             category: (n as any)['category'] || 'system',
//             priority: n.priority || 'normal',
//             requiresAction: (n as any)['requiresAction'] || false
//           })
//         ),
          
//         });

//         logger.info(`📤 Sent ${unreadNotifications.length} unread notifications to ${userId}`);

//         // Track action-required notifications (new feature)
//         const actionNotifications = unreadNotifications
//           .filter(n => (n as any)['requiresAction'])
//           .map(n => n._id.toString());
        
//         if (actionNotifications.length > 0) {
//           pendingActionNotifications.set(userId, new Set(actionNotifications));
//         }
//       }
//     } catch (err) {
//       logger.error(`❌ Failed to fetch unread notifications: ${err}`);
//     }

//     // ✅ 2. Flush any queued messages (from original code)
//     flushMessageQueue(userId);

//     // ========================
//     // 🚀 Real-time Collaboration Features
//     // ========================

//     // Page tracking
//     socket.on('track_page_view', (page: string) => {
//       const presence = userPresence.get(userId);
//       if (presence) {
//         presence.activePage = page;
//         presence.lastActive = new Date();
//         broadcastAdminPresence();
//       }

//       const session = userSessions.get(userId);
//       if (session && !session.pagesVisited.includes(page)) {
//         session.pagesVisited.push(page);
//         session.lastInteraction = new Date();
//       }
//     });

//     // Entity locking system
//     socket.on('lock_entity', ({ entityId, entityType }: { entityId: string; entityType: 'order' | 'product' }, callback) => {
//       if (role !== 'admin') return callback({ success: false, message: 'Unauthorized' });

//       const existingLock = lockedEntities.get(entityId);
//       if (existingLock && existingLock.lockedBy !== userId) {
//         return callback({
//           success: false,
//           message: 'Entity already locked',
//           lockedBy: existingLock.lockedBy,
//           lockedAt: existingLock.lockedAt
//         });
//       }

//       const lock: EntityLock = {
//         entityId,
//         entityType,
//         lockedBy: userId,
//         lockedAt: new Date(),
//         expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minute lock
//       };

//       lockedEntities.set(entityId, lock);
//       io?.to('admin_dashboard').emit('entity_locked', lock);
//       callback({ success: true, ...lock });
//     });

//     socket.on('unlock_entity', (entityId: string) => {
//       const lock = lockedEntities.get(entityId);
//       if (lock && lock.lockedBy === userId) {
//         lockedEntities.delete(entityId);
//         io?.to('admin_dashboard').emit('entity_unlocked', { entityId });
//       }
//     });

//     // User status updates
//     socket.on('update_status', (status: UserStatus) => {
//       const presence = userPresence.get(userId);
//       if (presence) {
//         presence.status = status;
//         presence.lastActive = new Date();
//         broadcastAdminPresence();
//       }
//     });

//     // Activity broadcasting
//     socket.on('update_activity', (activity: AdminActivity) => {
//       if (role !== 'admin') return;
      
//       const presence = userPresence.get(userId);
//       if (presence) {
//         presence.currentActivity = activity;
//         presence.lastActive = new Date();
//         broadcastAdminPresence();
//       }
//     });

//     // ========================
//     // 📊 Advanced Analytics & Monitoring
//     // ========================

//     socket.on('subscribe_system_metrics', (interval = 5000) => {
//       if (role !== 'admin') return;

//       const sendMetrics = () => {
//         socket.emit('system_metrics', getCurrentSystemMetrics());
//       };

//       sendMetrics(); // Immediate first emission
//       const intervalId = setInterval(sendMetrics, interval);

//       socket.on('disconnect', () => clearInterval(intervalId));
//     });

//     socket.on('track_action', (action: string) => {
//       const session = userSessions.get(userId);
//       if (session) {
//         session.actionsTaken.push(action);
//         session.lastInteraction = new Date();
//       }
//     });

//     // ========================
//     // 🛍️ E-commerce Specific Features
//     // ========================

//     socket.on('subscribe_order_updates', (orderId: string) => {
//       socket.join(`order_${orderId}`);
//     });

//     socket.on('unsubscribe_order_updates', (orderId: string) => {
//       socket.leave(`order_${orderId}`);
//     });

//     socket.on('subscribe_inventory_alerts', (threshold = 10) => {
//       socket.join(`inventory_alerts_${threshold}`);
//     });

//     socket.on('subscribe_financial_alerts', () => {
//       if (role === 'admin') socket.join('financial_alerts');
//     });

//     socket.on('subscribe_customer_activity', () => {
//       if (role === 'admin') socket.join('customer_activity');
//     });

//     // ========================
//     // 💬 Customer Support Integration
//     // ========================

//     socket.on('join_support_chat', (customerId: string) => {
//       if (role !== 'admin') return;
      
//       const roomId = `support_${customerId}`;
//       socket.join(roomId);

//       // Track active chats
//       if (!activeChats.has(userId)) {
//         activeChats.set(userId, new Set());
//       }
//       activeChats.get(userId)?.add(roomId);

//       // Update ticket assignment
//       const ticket = supportTickets.get(customerId);
//       if (ticket) {
//         ticket.assignedAdmin = userId;
//         ticket.status = 'pending';
//         ticket.lastUpdated = new Date();
//         io?.to(roomId).emit('ticket_update', ticket);
//       }
//     });

//     socket.on('support_message', ({ customerId, content }: { customerId: string; content: string }) => {
//       const roomId = `support_${customerId}`;
//       const message: ChatMessage = {
//         id: generateId(),
//         senderId: userId,
//         senderType: role === 'admin' ? 'admin' : 'customer',
//         roomId,
//         content,
//         timestamp: new Date(),
//         read: false
//       };

//       io?.to(roomId).emit('new_message', message);
//     });

//     // ========================
//     // 🔔 Enhanced Notification System
//     // ========================

//     // 🔁 Mark read from client 
//    socket.on('mark_notification_read', async ({ notificationId }) => {
//   try {
//     if (!userId) return;
//     await NotificationService.markNotificationAsRead(notificationId, userId);


//     // Update pending notifications (new feature)
//     const pending = pendingActionNotifications.get(userId);
//     if (pending) {
//       pending.delete(notificationId);
//     }

//     // ✅ Emit event to notify all sockets of this user
//     io?.to(userId).emit('NOTIFICATION_READ_CONFIRMED', {
//       notificationId,
//       userId,
//     });

//   } catch (err) {
//     logger.error(`❌ Failed to mark read: ${err}`);
//   }
// });


//     socket.on('mark_notifications_read_bulk', async (notificationIds: string[]) => {
//       await NotificationService.markNotificationsAsRead(notificationIds, userId);
      
//       const pending = pendingActionNotifications.get(userId);
//       if (pending) {
//         notificationIds.forEach(id => pending.delete(id));
//       }
//     });

//     socket.on('acknowledge_action_notification', (notificationId: string) => {
//       const pending = pendingActionNotifications.get(userId);
//       if (pending) {
//         pending.delete(notificationId);
//       }
//     });

//     // ========================
//     // Disconnection Handler (combined)
//     // ========================

//     socket.on('disconnect', () => {
//       logger.warn(`❌ Socket disconnected: ${socket.id}`);

//       // Update presence (new feature)
//       const presence = userPresence.get(userId);
//       if (presence) {
//         presence.status = 'offline';
//         presence.lastActive = new Date();
//       }

//       // Release all locks (new feature)
//       Array.from(lockedEntities.entries())
//         .filter(([_, lock]) => lock.lockedBy === userId)
//         .forEach(([entityId]) => {
//           lockedEntities.delete(entityId);
//           io?.to('admin_dashboard').emit('entity_unlocked', { entityId });
//         });

//       // Remove from connected users and roles (from original code)
//       if (userId) {
//         connectedUsers.delete(userId);
//         userRoles.delete(userId);
//         logger.info(`🗑 Removed userId=${userId} from connected users`);
//       }

//       // Save session data (new feature)
//       const session = userSessions.get(userId);
//       if (session) {
//         session.sessionDuration = Date.now() - session.lastInteraction.getTime();
//         saveSessionAnalytics(userId, session);
//         userSessions.delete(userId);
//       }

//       // Broadcast admin presence update if needed
//       if (role === 'admin') {
//         broadcastAdminPresence();
//       }
//     });

//     // Error handling (from original code)
//     socket.on('error', (err) => {
//       logger.error(`🚨 Socket error: ${err.message}`);
//     });

//     // Start heartbeat for connection monitoring
//     startHeartbeat(socket);
//   });

//   // Start background services
//   startMetricsCollection();
//   startLockCleanup();

//   return io;
// };

