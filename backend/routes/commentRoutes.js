const express = require('express');
const mysql = require('mysql');
const db = require('../db');
const { v4 } = require('uuid');
const sendNotificationToAdmin = require('../middleware/notification');
const router = express.Router();

// Route to add a comment
router.post('/deals/:dealId/comments', (req, res, next) => {
    sendNotificationToAdmin(req.app.get('io'))(req, res, next);
}, (req, res) => {
    const { dealId } = req.params;
    const { comment, userId, user_name, user_role } = req.body; // Expecting userId from the request body

    const comment_id = v4();

    if (!comment || !userId) {
        return res.status(400).json({ error: 'Comment and user ID are required' });
    }

    const query = 'INSERT INTO comments (comment_id, deal_id, comment, user_id, user_name, user_role) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [comment_id, dealId, comment, userId, user_name, user_role], (err, results) => {
        if (err) {
            console.error('Error adding comment:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        db.query("INSERT INTO activities (deal_id, user_id, activity_type, details) VALUES (?, ?, ?, ?)", [dealId, userId, "comment", `User Post new comment on ${new Date().toUTCString()} by User Id: ${userId} on Deal Id ${dealId}`], () => {
            console.info(`COMMENT ACTIVITY RECORDED [UID: ${userId}]`)
        });

        // Return the new comment
        const newComment = { comment_id: results.insertId, deal_id: dealId, comment, user_id: userId };
        res.status(201).json(newComment);
    });
});

// Route to get comments for a specific deal
router.get('/deals/:dealId/comments', (req, res) => {
    const { dealId } = req.params;

    const query = 'SELECT * FROM comments WHERE deal_id = ? ORDER BY created_at DESC';
    db.query(query, [dealId], (err, results) => {
        if (err) {
            console.error('Error retrieving comments:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
});

// Optional: Route to delete a comment
router.delete('/comments/:commentId', (req, res) => {
    const { commentId } = req.params;

    const query = 'DELETE FROM comments WHERE comment_id = ?';
    db.query(query, [commentId], (err, results) => {
        if (err) {
            console.error('Error deleting comment:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        res.status(204).send(); // No content to return
    });
});

module.exports = router;