import mongoose, { SortOrder } from 'mongoose';
import {
  AffiliateConversion,
  AffiliateLink,
  ClickLog,
} from './affiliate.model';
import {
  GenerateAffiliateLinkPayload,
  IAffiliateLink,
  ITableFilters,
} from './affiliate.interface';
import { User } from '../auth/auth.model';
import {
    buildRedirectUrl,
  DEFAULT_DOMAIN,
  generateUniqueSlug,
  normalizeSubId,
  parseUserAgent,
} from './affiliate.utils';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '../../../errors/apiErrors';
import { nanoid } from 'nanoid';
import {
  calculatePagination,
  IPaginationOptions,
} from '../../../helpers/paginationHelpers';
import { IUserFilters } from '../auth/auth.interface';
import httpStatus from 'http-status';

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

const generateAffiliateLink = async (
  payload: GenerateAffiliateLinkPayload
): Promise<{
  longLink: string;
  shortLink: string;
  affiliateLink: IAffiliateLink;
}> => {
  const {
    affiliateCode,
    plan,
    billing,
    subId = null,
    createdBy,
    customDomain ,
    expiresAt = null,
    source = 'affiliate_platform',
  } = payload;


  console.log('Generate Link Payload:', payload);
  //   const normalizedSubId = subId ? normalizeSubId(subId) : null;
  if (!affiliateCode || typeof affiliateCode !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid affiliateCode');
  }
  if (!plan || !billing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'plan and billing are required');
  }

  // 1️⃣ Lookup affiliate user
  const affiliateUser = await User.findOne(
    {
      'affiliateProfile.referralCode': affiliateCode,
      'affiliateProfile.approvalStatus': 'approved',
      accountStatus: 'active',
      role: 'affiliate',
    },
    { _id: 1, affiliateProfile: 1 }
  ).lean();

  if (!affiliateUser?._id) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `Affiliate with code '${affiliateCode}' not found or inactive`
    );
  }

  // 2️⃣ Check if active link already exists
  const existingLink = await AffiliateLink.findOne(
    {
      affiliateCode,
      plan,
      billing,
      subId,
      status: { $ne: 'deleted' },
    },
    { generatedUrl: 1, shortSlug: 1, slug: 1, plan: 1, billing: 1 }
  ).lean();

  if (existingLink) {
    const baseDomain = customDomain || DEFAULT_DOMAIN;
    return {
      longLink: existingLink.generatedUrl,
      shortLink: `${baseDomain}/click/${existingLink.shortSlug}`,
      affiliateLink: existingLink as IAffiliateLink,
    };
  }
  // 3️⃣ Generate slugs
  const slug = await generateUniqueSlug(affiliateCode, plan, billing);
  const shortSlug = nanoid();
  const clickId = uuidv4();

  const transactionId = uuidv4();

  const ts = Math.floor(Date.now() / 1000);

  // 5️⃣ Construct long enterprise URL
  const baseDomain = customDomain || DEFAULT_DOMAIN;


  const queryParams = new URLSearchParams({
    aff_id: affiliateCode,
    click_id: clickId,
    ...(subId ? { sub_id: subId } : {}),
    transaction_id: transactionId,
    campaign: `${plan}-${billing}`,
    source,
    ts: ts.toString(),
  });

  const generatedUrl = `${baseDomain}/click/${slug}?${queryParams.toString()}`;

  // 6️⃣ Save link inside transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const duplicateLink = await AffiliateLink.findOne(
      {
        $or: [
          { affiliateCode, plan, billing, subId, status: { $ne: 'deleted' } },
          { slug, status: { $ne: 'deleted' } },
          { shortSlug, status: { $ne: 'deleted' } },
        ],
      },
      { generatedUrl: 1, shortSlug: 1 }
    )
      .session(session)
      .lean();

    if (duplicateLink) {
      await session.abortTransaction();
      session.endSession();
      return {
        longLink: duplicateLink.generatedUrl,
        shortLink: `${baseDomain}/click/${duplicateLink.shortSlug}`,
        affiliateLink: duplicateLink as IAffiliateLink,
      };
    }

    const newLink = new AffiliateLink({
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
    await newLink.save({ session });
    await session.commitTransaction();
    session.endSession();

    const longLink = newLink.generatedUrl;
    const shortLink = `${baseDomain}/click/${newLink.shortSlug}`;
    return { longLink, shortLink, affiliateLink: newLink };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const getAllAffiliateLinks = async (affiliateCode: string) => {
  if (!affiliateCode) throw new Error('affiliateCode required');

  const links = await AffiliateLink.find({
    affiliateCode: { $regex: `^${affiliateCode}$`, $options: 'i' },
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ createdAt: -1 });

  return links;
};


const affiliateClick = async (
  slug: string,
  ip: string,
  userAgent: string,
  geo: any,
  deviceFingerprint: string,
  referrer?: any
): Promise<string> => {
  console.log('%cAnalytics Debug:', 'color: red; font-weight: bold;', {
    '🔗 Slug': slug,
    '🌐 IP': ip,
    '🖥️ User Agent': userAgent,
    '🗺️ Geo': geo,
    '📱 Device Fingerprint': deviceFingerprint,
    '↩️ Referrer': referrer,
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
  const affiliateLink = await AffiliateLink.findOne({
  $or: [{ slug }, { shortSlug: slug }],
  status: 'active',
}).session(session);

    console.log(
      '%cAnalytics affiliateLink Debug:',
      'color: yellow; font-weight: bold;',
      {
        '🔗 affiliateLink': affiliateLink,
      }
    );

    if (!affiliateLink)
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `Affiliate Link not found or inactive`
      );


    const recentClick = await ClickLog.findOne({
      affiliateLinkId: affiliateLink._id,
      deviceFingerprint,
      ip,
      clickedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).session(session);

  console.log(
  "%c🔗 recentClick Debug:",
  "color: #facc15; font-weight: bold; background: #1f2937; padding: 2px 6px; border-radius: 4px;",
  {
    linkId: recentClick?.affiliateLinkId,
    clickId: recentClick?.clickId,
    ip: recentClick?.ip,
    device: recentClick?.deviceType,
  }
);
     if (recentClick) {
      await session.commitTransaction();
      return buildRedirectUrl(affiliateLink, recentClick.clickId);
    }
    // ✅ Generate new clickId
    const clickId = uuidv4();

    console.log("%c🔗 clickId Debug:", "color: #10b981; font-weight: bold;", { clickId });

    // ✅ Atomically update click count
    await AffiliateLink.updateOne(
      { _id: affiliateLink._id },
      {
        $inc: { clickCount: 1 },
        $set: { lastClickedAt: new Date() },
      },
      { session }
    );

    // ✅ Log click (raw event log, append-only)
     const deviceInfo = parseUserAgent(userAgent);
     console.log("%c🔗 deviceInfo Debug:", "color: #3b82f6; font-weight: bold;", { deviceInfo });

    const clickLoger = await ClickLog.create(
      [
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
      ],
      { session }
    );

    console.log("Click Log Created:", clickLoger);
    await session.commitTransaction();

    // ✅ Build redirect URL
    return buildRedirectUrl(affiliateLink, clickId)
  } catch (err) {
    await session.abortTransaction();
    console.error('Affiliate click error:', err);
    return 'https://www.choiceidentity.com/register';
  } finally {
    session.endSession();
  }
};




const getOverview = async (affiliateId: string) => {
  // Use aggregation to compute global KPIs in DB for speed
  const kpiAggregation = await AffiliateLink.aggregate([
    {
      $match: {
        affiliateId: new mongoose.Types.ObjectId(affiliateId),
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
  const links = await AffiliateLink.find({ affiliateId, status: 'active' })
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
  const recentConversions = await AffiliateConversion.find({ affiliateId })
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
  const deviceAndGeo = await AffiliateLink.aggregate([
    {
      $match: {
        affiliateId: new mongoose.Types.ObjectId(affiliateId),
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

  const devices = deviceAndGeo[0]?.devices || {
    desktop: 0,
    mobile: 0,
    tablet: 0,
  };
  const geo = deviceAndGeo[0]?.geo || {};

  // Active referrals & pending payouts
  const conversionsAll = await AffiliateConversion.find({ affiliateId }).lean();
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
      joinDate: links[0]?.createdAt,
      EPC,
    },
    recentActivity,
    topPerformingLinks,
    devices,
    geo,
  };
};

export const getAffiliateLinksTable = async (
  affiliateId: string,
  paginationOptions: IPaginationOptions & { export?: boolean },
  filters: ITableFilters & { dateRanges?: { from: Date; to: Date }[] }
): Promise<{
  data: any[];
  meta: { page: number; limit: number; total: number };
}> => {
  console.log('PaginationmOptions', paginationOptions);
  console.log('filters', filters);

  const { skip, limit, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  // Build match stage
  const match: any = { affiliateId: new mongoose.Types.ObjectId(affiliateId) };

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
    } else {
      match.plan = filters.plan;
    }
  }

  // --- Billing filter ---
  if (filters.billing) match.billing = filters.billing;

  // --- Multi-date ranges filter ---
  if (filters.dateRanges && filters.dateRanges.length) {
    match.$or = filters.dateRanges.map(range => ({
      createdAt: {
        $gte: new Date(range.from),
        $lte: new Date(range.to),
      },
    }));
  } else if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
  }

  // Aggregation pipeline
  const pipeline: mongoose.PipelineStage[] = [
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
      $match: {
        ...(filters.minClicks !== undefined
          ? { clicks: { $gte: filters.minClicks } }
          : {}),
        ...(filters.maxClicks !== undefined
          ? { clicks: { $lte: filters.maxClicks } }
          : {}),
        ...(filters.minRevenue !== undefined
          ? { revenue: { $gte: filters.minRevenue } }
          : {}),
        ...(filters.maxRevenue !== undefined
          ? { revenue: { $lte: filters.maxRevenue } }
          : {}),
        ...(filters.minEarning !== undefined
          ? { commission: { $gte: filters.minEarning } }
          : {}),
        ...(filters.maxEarning !== undefined
          ? { commission: { $lte: filters.maxEarning } }
          : {}),
      },
    },

    // Sort dynamically
    {
      $sort: {
        [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
      } as Record<string, 1 | -1>,
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

  const data = await AffiliateLink.aggregate(pipeline);

  // Total count for pagination (only when not exporting)
  const total = paginationOptions.export
    ? data.length
    : await AffiliateLink.countDocuments(match);

  return {
    data,
    meta: {
      page: paginationOptions.page || 1,
      limit,
      total,
    },
  };
};

export const AffiliateService = {
  getAllAffiliateLinks,
  generateAffiliateLink,
  affiliateClick,
  getOverview,
  getAffiliateLinksTable,
};
