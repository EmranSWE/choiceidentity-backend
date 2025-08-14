// Importing required types
import { Model } from 'mongoose';

export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DRAFT = "draft",
  PREORDER = "preorder",
}
export enum WarrantyOption {
  ONE_MONTH = "onemonth",
  SIX_MONTHS = "sixmonth",
  ONE_YEAR = "oneyear",
  NO_WARRANTY = "nowarranty",
}
export type IProductVariant = {
    size?: string;
    color?: string;
    weight?: number; 
    weightUnit?: 'kg' | 'g'; 
    price: number;
    stock: number;
    skuSuffix?: string; 
  };
// Product Interface
export type IProducts = {
  title: string;
  sku: string;
  slug?: string;
  viewCount?: number;
  purchaseCount?: number;
  collections?: string | null;
  category?: string; 
  isFeatured?: boolean; 
  basicInfo?: {
    description?: string;
    shortDescription?: string;
    brand?: string;
  };
  pricing: {
    defaultPrice: number;
    cost: number;
    salePrice: number;
    profit?: number;
    margin?: string;
  };
  seo?: {
    pageTitle?: string;
    productUrl?: string;
    metaDescription?: string;
  };
  productDetails?: {
    weight?: string;
    type?: string;
    vendor?: string;
    warranty?: WarrantyOption; 
    termAndConditions?: string;
    compliance?: string;
    };
    statusInfo?: {
    status?: ProductStatus; 
    date?: Date;
    promoCode?: string;
    };
    additionalInfo?: {
    tags?: string[];

    customFields?: {
      name?: string;
      value?: string;
    }[];
    };
    inventory: {
    curStock: number;
    productVariants?: IProductVariant[];
  };
  images?: {
    url: string; 
    alt?: string; 
    title?: string; 
    caption?: string; 
    isFeatured?: boolean; 
  }[];
  videoLink?: string; 
  
  createdAt?: Date;
  updatedAt?: Date;
};
export type ICollectionResponse = {
  id: string;
  title: string;
  description?: string;
  pageTitle?: string;
  collectionUrl?: string;
  metaDescription?: string;
  image?: {
    url: string;
    alt?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

// Extend the Mongoose Model
export type ProductModel = Model<IProducts>;



export type IProductFilters = {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  brands?:string
}


export type IProductSearchFilters = {
  searchTerm?: string;
  category?: string; 
  minPrice?: number; 
  maxPrice?: number; 
  brand?: string; 
  status?: string; 
  rating?: number; 
  tags?: string[]; 
  color?: string; 
  size?: string; 
}