// O:\JobConnector\backend\routes\profileRoutes.js
const express = require('express');
const multer = require('multer');
const { createSeekerProfile, createProviderProfile, updateSeekerProfile, updateProviderProfile, getProfile } = require('../controllers/profileController');
const uploadResume = require('../resumeUpload');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', getProfile);
router.post('/seeker', uploadResume.single("resume"), createSeekerProfile);
router.post('/provider', createProviderProfile);
router.post('/seeker/update', upload.single('resume'), updateSeekerProfile);
router.post('/provider/update', updateProviderProfile);

module.exports = router;
