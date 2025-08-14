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
exports.idempotencyMiddleware = void 0;
const http_status_1 = __importDefault(require("http-status"));
const apiErrors_1 = __importDefault(require("../../errors/apiErrors"));
const stripe_model_1 = require("../modules/stripe/stripe.model");
const idempotencyMiddleware = () => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const idempotencyKey = (req.headers["idempotency-key"] || req.headers["Idempotency-Key"]);
    if (!idempotencyKey) {
        throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, "Missing Idempotency-Key header");
    }
    res.locals.idempotencyKey = idempotencyKey;
    const scope = `${req.method.toUpperCase()}:${req.originalUrl}`;
    try {
        // Check if key exists
        const existing = yield stripe_model_1.IdempotencyKeyModel.findOne({ key: idempotencyKey, scope }).lean();
        if (existing) {
            if (existing.status === "completed") {
                return res.status(http_status_1.default.OK).json(existing.responseData);
            }
            if (existing.status === "processing") {
                return res.status(http_status_1.default.CONFLICT).json({ message: "Request already processing. Please wait." });
            }
        }
        // Try to create processing record atomically
        try {
            yield stripe_model_1.IdempotencyKeyModel.create({ key: idempotencyKey, scope, status: "processing", createdAt: new Date() });
        }
        catch (err) {
            if (err.code === 11000) {
                return res.status(http_status_1.default.CONFLICT).json({ message: "Duplicate request in progress. Please wait." });
            }
            throw err;
        }
        // Intercept res.json to save response and mark completed
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            stripe_model_1.IdempotencyKeyModel.updateOne({ key: idempotencyKey, scope }, { $set: { status: "completed", responseData: body, completedAt: new Date() } }).catch(() => {
                // Log error in your real logger here if needed
            });
            return originalJson(body);
        };
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.idempotencyMiddleware = idempotencyMiddleware;
