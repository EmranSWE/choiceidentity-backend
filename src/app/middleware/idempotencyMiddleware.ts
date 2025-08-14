import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/apiErrors";
import { IdempotencyKeyModel } from "../modules/stripe/stripe.model";

export const idempotencyMiddleware = () => async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = (req.headers["idempotency-key"] || req.headers["Idempotency-Key"]) as string;
  if (!idempotencyKey) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing Idempotency-Key header");
  }

  res.locals.idempotencyKey = idempotencyKey;

  const scope = `${req.method.toUpperCase()}:${req.originalUrl}`;


  try {
    // Check if key exists
    const existing = await IdempotencyKeyModel.findOne({ key: idempotencyKey, scope }).lean();

    if (existing) {
      if (existing.status === "completed") {
        return res.status(httpStatus.OK).json(existing.responseData);
      }
      if (existing.status === "processing") {
        return res.status(httpStatus.CONFLICT).json({ message: "Request already processing. Please wait." });
      }
    }

    // Try to create processing record atomically
    try {
      await IdempotencyKeyModel.create({ key: idempotencyKey, scope, status: "processing", createdAt: new Date() });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(httpStatus.CONFLICT).json({ message: "Duplicate request in progress. Please wait." });
      }
      throw err;
    }

    // Intercept res.json to save response and mark completed
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      IdempotencyKeyModel.updateOne(
        { key: idempotencyKey, scope },
        { $set: { status: "completed", responseData: body, completedAt: new Date() } }
      ).catch(() => {
        // Log error in your real logger here if needed
      });
      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
