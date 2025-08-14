import mongoose from 'mongoose';
import { AffiliateLink, ClickLog } from './affiliate.model';
import {
  IAffiliateLink,
} from './affiliate.interface';
import { User } from '../auth/auth.model';
import { generateUniqueSlug } from './affiliate.utils';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '../../../errors/apiErrors';
import { nanoid } from 'nanoid';

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

type GenerateAffiliateLinkPayload = {
  affiliateCode: string;
  plan: string;
  billing: string;
  subId?: string | null;
  createdBy: string;
  customDomain?: string | null;
  expiresAt?: Date | null;
  source?: string;
};

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
    customDomain = null,
    expiresAt = null,
    source = 'affiliate_platform',
  } = payload;

  if (!affiliateCode || typeof affiliateCode !== 'string') {
    throw new ApiError(400, 'Invalid affiliateCode');
  }

  // 1️⃣ Lookup affiliate user
  const affiliateUser = await User.findOne({
    'affiliateDetails.referralCode': affiliateCode,
    'affiliateProfile.approvalStatus': 'approved',
    accountStatus: 'active',
    role: 'affiliate',
  }).select('_id +affiliateDetails');

  if (!affiliateUser) {
    throw new ApiError(
      404,
      `Affiliate with code '${affiliateCode}' not found or inactive`
    );
  }

  // 2️⃣ Check if active link already exists
  const existingLink = await AffiliateLink.findOne({
    affiliateCode,
    plan,
    billing,
    subId,
    status: { $ne: 'deleted' },
  });
  if (existingLink) {
    return {
      longLink: existingLink.generatedUrl,
      shortLink: `${customDomain ?? 'https://choiceidentity.com'}/click/${
        existingLink.shortSlug
      }`,
      affiliateLink: existingLink,
    };
  }

  // 3️⃣ Generate slugs
  const slug = await generateUniqueSlug(affiliateCode, plan, billing); 
  const shortSlug = nanoid();

  // 4️⃣ Generate UUIDs
  const clickId = uuidv4();
  const transactionId = uuidv4();
  const ts = Math.floor(Date.now() / 1000);

  // 5️⃣ Construct long enterprise URL
  const BASE_DOMAIN = customDomain ?? 'http://localhost:3000';
  const longQuery = new URLSearchParams({
    aff_id: affiliateCode,
    click_id: clickId,
    ...(subId ? { sub_id: subId } : {}),
    transaction_id: transactionId,
    campaign: `${plan}-${billing}`,
    source,
    ts: ts.toString(),
  });
  const generatedUrl = `${BASE_DOMAIN}/click/${slug}?${longQuery.toString()}`;

  // 6️⃣ Save link inside transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const duplicateLink = await AffiliateLink.findOne({
      $or: [
        { affiliateCode, plan, billing, subId, status: { $ne: 'deleted' } },
        { generatedUrl, status: { $ne: 'deleted' } },
        { shortSlug, status: { $ne: 'deleted' } },
      ],
    }).session(session);

    if (duplicateLink) {
      await session.abortTransaction();
      session.endSession();
      return {
        longLink: duplicateLink.generatedUrl,
        shortLink: `${BASE_DOMAIN}/click/${duplicateLink.shortSlug}`,
        affiliateLink: duplicateLink,
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
      createdBy,
      modifiedBy: createdBy,
      expiresAt,
      customDomain,
    });

    await newLink.save({ session });
    await session.commitTransaction();
    session.endSession();

    const longLink = newLink.generatedUrl;
    const shortLink = `${BASE_DOMAIN}/click/${newLink.shortSlug}`;

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
  geoData: any | null,
  deviceFingerprint: string
): Promise<string> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Exact match on slug (no regex)
    const affiliateLink = await AffiliateLink.findOne({
      slug,
      status: 'active',
    }).session(session);

    if (!affiliateLink) throw new Error('Affiliate link not found or inactive');

    await ClickLog.create(
      [
        {
          affiliateLinkId: affiliateLink._id,
          affiliateId: affiliateLink.affiliateId,
          ip,
          userAgent,
          geoLocation: geoData,
          deviceFingerprint,
          clickedAt: new Date(),
        },
      ],
      { session }
    );

    affiliateLink.clickCount += 1;
    affiliateLink.lastClickedAt = new Date();
    await affiliateLink.save({ session });

    await session.commitTransaction();

    const baseUrl =
      process.env.FRONTEND_BASE_URL || 'http://localhost:3000/register';
    const params = new URLSearchParams({
      affiliate: affiliateLink.affiliateCode,
      plan: affiliateLink.plan,
      billing: affiliateLink.billing,
    });
    return `${baseUrl}?${params.toString()}`;
  } catch (err) {
    await session.abortTransaction();
    console.error('Affiliate click error:', err);
    return process.env.FRONTEND_BASE_URL || 'http://localhost:3000/register';
  } finally {
    session.endSession();
  }
};

export const AffiliateService = {
  getAllAffiliateLinks,
  generateAffiliateLink,
  affiliateClick,
};
