const express = require('express');
const router = express.Router();
const { getPackages, createPackage } = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPackages)
  .post(protect, authorize('admin', 'manager'), createPackage);

module.exports = router;
