const express = require('express');
const path = require('path');
const router = express.Router();

// Route to serve an image from a specific folder based on the filename
router.get('/:filename', (req, res) => {
    const { filename } = req.params;

    // Define the folder where images are stored
    const imageDirectory = path.join(__dirname, '../uploads/conversations');

    // Construct the full path of the image
    const imagePath = path.join(imageDirectory, filename);

    // Check if the file exists and serve it
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error('Error serving image:', err);
            return res.status(404).json({ message: 'Image not found' });
        }
    });
});

module.exports = router;