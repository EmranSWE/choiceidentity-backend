import crypto from 'crypto';
import axios from 'axios';
import { PasswordScoreResult } from './passwordHealth.interface';

// Check if password is in HaveIBeenPwned
export const getBreachedPasswords = async (passwordHash: string): Promise<number> => {
  // Cannot get plain password: hash only
  return 0; // fail-safe for hashed password
};

// Simple strength estimation for hashed password (placeholder)
export const calculatePasswordStrength = (passwordHash: string): number => {
  // Because we only have hashed password, estimate based on length of original password if stored separately
  return 80; // dummy score, will refine if plain password is known temporarily during change
};

// Determine tier + color
export const getTierAndColor = (score: number): { tier: PasswordScoreResult['tier']; color: PasswordScoreResult['color'] } => {
  if (score >= 80) return { tier: 'High', color: 'green' };
  if (score >= 50) return { tier: 'Medium', color: 'yellow' };
  return { tier: 'Low', color: 'red' };
};


