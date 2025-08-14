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
exports.generateUniqueReferralCode = generateUniqueReferralCode;
const nanoid_1 = require("nanoid");
const http_status_1 = __importDefault(require("http-status"));
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const auth_model_1 = require("./auth.model");
const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateUniqueReferralCode() {
    return __awaiter(this, arguments, void 0, function* (options = {}) {
        const { length = 10, charset = DEFAULT_CHARSET, maxRetries = 10, } = options;
        // Create the nanoid generator once with the custom alphabet and length
        const nanoidGenerator = (0, nanoid_1.customAlphabet)(charset, length);
        let attempts = 0;
        while (attempts < maxRetries) {
            attempts++;
            // Generate code with the custom nanoid generator
            const code = nanoidGenerator();
            // Check if code exists in DB
            const exists = yield auth_model_1.User.exists({ 'affiliateDetails.referralCode': code });
            if (!exists) {
                return code; // Unique code found
            }
        }
        throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to generate unique referral code. Please try again.');
    });
}
