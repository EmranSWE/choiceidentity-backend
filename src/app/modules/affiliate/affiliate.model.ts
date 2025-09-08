import mongoose, { Schema, Model } from 'mongoose';
import {
  BILLINGS,
  IAffiliateConversion,
  IAffiliateLink,
  IClickLog,
  PLANS,
} from './affiliate.interface';
import { DEFAULT_DOMAIN } from './affiliate.utils';
import { model } from 'mongoose';

const affiliateLinkSchema = new Schema<IAffiliateLink>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    affiliateCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxLength: 30,
    },
    plan: { type: String, enum: PLANS, required: true },
    billing: { type: String, enum: BILLINGS, required: true },
    subId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
      sparse: true,
      index: true,
    },
    generatedUrl: { type: String, required: true, unique: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
      trim: true,
      maxLength: 120,
    },
    shortSlug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      maxLength: 50,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    clickId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
      index: true,
    },
    clickCount: { type: Number, default: 0, min: 0 },
    conversionCount: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, default: 0, min: 0, max: 100 },
    EPC: { type: Number, default: 0, min: 0 },
    lastClickedAt: { type: Date, default: null },
    lastConvertedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null, index: true },
    tags: { type: [String], default: [], index: true },
    campaign: { type: String, default: null, trim: true, maxlength: 50 },
    clicksByDevice: {
      type: Map,
      of: Number,
      default: { desktop: 0, mobile: 0, tablet: 0 },
    },
    tier: {
      type: String,
      enum: ['standard', 'gold', 'platinum'],
      default: 'standard',
      index: true,
    },
    notes: { type: String, default: null, trim: true, maxlength: 250 },
    customDomain: {
      type: String,
      default: null,
      trim: true,
      maxLength: 100,
    },
  },
  { timestamps: true }
);

affiliateLinkSchema.index(
  {
    affiliateCode: 1,
    plan: 1,
    billing: 1,
    subId: 1,
    status: 1,
  },
  {
    name: 'active_links_composite',
    partialFilterExpression: { status: { $ne: 'deleted' } },
  }
);

affiliateLinkSchema.index(
  {
    status: 1,
    createdAt: -1,
  },
  {
    name: 'status_created_desc',
    partialFilterExpression: { status: { $ne: 'deleted' } },
  }
);

affiliateLinkSchema.index(
  {
    affiliateId: 1,
    createdAt: -1,
  },
  {
    name: 'affiliate_created_desc',
  }
);

affiliateLinkSchema.index(
  { generatedUrl: 1 },
  {
    unique: true,
    name: 'unique_active_url',
    partialFilterExpression: { status: { $ne: 'deleted' } },
  }
);

affiliateLinkSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: 'unique_active_slug',
    partialFilterExpression: { status: { $ne: 'deleted' } },
  }
);

affiliateLinkSchema.index(
  { shortSlug: 1 },
  {
    unique: true,
    name: 'unique_active_short_slug',
    partialFilterExpression: { status: { $ne: 'deleted' } },
  }
);

affiliateLinkSchema.virtual('shortUrl').get(function () {
  const domain = this.customDomain || DEFAULT_DOMAIN;
  return `${domain}/click/${this.shortSlug}`;
});

affiliateLinkSchema.set('toJSON', { virtuals: true });

export const AffiliateLink: Model<IAffiliateLink> = model<IAffiliateLink>(
  'AffiliateLink',
  affiliateLinkSchema
);

// Click Log Schema
const clickLogSchema = new Schema<IClickLog>(
  {
    clickId: { type: String, required: true, unique: true, index: true },
    affiliateLinkId: { type: Schema.Types.ObjectId, ref: "AffiliateLink", required: true, index: true },
    affiliateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    affiliateCode: { type: String, required: true, index: true },
    plan: { type: String, required: true },
    billing: { type: String, required: true },
    subId: { type: String },
    source: { type: String, default: "affiliate_platform" },
    status: { type: String, enum: ["clicked", "converted"], default: "clicked" },
    ip: { type: String, required: true, index: true },
    geo: {
      country: { type: String },
      region: { type: String },
      city: { type: String },
      lat: { type: Number },
      lon: { type: Number },
      timezone: { type: String },
    },
    deviceFingerprint: { type: String, required: true, index: true },
    deviceType: { type: String, enum: ["desktop", "mobile", "tablet"], required: true },
    browser: { type: String, maxlength: 50 },
    browserVersion: { type: String, maxlength: 20 },
    os: { type: String, maxlength: 50 },
    osVersion: { type: String, maxlength: 20 },
    referrer: { type: String },
    campaign: { type: String },
    clickedAt: { type: Date, default: Date.now, index: true },
    conversionId: { type: String },
  },
  { timestamps: true }
);

// TTL: automatically purge old clicks after 180 days
clickLogSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

// Compound indexes for reporting / analytics
clickLogSchema.index({ affiliateLinkId: 1, clickedAt: -1 });
clickLogSchema.index({ affiliateId: 1, clickedAt: -1 });
clickLogSchema.index({ affiliateLinkId: 1, ip: 1, clickedAt: -1 });
clickLogSchema.index({ deviceFingerprint: 1, clickedAt: -1 });

export const ClickLog: Model<IClickLog> = mongoose.model<IClickLog>("ClickLog", clickLogSchema);




// Affiliate Conversion Schema
const affiliateConversionSchema = new Schema<IAffiliateConversion>(
  {
    affiliateLinkId: {
      type: Schema.Types.ObjectId,
      ref: 'AffiliateLink',
      required: true,
      index: true,
    },
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Click → Conversion mapping
    clickLogId: {
      type: Schema.Types.ObjectId,
      ref: 'ClickLog',
      required: false,
      index: true,
    },
    ip: { type: String, required: true, index: true },
    userAgent: { type: String, maxlength: 512 },
    deviceFingerprint: { type: String, index: true },

    // Customer / order details
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, index: true },
    plan: { type: String, enum: PLANS, required: true },
    billing: { type: String, enum: BILLINGS, required: true },
    revenue: { type: Number, required: true, min: 0 },

    // Commission info
    commissionAmount: { type: Number, required: true, min: 0 },
    commissionStatus: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date, default: null, index: true },
    payoutId: { type: String, default: null, index: true },
    // Fraud / validation
    fraudFlag: { type: Boolean, default: false, index: true },
    fraudReason: { type: String, default: null },
    conversionType: { type: String, default: null },
    convertedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Indexing for fast reporting
affiliateConversionSchema.index({ affiliateId: 1, convertedAt: -1 });
affiliateConversionSchema.index({ commissionStatus: 1 });
affiliateConversionSchema.index({ fraudFlag: 1 });
affiliateConversionSchema.index(
  { customerId: 1, affiliateLinkId: 1 },
  { unique: true }
);

export const AffiliateConversion: Model<IAffiliateConversion> =
  mongoose.model<IAffiliateConversion>(
    'AffiliateConversion',
    affiliateConversionSchema
  );
