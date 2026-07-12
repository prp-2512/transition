const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/checkRole');

router.use(protect); // Apply protect to all routes

router
  .route('/')
  .get(getDrivers)
  .post(authorize('Fleet Manager', 'Safety Officer'), createDriver);

router
  .route('/:id')
  .get(getDriver)
  .put(authorize('Fleet Manager', 'Safety Officer'), updateDriver)
  .delete(authorize('Fleet Manager', 'Safety Officer'), deleteDriver);

module.exports = router;
