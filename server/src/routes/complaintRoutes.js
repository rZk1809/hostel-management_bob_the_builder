const express = require('express');
const router = express.Router();
const {
    getComplaints, getComplaint,
    createComplaint, updateComplaint, deleteComplaint,
} = require('../controllers/complaintController');
const { assignComplaint } = require('../controllers/assignmentController');
const { protect, warden } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { createComplaintSchema, updateComplaintSchema, assignComplaintSchema } = require('../validations/complaint.schema');

router.use(protect);

router.route('/')
    .get(getComplaints)
    .post(validateRequest(createComplaintSchema), createComplaint);

router.route('/:id')
    .get(getComplaint)
    .patch(validateRequest(updateComplaintSchema), updateComplaint)
    .delete(deleteComplaint);

// Assignment: only warden and admin can assign
router.patch('/:id/assign', warden, validateRequest(assignComplaintSchema), assignComplaint);

module.exports = router;
