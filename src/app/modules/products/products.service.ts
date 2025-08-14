/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Products } from './products.model';
import { IProductFilters, IProducts, IProductSearchFilters } from './products.interface';
import ApiError from '../../../errors/apiErrors';
import httpStatus from 'http-status';
import { calculatePagination, IPaginationOptions } from '../../../helpers/paginationHelpers';
import mongoose, { SortOrder, Types } from 'mongoose';
import { GetTrendingProducts, validateProductData } from './products.utils';
import NodeCache from 'node-cache';



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

  
  export const AddProducts = async (
    productData: IProducts
  ): Promise<IProducts> => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      validateProductData(productData);
  
      const [existingTitle, existingSku, existingUrl] = await Promise.all([
        Products.findOne({ title: productData.title }).session(session).lean(),
        Products.findOne({ sku: productData.sku }).session(session).lean(),
        productData.seo?.productUrl 
          ? Products.findOne({ 'seo.productUrl': productData.seo.productUrl }).session(session).lean()
          : null
      ]);
  
      if (existingTitle) throw new ApiError(httpStatus.CONFLICT, 'Product title exists');
      if (existingSku) throw new ApiError(httpStatus.CONFLICT, 'Product SKU exists');
      if (existingUrl) throw new ApiError(httpStatus.CONFLICT, 'Product URL exists');
  
      const productToCreate = {
        ...productData,
        viewCount: 0,
        purchaseCount: 0,
        statusInfo: {
          ...productData.statusInfo,
          status: productData.statusInfo?.status || 'active',
          date: new Date()
        }
      };
  
      const [createdProduct] = await Products.create([productToCreate], { session });
  
      await session.commitTransaction();
  
      return createdProduct;
    } catch (error) {
      await session.abortTransaction();
      
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Product creation failed',
      );
    } finally {
      session.endSession();
    }
  };


/**
 * GetProducts Services
 * Handles retrieving all products.
 */
const TotalProducts = async (): Promise<number> => {
  return await Products.countDocuments();
};


