import { UserController } from './auth.controller';
import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { AuthValidation } from './user.validation';
import auth from '../../middleware/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { globalRateLimiter } from '../../middleware/globalRateLimiter';
import { idempotencyMiddleware } from '../../middleware/idempotencyMiddleware';

const router = express.Router();

router.post(
  '/signup',
  validateRequest(AuthValidation.userSchema),
  globalRateLimiter,
  UserController.CreateUser
);

router.post(
  '/affiliate/signup',
  idempotencyMiddleware(),
//   globalRateLimiter,
  UserController.CreateAffiliateUser
);

router.post(
  '/affiliate-login',
  validateRequest(AuthValidation.loginZodSchema),
  // globalRateLimiter,
  UserController.AffiliateLogin
);

router.post('/create-admin', UserController.CreateAdmin);
// router.post(
//   '/registration-subscribe',
// //   validateRequest(AuthValidation.userSchema),
// //   globalRateLimiter,
//   UserController.RegisterAndSubscribe
// );

router.post(
  '/login',
  validateRequest(AuthValidation.loginZodSchema),
  // globalRateLimiter,
  UserController.loginUser
);

router.post(
  '/refresh-token',
//   validateRequest(AuthValidation.refreshTokenZodSchema),
  UserController.refreshToken
);
router.post('/logout', UserController.LogoutUser);

router.patch(
  '/users/:id/role',
  auth(ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN),
  validateRequest(AuthValidation.updateRoleSchema),
  UserController.UpdateUserRole
);
// router.post('/forgot-password',  validateRequest(AuthValidation.forgotPasswordSchema),UserController.ForgotPassword);
router.post('/reset-password',  validateRequest(AuthValidation.resetPasswordSchema), UserController.ResetPassword);
// router.post('/verify-email', UserController.verifyEmail);

// Protected Routes (User)
router.get('/profile', auth(ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN,ENUM_USER_ROLE.CUSTOMER,ENUM_USER_ROLE.AFFILIATE), UserController.GetProfile);
router.patch('/profile', auth(ENUM_USER_ROLE.CUSTOMER,ENUM_USER_ROLE.ADMIN,ENUM_USER_ROLE.AFFILIATE),validateRequest(AuthValidation.updateUserSchema), UserController.UpdateProfile);
router.post('/change-password', auth(ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN,ENUM_USER_ROLE.CUSTOMER), validateRequest(AuthValidation.ChangePasswordValidation), UserController.ChangePassword);
// router.post('/send-verification-email', auth(ENUM_USER_ROLE.USER), UserController.sendVerificationEmail);
// router.post('/enable-2fa', auth(ENUM_USER_ROLE.USER), UserController.enableTwoFactorAuth);
// router.post('/disable-2fa', auth(ENUM_USER_ROLE.USER), UserController.disableTwoFactorAuth);

// Protected Routes (Admin & Super Admin)
router.post('/admin/request-setup', UserController.AdminRequestSetup);
router.post('/admin/resend-setup', UserController.AdminResendSetup);
router.post('/admin/complete-setup', UserController.AdminCompleteSetup);

router.get('/admin/all-users', auth(ENUM_USER_ROLE.SUPER_ADMIN), UserController.GetAllUsers);
router.patch('/admin/update-users/:id', auth(ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN),validateRequest(AuthValidation.updateUserValidation), UserController.UpdateUser);
router.delete('/admin/delete-users/:id', auth(ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN), UserController.DeleteUser);


router.get('/admin/all-affiliates',  UserController.GetAllAffiliates);
router.get("/admin/pending-affiliates",  UserController.GetPendingAffiliates);
router.get("/admin/affiliate-details/:id",  UserController.GetAffiliateDetails);
router.patch("/admin/affiliate-update/:id/approve",  UserController.ApproveAffiliate);
router.patch("/admin/affiliate-update/:id/reject",  UserController.RejectAffiliate);

router.get('/affiliate/me',auth(ENUM_USER_ROLE.AFFILIATE), UserController.GetAffiliateProfile);
export const AuthRouter = router;
