const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { notifyUser, notifyAdmins } = require('../utils/notificationService');

// Route to add a comment
router.post('/deals/:dealId/comments', async (req, res) => {
    try {
        const { dealId } = req.params;
        const { comment, userId, user_name, user_role } = req.body;

        if (!comment || !userId) {
            return res.status(400).json({ error: 'Comment and user ID are required' });
        }

        const comment_id = uuidv4();

        const query = 'INSERT INTO comments (comment_id, deal_id, comment, user_id, user_name, user_role) VALUES (?, ?, ?, ?, ?, ?)';
        await db.query(query, [comment_id, dealId, comment, userId, user_name || 'Team Member', user_role || 'member']);

        // Record activity log
        try {
            await db.query(
                "INSERT INTO activities (deal_id, user_id, activity_type, details) VALUES (?, ?, ?, ?)",
                [dealId, userId, "comment", `User ${user_name || userId} posted comment: "${comment.substring(0, 100)}"`]
            );
        } catch (actErr) {
            console.warn('[COMMENT ACTIVITY LOG ERROR]', actErr.message);
        }

        // Fetch deal details for rich notification
        try {
            const [deals] = await db.query(
                'SELECT deal_name, deal_organization, assign_to FROM deals WHERE deal_id = ? LIMIT 1',
                [dealId]
            );

            const deal = deals[0] || {};
            const dealTitle = deal.deal_organization || deal.deal_name || 'Lead';
            const authorName = user_name || 'Team Member';
            const shortComment = comment.length > 80 ? comment.substring(0, 77) + '...' : comment;

            // Notify assigned user if commenter is not the assignee
            if (deal.assign_to && String(deal.assign_to) !== String(userId)) {
                notifyUser({
                    userId: deal.assign_to,
                    title: `New Comment on ${dealTitle}`,
                    message: `${authorName} commented: "${shortComment}"`,
                    type: 'comment',
                    entityType: 'deal',
                    entityId: dealId,
                    io: req.app.get('io')
                }).catch(e => console.warn('Comment notif error:', e.message));
            }

            // Notify admins (excluding author)
            notifyAdmins({
                title: `New Comment on ${dealTitle}`,
                message: `${authorName} commented: "${shortComment}"`,
                type: 'comment',
                entityType: 'deal',
                entityId: dealId,
                io: req.app.get('io'),
                excludeUserId: userId
            }).catch(e => console.warn('Admin comment notif error:', e.message));

        } catch (notifErr) {
            console.warn('[COMMENT NOTIFY ERROR]', notifErr.message);
        }

        // Return the new comment
        const newComment = {
            comment_id,
            deal_id: dealId,
            comment,
            user_id: userId,
            user_name: user_name || 'Team Member',
            user_role: user_role || 'member',
            created_at: new Date().toISOString()
        };

        return res.status(201).json(newComment);
    } catch (err) {
        console.error('Error adding comment:', err);
        return res.status(500).json({ error: 'Database error while saving comment' });
    }
});

// Route to get comments for a specific deal
router.get('/deals/:dealId/comments', async (req, res) => {
    try {
        const { dealId } = req.params;
        const query = 'SELECT * FROM comments WHERE deal_id = ? ORDER BY created_at DESC';
        const [results] = await db.query(query, [dealId]);
        return res.status(200).json(results || []);
    } catch (err) {
        console.error('Error retrieving comments:', err);
        return res.status(500).json({ error: 'Database error while fetching comments' });
    }
});

// Route to delete a comment
router.delete('/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const query = 'DELETE FROM comments WHERE comment_id = ?';
        const [results] = await db.query(query, [commentId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        return res.status(204).send();
    } catch (err) {
        console.error('Error deleting comment:', err);
        return res.status(500).json({ error: 'Database error while deleting comment' });
    }
});

module.exports = router;