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
    console.log("PaginationmOptions", paginationOptions);
    console.log("filters", filters);
    const { skip, limit, sortBy, sortOrder } = (0, paginationHelpers_1.calculatePagination)(paginationOptions);
    // Build match stage
    const match = { affiliateId: new mongoose_1.default.Types.ObjectId(affiliateId) };
    // --- Text search ---
    if (filters.searchTerm) {
        const regex = { $regex: filters.searchTerm, $options: "i" };
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
        match.$or = filters.dateRanges.map((range) => ({
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
                from: "affiliateconversions",
                localField: "_id",
                foreignField: "affiliateLinkId",
                as: "conversions",
            },
        },
        // Add calculated fields
        {
            $addFields: {
                clicks: { $ifNull: ["$clickCount", 0] },
                leads: { $size: "$conversions" },
                revenue: { $sum: "$conversions.revenue" },
                commission: { $sum: "$conversions.commissionAmount" },
            },
        },
        {
            $addFields: {
                cr: {
                    $cond: [{ $eq: ["$clicks", 0] }, 0, { $multiply: [{ $divide: ["$leads", "$clicks"] }, 100] }],
                },
                epc: {
                    $cond: [{ $eq: ["$clicks", 0] }, 0, { $divide: ["$revenue", "$clicks"] }],
                },
            },
        },
        // Filter by performance thresholds
        {
            $match: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.minClicks !== undefined ? { clicks: { $gte: filters.minClicks } } : {})), (filters.maxClicks !== undefined ? { clicks: { $lte: filters.maxClicks } } : {})), (filters.minRevenue !== undefined ? { revenue: { $gte: filters.minRevenue } } : {})), (filters.maxRevenue !== undefined ? { revenue: { $lte: filters.maxRevenue } } : {})), (filters.minEarning !== undefined ? { commission: { $gte: filters.minEarning } } : {})), (filters.maxEarning !== undefined ? { commission: { $lte: filters.maxEarning } } : {})),
        },
        // Sort dynamically
        {
            $sort: { [sortBy || "createdAt"]: sortOrder === "asc" ? 1 : -1 },
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
    const total = paginationOptions.export ? data.length : yield affiliate_model_1.AffiliateLink.countDocuments(match);
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
    getAffiliateLinksTable: exports.getAffiliateLinksTable
};
