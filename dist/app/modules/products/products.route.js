"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRoutes = void 0;
const express_1 = __importDefault(require("express"));
const products_controller_1 = require("./products.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const products_validation_1 = require("./products.validation");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const globalRateLimiter_1 = require("../../middleware/globalRateLimiter");
const router = express_1.default.Router();
// Core routes
router.post('/add-products', (0, validateRequest_1.default)(products_validation_1.productSchema), products_controller_1.ProductController.AddProducts);
router.get('/get-products', products_controller_1.ProductController.GetProducts);
router.get('/total-products', products_controller_1.ProductController.TotalProducts);
router.patch('/update-products/:id', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN), globalRateLimiter_1.globalRateLimiter, (0, validateRequest_1.default)(products_validation_1.productUpdateSchema), products_controller_1.ProductController.UpdateProducts);
router.delete('/delete-products/:id', (0, auth_1.default)(user_1.ENUM_USER_ROLE.SUPER_ADMIN), globalRateLimiter_1.globalRateLimiter, products_controller_1.ProductController.DeleteProducts);
// Additional routes
router.get('/get-products/:slug', products_controller_1.ProductController.GetProductBySlug);
router.get('/search-products', products_controller_1.ProductController.SearchProducts);
router.get('/get-products-by-collections/:collectionsId', products_controller_1.ProductController.GetProductsByCollections);
router.get('/get-featured-products', products_controller_1.ProductController.GetFeaturedProducts);
router.get('/get-related-products/:productId', products_controller_1.ProductController.GetRelatedProducts);
router.get('/top-category/', products_controller_1.ProductController.getTopCategoriesByProductCount);
router.get('/top-trending-products', products_controller_1.ProductController.getTopTrendingProducts);
exports.ProductRoutes = router;
