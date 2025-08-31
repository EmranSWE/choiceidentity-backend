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
      // Strict origin matching - no wildcard subdomains
      if (allowedOrigins.includes(origin)) {
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

      console.log('Setting cookie for exact hostname:', hostname);

      if (hostname === 'affiliate.choiceidentity.com') {
        baseOptions.domain = 'affiliate.choiceidentity.com';
      } else if (hostname === 'admin.choiceidentity.com') {
        baseOptions.domain = 'admin.choiceidentity.com';
      } else if (hostname === 'choiceidentity.com') {
        baseOptions.domain = 'choiceidentity.com'; 
      } else if (hostname === 'app.choiceidentity.com') {
        baseOptions.domain = 'app.choiceidentity.com';
      }
      // NO fallback to parent domain

    } catch (e) {
      console.warn('Failed to parse origin URL, cookie will be restricted to api domain');
    }
  } else {
    // Development environment
    baseOptions.secure = false;
    
    if (origin) {
      try {
        const url = new URL(origin);
        const hostname = url.hostname;

        // Development subdomain isolation
        if (hostname === 'affiliate.localhost') {
          baseOptions.domain = 'affiliate.localhost';
        } else if (hostname === 'admin.localhost') {
          baseOptions.domain = 'admin.localhost';
        } else if (hostname === 'app.localhost') {
          baseOptions.domain = 'app.localhost';
        }
        // localhost and 127.0.0.1 get no domain setting
      } catch (e) {
        console.warn('Failed to parse origin URL for cookie settings:', origin);
      }
    }
  }

  console.log('Final cookie options:', baseOptions);
  return baseOptions;
};

