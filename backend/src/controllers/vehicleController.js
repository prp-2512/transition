const Vehicle = require('../models/Vehicle');
const path = require('path');

// @desc    Get all vehicles (with filtering, search, sorting)
// @route   GET /api/vehicles
// @access  Private
const getVehicles = async (req, res, next) => {
  try {
    const { type, status, region, search, sort } = req.query;
    let query = {};

    // Filter by type, status, region
    if (type) query.type = type;
    if (status) query.status = status;
    if (region) query.region = region;

    // Search by name or registration number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    let result = Vehicle.find(query);

    // Sorting
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-createdAt');
    }

    const vehicles = await result;

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Private/Fleet Manager
const createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, region } = req.body;

    // Check unique registration number
    const regExists = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (regExists) {
      res.status(400);
      throw new Error(`Vehicle with registration number ${registrationNumber} already exists`);
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      region,
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Fleet Manager
const updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    // Check unique registration number if registrationNumber is updated
    if (req.body.registrationNumber && req.body.registrationNumber.toUpperCase() !== vehicle.registrationNumber) {
      const regExists = await Vehicle.findOne({ registrationNumber: req.body.registrationNumber.toUpperCase() });
      if (regExists) {
        res.status(400);
        throw new Error(`Vehicle with registration number ${req.body.registrationNumber} already exists`);
      }
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Fleet Manager
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload vehicle documents
// @route   POST /api/vehicles/:id/documents
// @access  Private/Fleet Manager/Safety Officer
const uploadVehicleDocument = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const docName = req.body.name || req.file.originalname;
    const documentPath = `/uploads/${req.file.filename}`;

    vehicle.documents.push({
      name: docName,
      filePath: documentPath,
    });

    await vehicle.save();

    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleDocument,
};
