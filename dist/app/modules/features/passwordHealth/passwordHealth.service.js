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
exports.getSecurityScore = exports.getEmailScore = exports.getPasswordScore = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
const apiErrors_1 = __importDefault(require("../../../../errors/apiErrors"));
const auth_model_1 = require("../../auth/auth.model");
const passwordHealth_utils_1 = require("./passwordHealth.utils");
const http_status_1 = __importDefault(require("http-status"));
const getPasswordScore = (email) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield auth_model_1.User.findOne({ email }).select({
        password: 1,
        reusedPasswords: 1,
        twoFactorAuth: 1,
        lastPasswordChangeAt: 1,
        loginHistory: 1,
    });
    if (!user)
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'User not found.');
    let score = 100;
    const breakdown = {
        length: 100,
        reuse: 100,
        breached: 100,
        strength: 0,
        mfa: ((_a = user.twoFactorAuth) === null || _a === void 0 ? void 0 : _a.enabled) ? 100 : 0,
        passwordAge: 100,
    };
    const recommendations = [];
    // 1️⃣ Password age
    if (!user.password || user.password.length < 8) {
        score -= 20;
        breakdown['length'] = 0;
        recommendations.push('Password too short, use at least 8 characters.');
    }
    else {
        breakdown['length'] = 100;
    }
    const ageDays = user.lastPasswordChangeAt
        ? Math.floor((Date.now() - new Date(user.lastPasswordChangeAt).getTime()) /
            (1000 * 60 * 60 * 24))
        : 365;
    if (ageDays > 180) {
        score -= 10;
        breakdown['passwordAge'] = 50;
        recommendations.push('Change your password if it is older than 6 months.');
    }
    else {
        breakdown['passwordAge'] = 100;
    }
    // 2️⃣ MFA
    if (!((_b = user.twoFactorAuth) === null || _b === void 0 ? void 0 : _b.enabled)) {
        score -= 15;
        breakdown['mfa'] = 0;
        recommendations.push('Enable two-factor authentication (MFA).');
    }
    else {
        breakdown['mfa'] = 100;
    }
    // 3️⃣ Password reuse
    //   if (user.reusedPasswords && user.reusedPasswords.length > 0) {
    //     score -= 15;
    //     breakdown['reuse'] = 0;
    //     recommendations.push('Avoid reusing old passwords.');
    //   } else {
    //     breakdown['reuse'] = 100;
    //   }
    // 4️⃣ Strength (hashed password fallback)
    const strengthScore = (0, passwordHealth_utils_1.calculatePasswordStrength)(user.password);
    breakdown['strength'] = strengthScore;
    if (strengthScore < 66)
        recommendations.push('Consider stronger password with letters, numbers, symbols.');
    score = Math.max(score, 0);
    const { tier, color } = (0, passwordHealth_utils_1.getTierAndColor)(score);
    return { score, breakdown, recommendations, tier, color };
});
exports.getPasswordScore = getPasswordScore;
const crypto_1 = __importDefault(require("crypto"));
const getEmailScore = (email) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email)
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Email is required.');
    let score = 100;
    const recommendations = [];
    const breaches = [];
    // ----- 1️⃣ Basic format & length check -----
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        score -= 20;
        recommendations.push('Email format seems invalid.');
    }
    if (email.length < 5) {
        score -= 10;
        recommendations.push('Email is too short.');
    }
    // ----- 2️⃣ Simulated internal breach scoring -----
    const hash = crypto_1.default.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const hashValue = parseInt(hash.slice(0, 8), 16);
    if (hashValue % 100 < 5) {
        // High risk
        score -= 50;
        breaches.push({
            Name: 'Simulated Major Breach',
            Domain: email.split('@')[1],
            BreachDate: new Date().toISOString().slice(0, 10),
        });
        recommendations.push('Your email may have been exposed in major breaches. Change passwords and enable MFA.');
    }
    else if (hashValue % 100 < 20) {
        // Medium risk
        score -= 25;
        breaches.push({
            Name: 'Simulated Minor Breach',
            Domain: email.split('@')[1],
            BreachDate: new Date().toISOString().slice(0, 10),
        });
        recommendations.push('Your email may have appeared in minor breaches. Review your account security.');
    }
    // ----- 3️⃣ Domain-based heuristics -----
    const riskyDomains = ['yahoo.com', 'hotmail.com', 'aol.com', 'gmail.com']; // common target domains
    const domain = email.split('@')[1].toLowerCase();
    if (riskyDomains.includes(domain)) {
        score -= 5;
        recommendations.push('Email domain is commonly targeted. Ensure strong password and MFA.');
    }
    // ----- 4️⃣ Age & reuse scoring (optional internal metrics) -----
    // Placeholder for when you integrate with your users table
    // const user = await User.findOne({ email }).select('lastPasswordChangeAt reusedPasswords');
    // if (user && user.reusedPasswords?.length) { score -= 15; recommendations.push('Avoid reusing old passwords.'); }
    // ----- 5️⃣ Risk tier & color -----
    const { tier, color } = (0, passwordHealth_utils_1.getTierAndColor)(score);
    return {
        email,
        score,
        tier,
        color,
        breaches,
        recommendations,
    };
});
exports.getEmailScore = getEmailScore;
const getSecurityScore = (email) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const passwordResult = yield (0, exports.getPasswordScore)(email);
    const emailResult = yield (0, exports.getEmailScore)(email);
    const breakdown = {
        password: passwordResult.score,
        email: emailResult.score,
        mfa: passwordResult.breakdown.mfa,
        loginRisk: 100,
    };
    // Compute weighted score
    const score = breakdown.password * 0.4 +
        breakdown.email * 0.3 +
        ((_a = breakdown.mfa) !== null && _a !== void 0 ? _a : 0) * 0.05 + // 5% weight, default to 0 if undefined
        breakdown.loginRisk * 0.175; // 17.5% weight
    // Combine recommendations
    const recommendations = [
        ...passwordResult.recommendations,
        ...emailResult.recommendations,
    ];
    const { tier, color } = (0, passwordHealth_utils_1.getTierAndColor)(score);
    return { score: Math.round(score), tier, color, breakdown, recommendations };
});
exports.getSecurityScore = getSecurityScore;
