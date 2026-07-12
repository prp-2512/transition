const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const FuelLog = require('../models/FuelLog');
const SafetyIncident = require('../models/SafetyIncident');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const { recalculateDriverSafetyScore } = require('./safetyController');
const { recalculateVehicleHealthScore } = require('./maintenanceScheduleController');
const { recalculateVehicleFuelStats } = require('./fuelController');

// Helper to run validations on vehicle and driver
const validateTripAssignment = (vehicle, driver, cargoWeight) => {
  // 1. Vehicle checks
  if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
    throw new Error(`Vehicle is currently ${vehicle.status} and cannot be assigned to trips`);
  }
  if (vehicle.status === 'On Trip') {
    throw new Error('Vehicle is already assigned to an active trip');
  }
  if (vehicle.maintenanceDue) {
    throw new Error('Vehicle has pending maintenance due and cannot be dispatched');
  }

  // 2. Cargo weight check
  if (cargoWeight > vehicle.maxLoadCapacity) {
    throw new Error(`Cargo weight (${cargoWeight} kg) exceeds vehicle's maximum load capacity (${vehicle.maxLoadCapacity} kg)`);
  }

  // 3. Driver checks
  if (driver.status === 'Suspended') {
    throw new Error('Driver is suspended and cannot be assigned to trips');
  }
  if (driver.status === 'On Trip') {
    throw new Error('Driver is already assigned to an active trip');
  }
  if (driver.status === 'Off Duty') {
    throw new Error('Driver is off-duty and cannot be assigned to trips');
  }
  if (!driver.driverEligible || driver.safetyScore < 50) {
    throw new Error(`Driver has critical safety score (${driver.safetyScore}) or status, ineligible for trips`);
  }

  // 4. Expiry license check
  const now = new Date();
  if (new Date(driver.licenseExpiryDate) < now) {
    throw new Error('Driver license has expired and cannot be assigned to trips');
  }
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res, next) => {
  try {
    const { status, sort } = req.query;
    let query = {};
    if (status) query.status = status;

    let result = Trip.find(query)
      .populate('vehicle')
      .populate('driver');

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-createdAt');
    }

    const trips = await result;
    res.json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single trip
// @route   GET /api/trips/:id
// @access  Private
const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');

    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a trip (Draft status)
// @route   POST /api/trips
// @access  Private/Fleet Manager/Driver
const createTrip = async (req, res, next) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, revenue } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }

    // Run business validation checks
    try {
      validateTripAssignment(vehicle, driver, cargoWeight);
    } catch (err) {
      if (cargoWeight > vehicle.maxLoadCapacity) {
        await SafetyIncident.create({
          driver: driverId,
          vehicle: vehicleId,
          type: 'Overload Attempt',
          reason: `Attempted payload of ${cargoWeight} kg exceeds vehicle capacity ${vehicle.maxLoadCapacity} kg.`,
          scoreImpact: 5,
        });
        await recalculateDriverSafetyScore(driverId, 'Overload Attempt', 'Payload Limit Breach Attempt', null, vehicleId);
      }
      res.status(400);
      throw err;
    }

    const trip = await Trip.create({
      source,
      destination,
      vehicle: vehicleId,
      driver: driverId,
      cargoWeight,
      plannedDistance,
      revenue,
      status: 'Draft',
    });

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispatch a trip (Draft -> Dispatched)
// @route   PUT /api/trips/:id/dispatch
// @access  Private/Fleet Manager/Driver
const dispatchTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }

    if (trip.status !== 'Draft') {
      res.status(400);
      throw new Error(`Trip is in ${trip.status} status and cannot be dispatched`);
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    // Validate rules again before dispatching
    try {
      validateTripAssignment(vehicle, driver, trip.cargoWeight);
    } catch (err) {
      if (trip.cargoWeight > vehicle.maxLoadCapacity) {
        await SafetyIncident.create({
          driver: trip.driver,
          vehicle: trip.vehicle,
          type: 'Overload Attempt',
          reason: `Attempted payload of ${trip.cargoWeight} kg exceeds vehicle capacity ${vehicle.maxLoadCapacity} kg on dispatch.`,
          scoreImpact: 5,
        });
        await recalculateDriverSafetyScore(trip.driver, 'Overload Attempt', 'Payload Limit Breach Attempt on Dispatch', null, trip.vehicle);
      }
      res.status(400);
      throw err;
    }

    // Update statuses
    vehicle.status = 'On Trip';
    await vehicle.save();

    driver.status = 'On Trip';
    await driver.save();

    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();
    trip.actualOdometerStart = vehicle.odometer;
    await trip.save();

    const updatedTrip = await Trip.findById(trip._id).populate('vehicle').populate('driver');

    res.json({ success: true, data: updatedTrip });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a trip (Dispatched -> Completed)
// @route   PUT /api/trips/:id/complete
// @access  Private/Fleet Manager/Driver
const completeTrip = async (req, res, next) => {
  try {
    const { actualOdometerEnd, fuelConsumed, fuelCost } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }

    if (trip.status !== 'Dispatched') {
      res.status(400);
      throw new Error(`Only dispatched trips can be completed. Current status: ${trip.status}`);
    }

    if (!actualOdometerEnd || actualOdometerEnd < trip.actualOdometerStart) {
      res.status(400);
      throw new Error(`Final odometer (${actualOdometerEnd}) must be greater than or equal to start odometer (${trip.actualOdometerStart})`);
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    // 1. Update vehicle odometer & restore statuses to Available
    vehicle.odometer = actualOdometerEnd;
    vehicle.status = 'Available';
    await vehicle.save();

    driver.status = 'Available';
    await driver.save();

    // 2. Evaluate vehicle maintenance schedules
    const schedules = await MaintenanceSchedule.find({ vehicle: vehicle._id, status: { $ne: 'Completed' } }).populate('maintenanceType');
    for (const sch of schedules) {
      if (sch.maintenanceType) {
        const remKM = sch.nextServiceOdometer - vehicle.odometer;
        const remDays = Math.ceil((new Date(sch.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (remKM <= 0 || remDays <= 0) {
          sch.status = 'Overdue';
        } else if (remKM <= 500 || remDays <= 10) {
          sch.status = 'Due Soon';
        } else {
          sch.status = 'Healthy';
        }
        await sch.save();
      }
    }
    await recalculateVehicleHealthScore(vehicle._id);

    // 3. Complete trip details
    trip.status = 'Completed';
    trip.actualOdometerEnd = actualOdometerEnd;
    trip.fuelConsumed = fuelConsumed;
    trip.completedAt = new Date();
    await trip.save();

    // 4. Log late trip safety incident if flag is set or duration exceeds 8 hours
    const isLate = req.body.isLate || (new Date() - new Date(trip.dispatchedAt)) > 8 * 60 * 60 * 1000;
    if (isLate) {
      await SafetyIncident.create({
        driver: driver._id,
        trip: trip._id,
        vehicle: vehicle._id,
        type: 'Late Completion',
        reason: `Trip completed late. Odometer start: ${trip.actualOdometerStart}, Odometer end: ${actualOdometerEnd}.`,
        scoreImpact: 5,
      });
    }

    // 5. Recalculate driver safety score
    await recalculateDriverSafetyScore(driver._id, 'Trip Completed Evaluation', 'Trip Completion Odometer Scan', trip._id, vehicle._id);

    // 3. Log fuel expense if fuel was consumed
    if (fuelConsumed && fuelConsumed > 0) {
      const fCost = fuelCost || (fuelConsumed * 98); // Fallback: ₹98 per liter
      await FuelLog.create({
        vehicle: vehicle._id,
        trip: trip._id,
        driver: driver._id,
        liters: fuelConsumed,
        cost: fCost,
        pricePerLiter: fCost / fuelConsumed,
        odometer: actualOdometerEnd,
        fuelType: 'Diesel',
        fuelStation: 'Route Refill Station',
        date: new Date(),
      });
      // Recalculate vehicle fuel statistics
      await recalculateVehicleFuelStats(vehicle._id, req.user?._id, `Trip completed: ${trip.source} to ${trip.destination}`);
    }

    const completedTrip = await Trip.findById(trip._id).populate('vehicle').populate('driver');

    res.json({ success: true, data: completedTrip });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a trip (Draft or Dispatched -> Cancelled)
// @route   PUT /api/trips/:id/cancel
// @access  Private/Fleet Manager/Driver
const cancelTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      res.status(400);
      throw new Error(`Trip is already ${trip.status} and cannot be cancelled`);
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    // If trip was dispatched, free the vehicle and driver back to Available
    if (trip.status === 'Dispatched') {
      if (vehicle) {
        vehicle.status = 'Available';
        await vehicle.save();
      }
      if (driver) {
        driver.status = 'Available';
        await driver.save();
      }
    }

    trip.status = 'Cancelled';
    trip.cancelledAt = new Date();
    await trip.save();

    // Log trip cancellation incident (deduct 2 points)
    if (driver) {
      await SafetyIncident.create({
        driver: driver._id,
        trip: trip._id,
        vehicle: vehicle ? vehicle._id : null,
        type: 'Cancelled Trip',
        reason: 'Trip cancelled by operator or driver.',
        scoreImpact: 2,
      });
      await recalculateDriverSafetyScore(driver._id, 'Trip Cancelled', 'Trip Cancellation Logging', trip._id, vehicle ? vehicle._id : null);
    }

    const cancelledTrip = await Trip.findById(trip._id).populate('vehicle').populate('driver');

    res.json({ success: true, data: cancelledTrip });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};
