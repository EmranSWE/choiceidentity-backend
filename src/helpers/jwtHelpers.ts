/* eslint-disable @typescript-eslint/ban-ts-comment */
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ApiError from '../errors/apiErrors';
import httpStatus from 'http-status';

const createToken = (
  payload: object,
  secret: Secret,
  expireTime: string
): string => {
    //@ts-ignore
  return jwt.sign(payload, secret, {
    expiresIn: expireTime,
  });
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  // return jwt.verify(token, secret) as JwtPayload;
 
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has expired');
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }
};
export const jwtHelpers = {
  createToken,
  verifyToken,
};
