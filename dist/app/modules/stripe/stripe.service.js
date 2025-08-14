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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const stripe_utils_1 = require("./stripe.utils");
const stripe_model_1 = require("./stripe.model");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const auth_model_1 = require("../auth/auth.model");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Creates a Stripe Checkout Session and saves it to the database
 */
// const createCheckoutSession = async (
//   data: StripeCheckoutRequestBody
// ): Promise<CheckoutSessionResponse> => {
//   // console.log("Checkout Session data:", data);
//   const priceMapping = getPriceMapping(data.priceId);
//   if (!priceMapping) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       `Invalid price ID: ${data.priceId}`
//     );
//   }
//   const mode =
//     data.mode ||
//     (priceMapping.type === 'recurring' ? 'subscription' : 'payment');
//   const lineItems = [
//     {
//       price_data: {
//         currency: priceMapping.currency,
//         unit_amount: priceMapping.amount,
//         ...(mode === 'subscription' && {
//           recurring: {
//             interval: priceMapping.interval || 'month',
//           },
//         }),
//         product_data: {
//           name: priceMapping.name,
//         },
//       },
//       quantity: 1,
//     },
//   ];
//   const session = await stripe.checkout.sessions.create({
//     mode,
//     line_items: lineItems,
//     success_url: data.successUrl,
//     cancel_url: data.cancelUrl,
//     metadata: {
//       priceId: data.priceId,
//       userId: data.userId || 'anonymous',
//       planName: priceMapping.name,
//       ...data.metadata,
//     },
//     expires_at: Math.floor(Date.now() / 1000) + 1800,
//     ...(data.userId && {
//       customer_email: undefined,
//     }),
//   });
//   //   console.log("Stripe session created:", session);
//   if (!session.id || !session.url) {
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Stripe session creation failed'
//     );
//   }
//   // Save session in DB
//   const checkoutSessionDoc = new CheckoutSession({
//     userId: data.userId,
//     priceId: data.priceId,
//     sessionId: session.id,
//     status: session.status || 'open',
//     mode,
//     successUrl: data.successUrl,
//     cancelUrl: data.cancelUrl,
//     amount: priceMapping.amount,
//     currency: priceMapping.currency,
//     metadata: data.metadata || {},
//     expiresAt: new Date(session.expires_at * 1000),
//   });
//   await checkoutSessionDoc.save();
//   return {
//     sessionId: session.id,
//     url: session.url,
//     expiresAt: session.expires_at,
//   };
// };
/**
 * Updates checkout session status in database (called from webhooks)
 */
// const updateCheckoutSessionStatus = async (
//   sessionId: string,
//   status: string
// ): Promise<CheckoutSessionDocument | null> => {
//   const updatedSession = await CheckoutSession.findOneAndUpdate(
//     { sessionId },
//     { status, updatedAt: new Date() },
//     { new: true }
//   );
//   if (!updatedSession) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       `Checkout session not found: ${sessionId}`
//     );
//   }
//   return updatedSession;
// };
/**
 * Retrieves checkout session by ID
 */
// const getCheckoutSession = async (
//   sessionId: string
// ): Promise<CheckoutSessionDocument | null> => {
//   const checkoutSession = await CheckoutSession.findOne({ sessionId });
//   if (!checkoutSession) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       `Checkout session not found: ${sessionId}`
//     );
//   }
//   return checkoutSession;
// };
/**
 * Creates a Stripe PaymentIntent and saves it to the database (existing functionality)
 */
// const createPaymentIntent = async (
//   data: StripeRequestBody
// ): Promise<PaymentIntentResponse> => {
//   // Get price mapping
//   const priceMapping = getPriceMapping(data.priceId);
//   if (!priceMapping) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       `Invalid price ID: ${data.priceId}`
//     );
//   }
//   // Create PaymentIntent with Stripe
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: priceMapping.amount,
//     currency: priceMapping.currency,
//     metadata: {
//       priceId: data.priceId,
//       userId: data.userId || 'anonymous',
//       planName: priceMapping.name,
//       ...data.metadata,
//     },
//     automatic_payment_methods: {
//       enabled: true,
//     },
//   });
//   if (!paymentIntent.client_secret) {
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Failed to create payment intent with Stripe'
//     );
//   }
//   // Save to database
//   const paymentIntentDoc = new PaymentIntent({
//     userId: data.userId,
//     priceId: data.priceId,
//     amount: priceMapping.amount,
//     currency: priceMapping.currency,
//     status: paymentIntent.status,
//     paymentIntentId: paymentIntent.id,
//     clientSecret: paymentIntent.client_secret,
//     metadata: data.metadata || {},
//   });
//   const savedPaymentIntent = await paymentIntentDoc.save();
//   if (!savedPaymentIntent) {
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Failed to save payment intent to database'
//     );
//   }
//   return {
//     clientSecret: paymentIntent.client_secret,
//     paymentIntentId: paymentIntent.id,
//     amount: priceMapping.amount,
//     currency: priceMapping.currency,
//   };
// };
/**
 * Updates payment status in database (called from webhooks)
 */
