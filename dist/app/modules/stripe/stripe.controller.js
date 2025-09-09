"use strict";
// ============================================
// app/modules/stripe/stripe.controller.ts
// ============================================
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
exports.StripeController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const stripe_service_1 = require("./stripe.service");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const cors_config_1 = require("../../../config/cors.config");
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
const createTrialSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { paymentMethodId, email, password, firstName, selectedPlan, billingInterval, affiliateId } = _a, rest = __rest(_a, ["paymentMethodId", "email", "password", "firstName", "selectedPlan", "billingInterval", "affiliateId"]);
    const key = res.locals.idempotencyKey;
    if (!key)
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Missing Idempotency-Key');
    if (!paymentMethodId ||
        !email ||
        !password ||
        !firstName ||
        !selectedPlan ||
        !billingInterval) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Required fields missing');
    }
    // 🚀 Create subscription (Service handles PCI compliance)
    const subscriptionAffiliateId = affiliateId;
    const subscriptionData = Object.assign({ key,
        paymentMethodId,
        email,
        firstName,
        password, planType: selectedPlan || 'Premium', billingInterval: billingInterval || 'monthly', affiliateId: subscriptionAffiliateId }, rest);
    const result = yield stripe_service_1.StripeService.createTrialSubscription(subscriptionData);
    const { refreshToken } = result, others = __rest(result, ["refreshToken"]);
    // =========== Productions ===============
    const isProduction = process.env.NODE_ENV === 'production';
    // Get domain-specific cookie name and options
    const cookieOptions = (0, cors_config_1.getCookieOptions)(req.headers.origin, isProduction);
    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User created & trial subscription started',
        data: others,
    });
}));
const GetPlans = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripe_service_1.StripeService.GetPlans();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Plans retrieved successfully',
        data: result,
    });
}));
exports.StripeController = {
    //   createCheckoutSession,
    //   getCheckoutSession,
    //   createPaymentIntent,
    //   getPaymentIntent,
    //   getUserPaymentIntents,
    createTrialSubscription,
    GetPlans,
};
