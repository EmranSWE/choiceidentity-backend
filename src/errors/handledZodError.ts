import { ZodError } from 'zod';
import { IGenericErrorMessage } from '../interface/error';

const handleZodError = (error: ZodError) => {
  const errors: IGenericErrorMessage[] = error.issues.map(issue => {
   console.log("Error handler ",error)
    return {
      path: issue.path.join('.'),
      message: issue.message,
    };
  });

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorMessage: errors,
  };
};

export default handleZodError;