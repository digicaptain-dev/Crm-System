const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all stages
router.get('/stages', (req, res) => {
    const query = 'SELECT * FROM stages';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get a specific stage by ID
router.get('/stages/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM stages WHERE stage_id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Stage not found' });
        }
        res.json(result[0]);
    });
});

// Create a new stage
router.post('/stages', (req, res) => {
    const { stage_name, stage_order, description, pipeline_id } = req.body;
    const query = 'INSERT INTO stages (stage_name, stage_order, description, pipeline_id) VALUES (?, ?, ?, ?)';

    db.query(query, [stage_name, stage_order, description, pipeline_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Stage created successfully', stage_id: result.insertId });
    });
});

// Update a stage by ID
router.put('/stages/:id', (req, res) => {
    const { id } = req.params;
    const { stage_name, stage_order, description } = req.body;
    const query = 'UPDATE stages SET stage_name = ?, stage_order = ?, description = ? WHERE stage_id = ?';

    db.query(query, [stage_name, stage_order, description, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Stage not found' });
        }

        res.json({ message: 'Stage updated successfully' });
    });
});

// Delete a stage by ID
router.delete('/stages/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM stages WHERE stage_id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Stage not found' });
        }
        res.json({ message: 'Stage deleted successfully' });
    });
});

// Get all stages for a specific pipeline (Optional)
router.get('/stages/pipeline/:pipelineId', (req, res) => {
    const { pipelineId } = req.params;
    const query = 'SELECT * FROM stages WHERE pipeline_id = ?';

    db.query(query, [pipelineId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

module.exports = router;