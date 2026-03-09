const Complaint = require('../models/Complaint');

// @desc    Assign a complaint to a maintenance staff member
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin, Warden)
exports.assignComplaint = async (req, res) => {
    try {
        const { assignedTo } = req.body;

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

        // Verify the assignee exists and is maintenance/warden staff
        const User = require('../models/User');
        if (assignedTo) {
            const assignee = await User.findById(assignedTo).select('name role');
            if (!assignee) return res.status(404).json({ error: 'Assigned user not found.' });
            if (!['maintenance', 'warden', 'admin'].includes(assignee.role)) {
                return res.status(400).json({ error: 'Complaints can only be assigned to maintenance staff or wardens.' });
            }
            complaint.assignedTo = assignedTo;
            complaint.status = 'in-progress'; // Auto-advance status on assignment
        } else {
            complaint.assignedTo = null; // Unassign
        }

        const updated = await complaint.save();
        res.json(updated);
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ error: 'Invalid ID.' });
        console.error('[assignComplaint]', error);
        res.status(500).json({ error: 'Failed to assign complaint.' });
    }
};
