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
exports.sendAdminSetupEmail = sendAdminSetupEmail;
const emailClient_1 = require("./emailClient");
function sendAdminSetupEmail(email, setupLink) {
    return __awaiter(this, void 0, void 0, function* () {
        const subject = "Admin Setup Link";
        const html = `<p>Click to setup your admin account: <a href="${setupLink}">${setupLink}</a></p>
                <p>Expires in 24 hours.</p>`;
        yield (0, emailClient_1.sendEmail)(email, subject, html);
    });
}
