const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all stages
router.get('/stages', async (req, res) => {
    const query = 'SELECT * FROM stages ORDER BY stage_order ASC';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get a specific stage by ID
router.get('/stages/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM stages WHERE stage_id = ?';

    try {
        const [result] = await db.query(query, [id]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Stage not found' });
        }
        res.json(result[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Create a new stage
router.post('/stages', async (req, res) => {
    const { stage_name, stage_order, description, pipeline_id } = req.body;
    const query = 'INSERT INTO stages (stage_name, stage_order, description, pipeline_id) VALUES (?, ?, ?, ?)';

    try {
        const [result] = await db.query(query, [stage_name, stage_order, description, pipeline_id]);
        res.status(201).json({ message: 'Stage created successfully', stage_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Update a stage by ID
router.put('/stages/:id', async (req, res) => {
    const { id } = req.params;
    const { stage_name, stage_order, description } = req.body;
    const query = 'UPDATE stages SET stage_name = ?, stage_order = ?, description = ? WHERE stage_id = ?';

    try {
        const [result] = await db.query(query, [stage_name, stage_order, description, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Stage not found' });
        }

        res.json({ message: 'Stage updated successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Delete a stage by ID
router.delete('/stages/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM stages WHERE stage_id = ?';

    try {
        const [result] = await db.query(query, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Stage not found' });
        }
        res.json({ message: 'Stage deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get all stages for a specific pipeline (Optional)
router.get('/stages/pipeline/:pipelineId', async (req, res) => {
    const { pipelineId } = req.params;
    const query = 'SELECT * FROM stages WHERE pipeline_id = ? ORDER BY stage_order ASC';

    try {
        const [results] = await db.query(query, [pipelineId]);
        res.json(results);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;