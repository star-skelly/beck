const express = require('express');
const router = express.Router();

const {
    authenticate,
    factoryReset,
    read,
    leaveGame,
    joinGame,
} = require('../controllers/profileController');

router.post('/authenticate', authenticate);
router.post('/factoryReset', factoryReset);
router.post('/read', read);
router.post('/leaveGame', leaveGame);
router.post('/joinGame', joinGame);

module.exports = router;