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
    sameSite: isProduction ? 'lax' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (isProduction) {
    // ============ ADD THIS SECTION ============
    // Set domain-specific cookies
    if (origin?.includes('admin.choiceidentity.com')) {
      baseOptions.domain = 'admin.choiceidentity.com'; 
    } else if (origin?.includes('affiliate.choiceidentity.com')) {
      baseOptions.domain = 'affiliate.choiceidentity.com'; 
    } else {
      baseOptions.domain = 'choiceidentity.com';
    }
    // ============ END OF ADDITION ============

    baseOptions.sameSite = 'lax';
  } else {
    baseOptions.secure = false;
    baseOptions.sameSite = 'lax';
    if (origin) {
      try {
        const url = new URL(origin);

        if (
          url.hostname.includes('localhost') &&
          url.hostname !== 'localhost' &&
          url.hostname !== '127.0.0.1'
        ) {
          baseOptions.domain = url.hostname;
        }
      } catch (e) {
        console.warn('Failed to parse origin URL for cookie settings:', origin);
      }
    }
  }

  return baseOptions;
};
