const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true },
  supplier: { type: String },
  reorderLevel: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
