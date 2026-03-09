const { z } = require('zod');

exports.registerSchema = {
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        roomNumber: z.string().optional(),
        // Role is stripped/handled by the controller/middleware, but we can accept it if needed
        role: z.enum(['student', 'warden', 'maintenance', 'admin']).optional(),
    }),
};

exports.loginSchema = {
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
};
