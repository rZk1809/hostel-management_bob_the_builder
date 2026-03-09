const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, toggleUserStatus, getAnalytics } = require('../controllers/adminController');
const { protect, admin, warden } = require('../middlewares/authMiddleware');

// All admin routes require authentication
router.use(protect);

// Analytics (warden and admin can see)
router.get('/analytics', warden, getAnalytics);

// User management (admin only)
router.get('/users', admin, getAllUsers);
router.get('/users/:id', admin, getUserById);
router.patch('/users/:id/role', admin, updateUserRole);
router.patch('/users/:id/status', admin, toggleUserStatus);

module.exports = router;
