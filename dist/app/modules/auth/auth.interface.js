"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
