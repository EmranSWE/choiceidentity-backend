"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSuspiciousActivity = exports.validateToken = exports.generateDeviceFingerprint = exports.checkIPReputation = exports.stripe = void 0;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.validateSSN = validateSSN;
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const stripe_1 = __importDefault(require("stripe"));
const ua_parser_js_1 = require("ua-parser-js");
const auth_model_1 = require("./auth.model");
exports.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil',
});
const checkIPReputation = (ip) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Simulated IP reputation check
    return {
        riskScore: 0.2,
        isVPN: false,
        isHostingProvider: false,
        country: ((_a = geoip_lite_1.default.lookup(ip)) === null || _a === void 0 ? void 0 : _a.country) || 'US',
    };
});
exports.checkIPReputation = checkIPReputation;
const generateDeviceFingerprint = (userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    const parser = new ua_parser_js_1.UAParser(userAgent);
    const result = parser.getResult();
    return {
        browser: result.browser,
        os: result.os,
        device: result.device,
        engine: result.engine,
        screen: { width: 1920, height: 1080 },
        cpu: result.cpu,
        plugins: ['Chrome PDF Viewer', 'Chromium PDF Viewer'],
    };
});
exports.generateDeviceFingerprint = generateDeviceFingerprint;
// Validate token
const validateToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenDoc = yield auth_model_1.AdminSetupToken.findOne({ token });
    if (!tokenDoc)
        throw new Error('Invalid token');
    if (tokenDoc.used)
        throw new Error('Token already used');
    if (tokenDoc.expiresAt < new Date())
        throw new Error('Token expired');
    return tokenDoc;
});
exports.validateToken = validateToken;
// SSN encryptions
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_KEY = process.env.SSN_SECRET_KEY;
const IV_LENGTH = 16;
// Validate environment key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error("SSN_SECRET_KEY must be at least 32 characters long and set in environment variables");
}
// Ensure key is exactly 32 bytes
function getValidKey() {
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf8');
    if (keyBuffer.length < 32) {
        // Pad with zeros if key is too short (better to use proper key derivation)
        const paddedKey = Buffer.alloc(32);
        keyBuffer.copy(paddedKey);
        return paddedKey;
    }
    return keyBuffer.subarray(0, 32); // Take first 32 bytes if longer
}
function encrypt(text) {
    if (!text)
        return text;
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const key = getValidKey();
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Return format: iv:encrypted (same as original)
    return iv.toString("hex") + ":" + encrypted;
}
function decrypt(encryptedText) {
    if (!encryptedText)
        return encryptedText;
    try {
        const parts = encryptedText.split(":");
        if (parts.length !== 2) {
            throw new Error("Invalid encrypted text format");
        }
        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];
        const key = getValidKey();
        const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", key, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    catch (error) {
        throw new Error("Failed to decrypt SSN: Invalid or tampered data");
    }
}
// Optional: SSN validation
function validateSSN(ssn) {
    const ssnRegex = /^(?!000|666)[0-8]\d{2}-(?!00)\d{2}-(?!0000)\d{4}$/;
    return ssnRegex.test(ssn);
}
const logSuspiciousActivity = (affiliateData, ipReputation) => {
    console.warn('Suspicious registration attempt:', {
        email: affiliateData.email,
        ip: affiliateData.ipAddress,
        riskScore: ipReputation.riskScore,
    });
};
exports.logSuspiciousActivity = logSuspiciousActivity;
