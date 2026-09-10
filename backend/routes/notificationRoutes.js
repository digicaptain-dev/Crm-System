const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification center
 */

// =====================================================
// GET USER NOTIFICATIONS
// =====================================================
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.user;
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 30));
        const unreadOnly = req.query.unreadOnly === 'true';

        let sql = `
            SELECT id, notification_id, user_id, title, message, type, entity_type, entity_id, is_read, created_at 
            FROM notifications 
            WHERE user_id = ?
        `;
        const params = [String(user_id)];

        if (unreadOnly) {
            sql += ` AND is_read = 0`;
        }

        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(limit);

        const [rows] = await db.query(sql, params);

        // Get total unread count
        const [unreadResult] = await db.query(
            `SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0`,
            [String(user_id)]
        );

        return res.status(200).json({
            success: true,
            notifications: rows || [],
            unreadCount: Number(unreadResult[0]?.unreadCount || 0)
        });
    } catch (err) {
        console.error('[GET NOTIFICATIONS ERROR]', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications.'
        });
    }
});

// =====================================================
// MARK SINGLE NOTIFICATION AS READ
// =====================================================
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.user;
        const { id } = req.params;

        const isNumericId = /^\d+$/.test(String(id));
        if (isNumericId) {
            await db.query(
                `UPDATE notifications 
                 SET is_read = 1 
                 WHERE (id = ? OR notification_id = ?) AND user_id = ?`,
                [Number(id), String(id), String(user_id)]
            );
        } else {
            await db.query(
                `UPDATE notifications 
                 SET is_read = 1 
                 WHERE notification_id = ? AND user_id = ?`,
                [String(id), String(user_id)]
            );
        }

        const [unreadResult] = await db.query(
            `SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0`,
            [String(user_id)]
        );

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
            unreadCount: Number(unreadResult[0]?.unreadCount || 0)
        });
    } catch (err) {
        console.error('[MARK NOTIF READ ERROR]', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update notification.'
        });
    }
});

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================
router.put('/notifications/mark-all-read', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.user;

        await db.query(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
            [String(user_id)]
        );

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
            unreadCount: 0
        });
    } catch (err) {
        console.error('[MARK ALL READ ERROR]', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read.'
        });
    }
});

// =====================================================
// DELETE SINGLE NOTIFICATION
// =====================================================
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.user;
        const { id } = req.params;

        const isNumericId = /^\d+$/.test(String(id));
        if (isNumericId) {
            await db.query(
                `DELETE FROM notifications 
                 WHERE (id = ? OR notification_id = ?) AND user_id = ?`,
                [Number(id), String(id), String(user_id)]
            );
        } else {
            await db.query(
                `DELETE FROM notifications 
                 WHERE notification_id = ? AND user_id = ?`,
                [String(id), String(user_id)]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Notification deleted.'
        });
    } catch (err) {
        console.error('[DELETE NOTIF ERROR]', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete notification.'
        });
    }
});

// =====================================================
// CLEAR ALL NOTIFICATIONS
// =====================================================
router.delete('/notifications/clear-all', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.user;

        await db.query(
            `DELETE FROM notifications WHERE user_id = ?`,
            [String(user_id)]
        );

        return res.status(200).json({
            success: true,
            message: 'All notifications cleared.',
            unreadCount: 0
        });
    } catch (err) {
        console.error('[CLEAR NOTIFS ERROR]', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to clear notifications.'
        });
    }
});

module.exports = router;
