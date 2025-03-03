// backend/models/JobSeeker.js
const mongoose = require('mongoose');

const jobSeekerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  whatsappNumber: { type: String, unique: true },
  email: { type: String, unique: true },
  skillType: { type: String, enum: ['IT', 'Non-IT'] },
  skills: { type: [String] },
  experience: { type: Number },
  location: { type: String },
  currentCTC: { type: Number },
  expectedCTC: { type: Number },
  noticePeriod: { type: String },
  lastWorkingDate: { type: Date },
  resume: { type: String },
  bio: { type: String },
  createdAt: { type: Date, default: Date.now },
  viewed: { type: Boolean, default: false }, // New field for profile viewed
  appliedJobs: [{ jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting' }, status: String }],
});

module.exports = mongoose.model('JobSeeker', jobSeekerSchema);
