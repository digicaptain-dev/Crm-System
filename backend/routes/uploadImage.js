const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost', // your MySQL host
    user: 'root', // your MySQL username
    password: '', // your MySQL password
    database: 'your_database_name' // your MySQL database name
});

// Set up multer to store uploaded images in the 'notes' folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/notes'); // upload directory for notes images
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Rename the file with a unique name
    }
});

const upload = multer({ storage: storage });

// Route to upload image and update image name in MySQL DB
router.post('/upload/image', upload.single('image'), (req, res) => {
    const noteId = req.body.deal_id; // Assuming you're passing the note ID in the form data
    const imageName = req.file.filename;

    if (!noteId) {
        return res.status(400).json({ message: 'Note ID is required' });
    }

    // Update the database with the image name for the note
    const query = 'UPDATE notes SET image_name = ? WHERE note_id = ?';
    db.query(query, [imageName, deal_id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(200).json({
            message: 'Image uploaded and note updated successfully',
            image_name: imageName,
            note_id: noteId
        });
    });
});

// Route to get image by note_id and resolution
router.get('/image/:noteId', (req, res) => {
    const noteId = req.params.noteId;
    const { r } = req.query; // Get the resolution parameter from query string (r=1, r=2, etc.)

    // Fetch the image name from the database based on note_id
    const query = 'SELECT image_name FROM notes WHERE note_id = ?';
    db.query(query, [noteId], async(err, result) => {
        if (err || result.length === 0) {
            return res.status(404).json({ message: 'Note not found or no image available' });
        }

        const imageName = result[0].image_name;
        const imagePath = path.join(__dirname, '../uploads/notes', imageName);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const requestedResolution = parseInt(r, 10) || 7;

        // Define different resolution sizes
        const resolutions = {
            1: { width: 100 }, // Low resolution
            2: { width: 300 }, // Medium resolution
            7: 'original' // Original resolution (for r = 7 or above)
        };

        const resizeOptions = resolutions[requestedResolution] || resolutions[7];

        try {
            if (resizeOptions === 'original') {
                // Return original image
                return res.sendFile(imagePath);
            }

            // Resize the image using sharp for the given resolution
            const resizedImageBuffer = await sharp(imagePath)
                .resize(resizeOptions.width)
                .toBuffer();

            // Set appropriate content type and send the resized image
            res.set('Content-Type', 'image/jpeg');
            return res.send(resizedImageBuffer);

        } catch (err) {
            return res.status(500).json({ message: 'Error processing the image', error: err.message });
        }
    });
});

module.exports = router;