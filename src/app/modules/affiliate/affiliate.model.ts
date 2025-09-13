import mongoose, { Schema, Model } from 'mongoose';
import {
  BILLINGS,
  IAffiliateLink,
  IClickLog,
  ISubIdPerformance,
  PLANS,
} from './affiliate.interface';
import { DEFAULT_DOMAIN } from './affiliate.utils';
import { model } from 'mongoose';






const subIdPerformanceSchema = new Schema<ISubIdPerformance>(
  {
    affiliateLinkId: {
      type: Schema.Types.ObjectId,
      ref: 'AffiliateLink',
      required: true,
      index: true
    },
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    clicks: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    conversions: { 
      type: Number, 
      default: 0,
      min: 0
    },
    revenue: { 
      type: Number, 
      default: 0,
      min: 0
    },
    commission: { 
      type: Number, 
      default: 0,
      min: 0
    },
    firstClickAt: { 
      type: Date, 
      default: Date.now
    },
    lastClickAt: { 
      type: Date, 
      default: Date.now
    },
    lastConversionAt: { 
      type: Date, 
      default: null
    },
    epc: { 
      type: Number, 
      default: 0,
      min: 0
    },
    deviceBreakdown: {
      desktop: { type: Number, default: 0, min: 0 },
      mobile: { type: Number, default: 0, min: 0 },
      tablet: { type: Number, default: 0, min: 0 }
    },
    campaign: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
subIdPerformanceSchema.index({ affiliateLinkId: 1, subId: 1 }, { unique: true });
subIdPerformanceSchema.index({ affiliateId: 1, subId: 1 });
subIdPerformanceSchema.index({ affiliateId: 1, createdAt: -1 });

// Pre-save middleware to calculate EPC
subIdPerformanceSchema.pre('save', function(this: ISubIdPerformance, next) {
  this.epc = this.clicks > 0 ? this.revenue / this.clicks : 0;
  next();
});

// Virtual for conversion rate
subIdPerformanceSchema.virtual('conversionRate').get(function(this: ISubIdPerformance) {
  return this.clicks > 0 ? (this.conversions / this.clicks) * 100 : 0;
});

export const SubIdPerformance: Model<ISubIdPerformance> = mongoose.model<ISubIdPerformance>('SubIdPerformance', subIdPerformanceSchema);

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
  clickId: { type: String, unique: true, sparse: true },

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

    commissionRate: {
      type: Number,
      default: null,
      min: 0,
      max: 1, 
      validate: {
        validator: function (v: number) {
          return v === null || (v >= 0 && v <= 1);
        },
        message: 'Commission rate must be between 0 and 1',
      },
    },
    epc: { type: Number, default: 0, min: 0 },
    lastClickedAt: { type: Date, default: null },
    lastConvertedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null, index: true },
    tags: { type: [String], default: [], index: true },
    campaign: { type: String, default: null, trim: true, maxlength: 50 },
    clicksByDevice: {
       desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
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
    subIdPerformanceRef: {
      type: Schema.Types.ObjectId,
      ref: 'SubIdPerformance',
      default: null,
      sparse: true
    }
  },
  { timestamps: true }
);

affiliateLinkSchema.index({ createdAt: -1, totalConversions: -1 });
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
// Virtual for conversion rate
// AffiliateLink Schema-এ virtual fields add করুন
affiliateLinkSchema.virtual('totalClicks').get(function(this: IAffiliateLink) {
  return this.clickCount;
});

affiliateLinkSchema.virtual('totalConversions').get(function(this: IAffiliateLink) {
  return this.conversionCount;
});

affiliateLinkSchema.virtual('totalRevenue').get(function(this: IAffiliateLink) {
  return this.revenue;
});

affiliateLinkSchema.virtual('totalCommission').get(function(this: IAffiliateLink) {
  return this.commission;
});
// affiliateLinkSchema.virtual('epc').get(function(this: IAffiliateLink) {
//   return this.clickCount > 0 ? this.revenue / this.clickCount : 0;
// });


// Virtual fields কে JSON response-এ include করতে
affiliateLinkSchema.set('toObject', { virtuals: true });
affiliateLinkSchema.set('toJSON', { virtuals: true });

export const AffiliateLink: Model<IAffiliateLink> = model<IAffiliateLink>(
  'AffiliateLink',
  affiliateLinkSchema
);

const clickLogSchema = new Schema<IClickLog>(
  {
    clickId: { type: String, required: true, unique: true, index: true },
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
    affiliateCode: { type: String, required: true, index: true },
    plan: { type: String, required: true },
    billing: { type: String, required: true },
    subId: { type: String },
    source: { type: String, default: 'affiliate_platform' },
    status: {
      type: String,
      enum: ['clicked', 'converted'],
      default: 'clicked',
    },
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
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true,
    },
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
clickLogSchema.index(
  { clickedAt: 1 },
  { expireAfterSeconds: 180 * 24 * 60 * 60 }
);

// TTL Index (180 days expiration)
clickLogSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 15552000 });

// Duplicate detection optimization - MOST IMPORTANT
clickLogSchema.index({ 
  affiliateLinkId: 1, 
  deviceFingerprint: 1, 
  ip: 1,
  clickedAt: 1
});

// Affiliate performance analytics
clickLogSchema.index({ affiliateId: 1, clickedAt: -1 });
clickLogSchema.index({ affiliateLinkId: 1, clickedAt: -1 });

// Campaign performance analytics
clickLogSchema.index({ campaign: 1, clickedAt: -1 });
clickLogSchema.index({ affiliateId: 1, campaign: 1, clickedAt: -1 });

// Geo and device analytics
clickLogSchema.index({ "geo.country": 1, clickedAt: -1 });
clickLogSchema.index({ deviceType: 1, clickedAt: -1 });

// Conversion tracking
clickLogSchema.index({ conversionId: 1 }, { sparse: true });
clickLogSchema.index({ status: 1, clickedAt: -1 });

// SubId analytics (যদি frequently use করেন)
clickLogSchema.index({ subId: 1, clickedAt: -1 });

export const ClickLog: Model<IClickLog> = mongoose.model<IClickLog>(
  'ClickLog',
  clickLogSchema
);

