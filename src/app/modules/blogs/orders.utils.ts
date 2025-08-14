import { IProducts } from "../products/products.interface";
import { Products } from "../products/products.model";


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