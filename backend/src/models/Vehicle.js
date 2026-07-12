const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Please add a registration number'],
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a vehicle name or model'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please specify the vehicle type'],
      trim: true,
      default: 'Truck', // e.g. Truck, Van, SUV, Sedan
    },
    maxLoadCapacity: {
      type: Number,
      required: [true, 'Please add maximum load capacity in kg'],
    },
    odometer: {
      type: Number,
      required: [true, 'Please add current odometer reading in km'],
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      required: [true, 'Please add acquisition cost'],
    },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
      index: true,
      default: 'Available',
    },
    region: {
      type: String,
      required: [true, 'Please add operation region'],
      trim: true,
      default: 'North',
    },
    documents: [
      {
        name: String,
        filePath: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
