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
    title: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: '',
    },
    address: {
        type: String,
        required: '',
    },
    phone: {
        type: String,
        required: '',
    },
    languages: {
        type: [String],
        required: '',
    },
    description: {
        type: String,
        required: true,
    },
    project: {
        type: [String],
        default: [],
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
