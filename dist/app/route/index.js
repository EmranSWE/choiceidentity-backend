"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("../modules/auth/auth.route");
const products_route_1 = require("../modules/products/products.route");
// import { NotificationRoutes } from '../modules/notifications/notifications.route';
const stripe_route_1 = require("../modules/stripe/stripe.route");
const affiliate_route_1 = require("../modules/affiliate/affiliate.route");
const passwordHealth_route_1 = require("../modules/features/passwordHealth/passwordHealth.route");
const creditMonitoring_route_1 = require("../modules/features/creditMonitoring/creditMonitoring.route");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/users',
        route: auth_route_1.AuthRouter,
    },
    {
        path: '/products',
        route: products_route_1.ProductRoutes,
    },
    //     {
    //     path: '/notifications',
    //     route: NotificationRoutes,
    //   },
    {
        path: '/payment',
        route: stripe_route_1.PaymentRouter,
    },
    {
        path: '/affiliate',
        route: affiliate_route_1.affiliateRoutes,
    },
    {
        path: '/password',
        route: passwordHealth_route_1.PasswordRoutes,
    },
    {
        path: '/credit',
        route: creditMonitoring_route_1.CreditRoutes,
    },
];
moduleRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
