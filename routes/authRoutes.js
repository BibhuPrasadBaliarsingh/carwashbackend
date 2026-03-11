const express = require('express');
const router = express.Router();
const { registerUser, loginUser, createAdminUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/seed-admin', createAdminUser);

module.exports = router;
