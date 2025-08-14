"use strict";
// // ============================================
// // app/modules/stripe/stripe.webhook.ts
// // ============================================
// import { Request, Response, RequestHandler } from 'express';
// import httpStatus from 'http-status';
// import catchAsync from '../../../shared/catchAsync';
// import sendResponse from '../../../shared/sendResponse';
// import { constructWebhookEvent } from './stripe.utils';
// import { StripeService } from './stripe.service';
// import Stripe from 'stripe';
// import ApiError from '../../../errors/apiErrors';
// import { User } from '../auth/auth.model';
// /**
//  * Handles Stripe webhooks
//  * POST /api/v1/stripe/webhook
//  */
// const handleWebhook: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const signature = req.headers['stripe-signature'] as string;
//     if (!signature) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         'Missing stripe-signature header'
//       );
//     }
//     // Construct webhook event
//     const event = constructWebhookEvent(req.body, signature);
//    console.log(`Received webhook with events: ${event.type}`);
//     // console.log(`Received event types: ${event.type}`);
//     // Handle different event types
//     switch (event.type) {
//       case 'checkout.session.completed':
//         await handleCheckoutSessionCompleted(event);
//         break;
//       case 'checkout.session.expired':
//         await handleCheckoutSessionExpired(event);
//         break;
//       case 'payment_intent.succeeded':
//         await handlePaymentIntentSucceeded(event);
//         break;
//       case 'payment_intent.payment_failed':
//         await handlePaymentIntentFailed(event);
//         break;
//       case 'payment_intent.canceled':
//         await handlePaymentIntentCanceled(event);
//         break;
//       case 'invoice.paid':
//         await handleInvoicePaid(event);
//         break;
//       case 'customer.subscription.created':
//         await handleSubscriptionCreated(event);
//         break;
//       case 'customer.subscription.updated':
//         await handleSubscriptionUpdated(event);
//         break;
//       case 'customer.subscription.deleted':
//         await handleSubscriptionDeleted(event);
//         break;
//       default:
//       // console.log(`Unhandled event type: ${event.type}`);
//     }
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'Webhook processed successfully',
//     });
//   }
// );
// export const handleCheckoutSessionCompleted = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   try {
//     const session = event.data.object as Stripe.Checkout.Session;
//     console.log('✅ Checkout session completed:', session);
//     // Update the Stripe session status internally
//     // await StripeService.updateCheckoutSessionStatus(session.id, 'complete');
//     // const userId = session.metadata?.userId;
//     // const priceId = session.metadata?.priceId;
//     // if (!userId || !priceId) {
//     //   console.error('❌ Missing metadata in session:', session.id);
//     //   return;
//     // }
//     const subscriptionId = session.subscription as string;
//     const customerId = session.customer as string;
//     const subscription = await StripeService.getSubscription(subscriptionId);
//     const planInterval =
//       subscription.items?.data?.[0]?.price?.recurring?.interval ?? null;
//     const startDateUnix = subscription.start_date;
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     //@ts-ignore
//     const endDateUnix = subscription.current_period_end;
//     const startDate = startDateUnix ? new Date(startDateUnix * 1000) : null;
//     const endDate = endDateUnix ? new Date(endDateUnix * 1000) : null;
//     const update = {
//       stripeCustomerId: customerId,
//       stripeSubscriptionId: subscriptionId,
//       subscriptionStatus: 'active',
//     //   currentPlan: priceId,
//       planInterval,
//       subscriptionStartDate: startDate,
//       subscriptionEndDate: endDate,
//       planRenewalDate: endDate,
//     };
//     console.log('Updating user subscription:', update);
//     const updatedUser = await User.findByIdAndUpdate(userId, update, {
//       new: true,
//     });
//     if (!updatedUser) {
//       console.error(`❌ User not found: ${userId}`);
//     } else {
//       console.log(`✅ Subscription updated for user: ${userId}`);
//     }
//   } catch (error) {
//     console.error('❌ Error handling checkout.session.completed:', error);
//   }
// };
// const handleCheckoutSessionExpired = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   const session = event.data.object as Stripe.Checkout.Session;
//   //   console.log(`Checkout session expired: ${session.id}`);
//   // Update checkout session status in database
//   await StripeService.updateCheckoutSessionStatus(session.id, 'expired');
// };
// const handlePaymentIntentSucceeded = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   const paymentIntent = event.data.object as Stripe.PaymentIntent;
//   //   console.log(`Payment succeeded for: ${paymentIntent.id}`);
//   // Update payment status in database
//   await StripeService.updatePaymentStatus(paymentIntent.id, 'succeeded');
//   // Add your business logic here:
//   // - Send confirmation email
//   // - Activate user subscription
//   // - Update user permissions
//   // - etc.
// };
// const handlePaymentIntentFailed = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   const paymentIntent = event.data.object as Stripe.PaymentIntent;
//   //   console.log(`Payment failed for: ${paymentIntent.id}`);
//   // Update payment status in database
//   await StripeService.updatePaymentStatus(
//     paymentIntent.id,
//     'requires_payment_method'
//   );
//   // Add your business logic here:
//   // - Send failure notification
//   // - Log the failure reason
//   // - etc.
// };
// const handlePaymentIntentCanceled = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   const paymentIntent = event.data.object as Stripe.PaymentIntent;
//   //   console.log(`Payment canceled for: ${paymentIntent.id}`);
//   // Update payment status in database
//   await StripeService.updatePaymentStatus(paymentIntent.id, 'canceled');
// };
// const handleInvoicePaid = async (event: Stripe.Event): Promise<void> => {
//   const invoice = event.data.object as Stripe.Invoice;
//   //   console.log(`Invoice paid: ${invoice.id}`);
//   // Add your logic for successful invoice payments
//   // - Update subscription status
//   // - Extend service period
//   // - etc.
// };
// const handleSubscriptionCreated = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   const subscription = event.data.object as Stripe.Subscription;
//   //   console.log(`Subscription created: ${subscription.id}`);
//   // Add your logic for new subscriptions
//   // - Welcome email
//   // - Set up user account
//   // - etc.
// };
// const handleSubscriptionUpdated = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   const subscription = event.data.object as Stripe.Subscription;
//   //   console.log(`Subscription updated: ${subscription.id}`);
//   // Add your logic for subscription updates
//   // - Plan changes
//   // - Payment method updates
//   // - etc.
// };
// const handleSubscriptionDeleted = async (
//   event: Stripe.Event
// ): Promise<void> => {
//   const subscription = event.data.object as Stripe.Subscription;
//   //   console.log(`Subscription deleted: ${subscription.id}`);
//   // Add your logic for subscription cancellations
//   // - Deactivate services
//   // - Send cancellation confirmation
//   // - etc.
// };
// export const StripeWebhookController = {
//   handleWebhook,
// };
