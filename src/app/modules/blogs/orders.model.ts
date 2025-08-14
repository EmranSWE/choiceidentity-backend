import mongoose, { Schema, model } from 'mongoose';
import { IOrders, OrderModel, OrderStatus, PaymentMethod, PaymentStatus } from './orders.interface';
const orderSchema = new Schema<IOrders, OrderModel>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1, 
        },
        price: {
          type: Number,
          required: true,
          min: 0, 
        },
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0, 
    },
    payment: {
      method: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: [true, 'Payment method is required'],
      },
      transactionId: {
        type: String,
        unique: true, // Ensure transactionId is unique
        sparse: true, // Allow null/empty values for COD orde // Optional for COD
        index:true
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatus),
        required: [true, 'Payment status is required'],
        default: PaymentStatus.PENDING, 
      },
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus), 
      required: true,
      default: OrderStatus.PENDING, 
      index: true, 
    },
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
        validate: {
          validator: (value: string) => /^(?:\+88)?01[3-9]\d{8}$/.test(value), 
          message: 'Invalid Bangladeshi phone number',
        },
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
      
      },
      state: {
        type: String,
        
      },
      country: {
        type: String,
        
      },
      postalCode: {
        type: String,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now, 
    },
    updatedAt: {
      type: Date,
      default: Date.now, 
    },
    ipAddress: { type: String }, 
    deviceInfo: { type: String }, 
    promoCode: { type: String }, 
  },
  {
    timestamps: true, 
  }
);

// Indexes for faster queries
orderSchema.index({ userId: 1 }); // Index for user ID
orderSchema.index({ 'payment.transactionId': 1 },{ unique: true, sparse: true }); // Index for transaction ID
orderSchema.index({ orderStatus: 1 }); // Index for order status
orderSchema.index({ createdAt: -1 }); // Index for sorting by creation date

// Virtual field for order age (time since creation)
orderSchema.virtual('orderAge').get(function () {
  const now = new Date();
  const createdAt = this.createdAt || now;
  return now.getTime() - createdAt.getTime(); // Age in milliseconds
});

// Pre-save hook to update `updatedAt` field
orderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Orders = model<IOrders>('Order', orderSchema);