/* eslint-disable @typescript-eslint/ban-ts-comment */
import httpStatus from 'http-status';
import ApiError from '../../../errors/apiErrors';
import {
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
  IUser,
  IUserFilters,
} from './auth.interface';
import { AdminSetupToken, User } from './auth.model';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import bcrypt from 'bcryptjs';
import { ENUM_USER_ROLE } from '../../../enums/user';
import {
  calculatePagination,
  IPaginationOptions,
} from '../../../helpers/paginationHelpers';
import mongoose, { SortOrder, Types } from 'mongoose';
import { stripe } from './auth.utils';
import { getPriceMapping } from '../stripe/stripe.utils';
import { generateUniqueReferralCode } from './auth.lib';
import { sendAffiliateApprovalEmail } from '../../../emails/sendAffiliateEmail';
import { sendAffiliateRejectionEmail } from '../../../emails/sendAffiliateRejectEmail';
import { randomBytes } from 'crypto';
import { sendEmail } from '../../../emails/emailClient';
const CreateUser = async (UserData: IUser): Promise<IUser | null> => {
  // Check if email already exists
  const isUserExist = await User.isUserExist(UserData.email);
  if (isUserExist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Signup failed. Please check your details and try again.'
    );
  }

  // Set default role to 'user' if not provided
  if (!UserData.role) {
    UserData.role = ENUM_USER_ROLE.CUSTOMER;
  }

  // Create a new user
  const createUser = await User.create(UserData);
  if (!createUser) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Signup failed. Please try again.'
    );
  }
  return createUser;
};

const CreateAffiliate = async (affiliateData: IUser): Promise<IUser | null> => {
  console.log('Affiliate data', affiliateData);
  // 1. Check if email already exists
  const isUserExist = await User.isUserExist(affiliateData.email);
  if (isUserExist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Signup failed. Email already in use.'
    );
  }

  // 2. Force role to affiliate
  affiliateData.role = ENUM_USER_ROLE.AFFILIATE;

  // 3. Optional: validate affiliateProfile exists and required fields (can be moved to validation layer)
  if (!affiliateData.affiliateProfile) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Affiliate profile details are required.'
    );
  }
  if (!affiliateData.affiliateProfile.agreeTerms) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You must agree to the terms.');
  }

  // 4. Create user using existing create method
  const createdAffiliate = await User.create(affiliateData);
  if (!createdAffiliate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Affiliate signup failed. Please try again.'
    );
  }

  return createdAffiliate;
};

const CreateAdmin = async (adminPayload: IUser): Promise<IUser | null> => {
  // Ensure email is not already used
  const isUserExist = await User.isUserExist(adminPayload.email);
  if (isUserExist) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already in use');
  }

  // Force role to admin
  adminPayload.role = ENUM_USER_ROLE.ADMIN;

  // Create admin
  const createAdmin = await User.create(adminPayload);

  if (!createAdmin) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Failed to create admin account'
    );
  }

  return createAdmin;
};

