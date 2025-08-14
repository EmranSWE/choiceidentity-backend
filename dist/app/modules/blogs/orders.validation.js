"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderValidation = void 0;
const zod_1 = require("zod");
const orders_interface_1 = require("./orders.interface");
// Define the schema for the shipping address
const shippingAddressSchema = zod_1.z.object({
    name: zod_1.z.string({ required_error: 'Name is required' }),
    phone: zod_1.z
        .string({ required_error: 'Phone is required' })
        .regex(/^(?:\+88)?01[3-9]\d{8}$/, { message: 'Invalid Bangladeshi phone number' }),
    address: zod_1.z.string({ required_error: 'Address is required' }),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
});
// Define the schema for the products in the order
const productSchema = zod_1.z.object({
    productId: zod_1.z.string({ required_error: 'Product ID is required' }),
    quantity: zod_1.z.number({ required_error: 'Quantity is required' }).min(1, { message: 'Quantity must be at least 1' }),
    price: zod_1.z.number({ required_error: 'Price is required' }).min(0, { message: 'Price must be non-negative' }),
    name: zod_1.z.string({ required_error: 'Product name is required' }),
    image: zod_1.z.string().optional(),
});
// Define the schema for the payment details
const paymentSchema = zod_1.z.object({
    method: zod_1.z.enum(Object.values(orders_interface_1.PaymentMethod), {
        required_error: 'Payment method is required',
    }),
    transactionId: zod_1.z.string().optional(), // Optional for COD
    status: zod_1.z.enum(Object.values(orders_interface_1.PaymentStatus)).optional(), // Optional for COD
})
    .refine((data) => {
    // If payment method is NOT cash_on_delivery, status is required
    if (data.method !== orders_interface_1.PaymentMethod.CASH_ON_DELIVERY) {
        return !!data.status; // Ensure status is provided for non-COD orders
    }
    return true; // Status is optional for COD orders
}, {
    message: 'Payment status is required for non-Cash on Delivery orders',
    path: ['status'], // Path to the status field
});
// Define the schema for the order
const orderSchema = zod_1.z.object({
    body: zod_1.z.object({
        products: zod_1.z.array(productSchema, { required_error: 'Products are required' }),
        totalAmount: zod_1.z.number({ required_error: 'Total amount is required' }).min(0, { message: 'Total amount must be non-negative' }),
        payment: paymentSchema,
        shippingAddress: shippingAddressSchema,
        ipAddress: zod_1.z.string().optional(),
        deviceInfo: zod_1.z.string().optional(),
        discountCode: zod_1.z.string().optional(),
        promoCode: zod_1.z.string().optional(),
    })
        .refine((data) => {
        // Custom validation for COD orders
        if (data.payment.method === orders_interface_1.PaymentMethod.CASH_ON_DELIVERY) {
            return true; // No additional validation for COD orders
        }
        return true;
    }, {
        message: 'Payment status must be "pending" for Cash on Delivery orders',
        path: ['payment', 'status'],
    })
        .refine((data) => {
        // Custom validation for non-COD orders
        if (data.payment.method !== orders_interface_1.PaymentMethod.CASH_ON_DELIVERY) {
            return !!data.payment.transactionId; // Ensure transactionId is provided for non-COD orders
        }
        return true;
    }, {
        message: 'Transaction ID is required for non-Cash on Delivery orders',
        path: ['payment', 'transactionId'],
    }),
});
const orderUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], {
            required_error: 'Status is required',
            invalid_type_error: 'Status must be one of: pending, processing, shipped, delivered, cancelled',
        }),
    }),
});
const bulkOrderUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderIds: zod_1.z.array(zod_1.z.string(), { required_error: 'Order IDs are required' }),
        status: zod_1.z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], {
            required_error: 'Status is required',
            invalid_type_error: 'Status must be one of: pending, processing, shipped, delivered, cancelled',
        }),
    }),
});
exports.OrderValidation = {
    orderSchema,
    orderUpdateSchema,
    bulkOrderUpdateSchema
};
