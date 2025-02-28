// O:\JobConnector\backend\controllers\profileController.js
const JobSeeker = require('../models/JobSeeker');
const JobProvider = require('../models/JobProvider');

exports.updateSeekerProfile = async (req, res) => {
  const { _id, fullName, whatsappNumber, email, skills, experience, location } = req.body;
  try {
    const updateData = {
      fullName,
      whatsappNumber,
      email,
      skills: skills ? skills.split(',') : undefined,
      experience: experience ? Number(experience) : undefined,
      location,
    };
    if (req.file) updateData.resume = req.file.path; // Store file path (adjust for cloud storage if needed)
    const seeker = await JobSeeker.findByIdAndUpdate(_id, updateData, { new: true });
    if (!seeker) return res.status(404).json({ message: 'Seeker not found' });
    res.json({ message: 'Seeker profile updated successfully', user: seeker });
  } catch (error) {
    console.error('Error updating seeker profile:', error);
    res.status(500).json({ message: 'Error updating seeker profile' });
  }
};

exports.updateProviderProfile = async (req, res) => {
  const { _id, companyName, hrName, hrWhatsappNumber, email } = req.body;
  try {
    const provider = await JobProvider.findByIdAndUpdate(
      _id,
      { companyName, hrName, hrWhatsappNumber, email },
      { new: true }
    );
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    res.json({ message: 'Provider profile updated successfully', user: provider });
  } catch (error) {
    console.error('Error updating provider profile:', error);
    res.status(500).json({ message: 'Error updating provider profile' });
  }
};

exports.createSeekerProfile = async (req, res) => {
  const {
    fullName, whatsappNumber, email, skillType, skills, experience, location,
    currentCTC, expectedCTC, noticePeriod, lastWorkingDate, resume, bio
  } = req.body;

  try {
    let seeker = await JobSeeker.findOne({ $or: [{ whatsappNumber }, { email }] });
    if (seeker) {
      return res.status(400).json({ message: 'User already exists. Please login.' });
    }

    seeker = new JobSeeker({
      fullName,
      whatsappNumber,
      email,
      skillType,
      skills: skills ? skills.split(',') : [],
      experience: experience ? Number(experience) : 0,
      location,
      currentCTC: currentCTC ? Number(currentCTC) : null,
      expectedCTC: expectedCTC ? Number(expectedCTC) : null,
      noticePeriod,
      lastWorkingDate,
      resume,
      bio
    });

    await seeker.save();
    res.json({ message: 'Profile created successfully', user: seeker });
  } catch (error) {
    console.error('Error creating seeker profile:', error);
    res.status(500).json({ message: 'Error creating profile' });
  }
};

exports.createProviderProfile = async (req, res) => {
  const { companyName, hrName, hrWhatsappNumber, email } = req.body;

  try {
    let provider = await JobProvider.findOne({ $or: [{ hrWhatsappNumber }, { email }] });
    if (provider) {
      return res.status(400).json({ message: 'Provider already exists. Please login.' });
    }

    provider = new JobProvider({ companyName, hrName, hrWhatsappNumber, email });
    await provider.save();
    res.json({ message: 'Profile created successfully', user: provider });
  } catch (error) {
    console.error('Error creating provider profile:', error);
    res.status(500).json({ message: 'Error creating profile' });
  }
};

exports.getProfile = async (req, res) => {
  const { role, whatsappNumber, email } = req.query;

  try {
    let user;
    if (role === 'seeker') {
      user = await JobSeeker.findOne({ $or: [{ whatsappNumber }, { email }] });
    } else if (role === 'provider') {
      user = await JobProvider.findOne({ $or: [{ hrWhatsappNumber: whatsappNumber }, { email }] });
    } else if (role === 'admin') {
      user = await Admin.findOne({ $or: [{ whatsappNumber }, { email }] });
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};