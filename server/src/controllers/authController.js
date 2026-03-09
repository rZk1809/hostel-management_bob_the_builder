const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ── Helper ────────────────────────────────────────────────────────────────────
const generateToken = (id) => {
    // JWT_SECRET is guaranteed to be set — app.js exits at startup if it isn't.
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ── Input validators (lightweight — no extra library needed) ──────────────────
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (pwd) => typeof pwd === 'string' && pwd.length >= 8;

// @desc    Register a new user (PUBLIC — role is always 'student'; admin assigns staff roles)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, roomNumber } = req.body;

        // — Input validation ————————————————————————————————————————
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ error: 'Please provide a valid full name.' });
        }
        if (!email || !validateEmail(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,   // hashed by the pre-save hook in User.js
            role: 'student', // SECURITY: role CANNOT be set via public registration
            roomNumber: roomNumber?.trim() || '',
        });

        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            roomNumber: user.roomNumber,
            token: generateToken(user._id),
        });
    } catch (error) {
        // Generic message — never expose Mongoose internals to the client
        console.error('[registerUser]', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};

// @desc    Authenticate user & return token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !validateEmail(email)) {
            return res.status(400).json({ error: 'Please provide a valid email.' });
        }
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ error: 'Please provide your password.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (user && (await user.matchPassword(password))) {
            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roomNumber: user.roomNumber,
                token: generateToken(user._id),
            });
        } else {
            // Identical error for wrong email OR wrong password — prevents user enumeration
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error('[loginUser]', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (error) {
        console.error('[getUserProfile]', error);
        res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
};

// @desc    Admin: update a user's role (admin only)
// @route   PATCH /api/auth/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const VALID_ROLES = ['student', 'warden', 'admin', 'maintenance'];
        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({ error: `Role must be one of: ${VALID_ROLES.join(', ')}.` });
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
