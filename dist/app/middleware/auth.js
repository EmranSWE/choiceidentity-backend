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
exports.socketAuth = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const apiErrors_1 = __importDefault(require("../../errors/apiErrors"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const getTokenFromHeader = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
};
const hasRequiredRole = (userRole, requiredRoles) => {
    return requiredRoles.includes(userRole);
};
const auth = (...requiredRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get token from header
        const token = getTokenFromHeader(req);
        if (!token) {
            console.warn('Authorization token missing');
            throw new apiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        // Verify token
        const verifiedUser = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.secret);
        req.user = verifiedUser;
        // Role-based access control
        if (requiredRoles.length && !hasRequiredRole(verifiedUser.role, requiredRoles)) {
            console.warn(`Forbidden access attempt by role: ${verifiedUser.role}`);
            throw new apiErrors_1.default(http_status_1.default.FORBIDDEN, 'Forbidden!');
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = auth;
// Socket authentication middleware
const socketAuth = (...requiredRoles) => (socket, next) => {
    var _a;
    try {
        const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
        if (!token) {
            console.warn('Socket auth failed: No token');
            return next(new Error('Unauthorized! Token missing'));
        }
        const verifiedUser = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.secret);
        socket.data.user = verifiedUser;
        // Check roles
        if (requiredRoles.length && !hasRequiredRole(verifiedUser.role, requiredRoles)) {
            return next(new Error('Forbidden! Insufficient role.'));
        }
        next();
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error!'));
    }
};
exports.socketAuth = socketAuth;
