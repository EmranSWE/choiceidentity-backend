"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = exports.AddProducts = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
const products_model_1 = require("./products.model");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const http_status_1 = __importDefault(require("http-status"));
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const mongoose_1 = __importStar(require("mongoose"));
const products_utils_1 = require("./products.utils");
const node_cache_1 = __importDefault(require("node-cache"));
/**
 * AddProducts Services
 * Handles the creation of a new product.
 */
// const AddProducts = async (
//   productData: IProducts
// ): Promise<IProducts | null> => {
// console.log("productData",productData)
//   if (!productData.basicInfo) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       'Basic info is missing in product data'
//     );
//   }
//   const isProductNameExist = await Products.findOne({
//     title: productData.title,
//   });
//   if (isProductNameExist) {
//     throw new ApiError(httpStatus.CONFLICT, 'Product name already exists');
//   }
//   const isSkuExist = await Products.findOne({
//     sku: productData.sku,
//   });
//   if (isSkuExist) {
//     throw new ApiError(
//       httpStatus.CONFLICT,
//       'Product with this SKU already exists'
//     );
//   }
//   const isUrlExist = await Products.findOne({
//     'seo.productUrl': productData.seo?.productUrl,
//   });
//   if (isUrlExist) {
//     throw new ApiError(httpStatus.CONFLICT, 'Product URL already exists');
//   }
//   // Create a new Products
//   const CreateProducts = await Products.create(productData);
//   if (!CreateProducts) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Products could not be created');
//   }
//   return CreateProducts;
// };
const AddProducts = (productData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        (0, products_utils_1.validateProductData)(productData);
        const [existingTitle, existingSku, existingUrl] = yield Promise.all([
            products_model_1.Products.findOne({ title: productData.title }).session(session).lean(),
            products_model_1.Products.findOne({ sku: productData.sku }).session(session).lean(),
            ((_a = productData.seo) === null || _a === void 0 ? void 0 : _a.productUrl)
                ? products_model_1.Products.findOne({ 'seo.productUrl': productData.seo.productUrl }).session(session).lean()
                : null
        ]);
        if (existingTitle)
            throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Product title exists');
        if (existingSku)
            throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Product SKU exists');
        if (existingUrl)
            throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'Product URL exists');
        const productToCreate = Object.assign(Object.assign({}, productData), { viewCount: 0, purchaseCount: 0, statusInfo: Object.assign(Object.assign({}, productData.statusInfo), { status: ((_b = productData.statusInfo) === null || _b === void 0 ? void 0 : _b.status) || 'active', date: new Date() }) });
        const [createdProduct] = yield products_model_1.Products.create([productToCreate], { session });
        yield session.commitTransaction();
        return createdProduct;
    }
    catch (error) {
        yield session.abortTransaction();
        if (error instanceof apiErrors_1.default)
            throw error;
        throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Product creation failed');
    }
    finally {
        session.endSession();
    }
});
exports.AddProducts = AddProducts;
/**
 * GetProducts Services
 * Handles retrieving all products.
 */
const TotalProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield products_model_1.Products.countDocuments();
});
const GetProducts = (paginationOptions, filters) => __awaiter(void 0, void 0, void 0, function* () {
    // Calculate pagination options
    const { skip, limit, sortBy, sortOrder } = (0, paginationHelpers_1.calculatePagination)(paginationOptions);
    console.log("paginationOptions", paginationOptions);
    console.log("filters", filters);
    // Define sorting conditions
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder;
    }
    // Define filtering conditions
    const andConditions = [];
    // Search by multiple fields
    if (filters.searchTerm) {
        andConditions.push({
            $or: [
                { title: { $regex: filters.searchTerm, $options: 'i' } },
                { "basicInfo.description": { $regex: filters.searchTerm, $options: 'i' } },
                { "seo.pageTitle": { $regex: filters.searchTerm, $options: 'i' } },
                { "seo.metaDescription": { $regex: filters.searchTerm, $options: 'i' } },
                { sku: { $regex: filters.searchTerm, $options: 'i' } },
                { category: { $regex: filters.searchTerm, $options: 'i' } },
                { "additionalInfo.tags": { $regex: filters.searchTerm, $options: 'i' } },
                { "inventory.productVariants.color": { $regex: filters.searchTerm, $options: 'i' } },
                { "inventory.productVariants.size": { $regex: filters.searchTerm, $options: 'i' } },
            ],
        });
    }
    // Filter by price range (applied to pricing.defaultPrice, pricing.cost, and pricing.salePrice)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceCondition = {};
        if (filters.minPrice !== undefined)
            priceCondition.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined)
            priceCondition.$lte = filters.maxPrice;
        // Apply the price condition to defaultPrice, cost, and salePrice
        andConditions.push({
            $or: [
                { "pricing.defaultPrice": priceCondition },
                { "pricing.cost": priceCondition },
                { "pricing.salePrice": priceCondition },
            ],
        });
    }
    if (filters.category) {
        andConditions.push({ category: filters.category });
    }
    // Combine filtering conditions
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    // Fetch products with pagination, sorting, and filtering
    const products = yield products_model_1.Products.find(whereConditions)
        .populate({ path: "collections", select: "title" })
        .sort(sortConditions)
        .skip(skip)
        .limit(limit);
    // Get the total count of products (for pagination metadata)
    const total = yield products_model_1.Products.countDocuments(whereConditions);
    // Replace collections ID with collection title in the response
    const formattedProducts = products.map((product) => {
        var _a;
        return (Object.assign(Object.assign({}, product.toObject()), { 
            //@ts-ignore
            collections: ((_a = product.collections) === null || _a === void 0 ? void 0 : _a.title) || null }));
    });
    console.log("total", total);
    return {
        data: formattedProducts,
        meta: {
            page: paginationOptions.page || 1,
            limit,
            total,
        },
    };
});
/**
 * UpdateProducts Service
 * Update a single product by ID.
 */
