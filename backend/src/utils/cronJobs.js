const cron = require('node-cron');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const sendEmail = require('./emailService');
const { recalculateDriverSafetyScore } = require('../controllers/safetyController');
const { recalculateVehicleHealthScore } = require('../controllers/maintenanceScheduleController');
const { recalculateVehicleFuelStats } = require('../controllers/fuelController');

const checkExpiringLicensesAndMaintenance = async () => {
  console.log('Running daily driver license and vehicle maintenance check...');
  const today = new Date();
  
  // 1. Process Driver Licensing and Safety Scores
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const drivers = await Driver.find({});
    console.log(`Auditing ${drivers.length} driver profiles for licensing and safety...`);

    for (const driver of drivers) {
      const daysRemaining = Math.ceil((new Date(driver.licenseExpiryDate) - today) / (1000 * 60 * 60 * 24));
      
      // Update driver eligibility based on score and license status
      const expired = daysRemaining <= 0;
      const criticalSafety = driver.safetyScore < 50;
      const activeTrip = driver.status === 'On Trip';
      const suspended = driver.status === 'Suspended';
      
      driver.driverEligible = !expired && !criticalSafety && !activeTrip && !suspended;
      await driver.save();

      // Recalculate score to update status values in DB
      await recalculateDriverSafetyScore(driver._id, 'Daily Scheduled Scan', 'Scheduled Daily Check Scan');

      // Send alert emails for expiring / expired licenses
      if (daysRemaining <= 30) {
        let subject = `URGENT: Driver License Expiry Warning - ${driver.name}`;
        let message = `Hello Safety Officer,\n\nThis is an automated reminder that driver ${driver.name}'s driving license (License No: ${driver.licenseNumber}) is expiring in ${daysRemaining} days (Expiry Date: ${new Date(driver.licenseExpiryDate).toDateString()}).\n\nPlease ensure they renew their license to remain eligible for trip dispatches.\n\nBest,\nTransitOps Fleet Management`;

        if (expired) {
          subject = `ALERT: Driver License EXPIRED - ${driver.name}`;
          message = `Hello Safety Officer,\n\nThis is an automated alert that driver ${driver.name}'s driving license (License No: ${driver.licenseNumber}) has EXPIRED on ${new Date(driver.licenseExpiryDate).toDateString()}.\n\nThey have been automatically blocked from new trip dispatches. Please follow up immediately.\n\nBest,\nTransitOps Fleet Management`;
        }

        await sendEmail({
          email: 'prathampanchal2512@gmail.com',
          subject: subject,
          message: message,
          html: `
            <h3>TransitOps Safety Warning</h3>
            <p><strong>Driver:</strong> ${driver.name}</p>
            <p><strong>License Number:</strong> ${driver.licenseNumber}</p>
            <p><strong>Expiry Date:</strong> ${new Date(driver.licenseExpiryDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${expired ? '<span style="color:red;font-weight:bold;">EXPIRED</span>' : `<span style="color:orange;">Expiring in ${daysRemaining} days</span>`}</p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        });
      }
    }
  } catch (error) {
    console.error('Error running driver license checks:', error);
  }

  // 2. Process Vehicle Maintenance Schedules
  try {
    const schedules = await MaintenanceSchedule.find({ status: { $ne: 'Completed' } }).populate('maintenanceType').populate('vehicle');
    console.log(`Auditing ${schedules.length} active maintenance schedules...`);

    for (const sch of schedules) {
      if (sch.maintenanceType && sch.vehicle) {
        const remKM = sch.nextServiceOdometer - sch.vehicle.odometer;
        const remDays = Math.ceil((new Date(sch.nextServiceDate) - today) / (1000 * 60 * 60 * 24));
        
        let oldStatus = sch.status;
        if (remKM <= 0 || remDays <= 0) {
          sch.status = 'Overdue';
        } else if (remKM <= 500 || remDays <= 10) {
          sch.status = 'Due Soon';
        } else {
          sch.status = 'Healthy';
        }

        if (oldStatus !== sch.status) {
          await sch.save();
          console.log(`Schedule status shifted for vehicle ${sch.vehicle.registrationNumber}: ${oldStatus} -> ${sch.status}`);
          
          // Send warning emails for overdue services
          if (sch.status === 'Overdue' || sch.status === 'Due') {
            await sendEmail({
              email: 'prathampanchal2512@gmail.com',
              subject: `URGENT: Maintenance ${sch.status.toUpperCase()} - ${sch.vehicle.registrationNumber}`,
              message: `Hello Fleet Manager,\n\nThe maintenance schedule for vehicle ${sch.vehicle.name} (${sch.vehicle.registrationNumber}) is ${sch.status}.\n\nNext Service Odometer: ${sch.nextServiceOdometer} km (Current: ${sch.vehicle.odometer} km)\nNext Service Date: ${new Date(sch.nextServiceDate).toDateString()}\n\nPlease dispatch this vehicle to In Shop status immediately.`,
              html: `
                <h3>TransitOps Maintenance Alert</h3>
                <p><strong>Vehicle:</strong> ${sch.vehicle.name} (${sch.vehicle.registrationNumber})</p>
                <p><strong>Status:</strong> <span style="color:red;font-weight:bold;">${sch.status.toUpperCase()}</span></p>
                <p><strong>Odometer Reading:</strong> ${sch.vehicle.odometer} km (Limit: ${sch.nextServiceOdometer} km)</p>
                <p><strong>Scheduled Date:</strong> ${new Date(sch.nextServiceDate).toLocaleDateString()}</p>
              `
            });
          }
        }
      }
    }

    // Recalculate health and fuel statistics for all vehicles to synchronize stats
    const vehicles = await Vehicle.find({});
    for (const vehicle of vehicles) {
      await recalculateVehicleHealthScore(vehicle._id);
      await recalculateVehicleFuelStats(vehicle._id, null, 'Daily Scheduled Fuel Scan');
    }
  } catch (error) {
    console.error('Error running maintenance schedule updates:', error);
  }
};

const initCronJobs = () => {
  // Schedule to run every day at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', () => {
    checkExpiringLicensesAndMaintenance();
  });
  console.log('Cron Job scheduled: Daily Driver License & Vehicle Maintenance Check (0 0 * * *).');

  // Trigger once immediately on startup for live debugging/seeding checks
  setTimeout(checkExpiringLicensesAndMaintenance, 5000);
};

module.exports = { initCronJobs, checkExpiringLicenses: checkExpiringLicensesAndMaintenance };
