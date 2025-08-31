import express from 'express';
import { AffiliateController } from './affiliate.controller';
import { ENUM_USER_ROLE } from '../../../enums/user';
import auth from '../../middleware/auth';

const router = express.Router();

router.post('/generate', AffiliateController.createAffiliateLink); 
router.get('/:affiliateCode', AffiliateController.listAffiliateLinks); 
router.get('/click/:slug', AffiliateController.affiliateClick); 

// /* 🔹 General Performance */
// // Global KPIs: clicks, conversions, CTR, CR, EPC, revenue, refund rate, ROI
router.get('/overview/core',auth(ENUM_USER_ROLE.AFFILIATE), AffiliateController.getOverview);
// // Time-series data: daily/weekly/monthly trends, configurable date range
// router.get('/:affiliateCode/time-series', AffiliateController.getTimeSeries);
// // Funnel analysis: impressions → clicks → conversions → revenue
// router.get('/:affiliateCode/funnels', AffiliateController.getFunnels);

// /* 🔹 Links & SubID Analytics */
// Performance breakdown for all affiliate links
router.get('/analytics/links/', auth(ENUM_USER_ROLE.AFFILIATE),AffiliateController.listLinks);
// // Detailed performance of a specific affiliate link
// router.get('/:affiliateCode/links/:linkId', AffiliateController.getLinkDetail);
// // SubID-level stats for campaign segmentation
// router.get('/:affiliateCode/subids', AffiliateController.listSubIDs);
// // Detailed performance for a single SubID
// router.get('/:affiliateCode/subids/:subId', AffiliateController.getSubIDDetail);

// /* 🔹 Conversions & Attribution */
// // List of conversions with filters (status, geo, device, time, offer, subid)
// router.get('/:affiliateCode/conversions', AffiliateController.listConversions);
// // Detailed conversion: payout, attribution chain, first click vs last click, device, IP, geo
// router.get('/:affiliateCode/conversions/:id', AffiliateController.getConversionDetail);
// // Attribution models: first-touch, last-touch, linear, position-based, data-driven
// router.get('/:affiliateCode/attribution', AffiliateController.getAttribution);

// /* 🔹 Traffic Quality & Fraud Detection */
// // Suspicious activity: duplicate IPs, proxy/VPN clicks, abnormal CTR/CR
// router.get('/:affiliateCode/fraud-signals', AffiliateController.getFraudSignals);
// // Tracking redirect latency & click → conversion delays
// router.get('/:affiliateCode/latency', AffiliateController.getLatency);
// // Compliance flags: incent traffic, brand bidding, suspicious referrals, fake leads
// router.get('/:affiliateCode/compliance', AffiliateController.getCompliance);

// /* 🔹 Geo & Device Intelligence */
// // Breakdown by country, region, city (CTR, CR, EPC per geo)
// router.get('/:affiliateCode/geo', AffiliateController.getGeoBreakdown);
// // Breakdown by device type: desktop, mobile, tablet
// router.get('/:affiliateCode/device', AffiliateController.getDeviceBreakdown);
// // Browser & OS breakdown: Chrome/Firefox/iOS/Android, etc.
// router.get('/:affiliateCode/browser-os', AffiliateController.getBrowserOSBreakdown);

// /* 🔹 Customer Value & Retention */
// // Lifetime value per acquired customer (avg. revenue per customer, recurring subscriptions)
// router.get('/:affiliateCode/ltv', AffiliateController.getLTV);
// // Cohort retention analysis: day 1/7/30 retention, churn rate, recurring revenue patterns
// router.get('/:affiliateCode/cohorts', AffiliateController.getCohorts);
// // Churned users/leads per affiliate source
// router.get('/:affiliateCode/churn', AffiliateController.getChurn);

// /* 🔹 Competitive & Leaderboards */
// // Top-performing affiliates, links, subIDs, offers ranked by revenue, EPC, CR
// router.get('/:affiliateCode/leaderboard', AffiliateController.getLeaderboard);
// // Industry/offer benchmarks for performance comparison
// router.get('/:affiliateCode/benchmarks', AffiliateController.getBenchmarks);

// /* 🔹 Alerts & Recommendations */
// // Real-time anomaly detection: sudden CR drop, fraud spike, traffic loss
// router.get('/:affiliateCode/alerts', AffiliateController.getAlerts);
// // Optimization tips: best-performing geos, subIDs, dayparting, device targeting
// router.get('/:affiliateCode/recommendations', AffiliateController.getRecommendations);

// /* 🔹 Exports & Reporting */
// // Export filtered analytics to CSV
// router.get('/:affiliateCode/export/csv', AffiliateController.exportCSV);
// // Export filtered analytics to JSON (for BI integrations)
// router.get('/:affiliateCode/export/json', AffiliateController.exportJSON);
// // PDF reports (white-labeled for affiliates)
// router.get('/:affiliateCode/export/pdf', AffiliateController.exportPDF);
// // Excel export for financial/accounting teams
// router.get('/:affiliateCode/export/excel', AffiliateController.exportExcel);

// /* 🔹 Core Click Tracking & Redirection */
// // Track affiliate click & redirect to offer
// router.get('/click/:slug', AffiliateController.affiliateClick);

// /* 🔹 Admin/Network-Only (optional) */
// // Performance overview of a specific affiliate
// router.get('/admin/affiliate/:id/performance', AffiliateController.adminAffiliatePerformance);
// // Payout and commission tracking
// router.get('/admin/affiliate/payments', AffiliateController.adminAffiliatePayments);
// // Admin fraud review panel
// router.get('/admin/affiliate/fraud-review', AffiliateController.adminAffiliateFraudReview);

export const affiliateRoutes = router;