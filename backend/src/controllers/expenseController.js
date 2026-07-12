const Expense = require('../models/Expense');
const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');

// @desc    Get all expenses (with optional vehicleId filter)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const { vehicleId, type, sort } = req.query;
    let query = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (type) query.type = type;

    let result = Expense.find(query).populate('vehicle');

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-date');
    }

    const expenses = await result;
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a miscellaneous expense
// @route   POST /api/expenses
// @access  Private/Fleet Manager/Financial Analyst
const createExpense = async (req, res, next) => {
  try {
    const { vehicleId, type, cost, description, date } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    const expense = await Expense.create({
      vehicle: vehicleId,
      type,
      cost,
      description,
      date: date || new Date(),
    });

    const populatedExpense = await Expense.findById(expense._id).populate('vehicle');

    res.status(201).json({ success: true, data: populatedExpense });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fuel logs
// @route   GET /api/expenses/fuel
// @access  Private
const getFuelLogs = async (req, res, next) => {
  try {
    const { vehicleId, sort } = req.query;
    let query = {};
    if (vehicleId) query.vehicle = vehicleId;

    let result = FuelLog.find(query).populate('vehicle');

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-date');
    }

    const logs = await result;
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a fuel log entry
// @route   POST /api/expenses/fuel
// @access  Private/Fleet Manager/Driver/Financial Analyst
const createFuelLog = async (req, res, next) => {
  try {
    const { vehicleId, liters, cost, date } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    const fuelLog = await FuelLog.create({
      vehicle: vehicleId,
      liters,
      cost,
      date: date || new Date(),
    });

    const populatedFuelLog = await FuelLog.findById(fuelLog._id).populate('vehicle');

    res.status(201).json({ success: true, data: populatedFuelLog });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  createExpense,
  getFuelLogs,
  createFuelLog,
};
