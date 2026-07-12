const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, 'Please add a source location'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Please add a destination location'],
      trim: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Please associate a vehicle'],
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Please associate a driver'],
      index: true,
    },
    cargoWeight: {
      type: Number,
      required: [true, 'Please add cargo weight in kg'],
    },
    plannedDistance: {
      type: Number,
      required: [true, 'Please add planned distance in km'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
      index: true,
      default: 'Draft',
    },
    actualOdometerStart: {
      type: Number,
    },
    actualOdometerEnd: {
      type: Number,
    },
    fuelConsumed: {
      type: Number, // Liters consumed during the trip
    },
    revenue: {
      type: Number, // Revenue earned from the trip
      required: [true, 'Please specify the trip revenue'],
      default: 0,
    },
    dispatchedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trip', tripSchema);
