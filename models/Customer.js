const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  vehicles: [{
    make: String,
    model: String,
    licensePlate: String,
    color: String
  }],
  leadSource: { type: String },
  type: { type: String, enum: ['regular', 'premium', 'corporate'], default: 'regular' },
  amcStatus: { type: String, enum: ['none', 'active', 'expired'], default: 'none' },
  amcExpiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
