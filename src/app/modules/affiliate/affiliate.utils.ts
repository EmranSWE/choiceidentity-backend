import { customAlphabet } from 'nanoid';
import crypto from 'crypto';
import { AffiliateLink } from "./affiliate.model";
import ApiError from '../../../errors/apiErrors';
import httpStatus from 'http-status';
import {UAParser} from "ua-parser-js";

export const DEFAULT_DOMAIN = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://choiceidentity.com';
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
    const slug = `${affiliateCode}-${plan}-${billing}-${randomSuffix}`.toLowerCase();

    // Strict exact match on slug suffix in URL (avoid regex if possible)
  const exists = await AffiliateLink.exists({
      slug,
      status: { $ne: 'deleted' },
    });

    if (!exists) return slug;
  }
  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate unique slug');
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
  const url = new URL("http://localhost:3000/register");
  url.searchParams.set("affiliate", affiliateLink.affiliateCode);
  url.searchParams.set("plan", affiliateLink.plan);
  url.searchParams.set("billing", affiliateLink.billing);
  if (affiliateLink.subId) url.searchParams.set("sub_id", affiliateLink.subId);
  url.searchParams.set("click_id", clickId);
  return url.toString();
}

export function parseUserAgent(ua: string) {
    const parser = new UAParser(ua); 
  const result = parser.getResult();

  return {
    deviceType: result.device.type || "desktop",
    browser: result.browser.name || "unknown", 
     browserVersion: (result.browser.version?.split(".")[0]) || "unknown",
    os: result.os.name || "unknown",            
    osVersion: result.os.version || "unknown",  
  };
}