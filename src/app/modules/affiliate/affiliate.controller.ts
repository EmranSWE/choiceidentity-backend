import { Request, RequestHandler, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import { AffiliateService } from './affiliate.service';
import geoip from 'geoip-lite';
import { generateFingerprint } from './affiliate.utils';

const createAffiliateLink: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    //   if (!req.user?.id) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    const payload = {
      ...req.body,
      createdBy: "6898cdb4c727f16be6f94324",
    };

    const link = await AffiliateService.generateAffiliateLink(payload);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate link created successfully',
      data: link,
    });
  }
);
    



const listAffiliateLinks: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
 const { affiliateCode } = req.params;
    const links = await AffiliateService.getAllAffiliateLinks(affiliateCode);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate links retrieved successfully',
      data: links
    });
  }
);



const affiliateClick: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.connection.remoteAddress
    || req.ip
    || '';
  const userAgent = req.get('User-Agent') || '';

  // GeoIP enrichment
  const geo = geoip.lookup(ip);

  // Optional: device fingerprint from header or compute here
  const deviceFingerprint = req.headers['x-device-fingerprint'] as string || generateFingerprint(ip, userAgent);

  const redirectUrl = await AffiliateService.affiliateClick(slug, ip, userAgent, geo, deviceFingerprint);

  // Parse redirect URL and set secure signed cookie
  const url = new URL(redirectUrl);


  const affiliateCode = url.searchParams.get('affiliate');


  if (affiliateCode) {
    res.cookie('affiliate_code', affiliateCode, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    //   signed: true,
    });
  }
  return res.redirect(redirectUrl);
});

export const AffiliateController = {
  listAffiliateLinks,
  createAffiliateLink,
  affiliateClick
};