const express = require('express');
const router = express.Router();
const {
  getMaintenances,
  createMaintenance,
  closeMaintenance,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/checkRole');

router.use(protect);

router
  .route('/')
  .get(getMaintenances)
  .post(authorize('Fleet Manager', 'Safety Officer'), createMaintenance);

router.put('/:id/close', authorize('Fleet Manager', 'Safety Officer'), closeMaintenance);

module.exports = router;
