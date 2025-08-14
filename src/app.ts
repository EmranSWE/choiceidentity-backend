import express from 'express';
const app = express();
import cors from 'cors';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import router from './app/route';
import cookieParser from 'cookie-parser';
import httpStatus from 'http-status';
import helmet from 'helmet';
import session from 'express-session';
import config from './config';
// import { StripeWebhookController } from './app/modules/stripe/stripe.webhook';
// import morgan from 'morgan';

// Logger middleware
// app.use(morgan('dev'));

// Security middleware
app.use(helmet());
app.use(cors());
app.use(cookieParser());

// Webhook endpoint - MUST come before other body parsers
// app.post(
//   '/api/v1/payment/webhooks',
//   express.raw({ type: 'application/json' }), 
//   StripeWebhookController.handleWebhook
// );

// Regular body parsers for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' },
  })
);

// Routes
app.use('/api/v1/', router);

// 404 handler
app.use((req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'The requested resource was not found',
      },
    ],
  });
});

// Global error handler
app.use(globalErrorHandler);

export default app;