const JobSheet = require('../models/JobSheet');
const Appointment = require('../models/Appointment');

// Get all job sheets
const getAllJobSheets = async (req, res) => {
  try {
    const jobSheets = await JobSheet.find()
      .populate('customer', 'name email phone')
      .populate('appointment', 'date serviceType status')
      .populate('assignedStaff', 'name position')
      .populate('package', 'name price')
      .sort({ createdAt: -1 });
    res.json(jobSheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get job sheet by ID
const getJobSheetById = async (req, res) => {
  try {
    const jobSheet = await JobSheet.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('appointment')
      .populate('assignedStaff', 'name position phone')
      .populate('package', 'name price description');
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }
    res.json(jobSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new job sheet
const createJobSheet = async (req, res) => {
  try {
    const { appointmentId, customerId, vehicleDetails, serviceDetails, assignedStaff, notes } = req.body;

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const jobSheet = new JobSheet({
      appointment: appointmentId,
      customer: customerId,
      vehicleDetails: vehicleDetails || {
        make: appointment.vehicleMake,
        model: appointment.vehicleModel,
        licensePlate: appointment.licensePlate
      },
      serviceDetails: {
        serviceType: appointment.serviceType,
        notes: serviceDetails?.notes
      },
      assignedStaff: assignedStaff || [],
      totalAmount: appointment.totalAmount,
      notes
    });

    const createdJobSheet = await jobSheet.save();
    const populatedJobSheet = await JobSheet.findById(createdJobSheet._id)
      .populate('customer', 'name email phone')
      .populate('appointment', 'date serviceType status')
      .populate('assignedStaff', 'name position');

    res.status(201).json(populatedJobSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update job sheet
const updateJobSheet = async (req, res) => {
  try {
    const jobSheet = await JobSheet.findById(req.params.id);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }

    const updatedJobSheet = await JobSheet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('customer', 'name email phone')
      .populate('appointment', 'date serviceType status')
      .populate('assignedStaff', 'name position');

    res.json(updatedJobSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete job sheet
const deleteJobSheet = async (req, res) => {
  try {
    const jobSheet = await JobSheet.findById(req.params.id);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }

    await jobSheet.deleteOne();
    res.json({ message: 'Job sheet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update job sheet status
const updateJobSheetStatus = async (req, res) => {
  try {
    const { status, startTime, endTime } = req.body;
    const jobSheet = await JobSheet.findById(req.params.id);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }

    jobSheet.status = status;
    if (startTime) jobSheet.startTime = startTime;
    if (endTime) jobSheet.endTime = endTime;

    await jobSheet.save();
    
    const updatedJobSheet = await JobSheet.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('appointment', 'date serviceType status')
      .populate('assignedStaff', 'name position');

    res.json(updatedJobSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload photos
const uploadPhotos = async (req, res) => {
  try {
    const { photoType } = req.body; // 'before' or 'after'
    const jobSheet = await JobSheet.findById(req.params.id);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const photoUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    
    if (photoType === 'before') {
      jobSheet.beforePhotos.push(photoUrl);
    } else if (photoType === 'after') {
      jobSheet.afterPhotos.push(photoUrl);
    }

    await jobSheet.save();
    res.json(jobSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add checklist item
const addChecklistItem = async (req, res) => {
  try {
    const { item } = req.body;
    const jobSheet = await JobSheet.findById(req.params.id);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }

    jobSheet.checklist.push({ item, completed: false });
    await jobSheet.save();
    res.json(jobSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle checklist item
const toggleChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const jobSheet = await JobSheet.findById(req.params.id);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }

    const checklistItem = jobSheet.checklist.id(itemId);
    if (!checklistItem) {
      return res.status(404).json({ message: 'Checklist item not found' });
    }

    checklistItem.completed = !checklistItem.completed;
    await jobSheet.save();
    res.json(jobSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllJobSheets,
  getJobSheetById,
  createJobSheet,
  updateJobSheet,
  deleteJobSheet,
  updateJobSheetStatus,
  uploadPhotos,
  addChecklistItem,
  toggleChecklistItem
};

