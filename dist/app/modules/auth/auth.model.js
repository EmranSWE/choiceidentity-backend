"use strict";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/no-this-alias */
// import { ClientSession, Schema, model } from 'mongoose';
// import { Address, IUser, IUserDocument, UserModel } from './auth.interface';
// import bcrypt from 'bcryptjs';
// import config from '../../../config';
// import { ENUM_GENDER, ENUM_USER_ROLE } from '../../../enums/user';
// import { stripe } from './auth.utils';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdmin = exports.Admin = exports.Affiliate = exports.Customer = exports.User = void 0;
// const AffiliateProfileSchema = new Schema(
//   {
//     companyName: String,
//     skypeId: String,
//     yourWebsite: String,
//     trafficSources: [String],
//     channels: [String],
//     howPromote: String,
//     describeExperience: String,
//     pastExperience: String,
//     lookingCampaign: String,
//     whenYouFree: String,
//     idPhotoFront: String,
//     idPhotoBack: String,
//     city: String,
//     state: String,
//     streetAddress: String,
//     zipCode: String,
//     country: String,
//     timeZone: String,
//     didYouHear: String,
//     alternativePhone: String,
//     agreeTerms: Boolean,
//     approvalStatus: {
//       type: String,
//       enum: ['pending', 'approved', 'rejected'],
//       default: 'pending',
//     },
//     adminNotes: String,
//   },
// { _id: false, timestamps: true }
// );
// const AddressSchema = new Schema<Address>(
//   {
//     street: { type: String, required: true },
//     apartment: { type: String },
//     zipCode: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String },
//     country: { type: String, default: "USA" },
//   },
//   { _id: false }
// );
// const userSchema = new Schema<IUser>(
//   {
//     name: { type: String, required: true },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       validate: {
//         validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
//         message: 'Invalid email format',
//       },
//     },
//     password: {
//       type: String,
//       required: true,
//       select: false,
//     },
//     phone: {
//       type: String,
//       select: false,
//       validate: {
//         validator: (value: string) => /^(?:\+88)?01[3-9]\d{8}$/.test(value),
//         message: 'Invalid phone number',
//       },
//     },
//     address: {
//       type: AddressSchema,
//       select: false,
//     },
//     ssn: { type: String, select: false },
//     gender: {
//       type: String,
//       enum: Object.values(ENUM_GENDER),
//     },
//     dateOfBirth: { type: Date },
//     emailVerifiedAt: { type: Date },
//     // Role & Access Control
//     role: {
//       type: String,
//       enum: Object.values(ENUM_USER_ROLE),
//       required: true,
//     },
//     permissions: [{ type: String }],
//     isVerified: { type: Boolean, default: false },
//     lastLogin: { type: Date },
//     failedLoginAttempts: {
//       type: Number,
//       default: 0,
//       select: false,
//     },
//     accountLockedUntil: { type: Date },
//     accountStatus: {
//       type: String,
//       enum: ['active', 'deactivated', 'banned'],
//       default: 'active',
//     },
//     // Authentication
//     twoFactorAuth: {
//       enabled: { type: Boolean, default: false },
//       method: {
//         type: String,
//         enum: ['sms', 'authenticator', 'email', 'hardware_key'],
//       },
//       secret: { type: String, select: false },
//       backupCodes: {
//         type: [
//           {
//             code: { type: String, select: false },
//             used: Boolean,
//           },
//         ],
//         select: false,
//       },
//       lastUsed: Date,
//     },
//     socialLogin: {
//       google: {
//         id: String,
//         emailVerified: Boolean,
//       },
//       facebook: {
//         id: String,
//         emailVerified: Boolean,
//       },
//       apple: {
//         id: String,
//         emailVerified: Boolean,
//       },
//     },
//     securityQuestions: {
//       type: [
//         {
//           questionId: String,
//           questionHash: { type: String, select: false },
//           answerHash: { type: String, select: false },
//           createdAt: Date,
//           lastUsed: Date,
//         },
//       ],
//       select: false,
//     },
//     // Device & Session Management
//     trustedDevices: {
//       type: [
//         {
//           deviceId: String,
//           name: String,
//           fingerprint: String,
//           ipRanges: [String],
//           lastUsed: Date,
//           os: String,
//           browser: String,
//           location: String,
//         },
//       ],
//       select: false,
//     },
//     activeSessions: {
//       type: [
//         {
//           sessionId: String,
//           deviceInfo: String,
//           ip: String,
//           userAgent: String,
//           geoLocation: String,
//           createdAt: Date,
//           expiresAt: Date,
//           lastActivity: Date,
//           isRevoked: Boolean,
//         },
//       ],
//       select: false,
//     },
//     // Profile & Preferences
//     profilePicture: {
//       url: String,
//       hash: String,
//       storageLocation: String,
//     },
//     language: {
//       type: String,
//       enum: ['en', 'bn', 'es'],
//       default: 'en',
//     },
//     timezone: String,
//     preferredCurrency: {
//       type: String,
//       enum: ['usd', 'eur', 'gbp'],
//       default: 'usd',
//     },
//     communicationPreferences: {
//       email: { type: Boolean, default: false },
//       sms: { type: Boolean, default: false },
//       push: { type: Boolean, default: false },
//     },
//     // Stripe & Billing
//     stripeCustomerId: String,
//     stripeSubscriptionId: String,
//     subscriptionStatus: {
//       type: String,
//       enum: [
//         'active',
//         'canceled',
//         'trialing',
//         'past_due',
//         'unpaid',
//         'incomplete',
//       ],
//     },
//     currentPlan: String,
//     planInterval: {
//       type: String,
//       enum: ['monthly', 'yearly'],
//     },
//     subscriptionStartDate: Date,
//     subscriptionEndDate: Date,
//     trialEndDate: Date,
//     cancelAtPeriodEnd: { type: Boolean, default: false },
//     planRenewalDate: Date,
//     appliedDiscounts: [
//       {
//         discountId: String,
//         amount: Number,
//         validUntil: Date,
//       },
//     ],
//     billingAddress: {
//       line1: String,
//       line2: String,
//       city: String,
//       state: String,
//       postalCode: String,
//       country: String,
//       taxId: { type: String, select: false },
//     },
//     subscriptionHistory: [
//       {
//         plan: String,
//         interval: { type: String, enum: ['month', 'year'] },
//         startedAt: Date,
//         endedAt: Date,
//       },
//     ],
//     paymentMethods: [
//       {
//         id: String,
//         type: { type: String, enum: ['card', 'bank', 'paypal'] },
//         last4: String,
//         expiry: String,
//         primary: Boolean,
//         addedAt: Date,
//       },
//     ],
//     usageStats: {
//       scansThisMonth: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       alertsTriggered: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       identityTheftClaims: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       lastReset: {
//         type: Date,
//         default: Date.now,
//       },
//     },
//     // Affiliate System
//     affiliateDetails: {
//       referralCode: { type: String, unique: true, index: true, sparse: true },
//       referralSource: String,
//       commissionBalance: { type: Number, default: 0 },
//       payoutHistory: [
//         {
//           amount: Number,
//           date: Date,
//           status: { type: String, enum: ['pending', 'paid'] },
//           transactionId: String,
//           paymentMethod: String,
//         },
//       ],
//       performanceMetrics: {
//         clicks: { type: Number, default: 0 },
//         signups: { type: Number, default: 0 },
//         conversions: { type: Number, default: 0 },
//       },
//     },
//     // Legal & Compliance
//     kycStatus: {
//       type: String,
//       enum: ['pending', 'verified', 'rejected'],
//       default: 'pending',
//     },
//     termsAcceptedAt: Date,
//     privacyPolicyAcceptedAt: Date,
//     marketingConsent: { type: Boolean, default: false },
//     dataSharingConsent: { type: Boolean, default: false },
//     agreeTerms: { type: Boolean, default: false },
//     agreeAutoRenewal: { type: Boolean, default: false },
//     agreeMarketingEmail: { type: Boolean, default: false },
//     dataDeletionRequestedAt: Date,
//     taxInfo: {
//       taxId: { type: String, select: false },
//       exemptStatus: { type: Boolean, default: false },
//     },
//     hipaaConsent: {
//       acceptedAt: Date,
//       documentVersion: String,
//     },
//     // Security & Audit
//     lastPasswordChangeAt: Date,
//     passwordResetRequestedAt: Date,
//     loginHistory: [
//       {
//         timestamp: { type: Date, default: Date.now },
//         ip: String,
//         userAgent: String,
//         location: String,
//       },
//     ],
//     auditLog: [
//       {
//         action: String,
//         timestamp: { type: Date, default: Date.now },
//         ip: String,
//         userAgent: String,
//         details: String,
//       },
//     ],
//     rateLimit: {
//       lastRequestAt: Date,
//       requestCount: { type: Number, default: 0 },
//       windowStart: Date,
//     },
//     fraudSignals: {
//       unusualActivity: [
//         {
//           timestamp: Date,
//           description: String,
//         },
//       ],
//       flaggedIps: [String],
//     },
//     // Multi-Tenant
//     organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
//     isOwner: { type: Boolean, default: false },
//     teamDetails: {
//       teamRole: { type: String, enum: ['owner', 'admin', 'member'] },
//       invitationStatus: {
//         type: String,
//         enum: ['pending', 'accepted', 'rejected'],
//       },
//       usageLimits: {
//         maxUsers: Number,
//         currentUsers: Number,
//       },
//     },
//     // API Tokens
//     apiTokens: [
//       {
//         tokenId: String,
//         name: String,
//         lastUsed: Date,
//         scopes: [String],
//         expiresAt: Date,
//       },
//     ],
//     // System Metadata
//     metadata: {
//       creationSource: {
//         type: String,
//         enum: ['web', 'api', 'admin', 'sso', 'migration'],
//       },
//       initialReferrer: String,
//       campaign: String,
//       dataResidency: { type: String, enum: ['eu', 'us', 'apac'] },
//       gdpr: {
//         article30Record: String,
//         dpoContact: String,
//       },
//     },
//     affiliateProfile: {
//   type: AffiliateProfileSchema,
//   default: null,
//   select: false,
// },
//     // Timestamps
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//     lastActivityAt: Date,
//     deletedAt: Date,
//   },
//   {
//     timestamps: true,
//     toJSON: {
//       virtuals: true,
//       transform: function (doc, ret) {
//         // Remove sensitive fields
//         delete ret.password;
//         delete ret.twoFactorAuth?.secret;
//         delete ret.securityQuestions;
//         delete ret.backupCodes;
//         delete ret.phone;
//         delete ret.address;
//         return ret;
//       },
//     },
//   }
// );
// // Indexes
// userSchema.index({ email: 1 }, { unique: true });
// userSchema.index(
//   { phone: 1 },
//   { partialFilterExpression: { phone: { $exists: true } } }
// );
// userSchema.index({ organizationId: 1 });
// userSchema.index({ 'affiliateDetails.referralCode': 1 });
// userSchema.index({ 'activeSessions.expiresAt': 1 });
// userSchema.index({ 'metadata.dataResidency': 1 });
// userSchema.index({ subscriptionStatus: 1 });
// // Virtuals
// userSchema.virtual('age').get(function () {
//   if (!this.dateOfBirth) return null;
//   const diff = Date.now() - new Date(this.dateOfBirth).getTime();
//   return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
// });
// // Statics Method
// // userSchema.statics.isUserExist = async function (
// //   email: string
// // ): Promise<Pick<IUser, '_id' | 'email' | 'password' | 'role'> | null> {
// //   return await this.findOne({ email })
// //     .select('+password +twoFactorAuth.secret +securityQuestions +affiliateProfile')
// //     .lean();
// // };
// userSchema.statics.isUserExist = async function (
//   email: string,
//   session?: ClientSession
// ): Promise<Pick<IUser, '_id' | 'email' | 'password' | 'role'> | null> {
//   return await this.findOne({ email })
//     .select('+password +twoFactorAuth.secret +securityQuestions +affiliateProfile')
//     .session(session || null)
//     .lean();
// };
// userSchema.statics.isPasswordMatched = async function (
//   givenPassword: string,
//   savedPassword: string
// ): Promise<boolean> {
//   return await bcrypt.compare(givenPassword, savedPassword);
// };
// // Hooks
// userSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(
//       this.password,
//       Number(config.bcrypt_salt_rounds)
//     );
//     this.lastPasswordChangeAt = new Date();
//   }
//   next();
// });
// userSchema.pre('findOneAndUpdate', async function (next) {
//   const update = this.getUpdate() as any;
//   if (update?.password) {
//     update.password = await bcrypt.hash(
//       update.password,
//       Number(config.bcrypt_salt_rounds)
//     );
//     update.lastPasswordChangeAt = new Date();
//   }
//   next();
// });
// userSchema.pre<IUserDocument>(
//   'deleteOne',
//   { document: true, query: false },
//   async function (next) {
//     if (this.stripeCustomerId) {
//       try {
//         await stripe.customers.del(this.stripeCustomerId);
//       } catch (err) {
//         console.error('Stripe customer deletion failed:', err);
//       }
//     }
//     next();
//   }
// );
// // Methods
// userSchema.methods.updateProfile = async function (
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   this: any,
//   updateData: Partial<IUser>
// ) {
//   const allowedFields: (keyof IUser)[] = [
//     'name',
//     'phone',
//     'address',
//     'gender',
//     'dateOfBirth',
//     'language',
//     'timezone',
//     'preferredCurrency',
//     'profilePicture',
//     'communicationPreferences',
//   ];
//   allowedFields.forEach(field => {
//     const value = updateData[field];
//     if (value !== undefined) {
//       (this as Record<string, any>)[field] = value;
//     }
//   });
//   await this.save();
// };
// userSchema.methods.revokeSession = function (sessionId: string) {
//   const session = this.activeSessions?.find(
//     (s: { sessionId: string }) => s.sessionId === sessionId
//   );
//   if (session) {
//     session.isRevoked = true;
//     session.expiresAt = new Date();
//   }
//   return this.save();
// };
// export const User = model<IUser, UserModel>('User', userSchema);
// // models/AdminSetupToken.ts
// import  {  Document } from "mongoose";
// export type IAdminSetupToken = {
//   email: string;
//   token: string;
//   expiresAt: Date;
//     used: boolean;
// } & Document
// const AdminSetupTokenSchema = new Schema<IAdminSetupToken>({
//   email: { type: String, required: true },
//   token: { type: String, required: true, unique: true },
//   expiresAt: { type: Date, required: true },
//    used: { type: Boolean, default: false }
// });
// export const AdminSetupToken= model<IAdminSetupToken>("AdminSetupToken", AdminSetupTokenSchema);
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = __importDefault(require("../../../config"));
const user_1 = require("../../../enums/user");
const auth_utils_1 = require("./auth.utils");
// // Interfaces
// export interface IAddress {
//   street: string;
//   apartment?: string;
//   zipCode: string;
//   city: string;
//   state?: string;
//   country?: string;
// }
// export interface IUserCommon {
//   _id: Types.ObjectId;
//   name: string;
//   email: string;
//   password: string;
//   phone?: string;
//   address?: IAddress;
//   gender?: ENUM_GENDER;
//   dateOfBirth?: Date;
//   emailVerifiedAt?: Date;
//   role: ENUM_USER_ROLE;
//   isVerified: boolean;
//   profilePicture?: {
//     url: string;
//     hash: string;
//     storageLocation: string;
//   };
//   createdAt: Date;
//   updatedAt: Date;
//   lastLogin?: Date;
//   failedLoginAttempts?: number;
//   accountLockedUntil?: Date;
//   accountStatus: 'active' | 'deactivated' | 'banned' | 'suspended';
//     // ================================
//   // Authentication: 2FA & Social
//   // ================================
//   twoFactorAuth: {
//     enabled: boolean;
//     method?: 'sms' | 'authenticator' | 'email' | 'hardware_key';
//     secret?: string;
//     backupCodes?: { code: string; used: boolean }[];
//     lastUsed?: Date;
//   };
//    socialLogin?: {
//     google?: { id: string; emailVerified: boolean };
//     facebook?: { id: string; emailVerified: boolean };
//     apple?: { id: string; emailVerified: boolean };
//   };
//  securityQuestions?: {
//     questionId: string;
//     questionHash: string;
//     answerHash: string;
//     createdAt: Date;
//     lastUsed?: Date;
//   }[];
// // ================================
//   // Device & Session Management
//   // ================================
//   trustedDevices?: {
//     deviceId: string;
//     name?: string;
//     fingerprint: string;
//     ipRanges?: string[];
//     lastUsed: Date;
//     os?: string;
//     browser?: string;
//     location?: string;
//   }[];
//   activeSessions?: {
//     sessionId: string;
//     deviceInfo: string;
//     ip: string;
//     userAgent: string;
//     geoLocation?: string;
//     createdAt: Date;
//     expiresAt: Date;
//     lastActivity: Date;
//     isRevoked?: boolean;
//   }[];
//   // ================================
//   // Profile & Preferences
//   // ================================
//   language: 'en' | 'bn' | 'es' | string;
//   timezone?: string;
//   preferredCurrency: 'usd' | 'eur' | 'gbp' | string;
//   communicationPreferences?: {
//     email: boolean;
//     sms: boolean;
//     push: boolean;
//   };
// }
// export interface ICustomer extends IUserCommon {
//   role: ENUM_USER_ROLE.CUSTOMER;
//   customerProfile: ICustomerProfile;
//   affiliateDetails?: IAffiliateDetails;
// }
// export interface IAffiliate extends IUserCommon {
//   role: ENUM_USER_ROLE.AFFILIATE;
//   affiliateProfile: IAffiliateProfile;
//   affiliateDetails: IAffiliateDetails;
// }
// export interface IAdmin extends IUserCommon {
//   role: ENUM_USER_ROLE.ADMIN | ENUM_USER_ROLE.SUPERADMIN;
//   adminProfile: IAdminProfile;
// }
// export type IUser = ICustomer | IAffiliate | IAdmin;
// export interface IUserDocument extends IUser, Document {
//   updateProfile: (updateData: Partial<IUser>) => Promise<void>;
//   createStripeCustomer: () => Promise<string>;
//   applyAsAffiliate: (
//     affiliateData: Partial<IAffiliateProfile>
//   ) => Promise<IUserDocument>;
//   addCommission: (amount: number, description: string) => Promise<number>;
//   generateReferralCode: () => string;
//   isPasswordMatched: (password: string) => Promise<boolean>;
// }
// export interface UserModel extends Model<IUserDocument> {
//   isUserExist: (
//     email: string,
//     session?: ClientSession
//   ) => Promise<Pick<IUser, '_id' | 'email' | 'password' | 'role'> | null>;
//   isPasswordMatched: (
//     givenPassword: string,
//     savedPassword: string
//   ) => Promise<boolean>;
// }
// Address Schema
const AddressSchema = new mongoose_1.Schema({
    street: { type: String, required: true },
    apartment: { type: String },
    zipCode: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'USA' },
}, { _id: false });
// Admin Profile Schema
const AdminProfileSchema = new mongoose_1.Schema({
    permissions: {
        global: { type: Boolean, default: false },
        userManagement: { type: Boolean, default: false },
        contentManagement: { type: Boolean, default: false },
        billingManagement: { type: Boolean, default: false },
        systemSettings: { type: Boolean, default: false },
        affiliateManagement: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false },
        apiManagement: { type: Boolean, default: false },
    },
    accessLevel: {
        type: String,
        enum: ['read', 'write', 'admin'],
        default: 'read',
    },
    assignedModules: [String],
    lastAccessReview: Date,
    securityClearance: {
        type: String,
        enum: ['basic', 'elevated', 'high'],
        default: 'basic',
    },
    twoFactorEnforced: { type: Boolean, default: true },
    loginRestrictions: {
        ipWhitelist: [String],
        timeRestrictions: {
            start: String,
            end: String,
        },
        deviceRestrictions: { type: Boolean, default: false },
    },
    auditLogAccess: { type: Boolean, default: false },
    canImpersonate: { type: Boolean, default: false },
    apiRateLimit: { type: Number, default: 1000 },
    sessionTimeout: { type: Number, default: 3600 }, // in seconds
}, { _id: false, timestamps: true });
// Affiliate Profile Schema
const AffiliateProfileSchema = new mongoose_1.Schema({
    companyName: String,
    skypeId: String,
    yourWebsite: String,
    trafficSources: [String],
    channels: [String],
    howPromote: String,
    describeExperience: String,
    pastExperience: String,
    lookingCampaign: String,
    whenYouFree: String,
    idPhotoFront: String,
    idPhotoBack: String,
    timeZone: String,
    didYouHear: String,
    alternativePhone: String,
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    adminNotes: String,
    reviewDate: Date,
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    contractSigned: { type: Boolean, default: false },
    contractVersion: String,
    contractSignedAt: Date,
    referrals: [
        {
            email: String,
            customerName: String,
            subscriptionId: String,
            date: Date,
            status: { type: String, enum: ['pending', 'paid', 'rejected'] },
        },
    ],
    totalReferrals: { type: Number, default: 0 },
    pendingCommissions: { type: Number, default: 0 },
}, { _id: false, timestamps: true });
// Affiliate Details Schema
const AffiliateDetailsSchema = new mongoose_1.Schema({
    referralCode: { type: String, unique: true, index: true, sparse: true },
    referralSource: String,
    commissionBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    lifetimeEarnings: { type: Number, default: 0 },
    payoutThreshold: { type: Number, default: 50 },
    payoutMethod: {
        type: {
            type: String,
            enum: ['paypal', 'bank_transfer', 'check', 'crypto'],
        },
        details: mongoose_1.Schema.Types.Mixed,
    },
    payoutHistory: [
        {
            amount: Number,
            date: Date,
            status: {
                type: String,
                enum: ['pending', 'paid', 'failed', 'processing'],
            },
            transactionId: String,
            paymentMethod: String,
            reference: String,
        },
    ],
    performanceMetrics: {
        clicks: { type: Number, default: 0 },
        signups: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        revenueGenerated: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'bronze',
    },
    commissionRate: { type: Number, default: 0.2 },
    isActive: { type: Boolean, default: true },
    activationDate: Date,
    lastPayoutDate: Date,
    taxInfo: {
        taxId: String,
        formSubmitted: { type: Boolean, default: false },
        taxForm: String,
        taxYear: Number,
    },
    customCommissionRules: [
        {
            productId: String,
            commissionRate: Number,
            startDate: Date,
            endDate: Date,
            isActive: Boolean,
        },
    ],
    performanceBonuses: [
        {
            bonusId: String,
            amount: Number,
            reason: String,
            dateAwarded: Date,
            targetMet: String,
        },
    ],
    affiliateManager: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    marketingMaterials: [String],
}, { _id: false, timestamps: true });
// Customer Profile Schema
const CustomerProfileSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    ssn: {
        type: String,
        select: false,
        validate: {
            validator: (value) => /^\d{3}-\d{2}-\d{4}$/.test(value),
            message: 'SSN must be in format XXX-XX-XXXX',
        },
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: {
        type: String,
        enum: [
            'active',
            'canceled',
            'trialing',
            'past_due',
            'unpaid',
            'incomplete',
        ],
        default: 'incomplete',
    },
    currentPlan: String,
    planInterval: {
        type: String,
        enum: ['monthly', 'yearly'],
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    trialEndDate: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    planRenewalDate: Date,
    appliedDiscounts: [
        {
            discountId: String,
            amount: Number,
            validUntil: Date,
        },
    ],
    billingAddress: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        taxId: { type: String, select: false },
    },
    subscriptionHistory: [
        {
            plan: String,
            interval: { type: String, enum: ['month', 'year'] },
            startedAt: Date,
            endedAt: Date,
        },
    ],
    usageStats: {
        scansThisMonth: { type: Number, default: 0, min: 0 },
        alertsTriggered: { type: Number, default: 0, min: 0 },
        identityTheftClaims: { type: Number, default: 0, min: 0 },
        creditReportsGenerated: { type: Number, default: 0, min: 0 },
        darkWebMonitoring: { type: Number, default: 0, min: 0 },
        lastReset: { type: Date, default: Date.now },
    },
    paymentMethods: [
        {
            id: String,
            type: { type: String, enum: ['card', 'bank', 'paypal'] },
            last4: String,
            expiry: String,
            primary: Boolean,
            addedAt: Date,
            billingDetails: {
                name: String,
                email: String,
                phone: String,
                address: mongoose_1.Schema.Types.Mixed,
            },
        },
    ],
    agreeAutoRenewal: { type: Boolean, default: false },
    privacyPolicyAcceptedAt: Date,
    paymentFailureCount: { type: Number, default: 0 },
    lastPaymentDate: Date,
    nextBillingDate: Date,
    invoiceHistory: [
        {
            invoiceId: String,
            amount: Number,
            date: Date,
            status: String,
            downloadUrl: String,
        },
    ],
    creditMonitoring: {
        enabled: { type: Boolean, default: false },
        lastUpdated: Date,
        score: Number,
        factors: [String],
    },
    preferences: {
        alerts: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
        },
        reports: {
            frequency: {
                type: String,
                enum: ['weekly', 'monthly', 'quarterly'],
                default: 'monthly',
            },
            format: { type: String, enum: ['pdf', 'html', 'both'], default: 'pdf' },
        },
        communication: {
            promotional: { type: Boolean, default: true },
            educational: { type: Boolean, default: true },
            security: { type: Boolean, default: true },
        },
    },
    loyaltyPoints: { type: Number, default: 0 },
    supportTier: {
        type: String,
        enum: ['basic', 'priority', 'vip'],
        default: 'basic',
    },
    accountManager: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    referredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    referralCodeUsed: {
        type: String,
        default: null,
    },
}, { _id: false, timestamps: true });
// Main User Schema Fo All User
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Invalid email format',
        },
    },
    password: {
        type: String,
        required: true,
        select: false,
        minlength: 8,
        //   validate: {
        //     validator: (value: string) =>
        //       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        //         value
        //       ),
        //     message:
        //       'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        //   },
    },
    phone: {
        type: String,
        select: false,
        validate: {
            validator: (value) => /^\+?[1-9]\d{1,14}$/.test(value),
            message: 'Invalid phone number format',
        },
    },
    address: {
        type: AddressSchema,
        select: false,
    },
    gender: {
        type: String,
        enum: Object.values(user_1.ENUM_GENDER),
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function (value) {
                return (value <=
                    new Date(new Date().setFullYear(new Date().getFullYear() - 13)));
            },
            message: 'User must be at least 13 years old',
        },
    },
    // dateOfBirth: { type: Date },
    emailVerifiedAt: { type: Date },
    // Role & Access Control
    role: {
        type: String,
        enum: Object.values(user_1.ENUM_USER_ROLE),
        required: true,
        default: user_1.ENUM_USER_ROLE.CUSTOMER,
    },
    isVerified: { type: Boolean, default: false },
    accountStatus: {
        type: String,
        enum: ['active', 'deactivated', 'banned', 'suspended'],
        default: 'active',
    },
    // Profile & Preferences
    profilePicture: {
        url: String,
        hash: String,
        storageLocation: String,
        uploadedAt: Date,
    },
    // Authentication & Security
    lastLogin: { type: Date },
    failedLoginAttempts: {
        type: Number,
        default: 0,
        select: false,
    },
    accountLockedUntil: { type: Date },
    lastPasswordChangeAt: Date,
    passwordResetRequestedAt: Date,
    passwordHistory: [
        {
            password: String,
            changedAt: Date,
        },
    ],
    loginHistory: [
        {
            timestamp: { type: Date, default: Date.now },
            ip: String,
            userAgent: String,
            location: String,
        },
    ],
    auditLog: [
        {
            action: String,
            timestamp: { type: Date, default: Date.now },
            ip: String,
            userAgent: String,
            details: String,
        },
    ],
    fraudSignals: {
        unusualActivity: [
            {
                timestamp: Date,
                description: String,
            },
        ],
        flaggedIps: [String],
    },
    // Two-Factor Authentication
    twoFactorAuth: {
        enabled: { type: Boolean, default: false },
        method: {
            type: String,
            enum: ['authenticator', 'sms', 'email'],
        },
        secret: { type: String, select: false },
        backupCodes: {
            type: [String],
            select: false,
        },
        lastUsed: Date,
    },
    socialLogin: {
        google: {
            id: String,
            emailVerified: Boolean,
        },
        facebook: {
            id: String,
            emailVerified: Boolean,
        },
        apple: {
            id: String,
            emailVerified: Boolean,
        },
    },
    securityQuestions: {
        type: [
            {
                questionId: String,
                questionHash: { type: String, select: false },
                answerHash: { type: String, select: false },
                createdAt: Date,
                lastUsed: Date,
            },
        ],
        select: false,
    },
    // Device & Session Management
    trustedDevices: {
        type: [
            {
                deviceId: String,
                name: String,
                fingerprint: String,
                ipRanges: [String],
                lastUsed: Date,
                os: String,
                browser: String,
                location: String,
            },
        ],
        select: false,
    },
    activeSessions: {
        type: [
            {
                sessionId: String,
                deviceInfo: String,
                ip: String,
                userAgent: String,
                geoLocation: String,
                createdAt: Date,
                expiresAt: Date,
                lastActivity: Date,
                isRevoked: Boolean,
            },
        ],
        select: false,
    },
    language: {
        type: String,
        enum: ['en', 'bn', 'es'],
        default: 'en',
    },
    timezone: String,
    preferredCurrency: {
        type: String,
        enum: ['usd', 'eur', 'gbp'],
        default: 'usd',
    },
    communicationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
    },
    // Role-specific profiles
    customerProfile: {
        type: CustomerProfileSchema,
        default: null,
    },
    affiliateProfile: {
        type: AffiliateProfileSchema,
        default: null,
        select: false,
    },
    affiliateDetails: {
        type: AffiliateDetailsSchema,
        default: null,
    },
    adminProfile: {
        type: AdminProfileSchema,
        default: null,
        select: false,
    },
    // Security & Compliance
    agreeMarketingEmail: { type: Boolean, default: true },
    termsAcceptedAt: Date,
    privacyPolicyAcceptedAt: Date,
    agreeTerms: { type: Boolean, default: false },
    kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'expired'],
        default: 'pending',
    },
    kycDocuments: [
        {
            type: String,
            url: String,
            status: String,
            uploadedAt: Date,
            reviewedAt: Date,
        },
    ],
    dataDeletionRequestedAt: Date,
    marketingConsent: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        givenAt: Date,
    },
    dataSharingConsent: { type: Boolean, default: false },
    hipaaConsent: {
        acceptedAt: Date,
        documentVersion: String,
    },
    // System Metadata
    signupSource: {
        type: String,
        enum: ['web', 'mobile', 'api', 'admin', 'affiliate'],
        default: 'web',
    },
    signupCampaign: String,
    signupReferrer: String,
    ipAddress: String,
    userAgent: String,
    locale: String,
    dataResidency: { type: String, enum: ['eu', 'us', 'apac'] },
    gdpr: {
        article30Record: String,
        dpoContact: String,
    },
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastActivityAt: Date,
    deletedAt: Date,
}, {
    timestamps: true,
    discriminatorKey: 'role',
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            var _a;
            // Remove sensitive fields
            delete ret.password;
            delete ret.ssn;
            delete ret.phone;
            delete ret.address;
            (_a = ret.twoFactorAuth) === null || _a === void 0 ? true : delete _a.secret;
            delete ret.passwordHistory;
            delete ret.securityQuestions;
            delete ret.backupCodes;
            // Show role-specific profiles only for appropriate roles
            if (ret.role !== user_1.ENUM_USER_ROLE.AFFILIATE) {
                delete ret.affiliateProfile;
            }
            if (ret.role !== user_1.ENUM_USER_ROLE.CUSTOMER) {
                delete ret.customerProfile;
            }
            if (![user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN].includes(ret.role)) {
                delete ret.adminProfile;
            }
            return ret;
        },
    },
});
// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ phone: 1 }, { partialFilterExpression: { phone: { $exists: true } } });
userSchema.index({ 'customerProfile.stripeCustomerId': 1 });
userSchema.index({ 'affiliateDetails.referralCode': 1 }, { sparse: true });
userSchema.index({ 'affiliateProfile.approvalStatus': 1 });
userSchema.index({ 'adminProfile.permissions.global': 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastActivityAt: 1 });
userSchema.index({ 'customerProfile.subscriptionStatus': 1 });
userSchema.index({ 'affiliateDetails.tier': 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ subscriptionStatus: 1 });
// Virtuals
userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth)
        return null;
    const diff = Date.now() - new Date(this.dateOfBirth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});
