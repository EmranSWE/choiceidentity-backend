"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCookieOptions = exports.corsMiddleware = exports.corsOptions = void 0;
const cors_1 = __importDefault(require("cors"));
const isProduction = process.env.NODE_ENV === 'production';
// ✅ COMPLETE list of allowed origins
const allowedOrigins = isProduction
    ? [
        'https://choiceidentity.com',
        'https://www.choiceidentity.com',
        'https://affiliate.choiceidentity.com',
        'https://admin.choiceidentity.com',
        'https://app.choiceidentity.com',
        'https://api.choiceidentity.com',
    ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:4000',
        'http://127.0.0.1:4000',
        'http://affiliate.localhost:3000',
        'http://admin.localhost:3000',
        'http://app.localhost:3000',
        'http://www.localhost:3000',
        'http://api.localhost:3000',
    ];
// ✅ Debug CORS configuration
exports.corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin
        if (!origin)
            return callback(null, true);
        // Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
exports.corsMiddleware = (0, cors_1.default)(exports.corsOptions);
const getCookieOptions = (origin, isProduction) => {
    const baseOptions = {
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
            if (hostname.includes('affiliate')) {
                baseOptions.domain = 'affiliate.choiceidentity.com';
            }
            else if (hostname.includes('admin')) {
                baseOptions.domain = 'admin.choiceidentity.com';
            }
            else if (hostname.includes('app')) {
                baseOptions.domain = 'app.choiceidentity.com';
            }
            else if (hostname.includes('www')) {
                baseOptions.domain = 'www.choiceidentity.com';
            }
            else {
                baseOptions.domain = 'choiceidentity.com';
            }
        }
        catch (e) {
            console.warn('Failed to parse origin URL, cookie will be restricted to api domain');
        }
    }
    else {
        baseOptions.secure = false;
    }
    return baseOptions;
};
exports.getCookieOptions = getCookieOptions;
