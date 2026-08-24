const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const router = express.Router();

// Set up multer to store uploaded images in the 'conversations' folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/conversations'); // Directory for conversation images
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Rename the file with a unique name
    }
});

const upload = multer({ storage: storage });

// Route to handle both text and image conversation messages
router.post('/message', upload.single('image'), (req, res) => {
    const { deal_id, user_id, message } = req.body;
    const imageName = req.file ? req.file.filename : null; // Get the uploaded image name if provided

    if (!deal_id || !user_id || (!message && !imageName)) {
        return res.status(400).json({ message: 'Deal ID, User ID, and either a message or image are required' });
    }

    // Insert the conversation message into the database
    const query = 'INSERT INTO deal_conversations (deal_id, user_id, message, image_name) VALUES (?, ?, ?, ?)';
    db.query(query, [deal_id, user_id, message || '', imageName], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(200).json({
            message: 'Conversation message uploaded successfully',
            deal_id: deal_id,
            user_id: user_id,
            image_name: imageName || null,
            text_message: message || null
        });
    });
});

// Route to get all conversation messages for a specific deal
router.get('/message/:dealId', (req, res) => {
    const dealId = req.params.dealId;

    // Query to fetch all messages for a specific deal
    const query = 'SELECT * FROM deal_conversations WHERE deal_id = ? ORDER BY created_at DESC';
    db.query(query, [dealId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(200).json(results);
    });
});

module.exports = router;