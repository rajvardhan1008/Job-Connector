// models/JobPosting.js
const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  skillType: { type: String, enum: ['IT', 'Non-IT'], required: true },
  skills: { type: [String], required: true },
  experienceRequired: { type: Number, required: true },
  location: { type: String, required: true },
  maxCTC: { type: Number, required: true },
  noticePeriod: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'JobProvider', required: true },
  createdAt: { type: Date, default: Date.now },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobSeeker' }],
});

module.exports = mongoose.model('JobPosting', jobPostingSchema);
