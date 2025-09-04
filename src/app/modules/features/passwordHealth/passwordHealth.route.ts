import express from 'express';
import auth from '../../../middleware/auth';
import { ENUM_USER_ROLE } from '../../../../enums/user';
import { PasswordController } from './passwordHealth.controller';


const router = express.Router();


router.get('/features/password-score',auth(ENUM_USER_ROLE.AFFILIATE), PasswordController.fetchPasswordScore);

export const PasswordRoutes = router;
