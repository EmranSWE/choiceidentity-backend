// utils/affiliateAnalyticsHelpers.ts
import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';
import crypto from 'crypto';
import { AffiliateLink, ClickLog, SubIdPerformance } from './affiliate.model';
import ApiError from '../../../errors/apiErrors';
import httpStatus from 'http-status';
import { UAParser } from 'ua-parser-js';
import { IAffiliateLink } from './affiliate.interface';

export const DEFAULT_DOMAIN =
  process.env.NEXT_PUBLIC_CLIENT_URL || 'https://choiceidentity.com';
const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export const generateReferralCode = (): string => nano();

export const generateTrackingCode = (): string => nano();

const MAX_RETRIES = 10;
export async function generateUniqueSlug(
  affiliateCode: string,
  plan: string,
  billing: string
): Promise<string> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug =
      `${affiliateCode}-${plan}-${billing}-${randomSuffix}`.toLowerCase();

    // Strict exact match on slug suffix in URL (avoid regex if possible)
    const exists = await AffiliateLink.exists({
      slug,
      status: { $ne: 'deleted' },
    });

    if (!exists) return slug;
  }
  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    'Failed to generate unique slug'
  );
}

export function generateFingerprint(ip: string, userAgent: string): string {
  const data = `${ip}|${userAgent}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function normalizeSubId(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '');
}

// Build redirect URL with params
export function buildRedirectUrl(affiliateLink: any, clickId: string) {
    const url = new URL("https://www.choiceidentity.com/register");
//   const url = new URL('http://localhost:3000/register'); // For local testing

  url.searchParams.set('ref', affiliateLink.affiliateCode);
  url.searchParams.set('plan', affiliateLink.plan);
  url.searchParams.set('billing', affiliateLink.billing);
  if (affiliateLink.subId) url.searchParams.set('sub_id', affiliateLink.subId);
  url.searchParams.set('click_id', clickId);
  return url.toString();
}

export function parseUserAgent(ua: string) {
  const parser = new UAParser(ua);
  const result = parser.getResult();

  return {
    deviceType: result.device.type || 'desktop',
    browser: result.browser.name || 'unknown',
    browserVersion: result.browser.version?.split('.')[0] || 'unknown',
    os: result.os.name || 'unknown',
    osVersion: result.os.version || 'unknown',
  };
}

export const updateClickStats = async (
  affiliateLinkId: mongoose.Types.ObjectId,
  subId: string,
  session: mongoose.ClientSession,
  deviceInfo?: { deviceType: string; geo?: any },
  affiliateLink?: IAffiliateLink
) => {
  try {
    let linkDoc = affiliateLink;

    // If link document not provided, fetch it
    if (!linkDoc) {
      const foundLink = await AffiliateLink.findById(affiliateLinkId).session(
        session
      );
      if (!foundLink) {
        console.error(
          'Affiliate link not found for stats update:',
          affiliateLinkId
        );
        return;
      }
      linkDoc = foundLink as IAffiliateLink;
    }

    // Prepare update operations for the root affiliate link
    const updateOperations: any = {
      $inc: {
        clickCount: 1,
      },
      $set: {
        lastClickedAt: new Date(),
      },
    };

    // Add device breakdown if device info available
    if (deviceInfo?.deviceType) {
      updateOperations.$inc[`clicksByDevice.${deviceInfo.deviceType}`] = 1;
    }

    // Update subId if provided and not already set
    if (subId && !linkDoc.subId) {
      updateOperations.$set.subId = subId;
    }

    // Always update the root affiliate link
    await AffiliateLink.findByIdAndUpdate(affiliateLinkId, updateOperations, {
      session,
    });

    console.log(`Root link stats updated for: ${affiliateLinkId}`);

    // If using multi-subId tracking (subIdPerformanceRef exists)
    if (linkDoc.subIdPerformanceRef) {
      await updateSubIdPerformance(
        affiliateLinkId,
        subId || linkDoc.subId || 'default',
        session,
        deviceInfo,
        linkDoc
      );
    }
  } catch (error) {
    console.error('Error updating click stats:', error);
    // Continue without throwing to maintain main transaction
  }
};

const updateSubIdPerformance = async (
  affiliateLinkId: mongoose.Types.ObjectId,
  subId: string,
  session: mongoose.ClientSession,
  deviceInfo?: { deviceType: any; geo?: any },
  affiliateLink?: IAffiliateLink
) => {
  try {
    let linkDoc = affiliateLink;
    if (!linkDoc) {
      const foundLink = await AffiliateLink.findById(affiliateLinkId)
        .select('affiliateId campaign')
        .session(session);

      if (!foundLink) {
        throw new Error('Affiliate link not found');
      }
      linkDoc = foundLink as IAffiliateLink;
    }

    const updateOps: any = {
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
        status: 'active' as const,
        // ✅ Initialize with zeros, not with incremented values
        conversions: 0,
        revenue: 0,
        commission: 0,
        epc: 0,
      },
    };

    // Add device breakdown if device info available
    if (deviceInfo?.deviceType) {
      updateOps.$inc[`deviceBreakdown.${deviceInfo.deviceType}`] = 1;

      updateOps.$setOnInsert.deviceBreakdown = {
        desktop: deviceInfo.deviceType === 'desktop' ? 1 : 0,
        mobile: deviceInfo.deviceType === 'mobile' ? 1 : 0,
        tablet: deviceInfo.deviceType === 'tablet' ? 1 : 0,
      };
    }

    // Add geo data if available
    if (deviceInfo?.geo) {
      updateOps.$setOnInsert.geoData = {
        country: deviceInfo.geo.country || '',
        region: deviceInfo.geo.region || '',
        city: deviceInfo.geo.city || '',
      };
    }

    const subIdPerf = await SubIdPerformance.findOneAndUpdate(
      {
        affiliateLinkId: affiliateLinkId,
        subId: subId,
      },
      updateOps,
      {
        upsert: true,
        session,
        new: true,
      }
    );

    console.log(`SubId performance updated - Clicks: ${subIdPerf?.clicks}`);
    return subIdPerf;
  } catch (error) {
    console.error('Error updating subId performance:', error);
    return null;
  }
};

export const findAffiliateLinkByClickId = async (
  clickId: string,
  session: mongoose.ClientSession
) => {
  try {
    const clickLog = await ClickLog.findOne({ clickId }).session(session);
    return clickLog
      ? await AffiliateLink.findById(clickLog.affiliateLinkId).session(session)
      : null;
  } catch (error) {
    console.error('Error finding affiliate link by clickId:', error);
    return null;
  }
};

export const validateClickId = async (
  clickId: string,
  session: mongoose.ClientSession
) => {
  try {
    const clickLog = await ClickLog.findOne({ clickId }).session(session);

    console.log('Validating clickId:', clickId, 'Found clickLog:', clickLog);
    return !!clickLog;
  } catch (error) {
    console.error('Error validating clickId:', error);
    return false;
  }
};

export const updateConversionStats = async (
  affiliateLinkId: mongoose.Types.ObjectId,
  subId: string,
  revenueGenerated: number,
  commissionAmount: number,
  session: mongoose.ClientSession
) => {
  try {
    console.log(
      `Updating conversion stats for link: ${affiliateLinkId}, subId: ${subId}`
    );

    // 1️⃣ Fetch the affiliate link document
    const affiliateLink = await AffiliateLink.findOne({
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
      await SubIdPerformance.findOneAndUpdate(
        {
          affiliateLinkId: affiliateLinkId,
          subId: subId || affiliateLink.subId || 'default',
        },
        {
          $inc: {
            conversions: 1,
            revenue: revenueGenerated,
            commission: commissionAmount,
          },
          $set: {
            lastConversionAt: new Date(),
            // Recalculate EPC for this subId
            epc: await calculateSubIdEPC(affiliateLinkId, subId, session),
          },
        },
        { session }
      );
    }

    // 5️⃣ Save the updated affiliate link
    await affiliateLink.save({ session });
    console.log('After update', affiliateLink);
    console.log('✅ Conversion stats updated successfully');
  } catch (err) {
    console.error('Error updating conversion stats:', err);
    throw err;
  }
};

// Helper function to calculate EPC for subId
const calculateSubIdEPC = async (
  affiliateLinkId: mongoose.Types.ObjectId,
  subId: string,
  session: mongoose.ClientSession
): Promise<number> => {
  const subIdPerf = await SubIdPerformance.findOne({
    affiliateLinkId,
    subId,
  }).session(session);

  if (!subIdPerf || subIdPerf.clicks === 0) return 0;
  return subIdPerf.commission / subIdPerf.clicks;
};
