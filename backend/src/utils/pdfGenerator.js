const PDFDocument = require('pdfkit');

/**
 * Generates a TransitOps Fleet Summary PDF Report.
 * @param {Object} reportData Data to display in the PDF report
 * @param {res} res Express response object
 */
const generateFleetReportPDF = (reportData, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to Express response
  doc.pipe(res);

  // Colors
  const primaryColor = '#4f46e5'; // Indigo
  const secondaryColor = '#0f172a'; // Slate
  const accentColor = '#10b981'; // Emerald
  const grayColor = '#64748b'; // Gray

  // Title / Header
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(24)
    .text('TransitOps', 50, 50);

  doc
    .fillColor(secondaryColor)
    .font('Helvetica')
    .fontSize(10)
    .text('Smart Transport Operations Platform', 50, 75);

  doc
    .fillColor(grayColor)
    .fontSize(8)
    .text(`Report Generated: ${new Date().toLocaleString()}`, 50, 90, { align: 'right' });

  // Line separator
  doc
    .moveTo(50, 105)
    .lineTo(550, 105)
    .lineWidth(1.5)
    .stroke('#e2e8f0');

  // Summary Metrics Section
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('Fleet Status Summary', 50, 120);

  // Draw blocks for KPIs
  const kpis = [
    { label: 'Active Trips', val: reportData.kpis.activeTrips },
    { label: 'Drivers On Duty', val: reportData.kpis.driversOnDuty },
    { label: 'Utilization', val: `${reportData.kpis.fleetUtilization.toFixed(1)}%` },
    { label: 'Active Vehicles', val: reportData.kpis.activeVehicles },
    { label: 'Available Vehicles', val: reportData.kpis.availableVehicles },
    { label: 'In Maintenance', val: reportData.kpis.vehiclesInMaintenance },
  ];

  let x = 50;
  let y = 145;
  kpis.forEach((kpi, idx) => {
    // Draw card background
    doc
      .rect(x, y, 150, 45)
      .fillOpacity(0.05)
      .fill(primaryColor);

    // Write text
    doc
      .fillOpacity(1.0)
      .fillColor(grayColor)
      .font('Helvetica')
      .fontSize(8)
      .text(kpi.label, x + 10, y + 10);

    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(String(kpi.val), x + 10, y + 22);

    x += 170;
    if (idx === 2) {
      x = 50;
      y += 55;
    }
  });

  // Vehicle Performance & ROI Table
  y += 70;
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('Vehicle ROI & Efficiency Metrics', 50, y);

  y += 20;
  // Header row
  doc
    .rect(50, y, 500, 20)
    .fill(secondaryColor);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('Reg No', 55, y + 6)
    .text('Model', 120, y + 6)
    .text('Total Rev (INR)', 210, y + 6)
    .text('Op Cost (INR)', 280, y + 6)
    .text('Efficiency', 360, y + 6)
    .text('Vehicle ROI', 450, y + 6);

  y += 20;

  reportData.vehicles.forEach((vehicle, index) => {
    // Zebra striping
    if (index % 2 === 0) {
      doc
        .rect(50, y, 500, 20)
        .fill('#f8fafc');
    }

    doc
      .fillColor(secondaryColor)
      .font('Helvetica')
      .fontSize(8)
      .text(vehicle.registrationNumber, 55, y + 6)
      .text(vehicle.name.substring(0, 18), 120, y + 6)
      .text(`INR ${vehicle.revenue.toLocaleString('en-IN')}`, 210, y + 6)
      .text(`INR ${vehicle.operationalCost.toLocaleString('en-IN')}`, 280, y + 6)
      .text(vehicle.fuelEfficiency > 0 ? `${vehicle.fuelEfficiency.toFixed(2)} km/L` : 'N/A', 360, y + 6);

    // Highlight ROI positive vs negative
    const roiColor = vehicle.roi >= 0 ? accentColor : '#ef4444';
    doc
      .fillColor(roiColor)
      .font('Helvetica-Bold')
      .text(vehicle.roi !== null ? `${(vehicle.roi * 100).toFixed(1)}%` : 'N/A', 450, y + 6);

    y += 20;

    // Page breaking handling
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  });

  // Footer note
  doc
    .fillColor(grayColor)
    .font('Helvetica-Oblique')
    .fontSize(8)
    .text('End of TransitOps Fleet Analytics Report. Confidential.', 50, 750, { align: 'center' });

  doc.end();
};

module.exports = { generateFleetReportPDF };
