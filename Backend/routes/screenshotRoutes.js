const express = require('express');
const router = express.Router();
const screenshotController = require('../controllers/screenshotController');

router.get('/capture', screenshotController.captureScreenshot);
router.get('/content', screenshotController.getPageContent);

module.exports = router;
