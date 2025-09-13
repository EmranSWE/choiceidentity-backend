/* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/no-this-alias */

import { ClientSession, Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../../../config';
import { ENUM_GENDER, ENUM_USER_ROLE } from '../../../enums/user';
import { decrypt, encrypt, stripe, validateSSN } from './auth.utils';
import { IAdminSetupToken } from './auth.interface';
// Address Schema
const AddressSchema = new Schema(
  {
    street: { type: String, required: true },
    apartment: { type: String },
    zipCode: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'USA' },
  },
  { _id: false }
);

// Admin Profile Schema
const AdminProfileSchema = new Schema(
  {
    permissions: {
      global: { type: Boolean, default: false },
      userManagement: { type: Boolean, default: false },
      contentManagement: { type: Boolean, default: false },
      billingManagement: { type: Boolean, default: false },
      systemSettings: { type: Boolean, default: false },
      affiliateManagement: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      apiManagement: { type: Boolean, default: false },
    },
    accessLevel: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'write',
    },
    assignedModules: [String],
    lastAccessReview: Date,
    securityClearance: {
      type: String,
      enum: ['basic', 'elevated', 'high'],
      default: 'basic',
    },
    twoFactorEnforced: { type: Boolean, default: false },
    loginRestrictions: {
      ipWhitelist: [String],
      timeRestrictions: {
        start: String,
        end: String,
      },
      deviceRestrictions: { type: Boolean, default: false },
    },
    auditLogAccess: { type: Boolean, default: false },
    canImpersonate: { type: Boolean, default: false },
    apiRateLimit: { type: Number, default: 1000 },
    sessionTimeout: { type: Number, default: 3600 },
  },
  { _id: false }
);

