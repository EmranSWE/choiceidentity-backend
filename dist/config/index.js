"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Join all env file with current directory
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), './env') });
exports.default = {
    env: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    cors_origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : ['http://localhost:3000'],
    session_secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    database_url: process.env.DATABASE_URL,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    webhook: process.env.STRIPE_WEBHOOK_SECRET,
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    jwt: {
        secret: process.env.JWT_SECRET,
        expires_in: process.env.JWT_EXPIRES_IN,
        refresh_Secret: process.env.JWT_REFRESH_SECRET,
        refresh_secret_Expires: process.env.JWT_REFRESH_EXPIRES_IN,
    },
};
