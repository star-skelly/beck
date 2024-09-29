const express = require('express');
const router = express.Router();

const {
    create,
    read,
    remove,
    move,
    factoryReset,
} = require('../controllers/gameController');

router.post('/create', create);
router.post('/read', read);
router.post('/remove', remove);
router.post('/move', move);
router.post('/factoryReset', factoryReset);

module.exports = router;