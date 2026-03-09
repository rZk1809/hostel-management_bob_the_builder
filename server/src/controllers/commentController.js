const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint');

// @desc    Add a comment to a complaint
// @route   POST /api/comments/:complaintId
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        // Role-based access control for comments
        // Students can only comment on their own complaints.
        if (req.user.role === 'student' && complaint.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to comment on this complaint' });
        }

        // Maintenance can only comment on assigned complaints
        if (req.user.role === 'maintenance' && (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user.id)) {
            return res.status(403).json({ error: 'Not authorized: You are not assigned to this complaint' });
        }

        const comment = await Comment.create({
            complaint: complaintId,
            user: req.user.id,
            message,
        });

        const populatedComment = await comment.populate('user', 'name role');
        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get comments for a complaint
// @route   GET /api/comments/:complaintId
// @access  Private
exports.getComments = async (req, res) => {
    try {
        const { complaintId } = req.params;

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

        if (req.user.role === 'student' && complaint.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view these comments' });
        }

        if (req.user.role === 'maintenance' && (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user.id)) {
            return res.status(403).json({ error: 'Not authorized to view these comments' });
        }

        const comments = await Comment.find({ complaint: complaintId })
            .populate('user', 'name role avatar')
            .sort({ createdAt: 1 }); // Oldest first (chronological order)

        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
