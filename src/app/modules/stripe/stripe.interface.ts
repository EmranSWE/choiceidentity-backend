
import { PROTECTION_PLANS } from "./stripe.utils";
import { Document, Types } from "mongoose";


export enum PaymentIntentStatus {
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  CANCELED = 'canceled',
}


export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void',
  MARKED_UNCOLLECTIBLE = 'marked_uncollectible',
}

// =================== Request / Response Types ===================

export type StripeCheckoutRequestBody = {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  mode?: 'payment' | 'subscription';
};

export type CheckoutSessionResponse = {
  sessionId: string;
  url: string;
  expiresAt: number;
};

export type StripeRequestBody = {
  priceId: string;
  userId: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
};

// =================== Price Plan ===================

export type PriceMapping = {
  id: string;
  amount: number;
  currency: string;
  name: string;
  type: 'one_time' | 'recurring';
  interval?: 'month' | 'year';
  isDefault?: boolean;
  features?: string[];
};

// =================== Webhook ===================

export type WebhookEvent<T = any> = {
  id: string;
  type: string;
  created: number;
  data: {
    object: T;
  };
};

// Webhook log (for debugging, audit, replay)
export type WebhookLogDocument = {
  eventId: string;
  type: string;
  payload: any;
  receivedAt: Date;
  processed: boolean;
  error?: string;
};

// =================== DB Documents ===================

export type PaymentIntentDocument = {
  userId: string;
  customerId?: string;
  priceId: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  paymentIntentId: string;
  clientSecret: string;
  metadata?: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
  source?: 'web' | 'api' | 'admin' | 'partner';
  initiatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CheckoutSessionDocument = {
  userId: string;
  customerId?: string;
  priceId: string;
  sessionId: string;
  status: 'open' | 'complete' | 'expired' | 'canceled';
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  amount?: number;
  currency: string;
  metadata?: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
  source?: 'web' | 'api' | 'admin' | 'partner';
  initiatedBy?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionDocument = {
  stripeSubscriptionId: string;
  userId: string;
  customerId?: string;
  priceId: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, string>;
  billingBehavior?: 'prorate' | 'none';
  prorationDate?: Date;
  renewalBehavior?: 'auto_renew' | 'cancel_on_period_end';
  nextInvoiceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceDocument = {
  stripeInvoiceId: string;
  userId: string;
  customerId?: string;
  subscriptionId?: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  currency: string;
  status: InvoiceStatus;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  paymentMethodId?: string;
  couponId?: string;
  discountAmount?: number;
  promoCode?: string;
  taxAmount?: number;
  taxPercent?: number;
  lineItems?: {
    description: string;
    amount: number;
    quantity: number;
  }[];
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Refund Document (for partial/full refunds)

export type RefundDocument = {
  refundId: string;
  paymentIntentId: string;
  userId: string;
  amount: number;
  reason?: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: Date;
  updatedAt: Date;
};

// Enhanced subscription document (unified with above if needed)

export type StripeSubscriptionDocument = {
  userId: string;
  subscriptionId: string;
  customerId: string;
  priceId: string;
  planName?: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  endedAt?: Date;
  renewalBehavior?: 'auto_renew' | 'cancel_on_period_end';
  billingBehavior?: 'prorate' | 'none';
  prorationDate?: Date;
  nextInvoiceDate?: Date;
  currency: string;
  metadata?: Record<string, string>;
  source?: 'web' | 'api' | 'admin' | 'partner';
  initiatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};



type PlanFeatures = readonly string[];

export type PlanPrice = {
  priceId: string;
  amount: number;
  features: PlanFeatures;
}

export type ProtectionPlan = {
  id: string;
  monthly: PlanPrice;
  yearly: PlanPrice;
}

export type PlanType = keyof typeof PROTECTION_PLANS;

export type PlanDetails = {
  name: PlanType;
  monthly: {
    id: string;
    amount: number;
    currency: string;
    features: PlanFeatures;
  };
  yearly: {
    id: string;
    amount: number;
    currency: string;
    features: PlanFeatures;
  };
}




// export enum SubscriptionStatus {
//   TRIALING = "trialing",
//   ACTIVE = "active",
//   PAST_DUE = "past_due",
//   CANCELED = "canceled",
//   UNPAID = "unpaid",
//   PAUSED = "paused",
// }


export enum SubscriptionStatus {
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
  EXPIRED = 'expired',
}

export enum BillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export type IAddon = {
  name: string;
  price: number; // in cents
}

export type IPauseDetails = {
  reason?: string;
  startDate?: Date;
  endDate?: Date;
}

export type ISubscription = {
  userId: Types.ObjectId;
  stripeSubscriptionId: string;
  planType: string;
  priceId?: string;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  quantity: number;

  currentPeriodStart: Date;
  currentPeriodEnd: Date;

  trialStart?: Date;
  trialEnd?: Date;

  cancelAtPeriodEnd: boolean;
  cancelAt?: Date;
  cancelReason?: string;

  paused: boolean;
  pauseDetails?: IPauseDetails;

  latestInvoiceId?: string;

  addons: IAddon[];

  metadata?: Record<string, any>;

  defaultPaymentMethodId?: string;
  cardBrand?: string;
  cardLast4?: string;

  lastStripeEventId?: string;
  lastSyncedAt?: Date;

  archived: boolean;
  archivedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
} & Document







export type StripeCustomerInput = {
  key: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  country?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  planType: string;
  billingInterval: 'monthly' | 'yearly';
  marketingConsent?: boolean;
  affiliateId?: string;
  extraMetadata?: Record<string, string>;
};



export type AttachAndUpdatePaymentMethodParams = {
  customerId: string;
  paymentMethodId: string;
  key: string;
  extraMetadata?: Record<string, string>;
};



export type CreatePaymentIntentParams = {
  customerId: string;
  paymentMethodId: string;
  key: string;
  baseAmount: number;
  setupFee?: number;
  currency?: string;
  planType: string;
  billingInterval: 'monthly' | 'yearly';
  description?: string;
  extraMetadata?: Record<string, string>;
  confirm?: boolean;
};


export type CreateSubscriptionParams = {
  customerId: string;
  key: string;
  planPriceId: string;
  billingInterval: 'monthly' | 'yearly';
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  promotionCodeId?: string;
  paymentMethodId?: string;
  setupFeeAmount?: number;
};

export type SubscriptionData = {
  key: string;
  paymentMethodId: string;
  email: string;
  planType: keyof typeof PROTECTION_PLANS;
  billingInterval: 'monthly' | 'yearly';
  name?: string;
  password?: string;
  [key: string]: any;
};