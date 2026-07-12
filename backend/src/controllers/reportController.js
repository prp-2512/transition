const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Maintenance = require('../models/Maintenance');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const { generateFleetReportPDF } = require('../utils/pdfGenerator');
const { createObjectCsvStringifier } = require('csv-writer');

// Helper to gather all report numbers
const calculateReportStats = async () => {
  // 1. Gather all vehicles
  const vehicles = await Vehicle.find({});
  const totalVehiclesCount = vehicles.filter(v => v.status !== 'Retired').length;

  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'In Shop').length;

  // 2. Gather active/pending trips
  const activeTrips = await Trip.countDocuments({ status: 'Dispatched' });
  const pendingTrips = await Trip.countDocuments({ status: 'Draft' });

  // 3. Drivers on duty (Available + On Trip)
  const driversOnDuty = await Driver.countDocuments({
    status: { $in: ['Available', 'On Trip'] },
  });

  // 4. Fleet Utilization (%)
  const fleetUtilization = totalVehiclesCount > 0 ? (activeVehicles / totalVehiclesCount) * 100 : 0;

  // 5. Gather cost / ROI metrics per vehicle
  const vehicleStats = [];
  for (const vehicle of vehicles) {
    // Completed Trips
    const completedTrips = await Trip.find({
      vehicle: vehicle._id,
      status: 'Completed',
    });

    const revenue = completedTrips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);

    // Calculate distance travelled in completed trips
    const distance = completedTrips.reduce((sum, trip) => {
      const diff = (trip.actualOdometerEnd || 0) - (trip.actualOdometerStart || 0);
      return sum + (diff > 0 ? diff : (trip.plannedDistance || 0));
    }, 0);

    // Fuel costs & liters
    const fuelLogs = await FuelLog.find({ vehicle: vehicle._id });
    const fuelCost = fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const fuelLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);

    // Maintenance and other expenses
    const expenses = await Expense.find({ vehicle: vehicle._id });
    const expenseCost = expenses.reduce((sum, exp) => sum + (exp.cost || 0), 0);

    // Operational cost (Fuel + Maintenance + Other expenses)
    const operationalCost = fuelCost + expenseCost;

    // Fuel Efficiency (Distance / Fuel)
    const fuelEfficiency = fuelLiters > 0 ? distance / fuelLiters : 0;

    // ROI: (Revenue - Operational Cost) / Acquisition Cost
    const roi = vehicle.acquisitionCost > 0
      ? (revenue - operationalCost) / vehicle.acquisitionCost
      : null;

    vehicleStats.push({
      _id: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      region: vehicle.region,
      acquisitionCost: vehicle.acquisitionCost,
      revenue,
      distance,
      fuelCost,
      fuelLiters,
      expenseCost,
      operationalCost,
      fuelEfficiency,
      roi,
    });
  }

  return {
    kpis: {
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
    },
    vehicles: vehicleStats,
  };
};

// @desc    Get dashboard KPIs and stats
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await calculateReportStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Export fleet reports as CSV
// @route   GET /api/reports/export/csv
// @access  Private
const exportFleetReportCSV = async (req, res, next) => {
  try {
    const stats = await calculateReportStats();

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'registrationNumber', title: 'REGISTRATION NUMBER' },
        { id: 'name', title: 'VEHICLE MODEL' },
        { id: 'type', title: 'TYPE' },
        { id: 'status', title: 'STATUS' },
        { id: 'region', title: 'REGION' },
        { id: 'acquisitionCost', title: 'ACQUISITION COST ($)' },
        { id: 'revenue', title: 'TOTAL REVENUE ($)' },
        { id: 'operationalCost', title: 'OPERATIONAL COST ($)' },
        { id: 'fuelEfficiency', title: 'FUEL EFFICIENCY (km/L)' },
        { id: 'roi', title: 'ROI (%)' },
      ],
    });

    const records = stats.vehicles.map((v) => ({
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      status: v.status,
      region: v.region,
      acquisitionCost: v.acquisitionCost,
      revenue: v.revenue.toFixed(2),
      operationalCost: v.operationalCost.toFixed(2),
      fuelEfficiency: v.fuelEfficiency.toFixed(2),
      roi: v.roi !== null ? (v.roi * 100).toFixed(2) : 'N/A',
    }));

    const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fleet-report.csv');
    res.status(200).send(csvString);
  } catch (error) {
    next(error);
  }
};

// @desc    Export fleet reports as PDF
// @route   GET /api/reports/export/pdf
// @access  Private
const exportFleetReportPDF = async (req, res, next) => {
  try {
    const stats = await calculateReportStats();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=fleet-report.pdf');

    generateFleetReportPDF(stats, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  exportFleetReportCSV,
  exportFleetReportPDF,
};
