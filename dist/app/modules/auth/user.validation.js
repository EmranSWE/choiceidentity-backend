"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = exports.ENUM_GENDER = exports.ENUM_USER_ROLE = void 0;
const zod_1 = require("zod");
exports.ENUM_USER_ROLE = zod_1.z.enum(['customer', 'employee', 'admin', 'super_admin']);
exports.ENUM_GENDER = zod_1.z.enum(['male', 'female', 'others']);
const phoneRegex = /^(?:\+88)?01[3-9]\d{8}$/;
const userSchema = zod_1.z.object({
    body: zod_1.z.object({
        role: exports.ENUM_USER_ROLE.default('customer'),
        name: zod_1.z
            .string()
            .min(1, { message: 'Name is required' })
            .refine((value) => !/<[^>]*>/.test(value), {
            message: 'Name contains invalid characters',
        }),
        email: zod_1.z.string().email({ message: 'Invalid email address' }),
        password: zod_1.z.string().min(6, { message: 'Password must be at least 6 characters long' }),
        phone: zod_1.z
            .string()
            .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
            .optional(),
        address: zod_1.z.string().optional(),
        isVerified: zod_1.z.boolean().optional().default(false),
        profilePicture: zod_1.z.string().optional(),
        gender: exports.ENUM_GENDER.optional(),
        dateOfBirth: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format (YYYY-MM-DD)' })
            .optional(),
        lastLogin: zod_1.z.date().optional(),
        failedLoginAttempts: zod_1.z.number().optional().default(0),
        accountLockedUntil: zod_1.z.date().optional(),
        socialLogin: zod_1.z
            .object({
            google: zod_1.z.string().optional(),
            facebook: zod_1.z.string().optional(),
        })
            .optional(),
        twoFactorAuth: zod_1.z
            .object({
            enabled: zod_1.z.boolean().optional().default(false),
            secret: zod_1.z.string().optional(),
        })
            .optional(),
        orders: zod_1.z.array(zod_1.z.string()).optional(),
        wishlist: zod_1.z.array(zod_1.z.string()).optional(),
        shippingAddresses: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string().optional(),
            phone: zod_1.z
                .string()
                .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
                .optional(),
            address: zod_1.z.string().optional(),
            isDefault: zod_1.z.boolean().optional().default(false),
        }))
            .optional(),
        createdAt: zod_1.z.date().optional(),
        updatedAt: zod_1.z.date().optional(),
    }),
});
const loginZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: 'Invalid email address' }),
        password: zod_1.z.string().min(6, { message: 'Password must be at least 8 characters long' }),
    }),
});
const refreshTokenZodSchema = zod_1.z.object({
    cookies: zod_1.z.object({
        refreshToken: zod_1.z.string({
            required_error: 'Refresh Token is required',
        }),
    }),
});
const changePasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        oldPassword: zod_1.z.string({
            required_error: 'Old password  is required',
        }),
        newPassword: zod_1.z.string({
            required_error: 'New password  is required',
        }),
    }),
});
const updateRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        role: exports.ENUM_USER_ROLE
            .refine((value) => value.trim().length > 0, {
            message: 'Role is required', // Custom message for empty value
        })
            .refine((value) => exports.ENUM_USER_ROLE.options.includes(value), {
            message: 'Invalid role', // Custom message for invalid value
        }),
    }),
});
const forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: 'Invalid email address' }),
    }),
});
const resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string({
            required_error: 'Token is required',
        }),
        newPassword: zod_1.z.string().min(8, {
            message: 'Password must be at least 8 characters long',
        }),
    }),
});
const updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, { message: 'Name is required' })
            .refine((value) => !/<[^>]*>/.test(value), {
            message: 'Name contains invalid characters',
        })
            .optional(),
        email: zod_1.z.string().email({ message: 'Invalid email address' }).optional(),
        phone: zod_1.z
            .string()
            .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
            .optional(),
        address: zod_1.z.string().optional(),
        profilePicture: zod_1.z.string().optional(),
        gender: exports.ENUM_GENDER.optional(),
        dateOfBirth: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format (YYYY-MM-DD)' })
            .optional(),
        shippingAddresses: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string().optional(),
            phone: zod_1.z
                .string()
                .regex(phoneRegex, { message: 'Invalid Bangladeshi phone number' })
                .optional(),
            address: zod_1.z.string().optional(),
            isDefault: zod_1.z.boolean().optional().default(false),
        }))
            .optional(),
    }),
});
const ChangePasswordValidation = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, { message: 'Current password is required' }),
        newPassword: zod_1.z
            .string()
            .min(8, { message: 'New password must be at least 8 characters long' })
            .regex(/[A-Z]/, { message: 'New password must contain at least one uppercase letter' })
            .regex(/[a-z]/, { message: 'New password must contain at least one lowercase letter' })
            .regex(/[0-9]/, { message: 'New password must contain at least one number' })
            .regex(/[^A-Za-z0-9]/, { message: 'New password must contain at least one special character' }),
    }),
});
const updateUserValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, { message: 'Name is required' }).optional(),
        email: zod_1.z.string().email({ message: 'Invalid email address' }).optional(),
        phone: zod_1.z
            .string()
            .regex(/^(?:\+88)?01[3-9]\d{8}$/, { message: 'Invalid Bangladeshi phone number' })
            .optional(),
        address: zod_1.z.string().optional(),
        profilePicture: zod_1.z.string().optional(),
        gender: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        shippingAddresses: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string().optional(),
            phone: zod_1.z
                .string()
                .regex(/^(?:\+88)?01[3-9]\d{8}$/, { message: 'Invalid Bangladeshi phone number' })
                .optional(),
            address: zod_1.z.string().optional(),
            isDefault: zod_1.z.boolean().optional().default(false),
        }))
            .optional(),
    }),
});
exports.AuthValidation = {
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
