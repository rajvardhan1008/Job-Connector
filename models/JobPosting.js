// O:\JobConnector\backend\models\JobPosting.js
const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  skillType: { type: String },
  skills: [String],
  experienceRequired: { type: String },
  location: { type: String },
  maxCTC: { type: String },
  noticePeriod: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'JobProvider' },
  applicants: [{ seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobSeeker' } }],
}, { timestamps: true });

module.exports = mongoose.model('JobPosting', jobPostingSchema);