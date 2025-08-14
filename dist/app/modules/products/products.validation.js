"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productUpdateSchema = exports.productSchema = void 0;
// src/schemas/productSchema.ts
const zod_1 = require("zod");
exports.productSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title is required"),
        slug: zod_1.z.string().optional(),
        sku: zod_1.z.string().min(1, "SKU is required"),
        isFeatured: zod_1.z.boolean().optional(),
        collections: zod_1.z.string().nullable().optional(),
        category: zod_1.z.string().optional(),
        basicInfo: zod_1.z.object({
            description: zod_1.z.string().optional(),
            shortDescription: zod_1.z.string().optional(),
            brand: zod_1.z.string().optional(),
        }),
        pricing: zod_1.z.object({
            defaultPrice: zod_1.z.number().positive("Default price must be a positive number"),
            cost: zod_1.z.number().positive("Cost must be a positive number"),
            salePrice: zod_1.z.number().positive("Sale price must be a positive number"),
            profit: zod_1.z.number().optional(),
            margin: zod_1.z.number().optional(),
        }),
        seo: zod_1.z.object({
            pageTitle: zod_1.z.string().optional(),
            productUrl: zod_1.z.string().optional(),
            metaDescription: zod_1.z.string().optional(),
        }),
        productDetails: zod_1.z.object({
            weight: zod_1.z.string().optional(),
            type: zod_1.z.string().optional(),
            vendor: zod_1.z.string().optional(),
            warranty: zod_1.z.string().optional(),
            termAndConditions: zod_1.z.string().optional(),
            compliance: zod_1.z.string().optional(),
        }).optional(),
        statusInfo: zod_1.z.object({
            status: zod_1.z.string().optional(),
            date: zod_1.z.string().optional(),
            promoCode: zod_1.z.string().optional(),
        }),
        additionalInfo: zod_1.z.object({
            customFields: zod_1.z.array(zod_1.z.object({
                name: zod_1.z.string().optional(),
                value: zod_1.z.string().optional(),
            })).optional(),
        }),
        inventory: zod_1.z.object({
            curStock: zod_1.z.number().positive("Stock must be a positive number"),
            productVariants: zod_1.z.array(zod_1.z.object({
                size: zod_1.z.string().optional(),
                color: zod_1.z.string().optional(),
                price: zod_1.z.number().optional(),
                stock: zod_1.z.number().optional(),
            })).optional(),
        }),
        images: zod_1.z.array(zod_1.z.object({
            url: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            title: zod_1.z.string().optional(),
            caption: zod_1.z.string().optional(),
            isFeatured: zod_1.z.boolean().optional(),
        })).optional(),
        videoLink: zod_1.z.string().optional(),
    }),
});
exports.productUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title is required").optional(),
        sku: zod_1.z.string().min(1, "SKU is required").optional(),
        collections: zod_1.z.string().nullable().optional(),
        category: zod_1.z.string().optional(),
        basicInfo: zod_1.z.object({
            description: zod_1.z.string().optional(),
            shortDescription: zod_1.z.string().optional(),
            brand: zod_1.z.string().optional(),
        }).optional(),
        pricing: zod_1.z.object({
            defaultPrice: zod_1.z.number().positive("Default price must be a positive number").optional(),
            cost: zod_1.z.number().positive("Cost must be a positive number").optional(),
            salePrice: zod_1.z.number().positive("Sale price must be a positive number").optional(),
            profit: zod_1.z.number().optional(),
            margin: zod_1.z.string().optional(),
        }).optional(),
        seo: zod_1.z.object({
            pageTitle: zod_1.z.string().optional(),
            productUrl: zod_1.z.string().optional(),
            metaDescription: zod_1.z.string().optional(),
        }).optional(),
        productDetails: zod_1.z.object({
            weight: zod_1.z.string().optional(),
            type: zod_1.z.string().optional(),
            vendor: zod_1.z.string().optional(),
            warranty: zod_1.z.string().optional(),
            termAndConditions: zod_1.z.string().optional(),
            compliance: zod_1.z.string().optional(),
        }).optional(),
        statusInfo: zod_1.z.object({
            status: zod_1.z.string().optional(),
            date: zod_1.z.string().optional(),
            promoCode: zod_1.z.string().optional(),
        }).optional(),
        additionalInfo: zod_1.z.object({
            customFields: zod_1.z.array(zod_1.z.object({
                name: zod_1.z.string().optional(),
                value: zod_1.z.string().optional(),
            })).optional(),
        }).optional(),
        inventory: zod_1.z.object({
            curStock: zod_1.z.number().positive("Stock must be a positive number").optional(),
            productVariants: zod_1.z.array(zod_1.z.object({
                size: zod_1.z.string().optional(),
                color: zod_1.z.string().optional(),
                price: zod_1.z.number().optional(),
                stock: zod_1.z.number().optional(),
            })).optional(),
        }).optional(),
        images: zod_1.z.array(zod_1.z.object({
            url: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            title: zod_1.z.string().optional(),
            caption: zod_1.z.string().optional(),
            isFeatured: zod_1.z.boolean().optional(),
        })).optional(),
        videoLink: zod_1.z.string().optional(),
    }),
});
