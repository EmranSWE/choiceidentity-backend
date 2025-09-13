import mongoose, { Types } from 'mongoose';

export const PLANS = ['basic', 'ultimate', 'premium', 'life_time'] as const;
export const BILLINGS = ['monthly', 'yearly', 'lifetime'] as const;

export type PlanType = (typeof PLANS)[number];
export type BillingType = (typeof BILLINGS)[number];

export type ISubIdPerformance = {
  affiliateLinkId: mongoose.Types.ObjectId;
  affiliateId: mongoose.Types.ObjectId;
  subId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  firstClickAt: Date;
  lastClickAt: Date;
  lastConversionAt: Date | null;
  epc: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  campaign: string | null;
  status: 'active' | 'paused';
  createdAt: Date;
  updatedAt: Date;
} & Document

// Affiliate Link Schema
export type IAffiliateLink = {
  affiliateId: mongoose.Types.ObjectId;
  affiliateCode: string;
  plan: PlanType;
  billing: BillingType;
  subId?: string | null;
  generatedUrl: string;
  slug: string;
  shortSlug: string;
  transactionId: string;
  clickId: string;
  status: 'active' | 'paused' | 'deleted';
  clickCount: number;
  conversionCount: number;
  revenue: number;
  commission: number;
  commissionRate: number;
  epc: number;
  lastClickedAt?: Date | null;
  lastConvertedAt?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  modifiedBy?: mongoose.Types.ObjectId | null;
  expiresAt?: Date | null;
  customDomain?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: string;
  campaign?: string;
  clicksByDevice?: Record<string, number>;
  geoClicks?: Record<string, number>; 
  tier?: string;
  notes?: string;
  subIdPerformanceRef?: mongoose.Types.ObjectId | null;
  totalClicks?: number;
  totalConversions?: number;
  totalRevenue?: number;
  totalCommission?: number;
  shortUrl?: string;
    longUrl?: string;
} & Document;

// Click Log Schema
export type IClickLog = {
  clickId: string;
  affiliateLinkId: mongoose.Types.ObjectId;
  affiliateId: mongoose.Types.ObjectId;
  affiliateCode: string;
  plan: string;
  billing: string;
  subId?: string;
  source: string;
  status: "clicked" | "converted";
  ip: string;
  geo: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
  };
  deviceFingerprint: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  referrer?: string;
  campaign?: string;
  clickedAt: Date;
  conversionId?: string; // optional for linking conversions
  createdAt?: Date;
  updatedAt?: Date;
}



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

  plan: PlanType;
  billing: BillingType;
  revenue: number;

  commissionAmount: number;
  commissionStatus: 'pending' | 'approved' | 'paid' | 'rejected';

  fraudFlag?: boolean;
  fraudReason?: string | null;

  convertedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  paidAt?: Date;
  payoutId?: string;
  conversionType?: string;
};

export type ITableFilters = {
  searchTerm?: string;
  plan?: PlanType;
  billing?: BillingType;
  startDate?: Date;
  endDate?: Date;
  minClicks?: number;
  maxClicks?: number;
  minRevenue?: number;
  maxRevenue?: number;
  minEarning?: number;
  maxEarning?: number;
};

export type ITableSearchFilters = {
  searchTerm?: string;
  subId?: string;
  url?: string;
  campaign?: string;
  plan?: PlanType;
  billing?: BillingType;
  dateRange?: {
    from: Date;
    to: Date;
  };
  minClicks?: number;
  maxClicks?: number;
  minRevenue?: number;
  maxRevenue?: number;
  minEarning?: number;
  maxEarning?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type GenerateAffiliateLinkPayload = {
  affiliateCode: string;
  plan: PlanType;
  billing: BillingType;
  subId?: string | null;
  createdBy: string;
  customDomain?: string | null;
  expiresAt?: Date | null;
  source?: string;
  idempotencyKey?: string | null;
  commissionRate?: number;
};
