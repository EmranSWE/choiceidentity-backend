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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const products_service_1 = require("./products.service");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
/**
 * AddProducts Controller
 * Handles the creation of a new product.
 */
const AddProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productData = req.body;
    const result = yield products_service_1.ProductService.AddProducts(productData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product created successfully',
        data: result,
    });
}));
/**
 * GetProducts Controller
 * Handles retrieving all products.
 */
const GetProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract query parameters for pagination and filtering
    const { paginationOptions, filters } = (0, paginationHelpers_1.getPaginationAndFilters)(req);
    // Call the service to get products with pagination and filters
    const result = yield products_service_1.ProductService.GetProducts(paginationOptions, filters);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Products retrieved successfully',
        data: {
            data: result.data,
            meta: result.meta,
        },
    });
}));
const TotalProducts = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const total = yield products_service_1.ProductService.TotalProducts();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Total products retrieved successfully',
        data: total,
    });
}));
/**
 * UpdateProducts Controller
 * Handles updating an existing product by ID.
 */
const UpdateProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const productData = req.body;
    // Call the service to update the product
    const result = yield products_service_1.ProductService.UpdateProducts(id, productData);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product updated successfully',
        data: result,
    });
}));
/**
 * DeleteProducts Controller
 * Handles deleting an existing product by ID.
 */
const DeleteProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log("Delete req", id);
    // // Call the service to delete the product
    const result = yield products_service_1.ProductService.DeleteProducts(id);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product deleted successfully',
        data: result,
    });
}));
/**
 * GetProductBySlug Controller
 * Handles retrieving a single product by ID/Url/Title.
 */
const GetProductBySlug = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { slug } = req.params;
    const result = yield products_service_1.ProductService.GetProductBySlug(slug);
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Product not found',
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product retrieved successfully',
        data: result,
    });
}));
/**
 * SearchProducts Controller
 * Handles searching products by query, category, price range, etc.
 */
const SearchProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paginationOptions, filters } = (0, paginationHelpers_1.getPaginationAndFilters)(req);
    // Call the service to search products
    const result = yield products_service_1.ProductService.SearchProducts(filters, paginationOptions);
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Product not found',
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Products retrieved successfully',
        data: result,
    });
}));
/**
 * GetProductsByCollections Controller
 * Handles retrieving products by category ID.
 */
const GetProductsByCollections = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionsId } = req.params;
    // Call the service to get products by collection
    const result = yield products_service_1.ProductService.GetProductsByCollections(collectionsId);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Products retrieved successfully for the collection',
        data: result,
    });
}));
/**
 * GetFeaturedProducts Controller
 * Handles retrieving featured products.
 */
const GetFeaturedProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield products_service_1.ProductService.GetFeaturedProducts();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Featured products retrieved successfully',
        data: result,
    });
}));
/**
 * GetRelatedProducts Controller
 * Handles retrieving related products for a given product ID.
 */
const GetRelatedProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield products_service_1.ProductService.GetRelatedProducts(productId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Related products retrieved successfully',
        data: result,
    });
}));
const getTopCategoriesByProductCount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Call the service to get products by collection
    const result = yield products_service_1.ProductService.getTopCategoriesByProductCount();
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Top Category product metrics',
        data: result,
    });
}));
const getTopTrendingProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 5;
    const result = yield products_service_1.ProductService.getTopTrendingProducts(limit);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Top Category viewing',
        data: result,
    });
}));
exports.ProductController = {
    AddProducts,
    TotalProducts,
    GetProducts,
    UpdateProducts,
    DeleteProducts,
    GetProductBySlug,
    SearchProducts,
    GetProductsByCollections,
    GetFeaturedProducts,
    GetRelatedProducts,
    getTopCategoriesByProductCount,
    getTopTrendingProducts
};
