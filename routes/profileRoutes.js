// O:\JobConnector\backend\routes\profileRoutes.js
const express = require('express');
const multer = require('multer');
const { createSeekerProfile, createProviderProfile, updateSeekerProfile, updateProviderProfile, getProfile } = require('../controllers/profileController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/seeker', createSeekerProfile);
router.post('/provider', createProviderProfile);
router.get('/get', getProfile);
router.put('/update-seeker', updateSeekerProfile);   
router.put('/update-provider', updateProviderProfile); 

module.exports = router;
