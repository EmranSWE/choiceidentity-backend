"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyKeyModel = exports.Subscription = exports.syncErrorSchema = exports.renewalPredictionSchema = exports.paymentMethodHistorySchema = exports.addonSchema = exports.pendingPlanSchema = exports.previousPlanSchema = exports.pauseDetailsSchema = exports.invoiceSettingsSchema = exports.statusHistorySchema = exports.dateValidator = void 0;
const mongoose_1 = require("mongoose");
const stripe_interface_1 = require("./stripe.interface");
exports.dateValidator = {
    validator: function (v) {
        return v instanceof Date && !isNaN(v.getTime());
    },
    message: 'Invalid date: {VALUE}'
};
exports.statusHistorySchema = new mongoose_1.Schema({
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String },
    changedBy: {
        type: String,
        enum: ['system', 'user', 'admin'],
        required: true
    }
}, { _id: false });
exports.invoiceSettingsSchema = new mongoose_1.Schema({
    daysUntilDue: { type: Number, default: 30 },
    collectionMethod: {
        type: String,
        enum: ['charge_automatically', 'send_invoice'],
        default: 'charge_automatically'
    }
}, { _id: false });
exports.pauseDetailsSchema = new mongoose_1.Schema({
    reason: { type: String, required: true },
    pausedAt: { type: Date, default: Date.now, validate: [exports.dateValidator] },
    pausedBy: { type: mongoose_1.Schema.Types.Mixed, required: true },
    notes: { type: String }
}, { _id: false });
// Previous Plan Schema
exports.previousPlanSchema = new mongoose_1.Schema({
    planType: { type: String, required: true },
    priceId: { type: String, required: true },
    priceAmount: { type: Number, required: true },
    changedAt: { type: Date, default: Date.now, validate: [exports.dateValidator] }
}, { _id: false });
// Pending Plan Schema
exports.pendingPlanSchema = new mongoose_1.Schema({
    newPlanType: { type: String, required: true },
    newPriceId: { type: String, required: true },
    newPriceAmount: { type: Number, required: true },
    effectiveAt: { type: Date, required: true, validate: [exports.dateValidator] },
    scheduledAt: { type: Date, default: Date.now, validate: [exports.dateValidator] }
}, { _id: false });
// Addon Schema
exports.addonSchema = new mongoose_1.Schema({
    addonId: { type: String, required: true },
    priceId: { type: String, required: true },
    priceAmount: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    addedAt: { type: Date, default: Date.now, validate: [exports.dateValidator] },
    effectiveAt: { type: Date, validate: [exports.dateValidator] },
    removedAt: { type: Date, validate: [exports.dateValidator] },
    prorationDate: { type: Date, validate: [exports.dateValidator] }
}, { _id: false });
// Payment Method History Schema
exports.paymentMethodHistorySchema = new mongoose_1.Schema({
    paymentMethodId: { type: String, required: true },
    cardBrand: { type: String, required: true },
    cardLast4: { type: String, required: true },
    activeFrom: { type: Date, required: true, validate: [exports.dateValidator] },
    activeTo: { type: Date, validate: [exports.dateValidator] },
    changedBy: {
        type: String,
        enum: ['system', 'user', 'admin'],
        required: true
    }
}, { _id: false });
// Renewal Prediction Schema
exports.renewalPredictionSchema = new mongoose_1.Schema({
    willRenew: { type: Boolean, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    calculatedAt: { type: Date, default: Date.now, validate: [exports.dateValidator] },
    factors: [{ type: String }]
}, { _id: false });
// Sync Error Schema
exports.syncErrorSchema = new mongoose_1.Schema({
    error: { type: String, required: true },
    occurredAt: { type: Date, default: Date.now, validate: [exports.dateValidator] },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, validate: [exports.dateValidator] },
    resolutionNotes: { type: String }
}, { _id: false });
// models/Subscription.model.ts
const subscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    // Plan information
    planType: { type: String, required: true },
    priceId: { type: String },
    priceAmount: { type: Number },
    currency: { type: String, default: 'usd' },
    billingInterval: {
        type: String,
        enum: Object.values(stripe_interface_1.BillingInterval),
        required: true,
    },
    // Status management
    status: {
        type: String,
        enum: Object.values(stripe_interface_1.SubscriptionStatus),
        required: true,
        index: true
    },
    previousStatus: { type: String },
    statusHistory: { type: [exports.statusHistorySchema], default: [] },
    // Date management
    currentPeriodStart: {
        type: Date,
        required: true,
        validate: [exports.dateValidator]
    },
    currentPeriodEnd: {
        type: Date,
        required: true,
        validate: [exports.dateValidator]
    },
    trialStart: { type: Date, validate: [exports.dateValidator] },
    trialEnd: { type: Date, validate: [exports.dateValidator] },
    trialPeriodDays: { type: Number },
    isTrial: { type: Boolean, default: false },
    // Billing information
    billingCycleAnchor: { type: Date, validate: [exports.dateValidator] },
    startDate: { type: Date, validate: [exports.dateValidator] },
    quantity: { type: Number, default: 1, min: 1 },
    // Cancellation management
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date, validate: [exports.dateValidator] },
    cancelReason: { type: String },
    cancellationFeedback: { type: String },
    // Pause management
    paused: { type: Boolean, default: false },
    pauseDetails: { type: exports.pauseDetailsSchema },
    pauseResumesAt: { type: Date, validate: [exports.dateValidator] },
    // Invoice and payment management
    latestInvoiceId: { type: String, index: true },
    upcomingInvoiceId: { type: String },
    invoiceSettings: { type: exports.invoiceSettingsSchema },
    paymentFailureCount: { type: Number, default: 0 },
    lastPaymentFailedAt: { type: Date },
    // Dunning management
    dunningStatus: {
        type: String,
        enum: Object.values(stripe_interface_1.DunningStatus),
        default: stripe_interface_1.DunningStatus.NONE
    },
    dunningEmailsSent: { type: Number, default: 0 },
    lastDunningEmailSentAt: { type: Date },
    nextDunningActionAt: { type: Date },
    // Plan versioning
    planVersion: { type: Number, default: 1 },
    previousPlan: { type: exports.previousPlanSchema },
    pendingPlanChanges: { type: exports.pendingPlanSchema },
    // Addons
    addons: { type: [exports.addonSchema], default: [] },
    // Payment method
    defaultPaymentMethodId: { type: String },
    cardBrand: { type: String },
    cardLast4: { type: String },
    paymentMethodHistory: { type: [exports.paymentMethodHistorySchema], default: [] },
    // Analytics
    lifetimeValue: { type: Number, default: 0 },
    monthsActive: { type: Number, default: 0 },
    churnRiskScore: { type: Number, min: 0, max: 100 },
    renewalPrediction: { type: exports.renewalPredictionSchema },
    // Metadata
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    tags: [{ type: String, index: true }],
    // Webhook and sync management
    lastStripeEventId: { type: String },
    lastWebhookReceivedAt: { type: Date },
    lastSyncedAt: { type: Date },
    stripeSyncStatus: {
        type: String,
        enum: Object.values(stripe_interface_1.StripeSyncStatus),
        default: stripe_interface_1.StripeSyncStatus.IN_SYNC
    },
    syncErrors: { type: [exports.syncErrorSchema], default: [] },
    // Archiving
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    archiveReason: { type: String },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for performance
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true, sparse: true });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ "addons.addonId": 1 });
subscriptionSchema.index({ tags: 1 });
subscriptionSchema.index({ archived: 1, status: 1 });
// Virtual for isActive
subscriptionSchema.virtual('isActive').get(function () {
    return [stripe_interface_1.SubscriptionStatus.ACTIVE, stripe_interface_1.SubscriptionStatus.TRIALING].includes(this.status);
});
// Virtual for daysUntilRenewal
subscriptionSchema.virtual('daysUntilRenewal').get(function () {
    if (!this.currentPeriodEnd)
        return null;
    const now = new Date();
    const diffTime = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
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
