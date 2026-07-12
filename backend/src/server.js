const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Critical environment validation
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initCronJobs } = require('./utils/cronJobs');

// Route files
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Connect to database
connectDB();

const app = express();

// 1. HTTP Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to prevent blocking local scripts/assets
  crossOriginEmbedderPolicy: false,
}));

// 2. Gzip Payload Compression
app.use(compression());

// 3. HTTP Request Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// 4. Rate Limiter for Authentication routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve compiled static React files
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

// Fallback to React frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Production-ready Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
  
  // Initialize cron jobs
  initCronJobs();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
