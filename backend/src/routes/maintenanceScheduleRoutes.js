const express = require('express');
const router = express.Router();
const {
  getMaintenanceTypes,
  createMaintenanceType,
  getSchedules,
  createSchedule,
  completeSchedule,
} = require('../controllers/maintenanceScheduleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/types')
  .get(getMaintenanceTypes)
  .post(createMaintenanceType);

router.route('/schedules')
  .get(getSchedules)
  .post(createSchedule);

router.put('/schedules/:id/complete', completeSchedule);

module.exports = router;
