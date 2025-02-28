const express = require('express'); // Express framework
const mongoose = require('mongoose'); // MongoDB ORM
const cors = require('cors'); // Enable CORS for frontend
const dotenv = require('dotenv'); // Load environment variables
const multer = require('multer'); // File upload middleware

dotenv.config(); // Load .env file

const app = express(); // Initialize Express app
const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Allow cross-origin requests

// Use MongoDB connection from environment variable
const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
  res.send('Job Connector Backend is running'); // Simple health check
});

// Import and mount routes
const authRoutes = require('./routes/authRoutes'); // Authentication routes
const profileRoutes = require('./routes/profileRoutes'); // Profile routes
const jobRoutes = require('./routes/jobRoutes'); // Job routes

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);

const PORT = process.env.PORT || 5000; // Use env port or default to 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
