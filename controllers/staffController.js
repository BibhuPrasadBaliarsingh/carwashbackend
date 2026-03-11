const Staff = require('../models/Staff');

const getStaff = async (req, res) => {
  try {
    const staffMembers = await Staff.find({});
    res.json(staffMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStaff = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json(staff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getStaff, createStaff };
