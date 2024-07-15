// multer2.js , this is used for ppf uploading
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid')

// Set up storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads/pfp')
    },
    filename: function (req, file, cb) {
        const uniquefilename=uuidv4();
        cb(null, uniquefilename+path.extname(file.originalname))
    }
})

// Initialize upload variable to handle single file field
const pfpupload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image'); // Assuming 'image' is the field name for profile picture

// Check file type function
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

module.exports = pfpupload;
