import { customAlphabet } from 'nanoid';
import httpStatus from 'http-status';
import ApiError from '../../../errors/apiErrors';
import { User } from './auth.model';

type ReferralCodeOptions = {
  length?: number;
  charset?: string;
  maxRetries?: number;
};

const DEFAULT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export async function generateUniqueReferralCode(
  options: ReferralCodeOptions = {}
): Promise<string> {
  const {
    length = 10,
    charset = DEFAULT_CHARSET,
    maxRetries = 10,
  } = options;

  // Create the nanoid generator once with the custom alphabet and length
  const nanoidGenerator = customAlphabet(charset, length);

  let attempts = 0;
  while (attempts < maxRetries) {
    attempts++;

    // Generate code with the custom nanoid generator
    const code = nanoidGenerator();

    // Check if code exists in DB
    const exists = await User.exists({ 'affiliateDetails.referralCode': code });

    if (!exists) {
      return code; // Unique code found
    }
  }

  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    'Failed to generate unique referral code. Please try again.'
  );
}
