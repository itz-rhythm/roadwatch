const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');

router.get('/citizens', leaderboardController.getCitizenLeaderboard);
router.get('/wards', leaderboardController.getWardLeaderboard);

module.exports = router;
