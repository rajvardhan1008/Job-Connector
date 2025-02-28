// O:\JobConnector\backend\routes\jobRoutes.js
const express = require('express'); // Express for routing
const { 
  postJob, 
  searchJobs, 
  sendWhatsAppMessage, 
  getTrendingSkills, 
  sendMassEmail, 
  searchSeekers, 
  uploadExcel,
  deleteSeeker,
  deleteJob,
  saveSearch,
  applyToJob, 
  getApplicants
} = require('../controllers/jobController'); // Existing controller functions
const multer = require('multer'); // Multer for file uploads

const upload = multer({ dest: 'uploads/' }); // Configure multer
const router = express.Router(); // Create router instance

// Existing routes from your old code
router.post('/post', postJob); // Post a new job
router.get('/search', searchJobs); // Search jobs for seekers
router.post('/whatsapp', sendWhatsAppMessage); // Send WhatsApp message
router.get('/trending-skills', getTrendingSkills); // Get trending skills
router.post('/mass-email', sendMassEmail); // Send mass email
router.get('/seekers', searchSeekers); // Search seekers
router.post('/upload-excel', upload.single('file'), uploadExcel); // Upload Excel file
router.post('/delete-seeker', deleteSeeker); // Delete a seeker
router.post('/delete-job', deleteJob); // Delete a job (old endpoint)
router.post('/save-search', saveSearch); // Save a search
router.post('/apply', applyToJob); // Apply to a job (old endpoint)
router.get('/applicants/:providerId', getApplicants); // Get applicants for provider (old endpoint)

// Updated routes for mobile app compatibility
router.get('/posted', async (req, res) => { // GET /api/jobs/posted - Fetch provider's posted jobs
  try {
    const jobs = await searchJobs({ postedBy: req.user?._id }); // Assuming user ID from auth middleware or params later
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posted jobs', error: error.message });
  }
});

router.post('/delete', deleteJob); // POST /api/jobs/delete - Alias for delete-job

router.post('/apply-job', applyToJob); // POST /api/jobs/apply-job - Alias for apply

router.get('/applicants', getApplicants); // GET /api/jobs/applicants - Fetch applicants with jobId filter

module.exports = router; // Export router