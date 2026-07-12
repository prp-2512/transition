const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a driver name'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Please add a license number'],
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    licenseCategory: {
      type: String,
      required: [true, 'Please specify driver license category'],
      trim: true,
      default: 'Commercial Class A',
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'Please add license expiry date'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Please add contact number'],
      trim: true,
    },
    safetyScore: {
      type: Number,
      required: [true, 'Please add a safety score'],
      min: 0,
      max: 100,
      default: 100,
    },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
      index: true,
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Driver', driverSchema);
