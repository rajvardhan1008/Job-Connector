// backend/controllers/jobController.js
const JobPosting = require('../models/JobPosting');
const JobSeeker = require('../models/JobSeeker');
const JobProvider = require('../models/JobProvider');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Search = require('../models/Search'); // New model
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.postJob = async (req, res) => {
  const {
    jobTitle, skillType, skills, experienceRequired, location, maxCTC, noticePeriod, postedBy
  } = req.body;

  try {
    const job = new JobPosting({
      jobTitle,
      skillType,
      skills: skills.split(','),
      experienceRequired: Number(experienceRequired),
      location,
      maxCTC: Number(maxCTC),
      noticePeriod,
      postedBy,
    });
    await job.save();
    res.json({ message: 'Job posted successfully', job });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ message: 'Error posting job' });
  }
};

exports.searchJobs = async (req, res) => {
  const { skills, experience, location, minCTC, maxCTC, noticePeriod, filters } = req.query;

  try {
    const query = {};
    if (skills) query.skills = { $in: skills.split(',') };
    if (experience) query.experienceRequired = { $lte: Number(experience) };
    if (location) query.location = new RegExp(location, 'i');
    if (minCTC) query.maxCTC = { $gte: Number(minCTC) };
    if (maxCTC) query.maxCTC = { $lte: Number(maxCTC) };
    if (noticePeriod) query.noticePeriod = new RegExp(noticePeriod, 'i');
    if (filters) {
      const filterArr = filters.split(',');
      if (filterArr.includes('viewed')) query.viewed = true;
      if (filterArr.includes('new')) query.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const jobs = await JobPosting.find(query).populate('postedBy', 'companyName hrName hrWhatsappNumber');
    res.json(jobs);
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ message: 'Error searching jobs' });
  }
};

exports.applyToJob = async (req, res) => {
  const { seekerId, jobId } = req.body;
  try {
    const job = await JobPosting.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const seeker = await JobSeeker.findById(seekerId);
    if (!seeker) return res.status(404).json({ message: 'Seeker not found' });

    // Update job with applicant
    job.applicants = job.applicants || [];
    if (!job.applicants.includes(seekerId)) {
      job.applicants.push(seekerId);
      await job.save()
    }

    // Update seeker with applied job
    seeker.appliedJobs = seeker.appliedJobs || [];
    if (!seeker.appliedJobs.some(app => app.jobId.toString() === jobId)) {
      seeker.appliedJobs.push({ jobId, status: 'Applied' });
      await seeker.save();
    }

    res.json({ message: 'Applied successfully' });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ message: 'Error applying to job' });
  }
};

exports.getApplicants = async (req, res) => {
  const providerId = req.params.providerId;
  try {
    const jobs = await JobPosting.find({ postedBy: providerId }).populate('applicants', 'fullName email whatsappNumber skills experience location');
    const applicants = jobs.flatMap(job => 
      job.applicants.map(seeker => ({
        jobTitle: job.jobTitle,
        seeker,
      }))
    );
    res.json(applicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ message: 'Error fetching applicants' });
  }
};

exports.saveSearch = async (req, res) => {
  const { userId, role, searchCriteria } = req.body;
  try {
    const search = new Search({ userId, role, searchCriteria });
    const savedSearch = await search.save();
    console.log('Saved search:', savedSearch); // Debug log
    res.json({ message: 'Search saved successfully', data: savedSearch });
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({ message: 'Error saving search' });
  }
};

exports.sendWhatsAppMessage = async (req, res) => {
  const { seekerWhatsApp, providerWhatsApp, jobTitle, resumeUrl } = req.body;

  try {
    const message = `I have applied for the "${jobTitle}" post via Job Connector. Here’s my resume: ${resumeUrl || 'N/A'}`;
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `whatsapp:'91' + ${providerWhatsApp}`,
    });
    res.json({ message: 'WhatsApp message sent successfully' });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ message: 'Error sending WhatsApp message' });
  }
};

exports.getTrendingSkills = async (req, res) => {
  try {
    const skillsAgg = await JobPosting.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json(skillsAgg.map(skill => ({ skill: skill._id, count: skill.count })));
  } catch (error) {
    console.error('Error fetching trending skills:', error);
    res.status(500).json({ message: 'Error fetching trending skills' });
  }
};

exports.sendMassEmail = async (req, res) => {
  const { seekerIds, subject, body } = req.body;

  try {
    const seekers = await JobSeeker.find({ _id: { $in: seekerIds } });
    const emailPromises = seekers.map(seeker => {
      if (seeker.email) {
        return transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: seeker.email,
          subject,
          text: body,
        });
      }
      return Promise.resolve();
    });

    await Promise.all(emailPromises);
    res.json({ message: 'Mass emails sent successfully' });
  } catch (error) {
    console.error('Error sending mass email:', error);
    res.status(500).json({ message: 'Error sending mass email' });
  }
};

