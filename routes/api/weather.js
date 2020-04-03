const express = require('express');
const router = express.Router();
const weatherService = require('../../services/darksky');

// Get All Switched Devices
router.get('/', (req, res) => {
    var weather = weatherService.getCurrentData();
    if (weather) {
        res.status(200).json(weather);
    } else {
        res.status(400).json({error: 'No weather data'});
    }
});

module.exports = router;