const UpdateProducts = (id, productData) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the product by ID
    const product = yield products_model_1.Products.findById(id);
    // If product not found, throw a 404 error
    if (!product) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    }
    // Update the product with the provided data
    Object.assign(product, productData);
    // Save the updated product
    const updatedProduct = yield product.save();
    // Return the updated product
    return updatedProduct;
});
/**
 * DeleteProducts Service
 * Update a single product by ID.
 */
const DeleteProducts = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the product by ID and delete it in one atomic operation
    const deletedProduct = yield products_model_1.Products.findByIdAndDelete(id);
    // If product not found, throw a 404 error
    if (!deletedProduct) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    }
    // Return the deleted product
    return deletedProduct;
});
/**
 * GetProductBySlug Service
 * Retrieves a single product by ID/Url/Title/slug/productUrl.
 */
const productCache = new node_cache_1.default({
    stdTTL: 3600,
    checkperiod: 600,
    useClones: false
});
const GetProductBySlug = (identifier) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    // 1. Check cache first - convert all identifiers to string for cache lookup
    const cacheKey = identifier.toString().toLowerCase();
    const cachedProduct = productCache.get(cacheKey);
    if (cachedProduct)
        return cachedProduct;
    // 2. Determine query based on identifier type
    let query;
    if (mongoose_1.Types.ObjectId.isValid(identifier)) {
        // Only use ObjectId query if it's actually a valid ObjectId
        query = { _id: new mongoose_1.Types.ObjectId(identifier) };
    }
    else {
        // Handle string identifiers (slug, productUrl, title)
        const normalizedIdentifier = identifier.toString().toLowerCase().trim();
        query = {
            $or: [
                { slug: normalizedIdentifier },
                { 'seo.productUrl': normalizedIdentifier },
                { title: { $regex: new RegExp(`^${normalizedIdentifier}$`, 'i') } }
            ]
        };
    }
    // 3. Optimized database lookup and increment viewCount atomically
    const product = yield products_model_1.Products.findOneAndUpdate(query, { $inc: { viewCount: 1 } }, { new: true, lean: true, maxTimeMS: 30 });
    if (!product)
        return null;
    const cacheKeys = [
        product._id.toString(),
        (_b = (_a = product.slug) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '',
        (_e = (_d = (_c = product.seo) === null || _c === void 0 ? void 0 : _c.productUrl) === null || _d === void 0 ? void 0 : _d.toLowerCase()) !== null && _e !== void 0 ? _e : '',
        product.title.toLowerCase()
    ];
    cacheKeys.forEach(key => {
        if (key)
            productCache.set(key, product);
    });
    return product;
});
/**
 * SearchProducts Service
 * Searches products by query, category, price range, etc.
 */
