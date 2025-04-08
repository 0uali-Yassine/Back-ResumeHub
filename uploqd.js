const multer = require('multer');
const { storage } = require('./cloudinary');
const upload = multer({ storage });
module.exports = upload;