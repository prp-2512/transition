const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Please associate a vehicle'],
      index: true,
    },
    maintenanceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceType',
      required: [true, 'Please associate a maintenance type'],
      index: true,
    },
    lastServiceDate: {
      type: Date,
      default: Date.now,
    },
    lastServiceOdometer: {
      type: Number,
      required: [true, 'Please specify odometer reading at last service'],
      default: 0,
    },
    nextServiceDate: Date,
    nextServiceOdometer: Number,
    status: {
      type: String,
      enum: ['Healthy', 'Due Soon', 'Due', 'Overdue', 'In Progress', 'Completed'],
      default: 'Healthy',
      index: true,
    },
    technician: {
      type: String,
      trim: true,
      default: 'Authorized Service Center',
    },
    notes: {
      type: String,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate next service dates and odometers automatically
maintenanceScheduleSchema.pre('save', async function (next) {
  try {
    const MaintenanceType = mongoose.model('MaintenanceType');
    const type = await MaintenanceType.findById(this.maintenanceType);
    if (type) {
      // Calculate next service odometer
      this.nextServiceOdometer = this.lastServiceOdometer + type.intervalKM;
      
      // Calculate next service date
      const nextDate = new Date(this.lastServiceDate);
      nextDate.setMonth(nextDate.getMonth() + type.intervalMonths);
      this.nextServiceDate = nextDate;
      
      // Auto-assign estimated cost if not manually specified
      if (!this.estimatedCost || this.estimatedCost === 0) {
        this.estimatedCost = type.estimatedCost;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
