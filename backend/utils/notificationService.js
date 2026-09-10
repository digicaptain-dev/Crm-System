const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates and delivers a single notification to a user.
 */
async function notifyUser({
    userId,
    title,
    message,
    type = 'general',
    entityType = null,
    entityId = null,
    io = null
}) {
    if (!userId || !title) return null;

    const notificationId = uuidv4();

    try {
        await db.query(
            `INSERT INTO notifications 
            (notification_id, user_id, title, message, type, entity_type, entity_id, is_read, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
            [notificationId, String(userId), String(title), String(message || ''), type, entityType, entityId ? String(entityId) : null]
        );

        const notificationObj = {
            notification_id: notificationId,
            user_id: String(userId),
            title,
            message,
            type,
            entity_type: entityType,
            entity_id: entityId,
            is_read: 0,
            created_at: new Date().toISOString()
        };

        // Real-time socket emission if io is available
        if (io) {
            try {
                io.emit('new_notification', notificationObj);
                io.to(`admin_${userId}`).emit('new_notification', notificationObj);
                io.to(`user_${userId}`).emit('new_notification', notificationObj);
            } catch (sockErr) {
                console.warn('[NOTIF SOCKET WARN]', sockErr.message);
            }
        }

        return notificationObj;
    } catch (err) {
        console.error('[NOTIFY USER ERROR]', err.message);
        return null;
    }
}

/**
 * Creates notifications for multiple users simultaneously.
 */
async function notifyMultipleUsers({
    userIds = [],
    title,
    message,
    type = 'general',
    entityType = null,
    entityId = null,
    io = null
}) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];

    const results = [];
    for (const uid of userIds) {
        if (uid) {
            const res = await notifyUser({
                userId: uid,
                title,
                message,
                type,
                entityType,
                entityId,
                io
            });
            if (res) results.push(res);
        }
    }
    return results;
}

/**
 * Sends notification to all admin users (optionally excluding a user).
 */
async function notifyAdmins({
    title,
    message,
    type = 'general',
    entityType = null,
    entityId = null,
    io = null,
    excludeUserId = null
}) {
    try {
        const [admins] = await db.query(
            `SELECT user_id FROM users WHERE LOWER(role) = 'admin'`
        );

        const adminIds = admins
            .map(a => a.user_id)
            .filter(id => id && String(id) !== String(excludeUserId));

        return await notifyMultipleUsers({
            userIds: adminIds,
            title,
            message,
            type,
            entityType,
            entityId,
            io
        });
    } catch (err) {
        console.error('[NOTIFY ADMINS ERROR]', err.message);
        return [];
    }
}

module.exports = {
    notifyUser,
    notifyMultipleUsers,
    notifyAdmins
};
