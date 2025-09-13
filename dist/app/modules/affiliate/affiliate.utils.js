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
exports.updateConversionStats = exports.validateClickId = exports.findAffiliateLinkByClickId = exports.updateClickStats = exports.generateTrackingCode = exports.generateReferralCode = exports.DEFAULT_DOMAIN = void 0;
exports.generateUniqueSlug = generateUniqueSlug;
exports.generateFingerprint = generateFingerprint;
exports.normalizeSubId = normalizeSubId;
exports.buildRedirectUrl = buildRedirectUrl;
exports.parseUserAgent = parseUserAgent;
const nanoid_1 = require("nanoid");
const crypto_1 = __importDefault(require("crypto"));
const affiliate_model_1 = require("./affiliate.model");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const http_status_1 = __importDefault(require("http-status"));
const ua_parser_js_1 = require("ua-parser-js");
exports.DEFAULT_DOMAIN = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://choiceidentity.com';
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
            const exists = yield affiliate_model_1.AffiliateLink.exists({
                slug,
                status: { $ne: 'deleted' },
            });
            if (!exists)
                return slug;
        }
        throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to generate unique slug');
    });
}
function generateFingerprint(ip, userAgent) {
    const data = `${ip}|${userAgent}`;
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
function normalizeSubId(input) {
    return input
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '');
}
// Build redirect URL with params
function buildRedirectUrl(affiliateLink, clickId) {
    const url = new URL("https://www.choiceidentity.com/register");
    //   const url = new URL('http://localhost:3000/register'); // For local testing
    url.searchParams.set('ref', affiliateLink.affiliateCode);
    url.searchParams.set('plan', affiliateLink.plan);
    url.searchParams.set('billing', affiliateLink.billing);
    if (affiliateLink.subId)
        url.searchParams.set('sub_id', affiliateLink.subId);
    url.searchParams.set('click_id', clickId);
    return url.toString();
}
function parseUserAgent(ua) {
    var _a;
    const parser = new ua_parser_js_1.UAParser(ua);
    const result = parser.getResult();
    return {
        deviceType: result.device.type || 'desktop',
        browser: result.browser.name || 'unknown',
        browserVersion: ((_a = result.browser.version) === null || _a === void 0 ? void 0 : _a.split('.')[0]) || 'unknown',
        os: result.os.name || 'unknown',
        osVersion: result.os.version || 'unknown',
    };
}
const updateClickStats = (affiliateLinkId, subId, session, deviceInfo, affiliateLink) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let linkDoc = affiliateLink;
        // If link document not provided, fetch it
        if (!linkDoc) {
            const foundLink = yield affiliate_model_1.AffiliateLink.findById(affiliateLinkId).session(session);
            if (!foundLink) {
                console.error('Affiliate link not found for stats update:', affiliateLinkId);
                return;
            }
            linkDoc = foundLink;
        }
        // Prepare update operations for the root affiliate link
        const updateOperations = {
            $inc: {
                clickCount: 1,
            },
            $set: {
                lastClickedAt: new Date(),
            },
        };
        // Add device breakdown if device info available
        if (deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.deviceType) {
            updateOperations.$inc[`clicksByDevice.${deviceInfo.deviceType}`] = 1;
        }
        // Update subId if provided and not already set
        if (subId && !linkDoc.subId) {
            updateOperations.$set.subId = subId;
        }
        // Always update the root affiliate link
        yield affiliate_model_1.AffiliateLink.findByIdAndUpdate(affiliateLinkId, updateOperations, {
            session,
        });
        console.log(`Root link stats updated for: ${affiliateLinkId}`);
        // If using multi-subId tracking (subIdPerformanceRef exists)
        if (linkDoc.subIdPerformanceRef) {
            yield updateSubIdPerformance(affiliateLinkId, subId || linkDoc.subId || 'default', session, deviceInfo, linkDoc);
        }
    }
    catch (error) {
        console.error('Error updating click stats:', error);
        // Continue without throwing to maintain main transaction
    }
});
exports.updateClickStats = updateClickStats;
const updateSubIdPerformance = (affiliateLinkId, subId, session, deviceInfo, affiliateLink) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let linkDoc = affiliateLink;
        if (!linkDoc) {
            const foundLink = yield affiliate_model_1.AffiliateLink.findById(affiliateLinkId)
                .select('affiliateId campaign')
                .session(session);
            if (!foundLink) {
                throw new Error('Affiliate link not found');
            }
            linkDoc = foundLink;
        }
        const updateOps = {
            $inc: {
                clicks: 1,
            },
            $set: {
                lastClickAt: new Date(),
            },
            $setOnInsert: {
                affiliateLinkId: affiliateLinkId,
                affiliateId: linkDoc.affiliateId,
                campaign: linkDoc.campaign || 'default',
                firstClickAt: new Date(),
                status: 'active',
                // ✅ Initialize with zeros, not with incremented values
                conversions: 0,
                revenue: 0,
                commission: 0,
                epc: 0,
            },
        };
        // Add device breakdown if device info available
        if (deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.deviceType) {
            updateOps.$inc[`deviceBreakdown.${deviceInfo.deviceType}`] = 1;
            updateOps.$setOnInsert.deviceBreakdown = {
                desktop: deviceInfo.deviceType === 'desktop' ? 1 : 0,
                mobile: deviceInfo.deviceType === 'mobile' ? 1 : 0,
                tablet: deviceInfo.deviceType === 'tablet' ? 1 : 0,
            };
        }
        // Add geo data if available
        if (deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.geo) {
            updateOps.$setOnInsert.geoData = {
                country: deviceInfo.geo.country || '',
                region: deviceInfo.geo.region || '',
                city: deviceInfo.geo.city || '',
            };
        }
        const subIdPerf = yield affiliate_model_1.SubIdPerformance.findOneAndUpdate({
            affiliateLinkId: affiliateLinkId,
            subId: subId,
        }, updateOps, {
            upsert: true,
            session,
            new: true,
        });
        console.log(`SubId performance updated - Clicks: ${subIdPerf === null || subIdPerf === void 0 ? void 0 : subIdPerf.clicks}`);
        return subIdPerf;
    }
    catch (error) {
        console.error('Error updating subId performance:', error);
        return null;
    }
});
const findAffiliateLinkByClickId = (clickId, session) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clickLog = yield affiliate_model_1.ClickLog.findOne({ clickId }).session(session);
        return clickLog
            ? yield affiliate_model_1.AffiliateLink.findById(clickLog.affiliateLinkId).session(session)
            : null;
    }
    catch (error) {
        console.error('Error finding affiliate link by clickId:', error);
        return null;
    }
});
exports.findAffiliateLinkByClickId = findAffiliateLinkByClickId;
const validateClickId = (clickId, session) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clickLog = yield affiliate_model_1.ClickLog.findOne({ clickId }).session(session);
        console.log('Validating clickId:', clickId, 'Found clickLog:', clickLog);
        return !!clickLog;
    }
    catch (error) {
        console.error('Error validating clickId:', error);
        return false;
    }
});
exports.validateClickId = validateClickId;
const updateConversionStats = (affiliateLinkId, subId, revenueGenerated, commissionAmount, session) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Updating conversion stats for link: ${affiliateLinkId}, subId: ${subId}`);
        // 1️⃣ Fetch the affiliate link document
        const affiliateLink = yield affiliate_model_1.AffiliateLink.findOne({
            _id: affiliateLinkId,
        }).session(session);
        if (!affiliateLink) {
            console.warn('AffiliateLink not found for conversion update');
            return;
        }
        // 2️⃣ Update MAIN affiliate link stats
        affiliateLink.conversionCount += 1;
        affiliateLink.revenue += revenueGenerated;
        affiliateLink.commission += commissionAmount;
        // Calculate EPC (Earnings Per Click)
        if (affiliateLink.clickCount > 0) {
            affiliateLink.epc = affiliateLink.commission / affiliateLink.clickCount;
        }
        affiliateLink.lastConvertedAt = new Date();
        // 3️⃣ Update AFFILIATE PROFILE stats (if needed)
        // await AffiliateProfile.findOneAndUpdate(
        //   { _id: affiliateLink.affiliateId },
        //   {
        //     $inc: {
        //       totalConversions: 1,
        //       totalRevenue: revenueGenerated,
        //       totalCommission: commissionAmount
        //     },
        //     $set: { lastConversionAt: new Date() }
        //   },
        //   { session }
        // );
        console.log(`Updating conversion stats for link: ${affiliateLink}`);
        // 4️⃣ Update SUB-ID PERFORMANCE if multi-subId tracking is enabled
        if (affiliateLink.subIdPerformanceRef) {
            yield affiliate_model_1.SubIdPerformance.findOneAndUpdate({
                affiliateLinkId: affiliateLinkId,
                subId: subId || affiliateLink.subId || 'default',
            }, {
                $inc: {
                    conversions: 1,
                    revenue: revenueGenerated,
                    commission: commissionAmount,
                },
                $set: {
                    lastConversionAt: new Date(),
                    // Recalculate EPC for this subId
                    epc: yield calculateSubIdEPC(affiliateLinkId, subId, session),
                },
            }, { session });
        }
        // 5️⃣ Save the updated affiliate link
        yield affiliateLink.save({ session });
        console.log('After update', affiliateLink);
        console.log('✅ Conversion stats updated successfully');
    }
    catch (err) {
        console.error('Error updating conversion stats:', err);
        throw err;
    }
});
exports.updateConversionStats = updateConversionStats;
// Helper function to calculate EPC for subId
const calculateSubIdEPC = (affiliateLinkId, subId, session) => __awaiter(void 0, void 0, void 0, function* () {
    const subIdPerf = yield affiliate_model_1.SubIdPerformance.findOne({
        affiliateLinkId,
        subId,
    }).session(session);
    if (!subIdPerf || subIdPerf.clicks === 0)
        return 0;
    return subIdPerf.commission / subIdPerf.clicks;
});
