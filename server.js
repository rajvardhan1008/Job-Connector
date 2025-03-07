// O:\JobConnector\backend\server.js
const express = require('express'); // Express framework
const mongoose = require('mongoose'); // MongoDB ORM
const cors = require('cors'); // Enable CORS for frontend
const dotenv = require('dotenv'); // Load environment variables
const multer = require('multer'); // File upload middleware
const uploadResume = require('./resumeUpload'); 

dotenv.config(); // Load .env file

const app = express(); // Initialize Express app
const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Allow cross-origin requests

// MongoDB connection using provided URI
mongoose.connect('mongodb+srv://balmukundoptico:lets12help@job-connector.exb7v.mongodb.net', {
  useNewUrlParser: true, // Use new URL parser
  useUnifiedTopology: true, // Use new topology engine
})
  .then(() => console.log('MongoDB connected')) // Log success
  .catch((err) => console.log('MongoDB connection error:', err)); // Log errors

// Root route
app.get('/', (req, res) => {
  res.send('Job Connector Backend is running'); // Simple health check
});

// Import and mount routes
const authRoutes = require('./routes/authRoutes'); // Authentication routes
const profileRoutes = require('./routes/profileRoutes'); // Profile routes
const jobRoutes = require('./routes/jobRoutes'); // Job routes

app.post('/api/upload/resume', uploadResume.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: req.file.path });
});

app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/profile', profileRoutes); // Mount profile routes
app.use('/api/jobs', jobRoutes); // Mount job routes


const PORT = process.env.PORT || 5000; // Use env port or default to 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); // Log server start
});
