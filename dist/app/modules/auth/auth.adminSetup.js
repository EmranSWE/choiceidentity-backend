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
exports.ensureAdmin = ensureAdmin;
// services/adminSetup.ts
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const auth_model_1 = require("./auth.model");
function ensureAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield auth_model_1.User.findOne({ role: "admin" });
        if (existing)
            return;
        const token = crypto_1.default.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
        yield auth_model_1.AdminSetupToken.create({ email: process.env.ADMIN_EMAIL, token, expiresAt });
        const setupLink = `${process.env.FRONTEND_URL}/admin/setup?token=${token}`;
        const transporter = nodemailer_1.default.createTransport(process.env.MAILER_DSN);
        yield transporter.sendMail({
            from: `no-reply@${process.env.APP_DOMAIN}`,
            to: process.env.ADMIN_EMAIL,
            subject: "Admin Setup Link",
            text: `Click to setup your admin account: ${setupLink}\nExpires in 24 hours.`,
        });
        console.log(`✅ Admin setup link sent to ${process.env.ADMIN_EMAIL}`);
    });
}
