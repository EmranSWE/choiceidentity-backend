"use strict";
// import mongoose, { Schema, Document, Model, model } from 'mongoose';
// import {
//   PaymentIntentDocument,
//   CheckoutSessionDocument,
//   StripeSubscriptionDocument,
//   ISubscription,
//   IAddon,
//   IPauseDetails,
//   BillingInterval
// } from './stripe.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyKeyModel = exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const stripe_interface_1 = require("./stripe.interface");
// // Types
// type IPaymentIntent = PaymentIntentDocument & Document;
// type ICheckoutSession = CheckoutSessionDocument & Document;
// type IStripeSubscription = StripeSubscriptionDocument & Document;
// // ===============================
// // ENUMS (sync with interfaces)
// // ===============================
// const PaymentIntentStatus = [
//   'requires_payment_method',
//   'requires_confirmation',
//   'requires_action',
//   'processing',
//   'succeeded',
//   'canceled'
// ] as const;
// const CheckoutSessionStatus = ['open', 'complete', 'expired', 'canceled'] as const;
// const SessionMode = ['payment', 'subscription'] as const;
// const SubscriptionStatus = [
//   'incomplete',
//   'incomplete_expired',
//   'trialing',
//   'active',
//   'past_due',
//   'canceled',
//   'unpaid',
//   'paused',
//   'expired'
// ] as const;
// const SourceTypes = ['web', 'api', 'admin', 'partner'] as const;
// const RenewalBehavior = ['auto_renew', 'cancel_on_period_end'] as const;
// const BillingBehavior = ['prorate', 'none'] as const;
// // ===============================
// // PaymentIntent Schema
// // ===============================
// const PaymentIntentSchema = new Schema<IPaymentIntent>(
//   {
//     userId: { type: String, required: true, index: true },
//     customerId: { type: String, index: true },
//     priceId: { type: String, required: true },
//     amount: { type: Number, required: true },
//     currency: { type: String, required: true, default: 'usd' },
//     status: {
//       type: String,
//       enum: PaymentIntentStatus,
//       required: true,
//       default: 'requires_payment_method'
//     },
//     paymentIntentId: { type: String, required: true, unique: true, index: true },
//     clientSecret: { type: String, required: true },
//     metadata: { type: Map, of: String, default: {} },
//     ipAddress: String,
//     userAgent: String,
//     source: { type: String, enum: SourceTypes },
//     initiatedBy: String
//   },
//   {
//     timestamps: true,
//     collection: 'payment_intents'
//   }
// );
// PaymentIntentSchema.index({ userId: 1, createdAt: -1 });
// // ===============================
// // CheckoutSession Schema
// // ===============================
// const CheckoutSessionSchema = new Schema<ICheckoutSession>(
//   {
//     userId: { type: String, required: true, index: true },
//     customerId: { type: String, index: true },
//     priceId: { type: String, required: true },
//     sessionId: { type: String, required: true, unique: true, index: true },
//     status: {
//       type: String,
//       enum: CheckoutSessionStatus,
//       required: true,
//       default: 'open'
//     },
//     mode: {
//       type: String,
//       enum: SessionMode,
//       required: true,
//       default: 'payment'
//     },
//     successUrl: { type: String, required: true },
//     cancelUrl: { type: String, required: true },
//     amount: Number,
//     currency: { type: String, default: 'usd' },
//     metadata: { type: Map, of: String, default: {} },
//     ipAddress: String,
//     userAgent: String,
//     source: { type: String, enum: SourceTypes },
//     initiatedBy: String,
//     expiresAt: {
//       type: Date,
//       required: true,
//       index: { expireAfterSeconds: 0 }
//     }
//   },
//   {
//     timestamps: true,
//     collection: 'checkout_sessions'
//   }
// );
// CheckoutSessionSchema.index({ userId: 1, createdAt: -1 });
// // ===============================
// // StripeSubscription Schema
// // ===============================
// const StripeSubscriptionSchema = new Schema<IStripeSubscription>(
//   {
//     userId: { type: String, required: true, index: true },
//     subscriptionId: { type: String, required: true, unique: true, index: true },
//     customerId: { type: String, required: true, index: true },
//     priceId: { type: String, required: true },
//     planName: String,
//     status: {
//       type: String,
//       enum: SubscriptionStatus,
//       required: true
//     },
//     currentPeriodStart: { type: Date, required: true },
//     currentPeriodEnd: { type: Date, required: true },
//     trialStart: Date,
//     trialEnd: Date,
//     cancelAt: Date,
//     canceledAt: Date,
//     endedAt: Date,
//     renewalBehavior: {
//       type: String,
//       enum: RenewalBehavior,
//       default: 'auto_renew'
//     },
//     billingBehavior: {
//       type: String,
//       enum: BillingBehavior,
//       default: 'prorate'
//     },
//     prorationDate: Date,
//     nextInvoiceDate: Date,
//     currency: { type: String, default: 'usd' },
//     metadata: { type: Map, of: String, default: {} },
//     source: { type: String, enum: SourceTypes },
//     initiatedBy: String
//   },
//   {
//     timestamps: true,
//     collection: 'subscriptions'
//   }
// );
// StripeSubscriptionSchema.index({ userId: 1, createdAt: -1 });
// StripeSubscriptionSchema.index({ status: 1 });
// // ===============================
// // Model Exports
// // ===============================
// export const PaymentIntent: Model<IPaymentIntent> = mongoose.model('PaymentIntent', PaymentIntentSchema);
// export const CheckoutSession: Model<ICheckoutSession> = mongoose.model('CheckoutSession', CheckoutSessionSchema);
// export const StripeSubscription: Model<IStripeSubscription> = mongoose.model('StripeSubscription', StripeSubscriptionSchema);
const addonSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
}, { _id: false });
const pauseDetailsSchema = new mongoose_1.Schema({
    reason: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
}, { _id: false });
const subscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeSubscriptionId: { type: String },
    planType: { type: String, required: true },
    priceId: { type: String },
    billingInterval: {
        type: String,
        enum: Object.values(stripe_interface_1.BillingInterval),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(stripe_interface_1.SubscriptionStatus),
        required: true,
    },
    quantity: { type: Number, default: 1 },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    trialStart: { type: Date },
    trialEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelAt: { type: Date, default: null },
    cancelReason: { type: String },
    paused: { type: Boolean, default: false },
    pauseDetails: { type: pauseDetailsSchema },
    latestInvoiceId: { type: String },
    addons: { type: [addonSchema], default: [] },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    defaultPaymentMethodId: { type: String },
    cardBrand: { type: String },
    cardLast4: { type: String },
    lastStripeEventId: { type: String },
    lastSyncedAt: { type: Date },
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
}, {
    timestamps: true,
});
exports.Subscription = (0, mongoose_1.model)("Subscription", subscriptionSchema);
const IdempotencyKeySchema = new mongoose_1.Schema({
    key: { type: String, required: true },
    scope: { type: String, required: true },
    status: { type: String, enum: ["processing", "completed"], default: "processing" },
    responseData: { type: mongoose_1.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
    completedAt: { type: Date }
});
// Compound unique index for atomic inserts and fast lookups
IdempotencyKeySchema.index({ key: 1, scope: 1 }, { unique: true });
exports.IdempotencyKeyModel = (0, mongoose_1.model)('IdempotencyKey', IdempotencyKeySchema);
