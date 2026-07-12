const mongoose = require('mongoose');

const safetyIncidentSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Please associate a driver'],
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['Accident', 'Violation', 'Late Completion', 'Cancelled Trip', 'Overload Attempt', 'Customer Complaint'],
      required: [true, 'Please specify incident type'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Please add a reason description'],
      trim: true,
    },
    scoreImpact: {
      type: Number, // Points deducted (positive number)
      required: [true, 'Please add safety score deduction value'],
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SafetyIncident', safetyIncidentSchema);
