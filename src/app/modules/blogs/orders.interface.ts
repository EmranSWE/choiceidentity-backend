import mongoose, { Document } from 'mongoose';

// Define the OrderStatus Enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded', 
}

// Define the PaymentStatus Enum
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded', 
}

// Define the PaymentMethod Enum
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  ONLINE_PAYMENT = 'online_payment',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}



// Orders Interface
export type IOrders = Document & {
  userId: mongoose.Types.ObjectId;
  products: {
    productId: string; 
    quantity: number; 
    price: number; 
    name: string; 
    image?: string; 
  }[];
  totalAmount: number; 
  payment: {
    method: PaymentMethod; 
    transactionId: string; 
    status: PaymentStatus; 
  };
  orderStatus: OrderStatus; 
  shippingAddress: {
    name: string; 
    phone: string; 
    address: string; 
    city?: string; 
    state?: string; 
    country?: string; 
    postalCode?: string; 
  };
  createdAt?: Date; 
  updatedAt?: Date; 
  ipAddress?: string;
  deviceInfo?: string;
  promoCode?: string;
}


export type IOrdersResponse = IOrders & {
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
  productDetails: {
    name: string;
    image: string;
    price: number;
  }[];
};


import { Model } from 'mongoose';

export type OrderModel = Model<IOrders>;

export type IOrderFilters = {
  searchTerm?: string; 
  userId?: string; 
  minPrice?: number; 
  maxPrice?: number; 
  orderStatus?: OrderStatus; 
  paymentStatus?: PaymentStatus; 
  startDate?: string; 
  endDate?: string; 
};


export type IOrdersSearchFilters = {
  searchTerm?: string;
  category?: string;
  minPrice?: number; 
  maxPrice?: number; 
  brand?: string; 
  status?: OrderStatus; 
  rating?: number;
  tags?: string[]; 
  color?: string; 
  size?: string; 
};


export type IOrderAnalytics = {
  totalOrders: number;
  ordersByStatus: Array<{ _id: string; count: number }>;
  totalRevenue: number;
  averageOrderValue: number;
  ordersOverTime: Array<{ _id: { year: number; month: number; day: number }; count: number }>;
}