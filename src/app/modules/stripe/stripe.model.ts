import { model, Schema } from 'mongoose';
import { BillingInterval, DunningStatus, ISubscription, StripeSyncStatus, SubscriptionStatus } from './stripe.interface';

export const dateValidator = {
  validator: function(v: Date) {
    return v instanceof Date && !isNaN(v.getTime());
  },
  message: 'Invalid date: {VALUE}'
};

export const statusHistorySchema = new Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  reason: { type: String },
  changedBy: { 
    type: String, 
    enum: ['system', 'user', 'admin'],
    required: true 
  }
}, { _id: false });

export const invoiceSettingsSchema = new Schema({
  daysUntilDue: { type: Number, default: 30 },
  collectionMethod: { 
    type: String, 
    enum: ['charge_automatically', 'send_invoice'],
    default: 'charge_automatically'
  }
}, { _id: false });

export const pauseDetailsSchema = new Schema({
  reason: { type: String, required: true },
  pausedAt: { type: Date, default: Date.now, validate: [dateValidator] },
  pausedBy: { type: Schema.Types.Mixed, required: true }, 
  notes: { type: String }
}, { _id: false });

// Previous Plan Schema
export const previousPlanSchema = new Schema({
  planType: { type: String, required: true },
  priceId: { type: String, required: true },
  priceAmount: { type: Number, required: true },
  changedAt: { type: Date, default: Date.now, validate: [dateValidator] }
}, { _id: false });

// Pending Plan Schema
export const pendingPlanSchema = new Schema({
  newPlanType: { type: String, required: true },
  newPriceId: { type: String, required: true },
  newPriceAmount: { type: Number, required: true },
  effectiveAt: { type: Date, required: true, validate: [dateValidator] },
  scheduledAt: { type: Date, default: Date.now, validate: [dateValidator] }
}, { _id: false });

// Addon Schema
export const addonSchema = new Schema({
  addonId: { type: String, required: true },
  priceId: { type: String, required: true },
  priceAmount: { type: Number, required: true },
  quantity: { type: Number, default: 1, min: 1 },
  addedAt: { type: Date, default: Date.now, validate: [dateValidator] },
  effectiveAt: { type: Date, validate: [dateValidator] },
  removedAt: { type: Date, validate: [dateValidator] },
  prorationDate: { type: Date, validate: [dateValidator] }
}, { _id: false });

// Payment Method History Schema
export const paymentMethodHistorySchema = new Schema({
  paymentMethodId: { type: String, required: true },
  cardBrand: { type: String, required: true },
  cardLast4: { type: String, required: true },
  activeFrom: { type: Date, required: true, validate: [dateValidator] },
  activeTo: { type: Date, validate: [dateValidator] },
  changedBy: { 
    type: String, 
    enum: ['system', 'user', 'admin'],
    required: true 
  }
}, { _id: false });

// Renewal Prediction Schema
export const renewalPredictionSchema = new Schema({
  willRenew: { type: Boolean, required: true },
  confidence: { type: Number, required: true, min: 0, max: 100 },
  calculatedAt: { type: Date, default: Date.now, validate: [dateValidator] },
  factors: [{ type: String }]
}, { _id: false });

// Sync Error Schema
export const syncErrorSchema = new Schema({
  error: { type: String, required: true },
  occurredAt: { type: Date, default: Date.now, validate: [dateValidator] },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, validate: [dateValidator] },
  resolutionNotes: { type: String }
}, { _id: false });




// models/Subscription.model.ts


