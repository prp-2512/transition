const Vehicle = require('../models/Vehicle');
const MaintenanceType = require('../models/MaintenanceType');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const SafetyIncident = require('../models/SafetyIncident');

// Reusable helper to recalculate vehicle health score
const recalculateVehicleHealthScore = async (vehicleId) => {
  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return null;

    // Get all schedules
    const schedules = await MaintenanceSchedule.find({ vehicle: vehicleId });

    // Base deductions
    let health = 100;
    let worstState = 'Healthy';

    schedules.forEach((sch) => {
      if (sch.status === 'Overdue') {
        health -= 25;
        if (worstState !== 'Overdue') worstState = 'Overdue';
      } else if (sch.status === 'Due') {
        health -= 20;
        if (worstState !== 'Overdue' && worstState !== 'Due') worstState = 'Due';
      } else if (sch.status === 'Due Soon') {
        health -= 10;
        if (worstState !== 'Overdue' && worstState !== 'Due' && worstState !== 'Due Soon') worstState = 'Due Soon';
      } else if (sch.status === 'In Progress') {
        if (worstState === 'Healthy') worstState = 'In Progress';
      }
    });

    // Deduct for accidents/violations associated with this vehicle
    const incidents = await SafetyIncident.countDocuments({ vehicle: vehicleId, type: { $in: ['Accident', 'Violation'] } });
    health -= incidents * 15;

    // Deduct for mileage wear (5 points per 50,000 km)
    const mileageDeduction = Math.floor(vehicle.odometer / 50000) * 5;
    health -= mileageDeduction;

    // Boundary check
    vehicle.healthScore = Math.max(0, health);
    vehicle.maintenanceState = worstState;
    vehicle.maintenanceDue = worstState === 'Due' || worstState === 'Overdue';
    
    // Set priority based on health score
    if (vehicle.healthScore < 50) {
      vehicle.maintenancePriority = 'Critical';
    } else if (vehicle.healthScore < 70) {
      vehicle.maintenancePriority = 'High';
    } else if (vehicle.healthScore < 85) {
      vehicle.maintenancePriority = 'Medium';
    } else {
      vehicle.maintenancePriority = 'Low';
    }

    await vehicle.save();
    return vehicle;
  } catch (error) {
    console.error('Recalculate vehicle health score error:', error);
    return null;
  }
};

// @desc    Get all maintenance types
// @route   GET /api/maintenance/types
// @access  Private
const getMaintenanceTypes = async (req, res, next) => {
  try {
    const types = await MaintenanceType.find({});
    res.json({ success: true, count: types.length, data: types });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a maintenance type
// @route   POST /api/maintenance/types
// @access  Private/Fleet Manager
const createMaintenanceType = async (req, res, next) => {
  try {
    const { name, description, category, intervalKM, intervalMonths, estimatedDuration, estimatedCost, priority } = req.body;
    
    const typeExists = await MaintenanceType.findOne({ name });
    if (typeExists) {
      res.status(400);
      throw new Error(`Maintenance type ${name} already exists`);
    }

    const type = await MaintenanceType.create({
      name,
      description,
      category,
      intervalKM,
      intervalMonths,
      estimatedDuration,
      estimatedCost,
      priority,
    });

    res.status(201).json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all maintenance schedules
// @route   GET /api/maintenance/schedules
// @access  Private
const getSchedules = async (req, res, next) => {
  try {
    const { vehicleId, status } = req.query;
    let query = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (status) query.status = status;

    const schedules = await MaintenanceSchedule.find(query)
      .populate('vehicle')
      .populate('maintenanceType');

    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a maintenance schedule
// @route   POST /api/maintenance/schedules
// @access  Private/Fleet Manager
const createSchedule = async (req, res, next) => {
  try {
    const { vehicleId, maintenanceTypeId, lastServiceDate, lastServiceOdometer, technician, notes } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    const type = await MaintenanceType.findById(maintenanceTypeId);
    if (!type) {
      res.status(404);
      throw new Error('Maintenance type not found');
    }

    // Guard against duplicates
    const duplicate = await MaintenanceSchedule.findOne({
      vehicle: vehicleId,
      maintenanceType: maintenanceTypeId,
      status: { $ne: 'Completed' },
    });
    if (duplicate) {
      res.status(400);
      throw new Error('An active schedule already exists for this vehicle and service type');
    }

    const schedule = new MaintenanceSchedule({
      vehicle: vehicleId,
      maintenanceType: maintenanceTypeId,
      lastServiceDate: lastServiceDate || new Date(),
      lastServiceOdometer: lastServiceOdometer || vehicle.odometer,
      technician,
      notes,
    });

    await schedule.save();
    
    // Recalculate health
    await recalculateVehicleHealthScore(vehicleId);

    const populatedSch = await MaintenanceSchedule.findById(schedule._id)
      .populate('vehicle')
      .populate('maintenanceType');

    res.status(201).json({ success: true, data: populatedSch });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete / Close a maintenance schedule
// @route   PUT /api/maintenance/schedules/:id/complete
// @access  Private/Fleet Manager
const completeSchedule = async (req, res, next) => {
  try {
    const { cost, odometer, technician, notes } = req.body;
    
    const schedule = await MaintenanceSchedule.findById(req.params.id);
    if (!schedule) {
      res.status(404);
      throw new Error('Schedule not found');
    }

    if (schedule.status === 'Completed') {
      res.status(400);
      throw new Error('Schedule is already completed');
    }

    const vehicle = await Vehicle.findById(schedule.vehicle);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    const finalOdom = odometer || vehicle.odometer;

    // Recalculate next interval directly
    schedule.lastServiceOdometer = finalOdom;
    schedule.lastServiceDate = new Date();
    schedule.status = 'Completed';
    if (technician) schedule.technician = technician;
    if (notes) schedule.notes = notes;
    await schedule.save();

    // Increment vehicle service counter and cost logs
    vehicle.totalNumberOfServices += 1;
    vehicle.totalMaintenanceCost += cost || schedule.estimatedCost;
    
    const type = await MaintenanceType.findById(schedule.maintenanceType);
    if (type) {
      vehicle.lastServiceType = type.name;
    }
    await vehicle.save();

    // Recalculate health score
    await recalculateVehicleHealthScore(schedule.vehicle);

    const updatedSch = await MaintenanceSchedule.findById(schedule._id)
      .populate('vehicle')
      .populate('maintenanceType');

    res.json({ success: true, data: updatedSch });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recalculateVehicleHealthScore,
  getMaintenanceTypes,
  createMaintenanceType,
  getSchedules,
  createSchedule,
  completeSchedule,
};
