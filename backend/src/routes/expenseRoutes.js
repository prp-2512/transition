const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  getFuelLogs,
  createFuelLog,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/checkRole');

router.use(protect);

router
  .route('/')
  .get(getExpenses)
  .post(authorize('Fleet Manager', 'Financial Analyst'), createExpense);

router
  .route('/fuel')
  .get(getFuelLogs)
  .post(authorize('Fleet Manager', 'Driver', 'Financial Analyst'), createFuelLog);

module.exports = router;
