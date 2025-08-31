import { NextFunction, Request, RequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import { UserService } from './auth.service';
import sendResponse from '../../../shared/sendResponse';
import config from '../../../config';
import { ILoginUserResponse, IUser } from './auth.interface';
import { getPaginationAndFilters } from '../../../helpers/paginationHelpers';
import { IProductFilters } from '../products/products.interface';
import { getCookieName, getCookieOptions } from '../../../config/cors.config';

const CreateUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.body;
    // Remove role from the payload (if present)
    delete user.role;
    const result = await UserService.CreateUser(user);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User created successfully',
      data: result,
    });
  }
);

const CreateAffiliateUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userData = req.body;

    // Enforce role
    userData.role = 'affiliate';

    const result = await UserService.CreateAffiliate(userData);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate user created successfully',
      data: result,
    });
  }
);

const CreateAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminPayload: IUser = req.body;

  const result = await UserService.CreateAdmin(adminPayload);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Admin account created successfully.',
    data: result,
  });
});

// Login User
const loginUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const loginData = req.body;
    const result = await UserService.loginUser(loginData);
    const { refreshToken, ...others } = result;

    // Set refresh token in cookie
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // delete refreshToken
    if ('refreshToken' in result) {
      delete result.refreshToken;
    }

    sendResponse<ILoginUserResponse>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User logged in successfully',
      data: others,
    });
  } catch (error) {
    next(error);
  }
};

// Login User
const AffiliateLogin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const loginData = req.body;
    const result = await UserService.AffiliateLogin(loginData);
    const { refreshToken, ...others } = result;

    // =========== Productions ===============
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('req.headers.origin', isProduction, req.headers.origin);

    // Get domain-specific cookie name and options
    const cookieName = getCookieName(req.headers.origin);
    const cookieOptions = getCookieOptions(req.headers.origin, isProduction);

    res.cookie(cookieName, refreshToken, cookieOptions);

    console.log(
      'cookieName',
      cookieName,
      'refreshToken',
      refreshToken,
      'cookieOptions',
      cookieOptions
    );

    if ('refreshToken' in result) {
      delete result.refreshToken;
    }

    sendResponse<ILoginUserResponse>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User logged in successfully',
      data: others,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const refreshToken = req.cookies?.refreshToken;
    // console.log('Request refresh Token ', refreshToken);

    // if (!refreshToken) {
    //   return sendResponse(res, {
    //     statusCode: httpStatus.UNAUTHORIZED,
    //     success: false,
    //     message: 'Refresh token not found',
    //   });
    // }

    // // Call the service to refresh the token
    // const result = await UserService.refreshToken(refreshToken);

    // res.cookie('refreshToken', result.refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'none',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    //   path: '/',
    //   domain: 'localhost',
    // });

    //========= Productions ===========
      // Get the correct cookie name based on origin
    const cookieName = getCookieName(req.headers.origin);
    const refreshToken = req.cookies?.[cookieName];
    
    console.log('Request refresh Token ', refreshToken);
    console.log('Looking for cookie name:', cookieName);
    console.log('Available cookies:', Object.keys(req.cookies || {}));

    if (!refreshToken) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Refresh token not found',
      });
    }

    // Call the service to refresh the token
    const result = await UserService.refreshToken(refreshToken);

    // Set the new refresh token with proper domain isolation
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = getCookieOptions(req.headers.origin, isProduction);
    
    console.log("cookieOptions",cookieOptions,cookieName)
    res.cookie(cookieName, result.refreshToken, cookieOptions);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const LogoutUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  }
);

const UpdateUserRole: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    // Call the service to update the user's role
    const updatedUser = await UserService.UpdateUserRole(id, role);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User role updated successfully',
      data: updatedUser,
    });
  }
);

const ResetPassword: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    // Call the service to handle the password reset logic
    await UserService.ResetPassword(token, newPassword);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password reset successfully',
      data: null,
    });
  }
);

const GetProfile: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    // Call the service to fetch the user's profile
    const userProfile = await UserService.GetProfile(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Profile fetched successfully',
      data: userProfile,
    });
  }
);

const UpdateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const updateData = req.body;

  // Call the service to update the user's profile
  const updatedUser = await UserService.UpdateProfile(userId, updateData);

  // Send the response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

const ChangePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId; // Extract userId from the authenticated request
  const { currentPassword, newPassword } = req.body; // Extract current and new passwords

  // Call the service to change the password
  await UserService.ChangePassword(userId, currentPassword, newPassword);

  // Send the response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: null,
  });
});

const GetAllUsers = catchAsync(async (req: Request, res: Response) => {
  // Extract query parameters for pagination and filtering
  const { paginationOptions, filters } =
    getPaginationAndFilters<IProductFilters>(req);

  const result = await UserService.GetAllUsers(paginationOptions, filters);
  // Send response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All User retrieved successfully',
    data: {
      data: result.data,
      meta: result.meta,
    },
  });
});

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

const UpdateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const updateData = req.body;

  // Call the service to update the user
  const updatedUser = await UserService.UpdateUser(userId, updateData);

  // Send the response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

const DeleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id; // Extract user ID from the request parameters

  // Call the service to delete the user
  await UserService.DeleteUser(userId);

  // Send the response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: null,
  });
});

// Affiliate Related Handle
const GetPendingAffiliates: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { status = 'pending' } = req.query;
    const affiliates = await UserService.GetAffiliatesByStatus(
      status as string
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Pending affiliates fetched successfully',
      data: affiliates,
    });
  }
);

const GetAffiliateDetails: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const affiliate = await UserService.GetAffiliateById(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate details fetched successfully',
      data: affiliate,
    });
  }
);

const ApproveAffiliate: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = 'imran1111';
    const updatedAffiliate = await UserService.ApproveAffiliate(adminId, id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate approved successfully',
      data: updatedAffiliate,
    });
  }
);

const RejectAffiliate: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = 'imran';
    const updatedAffiliate = await UserService.RejectAffiliate(
      adminId,
      id,
      reason
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Affiliate rejected successfully',
      data: updatedAffiliate,
    });
  }
);

const GetAllAffiliates = catchAsync(async (req: Request, res: Response) => {
  // Extract query parameters for pagination and filtering
  const { paginationOptions, filters } =
    getPaginationAndFilters<IProductFilters>(req);

  const result = await UserService.GetAllAffiliates(paginationOptions, filters);
  // Send response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All Affiliates retrieved successfully',
    data: {
      data: result.data,
      meta: result.meta,
    },
  });
});

const GetAffiliateProfile: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    console.log('Fetching affiliate profile');
    const userId = req.user?.userId;
    // Call the service to fetch the user's profile
    const userProfile = await UserService.GetAffiliateProfile(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Profile fetched successfully',
      data: userProfile,
    });
  }
);

const AdminRequestSetup: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const AdminSetup = await UserService.AdminRequestSetup(email);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin account created successfully',
      data: AdminSetup,
    });
  }
);

const AdminResendSetup: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await UserService.AdminResendSetup(email);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Resent admin setup link successfully',
      data: result,
    });
  }
);

const AdminCompleteSetup: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { token, password } = req.body;

    const result = await UserService.AdminCompleteSetup(token, password);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Resent admin setup link successfully',
      data: result,
    });
  }
);
export const UserController = {
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
