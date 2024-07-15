const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// this multer3.js is used for banner editing

// Set up storage engine for banner image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads/banner');
    },
    filename: function (req, file, cb) {
        const uniqueFilename = uuidv4();
        cb(null, uniqueFilename + path.extname(file.originalname));
    }
});

// Initialize upload variable to handle banner image field
const bannerUpload = multer({
    storage: storage,
    limits: { fileSize: 500000000 }, // 50MB limit (adjust as needed)
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('banner'); // Assuming 'banner' is the field name for banner image

// Check banner file type function
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only (JPEG, JPG, PNG, GIF)!');
    }
}

module.exports = bannerUpload;
