const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Please associate a vehicle'],
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
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
    pricePerLiter: {
      type: Number,
    },
    odometer: {
      type: Number,
    },
    fuelType: {
      type: String,
      default: 'Diesel',
    },
    fuelStation: {
      type: String,
      trim: true,
      default: 'Indian Oil Petrol Pump',
    },
    remarks: {
      type: String,
      trim: true,
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
