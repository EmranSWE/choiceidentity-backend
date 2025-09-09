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
exports.AffiliateService = exports.getAffiliateLinksTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const affiliate_model_1 = require("./affiliate.model");
const auth_model_1 = require("../auth/auth.model");
const affiliate_utils_1 = require("./affiliate.utils");
const uuid_1 = require("uuid");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const nanoid_1 = require("nanoid");
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const http_status_1 = __importDefault(require("http-status"));
// const generateAffiliateLink = async (
//   payload: GenerateAffiliateLinkPayload
// ): Promise<IAffiliateLink> => {
//   const {
//     affiliateCode,
//     plan,
//     billing,
//     subId = null,
//     createdBy,
//     customDomain = null,
//     expiresAt = null,
//   } = payload;
//   if (!affiliateCode || typeof affiliateCode !== 'string') {
//     throw new Error('Invalid affiliateCode');
//   }
//   // 1. Lookup affiliate user by affiliateCode (assuming referralCode field in User)
//   const affiliateUser = await User.findOne({
//     'affiliateDetails.referralCode': affiliateCode,
//     'affiliateProfile.approvalStatus': 'approved',
//     accountStatus: 'active',
//     role: 'affiliate',
//   }).select('_id +affiliateDetails');
//   if (!affiliateUser) {
//     throw new Error(
//       `Affiliate with code '${affiliateCode}' not found or inactive`
//     );
//   }
//   // 2. Check if active link already exists for this affiliate + plan + billing + subId
//   const existingLink = await AffiliateLink.findOne({
//     affiliateCode,
//     plan,
//     billing,
//     subId,
//     status: { $ne: 'deleted' },
//   });
//   if (existingLink) return existingLink;
//   // 3. Generate a unique slug with retry
//   const slug = await generateUniqueSlug(affiliateCode, plan, billing);
//   // 4. Compose generated URL using customDomain if provided, else fallback domain
//   // const baseDomain = customDomain ?? 'https://your-affiliate-domain.com';
//   // const generatedUrl = `${baseDomain}/ref/${slug}`;
//   // const generatedUrl = `${baseDomain}/ref/${slug}`;
//   const generatedUrl = `http://localhost:3000/click/${slug}${
//     subId ? `?subId=${encodeURIComponent(subId)}` : ''
//   }`;
//   // 5. Create new affiliate link document in a session to avoid race condition
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     // Double-check no duplicate link with same params or URL exists in transaction
//     const duplicateLink = await AffiliateLink.findOne({
//       $or: [
//         { affiliateCode, plan, billing, subId, status: { $ne: 'deleted' } },
//         { generatedUrl, status: { $ne: 'deleted' } },
//       ],
//     }).session(session);
//     if (duplicateLink) {
//       await session.abortTransaction();
//       session.endSession();
//       return duplicateLink;
//     }
//     const newLink = new AffiliateLink({
//       affiliateId: affiliateUser._id,
//       affiliateCode,
//       plan,
//       billing,
//       subId,
//       slug,
//       generatedUrl,
//       status: 'active',
//       clickCount: 0,
//       conversionCount: 0,
//       createdBy,
//       modifiedBy: createdBy,
//       expiresAt,
//       customDomain,
//     });
//     await newLink.save({ session });
//     await session.commitTransaction();
//     session.endSession();
//     return newLink;
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     throw err;
//   }
// };
const generateAffiliateLink = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { affiliateCode, plan, billing, subId = null, createdBy, customDomain, expiresAt = null, source = 'affiliate_platform', } = payload;
    console.log('Generate Link Payload:', payload);
    //   const normalizedSubId = subId ? normalizeSubId(subId) : null;
    if (!affiliateCode || typeof affiliateCode !== 'string') {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid affiliateCode');
    }
    if (!plan || !billing) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'plan and billing are required');
    }
    // 1️⃣ Lookup affiliate user
    const affiliateUser = yield auth_model_1.User.findOne({
        'affiliateProfile.referralCode': affiliateCode,
        'affiliateProfile.approvalStatus': 'approved',
        accountStatus: 'active',
        role: 'affiliate',
    }, { _id: 1, affiliateProfile: 1 }).lean();
    if (!(affiliateUser === null || affiliateUser === void 0 ? void 0 : affiliateUser._id)) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, `Affiliate with code '${affiliateCode}' not found or inactive`);
    }
    // 2️⃣ Check if active link already exists
    const existingLink = yield affiliate_model_1.AffiliateLink.findOne({
        affiliateCode,
        plan,
        billing,
        subId,
        status: { $ne: 'deleted' },
    }, { generatedUrl: 1, shortSlug: 1, slug: 1, plan: 1, billing: 1 }).lean();
    if (existingLink) {
        const baseDomain = customDomain || affiliate_utils_1.DEFAULT_DOMAIN;
        return {
            longLink: existingLink.generatedUrl,
            shortLink: `${baseDomain}/click/${existingLink.shortSlug}`,
            affiliateLink: existingLink,
        };
    }
    // 3️⃣ Generate slugs
    const slug = yield (0, affiliate_utils_1.generateUniqueSlug)(affiliateCode, plan, billing);
    const shortSlug = (0, nanoid_1.nanoid)();
    const clickId = (0, uuid_1.v4)();
    const transactionId = (0, uuid_1.v4)();
    const ts = Math.floor(Date.now() / 1000);
    // 5️⃣ Construct long enterprise URL
    const baseDomain = customDomain || affiliate_utils_1.DEFAULT_DOMAIN;
    const queryParams = new URLSearchParams(Object.assign(Object.assign({ aff_id: affiliateCode, click_id: clickId }, (subId ? { sub_id: subId } : {})), { transaction_id: transactionId, campaign: `${plan}-${billing}`, source, ts: ts.toString() }));
    const generatedUrl = `${baseDomain}/click/${slug}?${queryParams.toString()}`;
    // 6️⃣ Save link inside transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const duplicateLink = yield affiliate_model_1.AffiliateLink.findOne({
            $or: [
                { affiliateCode, plan, billing, subId, status: { $ne: 'deleted' } },
                { slug, status: { $ne: 'deleted' } },
                { shortSlug, status: { $ne: 'deleted' } },
            ],
        }, { generatedUrl: 1, shortSlug: 1 })
            .session(session)
            .lean();
        if (duplicateLink) {
            yield session.abortTransaction();
            session.endSession();
            return {
                longLink: duplicateLink.generatedUrl,
                shortLink: `${baseDomain}/click/${duplicateLink.shortSlug}`,
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
            createdBy: affiliateUser._id,
            modifiedBy: createdBy,
            expiresAt,
            customDomain,
        });
        console.log('Create New', newLink);
        yield newLink.save({ session });
        yield session.commitTransaction();
        session.endSession();
        const longLink = newLink.generatedUrl;
        const shortLink = `${baseDomain}/click/${newLink.shortSlug}`;
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
const affiliateClick = (slug, ip, userAgent, geo, deviceFingerprint, referrer) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('%cAnalytics Debug:', 'color: red; font-weight: bold;', {
        '🔗 Slug': slug,
        '🌐 IP': ip,
        '🖥️ User Agent': userAgent,
        '🗺️ Geo': geo,
        '📱 Device Fingerprint': deviceFingerprint,
        '↩️ Referrer': referrer,
    });
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const affiliateLink = yield affiliate_model_1.AffiliateLink.findOne({
            $or: [{ slug }, { shortSlug: slug }],
            status: 'active',
        }).session(session);
        console.log('%cAnalytics affiliateLink Debug:', 'color: yellow; font-weight: bold;', {
            '🔗 affiliateLink': affiliateLink,
        });
        if (!affiliateLink)
            throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, `Affiliate Link not found or inactive`);
        const recentClick = yield affiliate_model_1.ClickLog.findOne({
            affiliateLinkId: affiliateLink._id,
            deviceFingerprint,
            ip,
            clickedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }).session(session);
        console.log("%c🔗 recentClick Debug:", "color: #facc15; font-weight: bold; background: #1f2937; padding: 2px 6px; border-radius: 4px;", {
            linkId: recentClick === null || recentClick === void 0 ? void 0 : recentClick.affiliateLinkId,
            clickId: recentClick === null || recentClick === void 0 ? void 0 : recentClick.clickId,
            ip: recentClick === null || recentClick === void 0 ? void 0 : recentClick.ip,
            device: recentClick === null || recentClick === void 0 ? void 0 : recentClick.deviceType,
        });
        if (recentClick) {
            yield session.commitTransaction();
            return (0, affiliate_utils_1.buildRedirectUrl)(affiliateLink, recentClick.clickId);
        }
        // ✅ Generate new clickId
        const clickId = (0, uuid_1.v4)();
        console.log("%c🔗 clickId Debug:", "color: #10b981; font-weight: bold;", { clickId });
        // ✅ Atomically update click count
        yield affiliate_model_1.AffiliateLink.updateOne({ _id: affiliateLink._id }, {
            $inc: { clickCount: 1 },
            $set: { lastClickedAt: new Date() },
        }, { session });
        // ✅ Log click (raw event log, append-only)
        const deviceInfo = (0, affiliate_utils_1.parseUserAgent)(userAgent);
        console.log("%c🔗 deviceInfo Debug:", "color: #3b82f6; font-weight: bold;", { deviceInfo });
        const clickLoger = yield affiliate_model_1.ClickLog.create([
            {
                clickId,
                affiliateLinkId: affiliateLink._id,
                affiliateId: affiliateLink.affiliateId,
                affiliateCode: affiliateLink.affiliateCode,
                plan: affiliateLink.plan,
                billing: affiliateLink.billing,
                subId: affiliateLink.subId,
                source: "affiliate_platform",
                status: "clicked",
                ip,
                geo,
                deviceFingerprint,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                browserVersion: deviceInfo.browserVersion,
                os: deviceInfo.os,
                osVersion: deviceInfo.osVersion,
                referrer,
                campaign: affiliateLink.campaign || `${affiliateLink.plan}-${affiliateLink.billing}`,
                clickedAt: new Date(),
            }
        ], { session });
        console.log("Click Log Created:", clickLoger);
        yield session.commitTransaction();
        // ✅ Build redirect URL
        return (0, affiliate_utils_1.buildRedirectUrl)(affiliateLink, clickId);
    }
    catch (err) {
        yield session.abortTransaction();
        console.error('Affiliate click error:', err);
        return 'https://www.choiceidentity.com/register';
    }
    finally {
        session.endSession();
    }
});
const getOverview = (affiliateId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Use aggregation to compute global KPIs in DB for speed
    const kpiAggregation = yield affiliate_model_1.AffiliateLink.aggregate([
        {
            $match: {
                affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId),
                status: 'active',
            },
        },
        {
            $group: {
                _id: null,
                totalClicks: { $sum: '$clickCount' },
                totalConversions: { $sum: '$conversionCount' },
                totalRevenue: { $sum: '$revenue' },
                totalCommission: { $sum: '$commission' },
            },
        },
    ]);
    const kpis = kpiAggregation[0] || {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommission: 0,
    };
    const EPC = kpis.totalClicks ? kpis.totalRevenue / kpis.totalClicks : 0;
    const CR = kpis.totalClicks
        ? (kpis.totalConversions / kpis.totalClicks) * 100
        : 0;
    // Fetch top performing links (sorted by earnings) - lean for speed
    const links = yield affiliate_model_1.AffiliateLink.find({ affiliateId, status: 'active' })
        .sort({ commission: -1 })
        .limit(5)
        .lean();
    const topPerformingLinks = links.map(l => ({
        url: l.generatedUrl,
        clicks: l.clickCount || 0,
        conversions: l.conversionCount || 0,
        rate: l.clickCount ? ((l.conversionCount || 0) / l.clickCount) * 100 : 0,
        earnings: l.commission || 0,
    }));
    // Recent activity - last 10 conversions
    const recentConversions = yield affiliate_model_1.AffiliateConversion.find({ affiliateId })
        .sort({ convertedAt: -1 })
        .limit(10)
        .lean();
    const recentActivity = recentConversions.map(c => ({
        id: c._id,
        type: 'conversion',
        title: 'New Conversion',
        description: `${c.customerId} upgraded to ${c.plan} Plan - $${c.commissionAmount} earned`,
        time: c.convertedAt,
        amount: c.commissionAmount,
        severity: 'success',
    }));
    // Device & geo aggregation using MongoDB pipeline
    const deviceAndGeo = yield affiliate_model_1.AffiliateLink.aggregate([
        {
            $match: {
                affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId),
                status: 'active',
            },
        },
        {
            $project: {
                devices: {
                    $ifNull: ['$clicksByDevice', { desktop: 0, mobile: 0, tablet: 0 }],
                },
                geo: { $ifNull: ['$geoClicks', {}] },
            },
        },
        {
            $group: {
                _id: null,
                devices: { $mergeObjects: '$devices' },
                geo: { $mergeObjects: '$geo' },
            },
        },
    ]);
    const devices = ((_a = deviceAndGeo[0]) === null || _a === void 0 ? void 0 : _a.devices) || {
        desktop: 0,
        mobile: 0,
        tablet: 0,
    };
    const geo = ((_b = deviceAndGeo[0]) === null || _b === void 0 ? void 0 : _b.geo) || {};
    // Active referrals & pending payouts
    const conversionsAll = yield affiliate_model_1.AffiliateConversion.find({ affiliateId }).lean();
    const activeReferrals = conversionsAll.filter(c => !c.fraudFlag).length;
    const pendingPayouts = conversionsAll
        .filter(c => c.commissionStatus === 'pending')
        .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    // Final structured response
    return {
        affiliateMetrics: {
            totalEarnings: kpis.totalRevenue,
            monthlyEarnings: 0, // can calculate from date if needed
            conversionRate: Number(CR.toFixed(2)),
            totalClicks: kpis.totalClicks,
            totalReferrals: conversionsAll.length,
            activeReferrals,
            commissionRate: 25, // static or dynamic
            pendingPayouts,
            lastPayment: '', // fetch latest payout record
            affiliateRank: 'Diamond Partner', // dynamic if needed
            joinDate: (_c = links[0]) === null || _c === void 0 ? void 0 : _c.createdAt,
            EPC,
        },
        recentActivity,
        topPerformingLinks,
        devices,
        geo,
    };
});
const getAffiliateLinksTable = (affiliateId, paginationOptions, filters) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('PaginationmOptions', paginationOptions);
    console.log('filters', filters);
    const { skip, limit, sortBy, sortOrder } = (0, paginationHelpers_1.calculatePagination)(paginationOptions);
    // Build match stage
    const match = { affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId) };
    // --- Text search ---
    if (filters.searchTerm) {
        const regex = { $regex: filters.searchTerm, $options: 'i' };
        match.$or = [
            { subId: regex },
            { generatedUrl: regex },
            { campaign: regex },
        ];
    }
    // --- Multi-plan filter ---
    if (filters.plan) {
        if (Array.isArray(filters.plan)) {
            match.plan = { $in: filters.plan };
        }
        else {
            match.plan = filters.plan;
        }
    }
    // --- Billing filter ---
    if (filters.billing)
        match.billing = filters.billing;
    // --- Multi-date ranges filter ---
    if (filters.dateRanges && filters.dateRanges.length) {
        match.$or = filters.dateRanges.map(range => ({
            createdAt: {
                $gte: new Date(range.from),
                $lte: new Date(range.to),
            },
        }));
    }
    else if (filters.startDate || filters.endDate) {
        match.createdAt = {};
        if (filters.startDate)
            match.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate)
            match.createdAt.$lte = new Date(filters.endDate);
    }
    // Aggregation pipeline
    const pipeline = [
        { $match: match },
        // Lookup conversions per link
        {
            $lookup: {
                from: 'affiliateconversions',
                localField: '_id',
                foreignField: 'affiliateLinkId',
                as: 'conversions',
            },
        },
        // Add calculated fields
        {
            $addFields: {
                clicks: { $ifNull: ['$clickCount', 0] },
                leads: { $size: '$conversions' },
                revenue: { $sum: '$conversions.revenue' },
                commission: { $sum: '$conversions.commissionAmount' },
            },
        },
        {
            $addFields: {
                cr: {
                    $cond: [
                        { $eq: ['$clicks', 0] },
                        0,
                        { $multiply: [{ $divide: ['$leads', '$clicks'] }, 100] },
                    ],
                },
                epc: {
                    $cond: [
                        { $eq: ['$clicks', 0] },
                        0,
                        { $divide: ['$revenue', '$clicks'] },
                    ],
                },
            },
        },
        // Filter by performance thresholds
        {
            $match: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.minClicks !== undefined
                ? { clicks: { $gte: filters.minClicks } }
                : {})), (filters.maxClicks !== undefined
                ? { clicks: { $lte: filters.maxClicks } }
                : {})), (filters.minRevenue !== undefined
                ? { revenue: { $gte: filters.minRevenue } }
                : {})), (filters.maxRevenue !== undefined
                ? { revenue: { $lte: filters.maxRevenue } }
                : {})), (filters.minEarning !== undefined
                ? { commission: { $gte: filters.minEarning } }
                : {})), (filters.maxEarning !== undefined
                ? { commission: { $lte: filters.maxEarning } }
                : {})),
        },
        // Sort dynamically
        {
            $sort: {
                [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
            },
        },
        // Pagination (skip & limit only if not exporting)
        ...(paginationOptions.export ? [] : [{ $skip: skip }, { $limit: limit }]),
        // Project only needed fields
        {
            $project: {
                _id: 1,
                subId: 1,
                plan: 1,
                billing: 1,
                campaign: 1,
                clicks: 1,
                leads: 1,
                cr: 1,
                revenue: 1,
                commission: 1,
                epc: 1,
                createdAt: 1,
                status: 1,
                generatedUrl: 1,
                tags: 1,
                lastClickedAt: 1,
                lastConvertedAt: 1,
                clicksByDevice: 1,
            },
        },
    ];
    const data = yield affiliate_model_1.AffiliateLink.aggregate(pipeline);
    // Total count for pagination (only when not exporting)
    const total = paginationOptions.export
        ? data.length
        : yield affiliate_model_1.AffiliateLink.countDocuments(match);
    return {
        data,
        meta: {
            page: paginationOptions.page || 1,
            limit,
            total,
        },
    };
});
exports.getAffiliateLinksTable = getAffiliateLinksTable;
exports.AffiliateService = {
    getAllAffiliateLinks,
    generateAffiliateLink,
    affiliateClick,
    getOverview,
    getAffiliateLinksTable: exports.getAffiliateLinksTable,
};
