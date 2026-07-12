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
    safetyGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'A',
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },
    lastScoreUpdate: Date,
    violationCount: {
      type: Number,
      default: 0,
    },
    accidentCount: {
      type: Number,
      default: 0,
    },
    lateTripCount: {
      type: Number,
      default: 0,
    },
    cancelledTripCount: {
      type: Number,
      default: 0,
    },
    overloadedTripCount: {
      type: Number,
      default: 0,
    },
    customerComplaintCount: {
      type: Number,
      default: 0,
    },
    driverEligible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Driver', driverSchema);
