import rateLimit from 'express-rate-limit';
import config from '../../config'; 

// Global rate limiter
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);

    const errorResponse = {
      success: false,
      statusCode: 429,
      message: 'Too many requests, please try again later.',
      errorMessage: [
        {
          path: '',
          message: 'Too many requests, please try again later.',
        },
      ],
      stack: config.env === 'development' ? new Error().stack : undefined, // Include stack trace in development only
    };

    // Send the response
    res.status(429).json(errorResponse);
  },
});


export const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);

    const errorResponse = {
      success: false,
      statusCode: 429,
      message: 'Too many requests, please try again later.',
      errorMessage: [
        {
          path: '',
          message: 'Too many requests, please try again later.',
        },
      ],
      stack: config.env === 'development' ? new Error().stack : undefined, // Include stack trace in development only
    };

    // Send the response
    res.status(429).json(errorResponse);
  }
});