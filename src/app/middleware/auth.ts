import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../config';
import { Secret } from 'jsonwebtoken';
import ApiError from '../../errors/apiErrors';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import { Socket } from 'socket.io';


const getTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

const hasRequiredRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};


const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from header
      const token = getTokenFromHeader(req);

      if (!token) {
        console.warn('Authorization token missing');
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      // Verify token
      const verifiedUser = jwtHelpers.verifyToken(token, config.jwt.secret as Secret);
      req.user = verifiedUser;

      // Role-based access control
      if (requiredRoles.length && !hasRequiredRole(verifiedUser.role, requiredRoles)) {
        console.warn(`Forbidden access attempt by role: ${verifiedUser.role}`);
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden!');
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;


// Socket authentication middleware

export const socketAuth =
  (...requiredRoles: string[]) =>
  (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        console.warn('Socket auth failed: No token');
        return next(new Error('Unauthorized! Token missing'));
      }

      const verifiedUser = jwtHelpers.verifyToken(token, config.jwt.secret as Secret);
      socket.data.user = verifiedUser;

      // Check roles
      if (requiredRoles.length && !hasRequiredRole(verifiedUser.role, requiredRoles)) {
        return next(new Error('Forbidden! Insufficient role.'));
      }

      next(); 
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error!'));
    }
  };
