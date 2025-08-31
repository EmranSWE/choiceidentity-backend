import mongoose, { Types } from 'mongoose';

// Affiliate Link Schema
export type IAffiliateLink = {
  affiliateId: mongoose.Types.ObjectId;
  affiliateCode: string;
  plan: 'basic' | 'ultimate' | 'premium';
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
  revenue?:number;
  commission?:number;
  commissionRate?:number;
  EPC?:number;
  lastClickedAt?: Date | null;
  lastConvertedAt?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  modifiedBy?: mongoose.Types.ObjectId | null;
  expiresAt?: Date | null;
  customDomain?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags?:string;
  campaign?:string;
clicksByDevice?: Record<string, number>; // ← add this
  geoClicks?: Record<string, number>;      // ← add this
  tier?:string;
  notes?:string;
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
  referrer?:string;
  campaign?:string;
  browser?:string;
  os?:string;
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
  paidAt?:Date;
  payoutId?:string;
  conversionType?:string;
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



export type ITableFilters = {
  searchTerm?: string;           
  plan?: string;                 
  billing?: 'monthly' | 'yearly';
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
  plan?: string;                 
  billing?: 'monthly' | 'yearly';
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