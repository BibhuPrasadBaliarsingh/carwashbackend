const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  role: { type: String, required: true },
  salaryType: { type: String, enum: ['fixed', 'commission', 'both'], default: 'fixed' },
  baseSalary: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
  faceData: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
