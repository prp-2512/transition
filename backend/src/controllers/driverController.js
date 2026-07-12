const Driver = require('../models/Driver');

// @desc    Get all drivers (with filtering, search, sorting)
// @route   GET /api/drivers
// @access  Private
const getDrivers = async (req, res, next) => {
  try {
    const { status, licenseCategory, search, sort } = req.query;
    let query = {};

    // Filter by status, license category
    if (status) query.status = status;
    if (licenseCategory) query.licenseCategory = licenseCategory;

    // Search by name or license number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
      ];
    }

    let result = Driver.find(query);

    // Sorting
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-createdAt');
    }

    const drivers = await result;

    res.json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single driver
// @route   GET /api/drivers/:id
// @access  Private
const getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a driver
// @route   POST /api/drivers
// @access  Private/Fleet Manager/Safety Officer
const createDriver = async (req, res, next) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status } = req.body;

    // Check unique license number
    const licenseExists = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (licenseExists) {
      res.status(400);
      throw new Error(`Driver with license number ${licenseNumber} already exists`);
    }

    const driver = await Driver.create({
      name,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status,
    });

    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a driver
// @route   PUT /api/drivers/:id
// @access  Private/Fleet Manager/Safety Officer
const updateDriver = async (req, res, next) => {
  try {
    let driver = await Driver.findById(req.params.id);
    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }

    // Check unique license number if updated
    if (req.body.licenseNumber && req.body.licenseNumber.toUpperCase() !== driver.licenseNumber) {
      const licenseExists = await Driver.findOne({ licenseNumber: req.body.licenseNumber.toUpperCase() });
      if (licenseExists) {
        res.status(400);
        throw new Error(`Driver with license number ${req.body.licenseNumber} already exists`);
      }
    }

    driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a driver
// @route   DELETE /api/drivers/:id
// @access  Private/Fleet Manager/Safety Officer
const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }

    await driver.deleteOne();
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
};
