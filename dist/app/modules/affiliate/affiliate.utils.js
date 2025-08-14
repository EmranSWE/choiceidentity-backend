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
exports.generateTrackingCode = exports.generateReferralCode = void 0;
exports.generateUniqueSlug = generateUniqueSlug;
exports.generateFingerprint = generateFingerprint;
const nanoid_1 = require("nanoid");
const crypto_1 = __importDefault(require("crypto"));
const affiliate_model_1 = require("./affiliate.model");
const nano = (0, nanoid_1.customAlphabet)('abcdefghijklmnopqrstuvwxyz0123456789', 8);
const generateReferralCode = () => nano();
exports.generateReferralCode = generateReferralCode;
const generateTrackingCode = () => nano();
exports.generateTrackingCode = generateTrackingCode;
const MAX_RETRIES = 10;
function generateUniqueSlug(affiliateCode, plan, billing) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < MAX_RETRIES; i++) {
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const slug = `${affiliateCode}-${plan}-${billing}-${randomSuffix}`.toLowerCase();
            // Strict exact match on slug suffix in URL (avoid regex if possible)
            const exists = yield affiliate_model_1.AffiliateLink.findOne({
                generatedUrl: { $regex: new RegExp(`/${slug}$`, 'i') }, // ends with slug
                status: { $ne: 'deleted' },
            });
            if (!exists)
                return slug;
        }
        throw new Error('Failed to generate unique slug after multiple attempts');
    });
}
function generateFingerprint(ip, userAgent) {
    const data = `${ip}|${userAgent}`;
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
