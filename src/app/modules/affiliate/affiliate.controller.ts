import { Request, RequestHandler, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import { AffiliateService } from './affiliate.service';
import geoip from 'geoip-lite';
import { generateFingerprint } from './affiliate.utils';
import { getPaginationAndFilters } from '../../../helpers/paginationHelpers';
import { ITableFilters } from './affiliate.interface';
import config from '../../../config';

const createAffiliateLink: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    //   if (!req.user?.id) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    // const idempotencyKey = res.locals.idempotencyKey;

    // if (!idempotencyKey)
    //   throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Idempotency-Key');
 const customDomain =
      config.env === 'production'
        ? 'https://choiceidentity.com'
        : 'http://localhost:3000';
        
    const payload = {
      ...req.body,
      customDomain
      //   idempotencyKey,
      //   createdBy: req.user._id,
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
      data: links,
    });
  }
);

const affiliateClick: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { slug } = req.params;

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.connection.remoteAddress ||
      req.ip ||
      '';

    const userAgent = req.get('User-Agent') || '';

    const referrer = req.get('Referer') || req.headers.referer || null;

    // GeoIP enrichment
    const geo = geoip.lookup(ip) || { country: null, region: null, city: null };

    // Optional: device fingerprint from header or compute here
    const deviceFingerprint =
      (req.headers['x-device-fingerprint'] as string) ||
      generateFingerprint(ip, userAgent);

      
    const redirectUrl = await AffiliateService.affiliateClick(
      slug,
      ip,
      userAgent,
      geo,
      deviceFingerprint,
      referrer
    );
    console.log('redirectUrl', redirectUrl);
    // Parse redirect URL and set secure signed cookie
    const url = new URL(redirectUrl);

    console.log(url);

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
  }
);

const getOverview: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || user.role !== 'affiliate') {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Delegate all logic to service
    const overview = await AffiliateService.getOverview(user.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate Overview fetched successfully',
      data: overview,
    });
  }
);

const listLinks: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || user.role !== 'affiliate') {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    const { paginationOptions, filters } =
      getPaginationAndFilters<ITableFilters>(req);
    // Delegate all logic to service
    const overview = await AffiliateService.getAffiliateLinksTable(
      user.userId,
      paginationOptions,
      filters
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate Overview fetched successfully',
      data: overview,
    });
  }
);
export const AffiliateController = {
  listAffiliateLinks,
  createAffiliateLink,
  affiliateClick,
  getOverview,
  listLinks,
};
