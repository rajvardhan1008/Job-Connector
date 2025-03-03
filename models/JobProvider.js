// models/JobProvider.js
const mongoose = require('mongoose');

const jobProviderSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  hrName: { type: String, required: true },
  hrWhatsappNumber: { type: String, unique: true },
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('JobProvider', jobProviderSchema);
