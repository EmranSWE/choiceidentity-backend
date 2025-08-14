import Stripe from 'stripe';
import { AttachAndUpdatePaymentMethodParams, CreatePaymentIntentParams, CreateSubscriptionParams, PriceMapping, StripeCustomerInput } from './stripe.interface';
import config from '../../../config';
import { logger } from '../../../shared/logger';
import ApiError from '../../../errors/apiErrors';

// Initialize Stripe with your secret key
export const stripe = new Stripe(config.stripe_secret_key!, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// Updated price mappings with type information
export const PRICE_MAPPINGS: PriceMapping[] = [
  {
    id: 'price_basic_monthly',
    amount: 999,
    currency: 'usd',
    name: 'Basic Plan Monthly',
    type: 'recurring',
    interval: 'month',
  },
  {
    id: 'price_pro_monthly',
    amount: 2999, // $29.99
    currency: 'usd',
    name: 'Pro Plan Monthly',
    type: 'recurring',
    interval: 'month',
  },
  {
    id: 'price_enterprise_monthly',
    amount: 9999, // $99.99
    currency: 'usd',
    name: 'Enterprise Plan Monthly',
    type: 'recurring',
    interval: 'month',
  },
  {
    id: 'price_basic_yearly',
    amount: 9999, // $99.99 (2 months free)
    currency: 'usd',
    name: 'Basic Plan Yearly',
    type: 'recurring',
    interval: 'year',
  },
  {
    id: 'price_pro_yearly',
    amount: 29999, // $299.99 (2 months free)
    currency: 'usd',
    name: 'Pro Plan Yearly',
    type: 'recurring',
    interval: 'year',
  },
  {
    id: 'price_one_time_basic',
    amount: 4999, // $49.99
    currency: 'usd',
    name: 'Basic Plan One-time',
    type: 'one_time',
  },
];

export const PROTECTION_PLANS = {
  BASIC: {
    id: 'prod_BASIC_ID',
    // basic=>monthl=>amount:799=>["avbcd","def"]
    monthly: {
      priceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID!,
      amount: 799,
      features: [
        'Dark web monitoring',
        'Single-bureau credit monitoring',
        '$25K identity theft insurance',
        'Email alerts',
      ],
    },
    yearly: {
      priceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID!,
      amount: 7900,
      features: [
        '2 months free compared to monthly',
        'All Basic Protection features',
      ],
    },
  },
  ADVANCED: {
    id: 'prod_ADVANCED_ID',
    monthly: {
      priceId: process.env.STRIPE_ADVANCED_MONTHLY_PRICE_ID!,
      amount: 1499,
      features: [
        'All Basic features',
        'Triple-bureau credit monitoring',
        '$100K insurance',
        'Fraud alerts',
        'Credit score tracking',
      ],
    },
    yearly: {
      priceId: process.env.STRIPE_ADVANCED_YEARLY_PRICE_ID!,
      amount: 14900,
      features: [
        '2 months free compared to monthly',
        'All Advanced Protection features',
      ],
    },
  },
  ULTIMATE: {
    id: 'prod_ULTIMATE_ID',
    monthly: {
      priceId: process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID!,
      amount: 2499,
      features: [
        'All Advanced features',
        '$1M insurance',
        'Real-time SSN & bank monitoring',
        'Family coverage (2 adults + kids)',
      ],
    },
    yearly: {
      priceId: process.env.STRIPE_ULTIMATE_YEARLY_PRICE_ID!,
      amount: 24900,
      features: [
        '2 months free compared to monthly',
        'All Ultimate Protection features',
      ],
    },
  },
  ELITE: {
    id: 'prod_ELITE_ID',
    monthly: {
      priceId: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID!,
      amount: 3999,
      features: [
        'All Ultimate features',
        'VPN service',
        '24/7 priority recovery support',
        'Dark web & social media monitoring',
        'Concierge recovery assistance',
      ],
    },
    yearly: {
      priceId: process.env.STRIPE_ELITE_YEARLY_PRICE_ID!,
      amount: 39900,
      features: [
        '2 months free compared to monthly',
        'All Elite Protection features',
      ],
    },
  },
} as const;

export type PlanType = keyof typeof PROTECTION_PLANS;

/**
 * Maps a priceId to its corresponding amount and currency
 */
export const getPriceMapping = (priceId: string): PriceMapping | null => {
  return PRICE_MAPPINGS.find(price => price.id === priceId) || null;
};

/**
 * Validates if a price ID exists in our mappings
 */
export const isValidPriceId = (priceId: string): boolean => {
  return PRICE_MAPPINGS.some(price => price.id === priceId);
};

/**
 * Constructs Stripe webhook endpoint secret
 */
export const getWebhookSecret = (): string => {
  const secret = config.webhook;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }
  return secret;
};

