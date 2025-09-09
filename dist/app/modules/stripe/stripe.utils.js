"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeSubscription = exports.createPaymentIntent = exports.attachAndSetDefaultPaymentMethod = exports.createStripeCustomer = exports.constructWebhookEvent = exports.getWebhookSecret = exports.isValidPriceId = exports.getPriceMapping = exports.PROTECTION_PLANS = exports.PRICE_MAPPINGS = exports.stripe = void 0;
exports.isRetryableError = isRetryableError;
exports.withTimeout = withTimeout;
exports.retry = retry;
exports.cleanupOrphanStripeResources = cleanupOrphanStripeResources;
exports.getSubscriptionDates = getSubscriptionDates;
exports.safeStripeDateConvert = safeStripeDateConvert;
exports.calculateNextBillingDate = calculateNextBillingDate;
exports.shouldProcessDunning = shouldProcessDunning;
const stripe_1 = __importDefault(require("stripe"));
const stripe_interface_1 = require("./stripe.interface");
const config_1 = __importDefault(require("../../../config"));
const logger_1 = require("../../../shared/logger");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
// Initialize Stripe with your secret key
exports.stripe = new stripe_1.default(config_1.default.stripe_secret_key, {
    apiVersion: '2025-06-30.basil',
    typescript: true,
});
// Updated price mappings with type information
exports.PRICE_MAPPINGS = [
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
exports.PROTECTION_PLANS = {
    BASIC: {
        id: 'prod_BASIC_ID',
        monthly: {
            priceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
            amount: 3999,
            baseAmount: 100,
            setupFee: 0,
            features: [
                'Identity & Document Verification',
                'Biometric & Face Recognition',
                'KYC & AML Compliance',
                'Age Verification',
                'NFC Verification',
                'Assisted Image Capture',
            ],
        },
        yearly: {
            priceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
            amount: 41988,
            baseAmount: 100,
            setupFee: 0,
            features: [
                'Identity & Document Verification',
                'Biometric & Face Recognition',
                'KYC & AML Compliance',
                'Age Verification',
                'NFC Verification',
                'Assisted Image Capture',
            ],
        },
    },
    ULTIMATE: {
        id: 'prod_ULTIMATE_ID',
        monthly: {
            priceId: process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID,
            amount: 5999,
            baseAmount: 100,
            setupFee: 0,
            features: [
                'Identity & Document Verification',
                'Biometric & Face Recognition',
                'KYC & AML Compliance',
                'Age Verification',
                'NFC Verification',
                'Assisted Image Capture',
                'Fraud Prevention',
                'Email Validation API',
                'Email Finder',
                'Email Scoring',
            ],
        },
        yearly: {
            priceId: process.env.STRIPE_ULTIMATE_YEARLY_PRICE_ID,
            amount: 62988,
            baseAmount: 100,
            setupFee: 0,
            features: [
                "Identity & Document Verification",
                "Biometric & Face Recognition",
                "KYC & AML Compliance",
                "Age Verification",
                "NFC Verification",
                "Assisted Image Capture",
                "Fraud Prevention",
                "Email Validation API",
                "Email Finder",
                "Email Scoring"
            ],
        },
    },
    PREMIUM: {
        id: 'prod_ELITE_ID',
        monthly: {
            priceId: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID,
            amount: 7999,
            baseAmount: 100,
            setupFee: 17900,
            features: [
                "Identity & Document Verification",
                "Biometric & Face Recognition",
                "KYC & AML Compliance",
                "Age Verification",
                "NFC Verification",
                "Assisted Image Capture",
                "Fraud Prevention",
                "Email Validation API",
                "Email Finder",
                "Email Scoring",
                "Email Appending",
                "Activity Data",
                "Catch-All Domain Detection",
                "Abuse Email Detection",
                "AI Email Classifier",
                "Real-time API & SDK Integration",
                "Webhook for verification status",
                "Identity Monitoring",
                "Credit Alerts",
                "Dark Web Scan",
                "Dark Web Monitoring",
                "Simple Background Check",
                "Social Security Watch",
                "Bank Account Guard",
                "Recovery Assistance",
                "Website Protection Services"
            ],
        },
        yearly: {
            priceId: process.env.STRIPE_ELITE_YEARLY_PRICE_ID,
            amount: 86988,
            baseAmount: 100,
            setupFee: 17900,
            features: [
                "Identity & Document Verification",
                "Biometric & Face Recognition",
                "KYC & AML Compliance",
                "Age Verification",
                "NFC Verification",
                "Assisted Image Capture",
                "Fraud Prevention",
                "Email Validation API",
                "Email Finder",
                "Email Scoring",
                "Email Appending",
                "Activity Data",
                "Catch-All Domain Detection",
                "Abuse Email Detection",
                "AI Email Classifier",
                "Real-time API & SDK Integration",
                "Webhook for verification status",
                "Identity Monitoring",
                "Credit Alerts",
                "Dark Web Scan",
                "Dark Web Monitoring",
                "Simple Background Check",
                "Social Security Watch",
                "Bank Account Guard",
                "Recovery Assistance",
                "Website Protection Services"
            ],
        },
    },
};
/**
 * Maps a priceId to its corresponding amount and currency
 */
const getPriceMapping = (priceId) => {
    return exports.PRICE_MAPPINGS.find(price => price.id === priceId) || null;
};
exports.getPriceMapping = getPriceMapping;
/**
 * Validates if a price ID exists in our mappings
 */
const isValidPriceId = (priceId) => {
    return exports.PRICE_MAPPINGS.some(price => price.id === priceId);
};
exports.isValidPriceId = isValidPriceId;
/**
 * Constructs Stripe webhook endpoint secret
 */
const getWebhookSecret = () => {
    const secret = config_1.default.webhook;
    if (!secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    return secret;
};
exports.getWebhookSecret = getWebhookSecret;
/**
 * Validates Stripe webhook signature
 */
const constructWebhookEvent = (body, signature) => {
    try {
        return exports.stripe.webhooks.constructEvent(body, signature, (0, exports.getWebhookSecret)());
    }
    catch (error) {
        throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.constructWebhookEvent = constructWebhookEvent;
// All retry logic and cleanup functions
function isRetryableError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const err = error;
    // 1. Stripe-specific transient errors
    const stripeRetryableTypes = [
        'StripeAPIError',
        'StripeConnectionError',
        'StripeRateLimitError',
        'StripeInvalidRequestError',
    ];
    if (stripeRetryableTypes.includes(err.type))
        return true;
    // 2. Retryable Stripe error codes
    const stripeRetryableCodes = ['lock_timeout', 'idempotency_key_in_use'];
    if (err.code && stripeRetryableCodes.includes(err.code))
        return true;
    // 3. HTTP-level retryable errors
    if (typeof err.statusCode === 'number') {
        const status = err.statusCode;
        if ((status >= 500 && status < 600) || status === 429)
            return true;
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
    if (err.code && retryableNetCodes.includes(err.code))
        return true;
    return false;
}
function withTimeout(promise, ms) {
    return __awaiter(this, void 0, void 0, function* () {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => {
                const error = new Error(`Operation timed out after ${ms} ms`);
                error.code = 'TIMEOUT';
                reject(error);
            }, ms);
        });
        try {
            return yield Promise.race([promise, timeoutPromise]);
        }
        finally {
            clearTimeout(timer);
        }
    });
}
// =======================
// Retry Utility
// =======================
function retry(operation_1) {
    return __awaiter(this, arguments, void 0, function* (operation, maxRetries = 3, delayMs = 1000, timeoutMs = 5000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger_1.logger.info(`Retry attempt ${attempt} started for operation ${operation.name}`);
                return yield withTimeout(operation(), timeoutMs);
            }
            catch (error) {
                lastError = error;
                if (!isRetryableError(error)) {
                    logger_1.logger.error(`Non-retryable error on attempt ${attempt}`, error);
                    throw error;
                }
                logger_1.logger.warn(`Retryable error on attempt ${attempt}, retrying after ${delayMs}ms`, error);
                if (attempt < maxRetries) {
                    yield new Promise(res => setTimeout(res, delayMs));
                    delayMs *= 2; // exponential backoff
                }
            }
        }
        logger_1.logger.error('All retry attempts failed', lastError);
        throw lastError;
    });
}
// =======================
// Cleanup Orphan Stripe Resources
// =======================
function cleanupOrphanStripeResources(customerId_1, paymentMethodId_1, subscriptionId_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, paymentMethodId, subscriptionId, options = {}) {
        const MAX_RETRIES = 3;
        const INITIAL_DELAY_MS = 1000;
        const TIMEOUT_MS = 5000;
        try {
            if (options.dryRun) {
                logger_1.logger.info('[Dry Run] Would cleanup:', {
                    customerId,
                    paymentMethodId,
                    subscriptionId,
                });
                return;
            }
            if (subscriptionId) {
                yield retry(() => exports.stripe.subscriptions.cancel(subscriptionId), MAX_RETRIES, INITIAL_DELAY_MS, TIMEOUT_MS);
                logger_1.logger.info(`Canceled subscription ${subscriptionId}`);
            }
            if (paymentMethodId) {
                yield retry(() => exports.stripe.paymentMethods.detach(paymentMethodId), MAX_RETRIES, INITIAL_DELAY_MS, TIMEOUT_MS);
                logger_1.logger.info(`Detached payment method ${paymentMethodId}`);
            }
            if (customerId) {
                yield retry(() => exports.stripe.customers.del(customerId), MAX_RETRIES, INITIAL_DELAY_MS, TIMEOUT_MS);
                logger_1.logger.info(`Deleted customer ${customerId}`);
            }
        }
        catch (err) {
            logger_1.logger.error('Cleanup failed after retries', err);
            throw new apiErrors_1.default(500, 'Failed to cleanup orphan Stripe resources');
        }
    });
}
// =======================
// Stripe Customer Creation
// =======================
const createStripeCustomer = (user) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const metadata = Object.assign({ planType: user.planType, billingInterval: user.billingInterval, marketingConsent: String((_a = user.marketingConsent) !== null && _a !== void 0 ? _a : false) }, user.extraMetadata);
        if (user.affiliateId)
            metadata.affiliateId = user.affiliateId;
        const fullName = user.name ||
            `${(_b = user.firstName) !== null && _b !== void 0 ? _b : ''} ${(_c = user.lastName) !== null && _c !== void 0 ? _c : ''}`.trim() ||
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
        return yield retry(() => exports.stripe.customers.create({
            email: user.email,
            name: fullName,
            phone: user.phone || undefined,
            preferred_locales: ['en-US'],
            metadata,
            address: stripeAddress,
        }, { idempotencyKey: `create_customer_${user.key}` }));
    }
    catch (err) {
        logger_1.logger.error('Stripe customer creation failed', { err, email: user.email });
        throw err;
    }
});
exports.createStripeCustomer = createStripeCustomer;
// =======================
// Attach & Set Default Payment Method
// =======================
const attachAndSetDefaultPaymentMethod = (_a) => __awaiter(void 0, [_a], void 0, function* ({ customerId, paymentMethodId, key, extraMetadata, }) {
    try {
        if (!customerId || !paymentMethodId)
            throw new Error('customerId and paymentMethodId are required.');
        const attached = yield retry(() => exports.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }, { idempotencyKey: `attach_pm_${key}` }));
        const updatedCustomer = yield retry(() => exports.stripe.customers.update(customerId, { invoice_settings: { default_payment_method: attached.id } }, { idempotencyKey: `update_customer_pm_${key}` }));
        if (extraMetadata && Object.keys(extraMetadata).length > 0) {
            yield retry(() => exports.stripe.paymentMethods.update(paymentMethodId, {
                metadata: extraMetadata,
            }));
        }
        return { attached, updatedCustomer };
    }
    catch (err) {
        logger_1.logger.error('Stripe attach and update payment method failed', {
            err,
            customerId,
            paymentMethodId,
        });
        throw err;
    }
});
exports.attachAndSetDefaultPaymentMethod = attachAndSetDefaultPaymentMethod;
// =======================
// PaymentIntent Creation
// =======================
const createPaymentIntent = (_a) => __awaiter(void 0, [_a], void 0, function* ({ customerId, paymentMethodId, key, baseAmount, setupFee = 0, currency = 'usd', planType, billingInterval, description, extraMetadata, confirm = true, }) {
    try {
        if (!customerId || !paymentMethodId)
            throw new Error('customerId and paymentMethodId are required.');
        if (baseAmount < 0 || setupFee < 0)
            throw new Error('Amounts must be non-negative');
        const totalAmount = baseAmount + setupFee;
        const metadata = Object.assign({ plan_type: planType, billing_interval: billingInterval, base_amount: baseAmount.toString(), setup_fee: setupFee.toString() }, extraMetadata);
        const paymentDescription = description ||
            `Payment for ${planType} plan (${billingInterval})${setupFee > 0 ? ` + setup fee` : ''}`;
        return yield retry(() => exports.stripe.paymentIntents.create({
            amount: totalAmount,
            currency,
            customer: customerId,
            payment_method: paymentMethodId,
            confirm,
            description: paymentDescription,
            metadata,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
        }, { idempotencyKey: `payment_intent_${key}` }));
    }
    catch (err) {
        logger_1.logger.error('Stripe PaymentIntent creation failed', {
            err,
            customerId,
            paymentMethodId,
        });
        throw err;
    }
});
exports.createPaymentIntent = createPaymentIntent;
const createStripeSubscription = (_a) => __awaiter(void 0, [_a], void 0, function* ({ customerId, planPriceId, key, trialPeriodDays = 0, metadata = {}, promotionCodeId, paymentMethodId, setupFeeAmount, }) {
    try {
        const safeMetadata = {};
        for (const [k, v] of Object.entries(metadata))
            safeMetadata[k] = String(v);
        const subscriptionParams = {
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
        const subscription = yield retry(() => exports.stripe.subscriptions.create(subscriptionParams, {
            idempotencyKey: `subscription_${key}`,
        }));
        if (setupFeeAmount && setupFeeAmount > 0) {
            yield retry(() => exports.stripe.invoiceItems.create({
                customer: customerId,
                amount: setupFeeAmount,
                currency: 'usd',
                description: 'Setup Fee',
                subscription: subscription.id,
            }));
        }
        if (paymentMethodId) {
            yield retry(() => exports.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }));
            yield retry(() => exports.stripe.customers.update(customerId, {
                invoice_settings: { default_payment_method: paymentMethodId },
            }));
        }
        return subscription;
    }
    catch (err) {
        logger_1.logger.error('Stripe subscription creation failed', { err, customerId });
        throw err;
    }
});
exports.createStripeSubscription = createStripeSubscription;
function getSubscriptionDates(subscription, billingInterval) {
    const isTrial = subscription.status === 'trialing';
    const periodStart = subscription.billing_cycle_anchor || subscription.created;
    // Use trial end date if currently in trial, otherwise calculate billing period
    const periodEnd = isTrial && subscription.trial_end
        ? subscription.trial_end
        : calculatePeriodEnd(periodStart, billingInterval);
    return {
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        trialStart: safeStripeDateConvert(subscription.trial_start),
        trialEnd: safeStripeDateConvert(subscription.trial_end),
        isTrial
    };
}
// Enhanced safe date conversion with validation
function safeStripeDateConvert(timestamp) {
    if (!timestamp)
        return undefined;
    const date = new Date(timestamp * 1000);
    return isNaN(date.getTime()) ? undefined : date;
}
// Helper function for period end calculation
function calculatePeriodEnd(periodStart, billingInterval) {
    switch (billingInterval.toLowerCase()) {
        case 'monthly':
            return periodStart + 30 * 24 * 60 * 60;
        case 'yearly':
            return periodStart + 365 * 24 * 60 * 60;
        case 'quarterly':
            return periodStart + 90 * 24 * 60 * 60;
        default:
            return periodStart + 30 * 24 * 60 * 60;
    }
}
function calculateNextBillingDate(currentPeriodEnd, billingInterval) {
    const nextDate = new Date(currentPeriodEnd);
    switch (billingInterval) {
        case stripe_interface_1.BillingInterval.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case stripe_interface_1.BillingInterval.YEARLY:
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        default:
            nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
}
function shouldProcessDunning(subscription) {
    return (subscription.status === stripe_interface_1.SubscriptionStatus.PAST_DUE &&
        subscription.paymentFailureCount > 0 &&
        subscription.dunningStatus !== stripe_interface_1.DunningStatus.COMPLETED &&
        subscription.dunningStatus !== stripe_interface_1.DunningStatus.FAILED);
}
