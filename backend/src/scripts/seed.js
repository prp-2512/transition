const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');
const FuelLog = require('../models/FuelLog');

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
        registrationNumber: 'GJ-01-LM-05',
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

    // 4. Seed Maintenance Logs (INR values)
    const activeMaint = await Maintenance.create({
      vehicle: vMahindra._id,
      description: 'Fuel injector cleaning & clutch pad replacement',
      cost: 18500, // ₹18,500
      status: 'Active',
      startDate: futureDate(-2),
    });

    const closedMaint = await Maintenance.create({
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

    // 5. Seed Fuel Logs (INR values: ~₹98 per liter)
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

    // 6. Seed Expenses (INR values)
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

    // 7. Seed Trips (INR values)
    // Completed trip
    await Trip.create({
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
    await Trip.create({
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
    console.log('Database Seeding Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
