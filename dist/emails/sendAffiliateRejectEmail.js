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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAffiliateRejectionEmail = sendAffiliateRejectionEmail;
const mjmlRenderer_1 = require("./mjmlRenderer");
const emailClient_1 = require("./emailClient");
function sendAffiliateRejectionEmail(email, name, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const subject = 'Your Affiliate Account Has Been Rejected';
        const html = yield (0, mjmlRenderer_1.renderMjmlTemplate)('affiliateRejection', {
            name,
            reason: reason || 'No specific reason provided',
        });
        yield (0, emailClient_1.sendEmail)(email, subject, html);
    });
}
