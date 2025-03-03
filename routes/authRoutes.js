// routes/authRoutes.js
const express = require('express');
const { requestOTP, verifyOTP } = require('../controllers/authController');

const router = express.Router();

// Request OTP
router.post('/request-otp', requestOTP);

// Verify OTP or bypass
router.post('/verify-otp', verifyOTP);

module.exports = router;