// Statics Methods
userSchema.statics.isUserExist = function (email, session) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ email })
            .select('+password +twoFactorAuth.secret +securityQuestions +customerProfile +affiliateProfile +adminProfile')
            .session(session || null)
            .lean();
    });
};
userSchema.statics.isPasswordMatched = function (givenPassword, savedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(givenPassword, savedPassword);
    });
};
userSchema.virtual('isAffiliateApproved').get(function () {
    var _a;
    return (this.role === user_1.ENUM_USER_ROLE.AFFILIATE &&
        ((_a = this.affiliateProfile) === null || _a === void 0 ? void 0 : _a.approvalStatus) === 'approved');
});
userSchema.virtual('hasActiveSubscription').get(function () {
    var _a;
    return (this.role === user_1.ENUM_USER_ROLE.CUSTOMER &&
        ['active', 'trialing'].includes(((_a = this.customerProfile) === null || _a === void 0 ? void 0 : _a.subscriptionStatus) || ''));
});
userSchema.virtual('daysSinceLastActivity').get(function () {
    if (!this.lastActivityAt)
        return null;
    const diff = Date.now() - new Date(this.lastActivityAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});
// Hooks
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('password')) {
            this.password = yield bcryptjs_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
            this.lastPasswordChangeAt = new Date();
            // Store password history (last 5 passwords)
            if (!this.passwordHistory)
                this.passwordHistory = [];
            this.passwordHistory.push({
                password: this.password,
                changedAt: new Date(),
            });
            // Keep only last 5 passwords
            if (this.passwordHistory.length > 5) {
                this.passwordHistory = this.passwordHistory.slice(-5);
            }
        }
        // Initialize admin profile for admin users
        if ([user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.SUPER_ADMIN].includes(this.role) &&
            !this.adminProfile) {
            //@ts-ignore
            this.adminProfile = {
                permissions: {
                    global: this.role === user_1.ENUM_USER_ROLE.SUPER_ADMIN,
                    userManagement: true,
                    contentManagement: true,
                    billingManagement: true,
                    systemSettings: this.role === user_1.ENUM_USER_ROLE.SUPER_ADMIN,
                    affiliateManagement: true,
                    analytics: true,
                    apiManagement: this.role === user_1.ENUM_USER_ROLE.SUPER_ADMIN,
                },
                accessLevel: this.role === user_1.ENUM_USER_ROLE.SUPER_ADMIN ? 'admin' : 'write',
                securityClearance: this.role === user_1.ENUM_USER_ROLE.SUPER_ADMIN ? 'high' : 'elevated',
            };
        }
        next();
    });
});
userSchema.pre('findOneAndUpdate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const update = this.getUpdate();
        if (update === null || update === void 0 ? void 0 : update.password) {
            update.password = yield bcryptjs_1.default.hash(update.password, Number(config_1.default.bcrypt_salt_rounds));
            update.lastPasswordChangeAt = new Date();
        }
        next();
    });
});
// Methods
userSchema.methods.isPasswordMatched = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(password, this.password);
    });
};
userSchema.methods.updateProfile = function (
//  @ts-ignore
updateData) {
    return __awaiter(this, void 0, void 0, function* () {
        //  @ts-ignore
        const allowedFields = [
            'name',
            'phone',
            'address',
            'gender',
            'dateOfBirth',
            'language',
            'timezone',
            'preferredCurrency',
            'profilePicture',
            'communicationPreferences',
        ];
        allowedFields.forEach(field => {
            const value = updateData[field];
            if (value !== undefined) {
                //  @ts-ignore
                this[field] = value;
            }
        });
        yield this.save();
    });
};
userSchema.methods.revokeSession = function (sessionId) {
    var _a;
    const session = (_a = this.activeSessions) === null || _a === void 0 ? void 0 : _a.find((s) => s.sessionId === sessionId);
    if (session) {
        session.isRevoked = true;
        session.expiresAt = new Date();
    }
    return this.save();
};
userSchema.methods.addCommission = function (amount) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.role !== user_1.ENUM_USER_ROLE.AFFILIATE) {
            throw new Error('Only affiliates can earn commissions');
        }
        if (!this.affiliateDetails) {
            throw new Error('Affiliate details not initialized');
        }
        this.affiliateDetails.commissionBalance += amount;
        this.affiliateDetails.totalEarnings += amount;
        this.affiliateDetails.pendingEarnings += amount;
        // Add to performance metrics
        this.affiliateDetails.performanceMetrics.conversions += 1;
        this.affiliateDetails.performanceMetrics.conversionRate =
            this.affiliateDetails.performanceMetrics.conversions /
                Math.max(this.affiliateDetails.performanceMetrics.clicks, 1);
        this.affiliateDetails.performanceMetrics.lastUpdated = new Date();
        yield this.save();
        return this.affiliateDetails.commissionBalance;
    });
};
userSchema.methods.createStripeCustomer = function () {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if ((_a = this.customerProfile) === null || _a === void 0 ? void 0 : _a.stripeCustomerId) {
            return this.customerProfile.stripeCustomerId;
        }
        const stripeCustomer = yield auth_utils_1.stripe.customers.create({
            email: this.email,
            name: this.name,
            phone: this.phone,
            metadata: {
                userId: this._id.toString(),
                userRole: this.role,
            },
        });
        if (!this.customerProfile) {
            this.customerProfile = {
                stripeCustomerId: stripeCustomer.id,
                subscriptionStatus: 'incomplete',
            };
        }
        else {
            this.customerProfile.stripeCustomerId = stripeCustomer.id;
        }
        yield this.save();
        return stripeCustomer.id;
    });
};
userSchema.methods.upgradeToAdmin = function (adminData, upgradedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        if (![user_1.ENUM_USER_ROLE.SUPER_ADMIN].includes(this.role)) {
            throw new Error('Only superadmins can upgrade users to admin');
        }
        this.role = user_1.ENUM_USER_ROLE.ADMIN;
        this.adminProfile = Object.assign(Object.assign({}, adminData), { permissions: {
                global: false,
                userManagement: ((_a = adminData.permissions) === null || _a === void 0 ? void 0 : _a.userManagement) || false,
                contentManagement: ((_b = adminData.permissions) === null || _b === void 0 ? void 0 : _b.contentManagement) || false,
                billingManagement: ((_c = adminData.permissions) === null || _c === void 0 ? void 0 : _c.billingManagement) || false,
                systemSettings: false,
                affiliateManagement: ((_d = adminData.permissions) === null || _d === void 0 ? void 0 : _d.affiliateManagement) || false,
                analytics: ((_e = adminData.permissions) === null || _e === void 0 ? void 0 : _e.analytics) || false,
                apiManagement: false,
            }, accessLevel: adminData.accessLevel || 'write', securityClearance: adminData.securityClearance || 'elevated', twoFactorEnforced: true });
        // Add audit log entry
        this.auditLog = this.auditLog || [];
        this.auditLog.push({
            action: 'role_upgrade',
            timestamp: new Date(),
            performedBy: upgradedBy,
            details: `Upgraded to ${user_1.ENUM_USER_ROLE.ADMIN} role`,
            ipAddress: 'system',
        });
        yield this.save();
        return this;
    });
};
// Create discriminators for better query performance
exports.User = (0, mongoose_1.model)('User', userSchema);
exports.Customer = exports.User.discriminator(user_1.ENUM_USER_ROLE.CUSTOMER, new mongoose_1.Schema({}));
exports.Affiliate = exports.User.discriminator(user_1.ENUM_USER_ROLE.AFFILIATE, new mongoose_1.Schema({}));
exports.Admin = exports.User.discriminator(user_1.ENUM_USER_ROLE.ADMIN, new mongoose_1.Schema({}));
exports.SuperAdmin = exports.User.discriminator(user_1.ENUM_USER_ROLE.SUPER_ADMIN, new mongoose_1.Schema({}));
exports.default = exports.User;
