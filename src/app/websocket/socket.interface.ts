// // ========================
// // Type Definitions
// // ========================

// import { Socket } from "socket.io";

// export type UserStatus = 'online' | 'away' | 'busy' | 'offline';
// export type NotificationPriority = 'critical' | 'high' | 'normal';
// export type NotificationCategory = 'order' | 'inventory' | 'customer' | 'financial' | 'system' | 'support';
// export type AdminActivity = 
//   | 'viewing_dashboard'
//   | 'editing_order'
//   | 'handling_support'
//   | 'managing_inventory'
//   | 'reviewing_analytics'
//   | string;

// export type EntityLock = {
//   entityId: string;
//   entityType: 'order' | 'product' | 'customer';
//   lockedBy: string;
//   lockedAt: Date;
//   expiresAt: Date;
// }

// export type ChatMessage = {
//   id: string;
//   senderId: string;
//   senderType: 'admin' | 'customer';
//   recipientId?: string;
//   roomId?: string;
//   content: string;
//   timestamp: Date;
//   read: boolean;
// }

// export type SupportTicket = {
//   ticketId: string;
//   customerId: string;
//   assignedAdmin?: string;
//   status: 'open' | 'pending' | 'resolved';
//   lastUpdated: Date;
// }

// export type Notification = {
//   id: string;
//   message: string;
//   category: NotificationCategory;
//   priority: NotificationPriority;
//   requiresAction: boolean;
//   relatedEntity?: {
//     type: string;
//     id: string;
//   };
//   createdAt: Date;
//   readBy?: string[];
// }

// export type SystemMetrics = {
//   cpuLoad: number[];
//   memoryUsage: number;
//   responseTimes: number[];
//   activeConnections: number;
//   databaseQueries: number;
// }

// export type UserSession = {
//   pagesVisited: string[];
//   actionsTaken: string[];
//   sessionDuration: number;
//   lastInteraction: Date;
// }


// // ========================
// // Core State Management
// // ========================

// export const connectedUsers = new Map<string, Socket>();
// export const userRoles = new Map<string, string>();
// export const userPresence = new Map<string, {
//   status: UserStatus;
//   lastActive: Date;
//   currentActivity?: AdminActivity;
//   activePage?: string;
// }>();
// export const messageQueue = new Map<string, Array<{ event: string; data: any ,timestamp:number}>>();
// export const lockedEntities = new Map<string, EntityLock>();
// export const inventorySubscriptions = new Map<string, Set<string>>();
// export const userSessions = new Map<string, UserSession>();
// export const activeChats = new Map<string, Set<string>>();
// export const supportTickets = new Map<string, SupportTicket>();
// export const pendingActionNotifications = new Map<string, Set<string>>();

// export const systemMetricsHistory: SystemMetrics[] = [];