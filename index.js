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
const authenticateToken = require("./utilities.js");
const upload = require("./uploqd.js");


// Middleware
app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);



// backend ready!!
// Routes

app.get("/", (req, res) => {
    res.json({ data: "Server is running on port 8000" });
});


// create a new user
app.post("/create-account", async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;


        if (!fullName || !email || !password) {
            return res.status(400).json({ error: true, message: "All fields are required" });
        }

        const isUserExist = await userModel.findOne({ email });
        if (isUserExist) {
            return res.status(400).json({ error: true, message: "User already exists" });
        }


        const user = new userModel({ fullName, email, password, role });
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
        });

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
// app.post("/add-resume", upload.single("image"), authenticateToken, async (req, res) => {
//     try {
//         const user = await userModel.findById(req.user.id);

//         // Only allow employers to add resumes
//         if (user.role !== 'employer') {
//             return res.status(403).json({ error: true, message: "Only employers can add resumes." });
//         }

//         const { fullName, description } = req.body;

//         if (!fullName || !description) {
//             return res.status(400).json({ error: true, message: "Full name and description are required." });
//         }

//         // Parse JSON fields
//         let experience = [], education = [], skills = [];
//         try {
//             experience = JSON.parse(req.body.experience || "[]");
//             education = JSON.parse(req.body.education || "[]");
//             skills = JSON.parse(req.body.skills || "[]");
//         } catch (jsonErr) {
//             return res.status(400).json({ error: true, message: "Invalid JSON in experience, education, or skills." });
//         }

//         // Image from Cloudinary
//         const img = req.file?.path;

//         const resume = new resumeModel({
//             fullName,
//             img,
//             description,
//             experience,
//             education,
//             skills,
//             userId: req.user.id,
//         });

//         await resume.save();

//         return res.status(201).json({
//             error: false,
//             message: "Resume created successfully",
//             resume,
//         });
//     } catch (error) {
//         console.error("Error adding resume:", error);
//         return res.status(500).json({
//             error: true,
//             message: "An error occurred while adding the resume",
//             errorDetails: error.message,
//         });
//     }
// });


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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
    });

    return res.status(200).json({
        error: false,
        user,
        token,
        message: "Login successful",
    });
});

// add resume based on user role if manager = can't add resume / employer = can add  resume for himself
app.post("/add-resume", authenticateToken, async (req, res) => {
    try {
        // Get the logged-in user's details from the database
        const user = await userModel.findById(req.user.id);
        // Only allow employers to add resumes
        if (user.role !== 'employer') {
            return res.status(403).json({ error: true, message: "Only employers can add resumes." });
        }

        const { fullName, title, email, link, address, phone, languages, project, img, description, experience, education, skills } = req.body;
        const userId = req.user.id;

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
            title,
            email,
            link,
            address,
            phone,
            languages,
            project
        });

        await resume.save();
        return res.status(201).json({
            error: false,
            message: "Resume created successfully",
            resume,
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
        const { fullName, title, email, link, address, phone, languages, project, img, description, experience, education, skills } = req.body;


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
            title, 
            email, 
            link, 
            address, 
            phone, 
            languages, 
            project
        };

        let resume;

        if (req.user.role !== 'manager') {
            // manager edite any resume
            isUserResumeExist = await resumeModel.exists(
                { _id: resumeId, userId: req.user.id },
            );
            if (!isUserResumeExist) {
                return res.status(403).json({ error: true, message: "You can't edite this resume!" });
            }
        }

        resume = await resumeModel.findByIdAndUpdate(resumeId, { $set: updateData }, { new: true });


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
// app.put("/edit-resume/:resumeId", upload.single("image"), authenticateToken, async (req, res) => {
//     try {
//         const { resumeId } = req.params;
//         const { fullName, description } = req.body;

//         if (!fullName || !description) {
//             return res.status(400).json({ error: true, message: "Full name and description are required." });
//         }

//         // Parse JSON fields safely
//         let experience = [], education = [], skills = [];
//         try {
//             experience = JSON.parse(req.body.experience || "[]");
//             education = JSON.parse(req.body.education || "[]");
//             skills = JSON.parse(req.body.skills || "[]");
//         } catch (jsonErr) {
//             return res.status(400).json({ error: true, message: "Invalid JSON in experience, education, or skills." });
//         }

//         // Get the existing resume
//         const existingResume = await resumeModel.findById(resumeId);
//         if (!existingResume) {
//             return res.status(404).json({ error: true, message: "Resume not found." });
//         }

//         // Permission check: non-managers can only edit their own resumes
//         if (req.user.role !== 'manager' && existingResume.userId.toString() !== req.user.id) {
//             return res.status(403).json({ error: true, message: "You can't edit this resume." });
//         }

//         // Prepare update data
//         const updateData = {
//             fullName,
//             description,
//             experience,
//             education,
//             skills,
//             img: existingResume.img, // start with old image
//         };

//         // If new image is uploaded, replace it
//         if (req.file && req.file.path) {
//             updateData.img = req.file.path;
//         }

//         // Update the resume
//         const updatedResume = await resumeModel.findByIdAndUpdate(resumeId, { $set: updateData }, { new: true });

//         return res.status(200).json({
//             error: false,
//             message: "Resume updated successfully",
//             resume: updatedResume,
//         });
//     } catch (error) {
//         console.error("Error updating resume:", error);
//         return res.status(500).json({
//             error: true,
//             message: "An error occurred while updating the resume",
//             errorDetails: error.message,
//         });
//     }
// });



// get  resume !!!
app.get("/get-resumes", authenticateToken, async (req, res) => {
    try {
        const resumes = await resumeModel.find({ userId: req.user.id }); // Get resumes for the  user
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
        const currentUserId = req.user.id; // get the current user's ID
        return res.status(200).json({
            error: false,
            resumes,
            currentUserId,
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

// get user
app.get("/get-user", authenticateToken, async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: true, message: "User not found" });
        }
        return res.status(200).json({
            //  error: false,
            user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred while fetching the user",
            errorDetails: error.message,
        });
    }
});

// logout user
app.get("/logout", authenticateToken, async (req, res) => {
    try {
        // Invalidate the token by simply not sending it back to the client
        return res.status(200).json({
            error: false,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Error logging out:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred while logging out",
            errorDetails: error.message,
        });
    }
});

// get resume Page!
app.set('view engine',"ejs")

app.get('/resume/:id', async (req,res)=>{
    try {
        const {id} = req.params;
        console.log(id);
        const resume = await resumeModel.find({ userId: id }); // Get resumes for the  user
        if (!resume) {
            return res.status(404).send("Resume not found");
        }

        // res.render('resume', { resume });
        return res.status(200).json({resume});
        // res.render('resume');
    } catch (error) {
        console.error("Error fetching resume:", error);
        res.status(500).send("Server error");
    }

})


app.listen(8000);

module.exports = app;