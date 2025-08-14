// src/schemas/productSchema.ts
import { z } from 'zod';

export const productSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().optional(),
    sku: z.string().min(1, "SKU is required"),
    isFeatured: z.boolean().optional(),
    collections: z.string().nullable().optional(),
    category: z.string().optional(),
    basicInfo: z.object({
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      brand: z.string().optional(),
    }),
    pricing: z.object({
      defaultPrice: z.number().positive("Default price must be a positive number"),
      cost: z.number().positive("Cost must be a positive number"),
      salePrice: z.number().positive("Sale price must be a positive number"),
      profit: z.number().optional(),
      margin: z.number().optional(),
    }),
    seo: z.object({
      pageTitle: z.string().optional(),
      productUrl: z.string().optional(),
      metaDescription: z.string().optional(),
    }),
    productDetails: z.object({
      weight: z.string().optional(),
      type: z.string().optional(),
      vendor: z.string().optional(),
      warranty: z.string().optional(),
      termAndConditions: z.string().optional(),
      compliance: z.string().optional(),
    }).optional(),
    statusInfo: z.object({
      status: z.string().optional(),
      date: z.string().optional(),
      promoCode: z.string().optional(),
    }),
    additionalInfo: z.object({
      customFields: z.array(
        z.object({
          name: z.string().optional(),
          value: z.string().optional(),
        })
      ).optional(),
    }),
    inventory: z.object({
      curStock: z.number().positive("Stock must be a positive number"),
      productVariants: z.array(
        z.object({
          size: z.string().optional(),
          color: z.string().optional(),
          price: z.number().optional(),
          stock: z.number().optional(),
        })
      ).optional(),
    }),
    images: z.array(
      z.object({
        url: z.string().optional(),
        description: z.string().optional(),
        title: z.string().optional(),
        caption: z.string().optional(),
        isFeatured: z.boolean().optional(),
      })
    ).optional(),
    videoLink: z.string().optional(),
  }),
});


export const productUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").optional(),
    sku: z.string().min(1, "SKU is required").optional(),
    collections: z.string().nullable().optional(),
    category: z.string().optional(),
    basicInfo: z.object({
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      brand: z.string().optional(),
    }).optional(),
    pricing: z.object({
      defaultPrice: z.number().positive("Default price must be a positive number").optional(),
      cost: z.number().positive("Cost must be a positive number").optional(),
      salePrice: z.number().positive("Sale price must be a positive number").optional(),
      profit: z.number().optional(),
      margin: z.string().optional(),
    }).optional(),
    seo: z.object({
      pageTitle: z.string().optional(),
      productUrl: z.string().optional(),
      metaDescription: z.string().optional(),
    }).optional(),
    productDetails: z.object({
      weight: z.string().optional(),
      type: z.string().optional(),
      vendor: z.string().optional(),
      warranty: z.string().optional(),
      termAndConditions: z.string().optional(),
      compliance: z.string().optional(),
    }).optional(),
    statusInfo: z.object({
      status: z.string().optional(),
      date: z.string().optional(),
      promoCode: z.string().optional(),
    }).optional(),
    additionalInfo: z.object({
      customFields: z.array(
        z.object({
          name: z.string().optional(),
          value: z.string().optional(),
        })
      ).optional(),
    }).optional(),
    inventory: z.object({
      curStock: z.number().positive("Stock must be a positive number").optional(),
      productVariants: z.array(
        z.object({
          size: z.string().optional(),
          color: z.string().optional(),
          price: z.number().optional(),
          stock: z.number().optional(),
        })
      ).optional(),
    }).optional(),
    images: z.array(
      z.object({
        url: z.string().optional(),
        description: z.string().optional(),
        title: z.string().optional(),
        caption: z.string().optional(),
        isFeatured: z.boolean().optional(),
      })
    ).optional(),
    videoLink: z.string().optional(),
  }),
});