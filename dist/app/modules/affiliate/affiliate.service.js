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
exports.AffiliateService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const affiliate_model_1 = require("./affiliate.model");
const auth_model_1 = require("../auth/auth.model");
const affiliate_utils_1 = require("./affiliate.utils");
const uuid_1 = require("uuid");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const nanoid_1 = require("nanoid");
const generateAffiliateLink = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { affiliateCode, plan, billing, subId = null, createdBy, customDomain = null, expiresAt = null, source = 'affiliate_platform', } = payload;
    if (!affiliateCode || typeof affiliateCode !== 'string') {
        throw new apiErrors_1.default(400, 'Invalid affiliateCode');
    }
    // 1️⃣ Lookup affiliate user
    const affiliateUser = yield auth_model_1.User.findOne({
        'affiliateDetails.referralCode': affiliateCode,
        'affiliateProfile.approvalStatus': 'approved',
        accountStatus: 'active',
        role: 'affiliate',
    }).select('_id +affiliateDetails');
    if (!affiliateUser) {
        throw new apiErrors_1.default(404, `Affiliate with code '${affiliateCode}' not found or inactive`);
    }
    // 2️⃣ Check if active link already exists
    const existingLink = yield affiliate_model_1.AffiliateLink.findOne({
        affiliateCode,
        plan,
        billing,
        subId,
        status: { $ne: 'deleted' },
    });
    if (existingLink) {
        return {
            longLink: existingLink.generatedUrl,
            shortLink: `${customDomain !== null && customDomain !== void 0 ? customDomain : 'https://choiceidentity.com'}/click/${existingLink.shortSlug}`,
            affiliateLink: existingLink,
        };
    }
    // 3️⃣ Generate slugs
    const slug = yield (0, affiliate_utils_1.generateUniqueSlug)(affiliateCode, plan, billing);
    const shortSlug = (0, nanoid_1.nanoid)();
    // 4️⃣ Generate UUIDs
    const clickId = (0, uuid_1.v4)();
    const transactionId = (0, uuid_1.v4)();
    const ts = Math.floor(Date.now() / 1000);
    // 5️⃣ Construct long enterprise URL
    const BASE_DOMAIN = customDomain !== null && customDomain !== void 0 ? customDomain : 'http://localhost:3000';
    const longQuery = new URLSearchParams(Object.assign(Object.assign({ aff_id: affiliateCode, click_id: clickId }, (subId ? { sub_id: subId } : {})), { transaction_id: transactionId, campaign: `${plan}-${billing}`, source, ts: ts.toString() }));
    const generatedUrl = `${BASE_DOMAIN}/click/${slug}?${longQuery.toString()}`;
    // 6️⃣ Save link inside transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const duplicateLink = yield affiliate_model_1.AffiliateLink.findOne({
            $or: [
                { affiliateCode, plan, billing, subId, status: { $ne: 'deleted' } },
                { generatedUrl, status: { $ne: 'deleted' } },
                { shortSlug, status: { $ne: 'deleted' } },
            ],
        }).session(session);
        if (duplicateLink) {
            yield session.abortTransaction();
            session.endSession();
            return {
                longLink: duplicateLink.generatedUrl,
                shortLink: `${BASE_DOMAIN}/click/${duplicateLink.shortSlug}`,
                affiliateLink: duplicateLink,
            };
        }
        const newLink = new affiliate_model_1.AffiliateLink({
            affiliateId: affiliateUser._id,
            affiliateCode,
            plan,
            billing,
            subId,
            slug,
            shortSlug,
            generatedUrl,
            clickId,
            transactionId,
            status: 'active',
            clickCount: 0,
            conversionCount: 0,
            createdBy,
            modifiedBy: createdBy,
            expiresAt,
            customDomain,
        });
        yield newLink.save({ session });
        yield session.commitTransaction();
        session.endSession();
        const longLink = newLink.generatedUrl;
        const shortLink = `${BASE_DOMAIN}/click/${newLink.shortSlug}`;
        return { longLink, shortLink, affiliateLink: newLink };
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw err;
    }
});
const getAllAffiliateLinks = (affiliateCode) => __awaiter(void 0, void 0, void 0, function* () {
    if (!affiliateCode)
        throw new Error('affiliateCode required');
    const links = yield affiliate_model_1.AffiliateLink.find({
        affiliateCode: { $regex: `^${affiliateCode}$`, $options: 'i' },
        status: 'active',
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
        ],
    }).sort({ createdAt: -1 });
    return links;
});
const affiliateClick = (slug, ip, userAgent, geoData, deviceFingerprint) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Exact match on slug (no regex)
        const affiliateLink = yield affiliate_model_1.AffiliateLink.findOne({
            slug,
            status: 'active',
        }).session(session);
        if (!affiliateLink)
            throw new Error('Affiliate link not found or inactive');
        yield affiliate_model_1.ClickLog.create([
            {
                affiliateLinkId: affiliateLink._id,
                affiliateId: affiliateLink.affiliateId,
                ip,
                userAgent,
                geoLocation: geoData,
                deviceFingerprint,
                clickedAt: new Date(),
            },
        ], { session });
        affiliateLink.clickCount += 1;
        affiliateLink.lastClickedAt = new Date();
        yield affiliateLink.save({ session });
        yield session.commitTransaction();
        const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000/register';
        const params = new URLSearchParams({
            affiliate: affiliateLink.affiliateCode,
            plan: affiliateLink.plan,
            billing: affiliateLink.billing,
        });
        return `${baseUrl}?${params.toString()}`;
    }
    catch (err) {
        yield session.abortTransaction();
        console.error('Affiliate click error:', err);
        return process.env.FRONTEND_BASE_URL || 'http://localhost:3000/register';
    }
    finally {
        session.endSession();
    }
});
exports.AffiliateService = {
    getAllAffiliateLinks,
    generateAffiliateLink,
    affiliateClick,
};
