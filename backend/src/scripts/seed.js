const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');
const FuelLog = require('../models/FuelLog');
const MaintenanceType = require('../models/MaintenanceType');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const SafetyIncident = require('../models/SafetyIncident');
const SafetyAuditLog = require('../models/SafetyAuditLog');
const { recalculateDriverSafetyScore } = require('../controllers/safetyController');
const { recalculateVehicleHealthScore } = require('../controllers/maintenanceScheduleController');
const { recalculateVehicleFuelStats } = require('../controllers/fuelController');

require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to Database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transitops');
    console.log('Database connected for seeding localized Indian fleet data...');

    // Clear existing data
    await User.deleteMany();
    await Vehicle.deleteMany();
    await Driver.deleteMany();
    await Trip.deleteMany();
    await Maintenance.deleteMany();
    await Expense.deleteMany();
    await FuelLog.deleteMany();
    await MaintenanceType.deleteMany();
    await MaintenanceSchedule.deleteMany();
    await SafetyIncident.deleteMany();
    await SafetyAuditLog.deleteMany();
    console.log('Cleared existing collections.');

    // 1. Seed Users (Roles are uniform globally, emails remain simple)
    const users = [
      {
        name: 'Arjun Sharma',
        email: 'manager@transitops.com',
        password: 'password123',
        role: 'Fleet Manager',
      },
      {
        name: 'Ravi Kumar',
        email: 'driver@transitops.com',
        password: 'password123',
        role: 'Driver',
      },
      {
        name: 'Pooja Patel',
        email: 'safety@transitops.com',
        password: 'password123',
        role: 'Safety Officer',
      },
      {
        name: 'Vikram Singh',
        email: 'finance@transitops.com',
        password: 'password123',
        role: 'Financial Analyst',
      },
    ];

    const seededUsers = [];
    for (const u of users) {
      const userObj = new User(u);
      await userObj.save();
      seededUsers.push(userObj);
    }
    console.log(`Seeded ${seededUsers.length} users successfully.`);

    // 2. Seed Vehicles with Indian Registration format (MH, KA, DL, GJ, etc.) and Indian pricing in INR
    const vehicles = [
      {
        registrationNumber: 'MH-12-PQ-9812',
        name: 'Tata Prima 2825.K',
        type: 'Heavy Truck',
        maxLoadCapacity: 25000,
        odometer: 14520,
        acquisitionCost: 4200000, // 42 Lakhs INR
        status: 'Available',
        region: 'Maharashtra',
      },
      {
        registrationNumber: 'KA-51-AB-5021',
        name: 'Ashok Leyland Dost+',
        type: 'Cargo Van',
        maxLoadCapacity: 1500,
        odometer: 28400,
        acquisitionCost: 750000, // 7.5 Lakhs INR
        status: 'Available',
        region: 'Karnataka',
      },
      {
        registrationNumber: 'DL-03-XY-3490',
        name: 'Mahindra Bolero Maxitruck',
        type: 'Cargo Van',
        maxLoadCapacity: 1200,
        odometer: 89450,
        acquisitionCost: 820000, // 8.2 Lakhs INR
        status: 'In Shop',
        region: 'Delhi NCR',
      },
      {
        registrationNumber: 'GJ-01-LM-0504',
        name: 'BharatBenz 2823R',
        type: 'Heavy Truck',
        maxLoadCapacity: 28000,
        odometer: 1200,
        acquisitionCost: 3800000, // 38 Lakhs INR
        status: 'Available',
        region: 'Gujarat',
      },
      {
        registrationNumber: 'TS-09-JK-8812',
        name: 'Maruti Suzuki Super Carry',
        type: 'Sedan',
        maxLoadCapacity: 750,
        odometer: 125400,
        acquisitionCost: 520000, // 5.2 Lakhs INR
        status: 'Retired',
        region: 'Telangana',
      },
    ];

    const seededVehicles = await Vehicle.insertMany(vehicles);
    console.log(`Seeded ${seededVehicles.length} Indian vehicles.`);

    // 3. Seed Drivers with Indian Names and Driving License Categories (HMV, LMV, Trans)
    const today = new Date();
    const futureDate = (days) => {
      const d = new Date();
      d.setDate(today.getDate() + days);
      return d;
    };

    const drivers = [
      {
        name: 'Rajesh Gond',
        licenseNumber: 'DL-1220190034981',
        licenseCategory: 'HMV (Heavy Motor Vehicle)',
        licenseExpiryDate: futureDate(120),
        contactNumber: '+91-98765-43210',
        safetyScore: 95,
        status: 'Available',
      },
      {
        name: 'Amit Sharma',
        licenseNumber: 'KA-5120180029312',
        licenseCategory: 'Trans (Transport Category)',
        licenseExpiryDate: futureDate(60),
        contactNumber: '+91-87654-32109',
        safetyScore: 88,
        status: 'Available',
      },
      {
        name: 'Suresh Das',
        licenseNumber: 'DL-0320140023419',
        licenseCategory: 'LMV (Light Motor Vehicle)',
        licenseExpiryDate: futureDate(-5), // Expired 5 days ago
        contactNumber: '+91-76543-21098',
        safetyScore: 65,
        status: 'Suspended',
      },
      {
        name: 'Vijay Patel',
        licenseNumber: 'GJ-0120200034921',
        licenseCategory: 'HMV (Heavy Motor Vehicle)',
        licenseExpiryDate: futureDate(15), // Expiring in 15 days
        contactNumber: '+91-95432-10987',
        safetyScore: 92,
        status: 'Available',
      },
      {
        name: 'Sunil Singh',
        licenseNumber: 'MH-1220150012389',
        licenseCategory: 'LMV (Light Motor Vehicle)',
        licenseExpiryDate: futureDate(-10), // Expired 10 days ago
        contactNumber: '+91-91234-56789',
        safetyScore: 78,
        status: 'Available',
      },
    ];

    const seededDrivers = await Driver.insertMany(drivers);
    console.log(`Seeded ${seededDrivers.length} Indian drivers.`);

    // Get specific refs
    const vTata = seededVehicles.find(v => v.registrationNumber === 'MH-12-PQ-9812');
    const vAshok = seededVehicles.find(v => v.registrationNumber === 'KA-51-AB-5021');
    const vMahindra = seededVehicles.find(v => v.registrationNumber === 'DL-03-XY-3490');
    
    const dRajesh = seededDrivers.find(d => d.name === 'Rajesh Gond');
    const dAmit = seededDrivers.find(d => d.name === 'Amit Sharma');
    const dSuresh = seededDrivers.find(d => d.name === 'Suresh Das');
    const dVijay = seededDrivers.find(d => d.name === 'Vijay Patel');

    // 4. Seed Maintenance Types
    const maintenanceTypes = [
      {
        name: 'Oil Change',
        description: 'Engine oil flush & replacement filter check',
        category: 'Preventive',
        intervalKM: 5000,
        intervalMonths: 6,
        estimatedDuration: 2,
        estimatedCost: 3500,
        priority: 'Medium',
      },
      {
        name: 'Brake Inspection',
        description: 'Brake pad and rotor thickness inspection',
        category: 'Preventive',
        intervalKM: 15000,
        intervalMonths: 12,
        estimatedDuration: 4,
        estimatedCost: 5000,
        priority: 'High',
      },
      {
        name: 'Tyre Rotation',
        description: 'Align and balance wheels, rotate positions',
        category: 'Preventive',
        intervalKM: 10000,
        intervalMonths: 6,
        estimatedDuration: 1.5,
        estimatedCost: 2000,
        priority: 'Low',
      },
      {
        name: 'Engine Service',
        description: 'Comprehensive tune up and electronic diagnostics',
        category: 'Preventive',
        intervalKM: 20000,
        intervalMonths: 12,
        estimatedDuration: 8,
        estimatedCost: 15000,
        priority: 'Critical',
      },
      {
        name: 'Coolant Replacement',
        description: 'Radiator flush and anti-freeze replacement',
        category: 'Preventive',
        intervalKM: 20000,
        intervalMonths: 24,
        estimatedDuration: 1,
        estimatedCost: 1800,
        priority: 'Medium',
      },
    ];

    const seededTypes = await MaintenanceType.insertMany(maintenanceTypes);
    console.log(`Seeded ${seededTypes.length} Maintenance Types.`);

    const tOil = seededTypes.find(t => t.name === 'Oil Change');
    const tBrake = seededTypes.find(t => t.name === 'Brake Inspection');
    const tTyre = seededTypes.find(t => t.name === 'Tyre Rotation');

    // 5. Seed Maintenance Schedules
    const schedules = [
      {
        vehicle: vTata._id,
        maintenanceType: tOil._id,
        lastServiceDate: futureDate(-15),
        lastServiceOdometer: 14000,
        technician: 'Tata Authorized Workshop',
        notes: 'Pre-seeded initial service',
        status: 'Healthy',
      },
      {
        vehicle: vAshok._id,
        maintenanceType: tTyre._id,
        lastServiceDate: futureDate(-170), // Expiring soon in days
        lastServiceOdometer: 27950, // 28400 - 27950 = 450 km remaining (Due soon)
        technician: 'Local Garage Service',
        notes: 'Alignment check needed',
        status: 'Due Soon',
      },
      {
        vehicle: vMahindra._id,
        maintenanceType: tBrake._id,
        lastServiceDate: futureDate(-400), // Overdue in days
        lastServiceOdometer: 70000, // 89450 - 70000 = 19450 km driven (limit was 15000 km, so Overdue)
        technician: 'Mahindra Service Hub',
        notes: 'Clutch pad squeal reported',
        status: 'Overdue',
      },
    ];

    for (const sch of schedules) {
      const scheduleObj = new MaintenanceSchedule(sch);
      await scheduleObj.save();
    }
    console.log('Seeded Maintenance Schedules.');

    // 6. Seed Safety Incidents
    const incidents = [
      {
        driver: dSuresh._id,
        type: 'Accident',
        reason: 'Collision on National Highway 8. Minor front bumper damage.',
        scoreImpact: 30,
        vehicle: vMahindra._id,
        date: futureDate(-20),
      },
      {
        driver: dSuresh._id,
        type: 'Violation',
        reason: 'Overspeeding ticket near Surat toll bypass.',
        scoreImpact: 15,
        vehicle: vMahindra._id,
        date: futureDate(-15),
      },
      {
        driver: dSuresh._id,
        type: 'Cancelled Trip',
        reason: 'Cancelled active dispatch trip without prior notice.',
        scoreImpact: 2,
        date: futureDate(-5),
      },
      {
        driver: dVijay._id,
        type: 'Customer Complaint',
        reason: 'Rude behaviour reported by warehouse receipt staff.',
        scoreImpact: 10,
        date: futureDate(-2),
      },
      {
        driver: dAmit._id,
        type: 'Violation',
        reason: 'Red light traffic violation caught on signal cam.',
        scoreImpact: 15,
        date: futureDate(-30),
      },
    ];

    await SafetyIncident.insertMany(incidents);
    console.log('Seeded Safety Incidents.');

    // 7. Seed Maintenance Logs (INR values)
    await Maintenance.create({
      vehicle: vMahindra._id,
      description: 'Fuel injector cleaning & clutch pad replacement',
      cost: 18500, // ₹18,500
      status: 'Active',
      startDate: futureDate(-2),
    });

    await Maintenance.create({
      vehicle: vTata._id,
      description: 'Engine oil flush & brake liner rotation',
      cost: 24000, // ₹24,000
      status: 'Closed',
      startDate: futureDate(-15),
      endDate: futureDate(-14),
    });

    await Expense.create({
      vehicle: vTata._id,
      type: 'Maintenance',
      cost: 24000,
      description: 'Maintenance Log: Engine oil flush & brake liner rotation',
      date: futureDate(-14),
    });

    console.log('Seeded Maintenance Records and generated maintenance expense logs.');

    // 8. Seed Fuel Logs (INR values: ~₹98 per liter)
    const fuelLogs = [
      {
        vehicle: vTata._id,
        liters: 120,
        cost: 11760, // 120 L @ ₹98
        date: futureDate(-10),
      },
      {
        vehicle: vTata._id,
        liters: 95,
        cost: 9310, // 95 L @ ₹98
        date: futureDate(-3),
      },
      {
        vehicle: vAshok._id,
        liters: 45,
        cost: 4410, // 45 L @ ₹98
        date: futureDate(-5),
      },
    ];
    await FuelLog.insertMany(fuelLogs);
    console.log('Seeded Fuel logs.');

    // 9. Seed Expenses (INR values)
    const miscExpenses = [
      {
        vehicle: vTata._id,
        type: 'Toll',
        cost: 1500, // ₹1,500 FASTag toll deduction
        description: 'Mumbai-Pune Expressway Toll charges',
        date: futureDate(-8),
      },
      {
        vehicle: vAshok._id,
        type: 'Insurance',
        cost: 8500, // ₹8,500
        description: 'Third-party liability insurance monthly allocation',
        date: futureDate(-30),
      },
    ];
    await Expense.insertMany(miscExpenses);
    console.log('Seeded miscellaneous expenses.');

    // 10. Seed Trips (INR values)
    // Completed trip
    const t1 = await Trip.create({
      source: 'Mumbai, MH',
      destination: 'Pune, MH',
      vehicle: vTata._id,
      driver: dRajesh._id,
      cargoWeight: 18000,
      plannedDistance: 150,
      status: 'Completed',
      actualOdometerStart: 14000,
      actualOdometerEnd: 14155, // 155 km driven
      fuelConsumed: 42,
      revenue: 45000, // ₹45,000
      dispatchedAt: futureDate(-10),
      completedAt: futureDate(-9),
    });

    vTata.odometer = 14155;
    await vTata.save();

    await FuelLog.create({
      vehicle: vTata._id,
      liters: 42,
      cost: 4116, // 42 L @ ₹98
      date: futureDate(-9),
    });

    // Completed trip 2
    const t2 = await Trip.create({
      source: 'Bengaluru, KA',
      destination: 'Chennai, TN',
      vehicle: vAshok._id,
      driver: dAmit._id,
      cargoWeight: 1200,
      plannedDistance: 350,
      status: 'Completed',
      actualOdometerStart: 28000,
      actualOdometerEnd: 28362, // 362 km driven
      fuelConsumed: 88,
      revenue: 35000, // ₹35,000
      dispatchedAt: futureDate(-5),
      completedAt: futureDate(-4),
    });

    vAshok.odometer = 28362;
    await vAshok.save();

    await FuelLog.create({
      vehicle: vAshok._id,
      liters: 88,
      cost: 8624, // 88 L @ ₹98
      date: futureDate(-4),
    });

    // Draft Trip
    await Trip.create({
      source: 'Ahmedabad, GJ',
      destination: 'Surat, GJ',
      vehicle: vAshok._id,
      driver: dAmit._id,
      cargoWeight: 900,
      plannedDistance: 260,
      status: 'Draft',
      revenue: 22000, // ₹22,000
    });

    console.log('Seeded completed and draft Trips.');

    // 11. Run initial calculations to sync everything
    console.log('Running initial safety & maintenance schedule synchronizations...');
    const dbDrivers = await Driver.find({});
    for (const d of dbDrivers) {
      await recalculateDriverSafetyScore(d._id, 'Initial Seeding Sync', 'Initial Recalculation');
    }

    const dbVehicles = await Vehicle.find({});
    for (const v of dbVehicles) {
      await recalculateVehicleHealthScore(v._id);
      await recalculateVehicleFuelStats(v._id, null, 'Initial Seeding Sync');
    }

    console.log('Database Seeding Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
