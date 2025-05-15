// models/School.js
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // continuation, adult, etc.
  address: { type: String, required: true },
  phone: String,
  email: String,
  programs: [String],
  rules: [String], //HUGE THING BTW, IMPORTANT SHIT HERE :P
  enrollmentRequirements: [String],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  languageSupport: [String]
});

SchoolSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('School', SchoolSchema);