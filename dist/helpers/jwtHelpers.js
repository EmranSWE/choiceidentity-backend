"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtHelpers = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiErrors_1 = __importDefault(require("../errors/apiErrors"));
const http_status_1 = __importDefault(require("http-status"));
const createToken = (payload, secret, expireTime) => {
    //@ts-ignore
    return jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn: expireTime,
    });
};
const verifyToken = (token, secret) => {
    // return jwt.verify(token, secret) as JwtPayload;
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new apiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'Token has expired');
        }
        throw new apiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid token');
    }
};
exports.jwtHelpers = {
    createToken,
    verifyToken,
};