const AffiliateSchema = new Schema({
  // ==================== APPLICATION & ONBOARDING ====================
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  skypeId: { type: String, trim: true },
  yourWebsite: { type: String, trim: true, lowercase: true },
  trafficSources: [String],
  channels: [String],
  howPromote: { type: String, maxlength: 1000 },
  describeExperience: { type: String, maxlength: 2000 },
  pastExperience: { type: String, maxlength: 2000 },
  lookingCampaign: { type: String, maxlength: 1000 },
  whenYouFree: String,
  idPhotoFront: { type: String, select: false },
  idPhotoBack: { type: String, select: false },
  timeZone: String,
  didYouHear: String,
  phone: { type: String, select: false },
  alternativePhone: { type: String, select: false },

  // ==================== APPROVAL & ADMIN MANAGEMENT ====================
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended', 'under_review'],
    default: 'pending',
  },
  adminNotes: String,
  reviewDate: Date,
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  contractSigned: { type: Boolean, default: false },
  contractVersion: String,
  contractSignedAt: Date,
  contractDocument: String,

  // ==================== REFERRAL & COMMISSION TRACKING ====================
  referralCode: {
    type: String,
    unique: true,
    index: true,
    sparse: true,
    uppercase: true,
    match: [
      /^[A-Z0-9]{8,12}$/,
      'Referral code must be 8-12 alphanumeric characters',
    ],
  },
  referralSource: String,

  referrals: [
    {
      amount: { type: Number }, // Sale amount
      commission: { type: Number }, // Commission earned
      plan: { type: String }, // Product plan
      billingInterval: { type: String }, // Billing cycle
      clickId: { type: String }, // For click-based attribution
      convertedAt: { type: Date, default: Date.now }, // Conversion timestamp,
      email: { type: String, lowercase: true },
      customerName: String,
      customerId: { type: Schema.Types.ObjectId, ref: 'User' },
      subscriptionId: String,
      orderId: String,
      date: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: [
          'pending',
          'confirmed',
          'paid',
          'rejected',
          'canceled',
          'refunded',
          'chargeback',
        ],
        default: 'pending',
      },
      commissionAmount: { type: Number, default: 0, min: 0 },
      orderValue: { type: Number, default: 0, min: 0 },
      productType: String,
      productId: String,
      affiliateCodeUsed: String,
      conversionDate: Date,
      payoutDate: Date,
      commissionRate: { type: Number, default: 0.2 },
      notes: String,
      customRulesApplied: [String],
    },
  ],

  // ==================== FINANCIAL MANAGEMENT ====================
  commissionBalance: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },
  pendingEarnings: { type: Number, default: 0, min: 0 },
  confirmedEarnings: { type: Number, default: 0, min: 0 },
  paidEarnings: { type: Number, default: 0, min: 0 },
  lifetimeEarnings: { type: Number, default: 0, min: 0 },
  adjustedEarnings: { type: Number, default: 0 },
  payoutThreshold: { type: Number, default: 50, min: 0 },

  totalReferrals: { type: Number, default: 0, min: 0 },
  successfulReferrals: { type: Number, default: 0, min: 0 },
  pendingCommissions: { type: Number, default: 0, min: 0 },
  confirmedCommissions: { type: Number, default: 0, min: 0 },
  paidCommissions: { type: Number, default: 0, min: 0 },



  // ==================== PERFORMANCE ANALYTICS ====================
  performanceMetrics: {
    clicks: { type: Number, default: 0, min: 0 },
    signups: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    revenue: { type: Number, default: 0, min: 0 },
    revenueGenerated: { type: Number, default: 0, min: 0 },
    averageOrderValue: { type: Number, default: 0, min: 0 },
    clickThroughRate: { type: Number, default: 0, min: 0, max: 100 },
    earningsPerClick: { type: Number, default: 0, min: 0 },
    returnOnInvestment: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    historicalData: [
      {
        date: Date,
        clicks: Number,
        conversions: Number,
        revenue: Number,
        commissions: Number,
      },
    ],
  },
  // ==================== PAYOUT SYSTEM ====================
  payoutMethod: {
    type: {
      type: String,
      enum: [
        'paypal',
        'bank_transfer',
        'check',
        'crypto',
        'wire_transfer',
        'skrill',
        'payoneer',
      ],
    },
    details: Schema.Types.Mixed,
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationDocuments: [String],
    primary: { type: Boolean, default: true },
  },

  payoutHistory: [
    {
      payoutId: { type: String, unique: true, sparse: true },
      amount: { type: Number, required: true, min: 0 },
      netAmount: { type: Number, min: 0 },
      fees: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'USD' },
      date: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: [
          'pending',
          'processing',
          'paid',
          'failed',
          'cancelled',
          'rejected',
          'on_hold',
        ],
        default: 'pending',
      },
      transactionId: String,
      paymentMethod: String,
      reference: String,
      notes: String,
      processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      estimatedArrival: Date,
      actualArrival: Date,
      taxDocumentGenerated: { type: Boolean, default: false },
    },
  ],


  // ==================== TIER & COMMISSION STRUCTURE ====================
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'],
    default: 'bronze',
  },
  commissionRate: { type: Number, default: 0.2, min: 0, max: 1 },
  customCommissionRules: [
    {
      ruleId: { type: String, required: true },
      productId: String,
      productName: String,
      productCategory: String,
      commissionRate: { type: Number, required: true, min: 0, max: 1 },
      commissionType: {
        type: String,
        enum: ['percentage', 'fixed', 'hybrid'],
        default: 'percentage',
      },
      fixedAmount: { type: Number, min: 0 },
      startDate: { type: Date, required: true },
      endDate: Date,
      isActive: { type: Boolean, default: true },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
      conditions: Schema.Types.Mixed,
      priority: { type: Number, default: 1, min: 1, max: 100 },
    },
  ],

  // ==================== BONUS & INCENTIVE SYSTEM ====================
  performanceBonuses: [
    {
      bonusId: { type: String, required: true },
      name: String,
      amount: { type: Number, required: true, min: 0 },
      reason: String,
      type: {
        type: String,
        enum: [
          'signup',
          'revenue',
          'conversion',
          'retention',
          'special',
          'holiday',
        ],
        default: 'conversion',
      },
      dateAwarded: { type: Date, default: Date.now },
      targetMet: String,
      status: {
        type: String,
        enum: ['awarded', 'paid', 'pending', 'cancelled', 'forfeited'],
        default: 'awarded',
      },
      payoutDate: Date,
      conditions: Schema.Types.Mixed,
      awardedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      notes: String,
    },
  ],

  // ==================== ACCOUNT STATUS & LIFECYCLE ====================
  isActive: { type: Boolean, default: true },
  activationDate: Date,
  deactivationDate: Date,
  deactivationReason: String,
  reactivationDate: Date,
  lastPayoutDate: Date,
  nextPayoutDate: Date,
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated', 'grace_period'],
    default: 'active',
  },

  // ==================== TAX & LEGAL COMPLIANCE ====================
  taxInfo: {
    taxId: { type: String, select: false },
    taxForm: {
      type: String,
      enum: ['W-9', 'W-8BEN', 'W-8BEN-E', 'W-8ECI', 'W-8IMY', 'Other'],
    },
    formSubmitted: { type: Boolean, default: false },
    submittedAt: Date,
    verifiedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    taxYear: Number,
    taxDocument: String,
    taxStatus: {
      type: String,
      enum: ['not_required', 'pending', 'verified', 'rejected', 'expired'],
      default: 'not_required',
    },
    countryOfTaxResidency: String,
    usTaxTreatyClaimed: { type: Boolean, default: false },
  },

  termsAccepted: {
    affiliateAgreement: { type: Boolean, default: false },
    dataProcessing: { type: Boolean, default: false },
    acceptedAt: Date,
    agreementVersion: String,
    ipAddress: String,
    userAgent: String,
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },

  // ==================== COMMUNICATION PREFERENCES ====================
  affiliateCommunications: {
    newCommissionAlerts: { type: Boolean, default: true },
    payoutNotifications: { type: Boolean, default: true },
    performanceReports: {
      frequency: {
        type: String,
        enum: ['weekly', 'bi_weekly', 'monthly', 'quarterly', 'never'],
        default: 'monthly',
      },
      format: {
        type: String,
        enum: ['email', 'pdf', 'dashboard', 'all'],
        default: 'email',
      },
    },
    promotionalOffers: { type: Boolean, default: true },
    educationalContent: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: true },
    lastCommunicationSent: Date,
    unsubscribeReason: String,
    preferredLanguage: { type: String, default: 'en' },
  },

  // ==================== RELATIONSHIP MANAGEMENT ====================
  affiliateManager: { type: Schema.Types.ObjectId, ref: 'User' },
  accountManager: { type: Schema.Types.ObjectId, ref: 'User' },
  supportContact: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: [
    {
      content: String,
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
      category: {
        type: String,
        enum: ['general', 'support', 'billing', 'performance', 'compliance'],
      },
      isInternal: { type: Boolean, default: false },
    },
  ],

  // ==================== MARKETING & PROMOTION ====================
  marketingMaterials: [
    {
      name: String,
      type: {
        type: String,
        enum: ['banner', 'link', 'email', 'social', 'video', 'document'],
      },
      url: String,
      description: String,
      created: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true },
      performance: {
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        lastUsed: Date,
      },
    },
  ],

  landingPageClicks: { type: Number, default: 0, min: 0 },
  uniqueVisitors: { type: Number, default: 0, min: 0 },
  impressionCount: { type: Number, default: 0, min: 0 },
  creativeUsage: [
    {
      creativeId: String,
      type: String,
      usageCount: { type: Number, default: 0 },
      lastUsed: Date,
    },
  ],

  // ==================== QUALITY & PERFORMANCE MONITORING ====================
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  lastQualityReview: Date,
  reviewNotes: String,
  performanceWarnings: [
    {
      warning: String,
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      issuedAt: { type: Date, default: Date.now },
      resolvedAt: Date,
      issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  complianceIssues: [
    {
      issue: String,
      type: {
        type: String,
        enum: ['terms', 'traffic', 'promotion', 'legal', 'other'],
      },
      severity: {
        type: String,
        enum: ['warning', 'violation', 'suspension', 'termination'],
      },
      occurredAt: Date,
      resolvedAt: Date,
      notes: String,
    },
  ],

  // ==================== ADVANCED ANALYTICS ====================
  geographicPerformance: [
    {
      country: String,
      region: String,
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
  ],

  devicePerformance: [
    {
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'other'],
      },
      os: String,
      browser: String,
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    },
  ],

  temporalPerformance: [
    {
      hourOfDay: Number,
      dayOfWeek: Number,
      month: Number,
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    },
  ],

  auditTrail: [
    {
      action: String,
      performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      performedAt: { type: Date, default: Date.now },
      ipAddress: String,
      userAgent: String,
      changes: Schema.Types.Mixed,
      reason: String,
    },
  ],

  // ==================== SYSTEM METADATA ====================
  signupSource: {
    type: String,
    enum: ['web', 'mobile', 'api', 'admin', 'affiliate', 'partner'],
    default: 'web',
  },
  signupCampaign: String,
  signupReferrer: String,
  ipAddress: String,
  userAgent: String,
  locale: String,
  dataResidency: { type: String, enum: ['eu', 'us', 'apac', 'global'] },

  // ==================== CUSTOM FIELDS ====================
  customFields: Schema.Types.Mixed,
  tags: [String],

  // ==================== TIMESTAMPS ====================
  lastActivityAt: Date,
  lastCommissionAt: Date,
  lastPayoutRequestAt: Date,
});

