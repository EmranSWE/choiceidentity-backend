/* eslint-disable @typescript-eslint/ban-ts-comment */
import ApiError from '../../../../errors/apiErrors';
import { User } from '../../auth/auth.model';

import {
  PasswordScoreBreakdown,
  PasswordScoreResult,
} from './passwordHealth.interface';
import {
  getTierAndColor,
  calculatePasswordStrength,
} from './passwordHealth.utils';
import httpStatus from 'http-status';

export const getPasswordScore = async (
  email: string
): Promise<PasswordScoreResult> => {
  const user = await User.findOne({ email }).select({
    password: 1,
    reusedPasswords: 1,
    twoFactorAuth: 1,
    lastPasswordChangeAt: 1,
    loginHistory: 1,
  });

  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found.');

  let score = 100;
  const breakdown: PasswordScoreBreakdown = {
    length: 100,
    reuse: 100,
    breached: 100,
    strength: 0,
    mfa: user.twoFactorAuth?.enabled ? 100 : 0,
    passwordAge: 100,
  };
  const recommendations: string[] = [];

  // 1️⃣ Password age

    if (!user.password || user.password.length < 8) {
    score -= 20;
    breakdown['length'] = 0;
    recommendations.push('Password too short, use at least 8 characters.');
  } else {
    breakdown['length'] = 100;
  }

  const ageDays = user.lastPasswordChangeAt
    ? Math.floor(
        (Date.now() - new Date(user.lastPasswordChangeAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 365;
  if (ageDays > 180) {
    score -= 10;
    breakdown['passwordAge'] = 50;
    recommendations.push('Change your password if it is older than 6 months.');
  } else {
    breakdown['passwordAge'] = 100;
  }

  // 2️⃣ MFA
  if (!user.twoFactorAuth?.enabled) {
    score -= 15;
    breakdown['mfa'] = 0;
    recommendations.push('Enable two-factor authentication (MFA).');
  } else {
    breakdown['mfa'] = 100;
  }

  // 3️⃣ Password reuse
  //   if (user.reusedPasswords && user.reusedPasswords.length > 0) {
  //     score -= 15;
  //     breakdown['reuse'] = 0;
  //     recommendations.push('Avoid reusing old passwords.');
  //   } else {
  //     breakdown['reuse'] = 100;
  //   }

  // 4️⃣ Strength (hashed password fallback)
  const strengthScore = calculatePasswordStrength(user.password);
  breakdown['strength'] = strengthScore;
  if (strengthScore < 66)
    recommendations.push(
      'Consider stronger password with letters, numbers, symbols.'
    );

  score = Math.max(score, 0);

  const { tier, color } = getTierAndColor(score);

  return { score, breakdown, recommendations, tier, color };
};



export type EmailBreach = {
  Name: string;
  Domain: string;
  BreachDate: string;
}

export type EmailScoreResult = {
  email: string;
  score: number;
  tier: 'High' | 'Medium' | 'Low';
  color: 'green' | 'yellow' | 'red';
  breaches: EmailBreach[];
  recommendations: string[];
}




import crypto from 'crypto';

export const getEmailScore = async (email: string): Promise<EmailScoreResult> => {
  if (!email) throw new ApiError(httpStatus.BAD_REQUEST, 'Email is required.');

  let score = 100;
  const recommendations: string[] = [];
  const breaches: EmailBreach[] = [];

  // ----- 1️⃣ Basic format & length check -----
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    score -= 20;
    recommendations.push('Email format seems invalid.');
  }
  if (email.length < 5) {
    score -= 10;
    recommendations.push('Email is too short.');
  }

  // ----- 2️⃣ Simulated internal breach scoring -----
  const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  const hashValue = parseInt(hash.slice(0, 8), 16);

  if (hashValue % 100 < 5) {
    // High risk
    score -= 50;
    breaches.push({
      Name: 'Simulated Major Breach',
      Domain: email.split('@')[1],
      BreachDate: new Date().toISOString().slice(0, 10),
    });
    recommendations.push('Your email may have been exposed in major breaches. Change passwords and enable MFA.');
  } else if (hashValue % 100 < 20) {
    // Medium risk
    score -= 25;
    breaches.push({
      Name: 'Simulated Minor Breach',
      Domain: email.split('@')[1],
      BreachDate: new Date().toISOString().slice(0, 10),
    });
    recommendations.push('Your email may have appeared in minor breaches. Review your account security.');
  }

  // ----- 3️⃣ Domain-based heuristics -----
  const riskyDomains = ['yahoo.com', 'hotmail.com', 'aol.com', 'gmail.com']; // common target domains
  const domain = email.split('@')[1].toLowerCase();
  if (riskyDomains.includes(domain)) {
    score -= 5;
    recommendations.push('Email domain is commonly targeted. Ensure strong password and MFA.');
  }

  // ----- 4️⃣ Age & reuse scoring (optional internal metrics) -----
  // Placeholder for when you integrate with your users table
  // const user = await User.findOne({ email }).select('lastPasswordChangeAt reusedPasswords');
  // if (user && user.reusedPasswords?.length) { score -= 15; recommendations.push('Avoid reusing old passwords.'); }

  // ----- 5️⃣ Risk tier & color -----
  const { tier, color } = getTierAndColor(score);

  return {
    email,
    score,
    tier,
    color,
    breaches,
    recommendations,
  };
};


export type SecurityScoreBreakdown = {
  password: number;
  email: number;
  mfa?: number;
  loginRisk: number;
};

export type SecurityScoreResult = {
  score: number;
  tier: 'High' | 'Medium' | 'Low';
  color: 'green' | 'yellow' | 'red';
  breakdown: SecurityScoreBreakdown;
  recommendations: string[];
};





export const getSecurityScore = async (email: string): Promise<SecurityScoreResult> => {
  const passwordResult = await getPasswordScore(email);
  const emailResult = await getEmailScore(email);

  const breakdown: SecurityScoreBreakdown = {
    password: passwordResult.score,
    email: emailResult.score,
    mfa: passwordResult.breakdown.mfa, 
    loginRisk: 100, 
  };

  // Compute weighted score
const score =
  breakdown.password * 0.4 +
  breakdown.email * 0.3 +
  (breakdown.mfa ?? 0) * 0.05 +  // 5% weight, default to 0 if undefined
  breakdown.loginRisk * 0.175; // 17.5% weight

  // Combine recommendations
  const recommendations = [
    ...passwordResult.recommendations,
    ...emailResult.recommendations,
  ];

  const { tier, color } = getTierAndColor(score);

  return { score: Math.round(score), tier, color, breakdown, recommendations };
};
