const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    studentName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    roomNumber: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
    },
    category: {
        type: String,
        enum: ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 2000,
    },
    images: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
    toJSON: {
        // Automatically rename _id → id in all JSON responses
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});

// ── Indexes for query performance ─────────────────────────────────────────────
complaintSchema.index({ user: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