const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    
    // Plan information
    planType: { type: String, required: true },
    priceId: { type: String },
    priceAmount: { type: Number },
    currency: { type: String, default: 'usd' },
    billingInterval: {
      type: String,
      enum: Object.values(BillingInterval),
      required: true,
    },
    
    // Status management
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      required: true,
      index: true
    },
    previousStatus: { type: String },
    statusHistory: { type: [statusHistorySchema], default: [] },
    
    // Date management
    currentPeriodStart: { 
      type: Date, 
      required: true,
      validate: [dateValidator]
    },
    currentPeriodEnd: { 
      type: Date, 
      required: true,
      validate: [dateValidator]
    },
    trialStart: { type: Date, validate: [dateValidator] },
    trialEnd: { type: Date, validate: [dateValidator] },
    trialPeriodDays: { type: Number },
    isTrial: { type: Boolean, default: false },
    
    // Billing information
    billingCycleAnchor: { type: Date, validate: [dateValidator] },
    startDate: { type: Date, validate: [dateValidator] },
    quantity: { type: Number, default: 1, min: 1 },
    
    // Cancellation management
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date, validate: [dateValidator] },
    cancelReason: { type: String },
    cancellationFeedback: { type: String },
    
    // Pause management
    paused: { type: Boolean, default: false },
    pauseDetails: { type: pauseDetailsSchema },
    pauseResumesAt: { type: Date, validate: [dateValidator] },
    
    // Invoice and payment management
    latestInvoiceId: { type: String, index: true },
    upcomingInvoiceId: { type: String },
    invoiceSettings: { type: invoiceSettingsSchema },
    paymentFailureCount: { type: Number, default: 0 },
    lastPaymentFailedAt: { type: Date },
    
    // Dunning management
    dunningStatus: { 
      type: String, 
      enum: Object.values(DunningStatus),
      default: DunningStatus.NONE
    },
    dunningEmailsSent: { type: Number, default: 0 },
    lastDunningEmailSentAt: { type: Date },
    nextDunningActionAt: { type: Date },
    
    // Plan versioning
    planVersion: { type: Number, default: 1 },
    previousPlan: { type: previousPlanSchema },
    pendingPlanChanges: { type: pendingPlanSchema },
    
    // Addons
    addons: { type: [addonSchema], default: [] },
    
    // Payment method
    defaultPaymentMethodId: { type: String },
    cardBrand: { type: String },
    cardLast4: { type: String },
    paymentMethodHistory: { type: [paymentMethodHistorySchema], default: [] },
    
    // Analytics
    lifetimeValue: { type: Number, default: 0 },
    monthsActive: { type: Number, default: 0 },
    churnRiskScore: { type: Number, min: 0, max: 100 },
    renewalPrediction: { type: renewalPredictionSchema },
    
    // Metadata
    metadata: { type: Schema.Types.Mixed },
    tags: [{ type: String, index: true }],
    
    // Webhook and sync management
    lastStripeEventId: { type: String },
    lastWebhookReceivedAt: { type: Date },
    lastSyncedAt: { type: Date },
    stripeSyncStatus: {
      type: String,
      enum: Object.values(StripeSyncStatus),
      default: StripeSyncStatus.IN_SYNC
    },
    syncErrors: { type: [syncErrorSchema], default: [] },
    
    // Archiving
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    archiveReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true, sparse: true });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ "addons.addonId": 1 });
subscriptionSchema.index({ tags: 1 });
subscriptionSchema.index({ archived: 1, status: 1 });

// Virtual for isActive
subscriptionSchema.virtual('isActive').get(function() {
  return [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(this.status as SubscriptionStatus);
});

// Virtual for daysUntilRenewal
subscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (!this.currentPeriodEnd) return null;
  const now = new Date();
  const diffTime = this.currentPeriodEnd.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);








const IdempotencyKeySchema = new Schema({
  key: { type: String, required: true },
  scope: { type: String, required: true }, 
  status: { type: String, enum: ["processing", "completed"], default: "processing" },
  responseData: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }, 
  completedAt: { type: Date }
});

// Compound unique index for atomic inserts and fast lookups
IdempotencyKeySchema.index({ key: 1, scope: 1 }, { unique: true });


export const IdempotencyKeyModel = model('IdempotencyKey', IdempotencyKeySchema);
