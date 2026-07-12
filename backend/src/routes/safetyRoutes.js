const express = require('express');
const router = express.Router();
const { getIncidents, createIncident, getAuditLogs } = require('../controllers/safetyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/incidents')
  .get(getIncidents)
  .post(createIncident);

router.get('/audits', getAuditLogs);

module.exports = router;
