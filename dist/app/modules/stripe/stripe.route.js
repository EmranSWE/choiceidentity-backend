"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRouter = void 0;
const express_1 = require("express");
const stripe_controller_1 = require("./stripe.controller");
// import { StripeValidation } from './stripe.validation';
// import validateRequest from '../../middleware/validateRequest';
const idempotencyMiddleware_1 = require("../../middleware/idempotencyMiddleware");
const router = (0, express_1.Router)();
// Checkout Session routes
// router.post(
//   '/create-checkout-session',
//   validateRequest(StripeValidation.createCheckoutSessionZodSchema),
//   StripeController.createCheckoutSession
// );
// router.get('/checkout-session/:sessionId', StripeController.getCheckoutSession);
// Get Plans route
// router.get('/plans', StripeController.GetPlans);
// // PaymentIntent routes (existing functionality)
// router.post(
//   '/create-payment-intent',
//   validateRequest(StripeValidation.createPaymentIntentZodSchema),
//   StripeController.createPaymentIntent
// );
// router.get('/payment-intent/:id', StripeController.getPaymentIntent);
// router.get('/user/:userId/payment-intents', StripeController.getUserPaymentIntents);
// ✅ Trial Subscription route
// router.post(
//   "/create-trial-subscription",
//   // 🛡 Security & Validation Middlewares
//   authenticateUser,                          // Ensure user is logged in (JWT/Session)
//   rateLimiter({ windowMs: 60 * 1000, max: 5 }), // Limit to 5 requests/min per IP
//   validateRequest(createTrialSubscriptionSchema), // Joi/Zod schema validation
//   sanitizeBody,                               // Remove unexpected fields, trim, escape
//   preventDuplicateSubmission,                 // Idempotency key check (to avoid double billing)
//   // 🎯 Business Logic Controller
//   StripeController.createTrialSubscription
// );
router.post("/create-trial-subscription", (0, idempotencyMiddleware_1.idempotencyMiddleware)(), stripe_controller_1.StripeController.createTrialSubscription);
exports.PaymentRouter = router;