// Customer Profile Schema
const CustomerProfileSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    ssn: {
      type: String,
      select: false,
      set: (value: string) => {
        if (value && !validateSSN(value)) {
          throw new Error('Invalid SSN format');
        }
        return value ? encrypt(value) : value;
      },
      get: (value: string) => (value ? decrypt(value) : value),
      maxlength: 512,
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: {
      type: String,
      enum: [
        'active',
        'canceled',
        'trialing',
        'past_due',
        'unpaid',
        'incomplete',
      ],
      default: 'incomplete',
    },
    currentPlan: String,
    planInterval: {
      type: String,
      enum: ['monthly', 'yearly'],
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    trialEndDate: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    planRenewalDate: Date,
    appliedDiscounts: [
      {
        discountId: String,
        amount: Number,
        validUntil: Date,
      },
    ],
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      taxId: { type: String, select: false },
    },
    subscriptionHistory: [
      {
        plan: String,
        interval: { type: String, enum: ['month', 'year'] },
        startedAt: Date,
        endedAt: Date,
      },
    ],
    usageStats: {
      scansThisMonth: { type: Number, default: 0, min: 0 },
      alertsTriggered: { type: Number, default: 0, min: 0 },
      identityTheftClaims: { type: Number, default: 0, min: 0 },
      creditReportsGenerated: { type: Number, default: 0, min: 0 },
      darkWebMonitoring: { type: Number, default: 0, min: 0 },
      lastReset: { type: Date, default: Date.now },
    },
    paymentMethods: [
      {
        id: String,
        type: { type: String, enum: ['card', 'bank', 'paypal'] },
        last4: String,
        expiry: String,
        primary: Boolean,
        addedAt: Date,
        billingDetails: {
          name: String,
          email: String,
          phone: String,
          address: Schema.Types.Mixed,
        },
      },
    ],
    agreeAutoRenewal: { type: Boolean, default: false },
    privacyPolicyAcceptedAt: Date,
    paymentFailureCount: { type: Number, default: 0 },
    lastPaymentDate: Date,
    nextBillingDate: Date,
    invoiceHistory: [
      {
        invoiceId: String,
        amount: Number,
        date: Date,
        status: String,
        downloadUrl: String,
      },
    ],
    creditMonitoring: {
      enabled: { type: Boolean, default: false },
      lastUpdated: Date,
      score: Number,
      factors: [String],
    },

    preferences: {
      alerts: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      reports: {
        frequency: {
          type: String,
          enum: ['weekly', 'monthly', 'quarterly'],
          default: 'monthly',
        },
        format: { type: String, enum: ['pdf', 'html', 'both'], default: 'pdf' },
      },
      communication: {
        promotional: { type: Boolean, default: true },
        educational: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
      },
    },
    loyaltyPoints: { type: Number, default: 0 },
    supportTier: {
      type: String,
      enum: ['basic', 'priority', 'vip'],
      default: 'basic',
    },
    accountManager: { type: Schema.Types.ObjectId, ref: 'User' },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    referralCodeUsed: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);
