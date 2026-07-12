const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Please associate a vehicle'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please add maintenance description'],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, 'Please add maintenance cost'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Closed'],
      default: 'Active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
