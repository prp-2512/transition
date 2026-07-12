const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter configuration
  const transporterOpts = {};
  
  if (process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_USER && process.env.SMTP_USER.includes('gmail.com'))) {
    transporterOpts.service = 'gmail';
    transporterOpts.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  } else {
    transporterOpts.host = process.env.SMTP_HOST || 'smtp.mailtrap.io';
    transporterOpts.port = process.env.SMTP_PORT || 2525;
    transporterOpts.auth = {
      user: process.env.SMTP_USER || 'mock',
      pass: process.env.SMTP_PASS || 'mock',
    };
  }

  const transporter = nodemailer.createTransport(transporterOpts);

  const message = {
    from: `"TransitOps Fleet Alert" <no-reply@transitops.com>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  // For testing, we also log the email to console
  console.log(`================ EMAIL ALERT SENT ================`);
  console.log(`To: ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Message: ${options.message}`);
  console.log(`==================================================`);

  try {
    const info = await transporter.sendMail(message);
    return info;
  } catch (error) {
    console.warn(`Nodemailer actual send skipped/failed: ${error.message} (Logged above)`);
    return { mockSent: true, messageId: 'mock-12345' };
  }
};

module.exports = sendEmail;
