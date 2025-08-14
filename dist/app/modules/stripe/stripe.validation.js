"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeValidation = exports.createCheckoutSessionZodSchema = void 0;
const zod_1 = require("zod");
exports.createCheckoutSessionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        priceId: zod_1.z.string({
            required_error: 'Price ID is required',
        }).min(1, 'Price ID must not be empty'),
        userId: zod_1.z.string().optional(),
        mode: zod_1.z.enum(['payment', 'subscription']).default('subscription'),
        successUrl: zod_1.z.string({
            required_error: 'Success URL is required',
        }).url('Success URL must be a valid URL'),
        cancelUrl: zod_1.z.string({
            required_error: 'Cancel URL is required',
        }).url('Cancel URL must be a valid URL'),
        metadata: zod_1.z.record(zod_1.z.string()).optional(),
        trialPeriodDays: zod_1.z
            .number()
            .int()
            .min(0)
            .max(365)
            .optional()
            .describe('Optional trial days for subscription mode'),
        coupon: zod_1.z
            .string()
            .optional()
            .describe('Optional Stripe coupon ID to apply discounts'),
        billingCycleAnchor: zod_1.z
            .enum(['now', 'start_of_subscription', 'unchanged'])
            .optional()
            .describe('Optional billing cycle anchor, relevant in subscription mode'),
    }),
});
const createPaymentIntentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        priceId: zod_1.z.string({
            required_error: 'Price ID is required',
        }),
        userId: zod_1.z.string().optional(),
        metadata: zod_1.z.record(zod_1.z.string()).optional(),
    }),
});
exports.StripeValidation = {
    createCheckoutSessionZodSchema: exports.createCheckoutSessionZodSchema,
    createPaymentIntentZodSchema,
};
