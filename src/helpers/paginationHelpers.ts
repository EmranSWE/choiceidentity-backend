import { Request } from 'express';
import { SortOrder } from 'mongoose';

/**
 * Interface for pagination options.
 */
export type IPaginationOptions ={
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

/**
 * Interface for the result of pagination calculations.
 */
export type IPaginationResult ={
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: SortOrder;
}

/**
 * Calculate pagination options (skip, limit, sortBy, sortOrder) based on the request query.
 */

export const calculatePagination = (options: IPaginationOptions): IPaginationResult => {
  const page = Number(options.page || 1); 
  const limit = Number(options.limit || 10); 
  const skip = (page - 1) * limit; 
  const sortBy = options.sortBy || 'createdAt'; 
  const sortOrder = options.sortOrder || 'desc'; 

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

/**
 * Extract pagination and filtering options from the request query.
 */
export const getPaginationAndFilters = <T extends Record<string, unknown>>(
  req: Request
): {
  paginationOptions: IPaginationOptions;
  filters: T;
} => {
  const { page, limit, sortBy, sortOrder, ...filters } = req.query;

  // Define pagination options
  const paginationOptions: IPaginationOptions = {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as SortOrder,
  };

  // Define filters (if any)
  const filterOptions = filters as T;

  return {
    paginationOptions,
    filters: filterOptions,
  };
};