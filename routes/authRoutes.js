// routes/authRoutes.js
const express = require('express');
const { requestOTP, verifyOTP, sendWhatsAppOTP } = require('../controllers/authController');

const router = express.Router();

//send whatsapp OTP
router.post('/send/whatsapp-otp', sendWhatsAppOTP);

// Request OTP
router.post('/request-otp', requestOTP);

// Verify OTP or bypass
router.post('/verify-otp', verifyOTP);

module.exports = router;
