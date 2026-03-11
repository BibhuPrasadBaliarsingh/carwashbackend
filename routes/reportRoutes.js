const express = require('express');
const router = express.Router();
const {
  getRevenueReport,
  getExpensesReport,
  getCustomerReport,
  getTopServices,
  getDailyStats,
  getDashboardSummary
} = require('../controllers/reportController');

// Routes
router.get('/revenue', getRevenueReport);
router.get('/expenses', getExpensesReport);
router.get('/customers', getCustomerReport);
router.get('/top-services', getTopServices);
router.get('/daily', getDailyStats);
router.get('/dashboard', getDashboardSummary);

module.exports = router;

