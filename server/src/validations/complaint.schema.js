const { z } = require('zod');

exports.createComplaintSchema = {
    body: z.object({
        category: z.enum(['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'], { errorMap: () => ({ message: 'Invalid category' }) }),
        title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
        description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description is too long'),
        priority: z.enum(['low', 'medium', 'high'], { errorMap: () => ({ message: 'Invalid priority' }) }).optional(),
        images: z.array(z.string()).optional(),
    }),
};

exports.updateComplaintSchema = {
    body: z.object({
        status: z.enum(['open', 'in-progress', 'resolved']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
    }),
    params: z.object({
        id: z.string().length(24, 'Invalid complaint ID'),
    }),
};

exports.assignComplaintSchema = {
    body: z.object({
        assignedTo: z.string().length(24, 'Invalid user ID').nullable().optional(),
    }),
    params: z.object({
        id: z.string().length(24, 'Invalid complaint ID'),
    }),
};
