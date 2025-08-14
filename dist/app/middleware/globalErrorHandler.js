"use strict";
// /* eslint-disable no-dupe-else-if */
// import { ZodError } from 'zod';
// import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
// import config from '../../config';
// import { IGenericErrorMessage } from '../../interface/error';
// import handleValidationError from '../../errors/handleValidation';
// import ApiError from '../../errors/apiErrors';
// import { errorLogger } from '../../shared/logger';
// import handleZodError from '../../errors/handledZodError';
// import handleCastError from '../../errors/handledCastError';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// process.on('uncaughtException', error => {
//   errorLogger.error(error);
//   process.exit(1);
// });
// const globalErrorHandler: ErrorRequestHandler = (
//   error: any,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   config.env === 'development'
//     ? console.log('Error logger ', error)
//     : errorLogger.error('Global error', error);
//   let statusCode = 400;
//   let message = 'Something went wrong!';
//   let errorMessage: IGenericErrorMessage[] = [];
//   if (error.name === 'ValidationError') {
//     const simplifiedError = handleValidationError(error);
//     statusCode = simplifiedError.statusCode;
//     message = simplifiedError.message;
//     errorMessage = simplifiedError.errorMessage;
//   } else if (error instanceof Error) {
//     message = error?.message;
//     errorMessage = error?.message
//       ? [
//           {
//             path: '',
//             message: error.message,
//           },
//         ]
//       : [];
//   } else if (error instanceof ZodError) {
//     const simplifiedError = handleZodError(error);
//     statusCode = simplifiedError.statusCode;
//     message = simplifiedError.message;
//     errorMessage = simplifiedError.errorMessage;
//   } else if (error?.name === 'CastError') {
//     const simplifiedError = handleCastError(error);
//     statusCode = simplifiedError.statusCode;
//     message = simplifiedError.message;
//     errorMessage = simplifiedError.errorMessage;
//   } else if (error instanceof ApiError) {
//     statusCode = error?.statusCode;
//     message = error?.message;
//     errorMessage = error?.message
//       ? [
//           {
//             path: '',
//             message: error?.message,
//           },
//         ]
//       : [];
//   } else if (error instanceof Error) {
//     message = error?.message;
//     errorMessage = error?.message
//       ? [
//           {
//             path: '',
//             message: error?.message,
//           },
//         ]
//       : [];
//   }
//   res.status(statusCode).json({
//     success: false,
//     message,
//     errorMessage,
//     stack: config.env !== 'production' ? error?.stack : undefined,
//   });
//   next();
// };
// export default globalErrorHandler;
const zod_1 = require("zod");
const config_1 = __importDefault(require("../../config"));
const handleValidation_1 = __importDefault(require("../../errors/handleValidation"));
const apiErrors_1 = __importDefault(require("../../errors/apiErrors"));
const logger_1 = require("../../shared/logger");
const handledZodError_1 = __importDefault(require("../../errors/handledZodError"));
const handledCastError_1 = __importDefault(require("../../errors/handledCastError"));
process.on('uncaughtException', error => {
    logger_1.errorLogger.error(error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    logger_1.errorLogger.error('Unhandled Rejection:', error);
    process.exit(1);
});
const globalErrorHandler = (error, req, res, next) => {
    var _a;
    // console.log("Im here in globalErrorHandler",error)
    if (config_1.default.env === 'development') {
        console.log('Error logger:', error);
    }
    else {
        logger_1.errorLogger.error('Global error:', {
            message: error.message,
            stack: error.stack,
            requestId: req.headers['x-request-id'],
            endpoint: req.originalUrl,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
    }
    let statusCode = 500;
    let message = 'Something went wrong!';
    let errorMessage = [];
    if (error.name === 'ValidationError') {
        const simplifiedError = (0, handleValidation_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorMessage = simplifiedError.errorMessage;
    }
    else if (error instanceof zod_1.ZodError) {
        const simplifiedError = (0, handledZodError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorMessage = simplifiedError.errorMessage;
    }
    else if ((error === null || error === void 0 ? void 0 : error.name) === 'CastError') {
        const simplifiedError = (0, handledCastError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorMessage = simplifiedError.errorMessage;
    }
    else if (error instanceof apiErrors_1.default) {
        statusCode = error.statusCode; // Use the statusCode from the ApiError instance
        message = error.message;
        errorMessage = error.message
            ? [
                {
                    path: '', // Add a meaningful path if available
                    message: error.message,
                },
            ]
            : [];
    }
    else if (error instanceof Error) {
        message = error === null || error === void 0 ? void 0 : error.message;
        errorMessage = (error === null || error === void 0 ? void 0 : error.message)
            ? [
                {
                    path: '',
                    message: error === null || error === void 0 ? void 0 : error.message,
                },
            ]
            : [];
    }
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errorMessage,
        stack: config_1.default.env !== 'production' ? error === null || error === void 0 ? void 0 : error.stack : undefined,
    });
    next();
};
exports.default = globalErrorHandler;