// const updatePaymentStatus = async (
//   paymentIntentId: string,
//   status: string
// ): Promise<PaymentIntentDocument | null> => {
//   const updatedPaymentIntent = await PaymentIntent.findOneAndUpdate(
//     { paymentIntentId },
//     { status, updatedAt: new Date() },
//     { new: true }
//   );
//   if (!updatedPaymentIntent) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       `Payment intent not found: ${paymentIntentId}`
//     );
//   }
//   return updatedPaymentIntent;
// };
/**
 * Retrieves payment intent by ID
 */
// const getPaymentIntent = async (
//   paymentIntentId: string
// ): Promise<PaymentIntentDocument | null> => {
//   const paymentIntent = await PaymentIntent.findOne({ paymentIntentId });
//   if (!paymentIntent) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       `Payment intent not found: ${paymentIntentId}`
//     );
//   }
//   return paymentIntent;
// };
/**
 * Retrieves payment intents by user ID
 */
// const getPaymentIntentsByUser = async (
//   userId: string
// ): Promise<PaymentIntentDocument[]> => {
//   const paymentIntents = await PaymentIntent.find({ userId }).sort({
//     createdAt: -1,
//   });
//   return paymentIntents;
// };
/**
 * Check if payment intent exists
 */
// const isPaymentIntentExist = async (
//   paymentIntentId: string
// ): Promise<boolean> => {
//   const paymentIntent = await PaymentIntent.findOne({ paymentIntentId });
//   return !!paymentIntent;
// };
const getSubscription = (subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscription = yield stripe_utils_1.stripe.subscriptions.retrieve(subscriptionId);
        return subscription;
    }
    catch (error) {
        console.error(`❌ Failed to retrieve subscription ${subscriptionId}:`, error);
        throw error;
    }
});
/**
 * Creates a Stripe PaymentIntent and saves it to the database (existing functionality)
 */
