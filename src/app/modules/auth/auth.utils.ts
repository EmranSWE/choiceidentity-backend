import  geoip from 'geoip-lite';
import Stripe from 'stripe';
import { UAParser } from 'ua-parser-js';
import { AdminSetupToken } from './auth.model';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});


export const checkIPReputation = async (ip: string):Promise<any> => {
  // Simulated IP reputation check
  return {
    riskScore: 0.2,
    isVPN: false,
    isHostingProvider: false,
    country: geoip.lookup(ip)?.country || 'US',
  };
};

export const generateDeviceFingerprint = async (userAgent: string): Promise<any> => {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    return {
        browser: result.browser,
        os: result.os,
        device: result.device,
        engine: result.engine,
        screen: { width: 1920, height: 1080 },
        cpu:result.cpu,
        plugins: ['Chrome PDF Viewer', 'Chromium PDF Viewer'],
    };
};


// Validate token
export const validateToken = async (token: string) => {
  const tokenDoc = await AdminSetupToken.findOne({ token });
  if (!tokenDoc) throw new Error('Invalid token');
  if (tokenDoc.used) throw new Error('Token already used');
  if (tokenDoc.expiresAt < new Date()) throw new Error('Token expired');
  return tokenDoc;
};
