"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleZodError = (error) => {
    const errors = error.issues.map(issue => {
        console.log("Error handler ", error);
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
exports.default = handleZodError;
