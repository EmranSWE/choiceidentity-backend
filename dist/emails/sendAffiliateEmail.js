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
exports.sendAffiliateApprovalEmail = sendAffiliateApprovalEmail;
const mjmlRenderer_1 = require("./mjmlRenderer");
const emailClient_1 = require("./emailClient");
function sendAffiliateApprovalEmail(email, name, referralCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const subject = 'Your Affiliate Account is Approved!';
        const html = yield (0, mjmlRenderer_1.renderMjmlTemplate)('affiliateApproval', {
            name,
            referralCode,
        });
        yield (0, emailClient_1.sendEmail)(email, subject, html);
    });
}
