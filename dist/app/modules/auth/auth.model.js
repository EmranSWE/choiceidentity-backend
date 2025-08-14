"use strict";
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
exports.AdminSetupToken = exports.User = void 0;
/* eslint-disable @typescript-eslint/no-this-alias */
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = __importDefault(require("../../../config"));
const user_1 = require("../../../enums/user");
const auth_utils_1 = require("./auth.utils");
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
    idPhotoFront: String, // File URL or S3 Key
    idPhotoBack: String,
    city: String,
    state: String,
    streetAddress: String,
    zipCode: String,
    country: String,
    timeZone: String,
    didYouHear: String,
    alternativePhone: String,
    agreeTerms: Boolean,
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    adminNotes: String,
}, { _id: false, timestamps: true });
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Invalid email format',
        },
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    phone: {
        type: String,
        select: false,
        validate: {
            validator: (value) => /^(?:\+88)?01[3-9]\d{8}$/.test(value),
            message: 'Invalid phone number',
        },
    },
    address: {
        type: String,
        select: false,
    },
    gender: {
        type: String,
        enum: Object.values(user_1.ENUM_GENDER),
    },
    dateOfBirth: { type: Date },
    emailVerifiedAt: { type: Date },
    // Role & Access Control
    role: {
        type: String,
        enum: Object.values(user_1.ENUM_USER_ROLE),
        required: true,
    },
    permissions: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    failedLoginAttempts: {
        type: Number,
        default: 0,
        select: false,
    },
    accountLockedUntil: { type: Date },
    accountStatus: {
        type: String,
        enum: ['active', 'deactivated', 'banned'],
        default: 'active',
    },
    // Authentication
    twoFactorAuth: {
        enabled: { type: Boolean, default: false },
        method: {
            type: String,
            enum: ['sms', 'authenticator', 'email', 'hardware_key'],
        },
        secret: { type: String, select: false },
        backupCodes: {
            type: [
                {
                    code: { type: String, select: false },
                    used: Boolean,
                },
            ],
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
    // Profile & Preferences
    profilePicture: {
        url: String,
        hash: String,
        storageLocation: String,
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
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
    },
    // Stripe & Billing
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
    paymentMethods: [
        {
            id: String,
            type: { type: String, enum: ['card', 'bank', 'paypal'] },
            last4: String,
            expiry: String,
            primary: Boolean,
            addedAt: Date,
        },
    ],
    usageStats: {
        scansThisMonth: {
            type: Number,
            default: 0,
            min: 0,
        },
        alertsTriggered: {
            type: Number,
            default: 0,
            min: 0,
        },
        identityTheftClaims: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastReset: {
            type: Date,
            default: Date.now,
        },
    },
    // Affiliate System
    affiliateDetails: {
        referralCode: { type: String, unique: true, index: true, sparse: true },
        referralSource: String,
        commissionBalance: { type: Number, default: 0 },
        payoutHistory: [
            {
                amount: Number,
                date: Date,
                status: { type: String, enum: ['pending', 'paid'] },
                transactionId: String,
                paymentMethod: String,
            },
        ],
        performanceMetrics: {
            clicks: { type: Number, default: 0 },
            signups: { type: Number, default: 0 },
            conversions: { type: Number, default: 0 },
        },
    },
    // Legal & Compliance
    kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
    termsAcceptedAt: Date,
    privacyPolicyAcceptedAt: Date,
    marketingConsent: { type: Boolean, default: false },
    dataSharingConsent: { type: Boolean, default: false },
    dataDeletionRequestedAt: Date,
    taxInfo: {
        taxId: { type: String, select: false },
        exemptStatus: { type: Boolean, default: false },
    },
    hipaaConsent: {
        acceptedAt: Date,
        documentVersion: String,
    },
    // Security & Audit
    lastPasswordChangeAt: Date,
    passwordResetRequestedAt: Date,
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
    rateLimit: {
        lastRequestAt: Date,
        requestCount: { type: Number, default: 0 },
        windowStart: Date,
    },
    fraudSignals: {
        unusualActivity: [
            {
                timestamp: Date,
                description: String,
            },
        ],
        flaggedIps: [String],
    },
    // Multi-Tenant
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization' },
    isOwner: { type: Boolean, default: false },
    teamDetails: {
        teamRole: { type: String, enum: ['owner', 'admin', 'member'] },
        invitationStatus: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
        },
        usageLimits: {
            maxUsers: Number,
            currentUsers: Number,
        },
    },
    // API Tokens
    apiTokens: [
        {
            tokenId: String,
            name: String,
            lastUsed: Date,
            scopes: [String],
            expiresAt: Date,
        },
    ],
    // System Metadata
    metadata: {
        creationSource: {
            type: String,
            enum: ['web', 'api', 'admin', 'sso', 'migration'],
        },
        initialReferrer: String,
        campaign: String,
        dataResidency: { type: String, enum: ['eu', 'us', 'apac'] },
        gdpr: {
            article30Record: String,
            dpoContact: String,
        },
    },
    affiliateProfile: {
        type: AffiliateProfileSchema,
        default: null,
        select: false,
    },
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastActivityAt: Date,
    deletedAt: Date,
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            var _a;
            // Remove sensitive fields
            delete ret.password;
            (_a = ret.twoFactorAuth) === null || _a === void 0 ? true : delete _a.secret;
            delete ret.securityQuestions;
            delete ret.backupCodes;
            delete ret.phone;
            delete ret.address;
            return ret;
        },
    },
});
// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { partialFilterExpression: { phone: { $exists: true } } });
userSchema.index({ organizationId: 1 });
userSchema.index({ 'affiliateDetails.referralCode': 1 });
userSchema.index({ 'activeSessions.expiresAt': 1 });
userSchema.index({ 'metadata.dataResidency': 1 });
userSchema.index({ subscriptionStatus: 1 });
// Virtuals
userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth)
        return null;
    const diff = Date.now() - new Date(this.dateOfBirth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});
// Statics Method
// userSchema.statics.isUserExist = async function (
//   email: string
// ): Promise<Pick<IUser, '_id' | 'email' | 'password' | 'role'> | null> {
//   return await this.findOne({ email })
//     .select('+password +twoFactorAuth.secret +securityQuestions +affiliateProfile')
//     .lean();
// };
userSchema.statics.isUserExist = function (email, session) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ email })
            .select('+password +twoFactorAuth.secret +securityQuestions +affiliateProfile')
            .session(session || null)
            .lean();
    });
};
userSchema.statics.isPasswordMatched = function (givenPassword, savedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(givenPassword, savedPassword);
    });
};
// Hooks
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('password')) {
            this.password = yield bcryptjs_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
            this.lastPasswordChangeAt = new Date();
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
userSchema.pre('deleteOne', { document: true, query: false }, function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.stripeCustomerId) {
            try {
                yield auth_utils_1.stripe.customers.del(this.stripeCustomerId);
            }
            catch (err) {
                console.error('Stripe customer deletion failed:', err);
            }
        }
        next();
    });
});
// Methods
userSchema.methods.updateProfile = function (updateData) {
    return __awaiter(this, void 0, void 0, function* () {
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
exports.User = (0, mongoose_1.model)('User', userSchema);
const AdminSetupTokenSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
});
exports.AdminSetupToken = (0, mongoose_1.model)("AdminSetupToken", AdminSetupTokenSchema);
