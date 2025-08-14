

import { z } from 'zod';

export const ENUM_USER_ROLE = z.enum(['customer', 'employee', 'admin','super_admin']);

export const ENUM_GENDER = z.enum(['male', 'female', 'others']);


const phoneRegex = /^(?:\+88)?01[3-9]\d{8}$/; 

const userSchema = z.object({
  body: z.object({
    role: ENUM_USER_ROLE.default('customer'),
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .refine((value) => !/<[^>]*>/.test(value), {
        message: 'Name contains invalid characters',
      }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    phone: z
      .string()
      .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
      .optional(),
    address: z.string().optional(),
    isVerified: z.boolean().optional().default(false),
    profilePicture: z.string().optional(),
    gender: ENUM_GENDER.optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format (YYYY-MM-DD)' })
      .optional(),
    lastLogin: z.date().optional(),
    failedLoginAttempts: z.number().optional().default(0),
    accountLockedUntil: z.date().optional(),
    socialLogin: z
      .object({
        google: z.string().optional(),
        facebook: z.string().optional(),
      })
      .optional(),
    twoFactorAuth: z
      .object({
        enabled: z.boolean().optional().default(false),
        secret: z.string().optional(),
      })
      .optional(),
    orders: z.array(z.string()).optional(), 
    wishlist: z.array(z.string()).optional(), 
    shippingAddresses: z
      .array(
        z.object({
          name: z.string().optional(),
          phone: z
            .string()
            .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
            .optional(),
          address: z.string().optional(),
          isDefault: z.boolean().optional().default(false),
        })
      )
      .optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  }),
});


// Infer the type from the Zod schema
export type IUser = z.infer<typeof userSchema>;

const loginZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }), 
    password: z.string().min(6, { message: 'Password must be at least 8 characters long' }), 
  }),
});

const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: 'Refresh Token is required',
    }),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    oldPassword: z.string({
      required_error: 'Old password  is required',
    }),
    newPassword: z.string({
      required_error: 'New password  is required',
    }),
  }),
});


const updateRoleSchema = z.object({
  body: z.object({
    role: ENUM_USER_ROLE
      .refine((value) => value.trim().length > 0, {
        message: 'Role is required', // Custom message for empty value
      })
      .refine(
        (value) => ENUM_USER_ROLE.options.includes(value),
        {
          message: 'Invalid role', // Custom message for invalid value
        }
      ),
  }),
});


const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});


const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({
      required_error: 'Token is required',
    }),
    newPassword: z.string().min(8, {
      message: 'Password must be at least 8 characters long',
    }),
  }),
});


const updateUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .refine((value) => !/<[^>]*>/.test(value), {
        message: 'Name contains invalid characters',
      })
      .optional(),
    email: z.string().email({ message: 'Invalid email address' }).optional(),
    phone: z
      .string()
      .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
      .optional(),
    address: z.string().optional(),
    profilePicture: z.string().optional(),
    gender: ENUM_GENDER.optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format (YYYY-MM-DD)' })
      .optional(),
    shippingAddresses: z
      .array(
        z.object({
          name: z.string().optional(),
          phone: z
            .string()
            .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
            .optional(),
          address: z.string().optional(),
          isDefault: z.boolean().optional().default(false),
        })
      )
      .optional(),
  }),
});

const ChangePasswordValidation = z.object({
  body: z.object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters long' })
      .regex(/[A-Z]/, { message: 'New password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'New password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'New password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, { message: 'New password must contain at least one special character' }),
  }),
});

const updateUserValidation = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required' }).optional(),
    email: z.string().email({ message: 'Invalid email address' }).optional(),
    phone: z
      .string()
      .regex(/^(?:\+88)?01[3-9]\d{8}$/, { message: 'Invalid Bangladeshi phone number' })
      .optional(),
    address: z.string().optional(),
    profilePicture: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional(),
    shippingAddresses: z
      .array(
        z.object({
          name: z.string().optional(),
          phone: z
            .string()
            .regex(/^(?:\+88)?01[3-9]\d{8}$/, { message: 'Invalid Bangladeshi phone number' })
            .optional(),
          address: z.string().optional(),
          isDefault: z.boolean().optional().default(false),
        })
      )
      .optional(),
  }),
});

export const AuthValidation = {
  userSchema,
  loginZodSchema,
  refreshTokenZodSchema,
  changePasswordZodSchema,
  updateRoleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
  ChangePasswordValidation,
  updateUserValidation
};