/**
 * Validates Stripe webhook signature
 */
export const constructWebhookEvent = (
  body: string | Buffer,
  signature: string
): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (error) {
    throw new Error(
      `Webhook signature verification failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

// All retry logic and cleanup functions
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as any;

  // 1. Stripe-specific transient errors
  const stripeRetryableTypes = [
    'StripeAPIError',
    'StripeConnectionError',
    'StripeRateLimitError',
    'StripeInvalidRequestError',
  ];
  if (stripeRetryableTypes.includes(err.type)) return true;

  // 2. Retryable Stripe error codes
  const stripeRetryableCodes = ['lock_timeout', 'idempotency_key_in_use'];
  if (err.code && stripeRetryableCodes.includes(err.code)) return true;

  // 3. HTTP-level retryable errors
  if (typeof err.statusCode === 'number') {
    const status = err.statusCode;
    if ((status >= 500 && status < 600) || status === 429) return true;
  }

  // 4. Low-level network issues
  const retryableNetCodes = [
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETDOWN',
    'ENETRESET',
    'ENETUNREACH',
  ];
  if (err.code && retryableNetCodes.includes(err.code)) return true;

  return false;
}


export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`Operation timed out after ${ms} ms`);
      (error as any).code = 'TIMEOUT';
      reject(error);
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}


// =======================
// Retry Utility
// =======================
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  timeoutMs = 5000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Retry attempt ${attempt} started for operation ${operation.name}`
      );
      return await withTimeout(operation(), timeoutMs);
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        logger.error(`Non-retryable error on attempt ${attempt}`, error);
        throw error;
      }

      logger.warn(
        `Retryable error on attempt ${attempt}, retrying after ${delayMs}ms`,
        error
      );

      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, delayMs));
        delayMs *= 2; // exponential backoff
      }
    }
  }

  logger.error('All retry attempts failed', lastError);
  throw lastError;
}

// =======================
// Cleanup Orphan Stripe Resources
// =======================
export async function cleanupOrphanStripeResources(
  customerId?: string,
  paymentMethodId?: string,
  subscriptionId?: string,
  options: { dryRun?: boolean } = {}
): Promise<void> {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY_MS = 1000;
  const TIMEOUT_MS = 5000;

  try {
    if (options.dryRun) {
      logger.info('[Dry Run] Would cleanup:', {
        customerId,
        paymentMethodId,
        subscriptionId,
      });
      return;
    }

    if (subscriptionId) {
      await retry(
        () => stripe.subscriptions.cancel(subscriptionId),
        MAX_RETRIES,
        INITIAL_DELAY_MS,
        TIMEOUT_MS
      );
      logger.info(`Canceled subscription ${subscriptionId}`);
    }

    if (paymentMethodId) {
      await retry(
        () => stripe.paymentMethods.detach(paymentMethodId),
        MAX_RETRIES,
        INITIAL_DELAY_MS,
        TIMEOUT_MS
      );
      logger.info(`Detached payment method ${paymentMethodId}`);
    }

    if (customerId) {
      await retry(
        () => stripe.customers.del(customerId),
        MAX_RETRIES,
        INITIAL_DELAY_MS,
        TIMEOUT_MS
      );
      logger.info(`Deleted customer ${customerId}`);
    }
  } catch (err) {
    logger.error('Cleanup failed after retries', err);
    throw new ApiError(500, 'Failed to cleanup orphan Stripe resources');
  }
}

// =======================
// Stripe Customer Creation
// =======================
export const createStripeCustomer = async (user: StripeCustomerInput) => {
  try {
    const metadata: Record<string, string> = {
      planType: user.planType,
      billingInterval: user.billingInterval,
      marketingConsent: String(user.marketingConsent ?? false),
      ...user.extraMetadata,
    };
    if (user.affiliateId) metadata.affiliateId = user.affiliateId;


    const fullName =
      user.name ||
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
      undefined;

    const stripeAddress = user.address
      ? {
          line1: user.address.street || undefined,
          city: user.address.city || undefined,
          state: user.address.state || undefined,
          postal_code: user.address.zipCode || undefined,
          country: user.country || undefined,
        }
      : user.country
      ? { country: user.country }
      : undefined;

    return await retry(() =>
      stripe.customers.create(
        {
          email: user.email,
          name: fullName,
          phone: user.phone || undefined,
          preferred_locales: ['en-US'],
          metadata,
          address: stripeAddress,
        },
        { idempotencyKey: `create_customer_${user.key}` }
      )
    );
  } catch (err) {
    logger.error('Stripe customer creation failed', { err, email: user.email });
    throw err;
  }
};

