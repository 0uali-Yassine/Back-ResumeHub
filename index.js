// Import required modules
const express = require('express');
const cors = require('cors');
const app = express();


// Middleware
app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

app.get("/", (req, res) => {
    res.json({ data: "Server is running on port 8000"});
});


app.listen(8000);

module.exports = app;