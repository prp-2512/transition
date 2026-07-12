const mongoose = require('mongoose');

const safetyAuditLogSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Please associate a driver'],
      index: true,
    },
    previousScore: {
      type: Number,
      required: true,
    },
    currentScore: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    triggerEvent: {
      type: String,
      required: true,
      trim: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The user who triggered the change, or empty if automated
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SafetyAuditLog', safetyAuditLogSchema);