//Login user
const loginUser = async (
  loginData: ILoginUser
): Promise<ILoginUserResponse> => {
  const { email, password } = loginData;

  // Check is user exist
  const isUserExist = await User.isUserExist(email);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  //Matching the password
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(password, isUserExist?.password))
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
  }

  const { email: youremail, _id, role } = isUserExist;

  // Access token
  const accessToken = jwtHelpers.createToken(
    { userId: _id, youremail, role },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { youremail, role },
    config.jwt.refresh_Secret as Secret,
    config.jwt.refresh_secret_Expires as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

//Login user
const AffiliateLogin = async (
  loginData: ILoginUser
): Promise<ILoginUserResponse> => {
  const { email, password } = loginData;
  // Check is user exist
  const isUserExist = await User.isUserExist(email);

  if (!isUserExist) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials.');
  }

  //@ts-ignore
  if (isUserExist.accountStatus === 'banned') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Your account was banned. Please contact with support teams.'
    );
  }

  if (isUserExist.role === 'affiliate') {
    //@ts-ignore
    if (isUserExist.affiliateProfile.approvalStatus === 'pending') {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Your account is pending admin approval. Please wait for approval email.'
      );
    }

    // @ts-ignore
    if (isUserExist.affiliateProfile.approvalStatus === 'rejected') {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Your application was rejected. Please contact support.'
      );
    }
  }

  //Matching the password
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(password, isUserExist?.password))
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
  }

  const { email: youremail, _id, role } = isUserExist;

  // Access token
  const accessToken = jwtHelpers.createToken(
    { userId: _id, youremail, role },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { youremail, role },
    config.jwt.refresh_Secret as Secret,
    config.jwt.refresh_secret_Expires as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string): Promise<IRefreshTokenResponse> => {
  // Verify the refresh token
  console.log('Cookies Data in service', token);

  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_Secret as Secret
    );
    console.log('Verified kina', verifiedToken);
  } catch (error) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid refresh token');
  }

  const { youremail } = verifiedToken;
  console.log('Verified email check', youremail);
  // Check if the user exists
  const isUserExist = await User.isUserExist(youremail);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  // Generate a new access token
  const newAccessToken = jwtHelpers.createToken(
    {
      userId: isUserExist._id,
      email: isUserExist.email,
      role: isUserExist.role,
    },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  // Generate a new refresh token
  const newRefreshToken = jwtHelpers.createToken(
    {
      userId: isUserExist._id,
      email: isUserExist.email,
      role: isUserExist.role,
    },
    config.jwt.secret as Secret,
    config.jwt.refresh_secret_Expires as string
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const UpdateUserRole = async (userId: string, role: string) => {
  // Check if the user exists

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Update the user's role
  user.role = role as ENUM_USER_ROLE;
  await user.save();

  return user;
};

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

const ResetPassword = async (token: string, newPassword: string) => {
  // Find the user by the reset token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired token');
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password
  user.password = hashedPassword;
  //@ts-ignore
  user.resetPasswordToken = undefined;
  //@ts-ignore
  user.resetPasswordExpiry = undefined;
  await user.save();
};

const GetProfile = async (userId: string) => {
  const user = await User.findById(userId).select(
    '-password -resetPasswordToken -resetPasswordExpiry'
  );
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const UpdateProfile = async (userId: string, updateData: any) => {
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
      (obj as any)[key] = updateData[key];
      return obj;
    }, {} as Partial<IUser>);

  // Check if the email is being updated
  if (filteredUpdateData.email) {
    // Find if another user already has this email
    const existingUser = await User.findOne({
      email: filteredUpdateData.email,
    });

    // If another user has this email, throw an error
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
    }
  }

  // Find the user by ID and update the profile
  const user = await User.findByIdAndUpdate(userId, filteredUpdateData, {
    new: true, // Return the updated document
    runValidators: true, // Run Mongoose validation on update
  }).select('-password -resetPasswordToken -resetPasswordExpiry'); // Exclude sensitive fields

  // If the user is not found, throw a 404 error
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const ChangePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  // Find the user by ID and include the password field
  const user = await User.findById(userId).select('+password');

  // If the user is not found, throw a 404 error
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Verify the current password
  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Current password is incorrect'
    );
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password
  user.password = hashedPassword;
  await user.save();
};

const GetAllUsers = async (
  paginationOptions: IPaginationOptions,
  filters: IUserFilters
): Promise<{
  data: IUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}> => {
  // Calculate pagination options
  const { skip, limit, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  // Define sorting conditions
  const sortConditions: { [key: string]: SortOrder } = {};
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
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  // Fetch users with pagination, sorting, and filtering
  const users = await User.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit)
    .select('-password -resetPasswordToken -resetPasswordExpiry'); // Exclude sensitive fields

  // Get the total count of users (for pagination metadata)
  const total = await User.countDocuments(whereConditions);

  // Throw an error if no users are found
  if (users.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found');
  }

  return {
    data: users,
    meta: {
      page: paginationOptions.page || 1,
      limit,
      total,
    },
  };
};

const UpdateUser = async (userId: string, updateData: Partial<IUser>) => {
  // Define allowed fields that can be updated
  const allowedFields: (keyof IUser)[] = [
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
    .filter((key): key is keyof IUser =>
      allowedFields.includes(key as keyof IUser)
    )
    .reduce((obj, key) => {
      // Ensure the value is not undefined before assigning
      if (updateData[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        obj[key] = updateData[key];
      }
      return obj;
    }, {} as Partial<IUser>);

  // Check if the email is being updated
  if (filteredUpdateData.email) {
    // Find if another user already has this email
    const existingUser = await User.findOne({
      email: filteredUpdateData.email,
    });

    // If another user has this email, throw an error
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
    }
  }

  // Find the user by ID and update the profile
  const user = await User.findByIdAndUpdate(userId, filteredUpdateData, {
    new: true, // Return the updated document
    runValidators: true, // Run Mongoose validation on update
  }).select('-password -resetPasswordToken -resetPasswordExpiry'); // Exclude sensitive fields

  // If the user is not found, throw a 404 error
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const DeleteUser = async (userId: string) => {
  // Find the user by ID and delete it
  const user = await User.findByIdAndDelete(userId);

  // If the user is not found, throw a 404 error
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
};

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

const GetAffiliatesByStatus = async (status: string) => {
  return User.find({
    role: 'affiliate',
    'affiliateProfile.approvalStatus': status,
  }).select('+affiliateProfile');
};

const GetAffiliateById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid affiliate ID');
  }
  const affiliate = await User.findById(id).select('-password');
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found');
  }
  return affiliate;
};

