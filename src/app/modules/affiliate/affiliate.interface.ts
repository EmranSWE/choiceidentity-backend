import mongoose, { Types } from 'mongoose';

// Affiliate Link Schema
export type IAffiliateLink = {
  affiliateId: mongoose.Types.ObjectId;
  affiliateCode: string;
  plan: 'basic' | 'plus' | 'elite';
  billing: 'monthly' | 'yearly';
  subId?: string | null;
  generatedUrl: string;
  slug: string;
  shortSlug:string,
  transactionId: string;
  clickId: string;
  status: 'active' | 'paused' | 'deleted';
  clickCount: number;
  conversionCount: number;
  lastClickedAt?: Date | null;
  lastConvertedAt?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  modifiedBy?: mongoose.Types.ObjectId | null;
  expiresAt?: Date | null;
  customDomain?: string | null;
  createdAt: Date;
  updatedAt: Date;
} & Document;

// Click Log Schema
export type IClickLog = {
  affiliateLinkId: mongoose.Types.ObjectId;
  affiliateId: mongoose.Types.ObjectId;
  ip: string;
  userAgent?: string;
  clickedAt?: Date;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  deviceFingerprint?: string;
};

// Affiliate Conversion Schema
export type IAffiliateConversion = {
  affiliateLinkId: Types.ObjectId;
  affiliateId: Types.ObjectId;
  clickLogId?: Types.ObjectId | null;
  ip: string;
  userAgent?: string;
  deviceFingerprint?: string;
  customerId: Types.ObjectId;
  orderId?: string;

  plan: 'basic' | 'plus' | 'elite';
  billing: 'monthly' | 'yearly';
  revenue: number;

  commissionAmount: number;
  commissionStatus: 'pending' | 'approved' | 'paid' | 'rejected';

  fraudFlag?: boolean;
  fraudReason?: string | null;

  convertedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type GenerateAffiliateLinkPayload = {
  affiliateCode: string;
  plan: 'basic' | 'plus' | 'elite';
  billing: 'monthly' | 'yearly';
  subId?: string | null;
  createdBy?: string;
  customDomain?: string | null;
  expiresAt?: Date | null;
};
