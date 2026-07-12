const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTrip,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/checkRole');

router.use(protect); // Apply protect to all routes

router
  .route('/')
  .get(getTrips)
  .post(authorize('Fleet Manager', 'Driver'), createTrip);

router.get('/:id', getTrip);

router.put('/:id/dispatch', authorize('Fleet Manager', 'Driver'), dispatchTrip);
router.put('/:id/complete', authorize('Fleet Manager', 'Driver'), completeTrip);
router.put('/:id/cancel', authorize('Fleet Manager', 'Driver'), cancelTrip);

module.exports = router;
