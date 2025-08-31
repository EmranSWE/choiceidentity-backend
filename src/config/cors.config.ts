import cors, { CorsOptions } from 'cors';

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = isProduction
  ? [
      'https://choiceidentity.com',
      'https://affiliate.choiceidentity.com',
      'https://admin.choiceidentity.com',
      'https://app.choiceidentity.com', 
    ]
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://affiliate.localhost:3000',
      'http://admin.localhost:3000',
      'http://app.localhost:3000',
    ];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (!isProduction) {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    try {
      const url = new URL(origin);

      if (
        url.hostname === 'choiceidentity.com' ||
        url.hostname.endsWith('choiceidentity.com')
      ) {
        return callback(null, true);
      }
    } catch (e) {
      return callback(new Error('Invalid origin'));
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);

export const getCookieOptions = (
  origin: string | undefined,
  isProduction: boolean
) => {
  const baseOptions: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (isProduction && origin) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      console.log('Setting cookie for hostname:', hostname);

      // ISOLATE COOKIES BY SPECIFIC DOMAIN
      // Only set domain for subdomains, NOT for main domain
      if (hostname === 'admin.choiceidentity.com') {
        baseOptions.domain = 'admin.choiceidentity.com';
      } else if (hostname === 'affiliate.choiceidentity.com') {
        baseOptions.domain = 'affiliate.choiceidentity.com';
      } else if (hostname === 'app.choiceidentity.com') {
        baseOptions.domain = 'app.choiceidentity.com';
      }
      // For main domain (choiceidentity.com), don't set domain property at all
      // This isolates cookies to the exact domain

    } catch (e) {
      console.warn('Failed to parse origin URL, using strict isolation:', origin);
      // On error, don't set domain for strict isolation
    }
  } else {
    // Development environment
    baseOptions.secure = false;
    
    if (origin) {
      try {
        const url = new URL(origin);
        const hostname = url.hostname;

        // For local development with subdomains
        if (hostname.includes('localhost') && hostname !== 'localhost') {
          baseOptions.domain = hostname;
        }
      } catch (e) {
        console.warn('Failed to parse origin URL for cookie settings:', origin);
      }
    }
  }

  console.log('Final cookie options:', baseOptions);
  return baseOptions;
};

export const getCookieName = (origin: string | undefined): string => {
  if (!origin) return 'refreshToken';
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Use different cookie names for different domains
    if (hostname === 'affiliate.choiceidentity.com' || hostname.includes('affiliate.localhost')) {
      return 'affiliateRefreshToken';
    }
    if (hostname === 'admin.choiceidentity.com' || hostname.includes('admin.localhost')) {
      return 'adminRefreshToken';
    }
    if (hostname === 'app.choiceidentity.com' || hostname.includes('app.localhost')) {
      return 'appRefreshToken';
    }
    
    return 'refreshToken'; // default for main domain
  } catch (e) {
    return 'refreshToken';
  }
};