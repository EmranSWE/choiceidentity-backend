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


import { ZodError } from 'zod';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import config from '../../config';
import { IGenericErrorMessage } from '../../interface/error';
import handleValidationError from '../../errors/handleValidation';
import ApiError from '../../errors/apiErrors';
import { errorLogger } from '../../shared/logger';
import handleZodError from '../../errors/handledZodError';
import handleCastError from '../../errors/handledCastError';

process.on('uncaughtException', error => {
  errorLogger.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  errorLogger.error('Unhandled Rejection:', error);
  process.exit(1);
});

const globalErrorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  // console.log("Im here in globalErrorHandler",error)
  if (config.env === 'development') {
    console.log('Error logger:', error);
  } else {
    errorLogger.error('Global error:', {
      message: error.message,
      stack: error.stack,
      requestId: req.headers['x-request-id'],
      endpoint: req.originalUrl,
      user: req.user?.id, 
    });
  }

  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorMessage: IGenericErrorMessage[] = [];

  if (error.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessage = simplifiedError.errorMessage;
  } else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessage = simplifiedError.errorMessage;
  } else if (error?.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessage = simplifiedError.errorMessage;
  } else if (error instanceof ApiError) {
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
  } else if (error instanceof Error) {
    message = error?.message;
    errorMessage = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errorMessage,
    stack: config.env !== 'production' ? error?.stack : undefined,
  });

  next();
};

export default globalErrorHandler;