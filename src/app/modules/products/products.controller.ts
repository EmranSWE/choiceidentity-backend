import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { ProductService } from './products.service';
import httpStatus from 'http-status';
import sendResponse from '../../../shared/sendResponse';
import { getPaginationAndFilters } from '../../../helpers/paginationHelpers';
import { IProductFilters } from './products.interface';

/**
 * AddProducts Controller
 * Handles the creation of a new product.
 */
const AddProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const productData = req.body;
    const result = await ProductService.AddProducts(productData);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Product created successfully',
      data: result,
    });
  }
);

/**
 * GetProducts Controller
 * Handles retrieving all products.
 */
const GetProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {

    // Extract query parameters for pagination and filtering
    const { paginationOptions, filters } = getPaginationAndFilters<IProductFilters>(req);

    // Call the service to get products with pagination and filters
    const result = await ProductService.GetProducts(paginationOptions, filters);
    // Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Products retrieved successfully',
      data: {
        data: result.data ,
        meta: result.meta,
      }, 
    });
  }
);


const TotalProducts: RequestHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const total = await ProductService.TotalProducts();
    sendResponse<number>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Total products retrieved successfully',
      data: total,
    });
  }
);
/**
 * UpdateProducts Controller
 * Handles updating an existing product by ID.
 */
const UpdateProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const productData = req.body;

    // Call the service to update the product
    const result = await ProductService.UpdateProducts(id, productData);

    // Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Product updated successfully',
      data: result,
    });
  }
);

/**
 * DeleteProducts Controller
 * Handles deleting an existing product by ID.
 */
const DeleteProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
console.log("Delete req", id)
    // // Call the service to delete the product
    const result = await ProductService.DeleteProducts(id);

    // Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Product deleted successfully',
      data: result,
    });
  }
);

/**
 * GetProductBySlug Controller
 * Handles retrieving a single product by ID/Url/Title.
 */
const GetProductBySlug: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const result = await ProductService.GetProductBySlug(slug);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Product not found',
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Product retrieved successfully',
      data: result,
    });
  }
);

/**
 * SearchProducts Controller
 * Handles searching products by query, category, price range, etc.
 */
const SearchProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { paginationOptions, filters } = getPaginationAndFilters<IProductFilters>(req);

    // Call the service to search products
    const result = await ProductService.SearchProducts(filters, paginationOptions);
    
    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Product not found',
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Products retrieved successfully',
      data: result,
    });
  }
);

/**
 * GetProductsByCollections Controller
 * Handles retrieving products by category ID.
 */
const GetProductsByCollections: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { collectionsId } = req.params;

    // Call the service to get products by collection
    const result = await ProductService.GetProductsByCollections(collectionsId);

    // Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Products retrieved successfully for the collection',
      data: result,
    });
  }
);


/**
 * GetFeaturedProducts Controller
 * Handles retrieving featured products.
 */
const GetFeaturedProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProductService.GetFeaturedProducts();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Featured products retrieved successfully',
      data: result,
    });
  }
);

/**
 * GetRelatedProducts Controller
 * Handles retrieving related products for a given product ID.
 */
const GetRelatedProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await ProductService.GetRelatedProducts(productId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Related products retrieved successfully',
      data: result,
    });
  }
);



const getTopCategoriesByProductCount: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {

    // Call the service to get products by collection
    const result = await ProductService.getTopCategoriesByProductCount();

    // Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Top Category product metrics',
      data: result,
    });
  }
);


const getTopTrendingProducts: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
    const result = await ProductService.getTopTrendingProducts(limit);

    // Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Top Category viewing',
      data: result,
    });
  }
);

export const ProductController = {
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
