"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateRoutes = void 0;
const express_1 = __importDefault(require("express"));
const affiliate_controller_1 = require("./affiliate.controller");
const router = express_1.default.Router();
router.post('/generate', affiliate_controller_1.AffiliateController.createAffiliateLink);
router.get('/:affiliateCode', affiliate_controller_1.AffiliateController.listAffiliateLinks);
router.get('/click/:slug', affiliate_controller_1.AffiliateController.affiliateClick);
exports.affiliateRoutes = router;
