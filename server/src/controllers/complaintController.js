const Complaint = require('../models/Complaint');

// ── Helper: format doc for JSON response ──────────────────────────────────────
const fmt = (doc) => {
    const o = doc.toObject();
    o.id = o._id.toString();
    delete o._id;
    delete o.__v;
    // Normalize the populated assignedTo sub-document
    if (o.assignedTo && typeof o.assignedTo === 'object' && o.assignedTo._id) {
        o.assignedTo = {
            id:   o.assignedTo._id.toString(),
            name: o.assignedTo.name,
            role: o.assignedTo.role,
        };
    }
    return o;
};

// @desc    Get complaints (role-scoped, filterable, searchable, paginated)
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
    try {
        const { status, category, priority, page = 1, limit = 20, search } = req.query;

        const query = {};

        // ── Role-based scoping ─────────────────────────────────────────────────
        if (req.user.role === 'student')     query.user       = req.user.id;
        if (req.user.role === 'maintenance') query.assignedTo = req.user.id; // Security: only see assigned

        // ── Filters ───────────────────────────────────────────────────────────
        if (status   && ['open', 'in-progress', 'resolved'].includes(status))                              query.status   = status;
        if (category && ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'].includes(category)) query.category = category;
        if (priority && ['low', 'medium', 'high'].includes(priority))                                     query.priority = priority;

        // ── Text search (title, description, student name) ────────────────────
        if (search && search.trim()) {
            query.$or = [
                { title:       { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } },
                { studentName: { $regex: search.trim(), $options: 'i' } },
            ];
        }

        const pageNum  = Number(page);
        const limitNum = Number(limit);
        const skip     = (pageNum - 1) * limitNum;
        const total    = await Complaint.countDocuments(query);
        const pages    = Math.ceil(total / limitNum) || 1;

        const complaints = await Complaint.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('assignedTo', 'name role')
            .select('-__v');

        res.json({
            complaints: complaints.map(fmt),
            pagination: {
                page:        pageNum,
                limit:       limitNum,
                total,
                pages,
                hasNextPage: pageNum < pages,
                hasPrevPage: pageNum > 1,
            },
        });
    } catch (error) {
        console.error('[getComplaints]', error);
        res.status(500).json({ error: 'Failed to retrieve complaints.' });
    }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('assignedTo', 'name role')
            .select('-__v');

        if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

        // IDOR: students can only view their own
        if (req.user.role === 'student' && complaint.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        // Maintenance: can only view assigned complaints
        if (req.user.role === 'maintenance' && complaint.assignedTo?.id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        res.json(fmt(complaint));
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ error: 'Complaint not found.' });
        console.error('[getComplaint]', error);
        res.status(500).json({ error: 'Failed to retrieve complaint.' });
    }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res) => {
    try {
        const { category, title, description, priority, images } = req.body;

        const VALID_CATEGORIES = ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'];
        const VALID_PRIORITIES = ['low', 'medium', 'high'];

        if (!category || !VALID_CATEGORIES.includes(category))
            return res.status(400).json({ error: 'Invalid or missing category.' });
        if (!title || typeof title !== 'string' || title.trim().length < 3)
            return res.status(400).json({ error: 'Title must be at least 3 characters.' });
        if (!description || typeof description !== 'string' || description.trim().length < 10)
            return res.status(400).json({ error: 'Description must be at least 10 characters.' });
        if (priority && !VALID_PRIORITIES.includes(priority))
            return res.status(400).json({ error: 'Invalid priority value.' });

        const complaint = await Complaint.create({
            user:        req.user.id,
            studentName: req.user.name,
            roomNumber:  req.user.roomNumber || 'N/A',
            category,
            title:       title.trim(),
            description: description.trim(),
            priority:    priority || 'medium',
            status:      'open',
            images:      Array.isArray(images) ? images : [],
        });

        res.status(201).json(fmt(complaint));
    } catch (error) {
        console.error('[createComplaint]', error);
        res.status(500).json({ error: 'Failed to create complaint.' });
    }
};

// @desc    Update a complaint
// @route   PATCH /api/complaints/:id
// @access  Private
exports.updateComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

        const isOwner = complaint.user.toString() === req.user.id;
        const isStaff = ['admin', 'warden', 'maintenance'].includes(req.user.role);

        if (!isOwner && !isStaff) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const STUDENT_ALLOWED = ['title', 'description'];
        const STAFF_ALLOWED   = ['status', 'priority', 'title', 'description', 'assignedTo'];
        const allowed         = isStaff ? STAFF_ALLOWED : STUDENT_ALLOWED;

        const VALID_STATUSES   = ['open', 'in-progress', 'resolved'];
        const VALID_PRIORITIES = ['low', 'medium', 'high'];

        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'status'   && !VALID_STATUSES.includes(req.body[field]))   return;
                if (field === 'priority' && !VALID_PRIORITIES.includes(req.body[field])) return;
                complaint[field] = req.body[field];
            }
        });

        const updated = await complaint.save();
        res.json(fmt(updated));
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ error: 'Complaint not found.' });
        console.error('[updateComplaint]', error);
        res.status(500).json({ error: 'Failed to update complaint.' });
    }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private
exports.deleteComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

        const isOwner = complaint.user.toString() === req.user.id;
        const isAdmin = ['admin', 'warden'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        await complaint.deleteOne();
        res.json({ success: true });
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ error: 'Complaint not found.' });
        console.error('[deleteComplaint]', error);
        res.status(500).json({ error: 'Failed to delete complaint.' });
    }
};

// @desc    Get stats (scoped)
// @route   GET /api/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const matchQuery = req.user.role === 'student' ? { user: req.user._id } : {};

        const [statusAgg, categoryAgg] = await Promise.all([
            Complaint.aggregate([{ $match: matchQuery }, { $group: { _id: '$status',   count: { $sum: 1 } } }]),
            Complaint.aggregate([{ $match: matchQuery }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
        ]);

        const byStatus   = { open: 0, 'in-progress': 0, resolved: 0 };
        const byCategory = {};

        statusAgg.forEach(s  => { byStatus[s._id]   = s.count; });
        categoryAgg.forEach(c => { byCategory[c._id] = c.count; });

        const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
        res.json({ total, byStatus, byCategory });
    } catch (error) {
        console.error('[getStats]', error);
        res.status(500).json({ error: 'Failed to retrieve stats.' });
    }
};
