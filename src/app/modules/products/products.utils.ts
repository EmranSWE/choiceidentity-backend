import httpStatus from "http-status";
import ApiError from "../../../errors/apiErrors";
import { IProducts } from "./products.interface";
import { Products } from "./products.model";

// Regular expressions for YouTube and Vimeo links
export const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
export const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;


export const GetTrendingProducts = async (): Promise<IProducts[]> => {
    const trendingProducts = await Products.find({})
      .sort({ salesCount: -1, viewsCount: -1, rating: -1 }) // Sort by sales, views, and ratings
      .limit(10) // Limit to 10 trending products
      .exec();
  
    return trendingProducts;
  };


  export const validateProductData = (productData: IProducts) => {
      if (!productData.basicInfo) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Basic product information is required');
      }
    
      if (productData.pricing.salePrice > productData.pricing.defaultPrice) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Sale price cannot be higher than default price'
        );
      }
    
      if (productData.inventory.curStock < 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Stock quantity cannot be negative');
      }
    };