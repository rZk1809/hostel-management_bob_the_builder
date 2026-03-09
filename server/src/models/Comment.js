const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        complaint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint',
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: [1, 'Comment cannot be empty'],
            maxlength: [1000, 'Comment too long'],
        },
    },
    { timestamps: true }
);

commentSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('Comment', commentSchema);
