import mongoose, { Schema, Model } from 'mongoose';
import { IAffiliateConversion, IAffiliateLink, IClickLog } from './affiliate.interface';
import { v4 as uuidv4 } from 'uuid';

const affiliateLinkSchema = new Schema<IAffiliateLink>(
  {
    affiliateId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    affiliateCode: { type: String, required: true, trim: true, index: true },
    plan: { type: String, enum: ['basic', 'plus', 'elite'], required: true },
    billing: { type: String, enum: ['monthly', 'yearly'], required: true },
    subId: { type: String, default: null, trim: true, maxlength: 50 },
    generatedUrl: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    shortSlug: { type: String, unique: true, trim: true, lowercase: true, index: true },
    transactionId: { type: String, required: true, unique: true, index: true, trim: true },
    clickId: { type: String, required: true, unique: true, index: true, trim: true },
    status: { type: String, enum: ['active', 'paused', 'deleted'], default: 'active', index: true },
    clickCount: { type: Number, default: 0, min: 0 },
    conversionCount: { type: Number, default: 0, min: 0 },
    lastClickedAt: { type: Date, default: null },
    lastConvertedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null, index: true },
    customDomain: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: (v: string | null) => {
          if (!v) return true;
          return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(v);
        },
        message: (props: any) => `${props.value} is not a valid domain name!`,
      },
    },
  },
  { timestamps: true }
);

// ✅ Partial unique index for active links
affiliateLinkSchema.index(
  { generatedUrl: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'deleted' } } }
);

// ✅ Pre-validate hook (modern async, no next)
affiliateLinkSchema.pre('validate', async function () {
  // Auto-generate UUIDs if missing
  if (!this.transactionId) this.transactionId = uuidv4();
  if (!this.clickId) this.clickId = uuidv4();

  // Only check uniqueness if generatedUrl was modified
  if (this.isModified('generatedUrl')) {
    const AffiliateLinkModel = this.constructor as Model<IAffiliateLink>;
    const existing = await AffiliateLinkModel.findOne({
      generatedUrl: this.generatedUrl,
      _id: { $ne: this._id },
      status: { $ne: 'deleted' },
    });

    if (existing) {
      throw new Error('generatedUrl must be unique among active links');
    }
  }
});



export const AffiliateLink: Model<IAffiliateLink> = mongoose.model<IAffiliateLink>(
  'AffiliateLink',
  affiliateLinkSchema
);

// Click Log Schema
const clickLogSchema = new Schema<IClickLog>({
  affiliateLinkId: { type: Schema.Types.ObjectId, ref: 'AffiliateLink', required: true, index: true },
  affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
  ip: { type: String, required: true, index: true },       
  userAgent: { type: String, required: false, maxlength: 512 }, 
  clickedAt: { type: Date, default: Date.now, index: true },
  geoLocation: {                                       
    country: { type: String },
    region: { type: String },
    city: { type: String },
  },
  deviceFingerprint: { type: String, index: true },      
}, { timestamps: true });

clickLogSchema.index(
  { clickedAt: 1 },
  { expireAfterSeconds: 180 * 24 * 60 * 60 } 
);

export const ClickLog: Model<IClickLog> = mongoose.model<IClickLog>('ClickLog', clickLogSchema);



// Affiliate Conversion Schema
const affiliateConversionSchema = new Schema<IAffiliateConversion>(
  {
    affiliateLinkId: { type: Schema.Types.ObjectId, ref: 'AffiliateLink', required: true, index: true },
    affiliateId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Click → Conversion mapping
    clickLogId: { type: Schema.Types.ObjectId, ref: 'ClickLog', required: false, index: true },
    ip: { type: String, required: true, index: true },
    userAgent: { type: String, maxlength: 512 },
    deviceFingerprint: { type: String, index: true },

    // Customer / order details
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, index: true },  
    plan: { type: String, enum: ['basic', 'plus', 'elite'], required: true },
    billing: { type: String, enum: ['monthly', 'yearly'], required: true },
    revenue: { type: Number, required: true, min: 0 },

    // Commission info
    commissionAmount: { type: Number, required: true, min: 0 },
    commissionStatus: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending', index: true },

    // Fraud / validation
    fraudFlag: { type: Boolean, default: false, index: true },
    fraudReason: { type: String, default: null },

    convertedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Indexing for fast reporting
affiliateConversionSchema.index({ affiliateId: 1, convertedAt: -1 });
affiliateConversionSchema.index({ commissionStatus: 1 });
affiliateConversionSchema.index({ fraudFlag: 1 });
affiliateConversionSchema.index({ customerId: 1, affiliateLinkId: 1 }, { unique: true });

export const AffiliateConversion: Model<IAffiliateConversion> =
  mongoose.model<IAffiliateConversion>('AffiliateConversion', affiliateConversionSchema);