const SearchProducts = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, category, minPrice, maxPrice, brand, status, rating, tags, color, size } = filters;
    // Calculate pagination options
    const { skip, limit, sortBy, sortOrder } = (0, paginationHelpers_1.calculatePagination)(paginationOptions);
    // Define sorting conditions
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder;
    }
    // Define filtering conditions
    const andConditions = [];
    // Search by multiple fields
    if (searchTerm) {
        andConditions.push({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { 'basicInfo.description': { $regex: searchTerm, $options: 'i' } },
                { 'seo.pageTitle': { $regex: searchTerm, $options: 'i' } },
                { 'seo.metaDescription': { $regex: searchTerm, $options: 'i' } },
                { sku: { $regex: searchTerm, $options: 'i' } },
                { category: { $regex: searchTerm, $options: 'i' } },
                { 'additionalInfo.tags': { $regex: searchTerm, $options: 'i' } },
                { 'inventory.productVariants.color': { $regex: searchTerm, $options: 'i' } },
                { 'inventory.productVariants.size': { $regex: searchTerm, $options: 'i' } },
            ],
        });
    }
    // Filter by price range (applied to pricing.defaultPrice, pricing.cost, and pricing.salePrice)
    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceCondition = {};
        if (minPrice !== undefined)
            priceCondition.$gte = minPrice;
        if (maxPrice !== undefined)
            priceCondition.$lte = maxPrice;
        // Apply the price condition to defaultPrice, cost, and salePrice
        andConditions.push({
            $or: [
                { 'pricing.defaultPrice': priceCondition },
                { 'pricing.cost': priceCondition },
                { 'pricing.salePrice': priceCondition },
            ],
        });
    }
    // Filter by category
    if (category) {
        andConditions.push({ category: { $regex: category, $options: 'i' } });
    }
    // Filter by brand
    if (brand) {
        andConditions.push({ 'basicInfo.brand': { $regex: brand, $options: 'i' } });
    }
    // Filter by status
    if (status) {
        andConditions.push({ 'statusInfo.status': status });
    }
    // Filter by rating
    if (rating !== undefined) {
        andConditions.push({ rating: { $gte: rating } });
    }
    // Filter by tags
    if (tags && tags.length > 0) {
        andConditions.push({ 'additionalInfo.tags': { $in: tags } });
    }
    // Filter by color
    if (color) {
        andConditions.push({ 'inventory.productVariants.color': { $regex: color, $options: 'i' } });
    }
    // Filter by size
    if (size) {
        andConditions.push({ 'inventory.productVariants.size': { $regex: size, $options: 'i' } });
    }
    // Combine all conditions with $and
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    // Execute the query
    const products = yield products_model_1.Products.find(whereConditions)
        .sort(sortConditions)
        .skip(skip)
        .limit(limit)
        .exec();
    // Get the total count of matching products (for pagination)
    const total = yield products_model_1.Products.countDocuments(whereConditions);
    // Throw an error if no products are found
    if (products.length === 0) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'No products found matching your criteria');
    }
    return {
        meta: {
            page: paginationOptions.page || 1,
            limit,
            total,
        },
        data: products,
    };
});
/**
 * GetProductsByCategory Service
 * Retrieves products by category ID.
 */
const GetProductsByCollections = (collectionsId) => __awaiter(void 0, void 0, void 0, function* () {
    // Convert collectionsId to ObjectId
    const objectId = new mongoose_1.Types.ObjectId(collectionsId);
    // Find products where the collections field matches the provided ObjectId
    const products = yield products_model_1.Products.find({ collections: objectId });
    // Throw an error if no products are found
    if (products.length === 0) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'No products found for this collection');
    }
    return products;
});
/**
 * GetFeaturedProducts Service
 * Retrieves featured products.
 */
const GetFeaturedProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield products_model_1.Products.find({ isFeatured: true });
    return products;
});
/**
 * GetRelatedProducts Service
 * Retrieves related products for a given product ID.
 */
const GetRelatedProducts = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Find the current product
    const product = yield products_model_1.Products.findById(productId);
    if (!product) {
        throw new apiErrors_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    }
    // Fetch related products
    const relatedProducts = yield products_model_1.Products.find({
        $or: [
            { category: product.category },
            { 'basicInfo.brand': (_a = product.basicInfo) === null || _a === void 0 ? void 0 : _a.brand },
            { collections: product.collections },
        ],
        _id: { $ne: productId },
    })
        .limit(10)
        .exec();
    // If there are not enough related products, fetch trending products
    if (relatedProducts.length < 10) {
        const trendingProducts = yield (0, products_utils_1.GetTrendingProducts)();
        const combinedProducts = [...relatedProducts, ...trendingProducts.slice(0, 10 - relatedProducts.length)];
        return combinedProducts;
    }
    return relatedProducts;
});
const getTopCategoriesByProductCount = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield products_model_1.Products.aggregate([
        {
            $group: {
                _id: "$category",
                productCount: { $sum: 1 }
            }
        },
        {
            $sort: { productCount: -1 }
        },
        {
            $limit: 5
        }
    ]);
    return result;
});
const getTopTrendingProducts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 5) {
    const products = yield products_model_1.Products.find({})
        .sort({ viewCount: -1 })
        .limit(limit)
        .select('title  viewCount seo.productUrl pricing.salePrice images purchaseCount inventory.curStock')
        .lean();
    return products;
});
exports.ProductService = {
    AddProducts: exports.AddProducts,
    GetProducts,
    UpdateProducts,
    DeleteProducts,
    GetProductBySlug,
    SearchProducts,
    GetProductsByCollections,
    GetFeaturedProducts,
    GetRelatedProducts,
    TotalProducts,
    getTopCategoriesByProductCount,
    getTopTrendingProducts
};
