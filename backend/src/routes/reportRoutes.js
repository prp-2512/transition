const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  exportFleetReportCSV,
  exportFleetReportPDF,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect); // All report routes need auth

router.get('/dashboard', getDashboardStats);
router.get('/export/csv', exportFleetReportCSV);
router.get('/export/pdf', exportFleetReportPDF);

module.exports = router;
