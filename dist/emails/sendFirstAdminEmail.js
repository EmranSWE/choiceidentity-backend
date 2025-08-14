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
exports.sendFirstAdminEmail = void 0;
const auth_model_1 = require("../app/modules/auth/auth.model");
const auth_service_1 = require("../app/modules/auth/auth.service");
const sendFirstAdminEmail = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingAdmin = yield auth_model_1.User.findOne({ role: 'admin' });
        if (!existingAdmin) {
            yield auth_service_1.UserService.AdminRequestSetup(process.env.ADMIN_EMAIL);
        }
    }
    catch (err) {
        console.error('Failed to send first admin email:', err);
    }
});
exports.sendFirstAdminEmail = sendFirstAdminEmail;
