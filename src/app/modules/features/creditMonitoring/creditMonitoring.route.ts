import express from 'express';
import auth from '../../../middleware/auth';
import { ENUM_USER_ROLE } from '../../../../enums/user';
import { CreditController } from './creditMonitoring.controller';

const router = express.Router();

router.get(
  '/report',
  auth(ENUM_USER_ROLE.AFFILIATE),
  CreditController.fetchCreditReport
);

export const CreditRoutes = router;
