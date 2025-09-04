export type PasswordScoreBreakdown = {
  length: number;
  reuse: number;
  breached: number;
  strength: number;
  mfa?: number;
  passwordAge?: number;
}

export type PasswordScoreResult = {
  score: number;                // 0-100
  tier: 'Low' | 'Medium' | 'High';
  color: 'red' | 'yellow' | 'green';
  breakdown: PasswordScoreBreakdown;
  recommendations: string[];
}
