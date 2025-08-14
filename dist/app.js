"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const globalErrorHandler_1 = __importDefault(require("./app/middleware/globalErrorHandler"));
const route_1 = __importDefault(require("./app/route"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_status_1 = __importDefault(require("http-status"));
const helmet_1 = __importDefault(require("helmet"));
const express_session_1 = __importDefault(require("express-session"));
const config_1 = __importDefault(require("./config"));
// import { StripeWebhookController } from './app/modules/stripe/stripe.webhook';
// import morgan from 'morgan';
// Logger middleware
// app.use(morgan('dev'));
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
// Webhook endpoint - MUST come before other body parsers
// app.post(
//   '/api/v1/payment/webhooks',
//   express.raw({ type: 'application/json' }), 
//   StripeWebhookController.handleWebhook
// );
// Regular body parsers for other routes
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Session middleware
app.use((0, express_session_1.default)({
    secret: config_1.default.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' },
}));
// Routes
app.use('/api/v1/', route_1.default);
// 404 handler
app.use((req, res) => {
    res.status(http_status_1.default.NOT_FOUND).json({
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
app.use(globalErrorHandler_1.default);
exports.default = app;
