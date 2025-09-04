"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../../middleware/auth"));
const user_1 = require("../../../../enums/user");
const passwordHealth_controller_1 = require("./passwordHealth.controller");
const router = express_1.default.Router();
router.get('/features/password-score', (0, auth_1.default)(user_1.ENUM_USER_ROLE.AFFILIATE), passwordHealth_controller_1.PasswordController.fetchPasswordScore);
exports.PasswordRoutes = router;