const GetProducts = async (
  paginationOptions: IPaginationOptions,
  filters: IProductFilters
): Promise<{
  data: IProducts[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}> => {
  // Calculate pagination options
  const { skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
console.log("paginationOptions",paginationOptions)
console.log("filters",filters)

   // Define sorting conditions
   const sortConditions: { [key: string]: SortOrder } = {};
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
    const priceCondition: { $gte?: number; $lte?: number } = {};
    if (filters.minPrice !== undefined) priceCondition.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceCondition.$lte = filters.maxPrice;

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
   const products = await Products.find(whereConditions)
   .populate({ path: "collections", select: "title" })
     .sort(sortConditions)
     .skip(skip)
     .limit(limit);
 
   // Get the total count of products (for pagination metadata)
   const total = await Products.countDocuments(whereConditions);


    // Replace collections ID with collection title in the response
  const formattedProducts = products.map((product) => ({
    ...product.toObject(),
    //@ts-ignore
    collections: product.collections?.title || null, // Replace ID with title
  }));
  console.log("total",total)
   return {
     data: formattedProducts,
     meta: {
       page: paginationOptions.page || 1,
       limit,
       total,
     },
   };
};

/**
 * UpdateProducts Service
 * Update a single product by ID.
 */
const UpdateProducts = async (id: string, productData: Partial<IProducts>): Promise<IProducts | null> => {
  // Find the product by ID
  const product = await Products.findById(id);
  
  // If product not found, throw a 404 error
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Update the product with the provided data
  Object.assign(product, productData);

  // Save the updated product
  const updatedProduct = await product.save();

  // Return the updated product
  return updatedProduct;
};



/**
 * DeleteProducts Service
 * Update a single product by ID.
 */
const DeleteProducts = async (id: string): Promise<IProducts | null> => {
  // Find the product by ID and delete it in one atomic operation
  const deletedProduct = await Products.findByIdAndDelete(id);

  // If product not found, throw a 404 error
  if (!deletedProduct) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Return the deleted product
  return deletedProduct;
};



/**
 * GetProductBySlug Service
 * Retrieves a single product by ID/Url/Title/slug/productUrl.
 */


const productCache = new NodeCache({ 
    stdTTL: 3600, 
    checkperiod: 600, 
    useClones: false 
  });
  
  const GetProductBySlug = async (identifier: string | Types.ObjectId): Promise<IProducts | null> => {
    // 1. Check cache first - convert all identifiers to string for cache lookup
    const cacheKey = identifier.toString().toLowerCase();
    const cachedProduct = productCache.get<IProducts>(cacheKey);
    if (cachedProduct) return cachedProduct;
  
    // 2. Determine query based on identifier type
    let query;
    if (Types.ObjectId.isValid(identifier)) {
      // Only use ObjectId query if it's actually a valid ObjectId
      query = { _id: new Types.ObjectId(identifier) };
    } else {
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
  const product = await Products.findOneAndUpdate(
    query,
    { $inc: { viewCount: 1 } },
    { new: true, lean: true, maxTimeMS: 30 }
  );

  if (!product) return null;
  
    const cacheKeys = [
      product._id.toString(),
      product.slug?.toLowerCase() ?? '',
      product.seo?.productUrl?.toLowerCase() ?? '',
      product.title.toLowerCase()
    ];
  
    cacheKeys.forEach(key => {
      if (key) productCache.set(key, product);
    });
  
    return product;
  };

/**
 * SearchProducts Service
 * Searches products by query, category, price range, etc.
 */
const SearchProducts = async (
  filters: IProductSearchFilters,
  paginationOptions: IPaginationOptions
) => {
  const { searchTerm, category, minPrice, maxPrice, brand, status, rating, tags, color, size } = filters;

  // Calculate pagination options
  const { skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

  // Define sorting conditions
  const sortConditions: { [key: string]: SortOrder } = {};
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
    const priceCondition: { $gte?: number; $lte?: number } = {};
    if (minPrice !== undefined) priceCondition.$gte = minPrice;
    if (maxPrice !== undefined) priceCondition.$lte = maxPrice;

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
  const products = await Products.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit)
    .exec();

  // Get the total count of matching products (for pagination)
  const total = await Products.countDocuments(whereConditions);

  // Throw an error if no products are found
  if (products.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No products found matching your criteria');
  }

  return {
    meta: {
      page: paginationOptions.page || 1,
      limit,
      total,
    },
    data: products,
  };
};
/**
 * GetProductsByCategory Service
 * Retrieves products by category ID.
 */
const GetProductsByCollections = async (collectionsId: string): Promise<IProducts[]> => {
  // Convert collectionsId to ObjectId
  const objectId = new Types.ObjectId(collectionsId);

  // Find products where the collections field matches the provided ObjectId
  const products = await Products.find({ collections: objectId });

  // Throw an error if no products are found
  if (products.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No products found for this collection');
  }

  return products;
};
/**
 * GetFeaturedProducts Service
 * Retrieves featured products.
 */
const GetFeaturedProducts = async (): Promise<IProducts[]> => {
  const products = await Products.find({ isFeatured: true });
  return products;
};

/**
 * GetRelatedProducts Service
 * Retrieves related products for a given product ID.
 */
const GetRelatedProducts = async (productId: string): Promise<IProducts[]> => {
  // Find the current product
  const product = await Products.findById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Fetch related products
  const relatedProducts = await Products.find({
    $or: [
      { category: product.category },
      { 'basicInfo.brand': product.basicInfo?.brand },
      { collections: product.collections },
    ],
    _id: { $ne: productId },
  })
    .limit(10)
    .exec();

  // If there are not enough related products, fetch trending products
  if (relatedProducts.length < 10) {
    const trendingProducts = await GetTrendingProducts();
    const combinedProducts = [...relatedProducts, ...trendingProducts.slice(0, 10 - relatedProducts.length)];
    return combinedProducts;
  }

  return relatedProducts;
};

const getTopCategoriesByProductCount = async () => {
 const result = await Products.aggregate([
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
};
const getTopTrendingProducts = async (limit = 5) => {
  const products = await Products.find({})
    .sort({ viewCount: -1 })
    .limit(limit)
    .select('title  viewCount seo.productUrl pricing.salePrice images purchaseCount inventory.curStock')
    .lean();
  return products;
};
export const ProductService = {
  AddProducts,
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
