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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const auth_service_1 = require("./auth.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const cors_config_1 = require("../../../config/cors.config");
const affiliate_utils_1 = require("../affiliate/affiliate.utils");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const CreateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.body;
    // Remove role from the payload (if present)
    delete user.role;
    const result = yield auth_service_1.UserService.CreateUser(user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User created successfully',
        data: result,
    });
}));
const CreateAffiliateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const key = res.locals.idempotencyKey;
    const ip = ((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0].trim()) ||
        req.connection.remoteAddress ||
        req.ip ||
        '';
    const userAgent = req.get('User-Agent') || '';
    const geo = geoip_lite_1.default.lookup(ip) || { country: null, region: null, city: null };
    const deviceFingerprint = req.headers['x-device-fingerprint'] ||
        (0, affiliate_utils_1.generateFingerprint)(ip, userAgent);
    if (!key) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Idempotency key is required');
    }
    const affiliateData = Object.assign(Object.assign({}, req.body), { role: 'affiliate', ip,
        userAgent,
        geo,
        deviceFingerprint });
    const result = yield auth_service_1.UserService.AffiliateRegister(affiliateData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate registration successful',
        data: result,
    });
}));
const CreateAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const adminPayload = req.body;
    const result = yield auth_service_1.UserService.CreateAdmin(adminPayload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Admin account created successfully.',
        data: result,
    });
}));
// Login User
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginData = req.body;
        const result = yield auth_service_1.UserService.loginUser(loginData);
        const { refreshToken } = result, others = __rest(result, ["refreshToken"]);
        // =========== Productions ===============
        const isProduction = process.env.NODE_ENV === 'production';
        // Get domain-specific cookie name and options
        const cookieOptions = (0, cors_config_1.getCookieOptions)(req.headers.origin, isProduction);
        res.cookie('refreshToken', refreshToken, cookieOptions);
        if ('refreshToken' in result) {
            delete result.refreshToken;
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'User logged in successfully',
            data: others,
        });
    }
    catch (error) {
        next(error);
    }
});
// Login User
const AffiliateLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginData = req.body;
        const result = yield auth_service_1.UserService.AffiliateLogin(loginData);
        const { refreshToken } = result, others = __rest(result, ["refreshToken"]);
        // =========== Productions ===============
        const isProduction = process.env.NODE_ENV === 'production';
        // Get domain-specific cookie name and options
        const cookieOptions = (0, cors_config_1.getCookieOptions)(req.headers.origin, isProduction);
        res.cookie('refreshToken', refreshToken, cookieOptions);
        if ('refreshToken' in result) {
            delete result.refreshToken;
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'User logged in successfully',
            data: others,
        });
    }
    catch (error) {
        next(error);
    }
});
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (!refreshToken) {
            return (0, sendResponse_1.default)(res, {
                statusCode: http_status_1.default.UNAUTHORIZED,
                success: false,
                message: 'Refresh token not found',
            });
        }
        // Call the service to refresh the token
        const result = yield auth_service_1.UserService.refreshToken(refreshToken);
        //========= Productions ===========
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = (0, cors_config_1.getCookieOptions)(req.headers.origin, isProduction);
        res.cookie('refreshToken', result.refreshToken, cookieOptions);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: result.accessToken,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
const LogoutUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Logged out successfully',
        data: null,
    });
}));
const UpdateUserRole = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { role } = req.body;
    // Call the service to update the user's role
    const updatedUser = yield auth_service_1.UserService.UpdateUserRole(id, role);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User role updated successfully',
        data: updatedUser,
    });
}));
const ResetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, newPassword } = req.body;
    // Call the service to handle the password reset logic
    yield auth_service_1.UserService.ResetPassword(token, newPassword);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Password reset successfully',
        data: null,
    });
}));
const GetProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Call the service to fetch the user's profile
    const userProfile = yield auth_service_1.UserService.GetProfile(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Profile fetched successfully',
        data: userProfile,
    });
}));
const UpdateProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const updateData = req.body;
    // Call the service to update the user's profile
    const updatedUser = yield auth_service_1.UserService.UpdateProfile(userId, updateData);
    // Send the response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
    });
}));
const ChangePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Extract userId from the authenticated request
    const { currentPassword, newPassword } = req.body; // Extract current and new passwords
    // Call the service to change the password
    yield auth_service_1.UserService.ChangePassword(userId, currentPassword, newPassword);
    // Send the response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Password changed successfully',
        data: null,
    });
}));
const GetAllUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract query parameters for pagination and filtering
    const { paginationOptions, filters } = (0, paginationHelpers_1.getPaginationAndFilters)(req);
    const result = yield auth_service_1.UserService.GetAllUsers(paginationOptions, filters);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'All User retrieved successfully',
        data: {
            data: result.data,
            meta: result.meta,
        },
    });
}));
// const ForgotPassword: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { email } = req.body;
//     // Call the service to handle the forgot password logic
//     await UserService.ForgotPassword(email);
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'Password reset email sent successfully',
//       data: null,
//     });
//   }
// );
const UpdateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const updateData = req.body;
    // Call the service to update the user
    const updatedUser = yield auth_service_1.UserService.UpdateUser(userId, updateData);
    // Send the response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
    });
}));
const DeleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id; // Extract user ID from the request parameters
    // Call the service to delete the user
    yield auth_service_1.UserService.DeleteUser(userId);
    // Send the response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User deleted successfully',
        data: null,
    });
}));
// Affiliate Related Handle
const GetPendingAffiliates = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status = 'pending' } = req.query;
    const affiliates = yield auth_service_1.UserService.GetAffiliatesByStatus(status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Pending affiliates fetched successfully',
        data: affiliates,
    });
}));
const GetAffiliateDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const affiliate = yield auth_service_1.UserService.GetAffiliateById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate details fetched successfully',
        data: affiliate,
    });
}));
const ApproveAffiliate = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const adminId = 'imran1111';
    const updatedAffiliate = yield auth_service_1.UserService.ApproveAffiliate(adminId, id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate approved successfully',
        data: updatedAffiliate,
    });
}));
const RejectAffiliate = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = 'imran';
    const updatedAffiliate = yield auth_service_1.UserService.RejectAffiliate(adminId, id, reason);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Affiliate rejected successfully',
        data: updatedAffiliate,
    });
}));
const GetAllAffiliates = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract query parameters for pagination and filtering
    const { paginationOptions, filters } = (0, paginationHelpers_1.getPaginationAndFilters)(req);
    const result = yield auth_service_1.UserService.GetAllAffiliates(paginationOptions, filters);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'All Affiliates retrieved successfully',
        data: {
            data: result.data,
            meta: result.meta,
        },
    });
}));
const GetAffiliateProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Fetching affiliate profile');
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Call the service to fetch the user's profile
    const userProfile = yield auth_service_1.UserService.GetAffiliateProfile(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Profile fetched successfully',
        data: userProfile,
    });
}));
const AdminRequestSetup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const AdminSetup = yield auth_service_1.UserService.AdminRequestSetup(email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Admin account created successfully',
        data: AdminSetup,
    });
}));
const AdminResendSetup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield auth_service_1.UserService.AdminResendSetup(email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Resent admin setup link successfully',
        data: result,
    });
}));
const AdminCompleteSetup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, password } = req.body;
    const result = yield auth_service_1.UserService.AdminCompleteSetup(token, password);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Resent admin setup link successfully',
        data: result,
    });
}));
exports.UserController = {
    CreateUser,
    CreateAffiliateUser,
    CreateAdmin,
    loginUser,
    AffiliateLogin,
    refreshToken,
    LogoutUser,
    UpdateUserRole,
    AdminRequestSetup,
    AdminResendSetup,
    AdminCompleteSetup,
    // ForgotPassword
    ResetPassword,
    GetProfile,
    UpdateProfile,
    ChangePassword,
    GetAllUsers,
    UpdateUser,
    DeleteUser,
    //   RegisterAndSubscribe,
    GetPendingAffiliates,
    GetAffiliateDetails,
    ApproveAffiliate,
    RejectAffiliate,
    GetAllAffiliates,
    GetAffiliateProfile,
};
