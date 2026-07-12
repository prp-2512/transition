const mongoose = require('mongoose');

const fuelAnomalySchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Please associate a vehicle'],
      index: true,
    },
    fuelLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FuelLog',
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: [
        'Odometer Inconsistency',
        'Sudden Efficiency Drop',
        'Extreme Refill Quantity',
        'High Cost Transaction',
        'Impossible Efficiency',
        'Duplicate Entries',
        'Negative Values'
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FuelAnomaly', fuelAnomalySchema);
