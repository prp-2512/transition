const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Please associate a vehicle'],
      index: true,
    },
    liters: {
      type: Number,
      required: [true, 'Please add liters of fuel'],
    },
    cost: {
      type: Number,
      required: [true, 'Please add fuel cost'],
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

module.exports = mongoose.model('FuelLog', fuelLogSchema);
