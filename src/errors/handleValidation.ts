import mongoose from 'mongoose';
import { IGenericErrorMessage } from '../interface/error';
import { IGenericErrorResponse } from '../interface/common';

const handleValidationError = (
  err: mongoose.Error.ValidationError
): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = Object.values(err.errors).map(
    (element: mongoose.Error.ValidatorError | mongoose.Error.CastError) => {
      return {
        path: element?.path,
        message: element?.message,
      };
    }
  );
  const statusCode = 400;
  return {
    statusCode,
    message: 'Validation error',
    errorMessage: errors,
  };
};

export default handleValidationError;
