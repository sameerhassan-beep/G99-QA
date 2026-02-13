const express = require('express');
const router = express.Router();
const screenshotController = require('../controllers/screenshotController');

router.get('/capture', screenshotController.captureScreenshot);

module.exports = router;