// =======================
// Attach & Set Default Payment Method
// =======================
export const attachAndSetDefaultPaymentMethod = async ({
  customerId,
  paymentMethodId,
  key,
  extraMetadata,
}: AttachAndUpdatePaymentMethodParams) => {
  try {
    if (!customerId || !paymentMethodId)
      throw new Error('customerId and paymentMethodId are required.');

    const attached = await retry(() =>
      stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId },
        { idempotencyKey: `attach_pm_${key}` }
      )
    );
    const updatedCustomer = await retry(() =>
      stripe.customers.update(
        customerId,
        { invoice_settings: { default_payment_method: attached.id } },
        { idempotencyKey: `update_customer_pm_${key}` }
      )
    );

    if (extraMetadata && Object.keys(extraMetadata).length > 0) {
      await retry(() =>
        stripe.paymentMethods.update(paymentMethodId, {
          metadata: extraMetadata,
        })
      );
    }

    return { attached, updatedCustomer };
  } catch (err) {
    logger.error('Stripe attach and update payment method failed', {
      err,
      customerId,
      paymentMethodId,
    });
    throw err;
  }
};

// =======================
// PaymentIntent Creation
// =======================
export const createPaymentIntent = async ({
  customerId,
  paymentMethodId,
  key,
  baseAmount,
  setupFee = 0,
  currency = 'usd',
  planType,
  billingInterval,
  description,
  extraMetadata,
  confirm = true,
}: CreatePaymentIntentParams) => {
  try {
    if (!customerId || !paymentMethodId)
      throw new Error('customerId and paymentMethodId are required.');
    if (baseAmount < 0 || setupFee < 0)
      throw new Error('Amounts must be non-negative');

    const totalAmount = baseAmount + setupFee;

    const metadata: Record<string, string> = {
      plan_type: planType,
      billing_interval: billingInterval,
      base_amount: baseAmount.toString(),
      setup_fee: setupFee.toString(),
      ...extraMetadata,
    };
 const paymentDescription =
      description ||
      `Payment for ${planType} plan (${billingInterval})${
        setupFee > 0 ? ` + setup fee` : ''
      }`;

    return await retry(() =>
      stripe.paymentIntents.create(
        {
          amount: totalAmount,
          currency,
          customer: customerId,
          payment_method: paymentMethodId,
          confirm,
          description:paymentDescription,
          metadata,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        },
        { idempotencyKey: `payment_intent_${key}` }
      )
    );
  } catch (err) {
    logger.error('Stripe PaymentIntent creation failed', {
      err,
      customerId,
      paymentMethodId,
    });
    throw err;
  }
};


export const createStripeSubscription = async ({
  customerId,
  planPriceId,
  key,
  trialPeriodDays = 0,
  metadata = {},
  promotionCodeId,
  paymentMethodId,
  setupFeeAmount,
}: CreateSubscriptionParams) => {

  try {
    const safeMetadata: Record<string, string> = {};
    for (const [k, v] of Object.entries(metadata)) safeMetadata[k] = String(v);

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: planPriceId }],
      trial_period_days: trialPeriodDays > 0 ? trialPeriodDays : undefined,
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: safeMetadata,
      discounts: promotionCodeId
        ? [{ promotion_code: promotionCodeId }]
        : undefined,
    };

    const subscription = await retry(() =>
      stripe.subscriptions.create(subscriptionParams, {
        idempotencyKey: `subscription_${key}`,
      })
    );

    if (setupFeeAmount && setupFeeAmount > 0) {
      await retry(() =>
        stripe.invoiceItems.create({
          customer: customerId,
          amount: setupFeeAmount,
          currency: 'usd',
          description: 'Setup Fee',
          subscription: subscription.id,
        })
      );
    }

    if (paymentMethodId) {
      await retry(() =>
        stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
      );
      await retry(() =>
        stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        })
      );
    }

    return subscription;
  } catch (err) {
    logger.error('Stripe subscription creation failed', { err, customerId });
    throw err;
  }
};
