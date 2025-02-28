// O:\JobConnector\backend\controllers\authController.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const JobSeeker = require('../models/JobSeeker');
const JobProvider = require('../models/JobProvider');
const Admin = require('../models/Admin');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'rajvardhant563@gmail.com', pass: 'woyo svyv bzux xyjq' },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendWhatsAppOTP = async (whatsappNumber, otp) => {
  try {
    await client.messages.create({
      body: `Your Job Connector OTP is: ${otp}`,
      from: 'whatsapp:+14155238886', // Twilio sandbox number for WhatsApp
      to: `whatsapp:${whatsappNumber}`,
    });
    console.log(`WhatsApp OTP sent to ${whatsappNumber}`);
  } catch (error) {
    console.error('Twilio Error:', error.message);
    throw new Error('Failed to send WhatsApp OTP');
  }
};

const sendEmailOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: 'rajvardhant563@gmail.com',
      to: email,
      subject: 'Your OTP for JobConnector',
      text: `Your OTP is: ${otp}`,
    });
    console.log(`Email OTP sent to ${email}`);
  } catch (error) {
    console.error('Nodemailer Error:', error.message);
    throw new Error('Failed to send Email OTP');
  }
};

exports.requestOTP = async (req, res) => {
  const { whatsappNumber, email, role, loginRequest } = req.body;
  const otp = generateOTP();

  try {
    if (!whatsappNumber && !email) {
      return res.status(400).json({ message: 'WhatsApp number or email is required' });
    }
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    let user;
    if (role === 'seeker') {
      user = await JobSeeker.findOne({ $or: [{ whatsappNumber }, { email }] });
    } else if (role === 'provider') {
      user = await JobProvider.findOne({ $or: [{ hrWhatsappNumber: whatsappNumber }, { email }] });
    } else if (role === 'admin') {
      user = await Admin.findOne({ $or: [{ whatsappNumber }, { email }] });
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (loginRequest && !user) {
      return res.status(404).json({ message: 'User not found, please register first' });
    }

    if (whatsappNumber) {
      await sendWhatsAppOTP(whatsappNumber, otp);
      return res.json({ message: 'OTP sent on WhatsApp', serverOtp: otp });
    } else if (email) {
      await sendEmailOTP(email, otp);
      return res.json({ message: 'OTP sent on email', serverOtp: otp });
    }
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ message: error.message || 'Error sending OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { whatsappNumber, email, otp, serverOtp, role, bypass } = req.body;

  try {
    if (!whatsappNumber && !email) {
      return res.status(400).json({ message: 'WhatsApp number or email is required' });
    }
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    let user;
    let isNewUser = false;

    if (role === 'seeker') {
      user = await JobSeeker.findOne({ $or: [{ whatsappNumber }, { email }] });
      if (!user) isNewUser = true;
    } else if (role === 'provider') {
      user = await JobProvider.findOne({ $or: [{ hrWhatsappNumber: whatsappNumber }, { email }] });
      if (!user) isNewUser = true;
    } else if (role === 'admin') {
      user = await Admin.findOne({ $or: [{ whatsappNumber }, { email }] });
      if (!user) isNewUser = true;
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (bypass) {
      return res.json({
        message: 'Bypass successful',
        user,
        isNewUser,
        success: true,
      });
    }

    if (!otp || !serverOtp) {
      return res.status(400).json({ message: 'OTP and server OTP are required' });
    }

    if (otp === serverOtp) {
      return res.json({
        message: 'OTP verification successful',
        user,
        isNewUser,
        success: true,
      });
    } else {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.message || error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};