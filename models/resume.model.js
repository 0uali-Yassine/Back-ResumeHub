const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const resumeSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        default: '', // Default empty image if none provided
    },
    description: {
        type: String,
        required: true,
    },
    experience: {
        type: [String],
        default: [],
    },
    education: {
        type: [String],
        default: [],
    },
    skills: {
        type: [String],
        default: [],
    },
    date: {
        type: String,
        default: () => new Date().toLocaleString(),
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdOn: {
        type: Date,
        default: () => new Date(),
    }
});

module.exports = mongoose.model('Resume', resumeSchema);
