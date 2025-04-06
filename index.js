require("dotenv").config();

// Connect Server to MongoDB
const config = require("./config.json");
const mongoose = require('mongoose');

// !!
const userModel = require("./models/user.model");

mongoose.connect(config.connectionString)
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.error("Could not connect to MongoDB: ", err));


// Import required modules
const express = require('express');
const cors = require('cors');
const app = express();

// !!
const jwt = require('jsonwebtoken');
const { authenticateToken } = require("./utilities");


// Middleware
app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

app.get("/", (req, res) => {
    res.json({ data: "Server is running on port 8000" });
});

// craete a new user
app.post("/create-account", async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    const isUserExist = await userModel.findOne({ email });

    if (isUserExist) {
        return res.status(400).json({ error: true, message: "User already exists" });
    }
    //will automatically assign 'employer' as the role

    // role must be in form to know ho is the manager
    // role: {
    //     type: String,
    //     enum: ['manager', 'employer'], 
    //     default: 'employer'            
    // }, 
    // ({ fullName, email, password,role })
    const user = new userModel({ fullName, email, password });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    return res.status(201).json({
        error: false,
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
        },
        token,
        message: "User created successfully",
    });

    // try {
    //     const { fullName, email, password } = req.body;
    //     const User = require("./models/user.model");
    //     const user = new User({ fullName, email, password });
    //     await user.save();
    //     res.status(201).json({ message: "User created successfully" });
    // } catch (error) {
    //     res.status(500).json({ error: error.message });
    // }
});

// login user


app.listen(8000);

module.exports = app;