const express = require('express');
const router = express.Router();

const {
    getTrack,
    getProgress,
} = require('../controllers/spotifyController');

router.post('/getTrack', getTrack);
router.post('/getProgress', getProgress);

module.exports = router;