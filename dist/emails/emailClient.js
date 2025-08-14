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
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
function sendEmail(to, subject, html) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: process.env.FROM_EMAIL,
            replyTo: process.env.SUPPORT_EMAIL,
            to: to || "mdimransheikh181@gmail.com",
            subject,
            html,
        };
        console.log(`Sending email to: ${to} with subject: ${subject}`);
        try {
            yield transporter.sendMail(mailOptions);
            // console.info('Email sent: ', info);
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    });
}
