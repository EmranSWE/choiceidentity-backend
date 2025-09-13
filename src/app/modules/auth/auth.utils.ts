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



// SSN encryptions
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.SSN_SECRET_KEY;
const IV_LENGTH = 16;

// Validate environment key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error(
    "SSN_SECRET_KEY must be at least 32 characters long and set in environment variables"
  );
}

// Ensure key is exactly 32 bytes
function getValidKey(): Buffer {
  const keyBuffer = Buffer.from(ENCRYPTION_KEY!, 'utf8');
  if (keyBuffer.length < 32) {
    // Pad with zeros if key is too short (better to use proper key derivation)
    const paddedKey = Buffer.alloc(32);
    keyBuffer.copy(paddedKey);
    return paddedKey;
  }
  return keyBuffer.subarray(0, 32); // Take first 32 bytes if longer
}

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getValidKey();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Return format: iv:encrypted (same as original)
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const key = getValidKey();
    
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    throw new Error("Failed to decrypt SSN: Invalid or tampered data");
  }
}

// Optional: SSN validation
export function validateSSN(ssn: string): boolean {
  const ssnRegex = /^(?!000|666)[0-8]\d{2}-(?!00)\d{2}-(?!0000)\d{4}$/;
  return ssnRegex.test(ssn);
}



export const logSuspiciousActivity = (affiliateData: any, ipReputation: any): void => {
  console.warn('Suspicious registration attempt:', {
    email: affiliateData.email,
    ip: affiliateData.ipAddress,
    riskScore: ipReputation.riskScore,
  });
};
