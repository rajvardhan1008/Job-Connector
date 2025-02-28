// O:\JobConnector\backend\controllers\jobController.js
const JobPosting = require('../models/JobPosting');
const JobSeeker = require('../models/JobSeeker');
const JobProvider = require('../models/JobProvider');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'rajvardhant563@gmail.com', pass: 'woyo svyv bzux xyjq' },
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

    job.applicants = job.applicants || [];
    if (!job.applicants.some(app => app.seekerId.toString() === seekerId)) {
      job.applicants.push({ seekerId });
      await job.save();
    }

    seeker.appliedJobs = seeker.appliedJobs || [];
    if (!seeker.appliedJobs.some(app => app.jobId.toString() === jobId)) {
      seeker.appliedJobs.push({ jobId, title: job.jobTitle, status: 'Applied' });
      await seeker.save();
    }

    res.json({ message: 'Applied successfully' });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ message: 'Error applying to job' });
  }
};

exports.getApplicants = async (req, res) => {
  const { providerId, jobId } = req.params.providerId ? req.params : req.query; // Support both old and new endpoints
  try {
    const query = jobId ? { _id: jobId } : { postedBy: providerId };
    const jobs = await JobPosting.find(query).populate('applicants.seekerId', 'fullName email whatsappNumber skills experience location resume');
    const applicants = jobs.flatMap(job => 
      job.applicants.map(seeker => ({
        _id: seeker._id,
        jobId: job._id,
        jobTitle: job.jobTitle,
        seeker: seeker.seekerId,
      }))
    );
    res.json(applicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ message: 'Error fetching applicants' });
  }
};

exports.saveSearch = async (req, res) => {
  res.json({ message: 'Search saved (placeholder)' }); // Placeholder as per mobile app needs
};

exports.sendWhatsAppMessage = async (req, res) => {
  res.json({ message: 'WhatsApp message sent (placeholder)' }); // Placeholder—Twilio not fully implemented
};

exports.getTrendingSkills = async (req, res) => {
  try {
    const skillsAgg = await JobPosting.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json(skillsAgg.map(skill => skill._id));
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
          from: 'rajvardhant563@gmail.com',
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
  const { skills } = req.query;

  try {
    const query = skills ? { skills: { $in: skills.split(',') } } : {};
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
    const { type } = req.body;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (type === 'seekers') {
      const seekers = data.map(row => ({
        fullName: row.fullName || 'Unnamed Seeker',
        whatsappNumber: row.whatsappNumber,
        email: row.email,
        skillType: row.skillType,
        skills: row.skills ? row.skills.split(',') : [],
        experience: row.experience ? Number(row.experience) : 0,
        location: row.location,
        currentCTC: row.currentCTC ? Number(row.currentCTC) : null,
        expectedCTC: row.expectedCTC ? Number(row.expectedCTC) : null,
        noticePeriod: row.noticePeriod,
        lastWorkingDate: row.lastWorkingDate ? new Date(row.lastWorkingDate) : null,
        resume: row.resume,
        bio: row.bio,
      }));
      const result = await JobSeeker.insertMany(seekers, { ordered: false });
      res.json({ message: 'Seekers uploaded successfully', seekersCount: result.length });
    } else if (type === 'jobs') {
      const jobs = data.map(row => ({
        jobTitle: row.jobTitle || 'Unnamed Job',
        skillType: row.skillType,
        skills: row.skills ? row.skills.split(',') : [],
        experienceRequired: row.experienceRequired ? Number(row.experienceRequired) : 0,
        location: row.location,
        maxCTC: row.maxCTC ? Number(row.maxCTC) : null,
        noticePeriod: row.noticePeriod,
        postedBy: row.postedBy || null,
      }));
      const result = await JobPosting.insertMany(jobs, { ordered: false });
      res.json({ message: 'Jobs uploaded successfully', jobsCount: result.length });
    } else {
      res.status(400).json({ message: 'Invalid type specified' });
    }
  } catch (error) {
    console.error('Error uploading Excel:', error);
    res.status(500).json({ message: 'Error uploading Excel' });
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