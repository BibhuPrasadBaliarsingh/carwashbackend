const express = require('express');
const router = express.Router();
const { getInventory, createInventoryItem } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getInventory)
  .post(protect, createInventoryItem);

module.exports = router;
