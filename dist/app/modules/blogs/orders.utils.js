"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTrendingProducts = exports.vimeoRegex = exports.youtubeRegex = void 0;
const products_model_1 = require("../products/products.model");
// Regular expressions for YouTube and Vimeo links
exports.youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
exports.vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
const GetTrendingProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    const trendingProducts = yield products_model_1.Products.find({})
        .sort({ salesCount: -1, viewsCount: -1, rating: -1 }) // Sort by sales, views, and ratings
        .limit(10) // Limit to 10 trending products
        .exec();
    return trendingProducts;
});
exports.GetTrendingProducts = GetTrendingProducts;
