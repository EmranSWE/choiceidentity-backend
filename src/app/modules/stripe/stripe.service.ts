import httpStatus from 'http-status';
import {
  stripe,
  getPriceMapping,
  PROTECTION_PLANS,
  PlanType,
  cleanupOrphanStripeResources,
  createStripeCustomer,
  createPaymentIntent,
  createStripeSubscription,
  attachAndSetDefaultPaymentMethod,
} from './stripe.utils';
import { Subscription } from './stripe.model';
import {
  CheckoutSessionResponse,
  PaymentIntentDocument,
  CheckoutSessionDocument,
  StripeCheckoutRequestBody,
  PlanDetails,
  ProtectionPlan,
  SubscriptionData,
} from './stripe.interface';
import ApiError from '../../../errors/apiErrors';
import Stripe from 'stripe';
import { User } from '../auth/auth.model';
import mongoose from 'mongoose';

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

const getSubscription = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error(
      `❌ Failed to retrieve subscription ${subscriptionId}:`,
      error
    );
    throw error;
  }
};

/**
 * Creates a Stripe PaymentIntent and saves it to the database (existing functionality)
 */



const createTrialSubscription = async (data: SubscriptionData) => {
  const session = await mongoose.startSession();
  let result;

  let stripeCustomer: Stripe.Customer | undefined;
  let subscription: Stripe.Subscription | undefined;
  let paymentMethodId: string | undefined;

  try {
    const {
      key,
      paymentMethodId,
      email,
      name,
      password,
      planType,
      billingInterval,
      phone,
      country,
      address,
      marketingConsent,
      affiliateId,
      ...rest
    } = data;
    if (!paymentMethodId || !email || !planType || !billingInterval) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }

    const plan = PROTECTION_PLANS[planType];

    if (!plan) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid plan type');

    await session.withTransaction(async () => {
      const isUserExist = await User.isUserExist(email, session);

      if (isUserExist) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Signup failed. Please check your details and try again.'
        );
      }

 

      const extraMetadata = {
        ...rest,
      };

      stripeCustomer = await createStripeCustomer({
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

      const { attached } = await attachAndSetDefaultPaymentMethod({
        customerId: stripeCustomer.id,
        paymentMethodId,
        key,
        extraMetadata,
      });

      const paymentIntent = await createPaymentIntent({
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


      if (
        paymentIntent.status === 'requires_action' &&
        paymentIntent.next_action?.type === 'use_stripe_sdk'
      ) {
        throw new ApiError(
          httpStatus.PAYMENT_REQUIRED,
          'Payment requires additional authentication',
          JSON.stringify({
            paymentIntentId: paymentIntent.id,
            nextAction: paymentIntent.next_action,
          })
        );
      }
      if (paymentIntent.status !== 'succeeded') {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Payment verification failed'
        );
      }

      subscription = await createStripeSubscription({
        key,
        customerId: stripeCustomer.id,
        planPriceId: plan[billingInterval].priceId,
        billingInterval,
        trialPeriodDays: 7,
        metadata: extraMetadata,
      });

      // Handle incomplete or past_due subscription
      if (['incomplete', 'past_due'].includes(subscription.status)) {
        throw new ApiError(
          httpStatus.PAYMENT_REQUIRED,
          `Subscription is ${subscription.status}, requires attention`,
          JSON.stringify({
            subscriptionId: subscription.id,
          })
        );
      }

      const newUser = await User.create(
        [
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
        ],
        { session }
      );

      await Subscription.create(
        [
          {
            userId: newUser[0]._id,
            stripeSubscriptionId: subscription.id,
            planType,
            priceId: plan[billingInterval].priceId,
            billingInterval,
            status: subscription.status,
            quantity:
              (subscription as any).quantity ??
              subscription.items?.data?.[0]?.quantity ??
              1,
            currentPeriodStart: subscription.start_date
              ? new Date(subscription.start_date * 1000)
              : null,

            currentPeriodEnd:
              subscription.trial_end || subscription.billing_cycle_anchor
                ? new Date(
                    (subscription.trial_end ||
                      subscription.billing_cycle_anchor) * 1000
                  )
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
            latestInvoiceId:
              typeof subscription.latest_invoice === 'string'
                ? subscription.latest_invoice
                : subscription.latest_invoice?.id || null,
            addons: [],
            metadata:extraMetadata,
            defaultPaymentMethodId: paymentMethodId,
            cardBrand: attached?.card?.brand || null,
            cardLast4: attached?.card?.last4 || null,
            lastStripeEventId: null,
            lastSyncedAt: new Date(),
            archived: false,
            archivedAt: null,
          },
        ],
        { session }
      );

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
    });

    return result;
  } catch (error) {
    await cleanupOrphanStripeResources(
      stripeCustomer?.id,
      paymentMethodId,
      subscription?.id
    );

    console.error('❌ Subscription + User creation failed:', error);
    if (error instanceof ApiError) throw error;
    if (error instanceof stripe.errors.StripeError) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        error.message || 'Payment processing failed'
      );
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Unexpected error creating trial subscription'
    );
  } finally {
    session.endSession();
  }
};

const GetPlans = async (): Promise<PlanDetails[]> => {
  try {
    const planEntries = Object.entries(PROTECTION_PLANS) as [
      PlanType,
      ProtectionPlan
    ][];

    const plans = await Promise.all(
      planEntries.map(async ([planKey, plan]) => {
        const [monthlyPrice, yearlyPrice] = await Promise.all([
          stripe.prices.retrieve(plan.monthly.priceId),
          stripe.prices.retrieve(plan.yearly.priceId),
        ]);

        if (!monthlyPrice.active || !yearlyPrice.active) {
          throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Inactive price found for ${planKey} plan`
          );
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
      })
    );

    return plans;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to retrieve plans'
    );
  }
};

export const StripeService = {
//   createCheckoutSession,
//   updateCheckoutSessionStatus,
//   getCheckoutSession,
  createPaymentIntent,
//   updatePaymentStatus,
//   getPaymentIntent,
//   getPaymentIntentsByUser,
//   isPaymentIntentExist,
  getSubscription,
  createTrialSubscription,
  GetPlans,
};
