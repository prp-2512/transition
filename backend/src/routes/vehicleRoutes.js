const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleDocument,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/checkRole');
const upload = require('../middleware/upload');

router.use(protect); // Apply protect to all routes

router
  .route('/')
  .get(getVehicles)
  .post(authorize('Fleet Manager'), createVehicle);

router
  .route('/:id')
  .get(getVehicle)
  .put(authorize('Fleet Manager'), updateVehicle)
  .delete(authorize('Fleet Manager'), deleteVehicle);

router.post(
  '/:id/documents',
  authorize('Fleet Manager', 'Safety Officer'),
  upload.single('document'),
  uploadVehicleDocument
);

module.exports = router;
