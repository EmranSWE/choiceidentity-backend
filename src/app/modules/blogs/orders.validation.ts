import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from './orders.interface';

// Define the schema for the shipping address
const shippingAddressSchema = z.object({
  name: z.string({ required_error: 'Name is required' }),
  phone: z
    .string({ required_error: 'Phone is required' })
    .regex(/^(?:\+88)?01[3-9]\d{8}$/, { message: 'Invalid Bangladeshi phone number' }),
  address: z.string({ required_error: 'Address is required' }),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

// Define the schema for the products in the order
const productSchema = z.object({
  productId: z.string({ required_error: 'Product ID is required' }),
  quantity: z.number({ required_error: 'Quantity is required' }).min(1, { message: 'Quantity must be at least 1' }),
  price: z.number({ required_error: 'Price is required' }).min(0, { message: 'Price must be non-negative' }),
  name: z.string({ required_error: 'Product name is required' }),
  image: z.string().optional(),
});

// Define the schema for the payment details
const paymentSchema = z.object({
  method: z.enum(Object.values(PaymentMethod) as [string, ...string[]], {
    required_error: 'Payment method is required',
  }),
  transactionId: z.string().optional(), // Optional for COD
  status: z.enum(Object.values(PaymentStatus) as [string, ...string[]]).optional(), // Optional for COD
})
.refine(
  (data) => {
    // If payment method is NOT cash_on_delivery, status is required
    if (data.method !== PaymentMethod.CASH_ON_DELIVERY) {
      return !!data.status; // Ensure status is provided for non-COD orders
    }
    return true; // Status is optional for COD orders
  },
  {
    message: 'Payment status is required for non-Cash on Delivery orders',
    path: ['status'], // Path to the status field
  }
);

// Define the schema for the order
const orderSchema = z.object({
  body: z.object({
    products: z.array(productSchema, { required_error: 'Products are required' }),
    totalAmount: z.number({ required_error: 'Total amount is required' }).min(0, { message: 'Total amount must be non-negative' }),
    payment: paymentSchema,
    shippingAddress: shippingAddressSchema,
    ipAddress: z.string().optional(),
    deviceInfo: z.string().optional(),
    discountCode: z.string().optional(),
    promoCode: z.string().optional(),
  })
  .refine(
    (data) => {
      // Custom validation for COD orders
      if (data.payment.method === PaymentMethod.CASH_ON_DELIVERY) {
        return true; // No additional validation for COD orders
      }
      return true;
    },
    {
      message: 'Payment status must be "pending" for Cash on Delivery orders',
      path: ['payment', 'status'],
    }
  )
  .refine(
    (data) => {
      // Custom validation for non-COD orders
      if (data.payment.method !== PaymentMethod.CASH_ON_DELIVERY) {
        return !!data.payment.transactionId; // Ensure transactionId is provided for non-COD orders
      }
      return true;
    },
    {
      message: 'Transaction ID is required for non-Cash on Delivery orders',
      path: ['payment', 'transactionId'],
    }
  ),
});


const orderUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], {
      required_error: 'Status is required',
      invalid_type_error: 'Status must be one of: pending, processing, shipped, delivered, cancelled',
    }),
  }),
});


const bulkOrderUpdateSchema = z.object({
  body: z.object({
    orderIds: z.array(z.string(), { required_error: 'Order IDs are required' }),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], {
      required_error: 'Status is required',
      invalid_type_error: 'Status must be one of: pending, processing, shipped, delivered, cancelled',
    }),
  }),
});

export const OrderValidation = {
  orderSchema,
  orderUpdateSchema,
  bulkOrderUpdateSchema
};