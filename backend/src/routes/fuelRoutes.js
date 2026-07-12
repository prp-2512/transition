const express = require('express');
const router = express.Router();
const { getFuelLogs, getAnomalies, getFuelAuditLogs, createFuelLog } = require('../controllers/fuelController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/logs')
  .get(getFuelLogs)
  .post(createFuelLog);

router.get('/anomalies', getAnomalies);
router.get('/audits', getFuelAuditLogs);

module.exports = router;
