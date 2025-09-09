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
exports.validateToken = exports.generateDeviceFingerprint = exports.checkIPReputation = exports.stripe = void 0;
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
