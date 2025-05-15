// routes/schools.js
const express = require('express');
const School = require('../models/School');
const router = express.Router();

// Get all schools
router.get('/', async (req, res) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get schools near location
router.get('/nearby', async (req, res) => {
  const { lng, lat, maxDistance = 10000 } = req.query;
  
  try {
    const schools = await School.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;