"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const auth_controller_1 = require("./auth.controller");
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const user_validation_1 = require("./user.validation");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const globalRateLimiter_1 = require("../../middleware/globalRateLimiter");
const router = express_1.default.Router();
router.post('/signup', (0, validateRequest_1.default)(user_validation_1.AuthValidation.userSchema), globalRateLimiter_1.globalRateLimiter, auth_controller_1.UserController.CreateUser);
router.post('/affiliate/signup', 
//   globalRateLimiter,
auth_controller_1.UserController.CreateAffiliateUser);
router.post('/affiliate-login', (0, validateRequest_1.default)(user_validation_1.AuthValidation.loginZodSchema), 
// globalRateLimiter,
auth_controller_1.UserController.AffiliateLogin);
router.post('/create-admin', auth_controller_1.UserController.CreateAdmin);
// router.post(
//   '/registration-subscribe',
// //   validateRequest(AuthValidation.userSchema),
// //   globalRateLimiter,
//   UserController.RegisterAndSubscribe
// );
router.post('/login', (0, validateRequest_1.default)(user_validation_1.AuthValidation.loginZodSchema), 
// globalRateLimiter,
auth_controller_1.UserController.loginUser);
router.post('/refresh-token', 
//   validateRequest(AuthValidation.refreshTokenZodSchema),
auth_controller_1.UserController.refreshToken);
router.post('/logout', auth_controller_1.UserController.LogoutUser);
router.patch('/users/:id/role', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN, user_1.ENUM_USER_ROLE.ADMIN), (0, validateRequest_1.default)(user_validation_1.AuthValidation.updateRoleSchema), auth_controller_1.UserController.UpdateUserRole);
// router.post('/forgot-password',  validateRequest(AuthValidation.forgotPasswordSchema),UserController.ForgotPassword);
router.post('/reset-password', (0, validateRequest_1.default)(user_validation_1.AuthValidation.resetPasswordSchema), auth_controller_1.UserController.ResetPassword);
// router.post('/verify-email', UserController.verifyEmail);
// Protected Routes (User)
router.get('/profile', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN, user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.CUSTOMER, user_1.ENUM_USER_ROLE.AFFILIATE), auth_controller_1.UserController.GetProfile);
router.patch('/profile', (0, auth_1.default)(user_1.ENUM_USER_ROLE.CUSTOMER, user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.AFFILIATE), (0, validateRequest_1.default)(user_validation_1.AuthValidation.updateUserSchema), auth_controller_1.UserController.UpdateProfile);
router.post('/change-password', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN, user_1.ENUM_USER_ROLE.ADMIN, user_1.ENUM_USER_ROLE.CUSTOMER), (0, validateRequest_1.default)(user_validation_1.AuthValidation.ChangePasswordValidation), auth_controller_1.UserController.ChangePassword);
// router.post('/send-verification-email', auth(ENUM_USER_ROLE.USER), UserController.sendVerificationEmail);
// router.post('/enable-2fa', auth(ENUM_USER_ROLE.USER), UserController.enableTwoFactorAuth);
// router.post('/disable-2fa', auth(ENUM_USER_ROLE.USER), UserController.disableTwoFactorAuth);
// Protected Routes (Admin & Super Admin)
router.post('/admin/request-setup', auth_controller_1.UserController.AdminRequestSetup);
router.post('/admin/resend-setup', auth_controller_1.UserController.AdminResendSetup);
router.post('/admin/complete-setup', auth_controller_1.UserController.AdminCompleteSetup);
router.get('/admin/all-users', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN), auth_controller_1.UserController.GetAllUsers);
router.patch('/admin/update-users/:id', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN, user_1.ENUM_USER_ROLE.ADMIN), (0, validateRequest_1.default)(user_validation_1.AuthValidation.updateUserValidation), auth_controller_1.UserController.UpdateUser);
router.delete('/admin/delete-users/:id', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN, user_1.ENUM_USER_ROLE.ADMIN), auth_controller_1.UserController.DeleteUser);
router.get('/admin/all-affiliates', auth_controller_1.UserController.GetAllAffiliates);
router.get("/admin/pending-affiliates", auth_controller_1.UserController.GetPendingAffiliates);
router.get("/admin/affiliate-details/:id", auth_controller_1.UserController.GetAffiliateDetails);
router.patch("/admin/affiliate-update/:id/approve", auth_controller_1.UserController.ApproveAffiliate);
router.patch("/admin/affiliate-update/:id/reject", auth_controller_1.UserController.RejectAffiliate);
router.get('/affiliate/me', (0, auth_1.default)(user_1.ENUM_USER_ROLE.AFFILIATE), auth_controller_1.UserController.GetAffiliateProfile);
exports.AuthRouter = router;
