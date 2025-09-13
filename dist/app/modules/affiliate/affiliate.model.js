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
exports.ClickLog = exports.AffiliateLink = exports.SubIdPerformance = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const affiliate_interface_1 = require("./affiliate.interface");
const affiliate_utils_1 = require("./affiliate.utils");
const mongoose_2 = require("mongoose");
const subIdPerformanceSchema = new mongoose_1.Schema({
    affiliateLinkId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AffiliateLink',
        required: true,
        index: true
    },
    affiliateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    clicks: {
        type: Number,
        default: 0,
        min: 0
    },
    conversions: {
        type: Number,
        default: 0,
        min: 0
    },
    revenue: {
        type: Number,
        default: 0,
        min: 0
    },
    commission: {
        type: Number,
        default: 0,
        min: 0
    },
    firstClickAt: {
        type: Date,
        default: Date.now
    },
    lastClickAt: {
        type: Date,
        default: Date.now
    },
    lastConversionAt: {
        type: Date,
        default: null
    },
    epc: {
        type: Number,
        default: 0,
        min: 0
    },
    deviceBreakdown: {
        desktop: { type: Number, default: 0, min: 0 },
        mobile: { type: Number, default: 0, min: 0 },
        tablet: { type: Number, default: 0, min: 0 }
    },
    campaign: {
        type: String,
        default: null,
        trim: true,
        maxlength: 50,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active',
        index: true
    }
}, {
    timestamps: true
});
// Compound indexes
subIdPerformanceSchema.index({ affiliateLinkId: 1, subId: 1 }, { unique: true });
subIdPerformanceSchema.index({ affiliateId: 1, subId: 1 });
subIdPerformanceSchema.index({ affiliateId: 1, createdAt: -1 });
// Pre-save middleware to calculate EPC
subIdPerformanceSchema.pre('save', function (next) {
    this.epc = this.clicks > 0 ? this.revenue / this.clicks : 0;
    next();
});
// Virtual for conversion rate
subIdPerformanceSchema.virtual('conversionRate').get(function () {
    return this.clicks > 0 ? (this.conversions / this.clicks) * 100 : 0;
});
exports.SubIdPerformance = mongoose_1.default.model('SubIdPerformance', subIdPerformanceSchema);
const affiliateLinkSchema = new mongoose_1.Schema({
    affiliateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    affiliateCode: {
        type: String,
        required: true,
        trim: true,
        index: true,
        maxLength: 30,
    },
    plan: { type: String, enum: affiliate_interface_1.PLANS, required: true },
    billing: { type: String, enum: affiliate_interface_1.BILLINGS, required: true },
    subId: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
        sparse: true,
        index: true,
    },
    generatedUrl: { type: String, required: true, unique: true, trim: true },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        index: true,
        trim: true,
        maxLength: 120,
    },
    shortSlug: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        maxLength: 50,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
    },
    clickId: { type: String, unique: true, sparse: true },
    status: {
        type: String,
        enum: ['active', 'paused', 'deleted'],
        default: 'active',
        index: true,
    },
    clickCount: { type: Number, default: 0, min: 0 },
    conversionCount: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
    commissionRate: {
        type: Number,
        default: null,
        min: 0,
        max: 1,
        validate: {
            validator: function (v) {
                return v === null || (v >= 0 && v <= 1);
            },
            message: 'Commission rate must be between 0 and 1',
        },
    },
    epc: { type: Number, default: 0, min: 0 },
    lastClickedAt: { type: Date, default: null },
    lastConvertedAt: { type: Date, default: null },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null, index: true },
    tags: { type: [String], default: [], index: true },
    campaign: { type: String, default: null, trim: true, maxlength: 50 },
    clicksByDevice: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 }
    },
    tier: {
        type: String,
        enum: ['standard', 'gold', 'platinum'],
        default: 'standard',
        index: true,
    },
    notes: { type: String, default: null, trim: true, maxlength: 250 },
    customDomain: {
        type: String,
        default: null,
        trim: true,
        maxLength: 100,
    },
    subIdPerformanceRef: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SubIdPerformance',
        default: null,
        sparse: true
    }
}, { timestamps: true });
affiliateLinkSchema.index({ createdAt: -1, totalConversions: -1 });
affiliateLinkSchema.index({
    affiliateCode: 1,
    plan: 1,
    billing: 1,
    subId: 1,
    status: 1,
}, {
    name: 'active_links_composite',
    partialFilterExpression: { status: { $ne: 'deleted' } },
});
affiliateLinkSchema.index({
    status: 1,
    createdAt: -1,
}, {
    name: 'status_created_desc',
    partialFilterExpression: { status: { $ne: 'deleted' } },
});
affiliateLinkSchema.index({
    affiliateId: 1,
    createdAt: -1,
}, {
    name: 'affiliate_created_desc',
});
affiliateLinkSchema.index({ generatedUrl: 1 }, {
    unique: true,
    name: 'unique_active_url',
    partialFilterExpression: { status: { $ne: 'deleted' } },
});
affiliateLinkSchema.index({ slug: 1 }, {
    unique: true,
    name: 'unique_active_slug',
    partialFilterExpression: { status: { $ne: 'deleted' } },
});
affiliateLinkSchema.index({ shortSlug: 1 }, {
    unique: true,
    name: 'unique_active_short_slug',
    partialFilterExpression: { status: { $ne: 'deleted' } },
});
affiliateLinkSchema.virtual('shortUrl').get(function () {
    const domain = this.customDomain || affiliate_utils_1.DEFAULT_DOMAIN;
    return `${domain}/click/${this.shortSlug}`;
});
// Virtual for conversion rate
// AffiliateLink Schema-এ virtual fields add করুন
affiliateLinkSchema.virtual('totalClicks').get(function () {
    return this.clickCount;
});
affiliateLinkSchema.virtual('totalConversions').get(function () {
    return this.conversionCount;
});
affiliateLinkSchema.virtual('totalRevenue').get(function () {
    return this.revenue;
});
affiliateLinkSchema.virtual('totalCommission').get(function () {
    return this.commission;
});
// affiliateLinkSchema.virtual('epc').get(function(this: IAffiliateLink) {
//   return this.clickCount > 0 ? this.revenue / this.clickCount : 0;
// });
// Virtual fields কে JSON response-এ include করতে
affiliateLinkSchema.set('toObject', { virtuals: true });
affiliateLinkSchema.set('toJSON', { virtuals: true });
exports.AffiliateLink = (0, mongoose_2.model)('AffiliateLink', affiliateLinkSchema);
const clickLogSchema = new mongoose_1.Schema({
    clickId: { type: String, required: true, unique: true, index: true },
    affiliateLinkId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AffiliateLink',
        required: true,
        index: true,
    },
    affiliateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    affiliateCode: { type: String, required: true, index: true },
    plan: { type: String, required: true },
    billing: { type: String, required: true },
    subId: { type: String },
    source: { type: String, default: 'affiliate_platform' },
    status: {
        type: String,
        enum: ['clicked', 'converted'],
        default: 'clicked',
    },
    ip: { type: String, required: true, index: true },
    geo: {
        country: { type: String },
        region: { type: String },
        city: { type: String },
        lat: { type: Number },
        lon: { type: Number },
        timezone: { type: String },
    },
    deviceFingerprint: { type: String, required: true, index: true },
    deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
        required: true,
    },
    browser: { type: String, maxlength: 50 },
    browserVersion: { type: String, maxlength: 20 },
    os: { type: String, maxlength: 50 },
    osVersion: { type: String, maxlength: 20 },
    referrer: { type: String },
    campaign: { type: String },
    clickedAt: { type: Date, default: Date.now, index: true },
    conversionId: { type: String },
}, { timestamps: true });
// TTL: automatically purge old clicks after 180 days
clickLogSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
// TTL Index (180 days expiration)
clickLogSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 15552000 });
// Duplicate detection optimization - MOST IMPORTANT
clickLogSchema.index({
    affiliateLinkId: 1,
    deviceFingerprint: 1,
    ip: 1,
    clickedAt: 1
});
// Affiliate performance analytics
clickLogSchema.index({ affiliateId: 1, clickedAt: -1 });
clickLogSchema.index({ affiliateLinkId: 1, clickedAt: -1 });
// Campaign performance analytics
clickLogSchema.index({ campaign: 1, clickedAt: -1 });
clickLogSchema.index({ affiliateId: 1, campaign: 1, clickedAt: -1 });
// Geo and device analytics
clickLogSchema.index({ "geo.country": 1, clickedAt: -1 });
clickLogSchema.index({ deviceType: 1, clickedAt: -1 });
// Conversion tracking
clickLogSchema.index({ conversionId: 1 }, { sparse: true });
clickLogSchema.index({ status: 1, clickedAt: -1 });
// SubId analytics (যদি frequently use করেন)
clickLogSchema.index({ subId: 1, clickedAt: -1 });
exports.ClickLog = mongoose_1.default.model('ClickLog', clickLogSchema);
