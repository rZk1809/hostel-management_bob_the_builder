const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/complaintController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getStats);

module.exports = router;
