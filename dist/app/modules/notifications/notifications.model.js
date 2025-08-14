"use strict";
// import { Schema, model, Document, Model } from 'mongoose';
// import { Notification as NotificationType } from './notifications.interface';
// export type INotification = NotificationType & Document;
// type NotificationModel = Model<INotification> & {
//   findByUser(userId: string): Promise<INotification[]>;
// };
// const notificationSchema = new Schema<INotification, NotificationModel>(
//   {
//     // 🔹 Required content
//     message: {
//       type: String,
//       required: [true, 'Message is required'],
//       maxlength: [500, 'Message cannot exceed 500 characters'],
//       trim: true,
//     },
//     title: {
//       type: String,
//       maxlength: [100, 'Title cannot exceed 100 characters'],
//       trim: true,
//     },
//     // 🔹 Targeting
//     targetRoles: {
//       type: [String],
//       required: true,
//       validate: {
//         validator: (v: string[]) => v.length > 0,
//         message: 'At least one target role is required',
//       },
//     },
//     userTargets: {
//       type: [String],
//       default: [],
//       index: true,
//     },
//     // 🔹 Related entity metadata
//     relatedTo: {
//       orderId: { type: String, index: true },
//       productId: { type: String, index: true },
//       issueId: { type: String, index: true },
//       type: {
//         type: String,
//         enum: ['order', 'product', 'issue', 'system', 'promotional'],
//         required: true,
//       },
//       metadata: Schema.Types.Mixed,
//     },
//     // 🔹 Status and priority
//     readBy: {
//       type: [String],
//       default: [],
//       index: true,
//     },
//     deletedBy: {
//   type: [String],
//   default: [],
//   index: true
// },
//     priority: {
//       type: String,
//       enum: ['low', 'medium', 'high'],
//       default: 'medium',
//     },
//     status: {
//       type: String,
//       enum: ['active', 'archived', 'deleted', 'read', 'unread'],
//       default: 'active',
//     },
//     // 🔹 Expiration for auto-cleanup
//     expiresAt: {
//       type: Date,
//       index: { expireAfterSeconds: 0 },
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );
// //
// // 📌 Indexes
// //
// notificationSchema.index({ targetRoles: 1, createdAt: -1 });
// notificationSchema.index({ userTargets: 1, status: 1 });
// notificationSchema.index({ createdAt: -1 });
// notificationSchema.index({
//   'relatedTo.orderId': 1,
//   'relatedTo.type': 1,
// });
// //
// // 📌 Virtuals
// //
// notificationSchema.virtual('isExpired').get(function () {
//   return !!this.expiresAt && this.expiresAt < new Date();
// });
// //
// // 📌 Statics
// //
// notificationSchema.statics.findByUser = async function (userId: string) {
//   return this.find({
//     $or: [
//       { userTargets: userId },
//       // You can inject actual user roles dynamically during usage
//       // { targetRoles: { $in: userRoles } }
//     ],
//     status: 'active',
//   }).sort({ createdAt: -1 });
// };
// //
// // 📌 Middleware
// //
// notificationSchema.pre('save', function (next) {
//   if (this.isNew && !this.expiresAt) {
//     this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
//   }
//   next();
// });
// //
// // 📌 Export model
// //
// export const Notifications = model<INotification, NotificationModel>(
//   'Notification',
//   notificationSchema
// );
