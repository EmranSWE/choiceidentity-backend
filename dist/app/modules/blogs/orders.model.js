"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orders = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const orders_interface_1 = require("./orders.interface");
const orderSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
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
            enum: Object.values(orders_interface_1.PaymentMethod),
            required: [true, 'Payment method is required'],
        },
        transactionId: {
            type: String,
            unique: true, // Ensure transactionId is unique
            sparse: true, // Allow null/empty values for COD orde // Optional for COD
            index: true
        },
        status: {
            type: String,
            enum: Object.values(orders_interface_1.PaymentStatus),
            required: [true, 'Payment status is required'],
            default: orders_interface_1.PaymentStatus.PENDING,
        },
    },
    orderStatus: {
        type: String,
        enum: Object.values(orders_interface_1.OrderStatus),
        required: true,
        default: orders_interface_1.OrderStatus.PENDING,
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
                validator: (value) => /^(?:\+88)?01[3-9]\d{8}$/.test(value),
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
}, {
    timestamps: true,
});
// Indexes for faster queries
orderSchema.index({ userId: 1 }); // Index for user ID
orderSchema.index({ 'payment.transactionId': 1 }, { unique: true, sparse: true }); // Index for transaction ID
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
exports.Orders = (0, mongoose_1.model)('Order', orderSchema);
