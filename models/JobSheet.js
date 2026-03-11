const mongoose = require('mongoose');

const jobSheetSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleDetails: {
    make: { type: String },
    model: { type: String },
    licensePlate: { type: String },
    color: { type: String }
  },
  serviceDetails: {
    serviceType: { type: String, required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    addOns: [{ type: String }],
    notes: { type: String }
  },
  beforePhotos: [{ type: String }],
  afterPhotos: [{ type: String }],
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'quality-check', 'completed'], 
    default: 'pending' 
  },
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
  startTime: { type: Date },
  endTime: { type: Date },
  totalAmount: { type: Number },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'partial'], 
    default: 'unpaid' 
  },
  checklist: [{
    item: { type: String },
    completed: { type: Boolean, default: false }
  }],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('JobSheet', jobSheetSchema);

