const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserRole } = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { registerSchema, loginSchema } = require('../validations/auth.schema');

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.get('/profile', protect, getUserProfile);

// Admin-only: assign roles to any user
router.patch('/users/:id/role', protect, admin, updateUserRole);

module.exports = router;
