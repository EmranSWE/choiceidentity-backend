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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateConversion = exports.ClickLog = exports.AffiliateLink = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const affiliateLinkSchema = new mongoose_1.Schema({
    affiliateId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    affiliateCode: { type: String, required: true, trim: true, index: true },
    plan: { type: String, enum: ['basic', 'plus', 'elite'], required: true },
    billing: { type: String, enum: ['monthly', 'yearly'], required: true },
    subId: { type: String, default: null, trim: true, maxlength: 50 },
    generatedUrl: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    shortSlug: { type: String, unique: true, trim: true, lowercase: true, index: true },
    transactionId: { type: String, required: true, unique: true, index: true, trim: true },
    clickId: { type: String, required: true, unique: true, index: true, trim: true },
    status: { type: String, enum: ['active', 'paused', 'deleted'], default: 'active', index: true },
    clickCount: { type: Number, default: 0, min: 0 },
    conversionCount: { type: Number, default: 0, min: 0 },
    lastClickedAt: { type: Date, default: null },
    lastConvertedAt: { type: Date, default: null },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null, index: true },
    customDomain: {
        type: String,
        default: null,
        trim: true,
        validate: {
            validator: (v) => {
                if (!v)
                    return true;
                return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(v);
            },
            message: (props) => `${props.value} is not a valid domain name!`,
        },
    },
}, { timestamps: true });
// ✅ Partial unique index for active links
affiliateLinkSchema.index({ generatedUrl: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'deleted' } } });
// ✅ Pre-validate hook (modern async, no next)
affiliateLinkSchema.pre('validate', function () {
    return __awaiter(this, void 0, void 0, function* () {
        // Auto-generate UUIDs if missing
        if (!this.transactionId)
            this.transactionId = (0, uuid_1.v4)();
        if (!this.clickId)
            this.clickId = (0, uuid_1.v4)();
        // Only check uniqueness if generatedUrl was modified
        if (this.isModified('generatedUrl')) {
            const AffiliateLinkModel = this.constructor;
            const existing = yield AffiliateLinkModel.findOne({
                generatedUrl: this.generatedUrl,
                _id: { $ne: this._id },
                status: { $ne: 'deleted' },
            });
            if (existing) {
                throw new Error('generatedUrl must be unique among active links');
            }
        }
    });
});
exports.AffiliateLink = mongoose_1.default.model('AffiliateLink', affiliateLinkSchema);
// Click Log Schema
const clickLogSchema = new mongoose_1.Schema({
    affiliateLinkId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AffiliateLink', required: true, index: true },
    affiliateId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
    ip: { type: String, required: true, index: true },
    userAgent: { type: String, required: false, maxlength: 512 },
    clickedAt: { type: Date, default: Date.now, index: true },
    geoLocation: {
        country: { type: String },
        region: { type: String },
        city: { type: String },
    },
    deviceFingerprint: { type: String, index: true },
}, { timestamps: true });
clickLogSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
exports.ClickLog = mongoose_1.default.model('ClickLog', clickLogSchema);
// Affiliate Conversion Schema
const affiliateConversionSchema = new mongoose_1.Schema({
    affiliateLinkId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AffiliateLink', required: true, index: true },
    affiliateId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Click → Conversion mapping
    clickLogId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ClickLog', required: false, index: true },
    ip: { type: String, required: true, index: true },
    userAgent: { type: String, maxlength: 512 },
    deviceFingerprint: { type: String, index: true },
    // Customer / order details
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, index: true },
    plan: { type: String, enum: ['basic', 'plus', 'elite'], required: true },
    billing: { type: String, enum: ['monthly', 'yearly'], required: true },
    revenue: { type: Number, required: true, min: 0 },
    // Commission info
    commissionAmount: { type: Number, required: true, min: 0 },
    commissionStatus: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending', index: true },
    // Fraud / validation
    fraudFlag: { type: Boolean, default: false, index: true },
    fraudReason: { type: String, default: null },
    convertedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
// Indexing for fast reporting
affiliateConversionSchema.index({ affiliateId: 1, convertedAt: -1 });
affiliateConversionSchema.index({ commissionStatus: 1 });
affiliateConversionSchema.index({ fraudFlag: 1 });
affiliateConversionSchema.index({ customerId: 1, affiliateLinkId: 1 }, { unique: true });
exports.AffiliateConversion = mongoose_1.default.model('AffiliateConversion', affiliateConversionSchema);
