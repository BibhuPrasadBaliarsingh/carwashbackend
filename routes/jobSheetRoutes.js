const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const JobSheet = require('../models/JobSheet');
const {
  getAllJobSheets,
  getJobSheetById,
  createJobSheet,
  updateJobSheet,
  deleteJobSheet,
  updateJobSheetStatus,
  uploadPhotos,
  addChecklistItem,
  toggleChecklistItem
} = require('../controllers/jobSheetController');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Routes
router.route('/')
  .get(getAllJobSheets)
  .post(createJobSheet);

router.route('/:id')
  .get(getJobSheetById)
  .put(updateJobSheet)
  .delete(deleteJobSheet);

router.patch('/:id/status', updateJobSheetStatus);

router.post('/:id/photos', upload.single('image'), async (req, res) => {
  try {
    const { photoType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const photoUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    
    const jobSheet = await JobSheet.findById(req.params.id);
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }
    
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
});

router.post('/:id/checklist', addChecklistItem);

router.patch('/:id/checklist/:itemId', toggleChecklistItem);

module.exports = router;

