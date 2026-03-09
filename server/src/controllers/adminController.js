const User = require('../models/User');
const Complaint = require('../models/Complaint');

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 50 } = req.query;
        const query = {};
        if (role) query.role = role;
        if (search && search.trim()) {
            query.$or = [
                { name:  { $regex: search.trim(), $options: 'i' } },
                { email: { $regex: search.trim(), $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            users,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        console.error('[getAllUsers]', error);
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
};

// @desc    Get a single user (admin only)
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ error: 'User not found.' });
        console.error('[getUserById]', error);
        res.status(500).json({ error: 'Failed to retrieve user.' });
    }
};

// @desc    Update a user's role (admin only)
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const VALID_ROLES = ['student', 'warden', 'admin', 'maintenance'];
        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({ error: `Role must be one of: ${VALID_ROLES.join(', ')}.` });
        }
        // Prevent an admin from demoting themselves accidentally
        if (req.params.id === req.user.id.toString()) {
            return res.status(400).json({ error: 'You cannot change your own role.' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, select: '-password' }
        );
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: `Role updated to '${role}' for ${user.name}.`, user });
    } catch (error) {
        console.error('[updateUserRole]', error);
        res.status(500).json({ error: 'Failed to update role.' });
    }
};

// @desc    Deactivate / reactivate a user account (admin only)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
    try {
        if (req.params.id === req.user.id.toString()) {
            return res.status(400).json({ error: 'You cannot change your own account status.' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        user.isActive = !user.isActive;
        await user.save();
        res.json({ message: `Account ${user.isActive ? 'activated' : 'deactivated'} for ${user.name}.`, isActive: user.isActive });
    } catch (error) {
        console.error('[toggleUserStatus]', error);
        res.status(500).json({ error: 'Failed to update user status.' });
    }
};

// @desc    Get advanced analytics (admin/warden)
// @route   GET /api/admin/analytics
// @access  Private (Admin, Warden)
exports.getAnalytics = async (req, res) => {
    try {
        const [
            totalComplaints,
            statusBreakdown,
            categoryBreakdown,
            priorityBreakdown,
            recentActivity,
            totalUsers,
            usersByRole,
        ] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
            Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
            // Last 7 days daily complaint count
            Complaint.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            User.countDocuments(),
            User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        ]);

        const toMap = (arr) => arr.reduce((acc, { _id, count }) => { acc[_id] = count; return acc; }, {});

        res.json({
            complaints: {
                total: totalComplaints,
                byStatus: toMap(statusBreakdown),
                byCategory: toMap(categoryBreakdown),
                byPriority: toMap(priorityBreakdown),
                last7Days: recentActivity,
            },
            users: {
                total: totalUsers,
                byRole: toMap(usersByRole),
            },
        });
    } catch (error) {
        console.error('[getAnalytics]', error);
        res.status(500).json({ error: 'Failed to retrieve analytics.' });
    }
};
