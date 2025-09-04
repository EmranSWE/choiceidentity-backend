import express from 'express';
import { AuthRouter } from '../modules/auth/auth.route';
import { ProductRoutes } from '../modules/products/products.route';
// import { NotificationRoutes } from '../modules/notifications/notifications.route';
import { PaymentRouter } from '../modules/stripe/stripe.route';
import { affiliateRoutes } from '../modules/affiliate/affiliate.route';
import { PasswordRoutes } from '../modules/features/passwordHealth/passwordHealth.route';
import { CreditRoutes } from '../modules/features/creditMonitoring/creditMonitoring.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/users',
    route: AuthRouter,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
//     {
//     path: '/notifications',
//     route: NotificationRoutes,
//   },

    {
    path: '/payment',
    route: PaymentRouter,
  },
   {
    path: '/affiliate',
    route: affiliateRoutes,
  },
    {
    path: '/password',
    route: PasswordRoutes,
  },
    {
    path: '/credit',
    route: CreditRoutes,
  },

];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
