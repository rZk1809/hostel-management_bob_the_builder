const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect: require a valid JWT ──────────────────────────────────────────────
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        // JWT_SECRET guaranteed to be set at startup
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ error: 'Not authorized. User no longer exists.' });
        }
        next();
    } catch (err) {
        // Distinguish between expired vs. invalid — helpful for the frontend to trigger logout
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ error: 'Not authorized. Invalid token.' });
    }
};

// ── Role guards ───────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authorized.' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            error: `Access denied. Required role: ${roles.join(' or ')}.`,
        });
    }
    next();
};

// Convenience wrappers
const admin = requireRole('admin');
const warden = requireRole('admin', 'warden');
const staff = requireRole('admin', 'warden', 'maintenance');

module.exports = { protect, requireRole, admin, warden, staff };
