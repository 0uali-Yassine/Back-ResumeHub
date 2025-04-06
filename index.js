require("dotenv").config();
console.log("Access Token Secret:", process.env.ACCESS_TOKEN_SECRET);


// Connect Server to MongoDB
const config = require("./config.json");
const mongoose = require('mongoose');

// Import models
const userModel = require("./models/user.model");
const resumeModel = require("./models/resume.model");

mongoose.connect(config.connectionString)
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.error("Could not connect to MongoDB: ", err));


// Import required modules
const express = require('express');
const cors = require('cors');
const app = express();

// !!
const jwt = require('jsonwebtoken');
const  authenticateToken  = require("./utilities.js");


// Middleware
app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

// Routes

app.get("/", (req, res) => {
    res.json({ data: "Server is running on port 8000" });
});
 
// craete a new user
// app.post("/create-account", async (req, res) => {
//     const { fullName, email, password } = req.body;
//     if (!fullName || !email || !password) {
//         return res.status(400).json({ error: true, message: "All fields are required" });
//     }

//     const isUserExist = await userModel.findOne({ email });

//     if (isUserExist) {
//         return res.status(400).json({ error: true, message: "User already exists" });
//     }
//     //will automatically assign 'employer' as the role

//     // role must be in form to know ho is the manager
//     // role: {
//     //     type: String,
//     //     enum: ['manager', 'employer'], 
//     //     default: 'employer'            
//     // }, 
//     // ({ fullName, email, password,role })
//     const user = new userModel({ fullName, email, password });
//     await user.save();
//     const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
//     return res.status(201).json({
//         error: false,
//         user: {
//             id: user._id,
//             fullName: user.fullName,
//             email: user.email,
//         },
//         token,
//         message: "User created successfully",
//     });

//     // try {
//     //     const { fullName, email, password } = req.body;
//     //     const User = require("./models/user.model");
//     //     const user = new User({ fullName, email, password });
//     //     await user.save();
//     //     res.status(201).json({ message: "User created successfully" });
//     // } catch (error) {
//     //     res.status(500).json({ error: error.message });
//     // }
// });
app.post("/create-account", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
 
        // Log the request body to see what is  sent
        console.log("Request body:", req.body); 
        console.log("Full Name:", fullName);    
        console.log(req.body);

        if (!fullName || !email || !password) {
            return res.status(400).json({ error: true, message: "All fields are required" });
        }

        const isUserExist = await userModel.findOne({ email });
        if (isUserExist) {
            return res.status(400).json({ error: true, message: "User already exists" });
        }


        const user = new userModel({ fullName, email, password});
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

        return res.status(201).json({
            error: false,
            user,
            token,
            message: "User created successfully",
        });

    } catch (error) {
        console.error("Error creating user:", error); // Log the error
        return res.status(500).json({ error: true, message: "An error occurred while creating the user" });
    }
});


// login user
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: true, message: "The user not Exist!" });
    }

    if (user.password !== password) {
        return res.status(400).json({ error: true, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    return res.status(200).json({
        error: false,
        user,
        token,
        message: "Login successful",
    });
});

// add resume
app.post("/add-resume", authenticateToken, async (req, res) => {
    try {
        const { fullName, img, description, experience, education, skills } = req.body;
        const userId = req.user.id; // Get userId from the token

        if (!fullName || !description) {
            return res.status(400).json({ error: true, message: "All fields are required" });
        }

        const resume = new resumeModel({
            fullName,
            img,
            description,
            experience,
            education,
            skills,
            userId,
        });

        await resume.save();
        return res.status(201).json({
            error: false,
            message: "Resume created successfully",
        });
    } catch (error) {
        console.error("Error adding resume:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred while adding the resume",
            errorDetails: error.message,
        });
    }
});

// edit resume based on user role if manager= can edite every / employer = can edite only thier resume
app.put("/edit-resume/:resumeId", authenticateToken, async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { fullName, img, description, experience, education, skills } = req.body;

        if (!fullName || !description) {
            return res.status(400).json({ error: true, message: "All fields are required" });
        }

        // Build the update data object
        const updateData = {
            fullName,
            img,
            description,
            experience,
            education,
            skills,
        };

        // If the logged-in user is a manager, allow them to update any resume.
        // Otherwise, restrict the update to resumes that belong to the user.
        
        // const filter = req.user.role === 'manager'
        //     ? { _id: resumeId }
        //     : { _id: resumeId, userId: req.user.id };

            let filter;
            if (req.user.role === 'manager') {
                // managers delete any resume
                filter = { _id: resumeId };
            } else {
                // employer only delete their  resume
                filter = { _id: resumeId, userId: req.user.id };
            }

        const resume = await resumeModel.findOneAndUpdate(filter, updateData, { new: true });

        if (!resume) {
            return res.status(404).json({ error: true, message: "Resume not found" });
        }

        return res.status(200).json({
            error: false,
            message: "Resume updated successfully",
            resume,
        });
    } catch (error) {
        console.error("Error updating resume:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred while updating the resume",
            errorDetails: error.message,
        });
    }
});


// get  resume
app.get("/get-resumes", authenticateToken, async (req, res) => {
    try {
        const resumes = await resumeModel.find({ userId: req.user.id }); // Get resumes for the authenticated user
        return res.status(200).json({
            error: false,
            resumes,
        });
    } catch (error) {
        console.error("Error fetching resumes:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred while fetching resumes",
            errorDetails: error.message,
        });
    }
});

// get all resumes == public route
app.get("/get-all-resumes", authenticateToken, async (req, res) => {
    try {
        // Fetch all resumes without filtering by userId
        const resumes = await resumeModel.find();
        return res.status(200).json({
            error: false,
            resumes,
        });
    } catch (error) {
        console.error("Error fetching resumes:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred while fetching resumes",
            errorDetails: error.message,
        });
    }
});

// delete resume based on user role if manager = can delete every / employer = can delete only thier resume
app.delete("/delete-resume/:resumeId", authenticateToken, async (req, res) => {
    try {
        const { resumeId } = req.params;

        
        let filter;
        if (req.user.role === 'manager') {
            // managers delete any resume
            filter = { _id: resumeId };
        } else {
            // employer only delete their  resume
            filter = { _id: resumeId, userId: req.user.id };
        }

        const resume = await resumeModel.findOneAndDelete(filter);

        if (!resume) {
            return res.status(404).json({ error: true, message: "Resume not found" });
        }

        return res.status(200).json({
            error: false,
            message: "Resume deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting resume:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred while deleting the resume",
            errorDetails: error.message,
        });
    }
});





app.listen(8000);

module.exports = app;