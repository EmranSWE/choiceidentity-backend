import { z } from 'zod';

export const createCheckoutSessionZodSchema = z.object({
  body: z.object({
    priceId: z.string({
      required_error: 'Price ID is required',
    }).min(1, 'Price ID must not be empty'),

    userId: z.string().optional(),

    mode: z.enum(['payment', 'subscription']).default('subscription'),

    successUrl: z.string({
      required_error: 'Success URL is required',
    }).url('Success URL must be a valid URL'),

    cancelUrl: z.string({
      required_error: 'Cancel URL is required',
    }).url('Cancel URL must be a valid URL'),

    metadata: z.record(z.string()).optional(),

    trialPeriodDays: z
      .number()
      .int()
      .min(0)
      .max(365)
      .optional()
      .describe('Optional trial days for subscription mode'),

    coupon: z
      .string()
      .optional()
      .describe('Optional Stripe coupon ID to apply discounts'),

    billingCycleAnchor: z
      .enum(['now', 'start_of_subscription', 'unchanged'])
      .optional()
      .describe('Optional billing cycle anchor, relevant in subscription mode'),
  }),
});


const createPaymentIntentZodSchema = z.object({
  body: z.object({
    priceId: z.string({
      required_error: 'Price ID is required',
    }),
    userId: z.string().optional(),
    metadata: z.record(z.string()).optional(),
  }),
});

export const StripeValidation = {
  createCheckoutSessionZodSchema,
  createPaymentIntentZodSchema,
};