// Main User Schema Fo All User
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    phone: {
      type: String,
      select: false,
      validate: {
        validator: (value: string) => /^(\+1\d{10}|\d{10})$/.test(value),
        message:
          'Phone number must be a valid 10-digit U.S. number (with or without +1)',
      },
    },
    address: {
      type: AddressSchema,
      select: false,
    },

    gender: {
      type: String,
      enum: Object.values(ENUM_GENDER),
    },

    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (this, value: Date) {
          return (
            value <=
            new Date(new Date().setFullYear(new Date().getFullYear() - 13))
          );
        },
        message: 'User must be at least 13 years old',
      },
    },
    // dateOfBirth: { type: Date },
    emailVerifiedAt: { type: Date },

    // Role & Access Control
    role: {
      type: String,
      enum: Object.values(ENUM_USER_ROLE),
      required: true,
      default: ENUM_USER_ROLE.CUSTOMER,
    },
    isVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ['active', 'deactivated', 'banned', 'suspended'],
      default: 'active',
    },

    // Profile & Preferences
    profilePicture: {
      url: String,
      hash: String,
      storageLocation: String,
      uploadedAt: Date,
    },

    // Authentication & Security
    lastLogin: { type: Date },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    accountLockedUntil: { type: Date },
    lastPasswordChangeAt: Date,
    passwordResetRequestedAt: Date,
    passwordHistory: [
      {
        password: String,
        changedAt: Date,
      },
    ],
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
        location: String,
      },
    ],
    auditLog: [
      {
        action: String,
        timestamp: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
        details: String,
      },
    ],
    fraudSignals: {
      unusualActivity: [
        {
          timestamp: Date,
          description: String,
        },
      ],
      flaggedIps: [String],
    },

    // Two-Factor Authentication
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      method: {
        type: String,
        enum: ['authenticator', 'sms', 'email'],
      },
      secret: { type: String, select: false },
      backupCodes: {
        type: [String],
        select: false,
      },
      lastUsed: Date,
    },
    socialLogin: {
      google: {
        id: String,
        emailVerified: Boolean,
      },
      facebook: {
        id: String,
        emailVerified: Boolean,
      },
      apple: {
        id: String,
        emailVerified: Boolean,
      },
    },
    securityQuestions: {
      type: [
        {
          questionId: String,
          questionHash: { type: String, select: false },
          answerHash: { type: String, select: false },
          createdAt: Date,
          lastUsed: Date,
        },
      ],
      select: false,
    },
    // Device & Session Management
    trustedDevices: {
      type: [
        {
          deviceId: String,
          name: String,
          fingerprint: String,
          ipRanges: [String],
          lastUsed: Date,
          os: String,
          browser: String,
          location: String,
        },
      ],
      select: false,
    },

    activeSessions: {
      type: [
        {
          sessionId: String,
          deviceInfo: String,
          ip: String,
          userAgent: String,
          geoLocation: String,
          createdAt: Date,
          expiresAt: Date,
          lastActivity: Date,
          isRevoked: Boolean,
        },
      ],
      select: false,
    },

    language: {
      type: String,
      enum: ['en', 'bn', 'es'],
      default: 'en',
    },
    timeZone: String,
    preferredCurrency: {
      type: String,
      enum: ['usd', 'eur', 'gbp'],
      default: 'usd',
    },
    geo: {
      country: String,
      region: String,
      city: String,
    },
    deviceInfo: {
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'other'],
        default: 'desktop',
      },
      browser: { type: String, default: 'Chrome' },
      browserVersion: { type: String, default: '138' },
      os: { type: String, default: 'Linux' },
      osVersion: { type: String, default: 'unknown' },
    },

    deviceFingerprint: String,
    communicationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
    // Role-specific profiles
    customerProfile: {
      type: CustomerProfileSchema,
      default: null,
    },

    affiliateProfile: {
      type: AffiliateSchema,
      default: null,
    },
    adminProfile: {
      type: AdminProfileSchema,
      default: null,
      select: false,
    },

    // Security & Compliance
    agreeMarketingEmail: { type: Boolean, default: true },
    termsAcceptedAt: Date,
    privacyPolicyAcceptedAt: Date,
    agreeTerms: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending',
    },
    kycDocuments: [
      {
        type: String,
        url: String,
        status: String,
        uploadedAt: Date,
        reviewedAt: Date,
      },
    ],
    dataDeletionRequestedAt: Date,
    marketingConsent: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      givenAt: Date,
    },
    dataSharingConsent: { type: Boolean, default: false },
    hipaaConsent: {
      acceptedAt: Date,
      documentVersion: String,
    },

    // System Metadata
    signupSource: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin', 'affiliate'],
      default: 'web',
    },
    signupCampaign: String,
    signupReferrer: String,
    ip: String,
    userAgent: String,
    locale: String,
    dataResidency: { type: String, enum: ['eu', 'us', 'apac'] },
    gdpr: {
      article30Record: String,
      dpoContact: String,
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastActivityAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove sensitive fields
        delete ret.password;
        delete ret.ssn;
        delete ret.phone;
        delete ret.address;
        delete ret.twoFactorAuth?.secret;
        delete ret.passwordHistory;
        delete ret.securityQuestions;
        delete ret.backupCodes;
        // Show role-specific profiles only for appropriate roles
        if (ret.role !== ENUM_USER_ROLE.AFFILIATE) {
          delete ret.affiliateProfile;
        }
        if (ret.role !== ENUM_USER_ROLE.CUSTOMER) {
          delete ret.customerProfile;
        }
        if (
          ![ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN].includes(
            ret.role as ENUM_USER_ROLE
          )
        ) {
          delete ret.adminProfile;
        }

        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index(
  { phone: 1 },
  { partialFilterExpression: { phone: { $exists: true } } }
);
userSchema.index({ 'customerProfile.stripeCustomerId': 1 });
userSchema.index({ 'affiliateProfile.approvalStatus': 1 });
userSchema.index({ 'adminProfile.permissions.global': 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastActivityAt: 1 });
userSchema.index({ 'customerProfile.subscriptionStatus': 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ subscriptionStatus: 1 });
userSchema.index(
  { 'affiliateProfile.referralCode': 1 },
  { unique: true, sparse: true }
);
userSchema.index({ 'affiliateProfile.approvalStatus': 1 });
userSchema.index({ 'affiliateProfile.isActive': 1 });
userSchema.index({ 'affiliateProfile.tier': 1 });
userSchema.index({ 'affiliateProfile.performanceMetrics.conversionRate': -1 });
userSchema.index({ 'affiliateProfile.payoutHistory.status': 1 });
userSchema.index({ 'affiliateProfile.createdAt': -1 });
userSchema.index({ 'affiliateProfile.referrals.date': -1 });
userSchema.index({ 'affiliateProfile.taxInfo.taxStatus': 1 });

// ✅ userSchema virtuals:
userSchema.virtual('isEligibleForPayout').get(function () {
  if (this.role !== ENUM_USER_ROLE.AFFILIATE || !this.affiliateProfile) {
    return false;
  }
  return (
    this.affiliateProfile.commissionBalance >=
      (this.affiliateProfile.payoutThreshold || 50) &&
    this.affiliateProfile.isActive
  );
});

userSchema.virtual('isAffiliateApproved').get(function () {
  return this.affiliateProfile?.approvalStatus === 'approved';
});

userSchema.virtual('isEligibleForPayout').get(function () {
  return (
    this.affiliateProfile?.commissionBalance >=
      this.affiliateProfile?.payoutThreshold && this.affiliateProfile?.isActive
  );
});

userSchema.virtual('affiliateDaysSinceLastPayout').get(function () {
  if (!this.affiliateProfile?.lastPayoutDate) return null;
  return Math.floor(
    (Date.now() - this.affiliateProfile.lastPayoutDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );
});

userSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - new Date(this.dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

// Statics Methods
userSchema.statics.isUserExist = async function (
  email: string,
  session?: ClientSession
): Promise<Pick<any, '_id' | 'email' | 'password' | 'role'> | null> {
  return await this.findOne({ email })
    .select(
      '+password +twoFactorAuth.secret +securityQuestions +customerProfile +affiliateProfile +adminProfile'
    )
    .session(session || null)
    .lean();
};

userSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
};

userSchema.virtual('hasActiveSubscription').get(function () {
  return (
    this.role === ENUM_USER_ROLE.CUSTOMER &&
    ['active', 'trialing'].includes(
      this.customerProfile?.subscriptionStatus || ''
    )
  );
});

userSchema.virtual('daysSinceLastActivity').get(function () {
  if (!this.lastActivityAt) return null;
  const diff = Date.now() - new Date(this.lastActivityAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Hooks
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds)
    );
    this.lastPasswordChangeAt = new Date();

    // Store password history (last 5 passwords)
    if (!this.passwordHistory) this.passwordHistory = [];
    this.passwordHistory.push({
      password: this.password,
      changedAt: new Date(),
    });

    // Keep only last 5 passwords
    if (this.passwordHistory.length > 5) {
      this.passwordHistory = this.passwordHistory.slice(-5);
    }
  }

  // Initialize admin profile for admin users

  if (this.role === ENUM_USER_ROLE.AFFILIATE && !this.affiliateProfile) {
    // @ts-ignore
    this.affiliateProfile = {};
  }

  if (
    [ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN].includes(
      this.role as ENUM_USER_ROLE
    ) &&
    !this.adminProfile
  ) {
    //@ts-ignore
    this.adminProfile = {
      permissions: {
        global: this.role === ENUM_USER_ROLE.SUPER_ADMIN,
        userManagement: true,
        contentManagement: true,
        billingManagement: true,
        systemSettings: this.role === ENUM_USER_ROLE.SUPER_ADMIN,
        affiliateManagement: true,
        analytics: true,
        apiManagement: this.role === ENUM_USER_ROLE.SUPER_ADMIN,
      },
      accessLevel: this.role === ENUM_USER_ROLE.SUPER_ADMIN ? 'admin' : 'write',
      securityClearance:
        this.role === ENUM_USER_ROLE.SUPER_ADMIN ? 'high' : 'elevated',
    };
  }

  next();
});

userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (update?.password) {
    update.password = await bcrypt.hash(
      update.password,
      Number(config.bcrypt_salt_rounds)
    );
    update.lastPasswordChangeAt = new Date();
  }
  next();
});

// Methods

userSchema.methods.isPasswordMatched = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.updateProfile = async function (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  //  @ts-ignore
  updateData: Partial<IUser>
) {
  //  @ts-ignore
  const allowedFields: (keyof IUser)[] = [
    'name',
    'phone',
    'address',
    'gender',
    'dateOfBirth',
    'language',
    'timezone',
    'preferredCurrency',
    'profilePicture',
    'communicationPreferences',
  ];

  allowedFields.forEach(field => {
    const value = updateData[field];
    if (value !== undefined) {
      //  @ts-ignore
      (this as Record<string, any>)[field] = value;
    }
  });

  await this.save();
};

userSchema.methods.revokeSession = function (sessionId: string) {
  const session = this.activeSessions?.find(
    (s: { sessionId: string }) => s.sessionId === sessionId
  );
  if (session) {
    session.isRevoked = true;
    session.expiresAt = new Date();
  }
  return this.save();
};

userSchema.methods.addCommission = async function () {
  if (this.role !== ENUM_USER_ROLE.AFFILIATE) {
    throw new Error('Only affiliates can earn commissions');
  }

  // Add to performance metrics
  this.affiliateProfile.performanceMetrics.conversions += 1;
  this.affiliateProfile.performanceMetrics.conversionRate =
    this.affiliateProfile.performanceMetrics.conversions /
    Math.max(this.affiliateProfile.performanceMetrics.clicks, 1);
  this.affiliateProfile.performanceMetrics.lastUpdated = new Date();

  await this.save();

  return this.affiliateProfile.commissionBalance;
};

