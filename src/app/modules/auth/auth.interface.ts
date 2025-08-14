import { ClientSession, Model } from 'mongoose';
import { ENUM_GENDER, ENUM_USER_ROLE } from '../../../enums/user';


export type IUser = {
  _id?: string;

  // ================================
  // Core Identity
  // ================================
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  gender?: ENUM_GENDER;
  dateOfBirth?: Date;
  emailVerifiedAt?: Date;

  // ================================
  // Role & Access Control
  // ================================
  role: ENUM_USER_ROLE; // e.g., 'admin', 'user', 'affiliate'
  permissions?: string[]; // e.g., ['view_billing', 'manage_users']
  isVerified?: boolean;
  lastLogin?: Date;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  accountStatus?: 'active' | 'deactivated' | 'banned';


  // ================================
  // Authentication: 2FA & Social
  // ================================
  twoFactorAuth: {
    enabled: boolean;
    method?: 'sms' | 'authenticator' | 'email' | 'hardware_key';
    secret?: string;
    backupCodes?: { code: string; used: boolean }[];
    lastUsed?: Date;
  };
 socialLogin?: {
    google?: { id: string; emailVerified: boolean };
    facebook?: { id: string; emailVerified: boolean };
    apple?: { id: string; emailVerified: boolean };
  };
securityQuestions?: {
    questionId: string;
    questionHash: string;
    answerHash: string;
    createdAt: Date;
    lastUsed?: Date;
  }[];

// ================================
  // Device & Session Management
  // ================================
  trustedDevices?: {
    deviceId: string;
    name?: string;
    fingerprint: string;
    ipRanges?: string[];
    lastUsed: Date;
    os?: string;
    browser?: string;
    location?: string;
  }[];

  activeSessions?: {
    sessionId: string;
    deviceInfo: string;
    ip: string;
    userAgent: string;
    geoLocation?: string;
    createdAt: Date;
    expiresAt: Date;
    lastActivity: Date;
    isRevoked?: boolean;
  }[];

  // ================================
  // Profile & Preferences
  // ================================
  profilePicture?: { url: string; hash: string; storageLocation: string };
  language: 'en' | 'bn' | 'es' | string;
  timezone?: string;
  preferredCurrency: 'usd' | 'eur' | 'gbp' | string;
  communicationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  // ================================
  // Stripe / Subscription / Billing
  // ================================
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
subscriptionStatus?: 'active' | 'canceled' | 'trialing' | 'past_due' | 'unpaid' | 'incomplete';
  currentPlan?: 'basic' | 'plus' | 'ultimate' | string;
  planInterval?: 'month' | 'year';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  trialEndDate?: Date;
  cancelAtPeriodEnd?: boolean;
  planRenewalDate?: Date;
  appliedDiscounts?: { discountId: string; amount: number; validUntil: Date }[];
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  taxId?: string;
  };
  subscriptionHistory?: {
    plan: string;
    interval: 'month' | 'year';
    startedAt: Date;
    endedAt?: Date;
  }[];
paymentMethods?: {
    id: string;
    type: 'card' | 'bank' | 'paypal';
    last4?: string;
    expiry?: string;
    primary: boolean;
    addedAt: Date;
  }[];

  // ================================
  // Affiliate System
  // ================================
  affiliateDetails?: {
    referralCode: string;
    referralSource?: string;
    commissionBalance?: number;
    payoutHistory?: { amount: number; date: Date; status: 'pending' | 'paid' }[];
    performanceMetrics?: { clicks: number; signups: number; conversions: number };
  };

  // ================================
  // Legal & Compliance
  // ================================
  kycStatus?: 'pending' | 'verified' | 'rejected';
  termsAcceptedAt?: Date;
  privacyPolicyAcceptedAt?: Date;
  marketingConsent?: boolean;
  dataSharingConsent?: boolean;
  dataDeletionRequestedAt?: Date;
  taxInfo?: {
    taxId?: string;
    exemptStatus?: boolean;
  };
  hipaaConsent?: {
    acceptedAt: Date;
    documentVersion: string;
  };

  // ================================
  // Security & Audit
  // ================================
  lastPasswordChangeAt?: Date;
  passwordResetRequestedAt?: Date;
  loginHistory?: {
    timestamp: Date;
    ip: string;
    userAgent: string;
    location?: string;
  }[];
  auditLog?: {
    action: string;
    timestamp: Date;
    ip: string;
    userAgent: string;
    details?: string;
  }[];
  rateLimit?: {
    lastRequestAt: Date;
    requestCount: number;
    windowStart: Date;
  };
  fraudSignals?: {
    unusualActivity: { timestamp: Date; description: string }[];
    flaggedIps: string[];
  };

  // ================================
  // Multi-Tenant / Team SaaS
  // ================================
  organizationId?: string;
  isOwner?: boolean;
  teamDetails?: {
    teamRole: 'owner' | 'admin' | 'member';
    invitationStatus?: 'pending' | 'accepted' | 'rejected';
    usageLimits?: { maxUsers: number; currentUsers: number };
  };

  // ================================
  // API Token Management
  // ================================
  apiTokens?: {
    tokenId: string;
    name: string;
    lastUsed: Date;
    scopes: string[];
    expiresAt?: Date;
  }[];
// ================================
  // System Metadata
  // ================================
  metadata?: {
    creationSource: 'web' | 'api' | 'admin' | 'sso' | 'migration';
    initialReferrer?: string;
    campaign?: string;
    dataResidency?: 'eu' | 'us' | 'apac';
    gdpr?: {
      article30Record?: string;
      dpoContact?: string;
    };
  };

  usageStats: {
  scansThisMonth: number;
  alertsTriggered: number;
  identityTheftClaims: number;
  lastReset: Date;
}
affiliateProfile?: any;

  // ================================
  // Timestamps
  // ================================
 createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
  deletedAt?: Date; 
};


export type ILoginUser = {
  email: string;
  password: string;
};
// export type IRefreshTokenResponse = {
//   accessToken: string;
// };

export type IRefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
}
export type ILoginUserResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type UserModel = {
  isUserExist(
    email: string,
    session?: ClientSession
  ): Promise<Pick<IUser, '_id' | 'email' | 'password' | 'role'>>;

  isPasswordMatched(
    givenPassword: string,
    savedPassword: string
  ): Promise<boolean>;
} & Model<IUser>;
// export type UserModel = Model<IUser, Record<string, unknown>,IUserMethod>;


export type IUserFilters = {
  searchTerm?: string; 
  role?: ENUM_USER_ROLE; 
  email?: string; 
  phone?: string;
  gender?: ENUM_GENDER; 
  isVerified?: boolean; 
  dateOfBirth?: string; 
  createdAt?: string; 
  updatedAt?: string; 
};




export type IUserDocument = {
  updateProfile(updateData: Partial<IUser>): Promise<void>;
} & IUser & Document