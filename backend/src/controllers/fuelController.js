const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const FuelAnomaly = require('../models/FuelAnomaly');
const FuelAuditLog = require('../models/FuelAuditLog');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

// Reusable helper to recalculate vehicle fuel stats
const recalculateVehicleFuelStats = async (vehicleId, userId = null, reason = 'Fuel Log Event') => {
  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return null;

    // Fetch all fuel logs for this vehicle
    const logs = await FuelLog.find({ vehicle: vehicleId }).sort('date');
    
    // Sum distance from all completed trips
    const trips = await Trip.find({ vehicle: vehicleId, status: 'Completed' });
    let totalDist = trips.reduce((sum, t) => {
      const dist = (t.actualOdometerEnd || 0) - (t.actualOdometerStart || 0);
      return sum + Math.max(0, dist);
    }, 0);

    // If total distance is 0, use odometer as fallback (excluding brand new vehicles)
    if (totalDist === 0 && vehicle.odometer > 0) {
      totalDist = vehicle.odometer;
    }

    let totalLiters = 0;
    let totalCost = 0;
    let lastCost = 0;
    let lastDate = null;

    logs.forEach(l => {
      totalLiters += l.liters;
      totalCost += l.cost;
      lastCost = l.cost;
      lastDate = l.date;
    });

    const prevEff = vehicle.averageFuelEfficiency;
    const prevCost = vehicle.totalFuelCost;

    vehicle.totalFuelConsumed = totalLiters;
    vehicle.totalFuelCost = totalCost;
    vehicle.totalDistanceTravelled = totalDist;
    vehicle.lastFuelCost = lastCost;
    if (lastDate) vehicle.lastFuelEntryDate = lastDate;

    // Averages
    vehicle.averageFuelEfficiency = totalLiters > 0 ? totalDist / totalLiters : 0;
    vehicle.fuelCostPerKM = totalDist > 0 ? totalCost / totalDist : 0;

    // Classify Efficiency Rating
    let rating = 'Average';
    const isHeavy = vehicle.type === 'Heavy Truck';
    const eff = vehicle.averageFuelEfficiency;

    if (isHeavy) {
      if (eff >= 6) rating = 'Excellent';
      else if (eff >= 4.5) rating = 'Good';
      else if (eff >= 3.5) rating = 'Average';
      else if (eff >= 2.5) rating = 'Poor';
      else rating = 'Critical';
    } else {
      // Light cargo or vans
      if (eff >= 15) rating = 'Excellent';
      else if (eff >= 10) rating = 'Good';
      else if (eff >= 8) rating = 'Average';
      else if (eff >= 5) rating = 'Poor';
      else rating = 'Critical';
    }

    vehicle.fuelEfficiencyRating = rating;
    await vehicle.save();

    // Log changes to Audit log
    if (prevEff !== vehicle.averageFuelEfficiency || prevCost !== vehicle.totalFuelCost) {
      await FuelAuditLog.create({
        vehicle: vehicleId,
        field: 'averageFuelEfficiency',
        previousValue: prevEff,
        updatedValue: vehicle.averageFuelEfficiency,
        reason,
        user: userId,
        date: new Date()
      });
      await FuelAuditLog.create({
        vehicle: vehicleId,
        field: 'totalFuelCost',
        previousValue: prevCost,
        updatedValue: vehicle.totalFuelCost,
        reason,
        user: userId,
        date: new Date()
      });
    }

    return vehicle;
  } catch (error) {
    console.error('Recalculate fuel stats error:', error);
    return null;
  }
};

