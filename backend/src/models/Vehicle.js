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
    lastMaintenanceDate: Date,
    lastMaintenanceOdometer: Number,
    nextMaintenanceDate: Date,
    nextMaintenanceOdometer: Number,
    maintenanceDue: {
      type: Boolean,
      default: false,
    },
    maintenanceState: {
      type: String,
      enum: ['Healthy', 'Due Soon', 'Due', 'Overdue', 'In Progress', 'Completed'],
      default: 'Healthy',
      index: true,
    },
    maintenancePriority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },
    totalMaintenanceCost: {
      type: Number,
      default: 0,
    },
    totalNumberOfServices: {
      type: Number,
      default: 0,
    },
    lastServiceType: String,
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    averageFuelEfficiency: {
      type: Number,
      default: 0,
    },
    totalFuelConsumed: {
      type: Number,
      default: 0,
    },
    totalFuelCost: {
      type: Number,
      default: 0,
    },
    totalDistanceTravelled: {
      type: Number,
      default: 0,
    },
    fuelCostPerKM: {
      type: Number,
      default: 0,
    },
    fuelEfficiencyRating: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Poor', 'Critical'],
      default: 'Average',
    },
    lastFuelEntryDate: Date,
    lastFuelCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
