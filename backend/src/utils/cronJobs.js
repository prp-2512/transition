const cron = require('node-cron');
const Driver = require('../models/Driver');
const sendEmail = require('./emailService');

const checkExpiringLicenses = async () => {
  console.log('Running daily driver license expiry check...');
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Find drivers whose licenses are expiring within 30 days, or already expired, and status !== 'Suspended'
    const drivers = await Driver.find({
      licenseExpiryDate: { $lte: thirtyDaysFromNow },
    });

    console.log(`Found ${drivers.length} drivers with licenses expiring in <= 30 days or already expired.`);

    for (const driver of drivers) {
      const daysRemaining = Math.ceil((new Date(driver.licenseExpiryDate) - today) / (1000 * 60 * 60 * 24));
      
      let subject = `URGENT: Driver License Expiry Warning - ${driver.name}`;
      let message = `Hello Safety Officer,\n\nThis is an automated reminder that driver ${driver.name}'s driving license (License No: ${driver.licenseNumber}) is expiring in ${daysRemaining} days (Expiry Date: ${new Date(driver.licenseExpiryDate).toDateString()}).\n\nPlease ensure they renew their license to remain eligible for trip dispatches.\n\nBest,\nTransitOps Fleet Management`;

      if (daysRemaining <= 0) {
        subject = `ALERT: Driver License EXPIRED - ${driver.name}`;
        message = `Hello Safety Officer,\n\nThis is an automated alert that driver ${driver.name}'s driving license (License No: ${driver.licenseNumber}) has EXPIRED on ${new Date(driver.licenseExpiryDate).toDateString()}.\n\nThey have been automatically blocked from new trip dispatches. Please follow up immediately.\n\nBest,\nTransitOps Fleet Management`;
        
        // Auto suspend or flag? The requirement says "Drivers with expired licenses or Suspended status cannot be assigned to trips". 
        // We already validate on trip creation, but let's log it clearly.
      }

      // Send alert to Safety Officer (or system admin). For demo, we send to a mock address.
      await sendEmail({
        email: 'safety-officer@transitops.com',
        subject: subject,
        message: message,
        html: `
          <h3>TransitOps Safety Warning</h3>
          <p><strong>Driver:</strong> ${driver.name}</p>
          <p><strong>License Number:</strong> ${driver.licenseNumber}</p>
          <p><strong>Expiry Date:</strong> ${new Date(driver.licenseExpiryDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${daysRemaining <= 0 ? '<span style="color:red;font-weight:bold;">EXPIRED</span>' : `<span style="color:orange;">Expiring in ${daysRemaining} days</span>`}</p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });
    }
  } catch (error) {
    console.error('Error running license check cron job:', error);
  }
};

const initCronJobs = () => {
  // Schedule to run every day at midnight: '0 0 * * *'
  // For testing/demonstration, we can also run it every hour, or just expose the function
  cron.schedule('0 0 * * *', () => {
    checkExpiringLicenses();
  });
  console.log('Cron Job scheduled: Daily Driver License Expiry Check (0 0 * * *).');

  // Trigger once immediately on startup for live debugging/seeding checks
  setTimeout(checkExpiringLicenses, 5000);
};

module.exports = { initCronJobs, checkExpiringLicenses };
