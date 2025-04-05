const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['manager', 'employer'], 
        default: 'employer'            
    }, 
    createdOn: {
        type: Date,
        default: () => new Date(),
    }
});

module.exports = mongoose.model('User', userSchema);