// @desc    Get all fuel logs
// @route   GET /api/fuel/logs
// @access  Private
const getFuelLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    let query = {};
    if (vehicleId) query.vehicle = vehicleId;

    const logs = await FuelLog.find(query)
      .populate('vehicle')
      .populate('trip')
      .populate('driver')
      .sort('-date');

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fuel anomalies
// @route   GET /api/fuel/anomalies
// @access  Private
const getAnomalies = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    let query = {};
    if (vehicleId) query.vehicle = vehicleId;

    const anomalies = await FuelAnomaly.find(query)
      .populate('vehicle')
      .populate('fuelLog')
      .populate('trip')
      .sort('-date');

    res.json({ success: true, count: anomalies.length, data: anomalies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fuel audit logs
// @route   GET /api/fuel/audits
// @access  Private
const getFuelAuditLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    let query = {};
    if (vehicleId) query.vehicle = vehicleId;

    const audits = await FuelAuditLog.find(query)
      .populate('vehicle')
      .populate('trip')
      .populate('driver')
      .populate('user', 'name email')
      .sort('-date');

    res.json({ success: true, count: audits.length, data: audits });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a new fuel refuel entry
// @route   POST /api/fuel/logs
// @access  Private
const createFuelLog = async (req, res, next) => {
  try {
    const { vehicleId, tripId, driverId, liters, cost, fuelType, odometer, fuelStation, remarks, date } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    const pricePerL = liters > 0 ? cost / liters : 0;

    const log = await FuelLog.create({
      vehicle: vehicleId,
      trip: tripId || null,
      driver: driverId || null,
      liters,
      cost,
      pricePerLiter: pricePerL,
      odometer: odometer || vehicle.odometer,
      fuelType: fuelType || 'Diesel',
      fuelStation: fuelStation || 'Indian Oil Petrol Pump',
      remarks,
      date: date || new Date(),
    });

    // 1. Run Anomaly checks on creation
    // Anomaly 1: Odometer inconsistency
    if (odometer && odometer < vehicle.odometer) {
      await FuelAnomaly.create({
        vehicle: vehicleId,
        fuelLog: log._id,
        trip: tripId || null,
        type: 'Odometer Inconsistency',
        description: `Odometer reading entered (${odometer} km) is less than current vehicle odometer (${vehicle.odometer} km).`,
        severity: 'High',
      });
    }

    // Anomaly 2: Negative/Zero refuels
    if (liters <= 0 || cost <= 0) {
      await FuelAnomaly.create({
        vehicle: vehicleId,
        fuelLog: log._id,
        trip: tripId || null,
        type: 'Negative Values',
        description: `Refuel entered with invalid parameters: liters = ${liters}, cost = ₹${cost}.`,
        severity: 'High',
      });
    }

    // Anomaly 3: Extreme volume
    if (liters > 250) {
      await FuelAnomaly.create({
        vehicle: vehicleId,
        fuelLog: log._id,
        trip: tripId || null,
        type: 'Extreme Refill Quantity',
        description: `Refuel volume of ${liters} liters exceeds standard commercial tank limit warning of 250L.`,
        severity: 'Medium',
      });
    }

    // Anomaly 4: High refuel cost
    if (cost > 25000) {
      await FuelAnomaly.create({
        vehicle: vehicleId,
        fuelLog: log._id,
        trip: tripId || null,
        type: 'High Cost Transaction',
        description: `Refuel invoice cost of ₹${cost} exceeds warning threshold (₹25,000).`,
        severity: 'Medium',
      });
    }

    // Anomaly 5: Duplicate refill logs (refilled within 10 minutes with same volume)
    const tenMinAgo = new Date((date ? new Date(date) : new Date()).getTime() - 10 * 60 * 1000);
    const dup = await FuelLog.findOne({
      vehicle: vehicleId,
      liters,
      _id: { $ne: log._id },
      date: { $gte: tenMinAgo }
    });
    if (dup) {
      await FuelAnomaly.create({
        vehicle: vehicleId,
        fuelLog: log._id,
        trip: tripId || null,
        type: 'Duplicate Entries',
        description: `Detected duplicate fuel entry logged: ${liters} liters within a 10-minute interval.`,
        severity: 'Medium',
      });
    }

    // Anomaly 6: Sudden drop check (compared to vehicle avg efficiency)
    if (tripId && vehicle.averageFuelEfficiency > 0) {
      const trip = await Trip.findById(tripId);
      if (trip) {
        const dist = (trip.actualOdometerEnd || 0) - (trip.actualOdometerStart || 0);
        if (dist > 0) {
          const tripEff = dist / liters;
          // Impossible check
          if (tripEff > 30 || tripEff <= 0) {
            await FuelAnomaly.create({
              vehicle: vehicleId,
              fuelLog: log._id,
              trip: tripId,
              type: 'Impossible Efficiency',
              description: `Calculated efficiency of ${tripEff.toFixed(1)} km/L is highly improbable or division-by-zero anomaly.`,
              severity: 'High',
            });
          } else if (tripEff < vehicle.averageFuelEfficiency * 0.7) {
            // Drop of 30% or more
            await FuelAnomaly.create({
              vehicle: vehicleId,
              fuelLog: log._id,
              trip: tripId,
              type: 'Sudden Efficiency Drop',
              description: `Calculated efficiency of ${tripEff.toFixed(1)} km/L is 30%+ lower than vehicle average (${vehicle.averageFuelEfficiency.toFixed(1)} km/L).`,
              severity: 'High',
            });
          }
        }
      }
    }

    // Update vehicle odometer if this is higher
    if (odometer && odometer > vehicle.odometer) {
      vehicle.odometer = odometer;
      await vehicle.save();
    }

    // Recalculate stats
    await recalculateVehicleFuelStats(vehicleId, req.user?._id, `Logged Refill at ${fuelStation}`);

    // 2. Register Expense Log for financial sheets
    await Expense.create({
      vehicle: vehicleId,
      type: 'Fuel',
      cost,
      description: `Fuel Refill: ${liters}L of ${fuelType} at ${fuelStation || 'Petrol Pump'}`,
      date: date || new Date(),
    });

    // Populate and return
    const populated = await FuelLog.findById(log._id)
      .populate('vehicle')
      .populate('trip')
      .populate('driver');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recalculateVehicleFuelStats,
  getFuelLogs,
  getAnomalies,
  getFuelAuditLogs,
  createFuelLog,
};
