const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const requireUser = require('../middleware/requireUser');

router.post('/submit', requireUser, codeController.submitCode);
router.post('/hint', requireUser, codeController.generateHint);

module.exports = router;
