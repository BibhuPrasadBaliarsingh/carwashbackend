const express = require('express');
const router = express.Router();
const { getStaff, createStaff } = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'manager'), getStaff)
  .post(protect, authorize('admin', 'manager'), createStaff);

module.exports = router;
