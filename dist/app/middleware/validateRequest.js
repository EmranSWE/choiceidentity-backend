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
const validateRequest = (schema) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
            cookies: req.cookies,
        });
        return next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = validateRequest;
// import { NextFunction, Request, Response } from 'express';
// import { AnyZodObject, z } from 'zod';
// // Define a type for the validation schema
// type ValidationSchema = {
//   body?: AnyZodObject;
//   query?: AnyZodObject;
//   params?: AnyZodObject;
// };
// const validateRequest =
//   (schema: ValidationSchema) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       // Validate body, query, and params against the schema
//       if (schema.body) {
//         req.body = await schema.body.parseAsync(req.body);
//       }
//       if (schema.query) {
//         req.query = await schema.query.parseAsync(req.query);
//       }
//       if (schema.params) {
//         req.params = await schema.params.parseAsync(req.params);
//       }
//       // Proceed to the next middleware or controller
//       next();
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         // Handle validation errors
//         return res.status(400).json({
//           success: false,
//           message: 'Validation failed',
//           errors: error.errors.map((err) => ({
//             path: err.path.join('.'),
//             message: err.message,
//           })),
//         });
//       }
//       // Pass other errors to the centralized error handler
//       next(error);
//     }
//   };
// export default validateRequest;
