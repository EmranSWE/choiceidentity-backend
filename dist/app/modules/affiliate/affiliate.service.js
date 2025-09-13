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
/* eslint-disable @typescript-eslint/ban-ts-comment */
const mongoose_1 = __importDefault(require("mongoose"));
const affiliate_model_1 = require("./affiliate.model");
const auth_model_1 = require("../auth/auth.model");
const affiliate_utils_1 = require("./affiliate.utils");
const uuid_1 = require("uuid");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const nanoid_1 = require("nanoid");
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const http_status_1 = __importDefault(require("http-status"));
// ============ Affiliate Link generate ============
const generateAffiliateLink = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { affiliateCode, plan, billing, subId = null, createdBy, customDomain, expiresAt = null, source = 'affiliate_platform', commissionRate, } = payload;
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
                shortLink: (_a = duplicateLink.shortUrl) !== null && _a !== void 0 ? _a : '',
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
            clickId,
            generatedUrl,
            transactionId,
            status: 'active',
            clickCount: 0,
            commissionRate,
            revenue: 0,
            commission: 0,
            EPC: 0,
            conversionCount: 0,
            subIdPerformance: [
                {
                    subId: subId || 'default',
                    clicks: 0,
                    conversions: 0,
                    revenue: 0,
                    commission: 0,
                    epc: 0,
                },
            ],
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            totalCommission: 0,
            createdBy: affiliateUser._id,
            modifiedBy: createdBy,
            expiresAt,
            customDomain,
        });
        yield newLink.save({ session });
        yield session.commitTransaction();
        session.endSession();
        const longLink = newLink.generatedUrl;
        const shortLink = (_b = newLink.shortUrl) !== null && _b !== void 0 ? _b : '';
        return { longLink, shortLink, affiliateLink: newLink };
    }
    catch (err) {
        yield session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
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
    console.log('Affiliate Click Debug:', {
        slug,
        ip,
        userAgent,
        geo,
        deviceFingerprint,
        referrer,
    });
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    // Default redirect if anything fails
    const DEFAULT_REDIRECT = 'https://www.choiceidentity.com/register';
    let clickId = null;
    try {
        const affiliateLink = yield affiliate_model_1.AffiliateLink.findOne({
            $or: [{ slug }, { shortSlug: slug }],
            status: 'active',
        }).session(session);
        console.log('Info Link Found Debug:', { affiliateLink });
        if (!affiliateLink) {
            throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, `Affiliate link not found or inactive`);
        }
        // 1. Check for recent duplicate click (24h window)
        const recentClick = yield affiliate_model_1.ClickLog.findOne({
            affiliateLinkId: affiliateLink._id,
            deviceFingerprint,
            ip,
            clickedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }).session(session);
        console.log('Info Recent Click Debug:', { recentClick });
        // 2. If duplicate found, use its clickId and skip creating a new log
        if (recentClick) {
            yield session.commitTransaction();
            const redirectUrl = (0, affiliate_utils_1.buildRedirectUrl)(affiliateLink, recentClick.clickId);
            return { redirectUrl, clickId: recentClick.clickId };
        }
        // 3. Generate a new unique clickId for this click event
        clickId = (0, uuid_1.v4)();
        // 5. Parse device info for analytics
        const deviceInfo = (0, affiliate_utils_1.parseUserAgent)(userAgent);
        console.log(`Click Log Created: ${clickId}`);
        // 6. Create the immutable raw click log
        const loggerClick = yield affiliate_model_1.ClickLog.create([
            {
                clickId,
                affiliateLinkId: affiliateLink._id,
                affiliateId: affiliateLink.affiliateId,
                affiliateCode: affiliateLink.affiliateCode,
                plan: affiliateLink.plan,
                billing: affiliateLink.billing,
                subId: affiliateLink.subId,
                source: 'affiliate_platform',
                status: 'clicked',
                ip,
                geo,
                deviceFingerprint,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                browserVersion: deviceInfo.browserVersion,
                os: deviceInfo.os,
                osVersion: deviceInfo.osVersion,
                referrer,
                campaign: affiliateLink.campaign ||
                    `${affiliateLink.plan}-${affiliateLink.billing}`,
                clickedAt: new Date(),
            },
        ], { session });
        console.log('Info Click Log Debug:', { loggerClick });
        yield (0, affiliate_utils_1.updateClickStats)(affiliateLink._id, affiliateLink.subId || '', session, {
            deviceType: deviceInfo.deviceType,
            geo: geo,
        }, affiliateLink);
        yield session.commitTransaction();
        // 7. Build the final URL with all tracking parameters
        const redirectUrl = (0, affiliate_utils_1.buildRedirectUrl)(affiliateLink, clickId);
        return { redirectUrl, clickId };
    }
    catch (err) {
        yield session.abortTransaction();
        console.error('Affiliate click processing error:', err);
        // On error, redirect to default page without a clickId
        return { redirectUrl: DEFAULT_REDIRECT, clickId: null };
    }
    finally {
        yield session.endSession();
    }
});
// const getOverview = async (affiliateId: string) => {
//   // Use aggregation to compute global KPIs in DB for speed
//   const kpiAggregation = await AffiliateLink.aggregate([
//     {
//       $match: {
//         affiliateId: new mongoose.Types.ObjectId(affiliateId),
//         status: 'active',
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalClicks: { $sum: '$clickCount' },
//         totalConversions: { $sum: '$conversionCount' },
//         totalRevenue: { $sum: '$revenue' },
//         totalCommission: { $sum: '$commission' },
//       },
//     },
//   ]);
//   const kpis = kpiAggregation[0] || {
//     totalClicks: 0,
//     totalConversions: 0,
//     totalRevenue: 0,
//     totalCommission: 0,
//   };
//   const EPC = kpis.totalClicks ? kpis.totalRevenue / kpis.totalClicks : 0;
//   const CR = kpis.totalClicks
//     ? (kpis.totalConversions / kpis.totalClicks) * 100
//     : 0;
//   // Fetch top performing links (sorted by earnings) - lean for speed
//   const links = await AffiliateLink.find({ affiliateId, status: 'active' })
//     .sort({ commission: -1 })
//     .limit(5)
//     .lean();
//   const topPerformingLinks = links.map(l => ({
//     url: l.generatedUrl,
//     clicks: l.clickCount || 0,
//     conversions: l.conversionCount || 0,
//     rate: l.clickCount ? ((l.conversionCount || 0) / l.clickCount) * 100 : 0,
//     earnings: l.commission || 0,
//   }));
//   // Recent activity - last 10 conversions
//   const recentConversions = await AffiliateConversion.find({ affiliateId })
//     .sort({ convertedAt: -1 })
//     .limit(10)
//     .lean();
//   const recentActivity = recentConversions.map(c => ({
//     id: c._id,
//     type: 'conversion',
//     title: 'New Conversion',
//     description: `${c.customerId} upgraded to ${c.plan} Plan - $${c.commissionAmount} earned`,
//     time: c.convertedAt,
//     amount: c.commissionAmount,
//     severity: 'success',
//   }));
//   // Device & geo aggregation using MongoDB pipeline
//   const deviceAndGeo = await AffiliateLink.aggregate([
//     {
//       $match: {
//         affiliateId: new mongoose.Types.ObjectId(affiliateId),
//         status: 'active',
//       },
//     },
//     {
//       $project: {
//         devices: {
//           $ifNull: ['$clicksByDevice', { desktop: 0, mobile: 0, tablet: 0 }],
//         },
//         geo: { $ifNull: ['$geoClicks', {}] },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         devices: { $mergeObjects: '$devices' },
//         geo: { $mergeObjects: '$geo' },
//       },
//     },
//   ]);
//   const devices = deviceAndGeo[0]?.devices || {
//     desktop: 0,
//     mobile: 0,
//     tablet: 0,
//   };
//   const geo = deviceAndGeo[0]?.geo || {};
//   // Final structured response
//   return {
//     affiliateMetrics: {
//       totalEarnings: kpis.totalRevenue,
//       monthlyEarnings: 0, // can calculate from date if needed
//       conversionRate: Number(CR.toFixed(2)),
//       totalClicks: kpis.totalClicks,
//       totalReferrals: conversionsAll.length,
//       activeReferrals,
//       commissionRate: 25, // static or dynamic
//       pendingPayouts,
//       lastPayment: '', // fetch latest payout record
//       affiliateRank: 'Diamond Partner', // dynamic if needed
//       joinDate: links[0]?.createdAt,
//       EPC,
//     },
//     recentActivity,
//     topPerformingLinks,
//     devices,
//     geo,
//   };
// };
// export const getAffiliateLinksTable = async (
//   affiliateId: string,
//   paginationOptions: IPaginationOptions & { export?: boolean },
//   filters: ITableFilters & { dateRanges?: { from: Date; to: Date }[] }
// ): Promise<{
//   data: any[];
//   meta: { page: number; limit: number; total: number };
// }> => {
//   console.log('affiliateId', affiliateId);
//   console.log('PaginationOptions', paginationOptions);
//   console.log('filters', filters);
//   const { skip, limit, sortBy, sortOrder } =
//     calculatePagination(paginationOptions);
//   // Build match stage
//   const match: any = { affiliateId: new mongoose.Types.ObjectId(affiliateId) };
//   // --- Text search ---
//   if (filters.searchTerm) {
//     const regex = { $regex: filters.searchTerm, $options: 'i' };
//     match.$or = [
//       { subId: regex },
//       { generatedUrl: regex },
//       { campaign: regex },
//     ];
//   }
//   // --- Multi-plan filter ---
//   if (filters.plan) {
//     if (Array.isArray(filters.plan)) {
//       match.plan = { $in: filters.plan };
//     } else {
//       match.plan = filters.plan;
//     }
//   }
//   // --- Billing filter ---
//   if (filters.billing) match.billing = filters.billing;
//   // --- Multi-date ranges filter ---
//   if (filters.dateRanges && filters.dateRanges.length) {
//     match.$or = filters.dateRanges.map(range => ({
//       createdAt: {
//         $gte: new Date(range.from),
//         $lte: new Date(range.to),
//       },
//     }));
//   } else if (filters.startDate || filters.endDate) {
//     match.createdAt = {};
//     if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
//     if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
//   }
//   // Aggregation pipeline
//   const pipeline: mongoose.PipelineStage[] = [
//     { $match: match },
//     // Lookup conversions per link
//     {
//       $lookup: {
//         from: 'affiliateconversions',
//         localField: '_id',
//         foreignField: 'affiliateLinkId',
//         as: 'conversions',
//       },
//     },
//     // Add calculated fields
//     {
//       $addFields: {
//         clicks: { $ifNull: ['$clickCount', 0] },
//         leads: { $size: '$conversions' },
//         revenue: { $sum: '$conversions.revenue' },
//         commission: { $sum: '$conversions.commissionAmount' },
//       },
//     },
//     {
//       $addFields: {
//         cr: {
//           $cond: [
//             { $eq: ['$clicks', 0] },
//             0,
//             { $multiply: [{ $divide: ['$leads', '$clicks'] }, 100] },
//           ],
//         },
//         epc: {
//           $cond: [
//             { $eq: ['$clicks', 0] },
//             0,
//             { $divide: ['$revenue', '$clicks'] },
//           ],
//         },
//       },
//     },
//     // Filter by performance thresholds
//     {
//       $match: {
//         ...(filters.minClicks !== undefined
//           ? { clicks: { $gte: filters.minClicks } }
//           : {}),
//         ...(filters.maxClicks !== undefined
//           ? { clicks: { $lte: filters.maxClicks } }
//           : {}),
//         ...(filters.minRevenue !== undefined
//           ? { revenue: { $gte: filters.minRevenue } }
//           : {}),
//         ...(filters.maxRevenue !== undefined
//           ? { revenue: { $lte: filters.maxRevenue } }
//           : {}),
//         ...(filters.minEarning !== undefined
//           ? { commission: { $gte: filters.minEarning } }
//           : {}),
//         ...(filters.maxEarning !== undefined
//           ? { commission: { $lte: filters.maxEarning } }
//           : {}),
//       },
//     },
//     // Sort dynamically
//     {
//       $sort: {
//         [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
//       } as Record<string, 1 | -1>,
//     },
//     // Pagination (skip & limit only if not exporting)
//     ...(paginationOptions.export ? [] : [{ $skip: skip }, { $limit: limit }]),
//     // Project only needed fields
//     {
//       $project: {
//         _id: 1,
//         subId: 1,
//         plan: 1,
//         billing: 1,
//         campaign: 1,
//         clicks: 1,
//         leads: 1,
//         cr: 1,
//         revenue: 1,
//         commission: 1,
//         epc: 1,
//         createdAt: 1,
//         status: 1,
//         generatedUrl: 1,
//         tags: 1,
//         lastClickedAt: 1,
//         lastConvertedAt: 1,
//         clicksByDevice: 1,
//       },
//     },
//   ];
//   console.log('Aggregation Pipeline:', pipeline);
//   const data = await AffiliateLink.aggregate(pipeline);
//   // Total count for pagination (only when not exporting)
//   const total = paginationOptions.export
//     ? data.length
//     : await AffiliateLink.countDocuments(match);
//   return {
//     data,
//     meta: {
//       page: paginationOptions.page || 1,
//       limit,
//       total,
//     },
//   };
// };
const getOverview = (affiliateId) => __awaiter(void 0, void 0, void 0, function* () {
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
                totalRevenue: { $sum: '$revenue' }, // cents
                totalCommission: { $sum: '$commission' }, // cents
                lastConversion: { $max: '$lastConvertedAt' },
                lastClick: { $max: '$lastClickedAt' },
            },
        },
    ]);
    const kpis = kpiAggregation[0] || {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommission: 0,
        lastConversion: null,
        lastClick: null,
    };
    // Convert cents to dollars
    const totalRevenueDollars = kpis.totalRevenue / 100;
    const totalCommissionDollars = kpis.totalCommission / 100;
    const EPC = kpis.totalClicks ? totalCommissionDollars / kpis.totalClicks : 0;
    const CR = kpis.totalClicks
        ? (kpis.totalConversions / kpis.totalClicks) * 100
        : 0;
    // Fetch top performing links (sorted by earnings) - lean for speed
    const links = yield affiliate_model_1.AffiliateLink.find({ affiliateId, status: 'active' })
        .sort({ commission: -1 })
        .limit(5)
        .lean();
    const topPerformingLinks = links.map(l => ({
        id: l._id,
        subId: l.subId,
        plan: l.plan,
        billing: l.billing,
        url: l.generatedUrl,
        clicks: l.clickCount || 0,
        conversions: l.conversionCount || 0,
        rate: l.clickCount ? ((l.conversionCount || 0) / l.clickCount) * 100 : 0,
        earnings: (l.commission || 0) / 100, // cents to dollars
        revenue: (l.revenue || 0) / 100, // cents to dollars
        epc: (l.epc || 0) / 100, // cents to dollars
        lastClickedAt: l.lastClickedAt,
        lastConvertedAt: l.lastConvertedAt,
    }));
    // Recent activity - last 10 conversions from ClickLog with conversions
    const recentConversions = yield affiliate_model_1.ClickLog.aggregate([
        {
            $match: {
                affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId),
                status: 'converted'
            }
        },
        {
            $sort: { convertedAt: -1 }
        },
        {
            $limit: 10
        },
        {
            $lookup: {
                from: 'affiliatelinks',
                localField: 'affiliateLinkId',
                foreignField: '_id',
                as: 'link'
            }
        },
        {
            $unwind: '$link'
        }
    ]);
    const recentActivity = recentConversions.map(c => ({
        id: c._id,
        type: 'conversion',
        title: 'New Conversion',
        description: `${c.plan} Plan - $${(c.commissionAmount || 0) / 100} earned`,
        time: c.convertedAt,
        amount: (c.commissionAmount || 0) / 100, // cents to dollars
        severity: 'success',
        subId: c.subId,
        campaign: c.campaign
    }));
    // Device breakdown aggregation
    const deviceBreakdown = yield affiliate_model_1.AffiliateLink.aggregate([
        {
            $match: {
                affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId),
                status: 'active',
            },
        },
        {
            $group: {
                _id: null,
                desktop: { $sum: '$clicksByDevice.desktop' },
                mobile: { $sum: '$clicksByDevice.mobile' },
                tablet: { $sum: '$clicksByDevice.tablet' },
            },
        },
    ]);
    const devices = deviceBreakdown[0] || {
        desktop: 0,
        mobile: 0,
        tablet: 0,
    };
    // Geo breakdown (if you have geo data stored)
    const geoBreakdown = yield affiliate_model_1.ClickLog.aggregate([
        {
            $match: {
                affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId),
            },
        },
        {
            $group: {
                _id: '$geo.country',
                clicks: { $sum: 1 },
                conversions: {
                    $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
                },
            },
        },
        {
            $sort: { clicks: -1 }
        },
        {
            $limit: 5
        }
    ]);
    // Additional metrics
    const totalLinks = yield affiliate_model_1.AffiliateLink.countDocuments({
        affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId),
        status: 'active'
    });
    const activeCampaigns = yield affiliate_model_1.AffiliateLink.distinct('campaign', {
        affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId),
        status: 'active',
        campaign: { $ne: null }
    });
    // Final structured response
    return {
        summary: {
            totalEarnings: totalCommissionDollars,
            totalRevenue: totalRevenueDollars,
            conversionRate: Number(CR.toFixed(2)),
            totalClicks: kpis.totalClicks,
            totalConversions: kpis.totalConversions,
            epc: Number(EPC.toFixed(2)),
            totalLinks,
            activeCampaigns: activeCampaigns.length,
            lastActivity: kpis.lastConversion || kpis.lastClick
        },
        recentActivity,
        topPerformingLinks,
        devices,
        geo: geoBreakdown,
        performanceMetrics: {
            clickToConversionRate: CR,
            earningsPerClick: EPC,
            averageOrderValue: kpis.totalConversions ? totalRevenueDollars / kpis.totalConversions : 0,
            conversionValue: totalRevenueDollars
        }
    };
});
const getAffiliateLinksTable = (affiliateId, paginationOptions, filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('affiliateId', affiliateId);
    console.log('PaginationOptions', paginationOptions);
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
            { affiliateCode: regex },
            { slug: regex },
            { shortSlug: regex },
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
    if (filters.billing) {
        if (Array.isArray(filters.billing)) {
            match.billing = { $in: filters.billing };
        }
        else {
            match.billing = filters.billing;
        }
    }
    // --- Status filter ---
    //@ts-ignore
    if (filters.status) {
        //@ts-ignore
        if (Array.isArray(filters.status)) {
            //@ts-ignore
            match.status = { $in: filters.status };
        }
        else {
            //@ts-ignore
            match.status = filters.status;
        }
    }
    // --- Date range filter ---
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
    // --- Last activity filter ---
    //@ts-ignore
    if (filters.lastActivity) {
        const activityDate = new Date();
        //@ts-ignore
        switch (filters.lastActivity) {
            case '7days':
                activityDate.setDate(activityDate.getDate() - 7);
                break;
            case '30days':
                activityDate.setDate(activityDate.getDate() - 30);
                break;
            case '90days':
                activityDate.setDate(activityDate.getDate() - 90);
                break;
        }
        match.$or = [
            { lastClickedAt: { $gte: activityDate } },
            { lastConvertedAt: { $gte: activityDate } }
        ];
    }
    // Aggregation pipeline
    const pipeline = [
        { $match: match },
        // Add calculated fields from your current structure
        {
            $addFields: {
                clicks: { $ifNull: ['$clickCount', 0] },
                leads: { $ifNull: ['$conversionCount', 0] },
                revenue: { $ifNull: ['$revenue', 0] },
                commission: { $ifNull: ['$commission', 0] },
                epc: { $ifNull: ['$epc', 0] },
                // Calculate CR (Conversion Rate)
                cr: {
                    $cond: [
                        { $eq: ['$clickCount', 0] },
                        0,
                        { $multiply: [{ $divide: ['$conversionCount', '$clickCount'] }, 100] }
                    ]
                }
            }
        },
        // Filter by performance thresholds
        {
            $match: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.minClicks !== undefined && { clicks: { $gte: filters.minClicks } })), (filters.maxClicks !== undefined && { clicks: { $lte: filters.maxClicks } })), (filters.minLeads !== undefined && { leads: { $gte: filters.minLeads } })), (filters.maxLeads !== undefined && { leads: { $lte: filters.maxLeads } })), (filters.minRevenue !== undefined && { revenue: { $gte: filters.minRevenue } })), (filters.maxRevenue !== undefined && { revenue: { $lte: filters.maxRevenue } })), (filters.minEarning !== undefined && { commission: { $gte: filters.minEarning } })), (filters.maxEarning !== undefined && { commission: { $lte: filters.maxEarning } })), (filters.minCR !== undefined && { cr: { $gte: filters.minCR } })), (filters.maxCR !== undefined && { cr: { $lte: filters.maxCR } })), (filters.minEPC !== undefined && { epc: { $gte: filters.minEPC } })), (filters.maxEPC !== undefined && { epc: { $lte: filters.maxEPC } }))
        },
        // Sort dynamically with multiple fallbacks
        {
            $sort: {
                [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
                _id: sortOrder === 'asc' ? 1 : -1 // Secondary sort for consistency
            },
        },
        // Pagination (skip & limit only if not exporting)
        ...(paginationOptions.export ? [] : [{ $skip: skip }, { $limit: limit }]),
        // Project only needed fields for frontend
        {
            $project: {
                _id: 1,
                id: 1,
                subId: 1,
                plan: 1,
                billing: 1,
                campaign: 1,
                affiliateCode: 1,
                slug: 1,
                shortSlug: 1,
                generatedUrl: 1,
                shortUrl: 1,
                status: 1,
                tags: 1,
                // Performance metrics
                clicks: 1,
                leads: 1,
                cr: { $round: ['$cr', 2] }, // Round to 2 decimal places
                revenue: 1,
                commission: 1,
                epc: { $round: ['$epc', 2] }, // Round to 2 decimal places
                commissionRate: 1,
                // Dates
                createdAt: 1,
                updatedAt: 1,
                lastClickedAt: 1,
                lastConvertedAt: 1,
                // Device breakdown
                clicksByDevice: 1,
                // Additional useful fields
                customDomain: 1,
                expiresAt: 1,
                notes: 1,
                tier: 1
            }
        }
    ];
    // Execute aggregation
    const data = yield affiliate_model_1.AffiliateLink.aggregate(pipeline);
    // Get total count for pagination
    let total = data.length;
    if (!paginationOptions.export) {
        // For pagination, get actual total count without limit
        const countPipeline = [
            { $match: match },
            { $count: 'total' }
        ];
        const countResult = yield affiliate_model_1.AffiliateLink.aggregate(countPipeline);
        total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    }
    return {
        data,
        meta: {
            page: paginationOptions.page || 1,
            limit: paginationOptions.export ? total : limit,
            total
        }
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
