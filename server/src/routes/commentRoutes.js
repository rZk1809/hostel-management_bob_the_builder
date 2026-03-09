const express = require('express');
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // All comment routes require auth

router.route('/:complaintId')
    .post(addComment)
    .get(getComments);

module.exports = router;
