"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../../middleware/auth"));
const user_1 = require("../../../../enums/user");
const creditMonitoring_controller_1 = require("./creditMonitoring.controller");
const router = express_1.default.Router();
router.get('/report', (0, auth_1.default)(user_1.ENUM_USER_ROLE.CUSTOMER), creditMonitoring_controller_1.CreditController.fetchCreditReport);
exports.CreditRoutes = router;
