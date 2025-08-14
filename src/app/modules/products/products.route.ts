import express from 'express';
import { ProductController } from './products.controller';
import validateRequest from '../../middleware/validateRequest';
import { productSchema, productUpdateSchema } from './products.validation';
import auth from '../../middleware/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { globalRateLimiter } from '../../middleware/globalRateLimiter';

const router = express.Router();

// Core routes
router.post('/add-products',  validateRequest(productSchema), ProductController.AddProducts);
router.get('/get-products', ProductController.GetProducts);
router.get('/total-products', ProductController.TotalProducts);
router.patch('/update-products/:id',  auth(ENUM_USER_ROLE.SUPER_ADMIN),globalRateLimiter,validateRequest(productUpdateSchema), ProductController.UpdateProducts);
router.delete('/delete-products/:id',  auth(ENUM_USER_ROLE.SUPER_ADMIN),globalRateLimiter, ProductController.DeleteProducts);
// Additional routes
router.get('/get-products/:slug', ProductController.GetProductBySlug);
router.get('/search-products', ProductController.SearchProducts);
router.get('/get-products-by-collections/:collectionsId', ProductController.GetProductsByCollections);
router.get('/get-featured-products', ProductController.GetFeaturedProducts);
router.get('/get-related-products/:productId', ProductController.GetRelatedProducts);

router.get('/top-category/', ProductController.getTopCategoriesByProductCount);

router.get('/top-trending-products', ProductController.getTopTrendingProducts);


export const ProductRoutes = router;