const createTrialSubscription = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    let result;
    let stripeCustomer;
    let subscription;
    let paymentMethodId;
    try {
        const { key, paymentMethodId, email, name, password, planType, billingInterval, phone, country, address, marketingConsent, affiliateId } = data, rest = __rest(data, ["key", "paymentMethodId", "email", "name", "password", "planType", "billingInterval", "phone", "country", "address", "marketingConsent", "affiliateId"]);
        if (!paymentMethodId || !email || !planType || !billingInterval) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Missing required fields');
        }
        const plan = stripe_utils_1.PROTECTION_PLANS[planType];
        if (!plan)
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid plan type');
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const isUserExist = yield auth_model_1.User.isUserExist(email, session);
            if (isUserExist) {
                throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Signup failed. Please check your details and try again.');
            }
            const extraMetadata = Object.assign({}, rest);
            stripeCustomer = yield (0, stripe_utils_1.createStripeCustomer)({
                key,
                email,
                name,
                phone,
                country,
                address,
                planType,
                billingInterval,
                marketingConsent,
                affiliateId,
                extraMetadata,
            });
            const { attached } = yield (0, stripe_utils_1.attachAndSetDefaultPaymentMethod)({
                customerId: stripeCustomer.id,
                paymentMethodId,
                key,
                extraMetadata,
            });
            const paymentIntent = yield (0, stripe_utils_1.createPaymentIntent)({
                customerId: stripeCustomer.id,
                paymentMethodId,
                key,
                baseAmount: 100,
                setupFee: 500,
                currency: 'usd',
                planType: 'ULTIMATE',
                billingInterval: 'yearly',
                extraMetadata,
            });
            if (paymentIntent.status === 'requires_action' &&
                ((_a = paymentIntent.next_action) === null || _a === void 0 ? void 0 : _a.type) === 'use_stripe_sdk') {
                throw new apiErrors_1.default(http_status_1.default.PAYMENT_REQUIRED, 'Payment requires additional authentication', JSON.stringify({
                    paymentIntentId: paymentIntent.id,
                    nextAction: paymentIntent.next_action,
                }));
            }
            if (paymentIntent.status !== 'succeeded') {
                throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Payment verification failed');
            }
            subscription = yield (0, stripe_utils_1.createStripeSubscription)({
                key,
                customerId: stripeCustomer.id,
                planPriceId: plan[billingInterval].priceId,
                billingInterval,
                trialPeriodDays: 7,
                metadata: extraMetadata,
            });
            // Handle incomplete or past_due subscription
            if (['incomplete', 'past_due'].includes(subscription.status)) {
                throw new apiErrors_1.default(http_status_1.default.PAYMENT_REQUIRED, `Subscription is ${subscription.status}, requires attention`, JSON.stringify({
                    subscriptionId: subscription.id,
                }));
            }
            const newUser = yield auth_model_1.User.create([
                {
                    name,
                    email,
                    password,
                    role: 'customer',
                    subscriptionStatus: 'trialing',
                    stripeCustomerId: stripeCustomer.id,
                    stripeSubscriptionId: subscription.id,
                    currentPlan: planType,
                    planInterval: billingInterval,
                },
            ], { session });
            yield stripe_model_1.Subscription.create([
                {
                    userId: newUser[0]._id,
                    stripeSubscriptionId: subscription.id,
                    planType,
                    priceId: plan[billingInterval].priceId,
                    billingInterval,
                    status: subscription.status,
                    quantity: (_f = (_b = subscription.quantity) !== null && _b !== void 0 ? _b : (_e = (_d = (_c = subscription.items) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.quantity) !== null && _f !== void 0 ? _f : 1,
                    currentPeriodStart: subscription.start_date
                        ? new Date(subscription.start_date * 1000)
                        : null,
                    currentPeriodEnd: subscription.trial_end || subscription.billing_cycle_anchor
                        ? new Date((subscription.trial_end ||
                            subscription.billing_cycle_anchor) * 1000)
                        : null,
                    trialStart: subscription.trial_start
                        ? new Date(subscription.trial_start * 1000)
                        : null,
                    trialEnd: subscription.trial_end
                        ? new Date(subscription.trial_end * 1000)
                        : null,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    cancelAt: subscription.canceled_at
                        ? new Date(subscription.canceled_at * 1000)
                        : null,
                    cancelReason: null,
                    paused: false,
                    pauseDetails: null,
                    latestInvoiceId: typeof subscription.latest_invoice === 'string'
                        ? subscription.latest_invoice
                        : ((_g = subscription.latest_invoice) === null || _g === void 0 ? void 0 : _g.id) || null,
                    addons: [],
                    metadata: extraMetadata,
                    defaultPaymentMethodId: paymentMethodId,
                    cardBrand: ((_h = attached === null || attached === void 0 ? void 0 : attached.card) === null || _h === void 0 ? void 0 : _h.brand) || null,
                    cardLast4: ((_j = attached === null || attached === void 0 ? void 0 : attached.card) === null || _j === void 0 ? void 0 : _j.last4) || null,
                    lastStripeEventId: null,
                    lastSyncedAt: new Date(),
                    archived: false,
                    archivedAt: null,
                },
            ], { session });
            result = {
                userId: newUser[0]._id,
                customerId: stripeCustomer.id,
                subscriptionId: subscription.id,
                paymentIntentId: paymentIntent.id,
                planDetails: {
                    name: planType,
                    billingInterval,
                    features: plan[billingInterval].features,
                    price: plan[billingInterval].amount / 100,
                },
            };
        }));
        return result;
    }
    catch (error) {
        yield (0, stripe_utils_1.cleanupOrphanStripeResources)(stripeCustomer === null || stripeCustomer === void 0 ? void 0 : stripeCustomer.id, paymentMethodId, subscription === null || subscription === void 0 ? void 0 : subscription.id);
        console.error('❌ Subscription + User creation failed:', error);
        if (error instanceof apiErrors_1.default)
            throw error;
        if (error instanceof stripe_utils_1.stripe.errors.StripeError) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, error.message || 'Payment processing failed');
        }
        throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Unexpected error creating trial subscription');
    }
    finally {
        session.endSession();
    }
});
const GetPlans = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const planEntries = Object.entries(stripe_utils_1.PROTECTION_PLANS);
        const plans = yield Promise.all(planEntries.map((_a) => __awaiter(void 0, [_a], void 0, function* ([planKey, plan]) {
            const [monthlyPrice, yearlyPrice] = yield Promise.all([
                stripe_utils_1.stripe.prices.retrieve(plan.monthly.priceId),
                stripe_utils_1.stripe.prices.retrieve(plan.yearly.priceId),
            ]);
            if (!monthlyPrice.active || !yearlyPrice.active) {
                throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, `Inactive price found for ${planKey} plan`);
            }
            return {
                name: planKey,
                monthly: {
                    id: monthlyPrice.id,
                    amount: monthlyPrice.unit_amount || 0,
                    currency: monthlyPrice.currency,
                    features: plan.monthly.features,
                },
                yearly: {
                    id: yearlyPrice.id,
                    amount: yearlyPrice.unit_amount || 0,
                    currency: yearlyPrice.currency,
                    features: plan.yearly.features,
                },
            };
        })));
        return plans;
    }
    catch (error) {
        if (error instanceof apiErrors_1.default)
            throw error;
        throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to retrieve plans');
    }
});
exports.StripeService = {
    //   createCheckoutSession,
    //   updateCheckoutSessionStatus,
    //   getCheckoutSession,
    createPaymentIntent: stripe_utils_1.createPaymentIntent,
    //   updatePaymentStatus,
    //   getPaymentIntent,
    //   getPaymentIntentsByUser,
    //   isPaymentIntentExist,
    getSubscription,
    createTrialSubscription,
    GetPlans,
};
