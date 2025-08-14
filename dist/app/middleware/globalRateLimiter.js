"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupRateLimiter = exports.globalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../../config"));
// Global rate limiter
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
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
            stack: config_1.default.env === 'development' ? new Error().stack : undefined, // Include stack trace in development only
        };
        // Send the response
        res.status(429).json(errorResponse);
    },
});
exports.signupRateLimiter = (0, express_rate_limit_1.default)({
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
            stack: config_1.default.env === 'development' ? new Error().stack : undefined, // Include stack trace in development only
        };
        // Send the response
        res.status(429).json(errorResponse);
    }
});