const ApproveAffiliate = async (adminId: string, affiliateId: string) => {
  if (!mongoose.Types.ObjectId.isValid(affiliateId)) {
    throw new ApiError(400, 'Invalid affiliate ID');
  }

  // Use transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const affiliate = await User.findById(affiliateId)
      .session(session)
      .select('+affiliateProfile');

    if (!affiliate) throw new ApiError(404, 'Affiliate not found');

    if (affiliate.role !== ENUM_USER_ROLE.AFFILIATE) {
      throw new ApiError(400, 'User is not an affiliate');
    }

    if (affiliate.affiliateProfile?.approvalStatus === 'approved') {
      throw new ApiError(400, 'Affiliate already approved');
    }

    // Ensure affiliateDetails exists, create if not
    if (!affiliate.affiliateDetails) {
      affiliate.affiliateDetails = {
        referralCode: await generateUniqueReferralCode(),
        commissionBalance: 0,
        payoutHistory: [],
        performanceMetrics: {
          clicks: 0,
          signups: 0,
          conversions: 0,
        },
      };
    } else if (!affiliate.affiliateDetails.referralCode) {
      // Only generate referral code if missing
      affiliate.affiliateDetails.referralCode =
        await generateUniqueReferralCode();
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
    await affiliate.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Send approval email asynchronously (don't block DB)
    await sendAffiliateApprovalEmail(
      affiliate.email,
      affiliate.name,
      affiliate.affiliateDetails.referralCode
    ).catch(err => {
      // Log but don’t block user approval if email fails
      console.error('Failed to send approval email:', err);
    });

    return affiliate;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const RejectAffiliate = async (
  adminId: string,
  affiliateId: string,
  reason: string
) => {
  if (!Types.ObjectId.isValid(affiliateId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid affiliate ID');
  }
  const affiliate = await User.findById(affiliateId).select(
    '+affiliateProfile'
  );
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found');
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
    details: `Rejected by admin ${adminId}${
      reason ? `, Reason: ${reason}` : ''
    }`,
  });

  await affiliate.save();

  // Send rejection email asynchronously; don’t block rejection if email fails
  sendAffiliateRejectionEmail(affiliate.email, affiliate.name, reason).catch(
    err => {
      console.error('Failed to send rejection email:', err);
    }
  );

  return affiliate;
};

const GetAllAffiliates = async (
  paginationOptions: IPaginationOptions,
  filters: IUserFilters
): Promise<{
  data: IUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}> => {
  const { skip, limit, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }

  // Start with role=Affiliate filter
  const andConditions: any[] = [{ role: ENUM_USER_ROLE.AFFILIATE }];

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
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  // Query with pagination, sorting, and filters
  const users = await User.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit)
    .select('+affiliateProfile');

  // Total count for metadata
  const total = await User.countDocuments(whereConditions);

  // Return empty data array if none found, avoid throwing error here
  return {
    data: users,
    meta: {
      page: paginationOptions.page || 1,
      limit,
      total,
    },
  };
};

const GetAffiliateProfile = async (userId: string) => {
  const user = await User.findById(userId).select(
    '-password -resetPasswordToken -resetPasswordExpiry'
  );
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const AdminRequestSetup = async (email:string) => {
 const adminEmail = email || process.env.ADMIN_EMAIL;
    if (!adminEmail) 
     throw new ApiError(400, 'Admin email not set in .env');

    // Check if already SUPER_ADMIN exists
    const existingAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (existingAdmin)
        throw new ApiError(httpStatus.METHOD_NOT_ALLOWED, 'SUPER_ADMIN already exists');

    // Generate token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const tokenDoc = await AdminSetupToken.create({ email: adminEmail, token, expiresAt });

    // Send email
    const setupLink = `${process.env.FRONTEND_ADMIN_URL}/setup?token=${token}`;
    await sendEmail(
        adminEmail,
        'Your Admin Setup Link',
        `Click here to setup your SUPER_ADMIN account: ${setupLink}`
    );

    return tokenDoc;
};

const AdminResendSetup = async (email: string) => {
     const adminEmail = email || process.env.ADMIN_EMAIL;
  if (!adminEmail) 
     throw new ApiError(400, 'Admin email not set in .env');

 const tokenDoc = await AdminSetupToken.findOne({ email, used: false });
    if (tokenDoc && tokenDoc.expiresAt > new Date()) {
        // Token still valid, resend
        const setupLink = `${process.env.FRONTEND_URL}/admin/setup?token=${tokenDoc.token}`;
        await sendEmail(email, "Your Admin Setup Link", `Click here to setup: ${setupLink}`);
        return tokenDoc;
    }

    // Generate new token
    return await AdminRequestSetup(email);
};


// Validate token
export const validateToken = async (token: string) => {
    const tokenDoc = await AdminSetupToken.findOne({ token });
    if (!tokenDoc) throw new Error("Invalid token");
    if (tokenDoc.used) throw new Error("Token already used");
    if (tokenDoc.expiresAt < new Date()) throw new Error("Token expired");
    return tokenDoc;
};

export const AdminCompleteSetup = async (token: string, password: string) => {
    const tokenDoc = await validateToken(token);

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) throw new Error("ADMIN already exists");


    const adminUser = await User.create({
        name:"admin",
        email: tokenDoc.email,
        password,
        role: "admin"
    });

    tokenDoc.used = true;
    await tokenDoc.save();

    return adminUser;
};

export const UserService = {
  CreateUser,
  AdminRequestSetup,
  AdminResendSetup,
  AdminCompleteSetup,
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