exports.searchSeekers = async (req, res) => {
  const { skills, experience, location, minCTC, maxCTC, filters } = req.query;

  try {
    const query = {};
    if (skills) {
      const skillArray = skills.split(',').map(skill => new RegExp(skill.trim(), 'i'));
      query.skills = { $in: skillArray };
    }
    if (experience) query.experience = { $lte: Number(experience) };
    if (location) query.location = new RegExp(location, 'i');
    if (minCTC) query.currentCTC = { $gte: Number(minCTC) };
    if (maxCTC) query.expectedCTC = { $lte: Number(maxCTC) };
    if (filters) {
      const filterArr = filters.split(',');
      if (filterArr.includes('viewed')) query.viewed = true;
      if (filterArr.includes('new')) query.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const seekers = await JobSeeker.find(query);
    res.json(seekers);
  } catch (error) {
    console.error('Error searching seekers:', error);
    res.status(500).json({ message: 'Error searching seekers' });
  }
};

exports.uploadExcel = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log('Parsed Excel Data:', data);

    const type = req.body.type;
    if (type === 'seekers') {
      const seekers = data.map(row => ({
        fullName: row.fullName || row.FullName || 'Unnamed Seeker',
        whatsappNumber: row.whatsappNumber || row.WhatsappNumber,
        email: row.email || row.Email,
        skillType: row.skillType || row.SkillType,
        skills: row.skills || row.Skills ? (row.skills || row.Skills).split(',') : [],
        experience: row.experience || row.Experience ? Number(row.experience || row.Experience) : 0,
        location: row.location || row.Location,
        currentCTC: row.currentCTC || row.CurrentCTC ? Number(row.currentCTC || row.CurrentCTC) : null,
        expectedCTC: row.expectedCTC || row.ExpectedCTC ? Number(row.expectedCTC || row.ExpectedCTC) : null,
        noticePeriod: row.noticePeriod || row.NoticePeriod,
        lastWorkingDate: row.lastWorkingDate || row.LastWorkingDate ? new Date(row.lastWorkingDate || row.LastWorkingDate) : null,
        resume: row.resume || row.Resume,
        bio: row.bio || row.Bio,
      }));
      const result = await JobSeeker.insertMany(seekers, { ordered: false });
      res.json({ message: 'Seekers uploaded successfully', seekersCount: result.length });
    } else if (type === 'jobs') {
      const jobs = data.map(row => ({
        jobTitle: row.jobTitle || row.JobTitle || 'Unnamed Job',
        skillType: row.skillType || row.SkillType,
        skills: row.skills || row.Skills ? (row.skills || row.Skills).split(',') : [],
        experienceRequired: row.experienceRequired || row.ExperienceRequired ? Number(row.experienceRequired || row.ExperienceRequired) : 0,
        location: row.location || row.Location,
        maxCTC: row.maxCTC || row.MaxCTC ? Number(row.maxCTC || row.MaxCTC) : null,
        noticePeriod: row.noticePeriod || row.NoticePeriod,
        postedBy: row.postedBy || req.body.postedBy || null,
      }));
      const result = await JobPosting.insertMany(jobs, { ordered: false });
      res.json({ message: 'Jobs uploaded successfully', jobsCount: result.length });
    } else {
      return res.status(400).json({ message: 'Invalid type specified. Use "seekers" or "jobs"' });
    }
  } catch (error) {
    console.error('Error uploading Excel:', error);
    res.status(500).json({ message: 'Error uploading Excel: ' + error.message });
  }
};

exports.deleteSeeker = async (req, res) => {
  const { seekerId } = req.body;
  try {
    await JobSeeker.findByIdAndDelete(seekerId);
    res.json({ message: 'Seeker deleted successfully' });
  } catch (error) {
    console.error('Error deleting seeker:', error);
    res.status(500).json({ message: 'Error deleting seeker' });
  }
};

exports.deleteProvider = async (req, res) => {
  const { providerId } = req.body;
  try {
    await JobProvider.findByIdAndDelete(providerId);
    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ message: 'Error deleting provider' });
  }
};

exports.deleteJob = async (req, res) => {
  const { jobId } = req.body;
  try {
    await JobPosting.findByIdAndDelete(jobId);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job' });
  }
};

exports.getProfile = async (req, res) => {
  const { role, email, whatsappNumber, seekerId } = req.query;
  console.log('getProfile query:', req.query); // Debug log
  try {
    let user;
    if (seekerId) {
      user = await JobSeeker.findById(seekerId);
      console.log('Seeker found by ID:', user); // Debug log
      if (!user) return res.status(404).json({ message: 'Seeker not found by ID' });
    } else if (role === 'seeker') {
      user = await JobSeeker.findOne(email ? { email } : { whatsappNumber });
      console.log('Seeker found by email/whatsapp:', user); // Debug log
      if (!user) return res.status(404).json({ message: 'Seeker not found by email or WhatsApp' });
    } else if (role === 'provider') {
      user = await JobProvider.findOne(email ? { email } : { whatsappNumber });
      console.log('Provider found:', user); // Debug log
      if (!user) return res.status(404).json({ message: 'Provider not found' });
    } else {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};
