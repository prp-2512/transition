const mongoose = require('mongoose');

const maintenanceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a maintenance type name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Preventive', 'Corrective', 'Regulatory'],
      required: [true, 'Please specify maintenance category'],
      default: 'Preventive',
    },
    intervalKM: {
      type: Number,
      required: [true, 'Please add the odometer interval in KM'],
      default: 10000,
    },
    intervalMonths: {
      type: Number,
      required: [true, 'Please add the monthly interval'],
      default: 12,
    },
    estimatedDuration: {
      type: Number, // In Hours
      required: [true, 'Please specify estimated service duration'],
      default: 2,
    },
    estimatedCost: {
      type: Number, // In INR
      required: [true, 'Please add estimated cost'],
      default: 2000,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MaintenanceType', maintenanceTypeSchema);
