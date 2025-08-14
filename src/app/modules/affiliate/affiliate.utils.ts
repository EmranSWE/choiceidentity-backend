import { customAlphabet } from 'nanoid';
import crypto from 'crypto';
import { AffiliateLink } from "./affiliate.model";

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
    const exists = await AffiliateLink.findOne({
      generatedUrl: { $regex: new RegExp(`/${slug}$`, 'i') }, // ends with slug
      status: { $ne: 'deleted' },
    });

    if (!exists) return slug;
  }
  throw new Error('Failed to generate unique slug after multiple attempts');
}

export function generateFingerprint(ip: string, userAgent: string): string {
  const data = `${ip}|${userAgent}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}