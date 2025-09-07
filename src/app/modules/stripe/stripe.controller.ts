// ============================================
// app/modules/stripe/stripe.controller.ts
// ============================================

import { Request, Response, RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StripeService } from './stripe.service';
import {
  StripeRequestBody,
  StripeCheckoutRequestBody,
} from './stripe.interface';
import { isValidPriceId } from './stripe.utils';
import ApiError from '../../../errors/apiErrors';
import { getCookieOptions } from '../../../config/cors.config';

/**
 * Creates a Checkout Session
 * POST /api/v1/stripe/create-checkout-session
 */
// const createCheckoutSession: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const {
//       priceId,
//       userId,
//       successUrl,
//       cancelUrl,
//       metadata,
//       mode = 'subscription',
//     }: StripeCheckoutRequestBody = req.body;

//     if (!priceId || typeof priceId !== 'string') {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Valid priceId is required');
//     }

//     if (!successUrl || typeof successUrl !== 'string') {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         'Valid successUrl is required'
//       );
//     }

//     if (!cancelUrl || typeof cancelUrl !== 'string') {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Valid cancelUrl is required');
//     }

//     if (userId && typeof userId !== 'string') {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         'userId must be a string if provided'
//       );
//     }

//     if (!['payment', 'subscription'].includes(mode)) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         'Mode must be either "payment" or "subscription"'
//       );
//     }

//     const result = await StripeService.createCheckoutSession({
//       priceId,
//       userId,
//       successUrl,
//       cancelUrl,
//       metadata,
//       mode,
//     });

//     sendResponse(res, {
//       statusCode: httpStatus.CREATED,
//       success: true,
//       message: 'Checkout session created successfully',
//       data: result,
//     });
//   }
// );

/**
 * Get checkout session by ID
 * GET /api/v1/stripe/checkout-session/:sessionId
 */
// const getCheckoutSession: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Session ID is required');
//     }

//     const result = await StripeService.getCheckoutSession(sessionId);

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'Checkout session retrieved successfully',
//       data: result,
//     });
//   }
// );

/**
 * Creates a PaymentIntent (keep existing functionality)
 * POST /api/v1/stripe/create-payment-intent
 */
// const createPaymentIntent: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { priceId, userId, metadata }: StripeRequestBody = req.body;

//     // Validation
//     if (!priceId || typeof priceId !== 'string') {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         'priceId is required and must be a string'
//       );
//     }

//     if (!isValidPriceId(priceId)) {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid priceId provided');
//     }

//     if (userId && typeof userId !== 'string') {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         'userId must be a string if provided'
//       );
//     }

//     // Create PaymentIntent
//     const result = await StripeService.createPaymentIntent({
//       priceId,
//       userId,
//       metadata,
//     });

//     sendResponse(res, {
//       statusCode: httpStatus.CREATED,
//       success: true,
//       message: 'Payment intent created successfully',
//       data: result,
//     });
//   }
// );

/**
 * Get payment intent by ID
 * GET /api/v1/stripe/payment-intent/:id
 */
// const getPaymentIntent: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { id } = req.params;

//     if (!id) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         'Payment intent ID is required'
//       );
//     }

//     const result = await StripeService.getPaymentIntent(id);

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'Payment intent retrieved successfully',
//       data: result,
//     });
//   }
// );

/**
 * Get payment intents by user
 * GET /api/v1/stripe/user/:userId/payment-intents
 */
// const getUserPaymentIntents: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { userId } = req.params;

//     if (!userId) {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
//     }

//     const result = await StripeService.getPaymentIntentsByUser(userId);

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'User payment intents retrieved successfully',
//       data: result,
//     });
//   }
// );

/**
 * Get payment intents by user
 * GET /api/v1/stripe/user/:userId/payment-intents
 */

const createTrialSubscription: RequestHandler = catchAsync(async (req, res) => {
  const {
    paymentMethodId,
    email,
    password,
    firstName,
    selectedPlan,
    billingInterval,
    affiliateId,
    ...rest
  } = req.body;

  const key = res.locals.idempotencyKey;

  if (!key)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Idempotency-Key');

  if (
    !paymentMethodId ||
    !email ||
    !password ||
    !firstName ||
    !selectedPlan ||
    !billingInterval
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Required fields missing');
  }

  // 🚀 Create subscription (Service handles PCI compliance)
  const subscriptionAffiliateId = affiliateId || 'd4rOZ2aYq';
  const subscriptionData = {
    key,
    paymentMethodId,
    email,
    firstName,
    password,
    planType: selectedPlan || 'ELITE',
    billingInterval: billingInterval || 'monthly',
    affiliateId: subscriptionAffiliateId,
    ...rest,
  };


  const result = await StripeService.createTrialSubscription(subscriptionData);
  const { refreshToken, ...others } = result;

  // =========== Productions ===============
  const isProduction = process.env.NODE_ENV === 'production';

  // Get domain-specific cookie name and options
  const cookieOptions = getCookieOptions(req.headers.origin, isProduction);

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, cookieOptions);



  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User created & trial subscription started',
    data: others,
  });
});

const GetPlans: RequestHandler = catchAsync(async (req, res) => {
  const result = await StripeService.GetPlans();

  sendResponse<typeof result>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Plans retrieved successfully',
    data: result,
  });
});

export const StripeController = {
  //   createCheckoutSession,
  //   getCheckoutSession,
  //   createPaymentIntent,
  //   getPaymentIntent,
  //   getUserPaymentIntents,
  createTrialSubscription,
  GetPlans,
};
