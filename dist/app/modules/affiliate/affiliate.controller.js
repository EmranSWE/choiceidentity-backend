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
exports.AffiliateController = void 0;
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const affiliate_service_1 = require("./affiliate.service");
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const affiliate_utils_1 = require("./affiliate.utils");
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const createAffiliateLink = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //   if (!req.user?.id) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }
    const payload = Object.assign(Object.assign({}, req.body), { createdBy: "6898cdb4c727f16be6f94324" });
    const link = yield affiliate_service_1.AffiliateService.generateAffiliateLink(payload);
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate link created successfully',
        data: link,
    });
}));
const listAffiliateLinks = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { affiliateCode } = req.params;
    const links = yield affiliate_service_1.AffiliateService.getAllAffiliateLinks(affiliateCode);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate links retrieved successfully',
        data: links
    });
}));
const affiliateClick = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { slug } = req.params;
    const ip = ((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0].trim())
        || req.connection.remoteAddress
        || req.ip
        || '';
    const userAgent = req.get('User-Agent') || '';
    // GeoIP enrichment
    const geo = geoip_lite_1.default.lookup(ip);
    // Optional: device fingerprint from header or compute here
    const deviceFingerprint = req.headers['x-device-fingerprint'] || (0, affiliate_utils_1.generateFingerprint)(ip, userAgent);
    const redirectUrl = yield affiliate_service_1.AffiliateService.affiliateClick(slug, ip, userAgent, geo, deviceFingerprint);
    // Parse redirect URL and set secure signed cookie
    const url = new URL(redirectUrl);
    const affiliateCode = url.searchParams.get('affiliate');
    if (affiliateCode) {
        res.cookie('affiliate_code', affiliateCode, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            //   signed: true,
        });
    }
    return res.redirect(redirectUrl);
}));
const getOverview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user || user.role !== 'affiliate') {
        return res.status(http_status_1.default.FORBIDDEN).json({
            success: false,
            message: 'Unauthorized',
        });
    }
    // Delegate all logic to service
    const overview = yield affiliate_service_1.AffiliateService.getOverview(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate Overview fetched successfully',
        data: overview,
    });
}));
const listLinks = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user || user.role !== 'affiliate') {
        return res.status(http_status_1.default.FORBIDDEN).json({
            success: false,
            message: 'Unauthorized',
        });
    }
    const { paginationOptions, filters } = (0, paginationHelpers_1.getPaginationAndFilters)(req);
    // Delegate all logic to service
    const overview = yield affiliate_service_1.AffiliateService.getAffiliateLinksTable(user.userId, paginationOptions, filters);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate Overview fetched successfully',
        data: overview,
    });
}));
exports.AffiliateController = {
    listAffiliateLinks,
    createAffiliateLink,
    affiliateClick,
    getOverview,
    listLinks
};
