"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.UserService = exports.AdminCompleteSetup = exports.validateToken = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
const http_status_1 = __importDefault(require("http-status"));
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const auth_model_1 = require("./auth.model");
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_1 = require("../../../enums/user");
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const mongoose_1 = __importStar(require("mongoose"));
const auth_lib_1 = require("./auth.lib");
const sendAffiliateEmail_1 = require("../../../emails/sendAffiliateEmail");
const sendAffiliateRejectEmail_1 = require("../../../emails/sendAffiliateRejectEmail");
const crypto_1 = require("crypto");
const emailClient_1 = require("../../../emails/emailClient");
const CreateUser = (UserData) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if email already exists
    const isUserExist = yield auth_model_1.User.isUserExist(UserData.email);
    if (isUserExist) {
        throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Signup failed. Please check your details and try again.');
    }
    // Set default role to 'user' if not provided
    if (!UserData.role) {
        UserData.role = user_1.ENUM_USER_ROLE.CUSTOMER;
    }
    // Create a new user
    const createUser = yield auth_model_1.User.create(UserData);
    if (!createUser) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Signup failed. Please try again.');
    }
    return createUser;
});
const CreateAffiliate = (affiliateData) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Affiliate data', affiliateData);
    // 1. Check if email already exists
    const isUserExist = yield auth_model_1.User.isUserExist(affiliateData.email);
    if (isUserExist) {
        throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Signup failed. Email already in use.');
    }
    // 2. Force role to affiliate
    affiliateData.role = user_1.ENUM_USER_ROLE.AFFILIATE;
    // 3. Optional: validate affiliateProfile exists and required fields (can be moved to validation layer)
    if (!affiliateData.affiliateProfile) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Affiliate profile details are required.');
    }
    if (!affiliateData.affiliateProfile.agreeTerms) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'You must agree to the terms.');
    }
    // 4. Create user using existing create method
    const createdAffiliate = yield auth_model_1.User.create(affiliateData);
    if (!createdAffiliate) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Affiliate signup failed. Please try again.');
    }
    return createdAffiliate;
});
const CreateAdmin = (adminPayload) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure email is not already used
    const isUserExist = yield auth_model_1.User.isUserExist(adminPayload.email);
    if (isUserExist) {
        throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Email already in use');
    }
    // Force role to admin
    adminPayload.role = user_1.ENUM_USER_ROLE.ADMIN;
    // Create admin
    const createAdmin = yield auth_model_1.User.create(adminPayload);
    if (!createAdmin) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Failed to create admin account');
    }
    return createAdmin;
});
//Login user
const loginUser = (loginData) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = loginData;
    // Check is user exist
    const isUserExist = yield auth_model_1.User.isUserExist(email);
    if (!isUserExist) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid credentials.');
    }
    //Matching the password
    if (isUserExist.password &&
        !(yield auth_model_1.User.isPasswordMatched(password, isUserExist === null || isUserExist === void 0 ? void 0 : isUserExist.password))) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Password is incorrect');
    }
    const { email: userEmail, _id, role } = isUserExist;
    // Access token
    const accessToken = jwtHelpers_1.jwtHelpers.createToken({ userId: _id, email: userEmail, role }, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    const refreshToken = jwtHelpers_1.jwtHelpers.createToken({ email: userEmail, role }, config_1.default.jwt.refresh_Secret, config_1.default.jwt.refresh_secret_Expires);
    return {
        accessToken,
        refreshToken,
    };
});
//Login user
const AffiliateLogin = (loginData) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = loginData;
    // Check is user exist
    const isUserExist = yield auth_model_1.User.isUserExist(email);
    if (!isUserExist) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid credentials.');
    }
    //@ts-ignore
    if (isUserExist.accountStatus === 'banned') {
        throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'Your account was banned. Please contact with support teams.');
    }
    if (isUserExist.role === 'affiliate') {
        //@ts-ignore
        if (isUserExist.affiliateProfile.approvalStatus === 'pending') {
            throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'Your account is pending admin approval. Please wait for approval email.');
        }
        // @ts-ignore
        if (isUserExist.affiliateProfile.approvalStatus === 'rejected') {
            throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'Your application was rejected. Please contact support.');
        }
    }
    //Matching the password
    if (isUserExist.password &&
        !(yield auth_model_1.User.isPasswordMatched(password, isUserExist === null || isUserExist === void 0 ? void 0 : isUserExist.password))) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Password is incorrect');
    }
    const { email: userEmail, _id, role } = isUserExist;
    // Access token
    const accessToken = jwtHelpers_1.jwtHelpers.createToken({ userId: _id, email: userEmail, role }, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    const refreshToken = jwtHelpers_1.jwtHelpers.createToken({ email: userEmail, role }, config_1.default.jwt.refresh_Secret, config_1.default.jwt.refresh_secret_Expires);
    return {
        accessToken,
        refreshToken,
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("RefreshToken In Service", token);
    let verifiedToken = null;
    try {
        verifiedToken = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.refresh_Secret);
        console.log('Verified kina', verifiedToken);
    }
    catch (error) {
        throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'Invalid refresh token');
    }
    const { email } = verifiedToken;
    if (!email) {
        throw new apiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid token payload');
    }
    // Check if the user exists
    const isUserExist = yield auth_model_1.User.isUserExist(email);
    if (!isUserExist) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User does not exist');
    }
    // Generate a new access token
    const newAccessToken = jwtHelpers_1.jwtHelpers.createToken({
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role,
    }, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    // Generate a new refresh token
    const newRefreshToken = jwtHelpers_1.jwtHelpers.createToken({
        email: isUserExist.email,
        role: isUserExist.role,
    }, config_1.default.jwt.refresh_Secret, config_1.default.jwt.refresh_secret_Expires);
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
});
const UpdateUserRole = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the user exists
    const user = yield auth_model_1.User.findById(userId);
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // Update the user's role
    user.role = role;
    yield user.save();
    return user;
});
// const ForgotPassword = async (email: string) => {
//   // Check if the user exists
//   const user = await User.findOne({ email });
//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
//   }
//   // Generate a password reset token
//   const resetToken = crypto.randomBytes(20).toString('hex');
//   const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
//   // Save the token and expiry in the database
//   user.resetPasswordToken = resetToken;
//   user.resetPasswordExpiry = resetTokenExpiry;
//   await user.save();
//   // Send the password reset email
//   const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
//   const emailText = `You are receiving this email because you (or someone else) has requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
//   await sendEmail({
//     to: user.email,
//     subject: 'Password Reset Request',
//     text: emailText,
//   });
// };
const ResetPassword = (token, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the user by the reset token
    const user = yield auth_model_1.User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid or expired token');
    }
    // Hash the new password
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
    // Update the user's password
    user.password = hashedPassword;
    //@ts-ignore
    user.resetPasswordToken = undefined;
    //@ts-ignore
    user.resetPasswordExpiry = undefined;
    yield user.save();
});
const GetProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpiry');
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return user;
});
const UpdateProfile = (userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const allowedFields = [
        'name',
        'email',
        'phone',
        'address',
        'shippingAddresses',
    ];
    const filteredUpdateData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
    }, {});
    // Check if the email is being updated
    if (filteredUpdateData.email) {
        // Find if another user already has this email
        const existingUser = yield auth_model_1.User.findOne({
            email: filteredUpdateData.email,
        });
        // If another user has this email, throw an error
        if (existingUser && existingUser._id.toString() !== userId) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Email already in use');
        }
    }
    // Find the user by ID and update the profile
    const user = yield auth_model_1.User.findByIdAndUpdate(userId, filteredUpdateData, {
        new: true, // Return the updated document
        runValidators: true, // Run Mongoose validation on update
    }).select('-password -resetPasswordToken -resetPasswordExpiry'); // Exclude sensitive fields
    // If the user is not found, throw a 404 error
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return user;
});
const ChangePassword = (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the user by ID and include the password field
    const user = yield auth_model_1.User.findById(userId).select('+password');
    // If the user is not found, throw a 404 error
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // Verify the current password
    const isPasswordMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isPasswordMatch) {
        throw new apiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'Current password is incorrect');
    }
    // Hash the new password
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
    // Update the user's password
    user.password = hashedPassword;
    yield user.save();
});
const GetAllUsers = (paginationOptions, filters) => __awaiter(void 0, void 0, void 0, function* () {
    // Calculate pagination options
    const { skip, limit, sortBy, sortOrder } = (0, paginationHelpers_1.calculatePagination)(paginationOptions);
    // Define sorting conditions
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder;
    }
    // Define filtering conditions
    const andConditions = [];
    // Search by multiple fields
    if (filters.searchTerm) {
        andConditions.push({
            $or: [
                { name: { $regex: filters.searchTerm, $options: 'i' } },
                { email: { $regex: filters.searchTerm, $options: 'i' } },
                { phone: { $regex: filters.searchTerm, $options: 'i' } },
            ],
        });
    }
    // Filter by role
    if (filters.role) {
        andConditions.push({ role: filters.role });
    }
    // Filter by gender
    if (filters.gender) {
        andConditions.push({ gender: filters.gender });
    }
    // Filter by verification status
    if (filters.isVerified !== undefined) {
        andConditions.push({ isVerified: filters.isVerified });
    }
    // Combine filtering conditions
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    // Fetch users with pagination, sorting, and filtering
    const users = yield auth_model_1.User.find(whereConditions)
        .sort(sortConditions)
        .skip(skip)
        .limit(limit)
        .select('-password -resetPasswordToken -resetPasswordExpiry'); // Exclude sensitive fields
    // Get the total count of users (for pagination metadata)
    const total = yield auth_model_1.User.countDocuments(whereConditions);
    // Throw an error if no users are found
    if (users.length === 0) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'No users found');
    }
    return {
        data: users,
        meta: {
            page: paginationOptions.page || 1,
            limit,
            total,
        },
    };
});
const UpdateUser = (userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    // Define allowed fields that can be updated
    const allowedFields = [
        'name',
        'email',
        'phone',
        'address',
        'profilePicture',
        'gender',
        'dateOfBirth',
    ];
    // Filter out disallowed fields
    const filteredUpdateData = Object.keys(updateData)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
        // Ensure the value is not undefined before assigning
        if (updateData[key] !== undefined) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            obj[key] = updateData[key];
        }
        return obj;
    }, {});
    // Check if the email is being updated
    if (filteredUpdateData.email) {
        // Find if another user already has this email
        const existingUser = yield auth_model_1.User.findOne({
            email: filteredUpdateData.email,
        });
        // If another user has this email, throw an error
        if (existingUser && existingUser._id.toString() !== userId) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Email already in use');
        }
    }
    // Find the user by ID and update the profile
    const user = yield auth_model_1.User.findByIdAndUpdate(userId, filteredUpdateData, {
        new: true, // Return the updated document
        runValidators: true, // Run Mongoose validation on update
    }).select('-password -resetPasswordToken -resetPasswordExpiry'); // Exclude sensitive fields
    // If the user is not found, throw a 404 error
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return user;
});
const DeleteUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the user by ID and delete it
    const user = yield auth_model_1.User.findByIdAndDelete(userId);
    // If the user is not found, throw a 404 error
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
});
// export const RegisterAndSubscribe = async (userData: any) => {
//   console.log('User data', userData);
//   const { name, email, password, priceId } = userData;
//   try {
//     //     // Step 1: Create the user with pending status
//     //     const user = await User.create({
//     //       name,
//     //       email,
//     //       password, // Ensure it's hashed in a pre-save middleware!
//     //       isActive: false,
//     //       subscriptionStatus: 'pending',
//     //     });
//     // console.log("Userr",user)
//     // Step 2: Create Stripe Customer
//     // const customer = await stripe.customers.create({
//     //   email,
//     //   metadata: {
//     //     userId: "1312424252",
//     //   },
//     // });
//     // // Step 3: Create Stripe Checkout Session
//     // const session = await stripe.checkout.sessions.create({
//     //   mode: 'subscription',
//     //   customer: customer.id,
//     //   payment_method_types: ['card'],
//     //   line_items: [
//     //     {
//     //       price: priceId,
//     //       quantity: 1,
//     //     },
//     //   ],
//     //   success_url: `http://localhost:3000/register/success?session_id={CHECKOUT_SESSION_ID}`,
//     //   cancel_url: `http://localhost:3000/register/cancel`,
//     // });
//     const priceMapping = getPriceMapping(userData.priceId);
//     if (!priceMapping) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         `Invalid price ID: ${userData.priceId}`
//       );
//     }
//     const mode =
//       userData.mode ||
//       (priceMapping.type === 'recurring' ? 'subscription' : 'payment');
//     const lineItems = [
//       {
//         price_data: {
//           currency: priceMapping.currency,
//           unit_amount: priceMapping.amount,
//           ...(mode === 'subscription' && {
//             recurring: {
//               interval: priceMapping.interval || 'month',
//             },
//           }),
//           product_data: {
//             name: priceMapping.name,
//           },
//         },
//         quantity: 1,
//       },
//     ];
//     const session = await stripe.checkout.sessions.create({
//       mode,
//       line_items: lineItems,
//       success_url: `http://localhost:3000/register/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `http://localhost:3000/register/cancel`,
//       metadata: {
//         priceId: userData.priceId,
//         userId: userData.userId || 'anonymous',
//         planName: priceMapping.name,
//         ...userData.metadata,
//       },
//       expires_at: Math.floor(Date.now() / 1000) + 1800,
//       ...(userData.userId && {
//         customer_email: undefined,
//       }),
//     });
//     console.log('Customer data', session);
//     // Step 4: Update user with Stripe details
//     // user.stripeCustomerId = customer.id;
//     // user.checkoutSessionId = session.id;
//     // await user.save();
//     // Return session URL to `redirect frontend
//     return { checkoutUrl: session.url };
//   } catch (error: any) {
//     console.error('RegisterAndSubscribe Error:', error);
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Registration and subscription failed'
//     );
//   }
// };
const GetAffiliatesByStatus = (status) => __awaiter(void 0, void 0, void 0, function* () {
    return auth_model_1.User.find({
        role: 'affiliate',
        'affiliateProfile.approvalStatus': status,
    }).select('+affiliateProfile');
});
const GetAffiliateById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid affiliate ID');
    }
    const affiliate = yield auth_model_1.User.findById(id).select('-password');
    if (!affiliate) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Affiliate not found');
    }
    return affiliate;
});
const ApproveAffiliate = (adminId, affiliateId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!mongoose_1.default.Types.ObjectId.isValid(affiliateId)) {
        throw new apiErrors_1.default(400, 'Invalid affiliate ID');
    }
    // Use transaction for atomicity
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const affiliate = yield auth_model_1.User.findById(affiliateId)
            .session(session)
            .select('+affiliateProfile');
        if (!affiliate)
            throw new apiErrors_1.default(404, 'Affiliate not found');
        if (affiliate.role !== user_1.ENUM_USER_ROLE.AFFILIATE) {
            throw new apiErrors_1.default(400, 'User is not an affiliate');
        }
        if (((_a = affiliate.affiliateProfile) === null || _a === void 0 ? void 0 : _a.approvalStatus) === 'approved') {
            throw new apiErrors_1.default(400, 'Affiliate already approved');
        }
        // Ensure affiliateDetails exists, create if not
        if (!affiliate.affiliateDetails) {
            affiliate.affiliateDetails = {
                referralCode: yield (0, auth_lib_1.generateUniqueReferralCode)(),
                commissionBalance: 0,
                payoutHistory: [],
                performanceMetrics: {
                    clicks: 0,
                    signups: 0,
                    conversions: 0,
                },
            };
        }
        else if (!affiliate.affiliateDetails.referralCode) {
            // Only generate referral code if missing
            affiliate.affiliateDetails.referralCode =
                yield (0, auth_lib_1.generateUniqueReferralCode)();
        }
        // Update approval status and verification
        affiliate.affiliateProfile = affiliate.affiliateProfile || {};
        affiliate.affiliateProfile.approvalStatus = 'approved';
        affiliate.kycStatus = 'verified';
        affiliate.isVerified = true;
        affiliate.updatedAt = new Date();
        // Optionally log the approval (pseudo example)
        if (!affiliate.auditLog) {
            affiliate.auditLog = [];
        }
        affiliate.auditLog.push({
            action: 'affiliate_approved',
            timestamp: new Date(),
            ip: '',
            userAgent: '',
            details: `Approved by admin ${adminId}, referralCode: ${affiliate.affiliateDetails.referralCode}`,
        });
        // Save the affiliate with the session
        yield affiliate.save({ session });
        // Commit transaction
        yield session.commitTransaction();
        session.endSession();
        // Send approval email asynchronously (don't block DB)
        yield (0, sendAffiliateEmail_1.sendAffiliateApprovalEmail)(affiliate.email, affiliate.name, affiliate.affiliateDetails.referralCode).catch(err => {
            // Log but don’t block user approval if email fails
            console.error('Failed to send approval email:', err);
        });
        return affiliate;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const RejectAffiliate = (adminId, affiliateId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(affiliateId)) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid affiliate ID');
    }
    const affiliate = yield auth_model_1.User.findById(affiliateId).select('+affiliateProfile');
    if (!affiliate) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Affiliate not found');
    }
    affiliate.affiliateProfile.approvalStatus = 'rejected';
    affiliate.kycStatus = 'rejected';
    affiliate.isVerified = false;
    if (reason) {
        affiliate.affiliateProfile.adminNotes = reason;
    }
    affiliate.updatedAt = new Date();
    affiliate.auditLog = affiliate.auditLog || [];
    affiliate.auditLog.push({
        action: 'affiliate_rejected',
        timestamp: new Date(),
        ip: '',
        userAgent: '',
        details: `Rejected by admin ${adminId}${reason ? `, Reason: ${reason}` : ''}`,
    });
    yield affiliate.save();
    // Send rejection email asynchronously; don’t block rejection if email fails
    (0, sendAffiliateRejectEmail_1.sendAffiliateRejectionEmail)(affiliate.email, affiliate.name, reason).catch(err => {
        console.error('Failed to send rejection email:', err);
    });
    return affiliate;
});
const GetAllAffiliates = (paginationOptions, filters) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, limit, sortBy, sortOrder } = (0, paginationHelpers_1.calculatePagination)(paginationOptions);
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder;
    }
    // Start with role=Affiliate filter
    const andConditions = [{ role: user_1.ENUM_USER_ROLE.AFFILIATE }];
    // Search by multiple fields
    if (filters.searchTerm) {
        andConditions.push({
            $or: [
                { name: { $regex: filters.searchTerm, $options: 'i' } },
                { email: { $regex: filters.searchTerm, $options: 'i' } },
                { phone: { $regex: filters.searchTerm, $options: 'i' } },
            ],
        });
    }
    // Combine filtering conditions
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    // Query with pagination, sorting, and filters
    const users = yield auth_model_1.User.find(whereConditions)
        .sort(sortConditions)
        .skip(skip)
        .limit(limit)
        .select('+affiliateProfile');
    // Total count for metadata
    const total = yield auth_model_1.User.countDocuments(whereConditions);
    // Return empty data array if none found, avoid throwing error here
    return {
        data: users,
        meta: {
            page: paginationOptions.page || 1,
            limit,
            total,
        },
    };
});
const GetAffiliateProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpiry');
    if (!user) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return user;
});
const AdminRequestSetup = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const adminEmail = email || process.env.ADMIN_EMAIL;
    if (!adminEmail)
        throw new apiErrors_1.default(400, 'Admin email not set in .env');
    // Check if already SUPER_ADMIN exists
    const existingAdmin = yield auth_model_1.User.findOne({ role: 'SUPER_ADMIN' });
    if (existingAdmin)
        throw new apiErrors_1.default(http_status_1.default.METHOD_NOT_ALLOWED, 'SUPER_ADMIN already exists');
    // Generate token
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const tokenDoc = yield auth_model_1.AdminSetupToken.create({ email: adminEmail, token, expiresAt });
    // Send email
    const setupLink = `${process.env.FRONTEND_ADMIN_URL}/setup?token=${token}`;
    yield (0, emailClient_1.sendEmail)(adminEmail, 'Your Admin Setup Link', `Click here to setup your SUPER_ADMIN account: ${setupLink}`);
    return tokenDoc;
});
const AdminResendSetup = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const adminEmail = email || process.env.ADMIN_EMAIL;
    if (!adminEmail)
        throw new apiErrors_1.default(400, 'Admin email not set in .env');
    const tokenDoc = yield auth_model_1.AdminSetupToken.findOne({ email, used: false });
    if (tokenDoc && tokenDoc.expiresAt > new Date()) {
        // Token still valid, resend
        const setupLink = `${process.env.FRONTEND_URL}/admin/setup?token=${tokenDoc.token}`;
        yield (0, emailClient_1.sendEmail)(email, "Your Admin Setup Link", `Click here to setup: ${setupLink}`);
        return tokenDoc;
    }
    // Generate new token
    return yield AdminRequestSetup(email);
});
// Validate token
const validateToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenDoc = yield auth_model_1.AdminSetupToken.findOne({ token });
    if (!tokenDoc)
        throw new Error("Invalid token");
    if (tokenDoc.used)
        throw new Error("Token already used");
    if (tokenDoc.expiresAt < new Date())
        throw new Error("Token expired");
    return tokenDoc;
});
exports.validateToken = validateToken;
const AdminCompleteSetup = (token, password) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenDoc = yield (0, exports.validateToken)(token);
    const existingAdmin = yield auth_model_1.User.findOne({ role: "admin" });
    if (existingAdmin)
        throw new Error("ADMIN already exists");
    const adminUser = yield auth_model_1.User.create({
        name: "admin",
        email: tokenDoc.email,
        password,
        role: "admin"
    });
    tokenDoc.used = true;
    yield tokenDoc.save();
    return adminUser;
});
exports.AdminCompleteSetup = AdminCompleteSetup;
exports.UserService = {
    CreateUser,
    AdminRequestSetup,
    AdminResendSetup,
    AdminCompleteSetup: exports.AdminCompleteSetup,
    CreateAffiliate,
    CreateAdmin,
    loginUser,
    AffiliateLogin,
    refreshToken,
    UpdateUserRole,
    ResetPassword,
    GetProfile,
    UpdateProfile,
    ChangePassword,
    GetAllUsers,
    UpdateUser,
    DeleteUser,
    //   RegisterAndSubscribe,
    GetAffiliatesByStatus,
    GetAffiliateById,
    ApproveAffiliate,
    RejectAffiliate,
    GetAllAffiliates,
    GetAffiliateProfile,
};
