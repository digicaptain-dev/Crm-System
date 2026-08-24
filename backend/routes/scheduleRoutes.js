const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all schedules for a specific deal
router.get('/:dealId', (req, res) => {
    const { dealId } = req.params;
    const sql = 'SELECT * FROM schedules WHERE deal_id = ? ORDER BY start_time';
    db.query(sql, [dealId], (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.json(results);
    });
});

// Create a new schedule for a specific deal
router.post('/', (req, res) => {
    const { deal_id, title, description, start_time, end_time } = req.body;
    const sql = 'INSERT INTO schedules (deal_id, title, description, start_time, end_time) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [deal_id, title, description, start_time, end_time], (err, result) => {
        if (err) return res.status(500).send('Database error');
        res.status(201).json({ id: result.insertId, deal_id, title, description, start_time, end_time });
    });
});

// Delete a schedule
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM schedules WHERE id = ?';
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).send('Database error');
        res.status(200).send('Schedule deleted');
    });
});

module.exports = router;