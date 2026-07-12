const Driver = require('../models/Driver');
const SafetyIncident = require('../models/SafetyIncident');
const SafetyAuditLog = require('../models/SafetyAuditLog');

// Helper function to recalculate safety score
const recalculateDriverSafetyScore = async (driverId, reason, triggerEvent, tripId = null, vehicleId = null, userId = null) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) return null;

    // Get all incidents
    const incidents = await SafetyIncident.find({ driver: driverId });

    // Deduct points
    let totalDeductions = 0;
    let accidents = 0;
    let violations = 0;
    let lateTrips = 0;
    let cancelledTrips = 0;
    let overloadedTrips = 0;
    let complaints = 0;

    incidents.forEach(inc => {
      totalDeductions += inc.scoreImpact;
      if (inc.type === 'Accident') accidents++;
      if (inc.type === 'Violation') violations++;
      if (inc.type === 'Late Completion') lateTrips++;
      if (inc.type === 'Cancelled Trip') cancelledTrips++;
      if (inc.type === 'Overload Attempt') overloadedTrips++;
      if (inc.type === 'Customer Complaint') complaints++;
    });

    const previousScore = driver.safetyScore;
    const currentScore = Math.max(0, 100 - totalDeductions);

    // Determine safety grade & risk level
    let safetyGrade = 'A';
    let riskLevel = 'Low';

    if (currentScore >= 90) {
      safetyGrade = 'A';
      riskLevel = 'Low';
    } else if (currentScore >= 80) {
      safetyGrade = 'B';
      riskLevel = 'Low';
    } else if (currentScore >= 70) {
      safetyGrade = 'C';
      riskLevel = 'Medium';
    } else if (currentScore >= 50) {
      safetyGrade = 'D';
      riskLevel = 'High';
    } else {
      safetyGrade = 'F';
      riskLevel = 'Critical';
    }

    // Check license expiry
    const isExpired = new Date(driver.licenseExpiryDate) < new Date();
    
    // Determine Eligibility
    const isEligible = currentScore >= 50 && !isExpired && driver.status !== 'Suspended' && driver.status !== 'On Trip';

    // Update driver schema fields
    driver.safetyScore = currentScore;
    driver.safetyGrade = safetyGrade;
    driver.riskLevel = riskLevel;
    driver.accidentCount = accidents;
    driver.violationCount = violations;
    driver.lateTripCount = lateTrips;
    driver.cancelledTripCount = cancelledTrips;
    driver.overloadedTripCount = overloadedTrips;
    driver.customerComplaintCount = complaints;
    driver.driverEligible = isEligible;
    driver.lastScoreUpdate = new Date();

    await driver.save();

    // Log the change in safety audit log if score shifted
    if (previousScore !== currentScore || triggerEvent === 'Initial Recalculation') {
      await SafetyAuditLog.create({
        driver: driverId,
        previousScore,
        currentScore,
        reason,
        triggerEvent,
        trip: tripId,
        vehicle: vehicleId,
        user: userId,
        date: new Date(),
      });
    }

    return driver;
  } catch (error) {
    console.error('Recalculate safety score error:', error);
    return null;
  }
};

// @desc    Get all safety incidents
// @route   GET /api/safety/incidents
// @access  Private
const getIncidents = async (req, res, next) => {
  try {
    const { driverId, type, sort } = req.query;
    let query = {};
    if (driverId) query.driver = driverId;
    if (type) query.type = type;

    let result = SafetyIncident.find(query)
      .populate('driver')
      .populate('trip')
      .populate('vehicle');

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-date');
    }

    const incidents = await result;
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a new safety incident
// @route   POST /api/safety/incidents
// @access  Private/Safety Officer/Fleet Manager
const createIncident = async (req, res, next) => {
  try {
    const { driverId, type, reason, scoreImpact, tripId, vehicleId } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404);
      throw new Error('Driver profile not found');
    }

    // Default deductions based on event type if not provided
    let deduction = scoreImpact;
    if (!deduction || deduction === 0) {
      if (type === 'Accident') deduction = 30;
      else if (type === 'Violation') deduction = 15;
      else if (type === 'Customer Complaint') deduction = 10;
      else if (type === 'Overload Attempt') deduction = 5;
      else if (type === 'Late Completion') deduction = 5;
      else deduction = 2; // Default Cancelled Trip / Other
    }

    const incident = await SafetyIncident.create({
      driver: driverId,
      type,
      reason,
      scoreImpact: deduction,
      trip: tripId,
      vehicle: vehicleId,
    });

    // Recalculate score immediately
    await recalculateDriverSafetyScore(
      driverId,
      reason,
      `Safety Incident Created: ${type}`,
      tripId,
      vehicleId,
      req.user?._id
    );

    const populatedIncident = await SafetyIncident.findById(incident._id)
      .populate('driver')
      .populate('trip')
      .populate('vehicle');

    res.status(201).json({ success: true, data: populatedIncident });
  } catch (error) {
    next(error);
  }
};

// @desc    Get safety score audit history logs
// @route   GET /api/safety/audits
// @access  Private
const getAuditLogs = async (req, res, next) => {
  try {
    const { driverId, sort } = req.query;
    let query = {};
    if (driverId) query.driver = driverId;

    let result = SafetyAuditLog.find(query)
      .populate('driver')
      .populate('trip')
      .populate('vehicle')
      .populate('user', 'name email');

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-date');
    }

    const audits = await result;
    res.json({ success: true, count: audits.length, data: audits });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recalculateDriverSafetyScore,
  getIncidents,
  createIncident,
  getAuditLogs,
};
