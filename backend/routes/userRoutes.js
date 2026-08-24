const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/users', (req, res) => {
    let sql = 'SELECT user_id, name, email FROM users WHERE role != ?';

    db.query(sql, ["admin"], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching deals', error: err });
        }
        res.status(200).json(results);
    });
});

// Get all deals for the user or admin
router.get('/deals', (req, res) => {
    const { userId, role } = req.query; // Fetch userId and role from query (admin/user)
    let sql;

    if (role === 'admin') {
        sql = 'SELECT * FROM deals'; // Admin can see all deals
    } else {
        sql = 'SELECT * FROM deals WHERE assigned_to = ?'; // User can see only their assigned deals
    }

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching deals', error: err });
        }
        res.status(200).json(results);
    });
});

// Admin assigns a deal to a user/coworker
router.post('/deals/assign', (req, res) => {
    const { dealId, assignedTo } = req.body;
    const sql = 'UPDATE deals SET assigned_to = ? WHERE deal_id = ?';

    db.query(sql, [assignedTo, dealId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error assigning deal', error: err });
        }
        res.status(200).json({ message: 'Deal assigned successfully' });
    });
});

// User moves a deal to the next stage (e.g., lost, won, etc.)
router.put('/deals/move', (req, res) => {
    const { dealId, stage } = req.body;
    const sql = 'UPDATE deals SET deal_stage = ? WHERE deal_id = ?';

    db.query(sql, [stage, dealId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating deal stage', error: err });
        }

        // Log activity for the stage change
        const activitySql = 'INSERT INTO activities (deal_id, activity_type, details) VALUES (?, ?, ?)';
        db.query(activitySql, [dealId, 'Stage Change', `Moved to ${stage}`], (activityErr) => {
            if (activityErr) {
                return res.status(500).json({ message: 'Error logging activity', error: activityErr });
            }
            res.status(200).json({ message: 'Deal stage updated successfully' });
        });
    });
});

// User/coworker adds a comment or logs a task (e.g., meeting, call, etc.)
router.post('/deals/comment', (req, res) => {
    const { dealId, comment, activityType, userId } = req.body;
    const sql = 'INSERT INTO activities (deal_id, activity_type, details, user_id) VALUES (?, ?, ?, ?)';

    db.query(sql, [dealId, activityType, comment, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error adding comment', error: err });
        }
        res.status(201).json({ message: 'Comment added successfully' });
    });
});

// Get deal activity log (comments, stage changes, etc.)
router.get('/deals/:id/activity', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM activities WHERE deal_id = ? ORDER BY created_at DESC';

    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching activity log', error: err });
        }
        res.status(200).json(results);
    });
});

module.exports = router;