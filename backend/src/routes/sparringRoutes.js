const express = require('express');
const router = express.Router();
const sparringController = require('../controllers/sparringController');

router.post('/create', sparringController.createRoom);
router.post('/join', sparringController.joinRoom);
router.post('/sync', sparringController.syncCode);
router.post('/submit', sparringController.submitSync);

module.exports = router;
