import express from 'express';
import { AffiliateController } from './affiliate.controller';

const router = express.Router();

router.post('/generate', AffiliateController.createAffiliateLink); 
router.get('/:affiliateCode', AffiliateController.listAffiliateLinks); 
router.get('/click/:slug', AffiliateController.affiliateClick); 


export const affiliateRoutes = router;