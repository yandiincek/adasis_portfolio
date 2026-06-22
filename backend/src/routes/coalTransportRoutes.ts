import express from 'express';
import {
  getSarana,
  createSarana,
  bulkCreateSarana,
  updateSarana,
  deleteSarana,
  getFuelQuotas,
  bulkCreateFuelQuotas,
  getFuelRecords,
  createFuelRecord,
  getReportBreakdown,
  createReportBreakdown,
  bulkCreateReportBreakdown
} from '../controllers/coalTransportController';
import { getReportPA, getReportPASummary } from '../controllers/reportPAController';
import { getDashboardStats } from '../controllers/coalDashboardController';
import { getKuponBbm, createKuponBbm, updateApprovalGact, updateApprovalFuelman } from '../controllers/kuponBbmController';

const router = express.Router();

// Dashboard Route
router.get('/dashboard-stats', getDashboardStats);

// Sarana Routes
router.get('/sarana', getSarana);
router.post('/sarana', createSarana);
router.put('/sarana/:id', updateSarana);
router.delete('/sarana/:id', deleteSarana);
router.post('/sarana/bulk', bulkCreateSarana);

// Fuel Quota Routes
router.get('/fuel-quotas', getFuelQuotas);
router.post('/fuel-quotas/bulk', bulkCreateFuelQuotas);

// Fuel Record Routes
router.get('/fuel-records', getFuelRecords);
router.post('/fuel-records', createFuelRecord);

// Report Breakdown Routes
router.get('/report-breakdown', getReportBreakdown);
router.post('/report-breakdown', createReportBreakdown);
router.post('/report-breakdown/bulk', bulkCreateReportBreakdown);

// PA Report Routes
router.get('/report-pa/summary', getReportPASummary);
router.get('/report-pa', getReportPA);

// Kupon Tambahan BBM Routes
router.get('/kupon-bbm', getKuponBbm);
router.post('/kupon-bbm', createKuponBbm);
router.put('/kupon-bbm/:id/approve-gact', updateApprovalGact);
router.put('/kupon-bbm/:id/approve-fuelman', updateApprovalFuelman);

export default router;
