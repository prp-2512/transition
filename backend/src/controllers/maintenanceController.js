const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const Expense = require('../models/Expense');

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private
const getMaintenances = async (req, res, next) => {
  try {
    const { status, sort } = req.query;
    let query = {};
    if (status) query.status = status;

    let result = Maintenance.find(query).populate('vehicle');

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-createdAt');
    }

    const records = await result;
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a vehicle maintenance (switches status to In Shop)
// @route   POST /api/maintenance
// @access  Private/Fleet Manager/Safety Officer
const createMaintenance = async (req, res, next) => {
  try {
    const { vehicleId, description, cost } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    if (vehicle.status === 'On Trip') {
      res.status(400);
      throw new Error('Vehicle is currently on a trip and cannot be sent to maintenance');
    }

    // 1. Create maintenance entry
    const record = await Maintenance.create({
      vehicle: vehicleId,
      description,
      cost,
      status: 'Active',
      startDate: new Date(),
    });

    // 2. Automatically change vehicle status to "In Shop"
    vehicle.status = 'In Shop';
    await vehicle.save();

    const populatedRecord = await Maintenance.findById(record._id).populate('vehicle');

    res.status(201).json({ success: true, data: populatedRecord });
  } catch (error) {
    next(error);
  }
};

// @desc    Close maintenance (switches status back to Available unless Retired)
// @route   PUT /api/maintenance/:id/close
// @access  Private/Fleet Manager/Safety Officer
const closeMaintenance = async (req, res, next) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Maintenance record not found');
    }

    if (record.status === 'Closed') {
      res.status(400);
      throw new Error('Maintenance record is already closed');
    }

    const vehicle = await Vehicle.findById(record.vehicle);
    if (vehicle) {
      // Restore vehicle to Available (unless it has been Retired)
      if (vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
      }
      await vehicle.save();
    }

    // 1. Close record
    record.status = 'Closed';
    record.endDate = new Date();
    if (req.body.cost) record.cost = req.body.cost; // Allow updating the final cost
    await record.save();

    // 2. Automatically create an Expense of type "Maintenance" for financial reporting
    await Expense.create({
      vehicle: record.vehicle,
      type: 'Maintenance',
      cost: record.cost,
      description: `Maintenance Log: ${record.description}`,
      date: new Date(),
    });

    const closedRecord = await Maintenance.findById(record._id).populate('vehicle');

    res.json({ success: true, data: closedRecord });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenances,
  createMaintenance,
  closeMaintenance,
};