userSchema.methods.createStripeCustomer = async function () {
  if (this.customerProfile?.stripeCustomerId) {
    return this.customerProfile.stripeCustomerId;
  }

  const stripeCustomer = await stripe.customers.create({
    email: this.email,
    name: this.name,
    phone: this.phone,
    metadata: {
      userId: this._id.toString(),
      userRole: this.role,
    },
  });

  if (!this.customerProfile) {
    this.customerProfile = {
      stripeCustomerId: stripeCustomer.id,
      subscriptionStatus: 'incomplete',
    };
  } else {
    this.customerProfile.stripeCustomerId = stripeCustomer.id;
  }

  await this.save();
  return stripeCustomer.id;
};

userSchema.methods.upgradeToAdmin = async function (
  adminData: Partial<any>,
  upgradedBy: string
) {
  if (![ENUM_USER_ROLE.SUPER_ADMIN].includes(this.role as ENUM_USER_ROLE)) {
    throw new Error('Only superadmins can upgrade users to admin');
  }

  this.role = ENUM_USER_ROLE.ADMIN;
  this.adminProfile = {
    ...adminData,
    permissions: {
      global: false,
      userManagement: adminData.permissions?.userManagement || false,
      contentManagement: adminData.permissions?.contentManagement || false,
      billingManagement: adminData.permissions?.billingManagement || false,
      systemSettings: false,
      affiliateManagement: adminData.permissions?.affiliateManagement || false,
      analytics: adminData.permissions?.analytics || false,
      apiManagement: false,
    },
    accessLevel: adminData.accessLevel || 'write',
    securityClearance: adminData.securityClearance || 'elevated',
    twoFactorEnforced: true,
  };

  // Add audit log entry
  this.auditLog = this.auditLog || [];
  this.auditLog.push({
    action: 'role_upgrade',
    timestamp: new Date(),
    performedBy: upgradedBy,
    details: `Upgraded to ${ENUM_USER_ROLE.ADMIN} role`,
    ipAddress: 'system',
  });

  await this.save();
  return this;
};

// Create discriminators for better query performance
export const User = model('User', userSchema);

export const Customer = User.discriminator(
  ENUM_USER_ROLE.CUSTOMER,
  new Schema({})
);
export const Affiliate = User.discriminator(
  ENUM_USER_ROLE.AFFILIATE,
  new Schema({})
);
export const Admin = User.discriminator(ENUM_USER_ROLE.ADMIN, new Schema({}));
export const SuperAdmin = User.discriminator(
  ENUM_USER_ROLE.SUPER_ADMIN,
  new Schema({})
);

export default User;

// ==================== ADMIN SETUP TOKEN SCHEMA ====================
const AdminSetupTokenSchema = new Schema<IAdminSetupToken>({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

export const AdminSetupToken = model<IAdminSetupToken>(
  'AdminSetupToken',
  AdminSetupTokenSchema
);
