const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Please associate a vehicle'],
      index: true,
    },
    type: {
      type: String,
      enum: ['Toll', 'Maintenance', 'Insurance', 'Other'],
      required: [true, 'Please specify expense type'],
    },
    cost: {
      type: Number,
      required: [true, 'Please add expense cost'],
    },
    description: {
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

module.exports = mongoose.model('Expense', expenseSchema);
